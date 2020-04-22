<?php

function av()
{
    $params = func_get_args();
    if (count($params) < 2 || !is_array($params[0])) return null;
    $v = &$params[0];
    for ($i = 1; $i < count($params); $i++) {
        if (!is_array($v) || !array_key_exists($params[$i], $v)) return null;
        $v = &$v[$params[$i]];
    }
    return $v;
}

function GetLastBlock($db) {
    $blocks_collection = $db->blocks;

    $blocks = iterator_to_array($blocks_collection->find(['_id' => ['$exists' => true]])->sort(['blockindex' => -1])->limit(1));

    if (empty($blocks)) return 0;

    return av(array_values($blocks), 0, 'blockindex') - 1;
}

function AddClusterConnection($db, $addresses) {
    $addresses = array_values($addresses);
    $db->clusters->update([
        'addresses' => ['$in' => $addresses]
    ], [
        '$addToSet' => [
            'addresses' => ['$each' => $addresses]
        ],
        '$set' => [
            'update' => true
        ]
    ], ['upsert' => 1]);
}

function UpdateAddress($db, $address, $time) {
    return;
    $addresses_collection = $db->clusters_addresses;

    $addresses_collection->update(['address' => $address], [
        '$set' => [
            'last_seen' => $time,
        ],
        '$setOnInsert' => [
            'ct' => $time
        ],
    ], ['upsert' => 1]);
}

function GetAddressByVin($db, $tx, $vout) {
    $transactions_collection = $db->txes;

    $transaction = $transactions_collection->findOne(['txid' => $tx]);
    if (empty($transaction)) { return null; }
    return av($transaction, 'vout', $vout, 'scriptPubKey', 'addresses', 0);
}

