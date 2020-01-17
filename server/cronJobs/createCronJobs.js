const settings = require('./../wallets/all_settings');
const db = require('./../database/db');
const fs = require('fs-extra');

var string = "# /etc/cron.d/myCronTabs -- schedules wallet updates\n";
for (var wallet in settings) {
    // var txid = settings[wallet].example_txid;
    // var hash = settings[wallet].example_hash;
    // var dev_address = settings[wallet].dev_address;
    //   * * * * *  sleep  0 && /usr/bin/node /var/www/html/server/cronJobs/update_split.js fix >> /var/www/html/logs/fixCronUpdate.log 2>&1
    // */5 * * * *  sleep  0 && /usr/bin/node /var/www/html/server/cronJobs/update_peers.js fix >> /var/www/html/logs/fixCronUpdate.log 2>&1
    // */5 * * * *  sleep  0 && /usr/bin/node /var/www/html/server/cronJobs/update_masternodes.js fix >> /var/www/html/logs/fixCronUpdate.log 2>&1
    string += "  * * * * * root sleep 0 && /usr/bin/node /var/www/html/server/cronJobs/update_split.js " + wallet + " >> /var/www/html/logs/"+ wallet + "CronUpdate.log 2>&1\n";
    string += "*/5 * * * * root sleep 0 && /usr/bin/node /var/www/html/server/cronJobs/update_peers.js " + wallet + " >> /var/www/html/logs/"+ wallet + "CronUpdate.log 2>&1\n";
    string += "*/5 * * * * root sleep 0 && /usr/bin/node /var/www/html/server/cronJobs/update_masternodes.js " + wallet + " >> /var/www/html/logs/"+ wallet + "CronUpdate.log 2>&1\n";
    string += "\n\n";

}

fs.writeFile("/etc/cron.d/myCronTabs", string, function(err) {
    if(err) {
        return console.log(err);
    }
    console.log("The file was saved!");
});
console.log(string);
