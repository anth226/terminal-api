import {
    connectATSCache,
    connectChartCache,
    connectPriceCache,
} from '../redis';




export const getBuys = async () => {
    let priceCache = connectPriceCache();

    let result = await priceCache.get("STRONGBUYS");

    result = JSON.parse(result);

    for (let buy of result) {
        let lastPrice = await priceCache.get(`NOW:${buy.ticker}`);
        lastPrice = JSON.parse(lastPrice);
        lastPrice = lastPrice.price;
        lastPrice = parseFloat(lastPrice);
        buy.last_price = lastPrice;
    }

    return result;
};