import db from '../db'

const TABLE_NAME = 'membership_plans'

const createNewPlan = async (object) => {
  const {
    planTitle = null,
    planPrice = null,
    note = null,
  } = object

  return await db(`
  INSERT INTO ${TABLE_NAME} 
  (plan_title, 
  plan_price, 
  note)
  VALUES (
    ${planTitle},
    ${planPrice},
    ${note}
  )
  `)
}

const getAll = async () => {
  return await db(`SELECT * FROM ${TABLE_NAME};`)
}

const getById = async (id) => {
  return await db(`SELECT * FROM ${TABLE_NAME} WHERE id = ${Number(id)};`)
}

const updateById = async (object) => {
  const {
    id = null,
    planTitle = null,
    planPrice = null,
    note = null,
  } = object

  if (!id && id !== 0) throw new Error('id is undefined');

  return await db(`
    UPDATE ${TABLE_NAME} SET 
    ${planTitle ? 'cc_4_digit = ' + planTitle + ', ' : ''}
    ${planPrice ? 'expiry = ' + planPrice + ',' : ''}
    ${note ? 'created_at = ' + note + ', ' : ''}
    WHERE user_id = ${Number(id)}
  `)
}

const deleteAll = async () => {
  return await db(`DELETE * FROM ${TABLE_NAME};`)
}

const deleteById = async (id) => {
  return await db(`DELETE * FROM ${TABLE_NAME} WHERE id = ${Number(userId)};`)
}

const membershipPlans = {
  createNewPlan,
  getAll,
  getById,
  updateById,
  deleteAll,
  deleteById
}

export default membershipPlans;