import axios from 'axios';

// Convenienve fn for finding all the news sources available
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


// Gets the top headlines for a specified news source
export function getSourceHeadlines(apiKey, source) {
    let headlines = axios.get(`https://newsapi.org/v2/top-headlines?sources=${source}&apiKey=${apiKey}`)
        .then(function(res) {
        return res
    }).catch(function(err){
        return err
    })

    return headlines.then((data) => data.data)
}

export function getHomeHeadlines(apiKey) {
    // let headlines = axios.get(`https://newsapi.org/v2/top-headlines?sources=the-american-conservative,breitbar-news,cnbc,fox-news&apiKey=${apiKey}`)
    let headlines = axios.get(`https://newsapi.org/v2/top-headlines?sources=the-wall-street-journal,cnbc&apiKey=${apiKey}`)
        .then(function(res) {
        return res
    }).catch(function(err){
        return err
    })

    return headlines.then((data) => data.data)
}

