import db from './../navigaDB';
import mainDB from './../db';
import { concat, orderBy } from "lodash";

const defaultExchanges = [
    'AMEX',
    'NASDAQ-MF',
    'NASDAQ-NMS',
    'NASDAQ-OTCBB',
    'NASDAQ-SMALL',
    'NYSE',
    'NYSEArca'
];

const otcExchanges = [
    'OTC-PINK',
    'OTC-QB',
    'OTC-QX',
    'OtherOTC',
];

export async function getNewsResourceID(req, res, next) {
    const id = req.params.id;

    const news = await db(`
        SELECT pi_naviga_news.resource_id
        FROM pi_naviga_news
        WHERE id = '${id}'
    `);

    return res.json({
        resource_id: news[0] && news[0].resource_id
    });
}

export async function getAllNews(req, res, next) {
    let {
        language = 'en',
        limit = 10,
        page = 1,
        include_otc = false,
        exchanges = defaultExchanges,
        goc = 'US',
    } = req.query;

    page = parseInt(page);
    limit = parseInt(limit);
    
    if (typeof exchanges === 'string') {
        exchanges = exchanges.split(',').map(t => t.trim()).filter(Boolean);
    }
    
    if (typeof goc === 'string') {
        goc = goc.split(',').map(t => t.trim()).filter(Boolean);
    }

    if (include_otc) {
        exchanges = [
            ...exchanges,
            ...otcExchanges
        ];
    }

    exchanges = exchanges.map(exchange => `'${exchange}'`).join(',');
    goc = goc.map(country => `'${country}'`).join(',');

    if (page < 1) {
        page = 1;
    }

    const offset = (page - 1) * limit;

    const [total, news] = await Promise.all([
        db(`
            SELECT COUNT(DISTINCT pi_naviga_news.id) as total
            FROM pi_naviga_news
            INNER JOIN pi_naviga_tickers ON pi_naviga_news.id = pi_naviga_tickers.news_id
            WHERE timestamp < NOW()
            ${exchanges.length ? `AND exchange IN (${exchanges})` : ''}
            ${goc.length ? `AND goc IN (${goc})` : ''}
            AND language = '${language}'
        `),
        db(`
            SELECT pi_naviga_news.id, pi_naviga_news.*
            FROM pi_naviga_news
            INNER JOIN pi_naviga_tickers ON pi_naviga_news.id = pi_naviga_tickers.news_id
            WHERE timestamp < NOW()
            ${exchanges.length ? `AND exchange IN (${exchanges})` : ''}
            ${goc.length ? `AND goc IN (${goc})` : ''}
            AND language = '${language}'
            GROUP BY pi_naviga_news.id
            ORDER BY timestamp::timestamp DESC
            LIMIT ${limit} OFFSET ${offset}
        `)
    ]);

    const totalResults = parseInt(total[0].total);
    const totalPages = Math.ceil(totalResults / limit);

    return res.json({
        news,
        totalPages: totalPages,
        currentPage: page,
        nextPage: page + 1,
        previousPage: page === 1 ? null : (page - 1)
    });
}

