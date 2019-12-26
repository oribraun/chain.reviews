var mongoose = require('mongoose')
  , Schema = mongoose.Schema;
var db = require('./../db');

var StatsSchema = new Schema({
  coin: { type: String },
  count: { type: Number, default: 1 },
  last: { type: Number, default: 1 },
  //difficulty: { type: Object, default: {} },
  //hashrate: { type: String, default: 'N/A' },
  supply: { type: Number, default: 0 },
  //last_txs: { type: Array, default: [] },
  connections: { type: Number, default: 0 },
  last_price: { type: Number, default: 0 },
});
var connections = db.getConnections();
var obj = {};
for(var i in connections) {
  obj[i] = connections[i].model('coinstats', StatsSchema);
}
module.exports = obj;