var validations =  require('./entities_validations');

class MiningInfo {
    _blocks = 0;
    _currentblocksize = 0;
    _currentblocktx = 0;
    _difficulty = 0;
    _errors = "";
    _genproclimit = -1;
    _networkhashps = 0;
    _pooledtx = 0;
    _testnet = false;
    _chain = "";
    _generate = false;
    _hashespersec = 0

    constructor(obj) {
        if(obj) {
            this.blocks = obj.blocks;
            this.currentblocksize = obj.currentblocksize;
            this.currentblocktx = obj.currentblocktx;
            this.difficulty = obj.difficulty;
            this.errors = obj.errors;
            this.genproclimit = obj.genproclimit;
            this.networkhashps = obj.networkhashps;
            this.pooledtx = obj.pooledtx;
            this.testnet = obj.testnet;
            this.chain = obj.chain;
            this.generate = obj.generate;
            this.hashespersec = obj.hashespersec
        }
    }

    get blocks() {
        return this._blocks;
    }

    set blocks(value) {
        this._blocks = value;
    }

    get currentblocksize() {
        return this._currentblocksize;
    }

    set currentblocksize(value) {
        this._currentblocksize = value;
    }

    get currentblocktx() {
        return this._currentblocktx;
    }

    set currentblocktx(value) {
        this._currentblocktx = value;
    }

    get difficulty() {
        return this._difficulty;
    }

    set difficulty(value) {
        this._difficulty = value;
    }

    get errors() {
        return this._errors;
    }

    set errors(value) {
        this._errors = value;
    }

    get genproclimit() {
        return this._genproclimit;
    }

    set genproclimit(value) {
        this._genproclimit = value;
    }

    get networkhashps() {
        return this._networkhashps;
    }

    set networkhashps(value) {
        this._networkhashps = value;
    }

    get pooledtx() {
        return this._pooledtx;
    }

    set pooledtx(value) {
        this._pooledtx = value;
    }

    get testnet() {
        return this._testnet;
    }

    set testnet(value) {
        this._testnet = value;
    }

    get chain() {
        return this._chain;
    }

    set chain(value) {
        this._chain = value;
    }

    get generate() {
        return this._generate;
    }

    set generate(value) {
        this._generate = value;
    }

    get hashespersec() {
        return this._hashespersec;
    }

    set hashespersec(value) {
        this._hashespersec = value;
    }
}

module.exports = MiningInfo;
