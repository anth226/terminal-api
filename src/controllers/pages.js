import db from "../db";

export const getPages_Institutions = async () =>
  db(`
    SELECT *
    FROM pages_institutions
  `);

export const getPages_Titans = async () =>
  db(`
    SELECT *
    FROM pages_titans
  `);