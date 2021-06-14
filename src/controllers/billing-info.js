import db from '../db'
import moment from 'moment'

const TABLE_NAME = 'users_payment_info'

const createByUserId = async (object) => {
  const {
    userId = null,
    last4Digit = null,
    expiry = null,
    nameOnCard = null,
    createdAt = moment().format('YYYY-MM-DD HH:mm:ss.ms'),
    updatedAt = null,
    cardName = null,
    lastPaymentAmount = null,
    lastPaymentDate = null,
    isPrimary = false
  } = object

  if (!userId && userId !== 0) throw new Error('userId is undefined');

  return await db(`
  INSERT INTO ${TABLE_NAME} 
  (user_id, 
  cc_4_digit, 
  expiry, 
  name_on_card, 
  created_at, 
  updated_at,
  card_name,
  last_payment_amount, 
  last_payment_date, 
  is_primary)
  VALUES (
    ${Number(userId)},
    ${last4Digit},
    ${expiry},
    ${nameOnCard},
    ${createdAt},
    ${updatedAt},
    ${cardName},
    ${lastPaymentAmount},
    ${lastPaymentDate},
    ${isPrimary}
  )
  `)
}

const getAll = async () => {
  return await db(`SELECT * FROM ${TABLE_NAME} ;`)
}

const getByUserId = async (userId) => {
  console.log({ userId });
  // if (!userId && userId !== 0) throw new Error('userId is undefined');
  return await db(`SELECT * FROM ${TABLE_NAME}  WHERE user_id = ${Number(userId)};`)
}

const updateByUserId = async (object) => {
  const {
    userId = null,
    last4Digit = null,
    expiry = null,
    nameOnCard = null,
    createdAt = null,
    updatedAt = moment().format('YYYY-MM-DD HH:mm:ss.ms'),
    cardName = null,
    lastPaymentAmount = null,
    lastPaymentDate = null,
    isPrimary = false
  } = object

  if (!userId && userId !== 0) throw new Error('userId is undefined');

  return await db(`
    UPDATE ${TABLE_NAME} SET 
    ${userId ? 'user_id = ' + Number(userId) + ', ' : ''}
    ${last4Digit ? 'cc_4_digit = ' + last4Digit + ', ' : ''}
    ${expiry ? 'expiry = ' + expiry + ',' : ''}
    ${nameOnCard ? 'name_on_card = ' + nameOnCard + ', ' : ''}
    ${createdAt ? 'created_at = ' + createdAt + ', ' : ''}
    ${updatedAt ? 'updated_at = ' + updatedAt + ', ' : ''}
    ${cardName ? 'card_name = ' + cardName + ', ' : ''}
    ${lastPaymentAmount ? 'last_payment_amount = ' + lastPaymentAmount + ', ' : ''}
    ${lastPaymentDate ? 'last_payment_date = ' + lastPaymentDate + ',' : ''}
    ${isPrimary ? 'is_primary = ' + isPrimary + ' ' : ''}
    WHERE user_id = ${Number(userId)}
  `)
}

const deleteAll = async () => {
  return await db(`DELETE * FROM ${TABLE_NAME};`)
}

const deleteByUserId = async (userId) => {
  return await db(`DELETE * FROM ${TABLE_NAME} WHERE user_id = ${Number(userId)};`)
}

const billing = {
  createByUserId,
  getAll,
  getByUserId,
  updateByUserId,
  deleteAll,
  deleteByUserId
}

export default billing