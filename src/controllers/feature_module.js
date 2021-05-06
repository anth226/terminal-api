import db from "../db";

export const getAllFeatureModule = async () => {
  return await db(`SELECT json_agg(name) AS feature_module_name  FROM feature_module`);
};