export async function getCompanyNews(req, res, next) {
    let {
        language = 'en',
        limit = 10,
        page = 1,
        include_otc = false,
        goc = 'US',
        exchanges = defaultExchanges
    } = req.query;
    let { ticker } = req.params;

    if (typeof ticker === 'string') {
        ticker = [ticker];
    }

    const tickers = ticker.map(tick => `'${tick}'`).join(',');

    if (typeof exchanges === 'string') {
        exchanges = exchanges.split(',').map(t => t.trim()).filter(Boolean);
    }

    if (typeof goc === 'string') {
        goc = goc.split(',').map(t => t.trim()).filter(Boolean);
    }

    if (include_otc) {
        exchanges = [
            ...exchanges,
            ...otcExchanges
        ];
    }

    exchanges = exchanges.map(exchange => `'${exchange}'`).join(',');
    goc = goc.map(country => `'${country}'`).join(',');

    page = parseInt(page);
    limit = parseInt(limit);

    if (page < 1) {
        page = 1;
    }

    const offset = (page - 1) * limit;

    const [total, news] = await Promise.all([
        db(`
            SELECT
                count(*) as total
            FROM pi_naviga_news
            INNER JOIN pi_naviga_tickers ON pi_naviga_news.id = pi_naviga_tickers.news_id
            WHERE
                pi_naviga_tickers.ticker IN (${tickers})
                ${exchanges.length ? `AND exchange IN (${exchanges})` : ''}
                ${goc.length ? `AND goc IN (${goc})` : ''}
                AND language = '${language}'
                AND timestamp < NOW()
        `),
        db(`
            SELECT
                pi_naviga_news.id,
                pi_naviga_news.title,
                pi_naviga_news.resource_id,
                pi_naviga_news.description,
                pi_naviga_news.language,
                pi_naviga_news.timestamp,
                pi_naviga_tickers.ticker
            FROM pi_naviga_news
            INNER JOIN pi_naviga_tickers ON pi_naviga_news.id = pi_naviga_tickers.news_id
            WHERE
                pi_naviga_tickers.ticker IN (${tickers})
                ${exchanges.length ? `AND exchange IN (${exchanges})` : ''}         
                ${goc.length ? `AND goc IN (${goc})` : ''}
                AND language = '${language}'
                AND timestamp < NOW()
            ORDER BY timestamp DESC
            LIMIT ${limit} OFFSET ${offset}
        `)
    ]);

    const totalResults = parseInt(total[0].total);
    const totalPages = Math.ceil(totalResults / limit);

    return res.json({
        news,
        totalPages: totalPages,
        currentPage: page,
        nextPage: page + 1,
        previousPage: page === 1 ? null : (page - 1)
    });
}

export async function getGeneralNews(req, res, next) {
    let {
        language = 'en',
        limit = 10,
        page = 1,
        goc = 'US',
        include_otc = false,
        exchanges = defaultExchanges
    } = req.query;

    if (typeof exchanges === 'string') {
        exchanges = exchanges.split(',').map(t => t.trim()).filter(Boolean);
    }

    if (typeof goc === 'string') {
        goc = goc.split(',').map(t => t.trim()).filter(Boolean);
    }

    if (include_otc) {
        exchanges = [
            ...exchanges,
            ...otcExchanges
        ];
    }

    exchanges = exchanges.map(exchange => `'${exchange}'`).join(',');
    goc = goc.map(country => `'${country}'`).join(',');

    page = parseInt(page);
    limit = parseInt(limit);

    if (page < 1) {
        page = 1;
    }

    const offset = (page - 1) * limit;

    const [total, news] = await Promise.all([
        db(`
            SELECT
                count(DISTINCT pi_naviga_news.id) as total
            FROM pi_naviga_news
            INNER JOIN pi_naviga_subjects ON pi_naviga_news.id = pi_naviga_subjects.news_id
            ${exchanges.length ? `INNER JOIN pi_naviga_tickers ON pi_naviga_tickers.news_id = pi_naviga_news.id` : ''}
            ${goc.length ? `AND goc IN (${goc})` : ''}
            WHERE
                pi_naviga_subjects.subject_code IN ('IS/biz.markfore','IS/biz.openings','IS/biz.buy','IS/biz.manda','IS/biz.acquire','IS/biz.assets','IS/biz.mergers','IS/biz.stake','IS/econ.global','IS/econ.national','IS/econ','IS/fin.biz')
                ${exchanges.length ? `AND exchange IN (${exchanges})` : ''}
                AND language = '${language}'
                AND timestamp < NOW()
        `),
        db(`
            SELECT
                DISTINCT pi_naviga_news.id,
                pi_naviga_news.title,
                pi_naviga_news.resource_id,
                pi_naviga_news.description,
                pi_naviga_news.language,
                pi_naviga_news.timestamp
            FROM pi_naviga_news
            INNER JOIN pi_naviga_subjects ON pi_naviga_news.id = pi_naviga_subjects.news_id
            ${exchanges.length ? `INNER JOIN pi_naviga_tickers ON pi_naviga_tickers.news_id = pi_naviga_news.id` : ''}
            WHERE
                pi_naviga_subjects.subject_code IN ('IS/biz.markfore','IS/biz.openings','IS/biz.buy','IS/biz.manda','IS/biz.acquire','IS/biz.assets','IS/biz.mergers','IS/biz.stake','IS/econ.global','IS/econ.national','IS/econ','IS/fin.biz')
                ${exchanges.length ? `AND exchange IN (${exchanges})` : ''}         
                ${goc.length ? `AND goc IN (${goc})` : ''}
                AND language = '${language}'
                AND timestamp < NOW()
            ORDER BY timestamp DESC
            LIMIT ${limit} OFFSET ${offset}
        `)
    ]);

    const totalResults = parseInt(total[0].total);
    const totalPages = Math.ceil(totalResults / limit);

    return res.json({
        news,
        totalPages: totalPages,
        currentPage: page,
        nextPage: page + 1,
        previousPage: page === 1 ? null : (page - 1)
    });
}

