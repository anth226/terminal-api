import "dotenv/config";
import express from "express";
import firebase from "firebase";
import admin from "firebase-admin";
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
import * as holdings from "./intrinio/get_holdings_data";
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
import * as performance from "./controllers/performance";

import * as search from "./controllers/search";
import * as titans from "./controllers/titans";
import * as companies from "./controllers/companies";
import * as zacks from "./controllers/zacks";
import * as cannon from "./controllers/cannon";
import * as sendEmail from "./sendEmail";
import bodyParser from "body-parser";
import winston, { log } from "winston";
import Stripe from "stripe";

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

// init firebase
const serviceAccount = require("../tower-93be8-firebase-adminsdk-o954n-87d13d583d.json");
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://tower-93be8.firebaseio.com",
});

// firebase db
const db = admin.firestore();

// init stripe
const couponId = process.env.STRIPE_COUPON_ID;
const planId = process.env.STRIPE_PLAN_ID;
const stripeKey = process.env.STRIPE_API_KEY;
const endpointSecret = process.env.STRIPE_ENDPOINT_SECRET;

const stripe = Stripe(stripeKey);

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
    ? `http://${process.env.FRONTEND_URL}:${process.env.FRONTEND_PORT}`
    : `${process.env.ENDPOINT_FRONTEND}`;

// configure CORS
var corsOptions = {
  origin: `${apiURL}`,
  optionsSuccessStatus: 200, // some legacy browsers (IE11, various SmartTVs) choke on 204
  credentials: true,
};

var rawBodySaver = function (req, res, buf, encoding) {
  if (buf && buf.length) {
    req.rawBody = buf.toString(encoding || "utf8");
  }
};

// set up middlewares
const app = express();
app.use(cors(corsOptions));
app.use(cookieParser());
//app.use(express.json());
app.use(bodyParser.json({ verify: rawBodySaver }));
app.use(bodyParser.urlencoded({ verify: rawBodySaver, extended: true }));
app.use(bodyParser.raw({ verify: rawBodySaver, type: "*/*" }));

app.use(middleware.requestHandler);
app.use(middleware.errorHandler);
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

app.post("/hooks", async (req, res) => {
  const sig = req.headers["stripe-signature"];

  let evt;

  try {
    evt = stripe.webhooks.constructEvent(req.rawBody, sig, endpointSecret);
  } catch (err) {
    logger.error("Stripe Checkout Webhook Error (constructEvent): ", err);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (evt.type === "checkout.session.completed") {
    logger.info("-- checkout session completed --");

    if (evt.data.object.mode == "subscription") {
      console.log("hit subscription type checkout session");

      const subscriptionId = evt.data.object.subscription;
      const customerId = evt.data.object.customer;
      const userId = evt.data.object.client_reference_id;
      const email = evt.data.object.customer_email;

      // FIREBASE + FIRESTORE
      try {
        // Add user data to db
        let docRef = db.collection("users").doc(userId);
        let setUser = await docRef.set({
          userId: userId,
          customerId: customerId,
          subscriptionId: subscriptionId,
          email: email,
        });

        // Set custom auth claims with Firebase
        await admin.auth().setCustomUserClaims(userId, {
          customer_id: customerId,
          subscription_id: subscriptionId,
        });

        sendEmail.sendSignupEmail(email);
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
        const subscription = await stripe.subscriptions.update(subscriptionId, {
          default_payment_method: paymentMethodId,
        });
      } catch (err) {
        logger.error("Stripe Checkout SetupIntent Webhook Error: ", err);
        return res.status(400).send(`Webhook Error: ${err.message}`);
      }
    }
  } else if (evt.type === "invoice.payment_failed") {
    // email customer to let them know their payment failed
    // and their subscription will be canceled if they dont update payment info
    const customer = await stripe.customers.retrieve(evt.data.object.customer);
    sendPaymentFailedEmail(customer.email);
  }

  res.json({ success: true });
});

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

  if (!req.body.customer_id) {
    // create checkout session for new customer
    const session = await stripe.checkout.sessions.create({
      customer_email: email,
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
      success_url: apiURL + "/success?session_id={CHECKOUT_SESSION_ID}",
      cancel_url: apiURL,
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
      success_url: apiURL + "/account?s=1",
      cancel_url: apiURL,
    });
    res.json({ session: session });
  }
});

