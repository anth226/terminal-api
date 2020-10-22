import "dotenv/config";

import Stripe from "stripe";

import { db, admin } from "../services/firebase";
import { stripe } from "../services/stripe";

import * as klaviyo from "./klaviyo";
import * as sendEmail from "../sendEmail";

const plan = process.env.STRIPE_PLAN_ID;
const coupon = process.env.STRIPE_TEST_COUPON_ID;

async function createCustomer() {
  try {
    const user = {
      email: "@portfolioinsider.com",
      password: "warrenbuffet1",
      firstName: "",
      lastName: "",
      phoneNumber: "+1 (333) 333-3333",
      emailVerified: false,
      disabled: false
    };

    // create customer
    const customer = await stripe.customers.create({
      email: user.email,
      name: `${user.firstName} ${user.lastName}`,
      phone: user.phoneNumber
    });

    const customerId = customer.id;

    // create customer subscription
    const subscription = await stripe.subscriptions.create({
      customer: customerId,
      coupon,
      trial_from_plan: true,
      items: [
        {
          plan
        }
      ]
    });
    const subscriptionId = subscription.id;

    const userDb = await admin.auth().createUser({
      email: user.email,
      emailVerified: user.emailVerified,
      password: user.password,
      disabled: user.dasabled
    });

    const docRef = db.collection("users").doc(userDb.uid);

    await docRef.set({
      userId: userDb.uid,
      customerId: customerId,
      subscriptionId: subscriptionId,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      phoneNumber: user.phoneNumber
    });

    sendEmail.sendSignupEmail(user.email);
    await klaviyo.subscribeToList(user.email);

    await admin.auth().setCustomUserClaims(userDb.uid, {
      customer_id: customerId,
      subscription_id: subscriptionId
    });

    process.exit();
  } catch (error) {
    console.log({ error });
    process.exit();
  }
}

(async () => {
  await createCustomer();
})();
