import db from "../db";

export async function createMembershipPlan(title, price, note) {
    const query = {
        text: "INSERT INTO membership_plans (plan_title, plan_price, note) VALUES ($1, $2,  $3)",
        values: [title, price, note],
    }

    return await db(query)
}

export async function getMembershipPlans() {
    return await db("SELECT * FROM membership_plans");
}