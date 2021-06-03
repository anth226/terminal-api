import db from "../db";

export const displayActiveTierAndModule = async () => {
  return await db(`
  SELECT t.name tier_name, string_agg(fm.name,', ') module_names, t.type tier_type, t.price tier_price
  FROM tiers t,feature_module fm, tiers_feature_module tfm
  WHERE t.id=tfm.tier_id AND fm.id=tfm.feature_module_id AND t.is_active = 'y' AND t.type IN ('a','m') GROUP BY t.name, t.type, t.price`);
};
export const displayAssignFeatureAndModules = async (id) => {
  let types_map = {
    a: "Add-on",
    c: "Custom",
    m: "Marketing",
    e: "Enterprise"
  };
  let result = await db(`
    SELECT t.id tier_id, t.name tier_name, t.price tier_price, t.is_active is_tier_active, t.type tier_type, t.created_at tier_created_date, string_agg(distinct tf.feature_id::TEXT,', ') feature_ids, string_agg(distinct feature_module_id::TEXT,', ') module_ids
    FROM tiers t
    LEFT JOIN tiers_feature tf
    ON t.id=tf.tier_id
    LEFT JOIN tiers_feature_module tfm
    ON t.id=tfm.tier_id ${id ? `WHERE t.id = ${id}` : ''} GROUP BY t.id, t.name, t.price, t.is_active, t.type, t.created_at`
  );
  let result_string = JSON.parse(JSON.stringify(result).replace(/\b(?:a|c|m|e)\b/gi, matched => types_map[matched]));
  return result_string;
};

export const createTier = async (name, type, isActive, price) => {

  let query = {
    text:
      "INSERT INTO tiers (name, created_at, type, is_active, price) VALUES ($1, now(), $2, $3, $4) RETURNING *",
    values: [name, type, isActive, price],
  };

  let result = await db(query);
  return result;
};


export const updateTier = async (id, name, type, isActive, price) => {
  const result = await db(`
    UPDATE tiers 
    SET id = ${id}
		${name ? `, name = '${name}'` : ''}
		${type ? `, type = '${type}'` : ''}
		${isActive ? `, is_active = '${isActive}'` : ''}
    ${price ? `, price = ${price}` : ''}
    WHERE id=${id}
		`);

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

export async function checkTierFeature(id) {

  let result = await db(`
        SELECT *
		    FROM tiers_feature
		    WHERE tier_id = ${id}
		`);

  return result;
}

export async function checkTierFeatureModule(id) {

  let result = await db(`
        SELECT *
		    FROM tiers_feature_module
		    WHERE tier_id = ${id}
		`);

  return result;
}