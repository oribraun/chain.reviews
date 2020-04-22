<?php

$path = "./../wallets/";
$results = scandir($path);

$bases = [];
foreach ($results as $result) {
    if ($result === '.' or $result === '..') continue;
    if (is_dir($path . '/' . $result)) {
        $string = file_get_contents($path . '/' . $result . "/" . "settings.json");
        $json = json_decode($string, true);
        if($json['active']) {
                $bases[strtoupper($json['coin'])] = $json['dbSettings']['database'];
        }
    }
}

$coin = !empty($argv[1]) ? $argv[1] : "";
$coin = strtoupper($coin);

$temp = shell_exec('ps aux | grep parser.php | grep ' . $coin . ' | wc -l');
if ($temp > 2) die;

$database = '';
if (array_key_exists($coin, $bases)) {
    $database = $bases[$coin];
} else {
    echo "Config for {$coin} not found\n";
    exit(1);
}

try {
    $mongo = new Mongo();
} catch (Exception $e) {
    echo "Mongo connection failed\n";
    exit(1);
}
$db = $mongo->selectDB($database);

include_once "clusters.php";
ParseBlocksForClusters($db);

include_once "merge_clusters.php";
MergeClusters($db);

include_once "internal_transactions.php";
InternalTransactions($db);
