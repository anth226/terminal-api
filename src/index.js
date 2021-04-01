import "dotenv/config";
import express, { response } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import axios from "axios";
import intrinioSDK from "intrinio-sdk";
import * as getCompanyData from "./intrinio/get_company_data";
import * as getNews from "./intrinio/get_news";
import * as getIndexData from "./intrinio/get_index_data";
import * as getSecurityData from "./intrinio/get_security_data";
import * as lookupCompany from "./intrinio/get_company_fundamentals";
import * as screener from "./intrinio/screener";
import * as analystRatings from "./intrinio/get_analyst_ratings";
import * as etfs from "./controllers/etfs";
// import * as gainersLosers from './polygon/get_gainers_losers';
import * as gainersLosers from "./scrape/get_gainers_losers";
import * as trending from "./scrape/yahoo_trending";
import * as forexPairs from "./polygon/get_forex_last_quote";
import * as newsHelper from "./newsApi/newsHelper";
import * as stocksNews from "./newsApi/stocksApi";
import * as finviz from "./scrape/finviz";
import * as futures from "./scrape/finviz_futures";
import * as cnn from "./scrape/cnn";
import * as finvizForex from "./scrape/finviz_forex";
import * as cnnSectors from "./scrape/cnn_sectors";
import * as nerdwallet from "./scrape/nerdwallet";
import * as finvizGroups from "./scrape/finviz_groups";
import * as nerdwalletSavings from "./scrape/nerdwallet_savings";
import * as portfolios from "./controllers/portfolios";
import * as hooks from "./controllers/hooks";
import * as news from "./controllers/news";
import * as naviga from "./controllers/naviga";
import * as performance from "./controllers/performance";
import * as widgets from "./controllers/widgets";
import * as dashboard from "./controllers/dashboard";
import * as securities from "./controllers/securities";
import * as pages from "./controllers/pages";
import { questionnaireSubmission } from "./controllers/questionnaire";
import * as holdings from "./controllers/holdings";

import * as darkpool from "./controllers/darkpool";
import * as quodd from "./controllers/quodd";
import * as bots from "./controllers/bots";
import * as edgar from "./controllers/edgar";
import * as search from "./controllers/search";
import * as institutions from "./controllers/institutions";
import * as titans from "./controllers/titans";
import * as trades from "./controllers/trades";
import * as alerts from "./controllers/alerts";
import * as mutual_funds from "./controllers/mutual-funds";
import * as companies from "./controllers/companies";
import * as zacks from "./controllers/zacks";
import * as cannon from "./controllers/cannon";
import * as klaviyo from "./controllers/klaviyo";
import * as watchlist from "./controllers/watchlist";
import * as sendEmail from "./sendEmail";
import bodyParser from "body-parser";
import winston, { log } from "winston";
import Stripe from "stripe";
const multer = require("multer");
const AWS = require("aws-sdk");
import { v4 as uuidv4 } from "uuid";
import { isEmpty } from "lodash";
import moment from "moment";

import { isAuthorized } from "./middleware/authorized";
import { db, admin } from "./services/firebase";
import {
  stripe,
  endpointSecret,
  couponId,
  couponIdFree,
  planId,
  yearlyPlanId,
} from "./services/stripe";
import { listAllUsers, updateUserAccess} from "./controllers/user";
import Shopify from "shopify-api-node";

const shopify = new Shopify({
  shopName: "portfolio-insider",
  apiKey: "26774218d929d0a2e7ad7d46a4cfde09",
  password: "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",
});

