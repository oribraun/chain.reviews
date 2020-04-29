var mongoose = require('mongoose')
// var settings = require('../settings');

var adminSettings = {
    user: "admin",
    pwd: "KtG#v$pJf4DCEbk5GGZV",
    roles:[{role:"root", db:"admin"}],
    "database": "admin",
    "address" : "localhost",
    "port" : 27017
    // db.createUser({user:"admin", pwd:"KtG#v$pJf4DCEbk5GGZV", roles:[{role:"root", db:"admin"}]})
}

var mainDbSettings = {
    user: "masternodeuser",
    pwd: "d1$R#147Moqiu10o2F^c",
    roles:[{role:"root", db:"admin"}],
}

const options = {
    socketTimeoutMS: 1*60*1000, // 1 minute timeout
    keepAlive: true,
    // reconnectTries: 30000,
    // autoReconnect: false,
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useCreateIndex: true
};

var isConnected = false;
var connections = {};
var currentConnection;
var db = {
    connect: function(dbSettings) {
        var dbString = 'mongodb://' + dbSettings.user;
        dbString = dbString + ':' + dbSettings.password;
        dbString = dbString + '@' + dbSettings.address;
        dbString = dbString + ':' + dbSettings.port;
        dbString = dbString + '/' + dbSettings.database;
        // console.log(dbString)
        mongoose.connect(dbString,{useNewUrlParser: true, useUnifiedTopology: true, useCreateIndex: true, autoReconnect: false}, function(err, database) {
            if (err) {
                console.log(err)
                console.log('Unable to connect to database: %s', dbString);
                console.log('Aborting');
                process.exit(1);

            }
            isConnected = true;
            console.log('Successfully connected to MongoDB');
            // return cb();
        });
        const db = mongoose.connection;
        db.on("error", () => {
            console.log("> error occurred from the database", dbSettings.database);
        });
        db.once("open", () => {
            console.log("> successfully opened the database", dbSettings.database);
        });
    },
    connect2: function(wallet, dbSettings, onError) {
        var dbString = 'mongodb://' + dbSettings.user;
        dbString = dbString + ':' + dbSettings.password;
        dbString = dbString + '@' + dbSettings.address;
        dbString = dbString + ':' + dbSettings.port;
        dbString = dbString + '/' + dbSettings.database;
        // console.log(dbString)
        mongoose.connect(dbString,{useNewUrlParser: true, useUnifiedTopology: true, useCreateIndex: true}, function(err, database) {
            if (err) {
                console.log(err)
                console.log('Unable to connect to database: %s', dbString);
                console.log('Aborting');
                onError();
                // process.exit(1);

            }
            isConnected = true;
            // console.log('Successfully connected to ' + wallet);
            // return cb();
        });
        const conn = mongoose.connection;
        connections[wallet] = conn;
        conn.on("error", () => {
            console.log("> error occurred from the database");
        });
        conn.once("open", () => {
            console.log("> successfully opened the database " + wallet);
        });
    },
    disconnect: function() {
        isConnected = false;
        mongoose.connection.close();
    },
    multipleConnect: function(obj) {
        for(var i in obj) {
            if(obj[i].active) {
                var dbString = 'mongodb://' + obj[i].dbSettings.user;
                dbString = dbString + ':' + obj[i].dbSettings.password;
                dbString = dbString + '@' + obj[i].dbSettings.address;
                dbString = dbString + ':' + obj[i].dbSettings.port;
                dbString = dbString + '/' + obj[i].dbSettings.database;
                // console.log(dbString)
                var conn = mongoose.createConnection(dbString, options, function (err) {
                    // console.log('err', err)
                });
                // connections[i] = mongoose.connection;
                // '0': 'disconnected',
                //     '1': 'connected',
                //     '2': 'connecting',
                //     '3': 'disconnecting',
                //     '99': 'uninitialized',

                // const db = mongoose;
                connections[i] = conn;
                // function test(i) {
                // // console.log(conn.collection("masternode1"));
                //     var Masternode1 = connections[i].model('Masternode1', new mongoose.Schema({rank: {type: String, default: 0}}));
                //     var MN = new Masternode1({
                //         rank: i
                //     });
                //     Masternode1.deleteMany({},function(err, numberRemoved){
                //         // console.log(MN)
                //         MN.save(function(err) {
                //             if (err) {
                //                 console.log(err)
                //             } else {
                //                 //console.log('txid: ');
                //                 // console.log('created')
                //                 Masternode1.find({}, function(err, tx) {
                //                     if(tx) {
                //                         console.log(tx)
                //                     } else {
                //                         // console.log('empty')
                //                     }
                //                 });
                //             }
                //         });
                //     })
                // }
                // test(i);
                function on(c) {
                    c.on("error", (e) => {
                        console.log('db._readyState error', c._readyState)
                        console.log("> error occurred from the database", e);
                    });
                    c.once("open", () => {
                        console.log('db._readyState', c._readyState)
                        console.log("> successfully opened the database", c.name);
                    });
                }

                on(connections[i]);
            }
        }
    },
    getConnections: function() {
        return connections;
    },
    setCurrentConnection: function(key) {
        currentConnection = key;
    },
    getCurrentConnection: function() {
        return currentConnection;
    },
    multipleDisconnect: function() {
        for(var i in connections) {
            connections[i].close();
            console.log('Successfully disconnected to ' + i);
        }
    },
    createDb: function(dbSettings) {
        var dbString = 'mongodb://';
        dbString = dbString + '@' + dbSettings.address;
        dbString = dbString + ':' + dbSettings.port;
        dbString = dbString + '/' + dbSettings.database;
        mongoose.connect(dbString, {useNewUrlParser: true, useUnifiedTopology: true, useCreateIndex: true}, function(err) {
            if (err) {
                console.log(err)
                console.log('Unable to connect to database: %s', dbString);
                console.log('Aborting');
                process.exit(1);

            }
            console.log('Successfully connected to MongoDB');
            // return cb();
        });
    },
    createUser: function(dbSettings) {

    },
    connectAsAdmin: function() {
        var dbString = 'mongodb://' + adminSettings.user;
        dbString = dbString + ':' + adminSettings.password;
        dbString = dbString + '@' + adminSettings.address;
        dbString = dbString + ':' + adminSettings.port;
        dbString = dbString + '/' + adminSettings.database;
        mongoose.connect(dbString, function(err) {
            if (err) {
                console.log(err)
                console.log('Unable to connect to database: %s', dbString);
                console.log('Aborting');
                process.exit(1);

            }
            //console.log('Successfully connected to MongoDB');
            // return cb();
        });
    },
    createDBAndUser: function(dbSettings) {
        var dbString = 'mongodb://';
        dbString = dbString + '@' + dbSettings.address;
        dbString = dbString + ':' + dbSettings.port;
        dbString = dbString + '/' + dbSettings.database;
        mongoose.connect(dbString, {useNewUrlParser: true, useUnifiedTopology: true, useCreateIndex: true}, function(err, db) {
            if (err) {
                console.log(err)
                console.log('Unable to connect to database: %s', dbString);
                console.log('Aborting');
                process.exit(1);

            }
            console.log('Successfully connected to MongoDB');
            // var admin_db = db.admin();
            // admin_db.authenticate('adminusername', 'password')
            // console.log(db)
            db.admin().addUser( dbSettings.user, dbSettings.password, { roles: [ {role: "dbOwner", db: dbSettings.database} ] } );
            // db.createUser({
            //     user: dbSettings.user,
            //     pwd: dbSettings.password,
            //     roles: [
            //         {role: "dbOwner", db: dbSettings.database}
            //     ]
            // })
            // db.createUser(
            //     {
            //         user: "masternodestreamuser",
            //         pwd: "EyY2anT!Fud*Pb4JvBB9",
            //         roles: [ { role: "dbOwner", db: "streamdb" } ]
            //     }
            // )
        });
    },
    createAdmin: function(){
        db.createUser(
            {
                user: "admin",
                pwd: "KtG#v$pJf4DCEbk5GGZV",
                roles:[{role:"root", db:"admin"}],
            })

    },
    dropUser: function(dbSttings) {
        // db.dropUser("masternodefixuser")
    },
    removeMongodb: function() {
        // sudo service mongod stop
        // sudo apt-get remove mongodb* --purge
        // // sudo apt-get purge mongodb-org*
        // sudo rm -r /var/log/mongodb
        // sudo rm -r /var/lib/mongodb

    },
    listOfMongoPid: function() {
        // ps ax | grep mongod
        // sudo lsof -iTCP -sTCP:LISTEN -n -P
    },
    isConnected: function() {
        return isConnected;
    }
}

module.exports = db;
