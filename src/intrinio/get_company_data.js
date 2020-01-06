export function lookupCompany(intrinioApi, ticker) {
    let res =
        intrinioApi.getCompany(ticker)
    .then(function(data) {
        return data;
    })
    .catch(function(error) {
        return error;
    })

    return res;
}

export function companyFundamentals(intrinioApi, ticker){
    const opts = {
        'filedAfter': null, // Date | Filed on or after this date
        'filedBefore': null, // Date | Filed on or before this date
        'reportedOnly': false, // Boolean | Only as-reported fundamentals
        'fiscalYear': null, // Number | Only for the given fiscal year
        'statementCode': null, // String | Only of the given statement code
        'type': null, // String | Only of the given type
        'startDate': null, // Date | Only on or after the given date
        'endDate': null, // Date | Only on or before the given date
        'pageSize': 100, // Number | The number of results to return
        'nextPage': null // String | Gets the next page of data from a previous API call
    }

    let res =
        intrinioApi.getCompanyFundamentals(ticker, opts)
    .then(function(data) {
        return data;
    })
    .catch(function(error) {
        return error;
    })

    return res;

}

export function companyNews(intrinioApi, ticker) {
    const opts = {
        'pageSize': 20, // Number | The number of results to return
        'nextPage': null // String | Gets the next page of data from a previous API call
    };

    let res =
        intrinioApi.getCompanyNews(ticker, opts)
    .then(function(data) {
        return data;
    })
    .catch(function(error) {
        return error;
    })

    return res;
}

export function searchCompanies(intrinioApi, query) {
    const opts = {
        'pageSize': 20, // Number | The number of results to return
    };

    let res =
        intrinioApi.searchCompanies(query, opts)
    .then(function(data) {
        return data;
    })
    .catch(function(error) {
        return error;
    })

    return res;
}

export function searchSec(intrinioApi, query) {
    const opts = {
        'pageSize': 20, // Number | The number of results to return
    };

    let res =
        intrinioApi.searchSecurities(query, opts)
            .then(function(data) {
                return data;
            })
            .catch(function(error) {
                return error;
            })

    return res;
}
