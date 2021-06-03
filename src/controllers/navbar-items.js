import db from "../db";

export const displayAssignFeatureToItem = async (id) => {
    return await db(`
    SELECT nil.id, nil.name, nil.display_order, nil.is_active , string_agg(distinct nilf.feature_id::TEXT,', ') feature_ids
    FROM navbar_item_list nil
    LEFT JOIN navbar_item_list_feature nilf
    ON nil.id=nilf.navbar_item_list_id  ${id ? `WHERE nil.id = ${id}` : ''} GROUP BY nil.id, nil.name, nil.display_order, nil.is_active`);
};
export const createNavbarItem = async (name, order) => {
    let query = {
      text:
        "INSERT INTO navbar_item_list (name, display_order) VALUES ($1, $2) RETURNING *",
      values: [name, order],
    };
  
    let result = await db(query);
    return result;
};
export const updateNavbarItem = async (id, name, order, is_active) => {
    const result = await db(`
    UPDATE navbar_item_list 
    SET id = ${id}
        ${name ? ` name = '${name}'` : ''}
		${order ? `, display_order = '${order}'` : ''}
		${is_active ? `, is_active = '${is_active}'` : ''}
    WHERE id=${id} RETURNING *`);
    return result;
};
export const deleteNavbarItem = async (id, name, order, is_active) => {
    const result = await db(`
    UPDATE navbar_item_list 
    SET id = ${id}
        ${name ? ` name = '${name}'` : ''}
		${order ? `, display_order = '${order}'` : ''}
		${is_active ? `, is_active = '${is_active}'` : ''}
    WHERE id=${id} RETURNING *`);
    return result;
};
export async function getNavbarItem(id) {
    let result = await db(`
        SELECT *
            FROM navbar_item_list
            ${id ? `WHERE id = ${id}` : ''}
        `);
    return result;
};