const pino = require('express-pino-logger')();
const client = require('twilio')(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

var crypto = require('crypto');
var bugsnag = require("@bugsnag/js");
var bugsnagExpress = require("@bugsnag/plugin-express");

var bugsnagClient = bugsnag({
  apiKey: process.env.BUGSNAG_KEY,
  otherOption: process.env.RELEASE_STAGE,
});

bugsnagClient.use(bugsnagExpress);

var middleware = bugsnagClient.getPlugin("express");
/*
~~~~~~Configuration Stuff~~~~~~
*/

// Configure Logger
const logger = winston.createLogger({
  transports: [
    new winston.transports.Console({
      level: "info",
      format: winston.format.simple(),
    }),
    //new winston.transports.File({ filename: 'combined.log' })
    //new winston.transports.File({ filename: 'error.log', level: 'error' }),
  ],
});

// init intrinio
intrinioSDK.ApiClient.instance.authentications["ApiKeyAuth"].apiKey =
  process.env.INTRINIO_API_KEY;

intrinioSDK.ApiClient.instance.basePath = `${process.env.INTRINIO_BASE_PATH}`;

const companyAPI = new intrinioSDK.CompanyApi();
const securityAPI = new intrinioSDK.SecurityApi();
const indexAPI = new intrinioSDK.IndexApi();

// configure secure cookies
const expiresIn = 60 * 60 * 24 * 5 * 1000;
const cookieParams = {
  maxAge: expiresIn,
  httpOnly: true, // dont let browser javascript access cookie ever
  ephemeral: true, // delete this cookie while browser close
};
//secure: true, // only use cookie over https

const apiURL =
  process.env.IS_DEV == "true"
    ? `${process.env.FRONTEND_URL}:${process.env.FRONTEND_PORT}`
    : `${process.env.FRONTEND_ENDPOINT}`;

const apiProtocol = process.env.IS_DEV == "true" ? "http://" : "https://";

// set up middlewares
const app = express();

// configure CORS
var corsOptions = {
  origin: [`${apiProtocol}${apiURL}`, `${apiProtocol}www.${apiURL}`],
  optionsSuccessStatus: 200, // some legacy browsers (IE11, various SmartTVs) choke on 204
  credentials: true,
};
app.use(cors(corsOptions));

app.use(cookieParser());

// var rawBodySaver = function (req, res, buf, encoding) {
//   if (buf && buf.length) {
//     req.rawBody = buf.toString(encoding || "utf8");
//   }
// };

// app.use(bodyParser.json({ verify: rawBodySaver }));
// app.use(bodyParser.urlencoded({ verify: rawBodySaver, extended: true }));
// app.use(bodyParser.raw({ verify: rawBodySaver, type: "*/*" }));
// app.use(express.json());

app.use((req, res, next) => {
  if (req.originalUrl === "/hooks") {
    next();
  } else {
    bodyParser.raw({ type: "application/json" });
    bodyParser.json()(req, res, next);
  }
});

app.use(middleware.requestHandler);


app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(pino);

/*
~~~~~~Utils~~~~~~
*/

function handleStripeError(err) {
  console.log("Stripe Error Caught: ", err.type);
  console.log("--- Full Error ---");
  console.log(err);

  let errMsg = "An unexpected error ocurred";
  switch (err.type) {
    case "StripeCardError":
      // A declined card error
      errMsg = err.message;
      break;
    case "StripeRateLimitError":
      // Too many requests made to the API too quickly
      errMsg = "Too many requests at the moment, please try again later.";
      break;
    case "StripeInvalidRequestError":
      // Invalid parameters were supplied to Stripe's API
      break;
    case "StripeAPIError":
      // An error occurred internally with Stripe's API
      break;
    case "StripeConnectionError":
      // Some kind of error occurred during the HTTPS communication
      break;
    case "StripeAuthenticationError":
      // You probably used an incorrect API key
      break;
    default:
      // Handle any other types of unexpected errors
      break;
  }

  return errMsg;
}

/*
~~~~~~Middlewares~~~~~~
*/

function checkAuth(req, res, next) {
  if (
    req.cookies.access_token &&
    req.cookies.access_token.split(" ")[0] === "Bearer"
  ) {
    // Handle token presented as a Bearer token in the Authorization header
    const session = req.cookies.access_token.split(" ")[1];
    admin
      .auth()
      .verifySessionCookie(session, true)
      .then((decodedClaims) => {
        req.terminal_app = { claims: decodedClaims };
        next();
      })
      .catch((error) => {
        // Session is unavailable or invalid. Force user to login.
        res.status(403).send("Unauthorized");
      });
  } else {
    // Bearer cookie doesnt exist
    res.status(403).send("Unauthorized");
  }
}

/*
~~~~~~Routes~~~~~~
*/

//Request URL: https://terminal.retirementinsider.com/success?session_id=cs_test_rVIlOBqZ6XvLsDFCCI8MVveNLuFCpJUqsH1vKfIFWLQSl9nPcILCUM85

app.post(
  "/hooks",
  bodyParser.raw({ type: "application/json" }),
  async (req, res) => {
    const sig = req.headers["stripe-signature"];

    let evt;

    try {
      evt = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
      // evt = req.body;
    } catch (err) {
      logger.error("Stripe Checkout Webhook Error (constructEvent): ", err);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    if (evt.type === "checkout.session.completed") {
      logger.info("-- checkout session completed --", evt.data);

      if (evt.data.object.mode == "subscription") {
        console.log("hit subscription type checkout session", evt.data.object);

        const subscriptionId = evt.data.object.subscription;
        const customerId = evt.data.object.customer;
        const userId = evt.data.object.client_reference_id;
        // const email = evt.data.object.customer_email;

        // FIREBASE + FIRESTORE
        try {
          // Add user data to db
          let docRef = db.collection("users").doc(userId);
          let setUser = await docRef.set(
            {
              userId: userId,
              customerId: customerId,
              subscriptionId: subscriptionId,
              // email: email
            },
            { merge: true }
          );

          // Set custom auth claims with Firebase
          await admin.auth().setCustomUserClaims(userId, {
            customer_id: customerId,
            subscription_id: subscriptionId,
          });

          sendEmail.sendSignupEmail(email);
          await klaviyo.subscribeToList(email);
        } catch (err) {
          // error with firebase and firestore
          logger.error("Stripe Checkout Webhook Error: ", err);
          return res.status(400).send(`Webhook Error: ${err.message}`);
        }
      } else if (evt.data.object.mode == "setup") {
        console.log("hit setup type checkout session");
        try {
          const setupIntentId = evt.data.object.setup_intent;

          // Retrieve the SetupIntent
          const setupIntent = await stripe.setupIntents.retrieve(setupIntentId);

          const paymentMethodId = setupIntent.payment_method;
          const customerId = setupIntent.metadata.customer_id;
          const subscriptionId = setupIntent.metadata.subscription_id;

          // Attach the PaymentMethod to the customer
          const paymentMethod = await stripe.paymentMethods.attach(
            paymentMethodId,
            { customer: customerId }
          );

          //Set a default payment method for future invoices
          const customer = await stripe.customers.update(customerId, {
            invoice_settings: { default_payment_method: paymentMethodId },
          });

          //Set default_payment_method on the Subscription
          const subscription = await stripe.subscriptions.update(
            subscriptionId,
            {
              default_payment_method: paymentMethodId,
            }
          );
        } catch (err) {
          logger.error("Stripe Checkout SetupIntent Webhook Error: ", err);
          return res.status(400).send(`Webhook Error: ${err.message}`);
        }
      }
    }

    if (evt.type === "charge.succeeded") {
      if (
        evt.data.object.amount_captured == 49400 ||
        evt.data.object.amount_captured == 16400
      ) {
        let { customer } = evt.data.object.source;

        let response = await stripe.subscriptions.list({
          customer,
        });

        let { data } = response;

        let subscriptions = data;

        console.log("-- subscriptions --");
        console.log(subscriptions);

        let trial_seconds =
          evt.data.object.amount_captured == 49400
            ? 60 * 60 * 24 * 365
            : 60 * 60 * 24 * 182;
        let subscriptionId = subscriptions[0].id;

        console.log(subscriptionId);

        response = await stripe.subscriptions.update(subscriptionId, {
          trial_end: Math.floor(new Date().getTime() / 1000) + trial_seconds,
        });

        console.log("-- subscription update --");
        console.log(response);
      }
    }

    if (evt.type === "customer.subscription.deleted") {
      const userRef = await db
        .collection("users")
        .where("customerId", "==", evt.data.object.customer)
        .get();

      if (!userRef.empty) {
        userRef.forEach(async (doc) => {
          const docRef = db.collection("users").doc(doc.id);

          await docRef.update(
            {
              subscriptionStatus: evt.data.object.status,
            },
            { merge: true }
          );
        });
      }
    }

    res.json({ success: true });
  }
);

app.post("/checkout", async (req, res) => {
  let plan = req.body.plan;
  plan = plan === 2 ? process.env.STRIPE_COUPON_ID_FREE : couponId;

  const userId = req.body.user_id;
  if (!userId) {
    res.status(403).send("Unauthorized");
    return;
  }

  const email = req.body.email;
  if (!email) {
    res.json({
      error_code: "USER_EMAIL_INVALID",
      message: "please enter your email",
    });
    return;
  }

  let phone = req.body.phone;
  let firstName = req.body.firstName;
  let lastName = req.body.lastName;

  if (!phone || !firstName || !lastName) {
    // trying to get user data from db
    let doc = await db.collection("users").doc(userId).get();
    if (doc.exists) {
      phone = doc.data().phoneNumber;
      firstName = doc.data().firstName;
      lastName = doc.data().lastName;
    }
  }

  if (!req.body.customer_id) {
    // create checkout session for new customer

    // get utm parameters
    let customerMetadata = {};
    if (req.body.utm_source && req.body.utm_source !== "null") {
      customerMetadata.utm_source = req.body.utm_source;
    }
    if (req.body.utm_campaign && req.body.utm_campaign !== "null") {
      customerMetadata.utm_campaign = req.body.utm_campaign;
    }
    if (req.body.utm_term && req.body.utm_term !== "null") {
      customerMetadata.utm_term = req.body.utm_term;
    }
    if (req.body.utm_content && req.body.utm_content !== "null") {
      customerMetadata.utm_content = req.body.utm_content;
    }

    const customer = await stripe.customers.create({
      email: email,
      phone: phone,
      name: firstName + " " + lastName,
      description: firstName + " " + lastName,
      metadata: customerMetadata,
    });

    const session = await stripe.checkout.sessions.create({
      customer: customer.id,
      client_reference_id: userId,
      payment_method_types: ["card"],
      subscription_data: {
        items: [
          {
            plan: planId,
          },
        ],
        trial_from_plan: true,
        coupon: plan,
      },
      success_url:
        apiProtocol + apiURL + "/success?session_id={CHECKOUT_SESSION_ID}",
      cancel_url: apiProtocol + apiURL,
    });
    res.json({ session: session });
  } else {
    console.log("update existing subscription!!!!!");
    //create checkout session for existing customer
    const session = await stripe.checkout.sessions.create({
      customer_email: email,
      client_reference_id: userId,
      payment_method_types: ["card"],
      mode: "setup",
      setup_intent_data: {
        metadata: {
          customer_id: req.body.customer_id,
          subscription_id: req.body.subscription_id,
        },
      },
      success_url: apiProtocol + apiURL + "/account?s=1",
      cancel_url: apiProtocol + apiURL,
    });
    res.json({ session: session });
  }
});

// index
app.get("/", async (req, res) => {
  res.send("hello");
});

app.post("/product-checkout", async (req, res) => {
  const body = req.body;
  const { data, token } = body;

  try {
    const customerData = {
      source: token,
      email: data.email,
    };
    const customer = await stripe.customers.create(customerData);

    const intentOptions = {
      amount: body.amount,
      currency: body.currency,
      customer: customer.id,
      setup_future_usage: "off_session",
    };

    const paymentIntent = await stripe.paymentIntents.create(intentOptions);

    const productVariantId = 37409762508998;

    const order = {
      line_items: [
        {
          variant_id: productVariantId,
          quantity: 1,
        },
      ],
      customer: {
        first_name: data.firstName,
        last_name: data.lastName,
        email: data.email,
      },
      billing_address: {
        first_name: data.firstName,
        last_name: data.lastName,
        address1: data.differentBilling
          ? data.billingAddress
          : data.shippingAddress,
        phone: data.phoneNumber,
        city: data.differentBilling ? data.billingCity : data.shippingCity,
        province: data.differentBilling
          ? data.billingRegion
          : data.shippingRegion,
        country: "United States",
        zip: data.differentBilling
          ? data.billingPostalCode
          : data.shippingPostalCode,
      },
      shipping_address: {
        first_name: data.firstName,
        last_name: data.lastName,
        address1: data.shippingAddress,
        phone: data.phoneNumber,
        city: data.shippingCity,
        province: data.shippingRegion,
        country: "United States",
        zip: data.shippingPostalCode,
      },
      email: data.email,
    };

    const orderData = await shopify.order.create(order);

    axios.post('https://graph.facebook.com/v9.0/'+process.env.FB_PIXEL_ID+'/events?access_token='+process.env.FB_PIXEL_KEY, {
      "data": [
        {
          "event_name": "Purchase",
          "event_time": Math.floor(Date.now() / 1000),
          "user_data": {
            "client_ip_address": req.connection.remoteAddress,
            "client_user_agent": req.get('User-Agent'),
            "em":crypto.createHash('sha256').update(data.email).digest('hex')
          },
          "custom_data": {
            "value": 1,
            "currency": "USD"
          }
        }
      ]
    }).then(function (response) {}).catch(function (error) {});

    res.json({ paymentIntent, order: orderData });
  } catch (err) {
    res.json(err);
  }
});

app.post("/upgrade-order", async (req, res) => {
  logger.info("/upgrade-order");

  const { customer, orderCustomer } = req.body;

  if (!customer) {
    res.status(400).send("Invalid customer id");
    return;
  }

  try {
    const intentOptions = {
      amount: 5700,
      currency: "USD",
      customer,
      setup_future_usage: "off_session",
      confirm: true
    };

    const paymentIntent = await stripe.paymentIntents.create(intentOptions);

    const orderCustomerObject = await shopify.customer.get(orderCustomer);

    const productVariantId = 37926110363846;

    const order = {
      line_items: [
        {
          variant_id: productVariantId,
          quantity: 1,
        },
      ],
      customer: {
        id: orderCustomer
      },
      shipping_address:orderCustomerObject.default_address
    };

    const orderData = await shopify.order.create(order);

    axios.post('https://graph.facebook.com/v9.0/'+process.env.FB_PIXEL_ID+'/events?access_token='+process.env.FB_PIXEL_KEY, {
      "data": [
        {
          "event_name": "Purchase",
          "event_time": Math.floor(Date.now() / 1000),
          "user_data": {
            "client_ip_address": req.connection.remoteAddress,
            "client_user_agent": req.get('User-Agent'),
            "em":crypto.createHash('sha256').update(orderData.contact_email).digest('hex')
          },
          "custom_data": {
            "value": 57,
            "currency": "USD"
          }
        }
      ]
    }).then(function (response) {}).catch(function (error) {});

    res.json({
      status: 'succeeded'
    });
  } catch (err) {
    const errMsg = handleStripeError(err);
    res.json({
      error_code: "UPGRADE_ORDER_ERROR",
      message: errMsg,
    });
  }
});

app.post("/product-checkout-paypal", async (req, res) => {
  const body = req.body;
  const { data } = body;

  try {
    const productVariantId = 37409762508998;

    const order = {
      line_items: [
        {
          variant_id: productVariantId,
          quantity: 1,
        },
      ],
      customer: {
        first_name: data.firstName,
        last_name: data.lastName,
        email: data.email,
      },
      billing_address: {
        first_name: data.firstName,
        last_name: data.lastName,
        address1: data.differentBilling
          ? data.billingAddress
          : data.shippingAddress,
        phone: data.phoneNumber,
        city: data.differentBilling ? data.billingCity : data.shippingCity,
        province: data.differentBilling
          ? data.billingRegion
          : data.shippingRegion,
        country: "United states",
        zip: data.differentBilling
          ? data.billingPostalCode
          : data.shippingPostalCode,
      },
      shipping_address: {
        first_name: data.firstName,
        last_name: data.lastName,
        address1: data.shippingAddress,
        phone: data.phoneNumber,
        city: data.shippingCity,
        province: data.shippingRegion,
        country: "United states",
        zip: data.shippingPostalCode,
      },
      email: data.email,
    };

    const orderData = await shopify.order.create(order);

    axios.post('https://graph.facebook.com/v9.0/'+process.env.FB_PIXEL_ID+'/events?access_token='+process.env.FB_PIXEL_KEY, {
      "data": [
        {
          "event_name": "Purchase",
          "event_time": Math.floor(Date.now() / 1000),
          "user_data": {
            "client_ip_address": req.connection.remoteAddress,
            "client_user_agent": req.get('User-Agent'),
            "em":crypto.createHash('sha256').update(data.email).digest('hex')
          },
          "custom_data": {
            "value": 1,
            "currency": "USD"
          }
        }
      ]
    }).then(function (response) {}).catch(function (error) {});

    res.json({ order: orderData });
  } catch (err) {
    res.json(err);
  }
});

app.post("/upgrade-order-paypal", async (req, res) => {
  const customer = req.body.customer;

  try {
    const orderCustomerObject = await shopify.customer.get(customer);

    const productVariantId = 37926110363846;

    const order = {
      line_items: [
        {
          variant_id: productVariantId,
          quantity: 1,
        },
      ],
      customer: {
        id: customer
      },
      shipping_address:orderCustomerObject.default_address
    };

    const orderData = await shopify.order.create(order);

    axios.post('https://graph.facebook.com/v9.0/'+process.env.FB_PIXEL_ID+'/events?access_token='+process.env.FB_PIXEL_KEY, {
      "data": [
        {
          "event_name": "Purchase",
          "event_time": Math.floor(Date.now() / 1000),
          "user_data": {
            "client_ip_address": req.connection.remoteAddress,
            "client_user_agent": req.get('User-Agent'),
            "em":crypto.createHash('sha256').update(orderData.contact_email).digest('hex')
          },
          "custom_data": {
            "value": 57,
            "currency": "USD"
          },
          "test_event_code":"TEST90643"
        }
      ]
    }).then(function (response) {}).catch(function (error) {});

    res.json({ order: orderData });
  } catch (err) {
    res.json(err);
  }
});

app.post("/signout", async (req, res) => {
  const sessionCookie = req.cookies.access_token || "";
  res.clearCookie("access_token");
  admin
    .auth()
    .verifySessionCookie(sessionCookie)
    .then((decodedClaims) => {
      return admin.auth().revokeRefreshTokens(decodedClaims.sub);
    })
    .then(() => {
      res.send("logged out");
    })
    .catch((error) => {
      res.send("logged out");
    });
});

// exchange firebase user token for session cookie
app.post("/authenticate", async (req, res) => {
  logger.info("/authenticate");

  // TODO: add a verified email check --
  // if(decodedToken.email_verified == false) {
  //    res.json({ status: "verify_email", message: "Please verify your email address: " + decodedToken.email });
  // wait until we are done with test accounts
  try {
    // get idtoken from req body
    const idToken = req.body.token.toString();

    console.log("idToken---", idToken);

    // verify id token
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    // check if decoded token is expired
    if (new Date().getTime() / 1000 - decodedToken.auth_time > 5 * 60) {
      throw {
        terminal_error: true,
        error_code: "SESSION_EXPIRED",
        message: "Your login session has expired, please try logging in again.",
      };
    }

    console.log("--- Decoded token on /authenticate ---");
    console.log(decodedToken);

    let customerId;
    let userData;
    if (decodedToken.customer_id) {
      // check if customer id is in decoded claims
      console.log("customer is in decoded claims!!!");
      console.log(decodedToken.customer_id);
      customerId = decodedToken.customer_id;

      let doc = await db.collection("users").doc(decodedToken.uid).get();
      userData = doc.data();

      if (userData.isAdmin) {
        await admin.auth().setCustomUserClaims(decodedToken.uid, {
          isAdmin: true,
          customer_id: customerId,
        });
      }
    } else {
      // if not pull from database
      let doc = await db.collection("users").doc(decodedToken.uid).get();
      console.log("USER DOC");
      console.log(doc);
      // if they dont exist in db, they didnt get thru payment step
      if (!doc.exists) {
        // this should redirect to payment page
        throw {
          terminal_error: true,
          error_code: "USER_NOT_FOUND",
          message: "Unable to verify your user record.",
        };
      }
      // found user in db, get data
      userData = doc.data();
      // retrieve customer data from stripe using customer id from firestore
      customerId = userData.customerId;
      // set claim in firestore auth
      await admin.auth().setCustomUserClaims(decodedToken.uid, {
        customer_id: customerId,
      });
    }
    if (!customerId) {
      // Customer ID not in decoded claims or firestore
      // this actually might be unnecessary code, impossible to hit?
      throw {
        terminal_error: true,
        error_code: "PAYMENT_INCOMPLETE",
        message: "Please complete your payment",
      };
    }

    // retrieve customer data from stripe using customer id from firestore
    const customer = await stripe.customers.retrieve(customerId);
    console.log("\nCUSTOMER OBJ\n");
    console.log(customer);
    console.log("\nSUBSCRIPTION\n");
    console.log(customer.subscriptions);
    console.log("\nEND\n");

    // temporarily ignore stripe check
    //TODO: Bring back stripe check after subscription

    // fetch active subscriptions
    // const response = await stripe.subscriptions.list({
    //   customer: customerId,
    // });

    // let { data } = response;

    // let subscriptions = data;

    // if (subscriptions.length < 1) {
    //   throw {
    //     terminal_error: true,
    //     error_code: "SUBSCRIPTION_CANCELED",
    //     message:
    //       "Your subscription has been canceled, please contact support to update your subscription. (Code 1)",
    //   };
    // }

    // // Set subscription to auto cancel if it has not been set yet for non prime users
    // if (subscriptions[0].cancel_at_period_end === false) {
    //   const updatedSubscription = await stripe.subscriptions.update(
    //     subscriptions[0].id,
    //     {
    //       cancel_at_period_end: true,
    //     }
    //   );
    //
    //   logger.info("---Updated Subscription---");
    //   subscriptions[0] = updatedSubscription;
    // }

    // Check if customer has paid for their subscription and is a non prime user
    // if (
    //   subscriptions[0].cancel_at_period_end &&
    //   Math.round(new Date().getTime() / 1000) > subscriptions[0].cancel_at &&
    //   userData.isPrime === false
    // ) {
    //   // Bounce to payment page for now
    //   // we may need to handle this diferently because the customer actually exists
    //   // update existing customers payment method and re-charge rather than sign up new customer
    //   //customer.subscriptions.data[0].id
    //   // if(customer.subscriptions.total_count > 0) {
    //   //   throw { terminal_error: true, error_code:"USER_PAYMENT_NEEDED", message: "Payment needed", customer_id: customerId, subscription_id: customer.subscriptions.data[0].id };
    //   // } else {
    //   //   throw { terminal_error: true, error_code:"NO_SUBSCRIPTION", message: "We found your customer record but not your subscription, please contact support." };
    //   // }
    //   throw {
    //     terminal_error: true,
    //     error_code: "SUBSCRIPTION_CANCELED",
    //     message:
    //       "Your subscription has been canceled, please contact support to update your subscription. (Code 2)",
    //   };
    // }

    // let subStatus = subscriptions[0].status;
    // if (userData.subscriptionStatus !== subStatus) {
    //   db.collection("users").doc(decodedToken.uid).update({
    //     subscriptionStatus: subscriptions[0].status,
    //   });
    // }

    // Finally, create a session cookie with firebase for this user
    const sessionCookie = await admin
      .auth()
      .createSessionCookie(idToken, { expiresIn });

    // ~~ SUCCESS ~~
    res
      .cookie("access_token", "Bearer " + sessionCookie, cookieParams)
      .end(JSON.stringify({ success: true }));
  } catch (err) {
    console.log("/GetToken Error: ", err);
    // set a generic error message
    let errMsg = "Unable to log in, please try again.";
    let errCode = "ERROR";
    // if it is one of our thrown errors, its okay to display
    if (err.terminal_error == true) {
      errMsg = err.message;
      errCode = err.error_code;
    }
    res.json({ error_code: errCode, message: errMsg });
  }
});

app.post("/payment", async (req, res) => {
  logger.info("/payment");
  const userId = req.body.user_id;
  if (!userId) {
    res.status(403).send("Unauthorized");
    return;
  }

  const email = req.body.email;
  if (!email) {
    res.json({
      error_code: "USER_EMAIL_INVALID",
      message: "please enter your email",
    });
    return;
  }

  let customer;
  let subscription;
  // STRIPE CUSTOMER + SUBSCRIPTION
  try {
    // Create Stripe customer from payment method created on frontend
    customer = await stripe.customers.create({
      payment_method: req.body.payment_method,
      email: req.body.email,
      invoice_settings: {
        default_payment_method: req.body.payment_method,
      },
    });

    console.log("THE CUSTOMER");
    console.log(customer);

    // Create Stripe subscription connected to new customer
    subscription = await stripe.subscriptions.create({
      customer: customer.id,
      items: [{ plan: planId }],
      expand: ["latest_invoice.payment_intent"],
      coupon: couponId,
    });
    console.log("THE SUBSCRIPTION");
    console.log(subscription);
  } catch (err) {
    const errMsg = handleStripeError(err);
    res.json({ error_code: "USER_PAYMENT_ERROR", message: errMsg });
    return;
  }

  // FIREBASE + FIRESTORE
  try {
    // Add user data to db

    let docRef = db.collection("users").doc(userId);
    let setUser = await docRef.update({
      userId: userId,
      customerId: customer.id,
      subscriptionId: subscription.id,
      email: email,
    });

    // Set custom auth claims with Firebase
    await admin.auth().setCustomUserClaims(userId, {
      customer_id: customer.id,
      subscription_id: subscription.id,
    });

    res.json({ success: true });
  } catch (err) {
    // error with firebase and firestore
    console.log("/Payment Error: ", err);
    res.json({
      error_code: "USER_PAYMENT_AUTH_ERROR",
      message: "Unable to validate your payment.",
    });
  }
});

app.use("/upgrade-subscription", checkAuth);
app.post("/upgrade-subscription", async (req, res) => {
  const { type } = req.body;

  const customer = await stripe.customers.retrieve(
    req.terminal_app.claims.customer_id
  );
  const subscriptionID = customer.subscriptions.data[0].id;

  const subProduct = await stripe.subscriptions.retrieve(
    customer.subscriptions.data[0].id
  );
  const subProductID = subProduct.items.data[0].id;

  let price;
  if (type == "yearly") {
    price = "price_1HPxX3BNiHwzGq61fr2QyoPX";
  } else if (type == "lifetyime") {
    price = "price_1HPxXyBNiHwzGq61XYt5TgOO";
  } else {
    res.json({
      status: "error",
      message: "Invalid subscription type",
    });
    return;
  }

  let updatedSubscription = await stripe.subscriptions.update(subscriptionID, {
    payment_behavior: "pending_if_incomplete",
    proration_behavior: "always_invoice",
    items: [
      {
        id: subProductID,
        price: price,
      },
    ],
  });

  console.log(updatedSubscription);
  console.log("PENDING UPDATE");
  console.log(updatedSubscription.pending_update);

  if (updatedSubscription.pending_update === null) {
    res.json({ status: "success" });
    return;
  } else {
    res.json({ status: "action_needed" });
    return;
  }
});

app.use("/user", checkAuth);
app.get("/user", async (req, res) => {
  try {
    const doc = await db
      .collection("users")
      .doc(req.terminal_app.claims.uid)
      .get();

    const user = doc.data();

    const userRecord = await admin.auth().getUser(req.terminal_app.claims.uid);

    const dashboards = await dashboard.get(req.terminal_app.claims.uid);

    const pinnedStocks = await dashboard.pinnedStocks(req.terminal_app.claims.uid);

    res.json({
      success: true,
      userRecord,
      user,
      dashboards,
      pinnedStocks
    });
  } catch (error) {
    res.json({
      success: false,
      error,
    });
  }
});

app.get("/checkUser", async (req, res) => {
  try {
    const doc = await db
      .collection("users")
      .doc(req.body.uid)
      .get();

    const user = doc.data();

    const userRecord = await admin.auth().getUser(req.body.uid);

    const dashboards = await dashboard.get(req.body.uid);

    const pinnedStocks = await dashboard.pinnedStocks(req.body.uid);

    console.log(userRecord);
    console.log(user);
    console.log(dashboards);
    console.log(pinnedStocks);

    res.json({
      success: true,
      userRecord,
      user,
      dashboards,
      pinnedStocks
    });
  } catch (error) {
    res.json({
      success: false,
      error,
    });
  }
});

//app.use("/updateAccess", checkAuth);
app.put("/updateAccess", async (req, res) => {
  try {
    const userRecord = await updateUserAccess(req.body.uid, req.body.access, req.body.plan);

    res.send(userRecord);
  } catch (error) {
    res.json({
      success: false,
      error,
    });
  }
});

app.use("/pinned-stocks", checkAuth);
app.get("/pinned-stocks", async (req, res) => {

  const pinnedStocks = await dashboard.pinnedStocks(req.terminal_app.claims.uid);

  res.json(pinnedStocks);
});

app.use("/profile", checkAuth);
app.get("/profile", async (req, res) => {
  const doc = await db
    .collection("users")
    .doc(req.terminal_app.claims.uid)
    .get();

  const user = doc.data();

  const customer = await stripe.customers.retrieve(
    req.terminal_app.claims.customer_id,
    {
      expand: [
        "subscriptions.data.default_payment_method",
        "invoice_settings.default_payment_method",
      ],
    }
  );

  const charges = await stripe.charges.list({
    customer: customer.id,
  });

  const chargesAmount = [];

  charges.data.map((charge) => {
    chargesAmount.push(charge.amount);
  });

  //TODO: Handle no subscription when accessing settings. ternary for subscription object is temp fix
  let subscription = customer.subscriptions.data[0]

  let paymentMethod;
  if (subscription) {
    paymentMethod = subscription.default_payment_method;
  }
  if (paymentMethod == null) {
    paymentMethod = customer.invoice_settings.default_payment_method;
  }
  res.json({
    email: customer.email,
    delinquent: customer.delinquent,
    card_brand: paymentMethod ? paymentMethod.card.brand : "demo",
    card_last4: paymentMethod ? paymentMethod.card.last4 : "demo",
    customer_id: req.terminal_app.claims.customer_id,
    subscription_id: subscription ? subscription.id : "",
    customer_since: subscription ? subscription.created : "0",
    amount: subscription ? subscription.plan.amount / 100.0 : 0,
    trial_end: subscription ? subscription.trial_end : "0",
    next_payment: subscription ? subscription.current_period_end : "0",
    firstName: user.firstName ? user.firstName : "",
    lastName: user.lastName ? user.lastName : "",
    city: user.city ? user.city : "",
    profileImage: user.profileImage ? user.profileImage : "",
    ...user,
    charges: chargesAmount,
  });
});

const storage = multer.memoryStorage();
const upload = multer({ storage });

// upadte profile
app.post("/profile", upload.single("imageFile"), async (req, res) => {
  try {
    let { firstName, lastName, city, profileImage, imageKey } = req.body;
    const file = req.file;

    let imageNewKey = uuidv4();

    if (file) {
      const s3 = new AWS.S3({
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
        region: process.env.AWS_SES_REGION,
      });

      const params = {
        Bucket: process.env.AWS_BUCKET_USER_PROFILE,
        Key: imageNewKey,
        ContentType: file.mimetype,
        Body: file.buffer,
        ACL: "public-read",
      };

      const s3Upload = await s3.upload(params).promise();

      profileImage = s3Upload.Location;
      imageKey = imageNewKey;
    }

    const docRef = db.collection("users").doc(req.terminal_app.claims.uid);

    await docRef.update({
      firstName,
      lastName,
      city: city ? city : null,
      profileImage: profileImage ? profileImage : null,
      imageKey: imageKey ? imageKey : null,
    });

    res.send({ success: true });
  } catch (error) {
    res.json({
      success: false,
      error,
    });
  }
});

// complete a user signup for someone who pays for a
// subscription thru a 3rd party platform (i.e. clickfunnels)
app.post("/complete-signup", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (email.length < 1 || password.length < 1) {
      res.json({ error: "Required fields are missing" });
      return;
    }

    const customers = await stripe.customers.list({
      email: email,
      limit: 1,
    });

    if (customers.data.length < 1) {
      return res.json({
        error: "We could not find a customer with that email address.",
      });
    }

    const customerId = customers.data[0].id;
    const firstName = customers.data[0].metadata.first_name;

    const response = await stripe.subscriptions.list({
      customer: customerId,
    });

    const { data } = response;
    const subscriptions = data;

    const subscriptionId = subscriptions[0].id;

    const charges = await stripe.charges.list({
      customer: customerId,
    });

    const chargesAmount = [];

    charges.data.map((charge) => {
      chargesAmount.push(charge.amount);
    });

    const authUser = await admin.auth().createUser({
      email,
      emailVerified: false,
      password,
      disabled: false,
    });

    const docRef = db.collection("users").doc(authUser.uid);
    await docRef.set(
      {
        userId: authUser.uid,
        customerId,
        subscriptionId,
        email: email,
        firstName,
        lastName: "",
        phoneNumber: customers.data[0].phone,
      },
      { merge: true }
    );

    await admin.auth().setCustomUserClaims(authUser.uid, {
      customer_id: customerId,
      subscription_id: subscriptionId,
    });

    const userMeta = {
      firstName,
      charges: chargesAmount,
    };

    const userRecord = await updateUserAccess(authUser.uid, req.body.access, req.body.plan);

    res.json({ success: true, userMeta, userRecord });
  } catch (error) {
    res.json({
      error:
        "We were unable to complete your account setup at this time, please contact support.",
    });
  }
});

