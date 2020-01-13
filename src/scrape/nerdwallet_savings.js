import axios from 'axios';
import cheerio from 'cheerio';

const url = 'https://www.nerdwallet.com/best/banking/savings-accounts'

const fetchDataSavingsAccounts = async () => {
    const result = await axios.get('https://www.nerdwallet.com/best/banking/savings-accounts');
    return cheerio.load(result.data);
};

export async function getSavingsAccountsList() {
    let data = []
    const $ = await fetchDataSavingsAccounts();

    $('.B6cJf').first().find('tr').each(function(idx, element) {
        //console.log($(element).text().trim())
        //console.log($(element).find("a").attr("href"));
        console.log($(element).find("picture").attr("src"));
        const account = {
            name: ($(element).find("div ._11bDt").text().trim())
        }
        //console.log("----")
        //console.log($(element).find("._2WhY_").text().trim())
        //data.push($(element).text().trim())
    })

    return data
}

