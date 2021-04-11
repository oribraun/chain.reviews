const settings = require('./../wallets/all_settings');
const db = require('./../database/db');
const fs = require('fs-extra');

var string = "# /etc/cron.d/myCronTabs -- schedules wallet updates\n";
for (var wallet in settings) {
    if(settings[wallet].active) {
        // var txid = settings[wallet].example_txid;
        // var hash = settings[wallet].example_hash;
        // var dev_address = settings[wallet].dev_address;
        //   * * * * *  sleep  0 && /usr/bin/node --max-old-space-size=8192 /var/www/html/server/cronJobs/update_split.js fix >> /var/www/html/logs/fixCronUpdate.log 2>&1
        // */5 * * * *  sleep  0 && /usr/bin/node /var/www/html/server/cronJobs/update_peers.js fix >> /var/www/html/logs/fixCronUpdate.log 2>&1
        // */5 * * * *  sleep  0 && /usr/bin/node /var/www/html/server/cronJobs/update_masternodes.js fix >> /var/www/html/logs/fixCronUpdate.log 2>&1
        string += "  * * * * * root sleep 0 && /usr/bin/node --max-old-space-size=8192 /var/www/html/chain.review/server/cronJobs/update_split.js " + wallet + " >> /var/www/html/chain.review/logs/" + wallet + "CronUpdate.log 2>&1\n";
        string += "*/5 * * * * root sleep 0 && /usr/bin/node /var/www/html/chain.review/server/cronJobs/update_peers.js " + wallet + " >> /var/www/html/chain.review/logs/" + wallet + "CronUpdatePeers.log 2>&1\n";
        string += "*/5 * * * * root sleep 0 && /usr/bin/node /var/www/html/chain.review/server/cronJobs/update_masternodes.js " + wallet + " >> /var/www/html/chain.review/logs/" + wallet + "CronUpdateMasternodes.log 2>&1\n";
        string += "*/5 * * * * root sleep 0 && /usr/bin/node /var/www/html/chain.review/server/cronJobs/update_richlist.js " + wallet + " >> /var/www/html/chain.review/logs/" + wallet + "CronUpdateRichlist.log 2>&1\n";
        string += "*/5 * * * * root sleep 0 && /usr/bin/node /var/www/html/chain.review/server/cronJobs/update_market.js " + wallet + " >> /var/www/html/chain.review/logs/" + wallet + "CronUpdateMarket.log 2>&1\n";
        string += "  * * * * * root sleep 0 && /usr/bin/node /var/www/html/chain.review/server/cronJobs/update_tx_chart.js " + wallet + " >> /var/www/html/chain.review/logs/" + wallet + "CronUpdateTxChart.log 2>&1\n";
        // string += "0 */1 * * * root sleep 0 && /usr/bin/node /var/www/html/chain.review/server/cronJobs/update_extra_stats.js " + wallet + " >> /var/www/html/chain.review/logs/" + wallet + "CronUpdateExtraStats.log 2>&1\n";
        string += "0 */2 * * * root sleep 0 && /usr/bin/node /var/www/html/chain.review/server/cronJobs/update_clusters_tx_chart.js " + wallet + " >> /var/www/html/chain.review/logs/" + wallet + "CronUpdateClustersTxChart.log 2>&1\n";
        string += "  * * * * * root sleep 0 && /usr/bin/php /var/www/html/chain.review/server/parser/parser.php " + wallet + " >> /var/www/html/chain.review/logs/" + wallet + "CronUpdateClusters.log 2>&1\n";
        string += "\n\n";
    }

}

fs.writeFile("/etc/cron.d/myCronTabs", string, function(err) {
    if(err) {
        return console.log(err);
    }
    console.log("The file was saved!");
});
console.log(string);
