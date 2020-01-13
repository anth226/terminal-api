import axios from 'axios';
import cheerio from 'cheerio';

const siteUrl = "https://finviz.com/";
const insiderPage = "https://finviz.com/insidertrading.ashx"

const fetchDataAllInsider = async () => {
    const result = await axios.get(insiderPage);
    return cheerio.load(result.data);
};

export async function getAllInsider()  {
    let data = []

    const $ = await fetchDataAllInsider();

    $('.body-table tr td').each(function(idx, element) {
        data.push($(element).text().trim())
    });

    data = data.slice(10,)

    let insiderArrays = [], chunkSize = 10;

    while (data.length > 0) {
        insiderArrays.push(data.splice(0, chunkSize));
    }


    return insiderArrays;
}

const companyPage = "https://finviz.com/quote.ashx?t="

const fetchDataCompany = async (ticker) => {
    const result = await axios.get(companyPage + ticker);
    return cheerio.load(result.data);
};

export async function getCompanyRatings(ticker) {
    let data = []

    const $ = await fetchDataCompany(ticker);

    $('table.fullview-ratings-outer td.fullview-ratings-inner tr').each(function(idx, element) {
        data.push($(element).text())
    });

    let splitData = []
    for (let item of data) {
        let colData = item.split(/\n/)
        //console.log(colData)
        splitData.push(colData)
    }

    let clean = [];
    for (let row of splitData) {
        let date = row[0].slice(0, 9)
        let position = row[0].slice(9, )
        row.splice(0,0, date)
        row.splice(1,0, position)
        row.splice(2, 1)
        clean.push(row)
    }

    return clean;
}


// SCRAPE FINANCIAL RATIOS
export async function getCompanyMetrics(ticker) {
    let data = []

    const $ = await fetchDataCompany(ticker);

    $('table.snapshot-table2 tr.table-dark-row').each(function(idx, element) {
        console.log($(element).text())
        data.push($(element).text())
    });

    return data
}


