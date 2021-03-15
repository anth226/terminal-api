import db from "../db";
import { orderBy } from "lodash";


export const getHoldingsByCik = async (cik) => {
  const result = await db(`
    SELECT json_holdings FROM cik_holdings WHERE cik = '${cik}'
  `)
  if (result && result.length > 0) {
    let holdings = result[0].json_holdings;
    let sorted = orderBy(holdings, ["portfolio_percent"], ["desc"]);
    return sorted;
  }

  return null;
}