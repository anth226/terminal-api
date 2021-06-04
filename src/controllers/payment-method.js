import db from "../db";

export async function createPaymentMethod(cardName, lastFourDigits, lastPaymentAmount, lastPaymentDate, isPrimary, userId) {
    const query = {
        text: "INSERT INTO payment_methods (card_name, last_four_digits, last_payment_amount, last_payment_date, is_primary, user_id) VALUES ($1, $2,  $3, $4, $5, $6)",
        values: [cardName, lastFourDigits, lastPaymentAmount, lastPaymentDate, isPrimary, userId],
    }

    return await db(query)
}

export async function getPaymentMethods(userId) {
    return await db(`SELECT * FROM payment_methods WHERE user_id='${userId}'`);
}