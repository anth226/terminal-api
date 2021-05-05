import db from "../db";

export const displayActiveTierAndModule = async () => {
  return await db(`
  SELECT t.name tier_name, fm.name module_name, t.type tier_type
  FROM tiers t,feature_module fm, tiers_feature_module tfm
  WHERE t.id=tfm.tier_id AND fm.id=tfm.feature_module_id AND t.is_active = 'y' AND t.type IN ('a','m')`);
};
