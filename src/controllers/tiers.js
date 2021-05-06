import db from "../db";

export const displayActiveTierAndModule = async () => {
  return await db(`
  SELECT t.name tier_name, string_agg(fm.name,', ') module_names, t.type tier_type, t.price tier_price
  FROM tiers t,feature_module fm, tiers_feature_module tfm
  WHERE t.id=tfm.tier_id AND fm.id=tfm.feature_module_id AND t.is_active = 'y' AND t.type IN ('a','m') GROUP BY t.name, t.type, t.price`);
};

export async function getTier(id) {

  let result = await db(`
        SELECT *
		    FROM tiers
		    ${id ? `WHERE id = ${id}` : ''}
		`);
		
  return result;
}
