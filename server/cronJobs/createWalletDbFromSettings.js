const settings = require('./../wallets/all_settings');
const db = require('./../database/db');
const fs = require('fs-extra');
const spawn = require('child_process').spawn;

var wallet = process.argv[2];

if(!wallet) {
    console.log('please add wallet name');
    return;
}
if(settings[wallet]) {
    console.log('wallet', wallet)
    createDb(settings[wallet]);
}

function createDb(settings) {
    const pipe = spawn('mongo', [settings.dbSettings.database, '--eval', "printjson(db.createUser(" +
    "            {" +
    "                user: '" + settings.dbSettings.user + "'," +
    "                pwd: '" + settings.dbSettings.password + "'," +
    "                roles:[{role:'root', db:'admin'}]," +
    "            }))"], {}, function done(err, stdout, stderr) {
        if (err) {
            console.error('Error:', err.stack);
            try {
                proc.kill('SIGINT');
                // fs.removeSync(__dirname + sess.dir);
                // delete sess.proc;
                // delete sess.dir;
            } catch(e) {
                console.log('e', e);
            }
            // throw err;
        }
        // console.log('Success', stdout);
        // console.log('Err', stderr);
    });
// const pipe = spawn('mongo', ['--eval', "printjson(db.getCollectionNames())"]);
    pipe.stdout.on('data', function (data) {
        console.log((data.toString('utf8').replace('undefined', '')));
    });

    pipe.stderr.on('data', (data) => {
        console.log('err', data.toString('utf8'));
    });

    pipe.on('close', (code) => {
        console.log('Process exited with code: '+ code);
    });
}

