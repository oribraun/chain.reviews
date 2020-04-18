var validations =  require('./entities_validations');

class Info {
    _version = 0;
    _protocolversion = 0;
    // walletversion = 61000;
    // balance = 0.00000000;
    // blocks = 215366;
    // timeoffset = 0;
    // connections = 110;
    // proxy = "";
    _difficulty = 0;
    // testnet = false;
    _moneysupply = 0;
    // keypoololdest = 1576493730;
    // keypoolsize = 999;
    // paytxfee = 0.00000000;
    // relayfee = 0.00100000;
    // staking status = "Staking Not Active";
    // errors = ""

    constructor(obj) {
        if(obj) {
            this.version = obj.version;
            this.protocolversion = obj.protocolversion;
            this.difficulty = obj.difficulty;
            this.moneysupply = obj.moneysupply;
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

    get protocolversion() {
        return this._protocolversion;
    }

    set protocolversion(value) {
        if(validations.numberValidation('protocolversion', value)) {
            this._protocolversion = value;
        }
    }

    get difficulty() {
        return this._difficulty;
    }

    set difficulty(value) {
        if(validations.numberValidation('difficulty', value)) {
            this._difficulty = value;
        }
    }

    get moneysupply() {
        return this._moneysupply;
    }

    set moneysupply(value) {
        if(validations.numberValidation('moneysupply', value)) {
            this._moneysupply = value;
        }
    }
}

module.exports = Info;
