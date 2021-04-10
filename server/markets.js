const db = require('./database/db');
const helpers = require('./helpers');
const coincodexMarketCap = require('./database/markets_caps/coincodex');
const settings = require('./wallets/all_settings');
var StatsController = require('./database/controllers/stats_controller');
var MarketsController = require('./database/controllers/markets_controller');

const obj = {
    getAllWallets: () => {
        var wallets = [];
        for (var wallet in settings) {
            if(settings[wallet].active && !settings[wallet].hide) {
                wallets.push(wallet);
            }
        }
        return wallets;
    },
    getStats: (wallet, fullUrl, cb) => {
        db.setCurrentConnection(wallet);
        MarketsController.getOne(settings[wallet].symbol.toUpperCase() + '_BTC', function(market) {
            if(!market) {
                market = {summary: {"24h_volume": {BTC: "0"}, usd_price: {BTC: "0"}}};
            }
            MarketsController.getAllSummary('symbol', 'desc', 0, 0, function (markets) {
                markets = helpers.removeDuplicateSummary(markets, settings[wallet].symbol);
                var markets_stats = helpers.calcMarketData(markets, {}, wallet);
                StatsController.getOne(wallet, function (stats) {
                    // console.log('stats', stats)
                    var obj = {
                        wallet: helpers.ucfirst(wallet),
                        symbol: settings[wallet].symbol,
                        explorer: fullUrl + '/explorer/' + wallet,
                        api: fullUrl + '/public-api/db/' + wallet,
                        stats: stats,
                        markets_stats: markets_stats,
                        market_summary: market.summary,
                    }
                    cb(obj);
                });
            })
        });
    },
    getStatsCoincodex: (wallet, fullUrl, cb) => {
        db.setCurrentConnection(wallet);
        let symbol = settings[wallet].symbol.toUpperCase();
        if(symbol === 'FIX') {
            symbol = 'FIX2'
        }
        coincodexMarketCap.getCoinFromCache(symbol).then((market_cap) => {
            console.log('market_cap', market_cap);
            const market =  {summary: {"24hVolume": {BTC: market_cap.volume_24_usd}, usd_price: {BTC:  market_cap.last_price_usd}}}
            // MarketsController.getOne(settings[wallet].symbol.toUpperCase() + '_BTC', function (market) {
            //     if (!market) {
            //         market = {summary: {"24hVolume": {BTC: "0"}, usd_price: {BTC: "0"}}};
            //     }
                MarketsController.getAllSummary('symbol', 'desc', 0, 0, function (markets) {
                    markets = helpers.removeDuplicateSummary(markets, settings[wallet].symbol);
                    var markets_stats = helpers.calcMarketData(markets, {}, wallet);
                    StatsController.getOne(wallet, function (stats) {
                        // console.log('stats', stats)
                        var obj = {
                            wallet: helpers.ucfirst(wallet),
                            symbol: settings[wallet].symbol,
                            explorer: fullUrl + '/explorer/' + wallet,
                            api: fullUrl + '/public-api/db/' + wallet,
                            stats: stats,
                            markets_stats: markets_stats,
                            market_summary: market.summary,
                        }
                        cb(obj);
                    });
                })
            // });
        });
    }
}

module.exports = obj;
