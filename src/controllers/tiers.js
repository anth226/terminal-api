import db from "../db";

export const displayActiveTierAndModule = async () => {
  return await db(`
  SELECT t.name tier_name, string_agg(fm.name,', ') module_names, t.type tier_type, t.price tier_price
  FROM tiers t,feature_module fm, tiers_feature_module tfm
  WHERE t.id=tfm.tier_id AND fm.id=tfm.feature_module_id AND t.is_active = 'y' AND t.type IN ('a','m') GROUP BY t.name, t.type, t.price`);
};

export const createTier = async (name, type, isActive, price) => {

  let query = {
    text:
      "INSERT INTO tiers (name, created_at, type, is_active, price) VALUES ($1, now(), $2, $3, $4)",
    values: [name, type, isActive, price],
  };

  let result = await db(query);

  return result;
};


export const updateTier = async (id, name, type, isActive, price) => {
  let query = {
    text:
      "UPDATE tiers SET name = ($1), type = ($2), is_active = ($3), price = ($4) WHERE id=($5)",
    values: [name, type, isActive, price, id],
  };

  let result = await db(query);

  return result;
};


export const deleteTier = async (id, name) => {
  let checkResult = await db(`
    SELECT *
		FROM tiers WHERE id = ${id} AND name = '${name}'
  `);
    
  if (checkResult.length > 0) {
    let query = {
      text:
        "DELETE FROM tiers WHERE id=($1) AND name=($2)",
      values: [id, name],
    };

    let result = await db(query);

    let checkTierFeatureResult = await db(`
      SELECT *
      FROM tiers_feature WHERE tier_id = ${id}
    `);

    if (checkTierFeatureResult.length > 0) {
      let checkTierFeatureQuery = {
        text:
          "DELETE FROM tiers_feature WHERE tier_id=($1)",
        values: [id],
      };

      let checkTierFeatureResult = await db(checkTierFeatureQuery);
    }

    return true;
  } else {
    return false;
  }
  
};


export async function getTier(id) {

  let result = await db(`
        SELECT *
		    FROM tiers
		    ${id ? `WHERE id = ${id}` : ''}
		`);
		
  return result;
}


export async function getTierByName(name) {

  let result = await db(`
        SELECT *
		    FROM tiers WHERE name = '${name}'
		`);
		
  return result;
}
