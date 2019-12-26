var mongoose = require('mongoose')
  , Schema = mongoose.Schema;
var db = require('./../db');

var RichlistSchema = new Schema({
  coin: { type: String },	
  received: { type: Array, default: []},
  balance: { type: Array, default: [] },
});

var connections = db.getConnections();
var obj = {};
for(var i in connections) {
  obj[i] = connections[i].model('Richlist', RichlistSchema);
}
module.exports = obj;