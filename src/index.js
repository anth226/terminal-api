import 'dotenv/config';
import express from 'express';
import firebase from 'firebase';
import admin from 'firebase-admin';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import axios from 'axios';
import intrinioSDK from 'intrinio-sdk';
import * as getCompanyData from './intrinio/get_company_data';
import * as getNews from './intrinio/get_news';
import * as getIndexData from './intrinio/get_index_data';
import * as getSecurityData from './intrinio/get_security_data';
import * as lookupCompany from './intrinio/get_company_fundamentals';
import * as screener from './intrinio/screener';
// import * as gainersLosers from './polygon/get_gainers_losers';
import * as gainersLosers from './scrape/get_gainers_losers';
import * as forexPairs from './polygon/get_forex_last_quote';
import * as newsHelper from './newsApi/newsHelper';
import * as finviz from './scrape/finviz';
import * as futures from './scrape/finviz_futures';
import * as cnn from './scrape/cnn';
import * as finvizForex from './scrape/finviz_forex';
import * as cnnSectors from './scrape/cnn_sectors';
import * as nerdwallet from './scrape/nerdwallet';
import * as titans from './finbox/titans';
import * as finvizGroups from './scrape/finviz_groups';
import * as nerdwalletSavings from './scrape/nerdwallet_savings';
import * as stocktwits from './stocktwits/get_trending';
import bodyParser from 'body-parser';
import Stripe from 'stripe';

/*
~~~~~~Configuration Stuff~~~~~~
*/

// init firebase
const serviceAccount = require("../tower-93be8-firebase-adminsdk-o954n-87d13d583d.json");
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://tower-93be8.firebaseio.com"
});
// init stripe
const stripe = Stripe('pk_test_FeiZaW7GZitv7d2wZzwNx2Kr00FOgraGW4');
// init intrinio
intrinioSDK.ApiClient.instance.authentications['ApiKeyAuth'].apiKey = process.env.INTRINIO_API_KEY_PROD;
const companyAPI = new intrinioSDK.CompanyApi();
const securityAPI = new intrinioSDK.SecurityApi();
const indexAPI = new intrinioSDK.IndexApi();
// configure secure cookies
const expiresIn = 60 * 60 * 24 * 5 * 1000;
const cookieParams = {
  maxAge: expiresIn,
  httpOnly: true,  // dont let browser javascript access cookie ever
  ephemeral: true // delete this cookie while browser close
}
//secure: true, // only use cookie over https
// configure CORS
var corsOptions = {
  origin: `http://${process.env.FRONTEND_URL}:${process.env.FRONTEND_PORT}`,
  optionsSuccessStatus: 200, // some legacy browsers (IE11, various SmartTVs) choke on 204
  credentials: true,
}
// set up middlewares
const app = express();
app.use(cors(corsOptions));
app.use(cookieParser());
app.use(express.json());

/*
~~~~~~Middlewares~~~~~~
*/
function checkAuth(req, res, next) {
  if (req.cookies.access_token && req.cookies.access_token.split(' ')[0] === 'Bearer') { // Authorization: Bearer g1jipjgi1ifjioj
      // Handle token presented as a Bearer token in the Authorization header
      const session = req.cookies.access_token.split(' ')[1];
      admin.auth().verifySessionCookie(
        session, true /** checkRevoked */)
        .then((decodedClaims) => {
          req.user = decodedClaims.name
          next();
        })
        .catch(error => {
          // Session is unavailable or invalid. Force user to login.
          res.status(403).send('Unauthorized');
        });
    } else {
      res.status(403).send('Unauthorized');
    }
}

/*
~~~~~~Routes~~~~~~
v  if(decodedToken.email_verified == false) {
    res.json({ status: "verify_email", message: "Please verify your email address: " + decodedToken.email });
  } else
*/
// index
app.get('/', async (req, res) => {
    res.send('hello');
});
// exchange firebase token
app.post('/getToken', async (req, res) => {
  const idToken = req.body.token.toString();
  admin.auth().verifyIdToken(idToken)
  .then((decodedToken) => {
   if (new Date().getTime() / 1000 - decodedToken.auth_time < 5 * 60) {
      admin.auth().createSessionCookie(idToken, {expiresIn}).then((sessionToken) => {
        res.cookie('access_token', 'Bearer ' + sessionToken, cookieParams).end(JSON.stringify({status: "success"}));
      }).catch(error => {
        res.json({status:"error", message: error + " Unable to create session token, please try logging in again."});
      });
    } else {
      res.json({status: "error", message: "Your login session has expired, please try logging in again."});
    }
  }).catch(error => {
    res.json({status: "error", message: "Unable to verify your login information, please try logging in again."});
  })
});

