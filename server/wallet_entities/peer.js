var validations = require('./entities_validations');

class Peer {
    // id = 188;
    _addr = "";
    // addrlocal = "134.122.85.174 =17464";
    // services = "0000000000000005";
    _lastsend = 0;
    _lastrecv = 0;
    // bytessent = 15282;
    // bytesrecv = 5040;
    _conntime = 0;
    // timeoffset = 0;
    // pingtime = 0.216467;
    _version = 0;
    _subver = "";
    // inbound = true;
    // startingheight = 215366;
    // banscore = 0;
    // synced_headers = -1;
    // synced_blocks = -1;
    // inflight = [];
    // whitelisted = false

    // if(validations.stringLengthValidation('hash', 64, value)) {

    constructor(obj) {
        if(obj) {
            this.addr = obj.addr;
            this.lastsend = obj.lastsend;
            this.lastrecv = obj.lastrecv;
            this.conntime = obj.conntime;
            this.version = obj.version;
            this.subver = obj.subver;
        }
    }

    get addr() {
        return this._addr;
    }

    set addr(value) {
        if(validations.stringValidation('addr', value)) {
            this._addr = value;
        }
    }

    get lastsend() {
        return this._lastsend;
    }

    set lastsend(value) {
        if(validations.numberValidation('lastsend', value)) {
            this._lastsend = value;
        }
    }

    get lastrecv() {
        return this._lastrecv;
    }

    set lastrecv(value) {
        if(validations.numberValidation('lastrecv', value)) {
            this._lastrecv = value;
        }
    }

    get conntime() {
        return this._conntime;
    }

    set conntime(value) {
        if(validations.numberValidation('conntime', value)) {
            this._conntime = value;
        }
    }

    get version() {
        return this._version;
    }

    set version(value) {
        if(validations.numberValidation('version', value)) {
            this._version = value;
        }
    }

    get subver() {
        return this._subver;
    }

    set subver(value) {
        if(validations.stringValidation('subver', value)) {
            this._subver = value;
        }
    }
}

module.exports = Peer;
