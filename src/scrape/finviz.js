import axios from 'axios';
import cheerio from 'cheerio';

const siteUrl = "https://finviz.com/";
const insiderPage = "https://finviz.com/insidertrading.ashx"

const fetchData = async () => {
	const result = await axios.get(insiderPage);
	return cheerio.load(result.data);
};

const tickers = new Set();
const owners = new Set();
const relationships = new Set();
const dates = new Set();
const transactions = new Set();
const costs = new Set();
const numShares = new Set();
const values = new Set();


export async function getAllInsider()  {
	let data = []

	const $ = await fetchData();

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

