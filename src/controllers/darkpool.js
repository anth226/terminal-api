export async function getSnapshot() {
  return {
    flow_sentiment: "Bullish",
    pull_to_call: 0.792,
    call_flow: 932140,
    put_flow: 738147,
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

export async function getTable() {
  let options = [];
  for (let i = 0; i < 20; i++) {
    options.push({
      day: "12/20/2020",
      time: "04:14:47 PM",
      composite_ticker: "AAPL:US",
      name: "Apple Inc",
      spot: "369.77",
      size: "160",
      price: "$122.60",
    });
  }
  return options;
}
