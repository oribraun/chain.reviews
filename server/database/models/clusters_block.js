var mongoose = require('mongoose')
    , Schema = mongoose.Schema;
var db = require('./../db');

var ClusterBlockSchema = new Schema({
    name: { type: String, default: "" },
    block: { type: Number},
}, {id: false, timestamps: true});

var connections = db.getConnections();
var obj = {};
for(var i in connections) {
    obj[i] = connections[i].model('clusters_block', ClusterBlockSchema);
}
module.exports = obj;
