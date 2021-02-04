import optionsDB from './../optionsDB';

export async function getSnapshot() {
  let putSum,
      putFlow,
      putPremTotal,
      callSum,
      callFlow,
      callPremTotal,
      putToCall,
      flowSentiment;

  const result = await optionsDB(`
      (SELECT SUM(contract_quantity) AS flow_count, SUM(prem) AS total_premium, 'C' AS cp FROM options WHERE cp = 'C')
      UNION
      (SELECT SUM(contract_quantity) AS flow_count, SUM(prem) AS total_premium, 'P' AS cp FROM options WHERE cp = 'P')
      ORDER BY cp ASC
      `)

  if (result && result.length > 0) {
    callSum = result[0].flow_count;
    callPremTotal = result[0].total_premium;

    putSum = result[1].flow_count;
    putPremTotal = result[1].total_premium;

    let totalSum = (Number(callSum || 0) + Number(putSum || 0)).toFixed(2);

    putFlow = Number(putSum || 0).toFixed(2) / totalSum;
    callFlow = Number(callSum || 0).toFixed(2) / totalSum;
  }

  if (callSum && putSum) {
    putToCall = Number(putSum).toFixed(2) / Number(callSum).toFixed(2);
  } else if (callSum && !putSum) {
    putToCall = 0.0
  } else if (!callSum && putSum) {
    putToCall = -1.0 // infinite
  }

  if (putToCall && putPremTotal && callPremTotal) {
    // 1.0 = bullish
    // 0.0 = bearish

    // putPrem / callPrem
    // 1000 / 100 = 10

    // putCount / callCount
    // 100 / 10 = 10

    flowSentiment = 1.0;
  }

  return {
    call_count: callSum,
    call_flow: callFlow,
    call_total_prem: callPremTotal,
    put_count: putSum,
    put_flow: putFlow,
    put_total_prem: putPremTotal,
    put_to_call: putToCall,
    flow_sentiment: flowSentiment
  };
}

export async function getSidebar() {
  let options = [];
  for (let i = 0; i < 20; i++) {
    options.push({
      time: "04:14:47 PM",
      ticker: "SPY",
      expiry: "12/31/2020",
      strike: "373",
      calls_puts: "Calls",
      spot: "369.77",
      details: "360 @ 0.75",
      type: "Block",
      prem: "$41k",
      sector: "Technology",
    });
  }
  return options;
}

export async function getOptions() {
  const result = await optionsDB(`
        SELECT time, ticker, exp, strike, cp, spot, contract_quantity, price_per_contract, type, prem
        FROM options
        WHERE to_timestamp(time)::date = (SELECT to_timestamp(time)::date FROM options ORDER BY time DESC LIMIT 1)
        ORDER BY time DESC
        `)
  return result;
}
