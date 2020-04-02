var mongoose = require('mongoose')
    , Schema = mongoose.Schema;
var db = require('./../db');

var TxSchema = new Schema({
    d: { type: String, unique: true, index: true}, // date
    w: { type: Number, index: true }, // week
    c: { type: Number, default: 0 }, // count
    t: { type: Number, default: 0 }, // total
}, {id: false, timestamps: false});
var connections = db.getConnections();
var obj = {};
for(var i in connections) {
    obj[i] = connections[i].model('TxByDay', TxSchema);
    // obj[i].collection.dropIndex({ date: 1 })
}
module.exports = obj;
