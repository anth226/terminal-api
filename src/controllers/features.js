import db from "../db";

export const createFeature = async (name) => {
  let query = {
    text:
      "INSERT INTO features (name, created_on) VALUES ($1, now()) RETURNING *",
    values: [name],
  };

  let result = await db(query);

  return result;
};


export const updateFeature = async (id, name) => {
  let query = {
    text:
      "UPDATE features SET name = ($1) WHERE id=($2) RETURNING *",
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


export const assignToAssignment = async (table, id, featureId) => {
  let result = await db(`
    INSERT INTO ${table} (${table == 'tiers_feature' ? `tier_id` : `navbar_item_list_id`}, feature_id) VALUES (${id}, ${featureId}) RETURNING *`);
  return result;
};

export const unassignToAssignment = async (table, id, featureId) => {
  let result = await db(`
    DELETE FROM ${table} WHERE ${table == 'tiers_feature' ? `tier_id = ${id}` : `navbar_item_list_id = ${id}`} AND feature_id = ${featureId} RETURNING *`);
  return result;
};


export async function getFeatureAssignment(table, id, featureId) {

  let result = await db(`
        SELECT *
		    FROM ${table}
		    WHERE ${table == 'tiers_feature' ? ` tier_id = ${id} ` : ` navbar_item_list_id = ${id} `}
        AND feature_id = ${featureId}
		`);
		
  return result;
}

export async function checkTierFeature(featureId) {

  let result = await db(`
        SELECT *
		    FROM tiers_feature
		    WHERE feature_id = ${featureId}
		`);
		
  return result;
}



export async function getTier(id) {

  let result = await db(`
        SELECT *
		    FROM tiers
		    ${id ? `WHERE id = ${id}` : ''}
		`);
		
  return result;
}