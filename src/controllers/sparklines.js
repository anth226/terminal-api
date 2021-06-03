import { C_CHART, C_CHART_LD, connectChartCache } from './../redis';

const sparklines = async (scope, tickers) => {
    let chartsCache = connectChartCache();
    let output = {};
    tickers.forEach( async (ticker) => {
        let data;
        switch(scope) {
            case 'day' : 
                data = await chartsCache.get(`${C_CHART}${ticker}`);
                if (!data) {
                    data = await chartsCache.get(`${C_CHART_LD}${ticker}`);
                    if (data) {
                        ldChart = true;
                    }
                }
            break;
            // case 'month' : 
            default:

            break;
        }
        output[ticker] = JSON.parse(data);
    });
    return output;
}

export default sparklines;