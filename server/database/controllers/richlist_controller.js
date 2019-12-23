var Richlist = require('../models/richlist');
var Address = require('../models/address');

function getAll(sortBy, order, limit, cb) {
    var sort = {};
    sort[sortBy] = order;
    Richlist.find({}).sort(sort).limit(limit).exec( function(err, tx) {
        if(tx) {
            return cb(tx);
        } else {
            return cb(null);
        }
    });
}

function updateOne(obj, cb) { // update or create
    Richlist.findOne({coin: obj.coin}, function(err, richlist) {
        if(err) {
            return cb(err);
        }
        if(richlist) {
            richlist.received = obj.received;
            richlist.balance = obj.balance;
            richlist.save(function(err) {
                if (err) {
                    return cb(err);
                } else {
                    //console.log('txid: ');
                    return cb();
                }
            })
        } else {
            var newRichlist = new Richlist({
                coin: coin,
                received: [],
                balance: [],
            });
            newRichlist.save(function(err) {
                if (err) {
                    return cb(err);
                } else {
                    console.log("initial richlist entry created for %s", coin);
                    //console.log(newRichlist);
                    return cb();
                }
            });
        }
    });
}

function getOne(coin, cb) {
    Richlist.findOne({coin: coin}, function(err, richlist) {
        if(richlist) {
            return cb(richlist);
        } else {
            return cb();
        }
    });
}

function deleteOne(coin, cb) {
    Richlist.deleteOne({coin: coin}, function(err, tx) {
        if(tx) {
            return cb();
        } else {
            return cb(null);
        }
    });
}

function deleteAll(cb) {
    Richlist.remove({},function(err, numberRemoved){
        return cb(numberRemoved)
    })
}

function getRichlist(coin, cb) {
    Richlist.findOne({coin: coin}, function(err, richlist) {
        if(richlist) {
            return cb(richlist);
        } else {
            return cb();
        }
    });
}

function updateRichlist(obj, cb) {
    Richlist.findOne({coin: obj.coin}, function(err, richlist) {
        if(richlist) {
            richlist.received = obj.received;
            richlist.balance = obj.balance;
            richlist.save(function(err) {
                if (err) {
                    return cb(err);
                } else {
                    //console.log('txid: ');
                    return cb();
                }
            })
        } else {
            var newRichlist = new Richlist({
                coin: coin,
            });
            newRichlist.save(function(err) {
                if (err) {
                    console.log(err);
                    return cb();
                } else {
                    console.log("initial richlist entry created for %s", coin);
                    //console.log(newRichlist);
                    return cb();
                }
            });
        }
    });
}

function update(coin, options, cb) {
    Richlist.updateOne({coin: coin}, options, function(err) {
        if(err) {
            return cb(err);
        }
        return cb();
    })
}
function updateRichlistByList(list, cb){
    if(list == 'received') {
        Address.find({}).sort({received: 'desc'}).limit(100).exec(function(err, addresses){
            Richlist.updateOne({coin: settings.coin}, {
                received: addresses,
            }, function() {
                return cb();
            });
        });
    } else { //balance
        Address.find({}).sort({balance: 'desc'}).limit(100).exec(function(err, addresses){
            Richlist.updateOne({coin: settings.coin}, {
                balance: addresses,
            }, function() {
                return cb();
            });
        });
    }
}

function create_richlist(coin, cb) {
    var newRichlist = new Richlist({
        coin: coin,
    });
    newRichlist.save(function(err) {
        if (err) {
            console.log(err);
            return cb();
        } else {
            console.log("initial richlist entry created for %s", coin);
            //console.log(newRichlist);
            return cb();
        }
    });
}
// checks richlist data exists for given coin
function check_richlist(coin, cb) {
    Richlist.findOne({coin: coin}, function(err, exists) {
        if(exists) {
            return cb(true);
        } else {
            return cb(false);
        }
    });
}

module.exports.getAll = getAll;
module.exports.updateOne = updateOne;
module.exports.getOne = getOne;
module.exports.deleteOne = deleteOne;
module.exports.deleteAll = deleteAll;
module.exports.updateRichlist = updateRichlist;
module.exports.update = update;
