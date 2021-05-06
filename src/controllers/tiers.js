import db from "../db";

export const displayActiveTierAndModule = async () => {
  return await db(`
  SELECT t.name tier_name, fm.name module_name, t.type tier_type
  FROM tiers t,features fm, tiers_feature_module tfm
  WHERE t.id=tfm.tier_id AND fm.id=tfm.feature_module_id AND t.is_active = 'y' AND t.type IN ('a','m')`);
};

export async function getTier(id) {

  let result = await db(`
        SELECT *
		    FROM tiers
		    ${id ? `WHERE id = ${id}` : ''}
		`);
		
  return result;
}
