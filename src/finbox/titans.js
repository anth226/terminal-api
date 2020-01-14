import axios from 'axios';

export async function getPortfolios(investor_type) {
    let portfolio = axios.post('https://makeshift.finbox.com/v4/ideas/query', {
        filters: {
            investor_types: [investor_type],
            limit: 100,
            skip: 0
        }
    })
    .then(function(res) {
        return res
    }).catch(function(err) {
        return err
    })

    return portfolio.then((data) => data.data)

}
// {"filters":{"investor_types":["Activist Investor"]},"limit":30,"skip":0}
