import axios from 'axios';

export function generalMarketNews(apiKey) {
    let headlines = axios.get(`https://stocknewsapi.com/api/v1/category?section=general&items=50&token=${apiKey}`)
        .then(function(res) {
        return res
    }).catch(function(err){
        return err
    })

    return headlines.then((data) => data.data)
}