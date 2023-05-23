const express = require('express');
const app = express();
const explorer_api = require('./explorer-api');
const api = require('./api');
const explorer = require('./explorer');
const main = require('./main');
const helpers = require('./../helpers');
const markets_helper = require('./../markets');
const path = require('path');

const db = require('./../database/db');
var StatsController = require('./../database/controllers/stats_controller');
var MarketsController = require('./../database/controllers/markets_controller');
const settings = require('./../wallets/all_settings');

app.get('/', function(req, res) {
    var array = [];
    var wallets = markets_helper.getAllWallets();
    var fullUrl = req.protocol + '://' + req.get('host');
    var promises = [];
    for (var i in wallets) {
        var promise = new Promise((resolve, reject) => {
            markets_helper.getStatsCoincodexPromise(wallets[i], fullUrl, function (stats) {
                array.push(stats);
                resolve();
            });
        });
        promises.push(promise)
    }
    Promise.all(promises).then((values) => {
        returnData();
    })
    function returnData() {
        res.render(path.resolve(__dirname + "/../../chain.review.clients/main/chain.review.ejs"), {
            data: array,
        });
    }
});
app.get('/test', function(req, res) {
    var obj = {
        "err": 0,
        "errMessage": "",
        "data": [
            {
                "wallet": "Dogecash",
                "symbol": "DOGEC",
                "explorer": "http://chain.review/explorer/dogecash",
                "api": "http://chain.review/public-api/db/dogecash",
                "markets_stats": {
                    "New Capital": {
                        "24hVolume": "0.00000000",
                        "sellLiquidity": "0.00060648",
                        "buyLiquidity": "0.00022974",
                        "24hDeposits": 0,
                        "24hWithdrawals": 0,
                        "totalPriceBtc": 0.0000011199977600000002,
                        "totalPriceCount": 2,
                        "avgPriceBtc": "0.0000005600",
                        "buyLquidityOptions": [
                            {
                                "fromCoin": "DOGEC",
                                "fromAmount": "0.000000",
                                "toCoin": "TWINS",
                                "toMainCoin": "BTC",
                                "toAmount": "0.000000"
                            },
                            {
                                "fromCoin": "DOGEC",
                                "fromAmount": "0.000230",
                                "toCoin": "BTC",
                                "toMainCoin": "BTC",
                                "toAmount": "0.000230"
                            }
                        ],
                        "sellLquidityOptions": [
                            {
                                "fromCoin": "DOGEC",
                                "fromAmount": "0.000000",
                                "toCoin": "TWINS",
                                "toMainCoin": "BTC",
                                "toAmount": "0.000000"
                            },
                            {
                                "fromCoin": "DOGEC",
                                "fromAmount": "1083.000000",
                                "toCoin": "BTC",
                                "toMainCoin": "BTC",
                                "toAmount": "0.000606"
                            }
                        ]
                    }
                },
                "stats": {
                    "last_block": 1184721,
                    "difficulty": "0.8806573855084928",
                    "moneysupply": "15915390.39578428",
                    "hashrate": "0.0000",
                    "supply": 15915390.39578428,
                    "blockcount": 1184721,
                    "connections": 13,
                    "masternodesCountByCollateral": 1,
                    "last_price": 0,
                    "version": "5040300",
                    "protocol": "70926",
                    "walletversion": "180000",
                    "users_tx_count_24_hours": 0,
                    "users_tx_chart": [],
                    "total_wallets_count": 50561,
                    "active_wallets_count": 13729,
                    "dev_wallet_balance": 3173095856250,
                    "_id": "5e1a29c797a56e0f02a6c1aa",
                    "coin": "dogecash",
                    "createdAt": "2020-01-11T20:02:15.127Z",
                    "updatedAt": "2021-11-19T08:48:23.838Z",
                    "__v": 21673,
                    "masternodesCount": {
                        "total": 1,
                        "stable": 0,
                        "enabled": 0,
                        "inqueue": 0,
                        "ipv4": 1,
                        "ipv6": 0,
                        "onion": 0
                    }
                },
                "market_summary": {
                    "24hVolume": {
                        "BTC": 480
                    },
                    "usd_price": {
                        "BTC": 0.02512837899908665
                    }
                }
            },
            {
                "wallet": "Pirate",
                "symbol": "PIRATE",
                "explorer": "http://chain.review/explorer/pirate",
                "api": "http://chain.review/public-api/db/pirate",
                "markets_stats": {},
                "stats": {
                    "last_block": 784283,
                    "difficulty": "2846065.44961315",
                    "moneysupply": "37222670",
                    "hashrate": "0.0000",
                    "supply": 37222670,
                    "blockcount": 784283,
                    "connections": 116,
                    "masternodesCountByCollateral": 1377,
                    "last_price": 0,
                    "version": "0.11.5.10",
                    "protocol": "60022",
                    "walletversion": "60000",
                    "users_tx_count_24_hours": 65,
                    "users_tx_chart": [
                        {
                            "date": "2021-10-28",
                            "hour": 23,
                            "count": 1
                        },
                        {
                            "date": "2021-10-29",
                            "hour": 1,
                            "count": 1
                        },
                        {
                            "date": "2021-10-29",
                            "hour": 2,
                            "count": 1
                        },
                        {
                            "date": "2021-10-29",
                            "hour": 4,
                            "count": 1
                        },
                        {
                            "date": "2021-10-29",
                            "hour": 5,
                            "count": 7
                        },
                        {
                            "date": "2021-10-29",
                            "hour": 6,
                            "count": 11
                        },
                        {
                            "date": "2021-10-29",
                            "hour": 7,
                            "count": 5
                        },
                        {
                            "date": "2021-10-29",
                            "hour": 9,
                            "count": 1
                        },
                        {
                            "date": "2021-10-29",
                            "hour": 10,
                            "count": 2
                        },
                        {
                            "date": "2021-10-29",
                            "hour": 11,
                            "count": 5
                        },
                        {
                            "date": "2021-10-29",
                            "hour": 12,
                            "count": 2
                        },
                        {
                            "date": "2021-10-29",
                            "hour": 13,
                            "count": 4
                        },
                        {
                            "date": "2021-10-29",
                            "hour": 14,
                            "count": 5
                        },
                        {
                            "date": "2021-10-29",
                            "hour": 15,
                            "count": 3
                        },
                        {
                            "date": "2021-10-29",
                            "hour": 16,
                            "count": 3
                        },
                        {
                            "date": "2021-10-29",
                            "hour": 17,
                            "count": 4
                        },
                        {
                            "date": "2021-10-29",
                            "hour": 18,
                            "count": 2
                        },
                        {
                            "date": "2021-10-29",
                            "hour": 19,
                            "count": 1
                        },
                        {
                            "date": "2021-10-29",
                            "hour": 20,
                            "count": 2
                        },
                        {
                            "date": "2021-10-29",
                            "hour": 21,
                            "count": 3
                        },
                        {
                            "date": "2021-10-29",
                            "hour": 22,
                            "count": 1
                        },
                        {
                            "date": "2021-10-29",
                            "hour": 23,
                            "count": 2
                        },
                        {
                            "date": "2021-10-30",
                            "hour": 2,
                            "count": 2
                        },
                        {
                            "date": "2021-10-30",
                            "hour": 3,
                            "count": 1
                        },
                        {
                            "date": "2021-10-30",
                            "hour": 4,
                            "count": 2
                        },
                        {
                            "date": "2021-10-30",
                            "hour": 5,
                            "count": 6
                        },
                        {
                            "date": "2021-10-30",
                            "hour": 6,
                            "count": 1
                        },
                        {
                            "date": "2021-10-30",
                            "hour": 7,
                            "count": 4
                        },
                        {
                            "date": "2021-10-30",
                            "hour": 8,
                            "count": 1
                        },
                        {
                            "date": "2021-10-30",
                            "hour": 9,
                            "count": 1
                        },
                        {
                            "date": "2021-10-30",
                            "hour": 12,
                            "count": 13
                        },
                        {
                            "date": "2021-10-30",
                            "hour": 13,
                            "count": 7
                        },
                        {
                            "date": "2021-10-30",
                            "hour": 14,
                            "count": 5
                        },
                        {
                            "date": "2021-10-30",
                            "hour": 15,
                            "count": 3
                        },
                        {
                            "date": "2021-10-30",
                            "hour": 16,
                            "count": 5
                        },
                        {
                            "date": "2021-10-30",
                            "hour": 17,
                            "count": 5
                        },
                        {
                            "date": "2021-10-30",
                            "hour": 18,
                            "count": 5
                        },
                        {
                            "date": "2021-10-30",
                            "hour": 19,
                            "count": 7
                        },
                        {
                            "date": "2021-10-30",
                            "hour": 20,
                            "count": 2
                        },
                        {
                            "date": "2021-10-30",
                            "hour": 21,
                            "count": 1
                        },
                        {
                            "date": "2021-10-31",
                            "hour": 0,
                            "count": 1
                        },
                        {
                            "date": "2021-10-31",
                            "hour": 2,
                            "count": 2
                        },
                        {
                            "date": "2021-10-31",
                            "hour": 3,
                            "count": 2
                        },
                        {
                            "date": "2021-10-31",
                            "hour": 4,
                            "count": 1
                        },
                        {
                            "date": "2021-10-31",
                            "hour": 5,
                            "count": 2
                        },
                        {
                            "date": "2021-10-31",
                            "hour": 6,
                            "count": 3
                        },
                        {
                            "date": "2021-10-31",
                            "hour": 7,
                            "count": 3
                        },
                        {
                            "date": "2021-10-31",
                            "hour": 8,
                            "count": 3
                        },
                        {
                            "date": "2021-10-31",
                            "hour": 9,
                            "count": 3
                        },
                        {
                            "date": "2021-10-31",
                            "hour": 11,
                            "count": 4
                        },
                        {
                            "date": "2021-10-31",
                            "hour": 12,
                            "count": 4
                        },
                        {
                            "date": "2021-10-31",
                            "hour": 13,
                            "count": 3
                        },
                        {
                            "date": "2021-10-31",
                            "hour": 14,
                            "count": 1
                        },
                        {
                            "date": "2021-10-31",
                            "hour": 15,
                            "count": 2
                        },
                        {
                            "date": "2021-10-31",
                            "hour": 16,
                            "count": 2
                        },
                        {
                            "date": "2021-10-31",
                            "hour": 17,
                            "count": 6
                        },
                        {
                            "date": "2021-10-31",
                            "hour": 18,
                            "count": 3
                        },
                        {
                            "date": "2021-10-31",
                            "hour": 19,
                            "count": 4
                        },
                        {
                            "date": "2021-10-31",
                            "hour": 20,
                            "count": 1
                        },
                        {
                            "date": "2021-10-31",
                            "hour": 21,
                            "count": 4
                        },
                        {
                            "date": "2021-10-31",
                            "hour": 23,
                            "count": 3
                        },
                        {
                            "date": "2021-11-01",
                            "hour": 1,
                            "count": 1
                        },
                        {
                            "date": "2021-11-01",
                            "hour": 2,
                            "count": 1
                        },
                        {
                            "date": "2021-11-01",
                            "hour": 3,
                            "count": 2
                        },
                        {
                            "date": "2021-11-01",
                            "hour": 5,
                            "count": 11
                        },
                        {
                            "date": "2021-11-01",
                            "hour": 6,
                            "count": 2
                        },
                        {
                            "date": "2021-11-01",
                            "hour": 7,
                            "count": 1
                        },
                        {
                            "date": "2021-11-01",
                            "hour": 8,
                            "count": 8
                        },
                        {
                            "date": "2021-11-01",
                            "hour": 9,
                            "count": 4
                        },
                        {
                            "date": "2021-11-01",
                            "hour": 10,
                            "count": 3
                        },
                        {
                            "date": "2021-11-01",
                            "hour": 11,
                            "count": 3
                        },
                        {
                            "date": "2021-11-01",
                            "hour": 12,
                            "count": 2
                        },
                        {
                            "date": "2021-11-01",
                            "hour": 13,
                            "count": 9
                        },
                        {
                            "date": "2021-11-01",
                            "hour": 14,
                            "count": 6
                        },
                        {
                            "date": "2021-11-01",
                            "hour": 15,
                            "count": 2
                        },
                        {
                            "date": "2021-11-01",
                            "hour": 16,
                            "count": 5
                        },
                        {
                            "date": "2021-11-01",
                            "hour": 17,
                            "count": 5
                        },
                        {
                            "date": "2021-11-01",
                            "hour": 18,
                            "count": 5
                        },
                        {
                            "date": "2021-11-01",
                            "hour": 19,
                            "count": 5
                        },
                        {
                            "date": "2021-11-01",
                            "hour": 20,
                            "count": 9
                        },
                        {
                            "date": "2021-11-01",
                            "hour": 21,
                            "count": 3
                        },
                        {
                            "date": "2021-11-01",
                            "hour": 22,
                            "count": 4
                        },
                        {
                            "date": "2021-11-01",
                            "hour": 23,
                            "count": 2
                        },
                        {
                            "date": "2021-11-02",
                            "hour": 0,
                            "count": 1
                        },
                        {
                            "date": "2021-11-02",
                            "hour": 1,
                            "count": 1
                        },
                        {
                            "date": "2021-11-02",
                            "hour": 3,
                            "count": 1
                        },
                        {
                            "date": "2021-11-02",
                            "hour": 5,
                            "count": 2
                        },
                        {
                            "date": "2021-11-02",
                            "hour": 6,
                            "count": 2
                        },
                        {
                            "date": "2021-11-02",
                            "hour": 7,
                            "count": 6
                        },
                        {
                            "date": "2021-11-02",
                            "hour": 8,
                            "count": 4
                        },
                        {
                            "date": "2021-11-02",
                            "hour": 9,
                            "count": 1
                        },
                        {
                            "date": "2021-11-02",
                            "hour": 10,
                            "count": 3
                        },
                        {
                            "date": "2021-11-02",
                            "hour": 11,
                            "count": 6
                        },
                        {
                            "date": "2021-11-02",
                            "hour": 12,
                            "count": 2
                        },
                        {
                            "date": "2021-11-02",
                            "hour": 13,
                            "count": 6
                        },
                        {
                            "date": "2021-11-02",
                            "hour": 14,
                            "count": 6
                        },
                        {
                            "date": "2021-11-02",
                            "hour": 15,
                            "count": 4
                        },
                        {
                            "date": "2021-11-02",
                            "hour": 16,
                            "count": 8
                        },
                        {
                            "date": "2021-11-02",
                            "hour": 17,
                            "count": 5
                        },
                        {
                            "date": "2021-11-02",
                            "hour": 18,
                            "count": 1
                        },
                        {
                            "date": "2021-11-02",
                            "hour": 19,
                            "count": 5
                        },
                        {
                            "date": "2021-11-02",
                            "hour": 20,
                            "count": 2
                        },
                        {
                            "date": "2021-11-02",
                            "hour": 21,
                            "count": 2
                        },
                        {
                            "date": "2021-11-02",
                            "hour": 22,
                            "count": 1
                        },
                        {
                            "date": "2021-11-02",
                            "hour": 23,
                            "count": 2
                        },
                        {
                            "date": "2021-11-03",
                            "hour": 0,
                            "count": 3
                        },
                        {
                            "date": "2021-11-03",
                            "hour": 1,
                            "count": 1
                        },
                        {
                            "date": "2021-11-03",
                            "hour": 2,
                            "count": 1
                        },
                        {
                            "date": "2021-11-03",
                            "hour": 3,
                            "count": 1
                        },
                        {
                            "date": "2021-11-03",
                            "hour": 5,
                            "count": 5
                        },
                        {
                            "date": "2021-11-03",
                            "hour": 6,
                            "count": 1
                        },
                        {
                            "date": "2021-11-03",
                            "hour": 7,
                            "count": 7
                        },
                        {
                            "date": "2021-11-03",
                            "hour": 8,
                            "count": 1
                        },
                        {
                            "date": "2021-11-03",
                            "hour": 9,
                            "count": 8
                        },
                        {
                            "date": "2021-11-03",
                            "hour": 10,
                            "count": 6
                        },
                        {
                            "date": "2021-11-03",
                            "hour": 11,
                            "count": 6
                        },
                        {
                            "date": "2021-11-03",
                            "hour": 12,
                            "count": 2
                        },
                        {
                            "date": "2021-11-03",
                            "hour": 13,
                            "count": 5
                        },
                        {
                            "date": "2021-11-03",
                            "hour": 14,
                            "count": 3
                        },
                        {
                            "date": "2021-11-03",
                            "hour": 15,
                            "count": 7
                        },
                        {
                            "date": "2021-11-03",
                            "hour": 17,
                            "count": 1
                        },
                        {
                            "date": "2021-11-03",
                            "hour": 18,
                            "count": 1
                        },
                        {
                            "date": "2021-11-03",
                            "hour": 19,
                            "count": 3
                        },
                        {
                            "date": "2021-11-03",
                            "hour": 20,
                            "count": 5
                        },
                        {
                            "date": "2021-11-03",
                            "hour": 21,
                            "count": 2
                        },
                        {
                            "date": "2021-11-03",
                            "hour": 23,
                            "count": 1
                        },
                        {
                            "date": "2021-11-04",
                            "hour": 1,
                            "count": 1
                        },
                        {
                            "date": "2021-11-04",
                            "hour": 2,
                            "count": 1
                        },
                        {
                            "date": "2021-11-04",
                            "hour": 3,
                            "count": 4
                        },
                        {
                            "date": "2021-11-04",
                            "hour": 4,
                            "count": 1
                        },
                        {
                            "date": "2021-11-04",
                            "hour": 5,
                            "count": 5
                        },
                        {
                            "date": "2021-11-04",
                            "hour": 6,
                            "count": 4
                        },
                        {
                            "date": "2021-11-04",
                            "hour": 7,
                            "count": 1
                        },
                        {
                            "date": "2021-11-04",
                            "hour": 8,
                            "count": 2
                        },
                        {
                            "date": "2021-11-04",
                            "hour": 9,
                            "count": 4
                        },
                        {
                            "date": "2021-11-04",
                            "hour": 11,
                            "count": 9
                        },
                        {
                            "date": "2021-11-04",
                            "hour": 12,
                            "count": 5
                        },
                        {
                            "date": "2021-11-04",
                            "hour": 13,
                            "count": 1
                        },
                        {
                            "date": "2021-11-04",
                            "hour": 14,
                            "count": 1
                        },
                        {
                            "date": "2021-11-04",
                            "hour": 15,
                            "count": 1
                        },
                        {
                            "date": "2021-11-04",
                            "hour": 16,
                            "count": 2
                        },
                        {
                            "date": "2021-11-04",
                            "hour": 17,
                            "count": 11
                        },
                        {
                            "date": "2021-11-04",
                            "hour": 19,
                            "count": 4
                        },
                        {
                            "date": "2021-11-04",
                            "hour": 20,
                            "count": 2
                        },
                        {
                            "date": "2021-11-04",
                            "hour": 21,
                            "count": 3
                        },
                        {
                            "date": "2021-11-04",
                            "hour": 22,
                            "count": 2
                        }
                    ],
                    "total_wallets_count": 114021,
                    "active_wallets_count": 6450,
                    "dev_wallet_balance": 31093834638883,
                    "_id": "6076ff1722617f6c87013ac7",
                    "coin": "pirate",
                    "createdAt": "2021-04-14T14:41:27.585Z",
                    "updatedAt": "2021-11-04T23:15:07.341Z",
                    "__v": 15135,
                    "masternodesCount": {
                        "total": 1378,
                        "stable": 1378,
                        "obfcompat": 0,
                        "enabled": 1378,
                        "inqueue": 0,
                        "ipv4": 0,
                        "ipv6": 0,
                        "onion": 0
                    }
                },
                "market_summary": {
                    "24hVolume": {
                        "BTC": 563
                    },
                    "usd_price": {
                        "BTC": 0.027440705723719358
                    }
                }
            },
            {
                "wallet": "Twins",
                "symbol": "TWINS",
                "explorer": "http://chain.review/explorer/twins",
                "api": "http://chain.review/public-api/db/twins",
                "stats": {
                    "last_block": 733736,
                    "difficulty": "21808018.13991312",
                    "moneysupply": "10762634146.878275",
                    "hashrate": "882262.3343",
                    "supply": 10762634146.878275,
                    "blockcount": 733736,
                    "connections": 123,
                    "masternodesCountByCollateral": 8099,
                    "last_price": 0,
                    "version": "3030900",
                    "protocol": "70926",
                    "walletversion": "61000",
                    "users_tx_count_24_hours": 65,
                    "users_tx_chart": [
                        {
                            "date": "2021-11-12",
                            "hour": 8,
                            "count": 1
                        },
                        {
                            "date": "2021-11-12",
                            "hour": 9,
                            "count": 1
                        },
                        {
                            "date": "2021-11-12",
                            "hour": 10,
                            "count": 5
                        },
                        {
                            "date": "2021-11-12",
                            "hour": 11,
                            "count": 5
                        },
                        {
                            "date": "2021-11-12",
                            "hour": 12,
                            "count": 13
                        },
                        {
                            "date": "2021-11-12",
                            "hour": 13,
                            "count": 17
                        },
                        {
                            "date": "2021-11-12",
                            "hour": 14,
                            "count": 8
                        },
                        {
                            "date": "2021-11-12",
                            "hour": 15,
                            "count": 3
                        },
                        {
                            "date": "2021-11-12",
                            "hour": 17,
                            "count": 3
                        },
                        {
                            "date": "2021-11-12",
                            "hour": 18,
                            "count": 2
                        },
                        {
                            "date": "2021-11-12",
                            "hour": 19,
                            "count": 2
                        },
                        {
                            "date": "2021-11-12",
                            "hour": 20,
                            "count": 4
                        },
                        {
                            "date": "2021-11-12",
                            "hour": 21,
                            "count": 3
                        },
                        {
                            "date": "2021-11-12",
                            "hour": 22,
                            "count": 5
                        },
                        {
                            "date": "2021-11-12",
                            "hour": 23,
                            "count": 2
                        },
                        {
                            "date": "2021-11-13",
                            "hour": 0,
                            "count": 9
                        },
                        {
                            "date": "2021-11-13",
                            "hour": 1,
                            "count": 3
                        },
                        {
                            "date": "2021-11-13",
                            "hour": 2,
                            "count": 7
                        },
                        {
                            "date": "2021-11-13",
                            "hour": 3,
                            "count": 2
                        },
                        {
                            "date": "2021-11-13",
                            "hour": 4,
                            "count": 3
                        },
                        {
                            "date": "2021-11-13",
                            "hour": 5,
                            "count": 2
                        },
                        {
                            "date": "2021-11-13",
                            "hour": 6,
                            "count": 1
                        },
                        {
                            "date": "2021-11-13",
                            "hour": 7,
                            "count": 4
                        },
                        {
                            "date": "2021-11-13",
                            "hour": 8,
                            "count": 1
                        },
                        {
                            "date": "2021-11-13",
                            "hour": 9,
                            "count": 2
                        },
                        {
                            "date": "2021-11-13",
                            "hour": 10,
                            "count": 4
                        },
                        {
                            "date": "2021-11-13",
                            "hour": 11,
                            "count": 2
                        },
                        {
                            "date": "2021-11-13",
                            "hour": 12,
                            "count": 4
                        },
                        {
                            "date": "2021-11-13",
                            "hour": 13,
                            "count": 5
                        },
                        {
                            "date": "2021-11-13",
                            "hour": 14,
                            "count": 6
                        },
                        {
                            "date": "2021-11-13",
                            "hour": 15,
                            "count": 4
                        },
                        {
                            "date": "2021-11-13",
                            "hour": 16,
                            "count": 3
                        },
                        {
                            "date": "2021-11-13",
                            "hour": 17,
                            "count": 3
                        },
                        {
                            "date": "2021-11-13",
                            "hour": 18,
                            "count": 2
                        },
                        {
                            "date": "2021-11-13",
                            "hour": 19,
                            "count": 5
                        },
                        {
                            "date": "2021-11-13",
                            "hour": 20,
                            "count": 5
                        },
                        {
                            "date": "2021-11-13",
                            "hour": 21,
                            "count": 3
                        },
                        {
                            "date": "2021-11-13",
                            "hour": 22,
                            "count": 5
                        },
                        {
                            "date": "2021-11-13",
                            "hour": 23,
                            "count": 5
                        },
                        {
                            "date": "2021-11-14",
                            "hour": 0,
                            "count": 3
                        },
                        {
                            "date": "2021-11-14",
                            "hour": 2,
                            "count": 3
                        },
                        {
                            "date": "2021-11-14",
                            "hour": 3,
                            "count": 1
                        },
                        {
                            "date": "2021-11-14",
                            "hour": 4,
                            "count": 2
                        },
                        {
                            "date": "2021-11-14",
                            "hour": 5,
                            "count": 1
                        },
                        {
                            "date": "2021-11-14",
                            "hour": 6,
                            "count": 4
                        },
                        {
                            "date": "2021-11-14",
                            "hour": 7,
                            "count": 1
                        },
                        {
                            "date": "2021-11-14",
                            "hour": 8,
                            "count": 1
                        },
                        {
                            "date": "2021-11-14",
                            "hour": 9,
                            "count": 2
                        },
                        {
                            "date": "2021-11-14",
                            "hour": 10,
                            "count": 4
                        },
                        {
                            "date": "2021-11-14",
                            "hour": 11,
                            "count": 5
                        },
                        {
                            "date": "2021-11-14",
                            "hour": 12,
                            "count": 4
                        },
                        {
                            "date": "2021-11-14",
                            "hour": 13,
                            "count": 6
                        },
                        {
                            "date": "2021-11-14",
                            "hour": 14,
                            "count": 3
                        },
                        {
                            "date": "2021-11-14",
                            "hour": 15,
                            "count": 2
                        },
                        {
                            "date": "2021-11-14",
                            "hour": 16,
                            "count": 1
                        },
                        {
                            "date": "2021-11-14",
                            "hour": 17,
                            "count": 1
                        },
                        {
                            "date": "2021-11-14",
                            "hour": 18,
                            "count": 4
                        },
                        {
                            "date": "2021-11-14",
                            "hour": 19,
                            "count": 3
                        },
                        {
                            "date": "2021-11-14",
                            "hour": 20,
                            "count": 1
                        },
                        {
                            "date": "2021-11-14",
                            "hour": 21,
                            "count": 4
                        },
                        {
                            "date": "2021-11-14",
                            "hour": 22,
                            "count": 2
                        },
                        {
                            "date": "2021-11-14",
                            "hour": 23,
                            "count": 2
                        },
                        {
                            "date": "2021-11-15",
                            "hour": 0,
                            "count": 2
                        },
                        {
                            "date": "2021-11-15",
                            "hour": 1,
                            "count": 1
                        },
                        {
                            "date": "2021-11-15",
                            "hour": 2,
                            "count": 1
                        },
                        {
                            "date": "2021-11-15",
                            "hour": 3,
                            "count": 3
                        },
                        {
                            "date": "2021-11-15",
                            "hour": 5,
                            "count": 5
                        },
                        {
                            "date": "2021-11-15",
                            "hour": 6,
                            "count": 3
                        },
                        {
                            "date": "2021-11-15",
                            "hour": 7,
                            "count": 2
                        },
                        {
                            "date": "2021-11-15",
                            "hour": 8,
                            "count": 2
                        },
                        {
                            "date": "2021-11-15",
                            "hour": 10,
                            "count": 2
                        },
                        {
                            "date": "2021-11-15",
                            "hour": 12,
                            "count": 3
                        },
                        {
                            "date": "2021-11-15",
                            "hour": 13,
                            "count": 3
                        },
                        {
                            "date": "2021-11-15",
                            "hour": 14,
                            "count": 4
                        },
                        {
                            "date": "2021-11-15",
                            "hour": 15,
                            "count": 2
                        },
                        {
                            "date": "2021-11-15",
                            "hour": 16,
                            "count": 4
                        },
                        {
                            "date": "2021-11-15",
                            "hour": 17,
                            "count": 6
                        },
                        {
                            "date": "2021-11-15",
                            "hour": 18,
                            "count": 4
                        },
                        {
                            "date": "2021-11-15",
                            "hour": 20,
                            "count": 2
                        },
                        {
                            "date": "2021-11-15",
                            "hour": 21,
                            "count": 2
                        },
                        {
                            "date": "2021-11-15",
                            "hour": 22,
                            "count": 1
                        },
                        {
                            "date": "2021-11-15",
                            "hour": 23,
                            "count": 1
                        },
                        {
                            "date": "2021-11-16",
                            "hour": 0,
                            "count": 9
                        },
                        {
                            "date": "2021-11-16",
                            "hour": 1,
                            "count": 1
                        },
                        {
                            "date": "2021-11-16",
                            "hour": 3,
                            "count": 2
                        },
                        {
                            "date": "2021-11-16",
                            "hour": 4,
                            "count": 3
                        },
                        {
                            "date": "2021-11-16",
                            "hour": 5,
                            "count": 1
                        },
                        {
                            "date": "2021-11-16",
                            "hour": 6,
                            "count": 2
                        },
                        {
                            "date": "2021-11-16",
                            "hour": 7,
                            "count": 4
                        },
                        {
                            "date": "2021-11-16",
                            "hour": 8,
                            "count": 2
                        },
                        {
                            "date": "2021-11-16",
                            "hour": 9,
                            "count": 4
                        },
                        {
                            "date": "2021-11-16",
                            "hour": 10,
                            "count": 5
                        },
                        {
                            "date": "2021-11-16",
                            "hour": 11,
                            "count": 1
                        },
                        {
                            "date": "2021-11-16",
                            "hour": 12,
                            "count": 9
                        },
                        {
                            "date": "2021-11-16",
                            "hour": 13,
                            "count": 3
                        },
                        {
                            "date": "2021-11-16",
                            "hour": 14,
                            "count": 3
                        },
                        {
                            "date": "2021-11-16",
                            "hour": 15,
                            "count": 6
                        },
                        {
                            "date": "2021-11-16",
                            "hour": 16,
                            "count": 7
                        },
                        {
                            "date": "2021-11-16",
                            "hour": 17,
                            "count": 3
                        },
                        {
                            "date": "2021-11-16",
                            "hour": 18,
                            "count": 1
                        },
                        {
                            "date": "2021-11-16",
                            "hour": 19,
                            "count": 3
                        },
                        {
                            "date": "2021-11-16",
                            "hour": 20,
                            "count": 2
                        },
                        {
                            "date": "2021-11-16",
                            "hour": 21,
                            "count": 6
                        },
                        {
                            "date": "2021-11-16",
                            "hour": 22,
                            "count": 5
                        },
                        {
                            "date": "2021-11-16",
                            "hour": 23,
                            "count": 1
                        },
                        {
                            "date": "2021-11-17",
                            "hour": 0,
                            "count": 3
                        },
                        {
                            "date": "2021-11-17",
                            "hour": 1,
                            "count": 2
                        },
                        {
                            "date": "2021-11-17",
                            "hour": 2,
                            "count": 4
                        },
                        {
                            "date": "2021-11-17",
                            "hour": 3,
                            "count": 1
                        },
                        {
                            "date": "2021-11-17",
                            "hour": 4,
                            "count": 5
                        },
                        {
                            "date": "2021-11-17",
                            "hour": 5,
                            "count": 6
                        },
                        {
                            "date": "2021-11-17",
                            "hour": 6,
                            "count": 2
                        },
                        {
                            "date": "2021-11-17",
                            "hour": 7,
                            "count": 3
                        },
                        {
                            "date": "2021-11-17",
                            "hour": 8,
                            "count": 4
                        },
                        {
                            "date": "2021-11-17",
                            "hour": 9,
                            "count": 2
                        },
                        {
                            "date": "2021-11-17",
                            "hour": 10,
                            "count": 4
                        },
                        {
                            "date": "2021-11-17",
                            "hour": 11,
                            "count": 5
                        },
                        {
                            "date": "2021-11-17",
                            "hour": 12,
                            "count": 1
                        },
                        {
                            "date": "2021-11-17",
                            "hour": 13,
                            "count": 3
                        },
                        {
                            "date": "2021-11-17",
                            "hour": 14,
                            "count": 1
                        },
                        {
                            "date": "2021-11-17",
                            "hour": 15,
                            "count": 5
                        },
                        {
                            "date": "2021-11-17",
                            "hour": 16,
                            "count": 2
                        },
                        {
                            "date": "2021-11-17",
                            "hour": 18,
                            "count": 2
                        },
                        {
                            "date": "2021-11-17",
                            "hour": 19,
                            "count": 4
                        },
                        {
                            "date": "2021-11-17",
                            "hour": 20,
                            "count": 6
                        },
                        {
                            "date": "2021-11-17",
                            "hour": 21,
                            "count": 4
                        },
                        {
                            "date": "2021-11-17",
                            "hour": 23,
                            "count": 4
                        },
                        {
                            "date": "2021-11-18",
                            "hour": 0,
                            "count": 5
                        },
                        {
                            "date": "2021-11-18",
                            "hour": 1,
                            "count": 3
                        },
                        {
                            "date": "2021-11-18",
                            "hour": 2,
                            "count": 4
                        },
                        {
                            "date": "2021-11-18",
                            "hour": 3,
                            "count": 3
                        },
                        {
                            "date": "2021-11-18",
                            "hour": 5,
                            "count": 1
                        },
                        {
                            "date": "2021-11-18",
                            "hour": 6,
                            "count": 3
                        },
                        {
                            "date": "2021-11-18",
                            "hour": 7,
                            "count": 2
                        },
                        {
                            "date": "2021-11-18",
                            "hour": 8,
                            "count": 4
                        },
                        {
                            "date": "2021-11-18",
                            "hour": 9,
                            "count": 2
                        },
                        {
                            "date": "2021-11-18",
                            "hour": 11,
                            "count": 4
                        },
                        {
                            "date": "2021-11-18",
                            "hour": 12,
                            "count": 3
                        },
                        {
                            "date": "2021-11-18",
                            "hour": 13,
                            "count": 2
                        },
                        {
                            "date": "2021-11-18",
                            "hour": 14,
                            "count": 7
                        },
                        {
                            "date": "2021-11-18",
                            "hour": 15,
                            "count": 2
                        },
                        {
                            "date": "2021-11-18",
                            "hour": 16,
                            "count": 3
                        },
                        {
                            "date": "2021-11-18",
                            "hour": 17,
                            "count": 4
                        },
                        {
                            "date": "2021-11-18",
                            "hour": 18,
                            "count": 2
                        },
                        {
                            "date": "2021-11-18",
                            "hour": 20,
                            "count": 3
                        },
                        {
                            "date": "2021-11-18",
                            "hour": 21,
                            "count": 3
                        },
                        {
                            "date": "2021-11-18",
                            "hour": 22,
                            "count": 4
                        },
                        {
                            "date": "2021-11-18",
                            "hour": 23,
                            "count": 3
                        },
                        {
                            "date": "2021-11-19",
                            "hour": 0,
                            "count": 1
                        },
                        {
                            "date": "2021-11-19",
                            "hour": 1,
                            "count": 5
                        },
                        {
                            "date": "2021-11-19",
                            "hour": 2,
                            "count": 3
                        },
                        {
                            "date": "2021-11-19",
                            "hour": 3,
                            "count": 3
                        },
                        {
                            "date": "2021-11-19",
                            "hour": 4,
                            "count": 1
                        },
                        {
                            "date": "2021-11-19",
                            "hour": 5,
                            "count": 6
                        },
                        {
                            "date": "2021-11-19",
                            "hour": 6,
                            "count": 2
                        },
                        {
                            "date": "2021-11-19",
                            "hour": 7,
                            "count": 1
                        },
                        {
                            "date": "2021-11-19",
                            "hour": 8,
                            "count": 1
                        }
                    ],
                    "total_wallets_count": 120139,
                    "active_wallets_count": 2714,
                    "dev_wallet_balance": 3191030571386816,
                    "_id": "5e020d58d97d7d5d2f049ba5",
                    "last": 263649,
                    "coin": "twins",
                    "__v": 119110,
                    "updatedAt": "2021-11-19T08:50:25.984Z",
                    "createdAt": "2020-01-08T07:53:46.147Z",
                    "masternodesCount": {
                        "total": 377,
                        "stable": 377,
                        "obfcompat": 377,
                        "enabled": 377,
                        "inqueue": 366,
                        "ipv4": 143,
                        "ipv6": 234,
                        "onion": 0
                    }
                },
                "markets_stats": {
                    "New Capital": {
                        "24hVolume": "0.05108974",
                        "sellLiquidity": "0.16292012",
                        "buyLiquidity": "1.19433235",
                        "24hDeposits": 0,
                        "24hWithdrawals": 0,
                        "totalPriceBtc": 9.7191092256408e-8,
                        "totalPriceCount": 27,
                        "avgPriceBtc": "0.0000000036",
                        "buyLquidityOptions": [
                            {
                                "fromCoin": "TWINS",
                                "fromAmount": "0.000000",
                                "toCoin": "XEM",
                                "toMainCoin": "BTC",
                                "toAmount": "0.000000"
                            },
                            {
                                "fromCoin": "TWINS",
                                "fromAmount": "0.000000",
                                "toCoin": "TRTT",
                                "toMainCoin": "BTC",
                                "toAmount": "0.000000"
                            },
                            {
                                "fromCoin": "TWINS",
                                "fromAmount": "265.617250",
                                "toCoin": "STREAM",
                                "toMainCoin": "BTC",
                                "toAmount": "0.000076"
                            },
                            {
                                "fromCoin": "TWINS",
                                "fromAmount": "0.000000",
                                "toCoin": "LBC20",
                                "toMainCoin": "BTC",
                                "toAmount": "0.000000"
                            },
                            {
                                "fromCoin": "TWINS",
                                "fromAmount": "0.000000",
                                "toCoin": "LBC19",
                                "toMainCoin": "BTC",
                                "toAmount": "0.000000"
                            },
                            {
                                "fromCoin": "TWINS",
                                "fromAmount": "0.000000",
                                "toCoin": "LBC18",
                                "toMainCoin": "BTC",
                                "toAmount": "0.000000"
                            },
                            {
                                "fromCoin": "TWINS",
                                "fromAmount": "0.000000",
                                "toCoin": "LBC17",
                                "toMainCoin": "BTC",
                                "toAmount": "0.000000"
                            },
                            {
                                "fromCoin": "TWINS",
                                "fromAmount": "0.000000",
                                "toCoin": "LBC16",
                                "toMainCoin": "BTC",
                                "toAmount": "0.000000"
                            },
                            {
                                "fromCoin": "TWINS",
                                "fromAmount": "0.000000",
                                "toCoin": "LBC15",
                                "toMainCoin": "BTC",
                                "toAmount": "0.000000"
                            },
                            {
                                "fromCoin": "TWINS",
                                "fromAmount": "0.000000",
                                "toCoin": "LBC14",
                                "toMainCoin": "BTC",
                                "toAmount": "0.000000"
                            },
                            {
                                "fromCoin": "TWINS",
                                "fromAmount": "0.000000",
                                "toCoin": "LBC13",
                                "toMainCoin": "BTC",
                                "toAmount": "0.000000"
                            },
                            {
                                "fromCoin": "TWINS",
                                "fromAmount": "0.000000",
                                "toCoin": "LBC12",
                                "toMainCoin": "BTC",
                                "toAmount": "0.000000"
                            },
                            {
                                "fromCoin": "TWINS",
                                "fromAmount": "0.000000",
                                "toCoin": "LBC11",
                                "toMainCoin": "BTC",
                                "toAmount": "0.000000"
                            },
                            {
                                "fromCoin": "TWINS",
                                "fromAmount": "0.000000",
                                "toCoin": "LBC10",
                                "toMainCoin": "BTC",
                                "toAmount": "0.000000"
                            },
                            {
                                "fromCoin": "TWINS",
                                "fromAmount": "0.000000",
                                "toCoin": "LBC09",
                                "toMainCoin": "BTC",
                                "toAmount": "0.000000"
                            },
                            {
                                "fromCoin": "TWINS",
                                "fromAmount": "0.000000",
                                "toCoin": "LBC08",
                                "toMainCoin": "BTC",
                                "toAmount": "0.000000"
                            },
                            {
                                "fromCoin": "TWINS",
                                "fromAmount": "0.000000",
                                "toCoin": "LBC07",
                                "toMainCoin": "BTC",
                                "toAmount": "0.000000"
                            },
                            {
                                "fromCoin": "TWINS",
                                "fromAmount": "0.000000",
                                "toCoin": "LBC06",
                                "toMainCoin": "BTC",
                                "toAmount": "0.000000"
                            },
                            {
                                "fromCoin": "TWINS",
                                "fromAmount": "0.000000",
                                "toCoin": "LBC05",
                                "toMainCoin": "BTC",
                                "toAmount": "0.000000"
                            },
                            {
                                "fromCoin": "TWINS",
                                "fromAmount": "0.000000",
                                "toCoin": "LBC04",
                                "toMainCoin": "BTC",
                                "toAmount": "0.000000"
                            },
                            {
                                "fromCoin": "TWINS",
                                "fromAmount": "0.000000",
                                "toCoin": "LBC03",
                                "toMainCoin": "BTC",
                                "toAmount": "0.000000"
                            },
                            {
                                "fromCoin": "TWINS",
                                "fromAmount": "0.000000",
                                "toCoin": "LBC02",
                                "toMainCoin": "BTC",
                                "toAmount": "0.000000"
                            },
                            {
                                "fromCoin": "TWINS",
                                "fromAmount": "0.000000",
                                "toCoin": "LBC01",
                                "toMainCoin": "BTC",
                                "toAmount": "0.000000"
                            },
                            {
                                "fromCoin": "TWINS",
                                "fromAmount": "0.000000",
                                "toCoin": "FIX",
                                "toMainCoin": "BTC",
                                "toAmount": "0.000000"
                            },
                            {
                                "fromCoin": "TWINS",
                                "fromAmount": "0.000000",
                                "toCoin": "DOGEC",
                                "toMainCoin": "BTC",
                                "toAmount": "0.000000"
                            },
                            {
                                "fromCoin": "TWINS",
                                "fromAmount": "0.000000",
                                "toCoin": "DGB",
                                "toMainCoin": "BTC",
                                "toAmount": "0.000000"
                            },
                            {
                                "fromCoin": "TWINS",
                                "fromAmount": "1.194256",
                                "toCoin": "BTC",
                                "toMainCoin": "BTC",
                                "toAmount": "1.194256"
                            }
                        ],
                        "sellLquidityOptions": [
                            {
                                "fromCoin": "TWINS",
                                "fromAmount": "0.000000",
                                "toCoin": "XEM",
                                "toMainCoin": "BTC",
                                "toAmount": "0.000000"
                            },
                            {
                                "fromCoin": "TWINS",
                                "fromAmount": "0.000000",
                                "toCoin": "TRTT",
                                "toMainCoin": "BTC",
                                "toAmount": "0.000000"
                            },
                            {
                                "fromCoin": "TWINS",
                                "fromAmount": "74990.000000",
                                "toCoin": "STREAM",
                                "toMainCoin": "BTC",
                                "toAmount": "0.000270"
                            },
                            {
                                "fromCoin": "TWINS",
                                "fromAmount": "0.000000",
                                "toCoin": "LBC20",
                                "toMainCoin": "BTC",
                                "toAmount": "0.000000"
                            },
                            {
                                "fromCoin": "TWINS",
                                "fromAmount": "0.000000",
                                "toCoin": "LBC19",
                                "toMainCoin": "BTC",
                                "toAmount": "0.000000"
                            },
                            {
                                "fromCoin": "TWINS",
                                "fromAmount": "0.000000",
                                "toCoin": "LBC18",
                                "toMainCoin": "BTC",
                                "toAmount": "0.000000"
                            },
                            {
                                "fromCoin": "TWINS",
                                "fromAmount": "0.000000",
                                "toCoin": "LBC17",
                                "toMainCoin": "BTC",
                                "toAmount": "0.000000"
                            },
                            {
                                "fromCoin": "TWINS",
                                "fromAmount": "0.000000",
                                "toCoin": "LBC16",
                                "toMainCoin": "BTC",
                                "toAmount": "0.000000"
                            },
                            {
                                "fromCoin": "TWINS",
                                "fromAmount": "0.000000",
                                "toCoin": "LBC15",
                                "toMainCoin": "BTC",
                                "toAmount": "0.000000"
                            },
                            {
                                "fromCoin": "TWINS",
                                "fromAmount": "0.000000",
                                "toCoin": "LBC14",
                                "toMainCoin": "BTC",
                                "toAmount": "0.000000"
                            },
                            {
                                "fromCoin": "TWINS",
                                "fromAmount": "0.000000",
                                "toCoin": "LBC13",
                                "toMainCoin": "BTC",
                                "toAmount": "0.000000"
                            },
                            {
                                "fromCoin": "TWINS",
                                "fromAmount": "0.000000",
                                "toCoin": "LBC12",
                                "toMainCoin": "BTC",
                                "toAmount": "0.000000"
                            },
                            {
                                "fromCoin": "TWINS",
                                "fromAmount": "0.000000",
                                "toCoin": "LBC11",
                                "toMainCoin": "BTC",
                                "toAmount": "0.000000"
                            },
                            {
                                "fromCoin": "TWINS",
                                "fromAmount": "0.000000",
                                "toCoin": "LBC10",
                                "toMainCoin": "BTC",
                                "toAmount": "0.000000"
                            },
                            {
                                "fromCoin": "TWINS",
                                "fromAmount": "0.000000",
                                "toCoin": "LBC09",
                                "toMainCoin": "BTC",
                                "toAmount": "0.000000"
                            },
                            {
                                "fromCoin": "TWINS",
                                "fromAmount": "0.000000",
                                "toCoin": "LBC08",
                                "toMainCoin": "BTC",
                                "toAmount": "0.000000"
                            },
                            {
                                "fromCoin": "TWINS",
                                "fromAmount": "0.000000",
                                "toCoin": "LBC07",
                                "toMainCoin": "BTC",
                                "toAmount": "0.000000"
                            },
                            {
                                "fromCoin": "TWINS",
                                "fromAmount": "0.000000",
                                "toCoin": "LBC06",
                                "toMainCoin": "BTC",
                                "toAmount": "0.000000"
                            },
                            {
                                "fromCoin": "TWINS",
                                "fromAmount": "0.000000",
                                "toCoin": "LBC05",
                                "toMainCoin": "BTC",
                                "toAmount": "0.000000"
                            },
                            {
                                "fromCoin": "TWINS",
                                "fromAmount": "0.000000",
                                "toCoin": "LBC04",
                                "toMainCoin": "BTC",
                                "toAmount": "0.000000"
                            },
                            {
                                "fromCoin": "TWINS",
                                "fromAmount": "0.000000",
                                "toCoin": "LBC03",
                                "toMainCoin": "BTC",
                                "toAmount": "0.000000"
                            },
                            {
                                "fromCoin": "TWINS",
                                "fromAmount": "0.000000",
                                "toCoin": "LBC02",
                                "toMainCoin": "BTC",
                                "toAmount": "0.000000"
                            },
                            {
                                "fromCoin": "TWINS",
                                "fromAmount": "0.000000",
                                "toCoin": "LBC01",
                                "toMainCoin": "BTC",
                                "toAmount": "0.000000"
                            },
                            {
                                "fromCoin": "TWINS",
                                "fromAmount": "0.000000",
                                "toCoin": "FIX",
                                "toMainCoin": "BTC",
                                "toAmount": "0.000000"
                            },
                            {
                                "fromCoin": "TWINS",
                                "fromAmount": "0.000000",
                                "toCoin": "DOGEC",
                                "toMainCoin": "BTC",
                                "toAmount": "0.000000"
                            },
                            {
                                "fromCoin": "TWINS",
                                "fromAmount": "0.000000",
                                "toCoin": "DGB",
                                "toMainCoin": "BTC",
                                "toAmount": "0.000000"
                            },
                            {
                                "fromCoin": "TWINS",
                                "fromAmount": "45180599.000000",
                                "toCoin": "BTC",
                                "toMainCoin": "BTC",
                                "toAmount": "0.162650"
                            }
                        ]
                    }
                },
                "market_summary": {
                    "24hVolume": {
                        "BTC": 1970
                    },
                    "usd_price": {
                        "BTC": 0.00020559582817434777
                    }
                }
            },
            {
                "wallet": "Digibyte",
                "symbol": "DGB",
                "explorer": "http://chain.review/explorer/digibyte",
                "api": "http://chain.review/public-api/db/digibyte",
                "markets_stats": {
                    "New Capital": {
                        "24hVolume": "0.00000000",
                        "sellLiquidity": "0.02347312",
                        "buyLiquidity": "0.91608147",
                        "24hDeposits": 0,
                        "24hWithdrawals": 0,
                        "totalPriceBtc": 0.0000026399999998328,
                        "totalPriceCount": 3,
                        "avgPriceBtc": "0.0000008800",
                        "buyLquidityOptions": [
                            {
                                "fromCoin": "DGB",
                                "fromAmount": "0.000000",
                                "toCoin": "XEM",
                                "toMainCoin": "BTC",
                                "toAmount": "0.000000"
                            },
                            {
                                "fromCoin": "DGB",
                                "fromAmount": "0.000000",
                                "toCoin": "TWINS",
                                "toMainCoin": "BTC",
                                "toAmount": "0.000000"
                            },
                            {
                                "fromCoin": "DGB",
                                "fromAmount": "0.916081",
                                "toCoin": "BTC",
                                "toMainCoin": "BTC",
                                "toAmount": "0.916081"
                            }
                        ],
                        "sellLquidityOptions": [
                            {
                                "fromCoin": "DGB",
                                "fromAmount": "0.000000",
                                "toCoin": "XEM",
                                "toMainCoin": "BTC",
                                "toAmount": "0.000000"
                            },
                            {
                                "fromCoin": "DGB",
                                "fromAmount": "0.000000",
                                "toCoin": "TWINS",
                                "toMainCoin": "BTC",
                                "toAmount": "0.000000"
                            },
                            {
                                "fromCoin": "DGB",
                                "fromAmount": "26674.000000",
                                "toCoin": "BTC",
                                "toMainCoin": "BTC",
                                "toAmount": "0.023473"
                            }
                        ]
                    }
                },
                "stats": {
                    "last_block": 14030337,
                    "difficulty": "91165.58256033623",
                    "moneysupply": "14853340036.43658",
                    "hashrate": "161744140.9892",
                    "supply": 14853341008.731432,
                    "blockcount": 14030339,
                    "connections": 118,
                    "masternodesCountByCollateral": 0,
                    "last_price": 0,
                    "version": "7170200",
                    "protocol": "70017",
                    "walletversion": "169900",
                    "users_tx_count_24_hours": 7566,
                    "users_tx_chart": [
                        {
                            "date": "2021-11-12",
                            "hour": 0,
                            "count": 207
                        },
                        {
                            "date": "2021-11-12",
                            "hour": 1,
                            "count": 257
                        },
                        {
                            "date": "2021-11-12",
                            "hour": 2,
                            "count": 194
                        },
                        {
                            "date": "2021-11-12",
                            "hour": 3,
                            "count": 279
                        },
                        {
                            "date": "2021-11-12",
                            "hour": 4,
                            "count": 558
                        },
                        {
                            "date": "2021-11-12",
                            "hour": 5,
                            "count": 610
                        },
                        {
                            "date": "2021-11-12",
                            "hour": 6,
                            "count": 513
                        },
                        {
                            "date": "2021-11-12",
                            "hour": 7,
                            "count": 405
                        },
                        {
                            "date": "2021-11-12",
                            "hour": 8,
                            "count": 249
                        },
                        {
                            "date": "2021-11-12",
                            "hour": 9,
                            "count": 203
                        },
                        {
                            "date": "2021-11-12",
                            "hour": 10,
                            "count": 198
                        },
                        {
                            "date": "2021-11-12",
                            "hour": 11,
                            "count": 252
                        },
                        {
                            "date": "2021-11-12",
                            "hour": 12,
                            "count": 230
                        },
                        {
                            "date": "2021-11-12",
                            "hour": 13,
                            "count": 297
                        },
                        {
                            "date": "2021-11-12",
                            "hour": 14,
                            "count": 262
                        },
                        {
                            "date": "2021-11-12",
                            "hour": 15,
                            "count": 266
                        },
                        {
                            "date": "2021-11-12",
                            "hour": 16,
                            "count": 277
                        },
                        {
                            "date": "2021-11-12",
                            "hour": 17,
                            "count": 185
                        },
                        {
                            "date": "2021-11-12",
                            "hour": 18,
                            "count": 233
                        },
                        {
                            "date": "2021-11-12",
                            "hour": 19,
                            "count": 170
                        },
                        {
                            "date": "2021-11-12",
                            "hour": 20,
                            "count": 204
                        },
                        {
                            "date": "2021-11-12",
                            "hour": 21,
                            "count": 200
                        },
                        {
                            "date": "2021-11-12",
                            "hour": 22,
                            "count": 201
                        },
                        {
                            "date": "2021-11-12",
                            "hour": 23,
                            "count": 156
                        },
                        {
                            "date": "2021-11-13",
                            "hour": 0,
                            "count": 216
                        },
                        {
                            "date": "2021-11-13",
                            "hour": 1,
                            "count": 150
                        },
                        {
                            "date": "2021-11-13",
                            "hour": 2,
                            "count": 193
                        },
                        {
                            "date": "2021-11-13",
                            "hour": 3,
                            "count": 355
                        },
                        {
                            "date": "2021-11-13",
                            "hour": 4,
                            "count": 222
                        },
                        {
                            "date": "2021-11-13",
                            "hour": 5,
                            "count": 215
                        },
                        {
                            "date": "2021-11-13",
                            "hour": 6,
                            "count": 285
                        },
                        {
                            "date": "2021-11-13",
                            "hour": 7,
                            "count": 311
                        },
                        {
                            "date": "2021-11-13",
                            "hour": 8,
                            "count": 276
                        },
                        {
                            "date": "2021-11-13",
                            "hour": 9,
                            "count": 196
                        },
                        {
                            "date": "2021-11-13",
                            "hour": 10,
                            "count": 323
                        },
                        {
                            "date": "2021-11-13",
                            "hour": 11,
                            "count": 204
                        },
                        {
                            "date": "2021-11-13",
                            "hour": 12,
                            "count": 242
                        },
                        {
                            "date": "2021-11-13",
                            "hour": 13,
                            "count": 197
                        },
                        {
                            "date": "2021-11-13",
                            "hour": 14,
                            "count": 319
                        },
                        {
                            "date": "2021-11-13",
                            "hour": 15,
                            "count": 311
                        },
                        {
                            "date": "2021-11-13",
                            "hour": 16,
                            "count": 195
                        },
                        {
                            "date": "2021-11-13",
                            "hour": 17,
                            "count": 213
                        },
                        {
                            "date": "2021-11-13",
                            "hour": 18,
                            "count": 254
                        },
                        {
                            "date": "2021-11-13",
                            "hour": 19,
                            "count": 230
                        },
                        {
                            "date": "2021-11-13",
                            "hour": 20,
                            "count": 224
                        },
                        {
                            "date": "2021-11-13",
                            "hour": 21,
                            "count": 185
                        },
                        {
                            "date": "2021-11-13",
                            "hour": 22,
                            "count": 189
                        },
                        {
                            "date": "2021-11-13",
                            "hour": 23,
                            "count": 169
                        },
                        {
                            "date": "2021-11-14",
                            "hour": 0,
                            "count": 159
                        },
                        {
                            "date": "2021-11-14",
                            "hour": 1,
                            "count": 184
                        },
                        {
                            "date": "2021-11-14",
                            "hour": 2,
                            "count": 159
                        },
                        {
                            "date": "2021-11-14",
                            "hour": 3,
                            "count": 185
                        },
                        {
                            "date": "2021-11-14",
                            "hour": 4,
                            "count": 338
                        },
                        {
                            "date": "2021-11-14",
                            "hour": 5,
                            "count": 552
                        },
                        {
                            "date": "2021-11-14",
                            "hour": 6,
                            "count": 434
                        },
                        {
                            "date": "2021-11-14",
                            "hour": 7,
                            "count": 463
                        },
                        {
                            "date": "2021-11-14",
                            "hour": 8,
                            "count": 327
                        },
                        {
                            "date": "2021-11-14",
                            "hour": 9,
                            "count": 259
                        },
                        {
                            "date": "2021-11-14",
                            "hour": 10,
                            "count": 301
                        },
                        {
                            "date": "2021-11-14",
                            "hour": 11,
                            "count": 459
                        },
                        {
                            "date": "2021-11-14",
                            "hour": 12,
                            "count": 410
                        },
                        {
                            "date": "2021-11-14",
                            "hour": 13,
                            "count": 228
                        },
                        {
                            "date": "2021-11-14",
                            "hour": 14,
                            "count": 263
                        },
                        {
                            "date": "2021-11-14",
                            "hour": 15,
                            "count": 340
                        },
                        {
                            "date": "2021-11-14",
                            "hour": 16,
                            "count": 224
                        },
                        {
                            "date": "2021-11-14",
                            "hour": 17,
                            "count": 213
                        },
                        {
                            "date": "2021-11-14",
                            "hour": 18,
                            "count": 222
                        },
                        {
                            "date": "2021-11-14",
                            "hour": 19,
                            "count": 210
                        },
                        {
                            "date": "2021-11-14",
                            "hour": 20,
                            "count": 178
                        },
                        {
                            "date": "2021-11-14",
                            "hour": 21,
                            "count": 219
                        },
                        {
                            "date": "2021-11-14",
                            "hour": 22,
                            "count": 233
                        },
                        {
                            "date": "2021-11-14",
                            "hour": 23,
                            "count": 224
                        },
                        {
                            "date": "2021-11-15",
                            "hour": 0,
                            "count": 243
                        },
                        {
                            "date": "2021-11-15",
                            "hour": 1,
                            "count": 569
                        },
                        {
                            "date": "2021-11-15",
                            "hour": 2,
                            "count": 503
                        },
                        {
                            "date": "2021-11-15",
                            "hour": 3,
                            "count": 202
                        },
                        {
                            "date": "2021-11-15",
                            "hour": 4,
                            "count": 268
                        },
                        {
                            "date": "2021-11-15",
                            "hour": 5,
                            "count": 274
                        },
                        {
                            "date": "2021-11-15",
                            "hour": 6,
                            "count": 414
                        },
                        {
                            "date": "2021-11-15",
                            "hour": 7,
                            "count": 205
                        },
                        {
                            "date": "2021-11-15",
                            "hour": 8,
                            "count": 238
                        },
                        {
                            "date": "2021-11-15",
                            "hour": 9,
                            "count": 321
                        },
                        {
                            "date": "2021-11-15",
                            "hour": 10,
                            "count": 294
                        },
                        {
                            "date": "2021-11-15",
                            "hour": 11,
                            "count": 172
                        },
                        {
                            "date": "2021-11-15",
                            "hour": 12,
                            "count": 277
                        },
                        {
                            "date": "2021-11-15",
                            "hour": 13,
                            "count": 330
                        },
                        {
                            "date": "2021-11-15",
                            "hour": 14,
                            "count": 355
                        },
                        {
                            "date": "2021-11-15",
                            "hour": 15,
                            "count": 298
                        },
                        {
                            "date": "2021-11-15",
                            "hour": 16,
                            "count": 232
                        },
                        {
                            "date": "2021-11-15",
                            "hour": 17,
                            "count": 177
                        },
                        {
                            "date": "2021-11-15",
                            "hour": 18,
                            "count": 271
                        },
                        {
                            "date": "2021-11-15",
                            "hour": 19,
                            "count": 184
                        },
                        {
                            "date": "2021-11-15",
                            "hour": 20,
                            "count": 195
                        },
                        {
                            "date": "2021-11-15",
                            "hour": 21,
                            "count": 216
                        },
                        {
                            "date": "2021-11-15",
                            "hour": 22,
                            "count": 206
                        },
                        {
                            "date": "2021-11-15",
                            "hour": 23,
                            "count": 150
                        },
                        {
                            "date": "2021-11-16",
                            "hour": 0,
                            "count": 187
                        },
                        {
                            "date": "2021-11-16",
                            "hour": 1,
                            "count": 205
                        },
                        {
                            "date": "2021-11-16",
                            "hour": 2,
                            "count": 256
                        },
                        {
                            "date": "2021-11-16",
                            "hour": 3,
                            "count": 177
                        },
                        {
                            "date": "2021-11-16",
                            "hour": 4,
                            "count": 322
                        },
                        {
                            "date": "2021-11-16",
                            "hour": 5,
                            "count": 198
                        },
                        {
                            "date": "2021-11-16",
                            "hour": 6,
                            "count": 221
                        },
                        {
                            "date": "2021-11-16",
                            "hour": 7,
                            "count": 360
                        },
                        {
                            "date": "2021-11-16",
                            "hour": 8,
                            "count": 546
                        },
                        {
                            "date": "2021-11-16",
                            "hour": 9,
                            "count": 341
                        },
                        {
                            "date": "2021-11-16",
                            "hour": 10,
                            "count": 263
                        },
                        {
                            "date": "2021-11-16",
                            "hour": 11,
                            "count": 293
                        },
                        {
                            "date": "2021-11-16",
                            "hour": 12,
                            "count": 271
                        },
                        {
                            "date": "2021-11-16",
                            "hour": 13,
                            "count": 239
                        },
                        {
                            "date": "2021-11-16",
                            "hour": 14,
                            "count": 281
                        },
                        {
                            "date": "2021-11-16",
                            "hour": 15,
                            "count": 228
                        },
                        {
                            "date": "2021-11-16",
                            "hour": 16,
                            "count": 228
                        },
                        {
                            "date": "2021-11-16",
                            "hour": 17,
                            "count": 374
                        },
                        {
                            "date": "2021-11-16",
                            "hour": 18,
                            "count": 301
                        },
                        {
                            "date": "2021-11-16",
                            "hour": 19,
                            "count": 186
                        },
                        {
                            "date": "2021-11-16",
                            "hour": 20,
                            "count": 250
                        },
                        {
                            "date": "2021-11-16",
                            "hour": 21,
                            "count": 264
                        },
                        {
                            "date": "2021-11-16",
                            "hour": 22,
                            "count": 171
                        },
                        {
                            "date": "2021-11-16",
                            "hour": 23,
                            "count": 181
                        },
                        {
                            "date": "2021-11-17",
                            "hour": 0,
                            "count": 299
                        },
                        {
                            "date": "2021-11-17",
                            "hour": 1,
                            "count": 302
                        },
                        {
                            "date": "2021-11-17",
                            "hour": 2,
                            "count": 499
                        },
                        {
                            "date": "2021-11-17",
                            "hour": 3,
                            "count": 287
                        },
                        {
                            "date": "2021-11-17",
                            "hour": 4,
                            "count": 542
                        },
                        {
                            "date": "2021-11-17",
                            "hour": 5,
                            "count": 372
                        },
                        {
                            "date": "2021-11-17",
                            "hour": 6,
                            "count": 499
                        },
                        {
                            "date": "2021-11-17",
                            "hour": 7,
                            "count": 307
                        },
                        {
                            "date": "2021-11-17",
                            "hour": 8,
                            "count": 377
                        },
                        {
                            "date": "2021-11-17",
                            "hour": 9,
                            "count": 292
                        },
                        {
                            "date": "2021-11-17",
                            "hour": 10,
                            "count": 229
                        },
                        {
                            "date": "2021-11-17",
                            "hour": 11,
                            "count": 297
                        },
                        {
                            "date": "2021-11-17",
                            "hour": 12,
                            "count": 380
                        },
                        {
                            "date": "2021-11-17",
                            "hour": 13,
                            "count": 409
                        },
                        {
                            "date": "2021-11-17",
                            "hour": 14,
                            "count": 224
                        },
                        {
                            "date": "2021-11-17",
                            "hour": 15,
                            "count": 199
                        },
                        {
                            "date": "2021-11-17",
                            "hour": 16,
                            "count": 323
                        },
                        {
                            "date": "2021-11-17",
                            "hour": 17,
                            "count": 239
                        },
                        {
                            "date": "2021-11-17",
                            "hour": 18,
                            "count": 232
                        },
                        {
                            "date": "2021-11-17",
                            "hour": 19,
                            "count": 301
                        },
                        {
                            "date": "2021-11-17",
                            "hour": 20,
                            "count": 180
                        },
                        {
                            "date": "2021-11-17",
                            "hour": 21,
                            "count": 190
                        },
                        {
                            "date": "2021-11-17",
                            "hour": 22,
                            "count": 198
                        },
                        {
                            "date": "2021-11-17",
                            "hour": 23,
                            "count": 159
                        },
                        {
                            "date": "2021-11-18",
                            "hour": 0,
                            "count": 257
                        },
                        {
                            "date": "2021-11-18",
                            "hour": 1,
                            "count": 374
                        },
                        {
                            "date": "2021-11-18",
                            "hour": 2,
                            "count": 709
                        },
                        {
                            "date": "2021-11-18",
                            "hour": 3,
                            "count": 856
                        },
                        {
                            "date": "2021-11-18",
                            "hour": 4,
                            "count": 247
                        },
                        {
                            "date": "2021-11-18",
                            "hour": 5,
                            "count": 334
                        },
                        {
                            "date": "2021-11-18",
                            "hour": 6,
                            "count": 263
                        },
                        {
                            "date": "2021-11-18",
                            "hour": 7,
                            "count": 176
                        },
                        {
                            "date": "2021-11-18",
                            "hour": 8,
                            "count": 461
                        },
                        {
                            "date": "2021-11-18",
                            "hour": 9,
                            "count": 391
                        },
                        {
                            "date": "2021-11-18",
                            "hour": 10,
                            "count": 155
                        },
                        {
                            "date": "2021-11-18",
                            "hour": 11,
                            "count": 177
                        },
                        {
                            "date": "2021-11-18",
                            "hour": 12,
                            "count": 206
                        },
                        {
                            "date": "2021-11-18",
                            "hour": 13,
                            "count": 349
                        },
                        {
                            "date": "2021-11-18",
                            "hour": 14,
                            "count": 369
                        },
                        {
                            "date": "2021-11-18",
                            "hour": 15,
                            "count": 391
                        },
                        {
                            "date": "2021-11-18",
                            "hour": 16,
                            "count": 314
                        },
                        {
                            "date": "2021-11-18",
                            "hour": 17,
                            "count": 263
                        },
                        {
                            "date": "2021-11-18",
                            "hour": 18,
                            "count": 239
                        },
                        {
                            "date": "2021-11-18",
                            "hour": 19,
                            "count": 256
                        },
                        {
                            "date": "2021-11-18",
                            "hour": 20,
                            "count": 200
                        },
                        {
                            "date": "2021-11-18",
                            "hour": 21,
                            "count": 216
                        },
                        {
                            "date": "2021-11-18",
                            "hour": 22,
                            "count": 208
                        },
                        {
                            "date": "2021-11-18",
                            "hour": 23,
                            "count": 184
                        },
                        {
                            "date": "2021-11-19",
                            "hour": 0,
                            "count": 53
                        }
                    ],
                    "total_wallets_count": 24038682,
                    "active_wallets_count": 950790,
                    "dev_wallet_balance": 0,
                    "_id": "5ea0935ff8000c3342b8ea75",
                    "coin": "digibyte",
                    "createdAt": "2020-04-22T18:56:31.077Z",
                    "updatedAt": "2021-11-19T00:15:08.150Z",
                    "__v": 623641
                },
                "market_summary": {
                    "24hVolume": {
                        "BTC": 55090188
                    },
                    "usd_price": {
                        "BTC": 0.04996060798514835
                    }
                }
            },
            {
                "wallet": "Bitcoin",
                "symbol": "BTC",
                "explorer": "http://chain.review/explorer/bitcoin",
                "api": "http://chain.review/public-api/db/bitcoin",
                "markets_stats": {
                    "New Capital": {
                        "24hVolume": "0.05147897",
                        "sellLiquidity": "3.33473214",
                        "buyLiquidity": "0.36359891",
                        "24hDeposits": 0,
                        "24hWithdrawals": 0,
                        "totalPriceBtc": 25.999844649600004,
                        "totalPriceCount": 26,
                        "avgPriceBtc": "0.9999940250",
                        "buyLquidityOptions": [
                            {
                                "fromCoin": "BTC",
                                "fromAmount": "2169.415464",
                                "toCoin": "XYM",
                                "toMainCoin": "BTC",
                                "toAmount": "0.000803"
                            },
                            {
                                "fromCoin": "BTC",
                                "fromAmount": "141.650898",
                                "toCoin": "XEM",
                                "toMainCoin": "BTC",
                                "toAmount": "0.000399"
                            },
                            {
                                "fromCoin": "BTC",
                                "fromAmount": "45180594.659421",
                                "toCoin": "TWINS",
                                "toMainCoin": "BTC",
                                "toAmount": "0.162650"
                            },
                            {
                                "fromCoin": "BTC",
                                "fromAmount": "2.869968",
                                "toCoin": "LBC20",
                                "toMainCoin": "BTC",
                                "toAmount": "0.001378"
                            },
                            {
                                "fromCoin": "BTC",
                                "fromAmount": "3.699129",
                                "toCoin": "LBC19",
                                "toMainCoin": "BTC",
                                "toAmount": "0.004439"
                            },
                            {
                                "fromCoin": "BTC",
                                "fromAmount": "4.049952",
                                "toCoin": "LBC18",
                                "toMainCoin": "BTC",
                                "toAmount": "0.001863"
                            },
                            {
                                "fromCoin": "BTC",
                                "fromAmount": "2.649965",
                                "toCoin": "LBC17",
                                "toMainCoin": "BTC",
                                "toAmount": "0.005830"
                            },
                            {
                                "fromCoin": "BTC",
                                "fromAmount": "5.799091",
                                "toCoin": "LBC16",
                                "toMainCoin": "BTC",
                                "toAmount": "0.006959"
                            },
                            {
                                "fromCoin": "BTC",
                                "fromAmount": "3.797463",
                                "toCoin": "LBC15",
                                "toMainCoin": "BTC",
                                "toAmount": "0.001747"
                            },
                            {
                                "fromCoin": "BTC",
                                "fromAmount": "2.189971",
                                "toCoin": "LBC14",
                                "toMainCoin": "BTC",
                                "toAmount": "0.001051"
                            },
                            {
                                "fromCoin": "BTC",
                                "fromAmount": "4.684207",
                                "toCoin": "LBC13",
                                "toMainCoin": "BTC",
                                "toAmount": "0.002014"
                            },
                            {
                                "fromCoin": "BTC",
                                "fromAmount": "3.517790",
                                "toCoin": "LBC12",
                                "toMainCoin": "BTC",
                                "toAmount": "0.004221"
                            },
                            {
                                "fromCoin": "BTC",
                                "fromAmount": "3.414948",
                                "toCoin": "LBC11",
                                "toMainCoin": "BTC",
                                "toAmount": "0.008537"
                            },
                            {
                                "fromCoin": "BTC",
                                "fromAmount": "2.399880",
                                "toCoin": "LBC10",
                                "toMainCoin": "BTC",
                                "toAmount": "0.003840"
                            },
                            {
                                "fromCoin": "BTC",
                                "fromAmount": "1.499899",
                                "toCoin": "LBC09",
                                "toMainCoin": "BTC",
                                "toAmount": "0.002850"
                            },
                            {
                                "fromCoin": "BTC",
                                "fromAmount": "2.749966",
                                "toCoin": "LBC08",
                                "toMainCoin": "BTC",
                                "toAmount": "0.001155"
                            },
                            {
                                "fromCoin": "BTC",
                                "fromAmount": "2.856307",
                                "toCoin": "LBC07",
                                "toMainCoin": "BTC",
                                "toAmount": "0.005427"
                            },
                            {
                                "fromCoin": "BTC",
                                "fromAmount": "2.785456",
                                "toCoin": "LBC06",
                                "toMainCoin": "BTC",
                                "toAmount": "0.006128"
                            },
                            {
                                "fromCoin": "BTC",
                                "fromAmount": "2.529925",
                                "toCoin": "LBC05",
                                "toMainCoin": "BTC",
                                "toAmount": "0.004655"
                            },
                            {
                                "fromCoin": "BTC",
                                "fromAmount": "1.068967",
                                "toCoin": "LBC04",
                                "toMainCoin": "BTC",
                                "toAmount": "0.000438"
                            },
                            {
                                "fromCoin": "BTC",
                                "fromAmount": "2.107355",
                                "toCoin": "LBC03",
                                "toMainCoin": "BTC",
                                "toAmount": "0.002107"
                            },
                            {
                                "fromCoin": "BTC",
                                "fromAmount": "0.821275",
                                "toCoin": "LBC02",
                                "toMainCoin": "BTC",
                                "toAmount": "0.001807"
                            },
                            {
                                "fromCoin": "BTC",
                                "fromAmount": "0.606401",
                                "toCoin": "LBC01",
                                "toMainCoin": "BTC",
                                "toAmount": "0.010309"
                            },
                            {
                                "fromCoin": "BTC",
                                "fromAmount": "54950387.097332",
                                "toCoin": "FIX",
                                "toMainCoin": "BTC",
                                "toAmount": "0.098911"
                            },
                            {
                                "fromCoin": "BTC",
                                "fromAmount": "1083.732859",
                                "toCoin": "DOGEC",
                                "toMainCoin": "BTC",
                                "toAmount": "0.000607"
                            },
                            {
                                "fromCoin": "BTC",
                                "fromAmount": "26674.813559",
                                "toCoin": "DGB",
                                "toMainCoin": "BTC",
                                "toAmount": "0.023474"
                            }
                        ],
                        "sellLquidityOptions": [
                            {
                                "fromCoin": "BTC",
                                "fromAmount": "0.000841",
                                "toCoin": "XYM",
                                "toMainCoin": "BTC",
                                "toAmount": "0.000841"
                            },
                            {
                                "fromCoin": "BTC",
                                "fromAmount": "0.002474",
                                "toCoin": "XEM",
                                "toMainCoin": "BTC",
                                "toAmount": "0.002474"
                            },
                            {
                                "fromCoin": "BTC",
                                "fromAmount": "1.194256",
                                "toCoin": "TWINS",
                                "toMainCoin": "BTC",
                                "toAmount": "1.194256"
                            },
                            {
                                "fromCoin": "BTC",
                                "fromAmount": "0.000531",
                                "toCoin": "LBC20",
                                "toMainCoin": "BTC",
                                "toAmount": "0.000531"
                            },
                            {
                                "fromCoin": "BTC",
                                "fromAmount": "0.001107",
                                "toCoin": "LBC19",
                                "toMainCoin": "BTC",
                                "toAmount": "0.001107"
                            },
                            {
                                "fromCoin": "BTC",
                                "fromAmount": "0.000645",
                                "toCoin": "LBC18",
                                "toMainCoin": "BTC",
                                "toAmount": "0.000645"
                            },
                            {
                                "fromCoin": "BTC",
                                "fromAmount": "0.000545",
                                "toCoin": "LBC17",
                                "toMainCoin": "BTC",
                                "toAmount": "0.000545"
                            },
                            {
                                "fromCoin": "BTC",
                                "fromAmount": "0.001081",
                                "toCoin": "LBC16",
                                "toMainCoin": "BTC",
                                "toAmount": "0.001081"
                            },
                            {
                                "fromCoin": "BTC",
                                "fromAmount": "0.000487",
                                "toCoin": "LBC15",
                                "toMainCoin": "BTC",
                                "toAmount": "0.000487"
                            },
                            {
                                "fromCoin": "BTC",
                                "fromAmount": "0.000621",
                                "toCoin": "LBC14",
                                "toMainCoin": "BTC",
                                "toAmount": "0.000621"
                            },
                            {
                                "fromCoin": "BTC",
                                "fromAmount": "0.000667",
                                "toCoin": "LBC13",
                                "toMainCoin": "BTC",
                                "toAmount": "0.000667"
                            },
                            {
                                "fromCoin": "BTC",
                                "fromAmount": "0.000876",
                                "toCoin": "LBC12",
                                "toMainCoin": "BTC",
                                "toAmount": "0.000876"
                            },
                            {
                                "fromCoin": "BTC",
                                "fromAmount": "0.000780",
                                "toCoin": "LBC11",
                                "toMainCoin": "BTC",
                                "toAmount": "0.000780"
                            },
                            {
                                "fromCoin": "BTC",
                                "fromAmount": "0.000931",
                                "toCoin": "LBC10",
                                "toMainCoin": "BTC",
                                "toAmount": "0.000931"
                            },
                            {
                                "fromCoin": "BTC",
                                "fromAmount": "0.000819",
                                "toCoin": "LBC09",
                                "toMainCoin": "BTC",
                                "toAmount": "0.000818"
                            },
                            {
                                "fromCoin": "BTC",
                                "fromAmount": "0.000425",
                                "toCoin": "LBC08",
                                "toMainCoin": "BTC",
                                "toAmount": "0.000425"
                            },
                            {
                                "fromCoin": "BTC",
                                "fromAmount": "0.000938",
                                "toCoin": "LBC07",
                                "toMainCoin": "BTC",
                                "toAmount": "0.000938"
                            },
                            {
                                "fromCoin": "BTC",
                                "fromAmount": "0.000585",
                                "toCoin": "LBC06",
                                "toMainCoin": "BTC",
                                "toAmount": "0.000585"
                            },
                            {
                                "fromCoin": "BTC",
                                "fromAmount": "0.000933",
                                "toCoin": "LBC05",
                                "toMainCoin": "BTC",
                                "toAmount": "0.000933"
                            },
                            {
                                "fromCoin": "BTC",
                                "fromAmount": "0.000336",
                                "toCoin": "LBC04",
                                "toMainCoin": "BTC",
                                "toAmount": "0.000336"
                            },
                            {
                                "fromCoin": "BTC",
                                "fromAmount": "0.000658",
                                "toCoin": "LBC03",
                                "toMainCoin": "BTC",
                                "toAmount": "0.000658"
                            },
                            {
                                "fromCoin": "BTC",
                                "fromAmount": "0.000655",
                                "toCoin": "LBC02",
                                "toMainCoin": "BTC",
                                "toAmount": "0.000655"
                            },
                            {
                                "fromCoin": "BTC",
                                "fromAmount": "0.000579",
                                "toCoin": "LBC01",
                                "toMainCoin": "BTC",
                                "toAmount": "0.000579"
                            },
                            {
                                "fromCoin": "BTC",
                                "fromAmount": "1.206653",
                                "toCoin": "FIX",
                                "toMainCoin": "BTC",
                                "toAmount": "1.206653"
                            },
                            {
                                "fromCoin": "BTC",
                                "fromAmount": "0.000230",
                                "toCoin": "DOGEC",
                                "toMainCoin": "BTC",
                                "toAmount": "0.000230"
                            },
                            {
                                "fromCoin": "BTC",
                                "fromAmount": "0.916082",
                                "toCoin": "DGB",
                                "toMainCoin": "BTC",
                                "toAmount": "0.916082"
                            }
                        ]
                    }
                },
                "stats": {
                    "last_block": 710401,
                    "difficulty": "22674148233453.11",
                    "moneysupply": "18877506.25",
                    "hashrate": "179051684359.2396",
                    "supply": 18877506.25,
                    "blockcount": 710401,
                    "connections": 60,
                    "masternodesCountByCollateral": 0,
                    "last_price": 0,
                    "version": "190100",
                    "protocol": "70015",
                    "walletversion": "",
                    "users_tx_count_24_hours": 293404,
                    "users_tx_chart": [
                        {
                            "date": "2021-11-12",
                            "hour": 8,
                            "count": 3389
                        },
                        {
                            "date": "2021-11-12",
                            "hour": 9,
                            "count": 17413
                        },
                        {
                            "date": "2021-11-12",
                            "hour": 10,
                            "count": 11376
                        },
                        {
                            "date": "2021-11-12",
                            "hour": 11,
                            "count": 13921
                        },
                        {
                            "date": "2021-11-12",
                            "hour": 12,
                            "count": 7939
                        },
                        {
                            "date": "2021-11-12",
                            "hour": 13,
                            "count": 13389
                        },
                        {
                            "date": "2021-11-12",
                            "hour": 14,
                            "count": 9235
                        },
                        {
                            "date": "2021-11-12",
                            "hour": 15,
                            "count": 24805
                        },
                        {
                            "date": "2021-11-12",
                            "hour": 16,
                            "count": 8761
                        },
                        {
                            "date": "2021-11-12",
                            "hour": 17,
                            "count": 9722
                        },
                        {
                            "date": "2021-11-12",
                            "hour": 18,
                            "count": 17973
                        },
                        {
                            "date": "2021-11-12",
                            "hour": 19,
                            "count": 23698
                        },
                        {
                            "date": "2021-11-12",
                            "hour": 20,
                            "count": 10625
                        },
                        {
                            "date": "2021-11-12",
                            "hour": 21,
                            "count": 12183
                        },
                        {
                            "date": "2021-11-12",
                            "hour": 22,
                            "count": 16172
                        },
                        {
                            "date": "2021-11-12",
                            "hour": 23,
                            "count": 8158
                        },
                        {
                            "date": "2021-11-13",
                            "hour": 0,
                            "count": 4578
                        },
                        {
                            "date": "2021-11-13",
                            "hour": 1,
                            "count": 11847
                        },
                        {
                            "date": "2021-11-13",
                            "hour": 2,
                            "count": 11366
                        },
                        {
                            "date": "2021-11-13",
                            "hour": 3,
                            "count": 8547
                        },
                        {
                            "date": "2021-11-13",
                            "hour": 4,
                            "count": 7267
                        },
                        {
                            "date": "2021-11-13",
                            "hour": 5,
                            "count": 6890
                        },
                        {
                            "date": "2021-11-13",
                            "hour": 6,
                            "count": 8485
                        },
                        {
                            "date": "2021-11-13",
                            "hour": 7,
                            "count": 8119
                        },
                        {
                            "date": "2021-11-13",
                            "hour": 8,
                            "count": 10020
                        },
                        {
                            "date": "2021-11-13",
                            "hour": 9,
                            "count": 8664
                        },
                        {
                            "date": "2021-11-13",
                            "hour": 10,
                            "count": 9948
                        },
                        {
                            "date": "2021-11-13",
                            "hour": 11,
                            "count": 8755
                        },
                        {
                            "date": "2021-11-13",
                            "hour": 12,
                            "count": 11684
                        },
                        {
                            "date": "2021-11-13",
                            "hour": 13,
                            "count": 6343
                        },
                        {
                            "date": "2021-11-13",
                            "hour": 14,
                            "count": 13497
                        },
                        {
                            "date": "2021-11-13",
                            "hour": 15,
                            "count": 14770
                        },
                        {
                            "date": "2021-11-13",
                            "hour": 16,
                            "count": 9297
                        },
                        {
                            "date": "2021-11-13",
                            "hour": 17,
                            "count": 16230
                        },
                        {
                            "date": "2021-11-13",
                            "hour": 18,
                            "count": 12300
                        },
                        {
                            "date": "2021-11-13",
                            "hour": 19,
                            "count": 8976
                        },
                        {
                            "date": "2021-11-13",
                            "hour": 20,
                            "count": 15285
                        },
                        {
                            "date": "2021-11-13",
                            "hour": 21,
                            "count": 9699
                        },
                        {
                            "date": "2021-11-13",
                            "hour": 22,
                            "count": 8896
                        },
                        {
                            "date": "2021-11-13",
                            "hour": 23,
                            "count": 5272
                        },
                        {
                            "date": "2021-11-14",
                            "hour": 0,
                            "count": 10722
                        },
                        {
                            "date": "2021-11-14",
                            "hour": 1,
                            "count": 7573
                        },
                        {
                            "date": "2021-11-14",
                            "hour": 2,
                            "count": 7538
                        },
                        {
                            "date": "2021-11-14",
                            "hour": 3,
                            "count": 5929
                        },
                        {
                            "date": "2021-11-14",
                            "hour": 4,
                            "count": 6617
                        },
                        {
                            "date": "2021-11-14",
                            "hour": 5,
                            "count": 6677
                        },
                        {
                            "date": "2021-11-14",
                            "hour": 6,
                            "count": 7350
                        },
                        {
                            "date": "2021-11-14",
                            "hour": 7,
                            "count": 6011
                        },
                        {
                            "date": "2021-11-14",
                            "hour": 8,
                            "count": 6265
                        },
                        {
                            "date": "2021-11-14",
                            "hour": 9,
                            "count": 7482
                        },
                        {
                            "date": "2021-11-14",
                            "hour": 10,
                            "count": 6931
                        },
                        {
                            "date": "2021-11-14",
                            "hour": 11,
                            "count": 10721
                        },
                        {
                            "date": "2021-11-14",
                            "hour": 12,
                            "count": 10466
                        },
                        {
                            "date": "2021-11-14",
                            "hour": 13,
                            "count": 10861
                        },
                        {
                            "date": "2021-11-14",
                            "hour": 14,
                            "count": 10220
                        },
                        {
                            "date": "2021-11-14",
                            "hour": 15,
                            "count": 11026
                        },
                        {
                            "date": "2021-11-14",
                            "hour": 16,
                            "count": 13596
                        },
                        {
                            "date": "2021-11-14",
                            "hour": 17,
                            "count": 9671
                        },
                        {
                            "date": "2021-11-14",
                            "hour": 18,
                            "count": 13265
                        },
                        {
                            "date": "2021-11-14",
                            "hour": 19,
                            "count": 11753
                        },
                        {
                            "date": "2021-11-14",
                            "hour": 20,
                            "count": 9641
                        },
                        {
                            "date": "2021-11-14",
                            "hour": 21,
                            "count": 7481
                        },
                        {
                            "date": "2021-11-14",
                            "hour": 22,
                            "count": 11821
                        },
                        {
                            "date": "2021-11-14",
                            "hour": 23,
                            "count": 10903
                        },
                        {
                            "date": "2021-11-15",
                            "hour": 0,
                            "count": 6193
                        },
                        {
                            "date": "2021-11-15",
                            "hour": 1,
                            "count": 9730
                        },
                        {
                            "date": "2021-11-15",
                            "hour": 2,
                            "count": 7398
                        },
                        {
                            "date": "2021-11-15",
                            "hour": 3,
                            "count": 6985
                        },
                        {
                            "date": "2021-11-15",
                            "hour": 4,
                            "count": 6841
                        },
                        {
                            "date": "2021-11-15",
                            "hour": 5,
                            "count": 7231
                        },
                        {
                            "date": "2021-11-15",
                            "hour": 6,
                            "count": 5619
                        },
                        {
                            "date": "2021-11-15",
                            "hour": 7,
                            "count": 8863
                        },
                        {
                            "date": "2021-11-15",
                            "hour": 8,
                            "count": 8633
                        },
                        {
                            "date": "2021-11-15",
                            "hour": 9,
                            "count": 20355
                        },
                        {
                            "date": "2021-11-15",
                            "hour": 10,
                            "count": 12978
                        },
                        {
                            "date": "2021-11-15",
                            "hour": 11,
                            "count": 12356
                        },
                        {
                            "date": "2021-11-15",
                            "hour": 12,
                            "count": 10769
                        },
                        {
                            "date": "2021-11-15",
                            "hour": 13,
                            "count": 17377
                        },
                        {
                            "date": "2021-11-15",
                            "hour": 14,
                            "count": 16480
                        },
                        {
                            "date": "2021-11-15",
                            "hour": 15,
                            "count": 20471
                        },
                        {
                            "date": "2021-11-15",
                            "hour": 16,
                            "count": 8780
                        },
                        {
                            "date": "2021-11-15",
                            "hour": 17,
                            "count": 22980
                        },
                        {
                            "date": "2021-11-15",
                            "hour": 18,
                            "count": 16703
                        },
                        {
                            "date": "2021-11-15",
                            "hour": 19,
                            "count": 16958
                        },
                        {
                            "date": "2021-11-15",
                            "hour": 20,
                            "count": 8928
                        },
                        {
                            "date": "2021-11-15",
                            "hour": 21,
                            "count": 5310
                        },
                        {
                            "date": "2021-11-15",
                            "hour": 22,
                            "count": 25518
                        },
                        {
                            "date": "2021-11-15",
                            "hour": 23,
                            "count": 4814
                        },
                        {
                            "date": "2021-11-16",
                            "hour": 0,
                            "count": 11632
                        },
                        {
                            "date": "2021-11-16",
                            "hour": 1,
                            "count": 14501
                        },
                        {
                            "date": "2021-11-16",
                            "hour": 2,
                            "count": 8655
                        },
                        {
                            "date": "2021-11-16",
                            "hour": 3,
                            "count": 8422
                        },
                        {
                            "date": "2021-11-16",
                            "hour": 4,
                            "count": 7350
                        },
                        {
                            "date": "2021-11-16",
                            "hour": 5,
                            "count": 10471
                        },
                        {
                            "date": "2021-11-16",
                            "hour": 6,
                            "count": 7490
                        },
                        {
                            "date": "2021-11-16",
                            "hour": 7,
                            "count": 14041
                        },
                        {
                            "date": "2021-11-16",
                            "hour": 8,
                            "count": 10189
                        },
                        {
                            "date": "2021-11-16",
                            "hour": 9,
                            "count": 13064
                        },
                        {
                            "date": "2021-11-16",
                            "hour": 10,
                            "count": 15217
                        },
                        {
                            "date": "2021-11-16",
                            "hour": 11,
                            "count": 14041
                        },
                        {
                            "date": "2021-11-16",
                            "hour": 12,
                            "count": 13036
                        },
                        {
                            "date": "2021-11-16",
                            "hour": 13,
                            "count": 15018
                        },
                        {
                            "date": "2021-11-16",
                            "hour": 14,
                            "count": 12629
                        },
                        {
                            "date": "2021-11-16",
                            "hour": 15,
                            "count": 8815
                        },
                        {
                            "date": "2021-11-16",
                            "hour": 16,
                            "count": 12841
                        },
                        {
                            "date": "2021-11-16",
                            "hour": 17,
                            "count": 14388
                        },
                        {
                            "date": "2021-11-16",
                            "hour": 18,
                            "count": 11169
                        },
                        {
                            "date": "2021-11-16",
                            "hour": 19,
                            "count": 23968
                        },
                        {
                            "date": "2021-11-16",
                            "hour": 20,
                            "count": 14248
                        },
                        {
                            "date": "2021-11-16",
                            "hour": 21,
                            "count": 17998
                        },
                        {
                            "date": "2021-11-16",
                            "hour": 22,
                            "count": 10836
                        },
                        {
                            "date": "2021-11-16",
                            "hour": 23,
                            "count": 8248
                        },
                        {
                            "date": "2021-11-17",
                            "hour": 0,
                            "count": 12614
                        },
                        {
                            "date": "2021-11-17",
                            "hour": 1,
                            "count": 10591
                        },
                        {
                            "date": "2021-11-17",
                            "hour": 2,
                            "count": 4355
                        },
                        {
                            "date": "2021-11-17",
                            "hour": 3,
                            "count": 11655
                        },
                        {
                            "date": "2021-11-17",
                            "hour": 4,
                            "count": 9684
                        },
                        {
                            "date": "2021-11-17",
                            "hour": 5,
                            "count": 7031
                        },
                        {
                            "date": "2021-11-17",
                            "hour": 6,
                            "count": 5898
                        },
                        {
                            "date": "2021-11-17",
                            "hour": 7,
                            "count": 6673
                        },
                        {
                            "date": "2021-11-17",
                            "hour": 8,
                            "count": 19178
                        },
                        {
                            "date": "2021-11-17",
                            "hour": 9,
                            "count": 11527
                        },
                        {
                            "date": "2021-11-17",
                            "hour": 10,
                            "count": 13321
                        },
                        {
                            "date": "2021-11-17",
                            "hour": 11,
                            "count": 8853
                        },
                        {
                            "date": "2021-11-17",
                            "hour": 12,
                            "count": 12438
                        },
                        {
                            "date": "2021-11-17",
                            "hour": 13,
                            "count": 10577
                        },
                        {
                            "date": "2021-11-17",
                            "hour": 14,
                            "count": 13874
                        },
                        {
                            "date": "2021-11-17",
                            "hour": 15,
                            "count": 17432
                        },
                        {
                            "date": "2021-11-17",
                            "hour": 16,
                            "count": 20445
                        },
                        {
                            "date": "2021-11-17",
                            "hour": 17,
                            "count": 8647
                        },
                        {
                            "date": "2021-11-17",
                            "hour": 18,
                            "count": 17499
                        },
                        {
                            "date": "2021-11-17",
                            "hour": 19,
                            "count": 18139
                        },
                        {
                            "date": "2021-11-17",
                            "hour": 20,
                            "count": 13093
                        },
                        {
                            "date": "2021-11-17",
                            "hour": 21,
                            "count": 16438
                        },
                        {
                            "date": "2021-11-17",
                            "hour": 22,
                            "count": 10943
                        },
                        {
                            "date": "2021-11-17",
                            "hour": 23,
                            "count": 9319
                        },
                        {
                            "date": "2021-11-18",
                            "hour": 0,
                            "count": 13569
                        },
                        {
                            "date": "2021-11-18",
                            "hour": 1,
                            "count": 7002
                        },
                        {
                            "date": "2021-11-18",
                            "hour": 2,
                            "count": 12136
                        },
                        {
                            "date": "2021-11-18",
                            "hour": 3,
                            "count": 5994
                        },
                        {
                            "date": "2021-11-18",
                            "hour": 4,
                            "count": 7916
                        },
                        {
                            "date": "2021-11-18",
                            "hour": 5,
                            "count": 6692
                        },
                        {
                            "date": "2021-11-18",
                            "hour": 6,
                            "count": 7727
                        },
                        {
                            "date": "2021-11-18",
                            "hour": 7,
                            "count": 14066
                        },
                        {
                            "date": "2021-11-18",
                            "hour": 8,
                            "count": 8529
                        },
                        {
                            "date": "2021-11-18",
                            "hour": 9,
                            "count": 13241
                        },
                        {
                            "date": "2021-11-18",
                            "hour": 10,
                            "count": 11544
                        },
                        {
                            "date": "2021-11-18",
                            "hour": 11,
                            "count": 8466
                        },
                        {
                            "date": "2021-11-18",
                            "hour": 12,
                            "count": 11310
                        },
                        {
                            "date": "2021-11-18",
                            "hour": 13,
                            "count": 7986
                        },
                        {
                            "date": "2021-11-18",
                            "hour": 14,
                            "count": 27128
                        },
                        {
                            "date": "2021-11-18",
                            "hour": 15,
                            "count": 15906
                        },
                        {
                            "date": "2021-11-18",
                            "hour": 16,
                            "count": 8441
                        },
                        {
                            "date": "2021-11-18",
                            "hour": 17,
                            "count": 23972
                        },
                        {
                            "date": "2021-11-18",
                            "hour": 18,
                            "count": 14658
                        },
                        {
                            "date": "2021-11-18",
                            "hour": 19,
                            "count": 9427
                        },
                        {
                            "date": "2021-11-18",
                            "hour": 20,
                            "count": 8667
                        },
                        {
                            "date": "2021-11-18",
                            "hour": 21,
                            "count": 20579
                        },
                        {
                            "date": "2021-11-18",
                            "hour": 22,
                            "count": 20311
                        },
                        {
                            "date": "2021-11-18",
                            "hour": 23,
                            "count": 8416
                        },
                        {
                            "date": "2021-11-19",
                            "hour": 0,
                            "count": 12433
                        },
                        {
                            "date": "2021-11-19",
                            "hour": 1,
                            "count": 7471
                        },
                        {
                            "date": "2021-11-19",
                            "hour": 2,
                            "count": 11615
                        },
                        {
                            "date": "2021-11-19",
                            "hour": 3,
                            "count": 5526
                        },
                        {
                            "date": "2021-11-19",
                            "hour": 4,
                            "count": 10501
                        },
                        {
                            "date": "2021-11-19",
                            "hour": 5,
                            "count": 10106
                        },
                        {
                            "date": "2021-11-19",
                            "hour": 6,
                            "count": 6089
                        },
                        {
                            "date": "2021-11-19",
                            "hour": 7,
                            "count": 13297
                        },
                        {
                            "date": "2021-11-19",
                            "hour": 8,
                            "count": 3465
                        }
                    ],
                    "total_wallets_count": 432576948,
                    "active_wallets_count": 15138192,
                    "dev_wallet_balance": 34645826,
                    "_id": "5fde1bc95a565d38607037af",
                    "coin": "bitcoin",
                    "createdAt": "2020-12-19T15:27:05.943Z",
                    "updatedAt": "2021-11-19T08:50:21.941Z",
                    "__v": 35424
                },
                "market_summary": {
                    "24hVolume": {
                        "BTC": 109689102336
                    },
                    "usd_price": {
                        "BTC": 57075
                    }
                }
            },
            {
                "wallet": "Fix",
                "symbol": "FIX",
                "explorer": "http://chain.review/explorer/fix",
                "api": "http://chain.review/public-api/db/fix",
                "markets_stats": {
                    "New Capital": {
                        "24hVolume": "0.02094641",
                        "sellLiquidity": "0.09891074",
                        "buyLiquidity": "1.20665318",
                        "24hDeposits": 0,
                        "24hWithdrawals": 0,
                        "totalPriceBtc": 5.399998194204e-9,
                        "totalPriceCount": 3,
                        "avgPriceBtc": "0.0000000018",
                        "buyLquidityOptions": [
                            {
                                "fromCoin": "FIX",
                                "fromAmount": "0.000000",
                                "toCoin": "XEM",
                                "toMainCoin": "BTC",
                                "toAmount": "0.000000"
                            },
                            {
                                "fromCoin": "FIX",
                                "fromAmount": "0.000000",
                                "toCoin": "TWINS",
                                "toMainCoin": "BTC",
                                "toAmount": "0.000000"
                            },
                            {
                                "fromCoin": "FIX",
                                "fromAmount": "1.206653",
                                "toCoin": "BTC",
                                "toMainCoin": "BTC",
                                "toAmount": "1.206653"
                            }
                        ],
                        "sellLquidityOptions": [
                            {
                                "fromCoin": "FIX",
                                "fromAmount": "0.000000",
                                "toCoin": "XEM",
                                "toMainCoin": "BTC",
                                "toAmount": "0.000000"
                            },
                            {
                                "fromCoin": "FIX",
                                "fromAmount": "0.000000",
                                "toCoin": "TWINS",
                                "toMainCoin": "BTC",
                                "toAmount": "0.000000"
                            },
                            {
                                "fromCoin": "FIX",
                                "fromAmount": "54950412.000000",
                                "toCoin": "BTC",
                                "toMainCoin": "BTC",
                                "toAmount": "0.098911"
                            }
                        ]
                    }
                },
                "stats": {
                    "last_block": 627135,
                    "difficulty": "27608156.95065913",
                    "moneysupply": "9741093536.59974",
                    "hashrate": "1024711.5648",
                    "supply": 9741093536.59974,
                    "blockcount": 627135,
                    "connections": 109,
                    "masternodesCountByCollateral": 6636,
                    "last_price": 0,
                    "version": "3030901",
                    "protocol": "70926",
                    "walletversion": "61000",
                    "users_tx_count_24_hours": 109,
                    "users_tx_chart": [
                        {
                            "date": "2021-11-12",
                            "hour": 9,
                            "count": 4
                        },
                        {
                            "date": "2021-11-12",
                            "hour": 10,
                            "count": 1
                        },
                        {
                            "date": "2021-11-12",
                            "hour": 11,
                            "count": 1
                        },
                        {
                            "date": "2021-11-12",
                            "hour": 12,
                            "count": 18
                        },
                        {
                            "date": "2021-11-12",
                            "hour": 13,
                            "count": 13
                        },
                        {
                            "date": "2021-11-12",
                            "hour": 14,
                            "count": 5
                        },
                        {
                            "date": "2021-11-12",
                            "hour": 15,
                            "count": 1
                        },
                        {
                            "date": "2021-11-12",
                            "hour": 16,
                            "count": 5
                        },
                        {
                            "date": "2021-11-12",
                            "hour": 17,
                            "count": 1
                        },
                        {
                            "date": "2021-11-12",
                            "hour": 18,
                            "count": 2
                        },
                        {
                            "date": "2021-11-12",
                            "hour": 19,
                            "count": 20
                        },
                        {
                            "date": "2021-11-12",
                            "hour": 20,
                            "count": 3
                        },
                        {
                            "date": "2021-11-12",
                            "hour": 21,
                            "count": 2
                        },
                        {
                            "date": "2021-11-12",
                            "hour": 22,
                            "count": 2
                        },
                        {
                            "date": "2021-11-12",
                            "hour": 23,
                            "count": 5
                        },
                        {
                            "date": "2021-11-13",
                            "hour": 0,
                            "count": 3
                        },
                        {
                            "date": "2021-11-13",
                            "hour": 1,
                            "count": 11
                        },
                        {
                            "date": "2021-11-13",
                            "hour": 2,
                            "count": 14
                        },
                        {
                            "date": "2021-11-13",
                            "hour": 3,
                            "count": 3
                        },
                        {
                            "date": "2021-11-13",
                            "hour": 4,
                            "count": 5
                        },
                        {
                            "date": "2021-11-13",
                            "hour": 5,
                            "count": 2
                        },
                        {
                            "date": "2021-11-13",
                            "hour": 6,
                            "count": 9
                        },
                        {
                            "date": "2021-11-13",
                            "hour": 7,
                            "count": 2
                        },
                        {
                            "date": "2021-11-13",
                            "hour": 8,
                            "count": 4
                        },
                        {
                            "date": "2021-11-13",
                            "hour": 9,
                            "count": 13
                        },
                        {
                            "date": "2021-11-13",
                            "hour": 12,
                            "count": 1
                        },
                        {
                            "date": "2021-11-13",
                            "hour": 13,
                            "count": 2
                        },
                        {
                            "date": "2021-11-13",
                            "hour": 14,
                            "count": 15
                        },
                        {
                            "date": "2021-11-13",
                            "hour": 15,
                            "count": 2
                        },
                        {
                            "date": "2021-11-13",
                            "hour": 16,
                            "count": 2
                        },
                        {
                            "date": "2021-11-13",
                            "hour": 17,
                            "count": 6
                        },
                        {
                            "date": "2021-11-13",
                            "hour": 18,
                            "count": 12
                        },
                        {
                            "date": "2021-11-13",
                            "hour": 19,
                            "count": 17
                        },
                        {
                            "date": "2021-11-13",
                            "hour": 20,
                            "count": 5
                        },
                        {
                            "date": "2021-11-13",
                            "hour": 21,
                            "count": 7
                        },
                        {
                            "date": "2021-11-13",
                            "hour": 22,
                            "count": 4
                        },
                        {
                            "date": "2021-11-13",
                            "hour": 23,
                            "count": 2
                        },
                        {
                            "date": "2021-11-14",
                            "hour": 0,
                            "count": 4
                        },
                        {
                            "date": "2021-11-14",
                            "hour": 1,
                            "count": 8
                        },
                        {
                            "date": "2021-11-14",
                            "hour": 3,
                            "count": 6
                        },
                        {
                            "date": "2021-11-14",
                            "hour": 4,
                            "count": 1
                        },
                        {
                            "date": "2021-11-14",
                            "hour": 5,
                            "count": 7
                        },
                        {
                            "date": "2021-11-14",
                            "hour": 6,
                            "count": 1
                        },
                        {
                            "date": "2021-11-14",
                            "hour": 7,
                            "count": 2
                        },
                        {
                            "date": "2021-11-14",
                            "hour": 8,
                            "count": 1
                        },
                        {
                            "date": "2021-11-14",
                            "hour": 9,
                            "count": 12
                        },
                        {
                            "date": "2021-11-14",
                            "hour": 10,
                            "count": 2
                        },
                        {
                            "date": "2021-11-14",
                            "hour": 11,
                            "count": 2
                        },
                        {
                            "date": "2021-11-14",
                            "hour": 12,
                            "count": 2
                        },
                        {
                            "date": "2021-11-14",
                            "hour": 13,
                            "count": 3
                        },
                        {
                            "date": "2021-11-14",
                            "hour": 14,
                            "count": 2
                        },
                        {
                            "date": "2021-11-14",
                            "hour": 15,
                            "count": 10
                        },
                        {
                            "date": "2021-11-14",
                            "hour": 16,
                            "count": 5
                        },
                        {
                            "date": "2021-11-14",
                            "hour": 17,
                            "count": 1
                        },
                        {
                            "date": "2021-11-14",
                            "hour": 18,
                            "count": 1
                        },
                        {
                            "date": "2021-11-14",
                            "hour": 20,
                            "count": 15
                        },
                        {
                            "date": "2021-11-14",
                            "hour": 21,
                            "count": 1
                        },
                        {
                            "date": "2021-11-14",
                            "hour": 22,
                            "count": 7
                        },
                        {
                            "date": "2021-11-14",
                            "hour": 23,
                            "count": 6
                        },
                        {
                            "date": "2021-11-15",
                            "hour": 0,
                            "count": 1
                        },
                        {
                            "date": "2021-11-15",
                            "hour": 1,
                            "count": 6
                        },
                        {
                            "date": "2021-11-15",
                            "hour": 2,
                            "count": 1
                        },
                        {
                            "date": "2021-11-15",
                            "hour": 3,
                            "count": 6
                        },
                        {
                            "date": "2021-11-15",
                            "hour": 5,
                            "count": 11
                        },
                        {
                            "date": "2021-11-15",
                            "hour": 6,
                            "count": 1
                        },
                        {
                            "date": "2021-11-15",
                            "hour": 7,
                            "count": 7
                        },
                        {
                            "date": "2021-11-15",
                            "hour": 8,
                            "count": 9
                        },
                        {
                            "date": "2021-11-15",
                            "hour": 9,
                            "count": 9
                        },
                        {
                            "date": "2021-11-15",
                            "hour": 10,
                            "count": 1
                        },
                        {
                            "date": "2021-11-15",
                            "hour": 11,
                            "count": 6
                        },
                        {
                            "date": "2021-11-15",
                            "hour": 12,
                            "count": 6
                        },
                        {
                            "date": "2021-11-15",
                            "hour": 13,
                            "count": 6
                        },
                        {
                            "date": "2021-11-15",
                            "hour": 14,
                            "count": 10
                        },
                        {
                            "date": "2021-11-15",
                            "hour": 15,
                            "count": 17
                        },
                        {
                            "date": "2021-11-15",
                            "hour": 16,
                            "count": 6
                        },
                        {
                            "date": "2021-11-15",
                            "hour": 17,
                            "count": 3
                        },
                        {
                            "date": "2021-11-15",
                            "hour": 18,
                            "count": 3
                        },
                        {
                            "date": "2021-11-15",
                            "hour": 19,
                            "count": 15
                        },
                        {
                            "date": "2021-11-15",
                            "hour": 20,
                            "count": 11
                        },
                        {
                            "date": "2021-11-15",
                            "hour": 21,
                            "count": 8
                        },
                        {
                            "date": "2021-11-15",
                            "hour": 22,
                            "count": 8
                        },
                        {
                            "date": "2021-11-15",
                            "hour": 23,
                            "count": 5
                        },
                        {
                            "date": "2021-11-16",
                            "hour": 0,
                            "count": 7
                        },
                        {
                            "date": "2021-11-16",
                            "hour": 1,
                            "count": 1
                        },
                        {
                            "date": "2021-11-16",
                            "hour": 2,
                            "count": 16
                        },
                        {
                            "date": "2021-11-16",
                            "hour": 3,
                            "count": 9
                        },
                        {
                            "date": "2021-11-16",
                            "hour": 4,
                            "count": 13
                        },
                        {
                            "date": "2021-11-16",
                            "hour": 5,
                            "count": 1
                        },
                        {
                            "date": "2021-11-16",
                            "hour": 6,
                            "count": 11
                        },
                        {
                            "date": "2021-11-16",
                            "hour": 7,
                            "count": 7
                        },
                        {
                            "date": "2021-11-16",
                            "hour": 8,
                            "count": 14
                        },
                        {
                            "date": "2021-11-16",
                            "hour": 9,
                            "count": 8
                        },
                        {
                            "date": "2021-11-16",
                            "hour": 10,
                            "count": 2
                        },
                        {
                            "date": "2021-11-16",
                            "hour": 11,
                            "count": 7
                        },
                        {
                            "date": "2021-11-16",
                            "hour": 12,
                            "count": 12
                        },
                        {
                            "date": "2021-11-16",
                            "hour": 13,
                            "count": 1
                        },
                        {
                            "date": "2021-11-16",
                            "hour": 14,
                            "count": 9
                        },
                        {
                            "date": "2021-11-16",
                            "hour": 15,
                            "count": 8
                        },
                        {
                            "date": "2021-11-16",
                            "hour": 16,
                            "count": 8
                        },
                        {
                            "date": "2021-11-16",
                            "hour": 17,
                            "count": 4
                        },
                        {
                            "date": "2021-11-16",
                            "hour": 18,
                            "count": 9
                        },
                        {
                            "date": "2021-11-16",
                            "hour": 19,
                            "count": 9
                        },
                        {
                            "date": "2021-11-16",
                            "hour": 20,
                            "count": 4
                        },
                        {
                            "date": "2021-11-16",
                            "hour": 21,
                            "count": 2
                        },
                        {
                            "date": "2021-11-16",
                            "hour": 22,
                            "count": 19
                        },
                        {
                            "date": "2021-11-16",
                            "hour": 23,
                            "count": 2
                        },
                        {
                            "date": "2021-11-17",
                            "hour": 0,
                            "count": 1
                        },
                        {
                            "date": "2021-11-17",
                            "hour": 1,
                            "count": 7
                        },
                        {
                            "date": "2021-11-17",
                            "hour": 2,
                            "count": 9
                        },
                        {
                            "date": "2021-11-17",
                            "hour": 3,
                            "count": 1
                        },
                        {
                            "date": "2021-11-17",
                            "hour": 4,
                            "count": 6
                        },
                        {
                            "date": "2021-11-17",
                            "hour": 5,
                            "count": 2
                        },
                        {
                            "date": "2021-11-17",
                            "hour": 6,
                            "count": 2
                        },
                        {
                            "date": "2021-11-17",
                            "hour": 7,
                            "count": 9
                        },
                        {
                            "date": "2021-11-17",
                            "hour": 8,
                            "count": 1
                        },
                        {
                            "date": "2021-11-17",
                            "hour": 9,
                            "count": 6
                        },
                        {
                            "date": "2021-11-17",
                            "hour": 10,
                            "count": 2
                        },
                        {
                            "date": "2021-11-17",
                            "hour": 11,
                            "count": 3
                        },
                        {
                            "date": "2021-11-17",
                            "hour": 12,
                            "count": 4
                        },
                        {
                            "date": "2021-11-17",
                            "hour": 13,
                            "count": 17
                        },
                        {
                            "date": "2021-11-17",
                            "hour": 14,
                            "count": 4
                        },
                        {
                            "date": "2021-11-17",
                            "hour": 15,
                            "count": 4
                        },
                        {
                            "date": "2021-11-17",
                            "hour": 16,
                            "count": 4
                        },
                        {
                            "date": "2021-11-17",
                            "hour": 17,
                            "count": 1
                        },
                        {
                            "date": "2021-11-17",
                            "hour": 18,
                            "count": 3
                        },
                        {
                            "date": "2021-11-17",
                            "hour": 19,
                            "count": 7
                        },
                        {
                            "date": "2021-11-17",
                            "hour": 20,
                            "count": 2
                        },
                        {
                            "date": "2021-11-17",
                            "hour": 21,
                            "count": 5
                        },
                        {
                            "date": "2021-11-17",
                            "hour": 22,
                            "count": 6
                        },
                        {
                            "date": "2021-11-17",
                            "hour": 23,
                            "count": 11
                        },
                        {
                            "date": "2021-11-18",
                            "hour": 0,
                            "count": 2
                        },
                        {
                            "date": "2021-11-18",
                            "hour": 1,
                            "count": 4
                        },
                        {
                            "date": "2021-11-18",
                            "hour": 2,
                            "count": 4
                        },
                        {
                            "date": "2021-11-18",
                            "hour": 3,
                            "count": 15
                        },
                        {
                            "date": "2021-11-18",
                            "hour": 4,
                            "count": 6
                        },
                        {
                            "date": "2021-11-18",
                            "hour": 5,
                            "count": 3
                        },
                        {
                            "date": "2021-11-18",
                            "hour": 6,
                            "count": 6
                        },
                        {
                            "date": "2021-11-18",
                            "hour": 7,
                            "count": 8
                        },
                        {
                            "date": "2021-11-18",
                            "hour": 8,
                            "count": 4
                        },
                        {
                            "date": "2021-11-18",
                            "hour": 9,
                            "count": 6
                        },
                        {
                            "date": "2021-11-18",
                            "hour": 11,
                            "count": 5
                        },
                        {
                            "date": "2021-11-18",
                            "hour": 12,
                            "count": 1
                        },
                        {
                            "date": "2021-11-18",
                            "hour": 13,
                            "count": 5
                        },
                        {
                            "date": "2021-11-18",
                            "hour": 14,
                            "count": 10
                        },
                        {
                            "date": "2021-11-18",
                            "hour": 15,
                            "count": 7
                        },
                        {
                            "date": "2021-11-18",
                            "hour": 16,
                            "count": 6
                        },
                        {
                            "date": "2021-11-18",
                            "hour": 17,
                            "count": 4
                        },
                        {
                            "date": "2021-11-18",
                            "hour": 18,
                            "count": 2
                        },
                        {
                            "date": "2021-11-18",
                            "hour": 19,
                            "count": 5
                        },
                        {
                            "date": "2021-11-18",
                            "hour": 20,
                            "count": 3
                        },
                        {
                            "date": "2021-11-18",
                            "hour": 21,
                            "count": 10
                        },
                        {
                            "date": "2021-11-18",
                            "hour": 22,
                            "count": 3
                        },
                        {
                            "date": "2021-11-18",
                            "hour": 23,
                            "count": 7
                        },
                        {
                            "date": "2021-11-19",
                            "hour": 0,
                            "count": 3
                        },
                        {
                            "date": "2021-11-19",
                            "hour": 1,
                            "count": 4
                        },
                        {
                            "date": "2021-11-19",
                            "hour": 2,
                            "count": 2
                        },
                        {
                            "date": "2021-11-19",
                            "hour": 3,
                            "count": 1
                        },
                        {
                            "date": "2021-11-19",
                            "hour": 4,
                            "count": 11
                        },
                        {
                            "date": "2021-11-19",
                            "hour": 5,
                            "count": 9
                        },
                        {
                            "date": "2021-11-19",
                            "hour": 6,
                            "count": 4
                        },
                        {
                            "date": "2021-11-19",
                            "hour": 7,
                            "count": 1
                        }
                    ],
                    "total_wallets_count": 87906,
                    "active_wallets_count": 2634,
                    "dev_wallet_balance": 11414002002506592,
                    "_id": "5e020327fe45c95428e829e6",
                    "last": 154326,
                    "coin": "fix",
                    "__v": 139650,
                    "updatedAt": "2021-11-19T08:52:18.244Z",
                    "createdAt": "2020-01-07T18:31:38.758Z",
                    "masternodesCount": {
                        "total": 511,
                        "stable": 332,
                        "obfcompat": 332,
                        "enabled": 511,
                        "inqueue": 352,
                        "ipv4": 136,
                        "ipv6": 375,
                        "onion": 0
                    }
                },
                "market_summary": {
                    "24hVolume": {
                        "BTC": 977
                    },
                    "usd_price": {
                        "BTC": 0.00010279791408717389
                    }
                }
            }
        ]
    }
    var array = obj.data;
    res.render(path.resolve(__dirname + "/../../chain.review.clients/main/chain.review-test.ejs"), {
        data: array,
    });
})

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
    // console.log("add to header called ... " + req.url + " origin - " + req.headers.referer);
    // // res.header("charset", "utf-8")
    var allowedOrigins = [
        "http://139.59.131.210/explorer",
        "https://139.59.131.210/explorer",
        "http://dev.masternode.review/explorer",
        "https://dev.masternode.review/explorer",
        "http://chain.review/explorer",
        "https://chain.review/explorer",
        "https://old.chain.review/explorer",
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
