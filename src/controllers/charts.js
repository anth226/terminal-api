import { C_CHART, C_CHART_LD, C_CHART_CURRENT, connectChartCache } from './../redis';

const ChartsController = {
  getSymbolChart: async (req, res, next) => {
    let chartsCache = connectChartCache();
    const symbol = req.params.symbol;
    let ldChart = false;
    let data, minute, parsedChart;
    let chart = {};

    try {
      data = await chartsCache.get(`${C_CHART}${symbol}`);

      if (!data) {
        data = await chartsCache.get(`${C_CHART_LD}${symbol}`);
        if (data) {
          ldChart = true;
        }
      }

      if (!ldChart) {
        minute = await chartsCache.get(`${C_CHART_CURRENT}${symbol}`);
      }

      if (data) {
        let parsedChartData = [];
        parsedChart = await JSON.parse(data);
        let candies = parsedChart.data;
        if (candies.length > 0) {
          for (let i in candies) {
            let candy = await JSON.parse(candies[i]);
            parsedChartData.push(candy);
          }
          if (minute) {
            let parsedMinute = JSON.parse(minute);
            parsedChartData.push(parsedMinute);
          }
        }
        parsedChart.data = parsedChartData;
      }

      if (parsedChart) {
        chart = parsedChart;
        if (ldChart) {
          chart.ld_chart = true
        }
      }

      return res.send({ chart: chart });
    } catch (e) {
      return res.send({ chart: null });
    }
  }
};

export default ChartsController;