import db from "../db";
import db1 from "../db1";


export const createFeature = async (name) => {
  let query = {
    text:
      "INSERT INTO feature_module (name, created_on) VALUES ($1, now())",
    values: [name],
  };

  let result = await db(query);

  return result;
};


export const updateFeature = async (id, name) => {
  let query = {
    text:
      "UPDATE feature_module SET name = ($1) WHERE id=($2)",
    values: [name, id],
  };

  let result = await db(query);

  return result;
};


export const deleteFeature = async (id, name) => {
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


export async function getFeature(id) {

  let result = await db(`
        SELECT *
		    FROM feature_module
		    ${id ? `WHERE id = ${id}` : ''}
		`);
		
  return result;
}


export async function getFeatureByName(name) {

  let result = await db(`
        SELECT *
		    FROM feature_module WHERE name = '${name}'
		`);
		
  return result;
}