app.use('/payment', checkAuth)
app.post('/payment', async (req, res) => {
  // verify firebase id token here and don't use checkAuth middleware?
  const customer = await stripe.customers.create({
    payment_method: req.body.payment_method,
    email: req.body_email,
    invoice_settings: {
      default_payment_method: req.body.payment_method,
    },
  }).catch(error => {
    res.json({status: "error"});
    return
  });
  const subscription = await stripe.subscriptions.create({
    customer: customer.id,
    items: [{ plan: "prod_GTx1D3iN163Dw5" }],
    expand: ["latest_invoice.payment_intent"]
  }).catch(error => {
    res.json({status: "error"});
    return
  });
  // make db insert call with customer id and subscription id attached to this firebase user id
});
// auth check

//app.use('/sec-historical-price/:symbol', checkAuth)
app.get('/sec-historical-price/:symbol/:days', async( req, res ) => {
    const intradayPrices = await getSecurityData.getHistoricalData(securityAPI, req.params.symbol, req.params.days)
    res.send(intradayPrices)
})


app.use('/profile', checkAuth)
app.get('/profile', function(req, res, next) {
  axios.get(`https://jsonplaceholder.typicode.com/users`)
      .then(resp => {
        res.json(resp.data);
      })
});

app.post('/company/datapoints', async (req, res) => {
    const data = await getCompanyData.getDataPoint(companyAPI, req.body)
    res.send(data);
});

app.post('/company/data_number', async (req, res) => {
    const data = await getCompanyData.getNumberDataPoint(companyAPI, req.body.symbols, req.body.tags)
    res.send(data);
});

// general
app.use('/all-news', checkAuth)
app.get('/all-news', async (req, res) => {
    const news = await getNews.getAllNews(companyAPI)
    res.send(news);
});

app.use('/futures', checkAuth)
app.get('/futures', async (req, res) => {
    const futuresData = await futures.getFutures()
    res.send(futuresData);
});

// Companies
app.use('/company/:symbol', checkAuth)
app.get('/company/:symbol', async (req, res) => {
    const companyFundamentals = await getCompanyData.lookupCompany(companyAPI, req.params.symbol)
    res.send(companyFundamentals);
});
app.use('/company-news/:symbol', checkAuth)
app.get('/company-news/:symbol', async (req, res) => {
    const companyNews = await getCompanyData.companyNews(companyAPI, req.params.symbol)
    res.send(companyNews);
});
app.use('/company-fundamentals/:symbol', checkAuth)
app.get('/company-fundamentals/:symbol', async (req, res) => {
    const companyFundamentals = await getCompanyData.companyFundamentals(companyAPI, req.params.symbol)
    res.send(companyFundamentals);
});

app.use('/company/data_text', checkAuth)
app.post('/company/data_text', async (req, res) => {
    const data = await getCompanyData.getTextDataPoint(companyAPI, req.body.symbols, req.body.tags)
    res.send(data);
});



/* Securities */

//app.use('/data-tags', checkAuth)
app.get('/data-tags', async(req, res) => {
  const result = await getDataTags.allDataTags(dataTagAPI)
  res.send(result)
})

//app.use('/sec-screener', checkAuth)
app.post('/sec-screener', async( req, res ) => {
    const result = await screener.screen(securityAPI, req.body)
    res.send(result)
})

app.use('/sec-intraday-prices/:symbol', checkAuth)
app.get('/sec-intraday-prices/:symbol', async( req, res ) => {
    const intradayPrices = await getSecurityData.getIntradayPrices(securityAPI, req.params.symbol)
})

app.use('/sec-last-price/:symbol', checkAuth)
app.get('/sec-last-price/:symbol', async( req, res ) => {
    const lastPrice = await getSecurityData.getSecurityLastPrice(req.params.symbol)
    res.send(lastPrice)
})

// SEARCH
app.use('/search/:query', checkAuth)
app.get('/search/:query', async (req, res) => {
    const query = req.params.query
    const results = await getCompanyData.searchCompanies(companyAPI, query)
    res.send(results);
});
app.use('/search-sec/:query', checkAuth)
app.get('/search-sec/:query', async (req, res) => {
    const query = req.query["search"]
    const results = await getCompanyData.searchSec(securityAPI, query)
    res.send(results);
});

/* Index Endpoints */

