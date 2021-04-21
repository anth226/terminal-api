import chartsCache, { C_CHART, C_CHART_LD, C_CHART_CURRENT } from './../chartsCache';

const ChartsController =  {
    getSymbolChart: async (req, res, next)=> {
        const symbol = req.params.symbol;
        let ldChart = false;
        let data, minute, parsedChart, parsedCurrent;
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
                parsedChart = await JSON.parse(data);
            }
            if (minute) {
                parsedCurrent = await JSON.parse(minute);
            }

            if (parsedChart) {
                chart = parsedChart;
                if (ldChart) {
                    chart.ld_chart = true
                }
            }
            if (parsedCurrent) {
                chart.minute = parsedCurrent
            }
            return res.send({chart: chart});
        } catch (e) {
            return res.send({chart: null});
        }
    }
};

export default ChartsController;