// save user details when signup
app.post("/signup", async (req, res) => {
  try {
    const { userId, email, firstName, lastName, phoneNumber } = req.body;

    const docRef = db.collection("users").doc(userId);
    await docRef.set({
      email,
      firstName,
      lastName,
      phoneNumber,
    });

    res.send({ success: true });
  } catch (error) {
    res.json({
      success: false,
      error,
    });
  }
});

app.post("/demorequest", async (req, res) => {
  try {
    const { email, name, phoneNumber } = req.body;

    sendEmail.sendDemoRequest(name,phoneNumber,email);

    res.send({ success: true });
  } catch (error) {
    res.json({
      success: false,
      error,
    });
  }
});

app.use("/cancellation-request", checkAuth);
app.post("/cancellation-request", async (req, res) => {
  const { cancelReason } = req.body;

  const doc = await db
    .collection("users")
    .doc(req.terminal_app.claims.uid)
    .get();

  const user = doc.data();

  const customer = await stripe.customers.retrieve(
    req.terminal_app.claims.customer_id
  );

  const getSubscription = await stripe.subscriptions.retrieve(
    user.subscriptionId
  );

  // Prevent cancelation request if a user is a prime user or if the subscription is already canceled
  if (getSubscription.status !== "canceled" && user && user.isPrime !== true) {
    await stripe.subscriptions.update(user.subscriptionId, {
      cancel_at_period_end: true,
    });
  }

  let email = customer.email;

  sendEmail.sendCancellationRequest(
    `${user.firstName} ${user.lastName}`,
    "n/a",
    email,
    cancelReason,
    req.terminal_app.claims.customer_id
  );

  res.send("success");
});

