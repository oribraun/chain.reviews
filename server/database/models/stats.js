var mongoose = require('mongoose')
  , Schema = mongoose.Schema;
var db = require('./../db');

var StatsSchema = new Schema({
  coin: { type: String },
  last_block: { type: Number, default: 0 },
  difficulty: { type: String, default: "" },
  moneysupply: { type: String, default: "" },
  hashrate: { type: String, default: "" },
  supply: { type: Number, default: 0 },
  blockcount: { type: Number, default: 0 },
  connections: { type: Number, default: 0 },
  masternodesCount: { type: Object, default: {} },
  last_price: { type: Number, default: 0 },
  version: { type: String, default: "" },
  protocol: { type: String, default: "" },
}, {timestamps: true});
var connections = db.getConnections();
var obj = {};
for(var i in connections) {
  obj[i] = connections[i].model('coinstats', StatsSchema);
}
module.exports = obj;
