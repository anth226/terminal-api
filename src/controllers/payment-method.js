import db from "../db";

export async function createPaymentMethod(cardName, lastFourDigits, lastPaymentAmount, lastPaymentDate, isPrimary) {
    const query = {
        text: "INSERT INTO payment_methods (card_name, last_four_digits, last_payment_amount, last_payment_date, is_primary) VALUES ($1, $2,  $3, $4, $5)",
        values: [cardName, lastFourDigits, lastPaymentAmount, lastPaymentDate, isPrimary],
    }

    return await db(query)
}

export async function getPaymentMethods() {
    return await db("SELECT * FROM payment_methods");
}