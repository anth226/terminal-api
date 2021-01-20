import db from './../navigaDB';

export async function getAllNews(req, res, next) {
    let {
        limit = 10,
        page = 1
    } = req.query;

    page = parseInt(page);
    limit = parseInt(limit);

    if (page < 1) {
        page = 1;
    }

    const total = await db(`
        SELECT COUNT(*) as total 
        FROM pi_naviga_news
        WHERE timestamp < NOW()
    `);

    const totalResults = parseInt(total[0].total);
    const totalPages = Math.ceil(totalResults / limit);
    const offset = (page - 1) * limit;

    const news = await db(`
        SELECT * 
        FROM pi_naviga_news
        WHERE timestamp < NOW()
        ORDER BY timestamp::timestamp DESC
        LIMIT ${limit} OFFSET ${offset}
    `);

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
        limit = 10,
        page = 1
    } = req.query;
    let { ticker } = req.params;

    if (typeof ticker === 'string') {
        ticker = [ticker];
    }

    let tickers = ''

    for await (const tick of ticker) {
        if (tickers.length !== 0) {
            tickers += `,'${tick}'`
        } else {
            tickers = `'${tick}'`
        }
    }

    page = parseInt(page);
    limit = parseInt(limit);

    if (page < 1) {
        page = 1;
    }

    const total = await db(`
        SELECT 
            count(*) as total
        FROM pi_naviga_news
        INNER JOIN pi_naviga_tickers ON pi_naviga_news.id = pi_naviga_tickers.news_id
        WHERE 
            pi_naviga_tickers.ticker IN (${tickers})
            AND timestamp < NOW()
    `);

    const totalResults = parseInt(total[0].total);
    const totalPages = Math.ceil(totalResults / limit);
    const offset = (page - 1) * limit;

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
            pi_naviga_tickers.ticker IN (${tickers})
            AND timestamp < NOW()
        ORDER BY timestamp DESC
        LIMIT ${limit} OFFSET ${offset}
    `);

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
        limit = 10,
        page = 1,
        tickers
    } = req.query;

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
        join: ``,
        condition: ``
    };

    if (tickers && Array.isArray(tickers) && tickers.length) {
        tickersQuery.select = `, pi_naviga_tickers.ticker`;
        tickersQuery.join = `INNER JOIN pi_naviga_tickers ON pi_naviga_earning_news.news_id = pi_naviga_tickers.news_id`;
        tickersQuery.condition = `AND ticker IN (${tickers.join(',')})`;
    }

    const total = await db(`
        SELECT count(DISTINCT pi_naviga_earning_news.news_id) as total
        FROM pi_naviga_earning_news
        ${tickersQuery.join}
        WHERE timestamp < NOW()
        ${tickersQuery.condition}
    `);

    const totalResults = parseInt(total[0].total);
    const totalPages = Math.ceil(totalResults / limit);
    const offset = (page - 1) * limit;

    const news = await db(`
        SELECT DISTINCT pi_naviga_earning_news.news_id, pi_naviga_earning_news.* ${tickersQuery.select}
        FROM pi_naviga_earning_news
        ${tickersQuery.join}
        WHERE timestamp < NOW()
        ${tickersQuery.condition}
        ORDER BY timestamp DESC
        LIMIT ${limit} OFFSET ${offset}
    `);

    return res.json({
        news,
        totalPages: totalPages,
        currentPage: page,
        nextPage: page + 1,
        previousPage: page === 1 ? null : (page - 1) 
    });
}