export async function getSectorNews(req, res, next) {
    let {
        language = 'en',   
        limit = 10,
        page = 1,
        include_otc = false,
        goc = 'US',
        exchanges = defaultExchanges
    } = req.query;
    let { sector_code } = req.params;

    if (typeof exchanges === 'string') {
        exchanges = exchanges.split(',').map(t => t.trim()).filter(Boolean);
    }

    if (typeof goc === 'string') {
        goc = goc.split(',').map(t => t.trim()).filter(Boolean);
    }

    if (include_otc) {
        exchanges = [
            ...exchanges,
            ...otcExchanges
        ];
    }

    exchanges = exchanges.map(exchange => `'${exchange}'`).join(',');
    goc = goc.map(country => `'${country}'`).join(',');

    page = parseInt(page);
    limit = parseInt(limit);

    if (page < 1) {
        page = 1;
    }

    const offset = (page - 1) * limit;

    const [total, news] = await Promise.all([
        db(`
            SELECT COUNT(DISTINCT pi_naviga_industries.news_id) as total
            FROM pi_naviga_news
            INNER JOIN pi_naviga_tickers ON pi_naviga_news.id = pi_naviga_tickers.news_id
            INNER JOIN pi_naviga_industries ON pi_naviga_news.id = pi_naviga_industries.news_id
            WHERE
                pi_naviga_industries.sector = '${sector_code}'
                ${exchanges.length ? `AND exchange IN (${exchanges})` : ''}   
                ${goc.length ? `AND goc IN (${goc})` : ''}
                AND language = '${language}'
                AND timestamp < NOW()
        `),
        db(`
            SELECT
                pi_naviga_news.id,
                pi_naviga_news.title,
                pi_naviga_news.resource_id,
                pi_naviga_news.description,
                pi_naviga_news.timestamp,
                array_agg(
                    DISTINCT pi_naviga_tickers.ticker
                ) as tickers
            FROM pi_naviga_news
            INNER JOIN pi_naviga_industries ON pi_naviga_news.id = pi_naviga_industries.news_id
            INNER JOIN pi_naviga_tickers ON pi_naviga_news.id = pi_naviga_tickers.news_id
            WHERE
                pi_naviga_industries.sector = '${sector_code}'
                ${exchanges.length ? `AND exchange IN (${exchanges})` : ''}   
                ${goc.length ? `AND goc IN (${goc})` : ''}
                AND language = '${language}'
                AND timestamp < NOW()
            GROUP BY pi_naviga_news.id
            ORDER BY timestamp DESC
            LIMIT ${limit} OFFSET ${offset}
        `)
    ]);


    const totalResults = parseInt(total[0].total);
    const totalPages = Math.ceil(totalResults / limit);

    return res.json({
        news,
        totalPages: totalPages,
        currentPage: page,
        nextPage: page + 1,
        previousPage: page === 1 ? null : (page - 1)
    });
}


