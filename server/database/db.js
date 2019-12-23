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
var db = {
    connect: function(dbSettings) {
        var dbString = 'mongodb://' + dbSettings.user;
        dbString = dbString + ':' + dbSettings.password;
        dbString = dbString + '@' + dbSettings.address;
        dbString = dbString + ':' + dbSettings.port;
        dbString = dbString + '/' + dbSettings.database;
        console.log(dbString)
        mongoose.connect(dbString,{useNewUrlParser: true, useUnifiedTopology: true, useCreateIndex: true}, function(err, database) {
            if (err) {
                console.log(err)
                console.log('Unable to connect to database: %s', dbString);
                console.log('Aborting');
                process.exit(1);

            }
            console.log('Successfully connected to MongoDB');
            // return cb();
        });
        const db = mongoose.connection;
        db.on("error", () => {
            console.log("> error occurred from the database");
        });
        db.once("open", () => {
            console.log("> successfully opened the database");
        });
    },
    disconnect: function() {
        mongoose.connection.close();
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
        mongoose.mongo.MongoClient.connect(dbString, {useNewUrlParser: true, useUnifiedTopology: true, useCreateIndex: true}, function(err, db) {
            if (err) {
                console.log(err)
                console.log('Unable to connect to database: %s', dbString);
                console.log('Aborting');
                process.exit(1);

            }
            console.log('Successfully connected to MongoDB');
            console.log(db)
            db.createUser({
                user: dbSettings.user,
                pwd: dbSettings.password,
                roles: [
                    {role: "dbOwner", db: dbSettings.database}
                ]
            })
        });
        db.once('connected', function (err) {

        });
    },
    createAdmin: function(){
        // db.createUser(
        //     {
        //         user: "admin",
        //         pwd: "KtG#v$pJf4DCEbk5GGZV",
        //         roles:[{role:"root", db:"admin"}],
        //     })

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
    }
}

module.exports = db;