// index
app.get("/", async (req, res) => {
  res.send("hello");
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
    if (decodedToken.customer_id) {
      // check if customer id is in decoded claims
      console.log("customer is in decoded claims!!!");  
      console.log(decodedToken.customer_id);
      customerId = decodedToken.customer_id;
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
      let firestoreData = doc.data();
      // retrieve customer data from stripe using customer id from firestore
      customerId = firestoreData.customerId;
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
    if (customer.subscriptions.total_count < 1) {
      throw {
        terminal_error: true,
        error_code: "SUBSCRIPTION_CANCELED",
        message:
          "Your subscription has been canceled, please contact support to update your subscription.",
      };
    }
    // Check if customer has paid for their subscription
    if (customer.subscriptions.data[0].canceled_at) {
      console.log("HIT CANCELED");
      // Bounce to payment page for now
      // we may need to handle this diferently because the customer actually exists
      // update existing customers payment method and re-charge rather than sign up new customer
      //customer.subscriptions.data[0].id
      // if(customer.subscriptions.total_count > 0) {
      //   throw { terminal_error: true, error_code:"USER_PAYMENT_NEEDED", message: "Payment needed", customer_id: customerId, subscription_id: customer.subscriptions.data[0].id };
      // } else {
      //   throw { terminal_error: true, error_code:"NO_SUBSCRIPTION", message: "We found your customer record but not your subscription, please contact support." };
      // }
      throw {
        terminal_error: true,
        error_code: "SUBSCRIPTION_CANCELED",
        message:
          "Your subscription has been canceled, please contact support to update your subscription.",
      };
    }

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

app.use("/profile", checkAuth);
app.get("/profile", async (req, res) => {
  const customer = await stripe.customers.retrieve(
    req.terminal_app.claims.customer_id,
    {
      expand: [
        "subscriptions.data.default_payment_method",
        "invoice_settings.default_payment_method",
      ],
    }
  );

  let paymentMethod = customer.subscriptions.data[0].default_payment_method;
  if (paymentMethod == null) {
    paymentMethod = customer.invoice_settings.default_payment_method;
  }
  res.json({
    email: customer.email,
    delinquent: customer.delinquent,
    card_brand: paymentMethod.card.brand,
    card_last4: paymentMethod.card.last4,
    customer_id: req.terminal_app.claims.customer_id,
    subscription_id: customer.subscriptions.data[0].id,
    customer_since: customer.subscriptions.data[0].created,
    amount: customer.subscriptions.data[0].plan.amount / 100.0,
    trial_end: customer.subscriptions.data[0].trial_end,
    next_payment: customer.subscriptions.data[0].current_period_end,
  });
});

// upadte profile
app.post("/profile", async (req, res) => {
  console.log("req.body", req.body);
  res.json({
    success: true,
  });
});

// save user details when signup
app.post("/signup", async (req, res) => {
  const { userId, email, firstName, lastName } = req.body;
  try {
    const docRef = db.collection("users").doc(userId);
    await docRef
      .set({
        userId,
        email,
        firstName,
        lastName,
      })
      .then((doc) => {
        if (!doc.exists) {
          res.json({
            success: true,
            user: doc.data(),
          });
        } else {
          res.json({
            success: false,
            message: "user exists!",
          });
        }
      });
  } catch (error) {
    res.json({
      success: false,
      user: null,
    });
  }
});

app.use("/holdings/:symbol", checkAuth);
app.get("/holdings/:symbol", async (req, res) => {
  const holdingsList = await holdings.getETFHoldings(req.params.symbol);
  res.send(holdingsList);
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
  const companyFundamentals = await getCompanyData.lookupCompany(
    companyAPI,
    req.params.symbol
  );
  res.send(companyFundamentals);
});

app.use("/company/:symbol/owners", checkAuth);
app.get("/company/:symbol/owners", async (req, res) => {
  const result = await companies.getOwners(req.params.symbol);
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

app.use("/security/:symbol", checkAuth);
app.get("/security/:symbol", async (req, res) => {
  const companyFundamentals = await getSecurityData.lookupSecurity(
    securityAPI,
    req.params.symbol
  );
  res.send(companyFundamentals);
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
  const lastPrice = await getSecurityData.getSecurityLastPrice(
    req.params.symbol
  );
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
  const results = await search.searchCompanies(companyAPI, query, securityAPI);
  res.send(results);
});

app.use("/search-sec/:query", checkAuth);
app.get("/search-sec/:query", async (req, res) => {
  const query = req.params.query;
  const results = await search.searchSec(securityAPI, query);
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

// Stocks news api
app.use("/news/market-headlines", checkAuth);
app.get("/news/market-headlines", async (req, res) => {
  // const headlines = await stocksNews.generalMarketNews(
  //   process.env.STOCKS_NEWS_API_KEY
  // );
  // res.send(headlines);

  const headlines = await news.getGeneralMarketNews();
  res.send(headlines);
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

app.use("/company-ratings/:ticker", checkAuth);
app.get("/company-ratings/:ticker", async (req, res) => {
  const companyRatings = await finviz
    .getCompanyRatings(req.params.ticker)
    .then((data) => data);
  res.send(companyRatings);
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
  const accounts = await nerdwalletSavings.getSavingsAccountsList();
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
  const result = await titans.getFollowedTitans(req.terminal_app.claims.uid);
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

// Cannon
app.use("/cannon/mutual_funds/daily_summary", checkAuth);
app.get("/cannon/mutual_funds/daily_summary", async (req, res) => {
  const result = await cannon.get_daily_summary();
  res.send(result);
});

app.listen(process.env.PORT, () =>
  console.log(`listening on ${process.env.PORT}`)
);
