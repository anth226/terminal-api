import "dotenv/config";

import Stripe from "stripe";

export const couponId = process.env.STRIPE_COUPON_ID;
export const couponIdFree = process.env.STRIPE_COUPON_ID_FREE;
export const planId = process.env.STRIPE_PLAN_ID;
export const yearlyPlanId = process.env.STRIPE_YEALY_PLAN_ID;
export const stripeKey = process.env.STRIPE_API_KEY;
export const endpointSecret = process.env.STRIPE_ENDPOINT_SECRET;

// export const endpointSecret = "whsec_VXvhsQM24tPVfEmCemSsSKNB6x3eL0z0";

export const stripe = Stripe(stripeKey);

