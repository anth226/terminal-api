import axios from 'axios';

export function getSources(apiKey){
    let sources = axios.get(`https://newsapi.org/v2/sources?language=en&apiKey=${apiKey}`)
        .then(function(res) {
            return res
        }).catch(function(err){
            return err
        })

        // sources.then(data => console.log(data.data))
        return sources.then((data) => data.data)
}


//export function getArticles(apiKey) {
//}

