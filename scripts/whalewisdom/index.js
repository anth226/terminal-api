import "dotenv/config";
const whalewisdom = require("./whalewisdom");

(async () => {
  // await whalewisdom.seedInstitutions();
  await whalewisdom.fetchHoldings();

  // 0001067983;
})();
