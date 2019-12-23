const cluster = require('cluster');
const http = require('http');
const numCPUs = require('os').cpus().length;
const spawn = require('child_process').spawn;
const wallet_commands = require('./wallet_commands');

if (cluster.isMaster) {
    console.log(`Master ${process.pid} is running`);

    // Fork workers.
    for (let i = 0; i < numCPUs; i++) {
        cluster.fork();
    }

    cluster.on('exit', (worker, code, signal) => {
        console.log(`worker ${worker.process.pid} died`);
    });
} else {
    // Workers can share any TCP connection
    // In this case it is an HTTP server

    var wallet = process.argv[2];
    var type = process.argv[3];
    var hash_number = process.argv[4];
    startCluster(cluster, wallet, type, hash_number);

    // wallet_commands.getBlockCount('fix-cli').then(function(blockCount) {
    //     console.log('blockCount', blockCount);
    //     wallet_commands.getAllBlocksTest('fix-cli', 0, 100,function(index, hash){
    //         console.log('hash-' + index, hash);
    //     }).then(function(time){
    //         setTimeout(function(){
    //             console.log('finish getting blocks', time);
    //         },1000)
    //     }).catch(function(err) {
    //         console.log('error getting blocks', err);
    //     })
    // }).catch(function(err) {
    //     console.log('error getting blockCount', err);
    // })

}

function startCluster(cluster) {
    wallet_commands.getBlockCount('fix-cli').then(function(blockCount) {
        var current_cluster_id = cluster.worker.id;
        var allBlocksCount = blockCount;
        var offset = Math.ceil(allBlocksCount / numCPUs);
        var from = (cluster.worker.id - 1) * offset;
        var to = cluster.worker.id * offset;
        if(cluster.worker.id === numCPUs) {
            to = blockCount;
        }
        var ids = [];
        wallet_commands.getAllBlocksTest('fix-cli', from, to,function(index, hash){
            ids[index] = hash;
            console.log('hash-' + index, hash);
        }).then(function(time){
            console.log('finish getting blocks', time);
            console.log('ids.length', ids.length);
        }).catch(function(err) {
            console.log('error getting blocks', err);
        })
    }).catch(function(err) {
        console.log('error getting blockCount', err);
    })
    console.log(`Worker ${process.pid} started`);
}
