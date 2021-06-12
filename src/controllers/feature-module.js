import db from "../db";

export const getAllFeatureModule = async () => {
  return await db(`SELECT json_agg(name) AS feature_module_name  FROM feature_module`);
};


export const createFeatureModule = async (name) => {
  let query = {
    text:
      "INSERT INTO feature_module (name, created_on) VALUES ($1, now()) RETURNING *",
    values: [name],
  };

  let result = await db(query);

  return result;
};


export const updateFeatureModule = async (id, name) => {
  let query = {
    text:
      "UPDATE feature_module SET name = ($1) WHERE id=($2) RETURNING *",
    values: [name, id],
  };

  let result = await db(query);

  return result;
};


export const deleteFeatureModule = async (id, name) => {
  let checkResult = await db(`
    SELECT *
		FROM feature_module WHERE id = ${id} AND name = '${name}'
  `);
    
  if (checkResult.length > 0) {
    let query = {
      text:
        "DELETE FROM feature_module WHERE id=($1) AND name=($2)",
      values: [id, name],
    };

    let result = await db(query);
    
    return true;
  } else {
    return false;
  }
  
};


export async function getFeatureModule(id) {

  let result = await db(`
        SELECT *
		    FROM feature_module
		    ${id ? `WHERE id = ${id}` : ''}
		`);
		
  return result;
}


export async function getFeatureModuleByName(name) {

  let result = await db(`
        SELECT *
		    FROM feature_module WHERE name = '${name}'
		`);
		
  return result;
}


export const assignToTier = async (tierId, moduleId) => {

  let query = {
    text:
      "INSERT INTO tiers_feature_module (tier_id, feature_module_id, created_at) VALUES ($1, $2, now()) RETURNING *",
    values: [tierId, moduleId],
  };

  let result = await db(query);

  return result;
};

export const unassignToTier = async (tierId, moduleId) => {

  let query = {
    text:
      "DELETE FROM tiers_feature_module WHERE tier_id = ($1) AND feature_module_id=($2)",
    values: [tierId, moduleId],
  };

  let result = await db(query);

  return result;
};


export async function getTierFeatureModule(tierId, moduleId) {

  let result = await db(`
        SELECT *
		    FROM tiers_feature_module
		    WHERE tier_id = ${tierId} AND feature_module_id = ${moduleId}
		`);
		
  return result;
}

export async function checkTierFeatureModule(moduleId) {

  let result = await db(`
        SELECT *
		    FROM tiers_feature_module
		    WHERE feature_module_id = ${moduleId}
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