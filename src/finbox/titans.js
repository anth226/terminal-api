import axios from 'axios';

export async function getPortfolios(investor_type, ...sectors) {
    let sectorsArr = sectors[0].split(",")
    let cleanInvestorType = investor_type.charAt(0).toUpperCase() + investor_type.substring(1);
    let cleanSectors = [];

    for (let s of sectorsArr) {
        let capitalized = s.charAt(0).toUpperCase() + s.substring(1)
        cleanSectors.push(capitalized)
    }

    let paramFilters = {"filters":{"investor_types":[cleanInvestorType],"sectors": cleanSectors},"limit":30,"skip":0}

    let portfolios = axios.post('https://makeshift.finbox.com/v4/ideas/query', paramFilters)
    .then(function(res) {
        console.log(res)
        return res
    }).catch(function(err) {
        console.log(err)
        return err
    })

    // console.log(portfolios.then((data) => data.data))
    return portfolios.then((data) => data.data)

}
// {"filters":{"investor_types":["Activist Investor"]},"limit":30,"skip":0}
