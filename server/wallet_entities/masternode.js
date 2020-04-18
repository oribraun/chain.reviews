var validations =  require('./entities_validations');

class Masternode {
    // rank = 100;
    // network = 'ipv4';
    // txhash = 'd56e0b445a1d916b525d3764b90871aae01e2a7296ddc251e4dfe9d113322c81';
    // outidx = 1;
    // pubkey = '0456186cd375d3851f5ed6716f8c243f4652b520fb2cf6803190e2f664c86190c51b184fe28d5719f78c8592909d7a910182960c36488be68bc756d192a460f00b';
    _collateral = 0;
    _status = '';
    _addr = '';
    // version = 70921;
    _lastseen = 0;
    _activetime = 0;
    _lastpaid = 0;

    constructor(obj) {
        if(obj) {
            this.collateral = obj.collateral;
            this.status = obj.status;
            this.addr = obj.addr;
            this.lastseen = obj.lastseen;
            this.activetime = obj.activetime;
            this.lastpaid = obj.lastpaid;
        }
    }

    get collateral() {
        return this._collateral;
    }

    set collateral(value) {
        // if(validations.numberValidation('collateral', value)) {
            this._collateral = value;
        // }
    }

    get status() {
        return this._status;
    }

    set status(value) {
        if(validations.stringValidation('status', value)) {
            this._status = value;
        }
    }

    get addr() {
        return this._addr;
    }

    set addr(value) {
        if(validations.stringLengthValidation('add', 34,  value)) {
            this._addr = value;
        }
    }

    get lastseen() {
        return this._lastseen;
    }

    set lastseen(value) {
        if(validations.numberValidation('lastseen', value)) {
            this._lastseen = value;
        }
    }

    get activetime() {
        return this._activetime;
    }

    set activetime(value) {
        if(validations.numberValidation('activetime', value)) {
            this._activetime = value;
        }
    }

    get lastpaid() {
        return this._lastpaid;
    }

    set lastpaid(value) {
        if(validations.numberValidation('lastpaid', value)) {
            this._lastpaid = value;
        }
    }
}

module.exports = Masternode;