export async function getEarningNews(req, res, next) {
    let {
        language = 'en',   
        limit = 10,
        page = 1,
        tickers,
        include_otc = false,
        goc = 'US',
        exchanges = defaultExchanges    
    } = req.query;

    if (typeof exchanges === 'string') {
        exchanges = exchanges.split(',').map(t => t.trim()).filter(Boolean);
    }

    if (typeof goc === 'string') {
        goc = goc.split(',').map(t => t.trim()).filter(Boolean);
    }

    if (include_otc) {
        exchanges = [
            ...exchanges,
            ...otcExchanges
        ];
    }

    exchanges = exchanges.map(exchange => `'${exchange}'`).join(',');
    goc = goc.map(country => `'${country}'`).join(',');

    if (tickers && typeof tickers === 'string') {
        tickers = tickers.split(',').map(t => t.toUpperCase().trim()).filter(Boolean).map(t => `'${t}'`);
    }

    page = parseInt(page);
    limit = parseInt(limit);

    if (page < 1) {
        page = 1;
    }

    let tickersQuery = {
        select: ``,
        condition: ``
    };

    if (tickers && Array.isArray(tickers) && tickers.length) {
        tickersQuery.select = `, pi_naviga_tickers.ticker`;
        tickersQuery.condition = `AND ticker IN (${tickers.join(',')})`;
    }

    const offset = (page - 1) * limit;

    const [total, news] = await Promise.all([
        db(`
            SELECT count(DISTINCT pi_naviga_earning_news.news_id) as total
            FROM pi_naviga_earning_news
            INNER JOIN pi_naviga_tickers ON pi_naviga_earning_news.news_id = pi_naviga_tickers.news_id
            ${exchanges.length ? `AND exchange IN (${exchanges})` : ''}   
            ${goc.length ? `AND goc IN (${goc})` : ''}
            WHERE timestamp < NOW()
            AND language = '${language}'
            ${tickersQuery.condition}
        `),
        db(`
            SELECT DISTINCT pi_naviga_earning_news.news_id, pi_naviga_earning_news.* ${tickersQuery.select}
            FROM pi_naviga_earning_news
            INNER JOIN pi_naviga_tickers ON pi_naviga_earning_news.news_id = pi_naviga_tickers.news_id
            WHERE timestamp < NOW()
            ${exchanges.length ? `AND exchange IN (${exchanges})` : ''}   
            ${goc.length ? `AND goc IN (${goc})` : ''}
            AND language = '${language}'
            ${tickersQuery.condition}
            ORDER BY timestamp DESC
            LIMIT ${limit} OFFSET ${offset}
        `)
    ]);

    const totalResults = parseInt(total[0].total);
    const totalPages = Math.ceil(totalResults / limit);

    return res.json({
        news,
        totalPages: totalPages,
        currentPage: page,
        nextPage: page + 1,
        previousPage: page === 1 ? null : (page - 1)
    });
}

