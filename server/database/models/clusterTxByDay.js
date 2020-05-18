var mongoose = require('mongoose')
    , Schema = mongoose.Schema;
var db = require('./../db');

var TxSchema = new Schema({
    cid: { type: String, index: true }, // cluster id
    d: { type: String, index: true}, // date
    w: { type: Number, index: true }, // week
    c: { type: Number, default: 0 }, // count
    t: { type: Number, default: 0 }, // total
}, {id: false, timestamps: false});
TxSchema.index({ cid: 1, d: 1 }, { unique: true });
var connections = db.getConnections();
var obj = {};
for(var i in connections) {
    obj[i] = connections[i].model('ClusterTxByDay', TxSchema);
    // obj[i].collection.dropIndex({ date: 1 })
}
module.exports = obj;
