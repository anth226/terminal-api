import { C_CHART, C_CHART_LD, connectChartCache } from './../redis';
import moment from "moment";


export const getDelayedChart = async (req) => {
    const symbol = req.params.symbol;
    let chartsCache = connectChartCache();
    let ldChart = false;
    let data, parsedChart;
    let chart = {};

    try {
        data = await chartsCache.get(`${C_CHART}${symbol}`);

        if (!data) {
            data = await chartsCache.get(`${C_CHART_LD}${symbol}`);
            if (data) {
                ldChart = true;
            }
        }

        if (data) {
            let parsedChartData = [];
            parsedChart = await JSON.parse(data);
            let candies = parsedChart.data;
            if (candies.length > 0) {
                let tip = candies[candies.length - 1];
                tip = await JSON.parse(tip);
                let tipTime = moment(tip.openTime, "HH:mm:ss").subtract(15, "minutes");
                for (let i in candies) {
                    let candy = await JSON.parse(candies[i]);
                    let cTime = moment(candy.openTime, "HH:mm:ss");
                    if (cTime.isBefore(tipTime)) {
                        parsedChartData.push(candy);
                    }
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

        return chart;
    } catch (e) {
        return null;
    }
};