// Securities
app.use("/security/:symbol", checkAuth);
app.get("/security/:symbol", async (req, res) => {
  const result = await securities.lookup(
    companyAPI,
    req.params.symbol,
    req.terminal_app.claims.uid
  );
  //const result = await companies.lookup(companyAPI, req.params.symbol);
  res.send(result);
});

app.use("/security/:symbol/meta", checkAuth);
app.get("/security/:symbol/meta", async (req, res) => {
  const companyFundamentals = await getSecurityData.lookupSecurity(
    securityAPI,
    req.params.symbol
  );
  res.send(companyFundamentals);
});

app.use("/security/:symbol/price-action", checkAuth);
app.get("/security/:symbol/price-action", async (req, res) => {
  const priceData = await quodd.getAllForTicker(req.params.symbol);
  res.send(priceData);
});

app.use("/etfs/following", checkAuth);
app.get("/etfs/following", async (req, res) => {
  const result = await watchlist.getFollowedETFs(req.terminal_app.claims.uid);
  res.send(result);
});

app.use("/etfs/:id/unfollow", checkAuth);
app.get("/etfs/:id/unfollow", async (req, res) => {
  const result = await etfs.unfollow(
    req.terminal_app.claims.uid,
    req.params.id
  );
  res.send(result);
});

app.use("/etfs/:id/follow", checkAuth);
app.get("/etfs/:id/follow", async (req, res) => {
  const result = await etfs.follow(req.terminal_app.claims.uid, req.params.id);
  res.send(result);
});

app.use("/etfs/:identifier", checkAuth);
app.get("/etfs/:identifier", async (req, res) => {
  const result = await etfs.lookup(req.params.identifier);
  res.send(result);
});

app.use("/etfs/:identifier/stats", checkAuth);
app.get("/etfs/:identifier/stats", async (req, res) => {
  const result = await etfs.get_stats(req.params.identifier);
  res.send(result);
});

app.use("/etfs/:identifier/analytics", checkAuth);
app.get("/etfs/:identifier/analytics", async (req, res) => {
  const result = await etfs.get_analytics(req.params.identifier);
  res.send(result);
});

app.use("/etfs/:identifier/holdings", checkAuth);
app.get("/etfs/:identifier/holdings", async (req, res) => {
  const result = await etfs.get_holdings(req.params.identifier);
  res.send(result);
});

app.use("/analyst-ratings/:symbol/snapshot", checkAuth);
app.get("/analyst-ratings/:symbol/snapshot", async (req, res) => {
  const snapshot = await analystRatings.analystSnapshot(req.params.symbol);
  res.send(snapshot);
});

app.use("/chart-data/:symbol", checkAuth);
app.get("/chart-data/:symbol", async (req, res) => {
  const data = await getSecurityData.getChartData(
    securityAPI,
    req.params.symbol
  );
  res.send(data);
});

app.use("/sec-historical-price/:symbol", checkAuth);
app.get("/sec-historical-price/:symbol/:days", async (req, res) => {
  const intradayPrices = await getSecurityData.getHistoricalData(
    securityAPI,
    req.params.symbol,
    req.params.days,
    "daily"
  );
  res.send(intradayPrices);
});

app.use("/company/datapoints", checkAuth);
app.post("/company/datapoints", async (req, res) => {
  const data = await getCompanyData.getDataPoint(securityAPI, req.body);
  res.send(data);
});

app.use("/company/data_number", checkAuth);
app.post("/company/data_number", async (req, res) => {
  const data = await getCompanyData.getNumberDataPoint(
    companyAPI,
    req.body.symbols,
    req.body.tags
  );
  res.send(data);
});

// general

app.use("/futures", checkAuth);
app.get("/futures", async (req, res) => {
  const futuresData = await futures.getFutures();
  res.send(futuresData);
});

// Companies
app.use("/company/:symbol", checkAuth);
app.get("/company/:symbol", async (req, res) => {
  const result = await mutual_funds.lookup(
    companyAPI,
    req.params.symbol,
    req.terminal_app.claims.uid
  );
  //const result = await companies.lookup(companyAPI, req.params.symbol);
  res.send(result);
});

app.use("/company/:symbol/owners", checkAuth);
app.get("/company/:symbol/owners", async (req, res) => {
  const result = await companies.getOwners(req.params.symbol);
  res.send(result);
});

app.use("/company/:symbol/etfs/:sort?", checkAuth);
app.get("/company/:symbol/etfs/:sort?", async (req, res) => {
  const result = await companies.getEtfs(req.params.symbol, req.params.sort);
  res.send(result);
});

app.use("/company-news/:symbol", checkAuth);
app.get("/company-news/:symbol", async (req, res) => {
  const companyNews = await getCompanyData.companyNews(
    companyAPI,
    req.params.symbol
  );
  res.send(companyNews);
});

app.use("/company-news/:symbol/images", checkAuth);
app.get("/company-news/:symbol/images", async (req, res) => {
  const companyNews = await getCompanyData.companyNews(
    companyAPI,
    req.params.symbol,
    true
  );
  res.send(companyNews);
});

app.use("/company-fundamentals/:symbol", checkAuth);
app.get("/company-fundamentals/:symbol", async (req, res) => {
  const companyFundamentals = await getCompanyData.companyFundamentals(
    companyAPI,
    req.params.symbol
  );
  res.send(companyFundamentals);
});

