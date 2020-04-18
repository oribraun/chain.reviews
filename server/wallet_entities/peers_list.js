var validations = require('./entities_validations');
var Peer = require('./peer');

class PeersList {
    _list = [];
    constructor(obj) {
        if(obj) {
            this.list = obj
        }
    }

    get list() {
        return this._list;
    }

    set list(value) {
        if(validations.arrayOfValidation('list', 'peer', value)) {
            for (var i in value) {
                value[i] =  new Peer(value[i]);
            }
            this._list = value;
        }
    }
}

module.exports = PeersList;
