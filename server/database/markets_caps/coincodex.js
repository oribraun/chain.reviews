const request = require('request');

const db = require('./../../database/db');
const settings = require('./../../wallets/all_settings');

var bash = 'https://coincodex.com/api/coincodex/';

var model = {
    getCoin: function(coin) {
        var url = bash + 'get_coin/' + coin.toUpperCase();
        var promise = new Promise(function(resolve, reject) {
            request({uri: url, json: true}, function (error, response, body) {
                if(error) {
                    reject(error);
                } else {
                    resolve(body);
                }
            });
        });
        return promise;
    },
    getCoinFromCache: function(coin) {
        var url = 'https://coincodex.com/apps/coincodex/cache/all_coins.json';
        var promise = new Promise(function(resolve, reject) {
            request({uri: url, json: true}, function (error, response, body) {
                if(error) {
                    reject(error);
                } else {
                    let current;
                    body = body.filter((o) => o.display);
                    const map = body.map((o) => o.symbol);
                    const index = map.indexOf(coin);
                    if(index > -1) {
                        current = body[index];
                    }
                    resolve(current);
                }
            });
        });
        return promise;
    },
    getCacheCoinInfo: function(coin) {
        var url = 'https://coincodex.com/apps/coincodex/cache/all_coins.json';
        var promise = new Promise(function(resolve, reject) {
            request({uri: url, json: true}, function (error, response, body) {
                if(error) {
                    reject(error);
                } else {
                    let current;
                    const map = body.map((o) => o.symbol);
                    const index = map.indexOf(coin.toUpperCase());
                    if(index > -1) {
                        current = body[index];
                    }
                    resolve(current);
                }
            });
        });
        return promise;
    },
    getExchangeInfo: function() {
        var url = bash + 'exchangeInfo';
        var promise = new Promise(function(resolve, reject) {
            request({uri: url, json: true}, function (error, response, body) {
                if(error) {
                    reject(error);
                } else {
                    resolve(body);
                }
            });
        });
        return promise;
    },
    getTicker: function(from_coin, to_coin) {
        to_coin = to_coin.toUpperCase();
        from_coin = from_coin.toUpperCase();
        var url = bash + 'ticker?symbol=' + from_coin + '_' + to_coin;
        var promise = new Promise(function(resolve, reject) {
            request({uri: url, json: true}, function (error, response, body) {
                if(error) {
                    reject(error);
                } else {
                    var d = {
                        "symbol": "TWINS",
                        "display_symbol": "TWINS",
                        "name": "win.win",
                        "aliases": "",
                        "shortname": "win-win",
                        "last_price_usd": 0.000291551,
                        "market_cap_rank": 1263,
                        "volume_rank": 2191,
                        "price_change_1H_percent": 4.16,
                        "price_change_1D_percent": 5.11,
                        "price_change_7D_percent": 9.14,
                        "price_change_30D_percent": -0.1,
                        "price_change_90D_percent": -7.33,
                        "price_change_180D_percent": 169.56,
                        "price_change_365D_percent": 148.35,
                        "price_change_3Y_percent": -94.71,
                        "price_change_5Y_percent": -94.71,
                        "price_change_ALL_percent": -94.9,
                        "price_change_YTD_percent": 16.6,
                        "volume_24_usd": 7758,
                        "display": "true",
                        "trading_since": "2019-02-26 12:50:00",
                        "supply": 6766134394,
                        "last_update": "1617981353",
                        "ico_end": null,
                        "include_supply": "true",
                        "use_volume": "true",
                        "growth_all_time": "0.0675533",
                        "ccu_slug": "win-win",
                        "market_cap_usd": 1972673
                    }
                    var data = {
                        symbol: body.symbol,
                        priceChange: body.priceChange,
                        priceChangePercent: body.priceChangePercent,
                        prevClosePrice: body.prevClosePrice,
                        lastPrice: body.lastPrice,
                        bidPrice: body.bidPrice,
                        askPrice: body.askPrice,
                        openPrice: body.openPrice,
                        highPrice: body.highPrice,
                        lowPrice: body.lowPrice,
                        volume: body.volume,
                        quoteVolume: body.quoteVolume,
                        openTime: body.openTime,
                        closeTime: body.closeTime,
                        firstId: body.firstId,   // First tradeId
                        lastId: body.lastId,    // Last tradeId
                        count: body.count         // Trade count
                    }

                    resolve(data);
                }
            });
        });
        return promise;

    },
    getTrades: function(from_coin, to_coin, limit) {
        to_coin = to_coin.toUpperCase();
        from_coin = from_coin.toUpperCase();
        var url = bash + 'trades?symbol=' + from_coin + '_' + to_coin + '&limit=' + limit;
        var promise = new Promise(function(resolve, reject) {
            request({uri: url, json: true}, function (error, response, body) {
                if(error) {
                    reject(error);
                } else {
                    var data = [];
                    for(var i in body) {
                        var obj = {
                            id: body[i].id,
                            price: body[i].price,
                            qty: body[i].qty,
                            quoteQty:body[i].quoteQty,
                            time: body[i].time
                        }
                        data.push(obj)
                    }
                    resolve(data);
                }
            });
        });
        return promise;
    },
    getDepth: function(from_coin, to_coin, limit) {
        to_coin = to_coin.toUpperCase();
        from_coin = from_coin.toUpperCase();
        var url = bash + 'depth?symbol=' + from_coin + '_' + to_coin + '&limit=' + limit;
        var promise = new Promise(function(resolve, reject) {
            request({uri: url, json: true}, function (error, response, body) {
                if(error) {
                    reject(error);
                } else {
                    var data = {
                        bids: [],
                        asks: []
                    }
                    for(var i in body.bids) {
                        var bid = [
                            body.bids[i][0],     // PRICE
                            body.bids[i][1]    // QTY
                        ];
                        data.bids.push(bid);
                    }
                    for(var i in body.asks) {
                        var ask = [
                            body.asks[i][0],     // PRICE
                            body.asks[i][1]    // QTY
                        ];
                        data.asks.push(ask);
                    }
                    resolve(data);
                }
            });
        });
        return promise;
    },
    getCoinsData: function() {
        var url = bash + 'coins_data.json';
        var promise = new Promise(function(resolve, reject) {
            request({uri: url, json: true}, function (error, response, body) {
                if(error) {
                    reject(error);
                } else {
                    resolve(body);
                }
            });
        });
        return promise;
    }
}

module.exports = model;
