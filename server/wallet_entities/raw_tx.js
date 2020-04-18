var validations =  require('./entities_validations');
class RawTx {
    // _hex = '01000000010000000000000000000000000000000000000000000000000000000000000000ffffffff0451021404ffffffff010000c52ebca2b1002321020a306f5db7863475d3c11bee89e29f579ffbbe3117cf6cc6b18e5aae0eb7b6bdac00000000';
    _txid = '';
    // _version = 1;
    // _locktime = 0;
    _vin = [ { coinbase: '51021404', sequence: 4294967295 } ];
    _vout = [ { value: 500000000, n: 0, scriptPubKey: [Object] } ];
    _blockhash = '';
    _confirmations = 0;
    _time = 0;
    // _blocktime = 1559228652;
    constructor(obj) {
        if(obj) {
            this.txid = obj.txid;
            this.vin = obj.vin;
            this.vout = obj.vout;
            this.blockhash = obj.blockhash;
            this.confirmations = obj.confirmations;
            this.time = obj.time;
        }
    }


    get txid() {
        return this._txid;
    }

    set txid(value) {
        if(validations.stringLengthValidation('txid', 64, value)) {
            this._txid = value;
        }
    }

    get vin() {
        return this._vin;
    }

    set vin(value) {
        if(validations.arrayValidation('vin', value)) {
            this._vin = value;
        }
    }

    get vout() {
        if(validations.arrayValidation('vin', value)) {
            return this._vout;
        }
    }

    set vout(value) {
        this._vout = value;
    }

    get blockhash() {
        return this._blockhash;
    }

    set blockhash(value) {
        if(validations.stringLengthValidation('blockhash', 64, value)) {
            this._blockhash = value;
        }
    }

    get confirmations() {
        return this._confirmations;
    }

    set confirmations(value) {
        if(validations.numberValidation('confirmations', value)) {
            this._confirmations = value;
        }
    }

    get time() {
        return this._time;
    }

    set time(value) {
        if(validations.numberValidation('time', value)) {
            this._time = value;
        }
    }
}

module.exports = RawTx;