app.use("/company/data_text", checkAuth);
app.post("/company/data_text", async (req, res) => {
  const data = await getCompanyData.getTextDataPoint(
    companyAPI,
    req.body.symbols,
    req.body.tags
  );
  res.send(data);
});

app.use("/companies/following", checkAuth);
app.get("/companies/following", async (req, res) => {
  const result = await watchlist.getFollowedCompanies(
    req.terminal_app.claims.uid
  );
  res.send(result);
});

app.use("/companies/:id/unfollow", checkAuth);
app.get("/companies/:id/unfollow", async (req, res) => {
  const result = await companies.unfollow(
    req.terminal_app.claims.uid,
    req.params.id
  );
  res.send(result);
});

app.use("/companies/:id/follow", checkAuth);
app.get("/companies/:id/follow", async (req, res) => {
  const result = await companies.follow(
    req.terminal_app.claims.uid,
    req.params.id
  );
  res.send(result);
});

/* Securities */

app.use("/data-tags", checkAuth);
app.get("/data-tags", async (req, res) => {
  const result = await getDataTags.allDataTags(dataTagAPI);
  res.send(result);
});

app.use("/sec-screener", checkAuth);
app.post("/sec-screener", async (req, res) => {
  const result = await screener.screen(securityAPI, req.body);
  res.send(result);
});

app.use("/sec-intraday-prices/:symbol", checkAuth);
app.get("/sec-intraday-prices/:symbol", async (req, res) => {
  const intradayPrices = await getSecurityData.getIntradayPrices(
    securityAPI,
    req.params.symbol
  );
});

app.use("/sec-last-price/:symbol", checkAuth);
app.get("/sec-last-price/:symbol", async (req, res) => {
  const lastPrice = await quodd.getLastPrice(req.params.symbol);
  res.send(lastPrice);
});

app.use("/sec-price-change/:symbol", checkAuth);
app.get("/sec-price-change/:symbol", async (req, res) => {
  const lastPrice = await quodd.getLastPriceChange(req.params.symbol);
  res.send(lastPrice);
});

app.use("/similar/:ticker", checkAuth);
app.get("/similar/:ticker", async (req, res) => {
  const intradayPrices = await screener.similarCompanies(
    req.params.ticker,
    securityAPI
  );
  res.send(intradayPrices);
});

// SEARCH
app.use("/search/:query", checkAuth);
app.get("/search/:query", async (req, res) => {
  const query = req.params.query;
  const results = await search.searchCompanies(query);
  res.send(results);
});

app.use("/search-sec/:query", checkAuth);
app.get("/search-sec/:query", async (req, res) => {
  const query = req.params.query;
  const results = await search.searchCompanies(query);
  res.send(results);
});

// app.use("/billionarers/search/typeahead", checkAuth);
app.get("/billionarers/search/typeahead", async (req, res) => {
  const results = await search.prefetchTitans();
  res.send(results);
});

/* Index Endpoints */

app.use("/get-index-price/:symbol", checkAuth);
app.get("/get-index-price/:symbol", async (req, res) => {
  const level = await getIndexData.getIndexPrice(indexAPI, req.params.symbol);
  res.json({ price: level });
});

app.use("/index-historical/:symbol", checkAuth);
app.get("/index-historical/:symbol", async (req, res) => {
  const results = await getIndexData.indexHistorical(
    indexAPI,
    req.params.symbol
  );
  res.send(results);
});

app.use("/index-data", checkAuth);
app.get("/index-data", async (req, res) => {
  const results = await cnn.getIndexData();
  res.json(results);
});

/* Gainers & Losers */

app.use("/gainers", checkAuth);
app.get("/gainers", async (req, res) => {
  const gainers = await gainersLosers.getGainers();
  res.send(gainers);
});

app.use("/losers", checkAuth);
app.get("/losers", async (req, res) => {
  const losers = await gainersLosers.getLosers();
  res.send(losers);
});

app.use("/trending", checkAuth);
app.get("/trending", async (req, res) => {
  const trenders = await trending.getTrending();
  res.send(trenders);
});

/* News */

app.use("/all-news", checkAuth);
app.get("/all-news", async (req, res) => {
  const news = await getNews.getAllNews(companyAPI);
  res.send(news);
});

app.get("/naviga-news", checkAuth, naviga.getAllNews);
app.get("/naviga-news/:id/resource_id", checkAuth, naviga.getNewsResourceID);
app.get("/naviga-news/general", checkAuth, naviga.getGeneralNews);
app.get("/naviga-news/sector/:sector_code", checkAuth, naviga.getSectorNews);
app.get("/naviga-news/titan/:titan_uri", checkAuth, naviga.getTitanNews);
app.get("/naviga-news/strong-buy", checkAuth, naviga.getStrongBuyNews);
app.get("/naviga-news/earning", checkAuth, naviga.getEarningNews);
app.get("/naviga-news/for-you", checkAuth, news.getUserSpecificNews);
app.get("/naviga-news/:ticker", checkAuth, naviga.getCompanyNews);

// app.use("/news/trending-ticker", checkAuth);
app.get("/news/trending-ticker", checkAuth, news.getMostViewedPinnedCompanyNews);

// Stocks news api
app.use("/news/market-headlines", checkAuth);
app.get("/news/market-headlines", async (req, res) => {
  // const headlines = await stocksNews.generalMarketNews(
  //   process.env.STOCKS_NEWS_API_KEY
  // );
  // res.send(headlines);

  // const headlines = await news.getGeneralMarketNews();
  res.send([]);
});

app.get("/fetch-shared-securities", async (req, res) => {
  let { query } = req;
  if (query.token != "XXX") {
    res.send("fail");
    return;
  }

  securities.fetchCachedSecuritiesFromSharedCache(res);
});

app.get("/clear-shared-securities", async (req, res) => {
  let { query } = req;
  if (query.token != "XXX") {
    res.send("fail");
    return;
  }

  securities.clearCachedSecuritiesFromSharedCache(res);
});

app.get("/migration-script", async (req, res) => {
  let { query } = req;
  if (query.token != "XXX") {
    res.send("fail");
    return;
  }

  await securities.syncExistingSecuritiesWithRedis(req.query.ticker, res);

  res.end();
});

app.use("/news-sources", checkAuth);
app.get("/news-sources", async (req, res) => {
  // const sources = await newsHelper.getSources(process.env.NEWS_API_KEY);
  // res.send(sources);

  const sources = await news.getSources();
  res.send(sources);
});

app.use("/news/headlines/:source", checkAuth);
app.get("/news/headlines/:source", async (req, res) => {
  // const headlines = await newsHelper.getSourceHeadlines(
  //   process.env.NEWS_API_KEY,
  //   req.params.source
  // );
  // res.send(headlines);

  const headlines = await news.getSourceHeadlines(req.params.source);
  res.send(headlines);
});

/* Insider */
app.use("/news/home-headlines", checkAuth);
app.get("/news/home-headlines", async (req, res) => {
  // const headlines = await newsHelper.getHomeHeadlines(process.env.NEWS_API_KEY);
  // res.send(headlines);

  const headlines = await news.getHomeHeadlines();
  res.send(headlines);
});

app.use("/all-insider", checkAuth);
app.get("/all-insider", async (req, res) => {
  const allInsider = await finviz.getAllInsider().then((data) => data);
  res.send(allInsider);
});

app.use("/insiders-movers", checkAuth);
app.get("/insiders-movers", async (req, res) => {
  const insidersMovers = await widgets
    .getGlobalInsidersNMovers()
    .then((data) => data);
  res.send(insidersMovers);
});

app.use("/company-ratings/:ticker", checkAuth);
app.get("/company-ratings/:ticker", async (req, res) => {
  const companyRatings = await finviz
    .getCompanyRatings(req.params.ticker)
    .then((data) => data);
  res.send(companyRatings);
});

app.use("/company-metrics/db/marketCaps", checkAuth);
app.get("/company-metrics/db/marketCaps", async (req, res) => {
  const companyMetrics = await companies
    .getMetricsMarketCaps()
    .then((data) => data);
  res.send(companyMetrics);
});

app.use("/company-metrics/:ticker", checkAuth);
app.get("/company-metrics/:ticker", async (req, res) => {
  const companyMetrics = await finviz
    .getCompanyMetrics(req.params.ticker)
    .then((data) => data);
  res.send(companyMetrics);
});

app.use("/forex", checkAuth);
app.get("/forex", async (req, res) => {
  const pairs = await finvizForex.getForex();
  res.send(pairs);
});

app.use("/savings-accounts", checkAuth);
app.get("/savings-accounts", async (req, res) => {
  const accounts = await nerdwalletSavings.getSavingsAccounts();
  res.send(accounts);
});

// FROM POLYGON< SHOULD REMOVE
app.use("/forex-pairs", checkAuth);
app.get("/forex-pairs", async (req, res) => {
  let pairs = {};
  pairs["EURUSD"] = await forexPairs.getLastQuoteEurUsd();
  pairs["GBPUSD"] = await forexPairs.getLastQuoteGbpUsd();
  pairs["USDCAD"] = await forexPairs.getLastQuoteUsdCad();
  pairs["USDJPY"] = await forexPairs.getLastQuoteUsdJpy();
  pairs["XAUUSD"] = await forexPairs.getLastQuoteXauUsd();
  res.send(pairs);
});

app.use("/sector-performance", checkAuth);
app.get("/sector-performance", async (req, res) => {
  const sectorPerf = await finvizGroups.getSectorsPerformance();
  res.send(sectorPerf);
});

app.use("/industry-performance", checkAuth);
app.get("/industry-performance", async (req, res) => {
  const industryPerf = await finvizGroups.getIndustriesPerformance();
  res.send(industryPerf);
});

// Institutions

// app.use("/institutions/list", checkAuth);
app.get("/institutions/list", async (req, res) => {
  const result = await institutions.getInstitutions(req.body);
  res.send(result);
});

app.use("/institutions/:cik/summary", checkAuth);
app.get("/institutions/:cik/summary", async (req, res) => {
  const result = await institutions.getSummary(
    req.params.cik,
    req.terminal_app.claims.uid
  );
  res.send(result);
});

app.use("/institutions/:id", checkAuth);
app.get("/institutions/:id", async (req, res) => {
  const result = await institutions.getInstitution(
    req.params.id,
    req.terminal_app.claims.uid
  );
  res.send(result);
});

app.use("/institutions/:id/holdings", checkAuth);
app.get("/institutions/:id/holdings", async (req, res) => {
  const result = await institutions.getHoldings(req.params.id);
  res.send(result);
});

// Billionaires
// app.use("/billionaires", checkAuth);
app.get("/billionaires", async (req, res) => {
  const result = await titans.getBillionaires(req.body);
  res.send(result);
});

app.use("/billionaires/:uri/holdings", checkAuth);
app.get("/billionaires/:uri/holdings", async (req, res) => {
  const result = await titans.getHoldings(req.params.uri);
  res.send(result);
});

app.use("/billionaires/:uri/summary", checkAuth);
app.get("/billionaires/:uri/summary", async (req, res) => {
  const result = await titans.getSummary(
    req.params.uri,
    req.terminal_app.claims.uid
  );
  res.send(result);
});

