import db from "../db";
const argon2 = require('argon2');
const crypto = require('crypto');
/**
 * 
 * @param {*} email 
 * @param {*} password 
 * @returns record
 */
export const insertUserInDb = async (email, password) => {
    try {
        const hashPassword = await argon2.hash(password, randU32Sync());
        let userByEmailResult = await getUsersByEmail(email);
        if(userByEmailResult.length > 0){
            // If user exist then update user password
            if(userByEmailResult[0].id){
                let updateResult = await db(`
                    UPDATE pi_users
                    SET password = '${hashPassword}'
                    WHERE id = '${userByEmailResult[0].id}' RETURNING id
                `);
                console.log("INFO: Password updated for user id "+updateResult[0].id);
                return updateResult;
            }
        }else{
            // Insert user if not exist in DB
            let queryToInsertUser = {
                text:
                    "INSERT INTO pi_users (email, password) VALUES ($1, $2) RETURNING id",
                values: [email, hashPassword],
            };
            let insertUserResult = await db(queryToInsertUser);
            // map inserted user with PI_USER_ROLES
            if(insertUserResult[0].id){
                let queryToInsertUserRole = {
                    text:
                        "INSERT INTO pi_users_role (user_id, role_id) VALUES ($1, $2) RETURNING id",
                    values: [insertUserResult[0].id, 4],
                };
                let insertUserRoleResult = await db(queryToInsertUserRole);
            }
            console.log("INFO: User added to DB with id "+insertUserResult[0].id);
            return insertUserResult;
        }    
    } catch (error) {
        return error;
    }
};
/**
 * 
 * @param {*} email 
 * @returns record
 */
export const getUsersByEmail = async (email) => {
    let result = await db(`
        SELECT id, email FROM pi_users
        ${email ? `WHERE email = '${email}'` : ''}
    `);
    return result;
};
/**
 * Helper function
 */
function randU32Sync() {
    return crypto.randomBytes(32).readUInt32BE(0, true);
}