app.use('/get-index-price/:symbol', checkAuth)
app.get('/get-index-price/:symbol', async(req,res) => {
    const level = await getIndexData.getIndexPrice(indexAPI, req.params.symbol)
    res.json({'price': level})
});
app.use('/index-historical/:symbol', checkAuth)
app.get('/index-historical/:symbol', async (req, res) => {
    const results = await getIndexData.indexHistorical(indexAPI, req.params.symbol)
    res.send(results);
});

app.use('/index-data', checkAuth)
app.get('/index-data', async (req, res) => {
    const results = await cnn.getIndexData()
    res.json(results);
});


/* Gainers & Losers */

app.use('/gainers', checkAuth)
app.get('/gainers', async (req, res) => {
    const gainers = await gainersLosers.getGainers()
    res.send(gainers);
});

app.use('/losers', checkAuth)
app.get('/losers', async (req, res) => {
    const losers = await gainersLosers.getLosers()
    res.send(losers);
});

/* News */

app.use('/news-sources', checkAuth)
app.get('/news-sources', async (req, res) => {
    const sources = await newsHelper.getSources(process.env.NEWS_API_KEY)
    res.send(sources);
});

app.use('/news/headlines/:source', checkAuth)
app.get('/news/headlines/:source', async (req, res) => {
    const headlines = await newsHelper.getSourceHeadlines(process.env.NEWS_API_KEY, req.params.source)
    res.send(headlines);
});

/* Insider */
app.use('/news/home-headlines', checkAuth)
app.get('/news/home-headlines', async (req, res) => {
    const headlines = await newsHelper.getHomeHeadlines(process.env.NEWS_API_KEY)
    res.send(headlines);
});

app.use('/all-insider', checkAuth)
app.get('/all-insider', async (req, res) => {
    const allInsider = await finviz.getAllInsider().then(data => data)
    res.send(allInsider);
});

app.use('/company-ratings/:ticker', checkAuth)
app.get('/company-ratings/:ticker', async (req, res) => {
    const companyRatings = await finviz.getCompanyRatings(req.params.ticker).then(data => data)
    res.send(companyRatings);
});

app.use('/company-metrics/:ticker', checkAuth)
app.get('/company-metrics/:ticker', async (req, res) => {
    const companyMetrics = await finviz.getCompanyMetrics(req.params.ticker).then(data => data)
    res.send(companyMetrics);
});
// server
app.use('/forex', checkAuth)
app.get('/forex', async (req, res) => {
    const pairs = await finvizForex.getForex();
    res.send(pairs)
});

app.use('/savings-accounts', checkAuth)
app.get('/savings-accounts', async (req, res) => {
    const accounts = await nerdwalletSavings.getSavingsAccountsList();
    res.send(accounts)
});

// FROM POLYGON< SHOULD REMOVE
app.use('/forex-pairs', checkAuth)
app.get('/forex-pairs', async (req, res) => {
    let pairs = {}
    pairs['EURUSD'] = await forexPairs.getLastQuoteEurUsd();
    pairs['GBPUSD'] = await forexPairs.getLastQuoteGbpUsd();
    pairs['USDCAD'] = await forexPairs.getLastQuoteUsdCad();
    pairs['USDJPY'] = await forexPairs.getLastQuoteUsdJpy();
    pairs['XAUUSD'] = await forexPairs.getLastQuoteXauUsd();
    res.send(pairs);
});

app.use('/sector-performance', checkAuth)
app.get('/sector-performance', async (req, res) => {
  const sectorPerf = await finvizGroups.getSectorsPerformance();
  res.send(sectorPerf);
})

app.use('/industry-performance', checkAuth)
app.get('/industry-performance', async (req, res) => {
  const industryPerf = await finvizGroups.getIndustriesPerformance();
  res.send(industryPerf);
});

// app.use('/titans/:portfolio', checkAuth)
app.get('/titans/:portfolio', async (req, res) => {
  const portfolio = await titans.getSinglePortfolioData(req.params.portfolio).then(data => data);
  res.send(portfolio);
});

app.use('/titans', checkAuth)
app.post('/titans', async (req, res) => {
  const portfolios = await titans.getPortfolios(req.body);
  res.send(portfolios);
});

// get trending stocks from stocktwits
app.use('/trending', checkAuth)
app.get('/trending', async (req, res) => {
  const trendingStocks = await stocktwits.getTrending();
  res.send(trendingStocks);
});


app.listen(process.env.PORT, () =>
    console.log(`listening on ${process.env.PORT}`)
);
