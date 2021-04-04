const express = require('express');
const app = express();
const explorer_api = require('./explorer-api');
const api = require('./api');
const explorer = require('./explorer');
const main = require('./main');
const helpers = require('./../helpers');
const path = require('path');

const db = require('./../database/db');
var StatsController = require('./../database/controllers/stats_controller');
var MarketsController = require('./../database/controllers/markets_controller');
const settings = require('./../wallets/all_settings');

app.get('/', function(req, res) {
    var array = [];
    var wallets = [];
    for (var wallet in settings) {
        if(settings[wallet].active && !settings[wallet].hide) {
            wallets.push(wallet);
        }
    }
    var fullUrl = req.protocol + '://' + req.get('host');
    addingWalletsStats(wallets);
    function sendFile() {
        res.render(path.resolve(__dirname + "/../../chain.review.clients/main/chain.review.ejs"), {
            data: array,
        });
    }
    function addStats(wallet,cb) {
        db.setCurrentConnection(wallet);
        MarketsController.getOne(settings[wallet].symbol.toUpperCase() + '_BTC', function(market) {
            if(!market) {
                market = {summary: {"24h_volume": {BTC: "0"}, usd_price: {BTC: "0"}}};
            }
            MarketsController.getAllSummary('symbol', 'desc', 0, 0, function (markets) {
                markets = removeDuplicateSummary(markets, settings[wallet].symbol);
                var markets_stats = calcMarketData(markets, {}, wallet);
                StatsController.getOne(wallet, function (stats) {
                    console.log('stats', stats)
                    array.push({
                        wallet: helpers.ucfirst(wallet),
                        symbol: settings[wallet].symbol,
                        explorer: fullUrl + '/explorer/' + wallet,
                        api: fullUrl + '/public-api/db/' + wallet,
                        stats: stats,
                        markets_stats: markets_stats,
                        market_summary: market.summary,
                    })
                    cb();
                });
            })
        });
    }
    function addingWalletsStats(wallets) {
        if(!wallets.length) {
            sendFile();
        } else {
            addStats(wallets[0], function () {
                wallets.shift();
                addingWalletsStats(wallets);
            })
        }
    }
});

// app.use("/:wallet/api", function(req, res, next) {
//     var wallet = req.params['wallet'];
//     db.connect(settings[wallet].dbSettings);
//     process.on('SIGINT', function() {
//         console.log("Caught interrupt signal");
//         db.disconnect();
//         process.exit();
//     });
//     next();
// }, api);

var allowOnlyForExplorer = function (req, res, next) {
    // res.header('Content-Type', 'application/json');
    console.log("add to header called ... " + req.url + " origin - " + req.headers.referer);
    // // res.header("charset", "utf-8")
    var allowedOrigins = [
        "http://139.59.131.210/explorer",
        "https://139.59.131.210/explorer",
        "http://dev.masternode.review/explorer",
        "https://dev.masternode.review/explorer",
        "http://chain.review/explorer",
        "https://chain.review/explorer",
        "http://134.122.85.174/explorer", // dev site
        "https://sandbox.chain.review/explorer",  // dev site
    ];
    var referer = req.headers.referer;
    var allowed = false;
    for(var i = 0;i < allowedOrigins.length && !allowed; i++) {
        if(referer && referer.indexOf(allowedOrigins[i]) > -1) {
            allowed = true;
        }
    }
    if(allowed) {
        next();
    } else {
        res.send('<html lang="en"><head>\n' +
            '<meta charset="utf-8">\n' +
            '<title>Error</title>\n' +
            '</head>' +
            '<body>' +
            '<pre>Cannot GET /api/' + req.url + '</pre>' +
            '</body>' +
            '</html>')
    }
};
app.use("/explorer-api", allowOnlyForExplorer, explorer_api);
app.use("/api", api);
app.use("/explorer", explorer);
app.use("/main", main);
module.exports = app;

