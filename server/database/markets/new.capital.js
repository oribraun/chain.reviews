const request = require('request');

const db = require('./../../database/db');
const settings = require('./../../wallets/all_settings');

var bash = 'https://api.new.capital/v1/';

var model = {
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
