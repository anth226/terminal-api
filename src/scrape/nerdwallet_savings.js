import axios from 'axios';
//import cheerio from 'cheerio';

const s3Savings = "https://terminal-scrape-data.s3.amazonaws.com/savings/accounts.json";

export async function getSavingsAccounts() {
  try {
    const response = await axios.get(s3Savings);
    return response.data;
  } catch (error) {
    console.error(error);
  }
}

//const url = 'https://www.nerdwallet.com/best/banking/savings-accounts'

/*
const fetchDataSavingsAccounts = async () => {
    const result = await axios.get('https://www.nerdwallet.com/best/banking/savings-accounts');
    return cheerio.load(result.data);
};

export async function getSavingsAccountsList() {
    let data = []
    const $ = await fetchDataSavingsAccounts();

    $('table').first().find('tr').each(function(idx, element) {
        //console.log($(element).text().trim())
        //console.log($(element).find("a").attr("href"));
        let firstCol = $(element).find("td").first();
        let bankImg = firstCol.find("img").attr("src");
        let bankName = firstCol.find("p").text();

        let apyCol = $(element).find("td:nth-child(3)");
        let apy = apyCol.find("p").first().text();
        let balance = apyCol.find("p").last().text();

        let link = $(element).find("td").last().find("a").attr("href")

        const account = {
            name: bankName,
            img: bankImg,
            apy: apy,
            balance: balance,
            link: link,
        }

        data.push(account);
    })

    return data
}
*/