export async function getTitanNews(req, res, next) {
    let {
        language = 'en',   
        limit = 10,
        goc = 'US',
        page = 1
    } = req.query;
    let { titan_uri } = req.params;

    page = parseInt(page);
    limit = parseInt(limit);

    if (page < 1) {
        page = 1;
    }

    if (typeof goc === 'string') {
        goc = goc.split(',').map(t => t.trim()).filter(Boolean);
    }

    goc = goc.map(country => `'${country}'`).join(',');

    const titan = (await db(`
        SELECT * FROM pi_naviga_titans WHERE titan_uri = '${titan_uri}'
    `))[0];

    const apin = titan ? titan.apin : '';

    const offset = (page - 1) * limit;

    const [total, news] = await Promise.all([
        db(`
            SELECT COUNT(*) as total
            FROM pi_naviga_news
            INNER JOIN pi_naviga_persons ON pi_naviga_news.id = pi_naviga_persons.news_id
            WHERE
                pi_naviga_persons.person_code = '${apin}'
                ${goc.length ? `AND goc IN (${goc})` : ''}
                AND language = '${language}'
                AND timestamp < NOW()
        `),
        db(`
            SELECT
                pi_naviga_news.id,
                pi_naviga_news.title,
                pi_naviga_news.resource_id,
                pi_naviga_news.description,
                pi_naviga_news.timestamp
            FROM pi_naviga_news
            INNER JOIN pi_naviga_persons ON pi_naviga_news.id = pi_naviga_persons.news_id
            WHERE
                pi_naviga_persons.person_code = '${apin}'
                ${goc.length ? `AND goc IN (${goc})` : ''}
                AND language = '${language}'
                AND timestamp < NOW()
            ORDER BY timestamp DESC
            LIMIT ${limit} OFFSET ${offset}
        `)
    ]);


    const totalResults = parseInt(total[0].total);
    const totalPages = Math.ceil(totalResults / limit);

    return res.json({
        news,
        totalPages: totalPages,
        currentPage: page,
        nextPage: page + 1,
        previousPage: page === 1 ? null : (page - 1)
    });
}

export async function getUserSpecificCompanyNews(tickers, query) {
	let {
        language = 'en',   
		limit = 10,
        page = 1,
        include_otc = false,
        goc = 'US',
        exchanges = defaultExchanges
    } = query;
    
    if (typeof exchanges === 'string') {
        exchanges = exchanges.split(',').map(t => t.trim()).filter(Boolean);
    }

    if (typeof goc === 'string') {
        goc = goc.split(',').map(t => t.trim()).filter(Boolean);
    }

    if (include_otc) {
        exchanges = [
            ...exchanges,
            ...otcExchanges
        ];
    }

    exchanges = exchanges.map(exchange => `'${exchange}'`).join(',');
    goc = goc.map(country => `'${country}'`).join(',');

	page = parseInt(page);
	limit = parseInt(limit);

	if (page < 1) {
		page = 1;
	}

	let newsArray = []
	for await (const ticker of tickers) {
		const news = await db(`
			SELECT
				pi_naviga_news.id,
				pi_naviga_news.title,
				pi_naviga_news.resource_id,
				pi_naviga_news.description,
				pi_naviga_news.timestamp,
				pi_naviga_tickers.ticker
			FROM pi_naviga_news
			INNER JOIN pi_naviga_tickers ON pi_naviga_news.id = pi_naviga_tickers.news_id
			WHERE
                pi_naviga_tickers.ticker = '${ticker}'
                ${exchanges.length ? `AND exchange IN (${exchanges})` : ''}
                ${goc.length ? `AND goc IN (${goc})` : ''}
                AND language = '${language}'
                AND timestamp < NOW()
			ORDER BY timestamp DESC
			LIMIT 3
		`);
		newsArray = concat(newsArray, news)
	}

	newsArray = orderBy(newsArray, 'timestamp', 'desc');

	const totalResults = parseInt(newsArray.length);
	const totalPages = Math.ceil(totalResults / limit);

	const news = paginate(newsArray, limit, page);

	return {
		news,
		totalPages: totalPages,
		currentPage: page,
		nextPage: page + 1,
		previousPage: page === 1 ? null : (page - 1)
	};
}

export const getStrongBuyNews = async (req, res) => {
	const news = await mainDB(`
		SELECT wd.input
		FROM widgets w
		JOIN widget_instances wi ON wi.widget_id = w.id
		JOIN widget_data wd ON wd.id = wi.widget_data_id 
		WHERE w.id = 12
`);

	if (size(news) !== 0) {
		const { input: { tickers } } = news[0]
		const result = await getUserSpecificCompanyNews(tickers, req.query)
		res.json(result)
	}
}

const paginate = (array, limit, page) => {
	return array.slice((page - 1) * limit, page * limit);
}