function removeDuplicateSummary(marketSummary, wallet) {
    // console.log('before remove duplicate marketSummary', marketSummary);
    const symbolsToCalc = [];
    for (let i = 0; i < marketSummary.length; i++) {
        const symbolSplit = marketSummary[i].symbol.split('_');
        const fromCoin = symbolSplit[0];
        const toCoin = symbolSplit[1];
        const regularSymbol = fromCoin + '_' + toCoin;
        if (!regularSymbol.includes(wallet.toUpperCase() + '_')) {
            marketSummary.splice(i, 1);
            i--;
        }
    }
    return marketSummary;
    // console.log('after remove duplicate marketSummary', marketSummary);
}
function calcMarketData(marketSummary, marketData, wallet) {
    for (const i in marketSummary) {
        if (!marketData[marketSummary[i].market_name]) {
            marketData[marketSummary[i].market_name] = {
                '24hVolume': 0,
                sellLiquidity: 0,
                buyLiquidity: 0,
                '24hDeposits': 0,
                '24hWithdrawals': 0,
                totalPriceBtc: 0,
                totalPriceCount: 0,
                avgPriceBtc: 0,
                buyLquidityOptions: [],
                sellLquidityOptions: []
            };
        }
        const setDataBasedOnLastPrice = () => {
            marketData[marketSummary[i].market_name].buyLiquidity += marketSummary[i].totalBuyLiquidityBtc;
            marketData[marketSummary[i].market_name].sellLiquidity += marketSummary[i].amountSellLiquidityBtc;
            marketData[marketSummary[i].market_name]['24hVolume'] += parseFloat(marketSummary[i].volume) * parseFloat(marketSummary[i].leftCoinPriceBtc);
            // if (marketSummary[i].symbol.indexOf('BTC_') === -1) {
                marketData[marketSummary[i].market_name].totalPriceBtc += marketSummary[i].leftCoinPriceBtc;
                marketData[marketSummary[i].market_name].totalPriceCount += 1;
            // }
            const symbolSplit = marketSummary[i].symbol.split('_');
            const fromCoin = symbolSplit[0];
            const toCoin = symbolSplit[1];
            // if(fromCoin !== 'BTC') {
            marketData[marketSummary[i].market_name].buyLquidityOptions.push({
                fromCoin,
                fromAmount: marketSummary[i].totalBuyLiquidity.toFixed(6),
                toCoin,
                toMainCoin: 'BTC',
                toAmount: marketSummary[i].totalBuyLiquidityBtc.toFixed(6),
            });
            marketData[marketSummary[i].market_name].sellLquidityOptions.push({
                fromCoin,
                fromAmount: marketSummary[i].amountSellLiquidity.toFixed(6),
                toCoin,
                toMainCoin: 'BTC',
                toAmount: marketSummary[i].amountSellLiquidityBtc.toFixed(6)
            });
            // }
        };

        const setDataBasedOnRealPrice = () => {
            marketData[marketSummary[i].market_name].buyLiquidity += marketSummary[i].totalBuyLiquidityBtc;
            marketData[marketSummary[i].market_name].sellLiquidity += marketSummary[i].totalSellLiquidityBtc;
            marketData[marketSummary[i].market_name]['24hVolume'] += parseFloat(marketSummary[i].volume) * parseFloat(marketSummary[i].leftCoinPriceBtc);
            if (marketSummary[i].symbol.indexOf('BTC_') === -1) {
                marketData[marketSummary[i].market_name].totalPriceBtc += marketSummary[i].leftCoinPriceBtc;
                marketData[marketSummary[i].market_name].totalPriceCount += 1;
            }
            const symbolSplit = marketSummary[i].symbol.split('_');
            const fromCoin = symbolSplit[0];
            const toCoin = symbolSplit[1];
            // if(fromCoin !== 'BTC') {
            marketData[marketSummary[i].market_name].buyLquidityOptions.push({
                fromCoin,
                fromAmount: marketSummary[i].totalBuyLiquidity.toFixed(6),
                toCoin,
                toMainCoin: 'BTC',
                toAmount: marketSummary[i].totalBuyLiquidityBtc.toFixed(6),
            });
            marketData[marketSummary[i].market_name].sellLquidityOptions.push({
                fromCoin,
                fromAmount: marketSummary[i].totalSellLiquidity.toFixed(6),
                toCoin,
                toMainCoin: 'BTC',
                toAmount: marketSummary[i].totalSellLiquidityBtc.toFixed(6)
            });
        };

        setDataBasedOnLastPrice();
    }
    for (const i in marketData) {
        marketData[i].avgPriceBtc = (marketData[i].totalPriceBtc / marketData[i].totalPriceCount).toFixed(10);
        marketData[i].buyLiquidity = marketData[i].buyLiquidity.toFixed(8);
        marketData[i].sellLiquidity = marketData[i].sellLiquidity.toFixed(8);
        marketData[i]['24hVolume'] = marketData[i]['24hVolume'].toFixed(8);
    }

    return marketData;
    // console.log('marketData', marketData);
}
