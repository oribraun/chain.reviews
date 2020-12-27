const express = require('express');
var router = express.Router();

const helpers = require('./../../helpers');
const db = require('./../../database/db');
var StatsController = require('./../../database/controllers/stats_controller');
var MarketsController = require('./../../database/controllers/markets_controller');
const settings = require('./../../wallets/all_settings');

router.get('/getUsersStats', (req, res) => {
    const response = helpers.getGeneralResponse();
    var array = [];
    var wallets = [];
    for (var wallet in settings) {
        if(settings[wallet].active) {
            wallets.push(wallet);
        }
    }
    var fullUrl = req.protocol + '://' + req.get('host');
    addingWalletsStats(wallets);
    function returnData() {
        response.data = array;
        res.header('Content-Type', 'application/json');
        res.send(JSON.stringify(response, null, 2));
    }
    function addStats(wallet,cb) {
        db.setCurrentConnection(wallet);
        MarketsController.getOne(settings[wallet].symbol.toUpperCase() + '_BTC', function(market) {
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
            returnData();
        } else {
            addStats(wallets[0], function () {
                wallets.shift();
                addingWalletsStats(wallets);
            })
        }
    }
});

module.exports = router;

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
        marketData[i].avgPriceBtc = (marketData[i].totalPriceBtc / marketData[i].totalPriceCount).toFixed(8);
        marketData[i].buyLiquidity = marketData[i].buyLiquidity.toFixed(8);
        marketData[i].sellLiquidity = marketData[i].sellLiquidity.toFixed(8);
        marketData[i]['24hVolume'] = marketData[i]['24hVolume'].toFixed(8);
    }

    return marketData;
    // console.log('marketData', marketData);
}
