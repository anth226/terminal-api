import db from "../db";

export const createFeature = async (name) => {
  let query = {
    text:
      "INSERT INTO features (name, created_on) VALUES ($1, now())",
    values: [name],
  };

  let result = await db(query);

  return result;
};


export const updateFeature = async (id, name) => {
  let query = {
    text:
      "UPDATE features SET name = ($1) WHERE id=($2)",
    values: [name, id],
  };

  let result = await db(query);

  return result;
};


export const deleteFeature = async (id, name) => {
  let checkResult = await db(`
    SELECT *
		FROM features WHERE id = ${id} AND name = '${name}'
  `);
    
  if (checkResult.length > 0) {
    let query = {
      text:
        "DELETE FROM features WHERE id=($1) AND name=($2)",
      values: [id, name],
    };

    let result = await db(query);
    
    return true;
  } else {
    return false;
  }
  
};


export async function getFeature(id) {

  let result = await db(`
        SELECT *
		    FROM features
		    ${id ? `WHERE id = ${id}` : ''}
		`);
		
  return result;
}


export async function getFeatureByName(name) {

  let result = await db(`
        SELECT *
		    FROM features WHERE name = '${name}'
		`);
		
  return result;
}


export const assignToTier = async (tierId, featureId) => {

  let query = {
    text:
      "INSERT INTO tiers_feature (tier_id, feature_id, created_at) VALUES ($1, $2, now())",
    values: [tierId, featureId],
  };

  let result = await db(query);

  return result;
};


export async function getTierFeature(tierId, featureId) {

  let result = await db(`
        SELECT *
		    FROM tiers_feature
		    WHERE tier_id = ${tierId} AND feature_id = ${featureId}
		`);
		
  return result;
}