// app.use("/billionaires/list", checkAuth);
app.get("/billionaires/list", async (req, res) => {
  const result = await titans.getAllBillionaires();
  res.send(result);
});

// app.use("/billionaires/page", checkAuth);
app.get("/billionaires/page", async (req, res) => {
  const result = await titans.getFilledPage(req.query);
  res.send(result);
});

app.use("/billionaires/:id/unfollow", checkAuth);
app.get("/billionaires/:id/unfollow", async (req, res) => {
  const result = await titans.unfollowTitan(
    req.terminal_app.claims.uid,
    req.params.id
  );
  res.send(result);
});

app.use("/billionaires/following", checkAuth);
app.get("/billionaires/following", async (req, res) => {
  const result = await watchlist.getFollowedTitans(req.terminal_app.claims.uid);
  res.send(result);
});

app.use("/billionaires/:id/follow", checkAuth);
app.get("/billionaires/:id/follow", async (req, res) => {
  const result = await titans.followTitan(
    req.terminal_app.claims.uid,
    req.params.id
  );
  res.send(result);
});

app.use("/billionaires/:id/toggle_company_performance_fallback", checkAuth);
app.get(
  "/billionaires/:id/toggle_company_performance_fallback",
  isAuthorized({ hasRole: ["admin"] }),
  async (req, res) => {
    const result = await titans.updateBillionaire_CompanyPerformanceFallback(
      req.params.id,
      req.query.toggle
    );
    res.send(result);
  }
);

app.use("/billionaire/:id", checkAuth);
app.put("/billionaire/:id", async (req, res) => {
  const result = await titans.updateBillionaire(req.params.id, req.body.cik);
  res.send(result);
});

app.use("/billionaire/:id", checkAuth);
app.get("/billionaire/:id", async (req, res) => {
  const result = await titans.updateBillionaireNote(
    req.params.id,
    req.query.note
  );
  res.send(result);
});

app.use("/titan-news/:uri", checkAuth);
app.get("/titan-news/:uri", async (req, res) => {
  const titanNews = await titans.getTitanNews(req.params.uri);
  res.send(titanNews);
});

app.use("/titans/:portfolio", checkAuth);
app.get("/titans/:portfolio", async (req, res) => {
  const portfolio = await titans
    .getSinglePortfolioData(req.params.portfolio)
    .then((data) => data);
  res.send(portfolio);
});

app.use("/titans", checkAuth);
app.get("/titans", async (req, res) => {
  // const result = await titans.getPortfolios(req.body);
  const result = await titans.getTitans(req.body);
  res.send(result);
});

// Alerts

// app.use("/alerts", checkAuth);
app.post("/alerts", async (req, res) => {
  const result = await alerts.createAlert(
    req.body.name,
    req.body.message,
    req.body.isDaily
  );
  res.send(result);
});

//app.use("/alerts/:id", checkAuth);
app.get("/alerts", async (req, res) => {
  const result = await alerts.getAlerts(req);
  res.send(result);
});

//app.use("/alerts/:id", checkAuth);
app.get("/alerts/:id", async (req, res) => {
  const result = await alerts.getAlert(req.params.id);
  res.send(result);
});

//app.use("/alerts/:id/users", checkAuth);
app.get("/alerts/:id/users", async (req, res) => {
  const result = await alerts.getAlertUsers(req.params.id);
  res.send(result);
});

//app.use("/alerts/:id/activate", checkAuth);
app.get("/alerts/:id/activate", async (req, res) => {
  const result = await alerts.activateAlert(req.params.id);
  res.send(result);
});

//app.use("/alerts/:id/deactivate", checkAuth);
app.get("/alerts/:id/deactivate", async (req, res) => {
  const result = await alerts.deactivateAlert(req.params.id);
  res.send(result);
});

 app.use("/alerts/:id/addUser", checkAuth);
app.get("/alerts/:id/addUser", async (req, res) => {
  const result = await alerts.addAlertUser(
    req.terminal_app.claims.uid,
    req.params.id,
    req.body.phone
  );
  res.send(result);
});

app.use("/alerts/:id/subscribe", checkAuth);
app.get("/alerts/:id/subscribe", async (req, res) => {
  const result = await alerts.subscribeAlert(
    req.body.phone,
    req.params.id
  );
  res.send(result);
});

app.use("/alerts/:id/unsubscribe", checkAuth);
app.get("/alerts/:id/unsubscribe", async (req, res) => {
  const result = await alerts.unsubscribeAlert(
    req.body.phone,
    req.params.id
  );
  res.send(result);
});

//app.use("/daily_alerts", checkAuth);
app.get("/daily_alerts", async (req, res) => {
  const result = await alerts.getDailyAlerts();
  res.send(result);
});

//app.use("/cw_getUser", checkAuth);
app.get("/cw_getUser", async (req, res) => {
  let userResult=[], alertUserResult=[];
  try{

    alertUserResult = await alerts.getAlertByName("CW Daily");
    userResult = await alerts.getAlertUser(alertUserResult[0].id, req.query.uid);

    res.send(JSON.stringify({ success: true, userResult }));
  } catch (error) {
      res.send(JSON.stringify({ success: false, error, userResult }));
    }
  
});

//Cathie Wood subscribe
app.use("/cw_subscribe", checkAuth);
app.post("/cw_subscribe", async (req, res) => {
  let alertResult, userResult, alertUserResult;
  try {
    await alerts.addCWAlertUser(
      req.terminal_app.claims.uid,
      req.body.phone
    );

    alertResult = await alerts.getAlertByName("CW Subscribe");
    alertUserResult = await alerts.getAlertByName("CW Daily");

    userResult = await alerts.getAlertUser(alertUserResult[0].id, req.terminal_app.claims.uid);
    
    res.header('Content-Type', 'application/json');
    client.messages
      .create({
        from: process.env.TWILIO_PHONE_NUMBER,
        to: req.body.phone,
        body: alertResult[0].message
      })
      .then(() => {
        res.send(JSON.stringify({ success: true, userResult }));
      })
      .catch(err => {
        console.log(err);
        res.send(JSON.stringify({ success: false, userResult }));
      });
    } catch (error) {
      res.send(JSON.stringify({ success: false, error, alertResult, userResult }));
    }
});

//Cathie Wood unsubscribe
app.use("/cw_unsubscribe", checkAuth);
app.post("/cw_unsubscribe", async (req, res) => {
  let alertResult, userResult, alertUserResult;
  try {
    await alerts.unsubscribeCWAlert(
      req.body.phone
    );
    
    alertResult = await alerts.getAlertByName("CW Unsubscribe");
    alertUserResult = await alerts.getAlertByName("CW Daily");

    userResult = await alerts.getAlertUser(alertUserResult[0].id, req.terminal_app.claims.uid);
    res.header('Content-Type', 'application/json');
    client.messages
      .create({
        from: process.env.TWILIO_PHONE_NUMBER,
        to: req.body.phone,
        body: alertResult[0].message
      })
      .then(() => {
        res.send(JSON.stringify({ success: true, userResult }));
      })
      .catch(err => {
        console.log(err);
        res.send(JSON.stringify({ success: false, userResult }));
      });
  } catch (error) {
      res.send(JSON.stringify({ success: false, error, alertResult, userResult }));
    }
});


// Twilio SMS
app.post('/alerts/send_sms', (req, res) => {
  res.header('Content-Type', 'application/json');
  client.messages
    .create({
      from: process.env.TWILIO_PHONE_NUMBER,
      to: req.body.to,
      body: req.body.message
    })
    .then(() => {
      res.send(JSON.stringify({ success: true }));
    })
    .catch(err => {
      console.log(err);
      res.send(JSON.stringify({ success: false }));
    });
});

// Receives response from
var MessagingResponse = require('twilio').twiml.MessagingResponse;

app.post('/alert/response', async function (req, res) {
  var resp = new MessagingResponse();
  var responseMsg = req.body.Body.trim().toLowerCase();
  var fromNum = req.body.From;
  if (responseMsg.includes('end alert')) {

    alerts.unsubscribeCWAlert(fromNum);

    const alertUnsub = await alerts.getAlertByName("CW Unsubscribe");
    resp.message(alertUnsub[0].message); 

  } 
  else {
    resp.message('Invalid keyword!');
  }
  res.writeHead(200, {
    'Content-Type':'text/xml'
  });
  res.end(resp.toString());
});

app.get("/trades/top_buy", async (req, res) => {
  const result = await trades.getTop3Buy();
  res.send(result);
});

app.get("/trades/top_sell", async (req, res) => {
  const result = await trades.getTop3Sell();
  res.send(result);
});

app.get("/trades/portfolio_additions", async (req, res) => {
  const result = await trades.getPortfolioAdditions(req.query.top5);
  res.send(result);
});

app.get("/trades/portfolio_deletions", async (req, res) => {
  const result = await trades.getPortfolioDeletions(req.query.top5);
  res.send(result);
});

app.get("/trades/open_portfolio", async (req, res) => {
  const result = await trades.getOpenPortfolio(req.query.top5);
  res.send(result);
});

app.get("/trades/archived_portfolio", async (req, res) => {
  const result = await trades.getArchivedPortfolio(req.query.top5);
  res.send(result);
});

app.get("/trades", async (req, res) => {
  const result = await trades.getTrades(req);
  res.send(result);
});


app.get("/portfolios/search/typeahead", async (req, res) => {
  const results = await search.prefetchPortfolios();
  res.send(results);
});

app.use("/portfolios/performance", checkAuth);
app.get("/portfolios/performance", async (req, res) => {
  const result = await performance.getPortfolios(req.body);
  res.send(result);
});

app.use("/portfolios", checkAuth);
app.post("/portfolios", async (req, res) => {
  const result = await titans.getPortfolios(req.body);
  res.send(result);
});

app.use("/portfolios/:cik", checkAuth);
app.get("/portfolios/:cik", async (req, res) => {
  const portfolio = await portfolios
    .getPortfolio(req.params.cik)
    .then((data) => data);
  res.send(portfolio);
});

// Helpers
app.get("/hooks/zip_billionaire_performances", async (req, res) => {
  const result = await hooks.zipPerformances_Billionaires(req.body);
  res.send(result);
});

app.use("/zacks/securities", checkAuth);
app.get("/zacks/securities", zacks.getZacksRank);

// Zacks EPS Surprises
app.use("/zacks/eps_surprises", checkAuth);
app.get("/zacks/eps_surprises", async (req, res) => {
  const result = await zacks.get_eps_surprises(req.query.identifier);
  res.send(result);
});

// Zacks
app.use("/zacks/eps_estimates", checkAuth);
app.get("/zacks/eps_estimates", async (req, res) => {
  const result = await zacks.get_eps_estimates(req.query.identifier);
  res.send(result);
});

// Zacks
app.use("/zacks/eps_growth_rates", checkAuth);
app.get("/zacks/eps_growth_rates", async (req, res) => {
  const result = await zacks.get_eps_growth_rates(req.query.company);
  res.send(result);
});

// Zacks
app.use("/zacks/long_term_growth_rates", checkAuth);
app.get("/zacks/long_term_growth_rates", async (req, res) => {
  const result = await zacks.get_long_term_growth_rates(req.query.identifier);
  res.send(result);
});

