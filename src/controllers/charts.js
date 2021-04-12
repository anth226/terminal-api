import chartsCache, { C_CHART, C_CHART_LD } from './../chartsCache';

const ChartsController =  {
    getSymbolChart: async (req, res, next)=> {
        const symbol = req.params.symbol;
        let ldChart = false;

        try {
            let data = await chartsCache.get(`${C_CHART}${symbol}`);

            if (!data) {
                data = await chartsCache.get(`${C_CHART_LD}${symbol}`);
                if (data) {
                    ldChart = true;
                }
            }

            let parsedChart = await JSON.parse(data);

            if (parsedChart && ldChart) {
                parsedChart.ld_chart = true
            }
            return res.send({chart: parsedChart});
        } catch (e) {
            return res.send({chart: null});
        }
    }
};

export default ChartsController;