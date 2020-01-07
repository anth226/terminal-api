import axios from 'axios';

export function getGainers() {
    let gainers = axios.get(`https://api.polygon.io/v2/snapshot/locale/us/markets/stocks/losers?apiKey=${POLYGON_API_KEY}`)
        .then(function(res) {
            return res
    }).catch(function(err){
            return res
    })

    return gainers
}

//export function getLosers() {

    //}
//