app.use("/zacks/editorial", checkAuth);
app.get("/zacks/editorial", async (req, res) => {
  const result = await zacks.get_stories();
  res.send(result);
});

// Cannon
app.use("/cannon/mutual_funds/daily_summary", checkAuth);
isAuthorized({ hasRole: ["admin"] }),
  app.get("/cannon/mutual_funds/daily_summary", async (req, res) => {
    const result = await cannon.get_daily_summary();
    res.send(result);
  });

// Mutual funds
/*
app.use("/mutual-fund/:identifier", checkAuth);
app.get("/mutual-fund/:identifier", async (req, res) => {
  console.log("made it to new route");
  const result = await mutual_funds.lookup(companyAPI, req.params.identifier);
  res.send(result);
});
*/
app.use("/mutual-fund/following", checkAuth);
app.get("/mutual-fund/following", async (req, res) => {
  const result = await watchlist.getFollowedMutualFunds(
    req.terminal_app.claims.uid
  );
  res.send(result);
});

// app.use("/mutual-funds/:identifier/holdings", checkAuth);
app.get("/mutual-funds/:identifier/holdings", async (req, res) => {
  const result = await mutual_funds.getHoldings(req.params.identifier);
  res.send(result);
});

app.use("/mutual-funds/top/:data/:num", checkAuth);
app.get("/mutual-funds/top/:data/:num", async (req, res) => {
  const result = await mutual_funds.getTopFunds(
    req.params.data,
    req.params.num
  );
  res.send(result);
});

app.use("/mutual-funds/topnbot/discount/:num", checkAuth);
app.get("/mutual-funds/topnbot/discount/:num", async (req, res) => {
  const result = await mutual_funds.getTopDiscountsFunds(req.params.num);
  res.send(result);
});

app.use("/mutual-funds/:id/unfollow", checkAuth);
app.get("/mutual-funds/:id/unfollow", async (req, res) => {
  const result = await mutual_funds.unfollow(
    req.terminal_app.claims.uid,
    req.params.id
  );
  res.send(result);
});

app.use("/mutual-funds/:id/follow", checkAuth);
app.get("/mutual-funds/:id/follow", async (req, res) => {
  const result = await mutual_funds.follow(
    req.terminal_app.claims.uid,
    req.params.id
  );
  res.send(result);
});

// pages
app.use("/pages/institutions", checkAuth);
app.get("/pages/institutions", async (req, res) => {
  const result = await pages.getPages_Institutions();

  res.send(result);
});

app.use("/pages/titans", checkAuth);
app.get("/pages/titans", async (req, res) => {
  const result = await pages.getPages_Titans();
  res.send(result);
});

// dashboard & widgets
app.use("/dashboards", checkAuth);
app.get("/dashboards", async (req, res) => {
  const result = await dashboard.get(req.terminal_app.claims.uid);
  res.send(result);
});

app.use("/stockwall", checkAuth);
app.get("/stockwall", async (req, res) => {
  const result = await dashboard.getStockWall(req.terminal_app.claims.uid);
  res.send(result);
});

app.use("/pin", checkAuth);
app.get("/pin", async (req, res) => {
  const result = await widgets.create(
    req.terminal_app.claims.uid,
    req.params.type,
    req.params.inputs
  );
  res.send(result);
});

// app.get("/ping", async (req, res) => {
//   // const result = await widgets.create(
//   //   req.terminal_app.claims.uid,
//   //   req.params.type,
//   //   req.params.inputs
//   // );

//   await quodd.test();

//   res.send(null);
// });

// app.use("/top-stocks", checkAuth);
app.get("/top-stocks", async (req, res) => {
  const topStocks = await securities.getTopStocks();

  return res.send({
    output: topStocks
  });
});

app.use("/widgets/pin", checkAuth);
app.post("/widgets/pin", async (req, res) => {
  const result = await widgets.create(
    req.terminal_app.claims.uid,
    req.body.type,
    req.body.input
  );
  res.send(result);
});

app.use("/widgets/:id/unpin", checkAuth);
app.get("/widgets/:id/unpin", async (req, res) => {
  const result = await widgets.unpin(
    req.terminal_app.claims.uid,
    req.params.id
  );
  res.send(result);
});

// app.use("/widgets/:id", checkAuth);
app.get("/widgets/:id", async (req, res) => {
  const result = await widgets.get(req.params.id);
  res.send(result);
});

// app.use("/widgets/global/:type", checkAuth);
app.get("/widgets/global/:type", async (req, res) => {
  const result = await widgets.getGlobalWidgetByType(req.params.type);
  res.send(result);
});

/* Dark Pool */
app.get("/darkpool/snapshot", async (req, res) => {
  const result = await darkpool.getSnapshot(req);
  res.send(result);
});

app.get("/darkpool/sidebar", async (req, res) => {
  const result = await darkpool.getSidebar();
  res.send(result);
});

app.get("/darkpool/options", async (req, res) => {
  const result = await darkpool.getOptions(req);
  res.send(result);
});

app.get("/darkpool/expDates", async (req, res) => {
  const result = await darkpool.getExpDates(req);
  res.send(result);
});

app.get("/darkpool/option/:id", async (req, res) => {
  const result = await darkpool.getOption(req.params.id);
  res.send(result);
});

app.get("/darkpool/options/search/:ticker", async (req, res) => {
  const result = await darkpool.searchOptions(req.params.ticker);
  res.send(result);
});

app.get("/darkpool/fill_options", async (req, res) => {
  const result = await darkpool.fillSpotPrice();
  res.send(result);
});

// ciks
app.use("/billionaire/:identifier/ciks/:rank/set", checkAuth);
app.get(
  "/billionaire/:identifier/ciks/:rank/set",
  isAuthorized({ hasRole: ["admin"] }),
  async (req, res) => {
    const result = await titans.setCik(
      req.params.identifier,
      req.params.rank,
      req.query.cik
    );
    res.send(result);
  }
);

// Entity
app.use("/billionaire/:identifier/name/:rank/set", checkAuth);
app.get(
  "/billionaire/:identifier/name/:rank/set",
  isAuthorized({ hasRole: ["admin"] }),
  async (req, res) => {
    const result = await titans.setEntityName(
      req.params.identifier,
      req.params.rank,
      req.query.name
    );
    res.send(result);
  }
);

// ciks endpoints
app.use("/ciks/:cik", checkAuth);
app.get("/ciks/:cik", async (req, res) => {
    const result = await holdings.getHoldingsByCik(req.params.cik);
    res.send(result);
  }
);

app.use("/ciks/institutions/data", checkAuth);
app.get("/ciks/institutions/data", async (req, res) => {
  const result = await institutions.getInstitutionsCikData(req);
  res.send(result);
});

app.use("/ciks/titans/:uri", checkAuth);
app.get("/ciks/titans/:uri", async (req, res) => {
  const result = await titans.getTitansCikData(
    req.params.uri,
    req.terminal_app.claims.uid
  );
  res.send(result);
});

app.use("/billionaire/:identifier/ciks/:rank/promote", checkAuth);
app.get(
  "/billionaire/:identifier/ciks/:rank/promote",
  isAuthorized({ hasRole: ["admin"] }),
  async (req, res) => {
    const result = await titans.promoteCik(
      req.params.identifier,
      req.params.rank
    );
    res.send(result);
  }
);

// Edgar
app.use("/edgar/lookup", checkAuth);
app.get(
  "/edgar/lookup",
  isAuthorized({ hasRole: ["admin"] }),
  async (req, res) => {
    let { name } = req.query;

    const result = await edgar.lookupByName(name);
    res.send(result);
  }
);

app.use("/edgar/result", checkAuth);
app.get(
  "/edgar/result",
  isAuthorized({ hasRole: ["admin"] }),
  async (req, res) => {
    const result = await edgar.getCachedSearchResult(req.query.identifier);
    res.send(result);
  }
);

app.use("/edgar/results", checkAuth);
app.get(
  "/edgar/results",
  isAuthorized({ hasRole: ["admin"] }),
  async (req, res) => {
    const result = await edgar.getCachedSearchResults({ size: 5000 });
    res.send(result);
  }
);

app.use("/edgar/search", checkAuth);
app.get(
  "/edgar/search",
  isAuthorized({ hasRole: ["admin"] }),
  async (req, res) => {
    const result = await edgar.search(req.query);
    res.send(result);
  }
);

app.use("/bots/process_billionaire_summary", checkAuth);
app.get(
  "/bots/process_billionaire_summary",
  isAuthorized({ hasRole: ["admin"] }),
  async (req, res) => {
    const result = await bots.processBillionaireSummary(
      req.query.billionaire_id
    );
    res.send(result);
  }
);

// Questionnaire Submission
app.post("/questionnaire-submission", checkAuth, questionnaireSubmission);

// stripe - fetch subscriptions
app.get("/fetch_subscriptions", async (req, res) => {
  if (process.env.RELEASE_STAGE == "production") {
    res.send("fail");
    return;
  }

  if (process.env.DISABLE_CRON == "true") {
    res.send("disabled");
    return;
  }
  let { query } = req;
  if (query.token != "XXX") {
    res.send("fail");
    return;
  }

  var users = [];

  const userLists = await admin.auth().listUsers(1000)

  for (const user of userLists.users) {
    users.push(user)
  }

  if (userLists.pageToken) {
    const userLists2 = await admin.auth().listUsers(1000, userLists.pageToken)
    if (userLists2 && userLists2.users.length > 0) {
      for (const user of userLists2.users) {
        users.push(user)
      }
    }
  }

  var subs = [];

  for (const user of users) {
    if (user.customClaims && !isEmpty(user.customClaims)) {
      const { subscription_id, customer_id } = user.customClaims
      if (subscription_id) {
        const subscription = await stripe.subscriptions.retrieve(
            subscription_id
        );
        const activesub = await stripe.subscriptions.list({
          customer: customer_id,
        });
        const customerData = await stripe.customers.retrieve(
            customer_id
        );

        // console.log(subscription)
        subs.push({user: user, sub: subscription, active_sub: activesub, customer: customerData});

        if (subs.length > 100) {
          break;
        }
      }
    }
  }
  res.send({subs: subs});
});

