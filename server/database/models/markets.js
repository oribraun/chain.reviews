var mongoose = require('mongoose')
  , Schema = mongoose.Schema;
var db = require('./../db');

var MarketsSchema = new Schema({
  symbol: { type: String, unique: true },
  summary: { type: Object, default: {} },
  chartdata: { type: Array, default: [] },
  bids: { type: Array, default: [] },
  asks: { type: Array, default: [] },
  history: { type: Array, default: [] },
});

var connections = db.getConnections();
var obj = {};
for(var i in connections) {
  obj[i] = connections[i].model('Markets', MarketsSchema);
}

module.exports = obj;
// module.exports = mongoose.model('Markets', MarketsSchema);