// stripe - fetch user subscription and fix
app.get("/fetch_user_subscription", async (req, res) => {
  if (process.env.RELEASE_STAGE == "production") {
    res.send("fail");
    return;
  }

  if (process.env.DISABLE_CRON == "true") {
    res.send("disabled");
    return;
  }
  let { query } = req;
  if (query.token != "XXX") {
    res.send("fail");
    return;
  }

  if (query.uid && query.uid.length > 0) {
    console.log(query.uid);
  } else {
    res.send("failed, no user");
    return;
  }

  var updateSubscription = false;
  if (query.updatesub && query.updatesub === "true") {
    console.log(query.updatesub);
    updateSubscription = true;
  }

  const user = await admin.auth().getUser(query.uid);

  var sub;

  if (user.customClaims && !isEmpty(user.customClaims)) {
    const { subscription_id, customer_id } = user.customClaims
    if (subscription_id) {
      const subscription = await stripe.subscriptions.retrieve(
          subscription_id
      );
      const activesub = await stripe.subscriptions.list({
        customer: customer_id,
      });
      const customerData = await stripe.customers.retrieve(
          customer_id
      );

      sub = {user: user, sub: subscription, active_sub: activesub, customer: customerData};

      try {
        if (subscription.status === "active") {
          console.log("This account is active");
        } else if (subscription && subscription.cancel_at_period_end === true &&
            (subscription.status === "canceled" && moment(subscription.canceled_at, "DD-MM-YYYY").isAfter(moment("01-01-2021", "DD-MM-YYYY"), "day"))
        ) {
          console.log("found canceled subscription");

          if (updateSubscription) {
            if (customerData && customerData.invoice_settings && !customerData.invoice_settings.default_payment_method && subscription.default_payment_method) {
              await stripe.customers.update(
                  customer_id,
                  { invoice_settings: { default_payment_method: subscription.default_payment_method } }
              );
            }


            console.log("attempting to create sub");
            const newSubscription = await stripe.subscriptions.create({
              customer: customer_id,
              items: [{ plan: planId }],
              expand: ["latest_invoice.payment_intent"],
              coupon: couponIdFree,
            });
            console.log("new subscription ---", newSubscription)

            sub = {...sub, new_sub: newSubscription}

            await admin.auth().setCustomUserClaims(user.uid, {
              customer_id,
              subscription_id: newSubscription.id,
            });

            let docRef = db.collection("users").doc(user.uid);
            await docRef.update({
              customerId: customer_id,
              subscriptionId: newSubscription.id,
              subscriptionStatus: newSubscription.status
            });
          }
        } else if (sub && sub.sub && sub.sub.cancel_at_period_end === true && sub.sub.status != "canceled") {

          console.log("not canceled yet but set to cancel");

          if (updateSubscription) {
            const updatedSubscription = await stripe.subscriptions.update(subscription.id, {
              cancel_at_period_end: false
            });
            console.log("updatedSubscription---", updatedSubscription)
            sub = {...sub, updated_sub: updatedSubscription}

            let docRef = db.collection("users").doc(user.uid);
            await docRef.update({
              subscriptionStatus: updatedSubscription.status
            });
          }
        } else {
          console.log("This account should stay canceled");
        }

      } catch (error) {
        console.error(user.uid, "---", error)
      }
    }
  }
  res.send({sub: sub});
});

// subscription fixing
// app.get("/subscription_fixing_all", async (req, res) => {
//   if (process.env.DISABLE_CRON == "true") {
//     res.send("disabled");
//     return;
//   }
//   let { query } = req;
//   if (query.token != "XXX") {
//     res.send("fail");
//     return;
//   }
//
//   var updateSubscription = false;
//   if (query.updatesub && query.updatesub === "true") {
//     console.log(query.updatesub);
//     updateSubscription = true;
//   }
//
//   var users = [];
//
//   const userLists = await admin.auth().listUsers(300)
//
//   for (const user of userLists.users) {
//     users.push(user)
//   }
//
//   if (userLists.pageToken) {
//     const userLists2 = await admin.auth().listUsers(1000, userLists.pageToken)
//     if (userLists2 && userLists2.users.length > 0) {
//       for (const user of userLists2.users) {
//         users.push(user)
//       }
//     }
//   }
//
//   console.log("total: ", users.length);
//
//   var i = 0;
//   for (const user of users) {
//     i += 1
//     console.log(i);
//     if (user.customClaims && !isEmpty(user.customClaims)) {
//       const { subscription_id, customer_id } = user.customClaims
//       if (subscription_id) {
//         const subscription = await stripe.subscriptions.retrieve(
//             subscription_id
//         );
//         const customerData = await stripe.customers.retrieve(
//             customer_id
//         );
//
//         try {
//           if (subscription.status === "active") {
//             console.log("This account is active");
//           } else if (subscription && subscription.cancel_at_period_end === true &&
//               (subscription.status === "canceled" && moment(subscription.canceled_at, "DD-MM-YYYY").isAfter(moment("01-01-2021", "DD-MM-YYYY"), "day"))
//           ) {
//             console.log("found canceled subscription: ", user.uid);
//
//             if (updateSubscription) {
//               if (customerData && customerData.invoice_settings && !customerData.invoice_settings.default_payment_method && subscription.default_payment_method) {
//                 await stripe.customers.update(
//                     customer_id,
//                     { invoice_settings: { default_payment_method: subscription.default_payment_method } }
//                 );
//               }
//
//
//               console.log("attempting to create sub");
//               const newSubscription = await stripe.subscriptions.create({
//                 customer: customer_id,
//                 items: [{ plan: planId }],
//                 expand: ["latest_invoice.payment_intent"],
//                 coupon: couponIdFree,
//               });
//               console.log("new subscription ---", newSubscription)
//
//               await admin.auth().setCustomUserClaims(user.uid, {
//                 customer_id,
//                 subscription_id: newSubscription.id,
//               });
//
//               let docRef = db.collection("users").doc(user.uid);
//               await docRef.update({
//                 customerId: customer_id,
//                 subscriptionId: newSubscription.id,
//                 subscriptionStatus: newSubscription.status
//               });
//             }
//           } else if (subscription && subscription.cancel_at_period_end === true && subscription.status != "canceled") {
//
//             console.log("not canceled yet but set to cancel: ", user.uid);
//
//             if (updateSubscription) {
//               const updatedSubscription = await stripe.subscriptions.update(subscription.id, {
//                 cancel_at_period_end: false
//               });
//               console.log("updatedSubscription---", updatedSubscription)
//
//               let docRef = db.collection("users").doc(user.uid);
//               await docRef.update({
//                 subscriptionStatus: updatedSubscription.status
//               });
//             }
//           } else {
//             console.log("This account should stay canceled");
//           }
//
//         } catch (error) {
//           console.error(user.uid, "---", error)
//         }
//       }
//     }
//   }
//   res.send({success: true});
// });

// User Portfolio
app.get("/user-portfolio", checkAuth, dashboard.userPortfolio)

// User Performance
app.get("/user-performance", checkAuth, dashboard.userPerformance)

// Stock PIN/ UNPIN
app.use("/stock/pin", checkAuth);
app.post("/stock/pin", async (req, res) => {
  const result = await widgets.pinByTicker(
    req.terminal_app.claims.uid,
    req.body.input
  );
  res.send(result);
});

app.use("/stock/unpin", checkAuth);
app.post("/stock/unpin", async (req, res) => {
  const result = await widgets.unPinByTicker(
    req.terminal_app.claims.uid,
    req.body.input
  );
  res.send(result);
});

// ETFS
app.get("/user-etfs", checkAuth, dashboard.getEtfs)

// User report
app.get("/user-access-report", checkAuth, async (req, res) => {
  const userLists = await listAllUsers();
  let totalNonProfessionalIndice = 0
  let totalProfessionalIndice = 0
  let totalNonProfessionalRealtime = 0
  let totalProfessionalRealtime = 0

  for await (const user of userLists) {
    const data = await db.collection("users").doc(user.uid).get();
    if (data.data()) {
      const { feed_access, isProfesional } = data.data()
      if (feed_access && isProfesional && isProfesional === true) {
        if (feed_access.isRealtimeNasdaqAccess === "YES") {
          totalProfessionalRealtime += 1
        }
        if (feed_access.isIndiceAccess === true) {
          totalProfessionalIndice += 1
        }
      } else if (feed_access && isProfesional && isProfesional === false) {
        if (feed_access.isRealtimeNasdaqAccess === "YES") {
          totalNonProfessionalRealtime += 1
        }
        if (feed_access.isIndiceAccess == true) {
          totalNonProfessionalIndice += 1
        }
      }
    }
  }

  res.json({
    indice_access: {
      non_professional: totalNonProfessionalIndice,
      professional: totalProfessionalIndice
    },
    realtime_nasdaq_access: {
      non_professional: totalNonProfessionalRealtime,
      professional: totalProfessionalRealtime
    }
  })
})

// stripe - fetch user subscription and fix
app.get("/fetch_user_subscription", async (req, res) => {
  if (process.env.DISABLE_CRON == "true") {
    res.send("disabled");
    return;
  }
  let { query } = req;
  if (query.token != "XXX") {
    res.send("fail");
    return;
  }

  if (query.uid && query.uid.length > 0) {
    console.log(query.uid);
  } else {
    res.send("failed, no user");
    return;
  }

  var updateSubscription = false;
  if (query.updatesub && query.updatesub === "true") {
    console.log(query.updatesub);
    updateSubscription = true;
  }

  const user = await admin.auth().getUser(query.uid);

  var sub;

  if (user.customClaims && !isEmpty(user.customClaims)) {
    const { subscription_id, customer_id } = user.customClaims
    if (subscription_id) {
      const subscription = await stripe.subscriptions.retrieve(
          subscription_id
      );
      const activesub = await stripe.subscriptions.list({
        customer: customer_id,
      });
      const customerData = await stripe.customers.retrieve(
          customer_id
      );

      sub = {user: user, sub: subscription, active_sub: activesub, customer: customerData};

      try {
        if (subscription.status === "active") {
          console.log("This account is active");
        } else if (subscription && subscription.cancel_at_period_end === true &&
            (subscription.status === "canceled" && moment(subscription.canceled_at, "DD-MM-YYYY").isAfter(moment("01-01-2021", "DD-MM-YYYY"), "day"))
        ) {
          console.log("found canceled subscription");

          if (updateSubscription) {
            if (customerData && customerData.invoice_settings && !customerData.invoice_settings.default_payment_method && subscription.default_payment_method) {
              await stripe.customers.update(
                  customer_id,
                  { invoice_settings: { default_payment_method: subscription.default_payment_method } }
              );
            }


            console.log("attempting to create sub");
            const newSubscription = await stripe.subscriptions.create({
              customer: customer_id,
              items: [{ plan: planId }],
              expand: ["latest_invoice.payment_intent"],
              coupon: couponIdFree,
            });
            console.log("new subscription ---", newSubscription)

            sub = {...sub, new_sub: newSubscription}

            await admin.auth().setCustomUserClaims(user.uid, {
              customer_id,
              subscription_id: newSubscription.id,
            });

            let docRef = db.collection("users").doc(user.uid);
            await docRef.update({
              customerId: customer_id,
              subscriptionId: newSubscription.id,
              subscriptionStatus: newSubscription.status
            });
          }
        } else if (sub && sub.sub && sub.sub.cancel_at_period_end === true && sub.sub.status != "canceled") {

          console.log("not canceled yet but set to cancel");

          if (updateSubscription) {
            const updatedSubscription = await stripe.subscriptions.update(subscription.id, {
              cancel_at_period_end: false
            });
            console.log("updatedSubscription---", updatedSubscription)
            sub = {...sub, updated_sub: updatedSubscription}

            let docRef = db.collection("users").doc(user.uid);
            await docRef.update({
              subscriptionStatus: updatedSubscription.status
            });
          }
        } else {
          console.log("This account should stay canceled");
        }

      } catch (error) {
        console.error(user.uid, "---", error)
      }
    }
  }
  res.send({sub: sub});
});

app.get("/test", async (req, res) => {
  const result = await edgar.test();
  res.send(result);
});

app.use(middleware.errorHandler);

app.listen(process.env.PORT, () => {
  console.log(`listening on ${process.env.PORT}`)
});
