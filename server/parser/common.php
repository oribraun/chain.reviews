<?php

function av() {
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

function AddNewAddress($db, $address, $blockindex) {
    $db->clusters_addresses->update([
        'address' => $address
    ], [
        '$setOnInsert' => ['first_seen' => $blockindex],
        '$set' => ['last_seen' => $blockindex],
    ], [
        'upsert' => 1
    ]);
}

function AddClusterConnection($db, $addresses) {
    $addresses = array_values($addresses);
    $cluster = $db->clusters->findOne(['addresses' => ['$in' => $addresses]]);

    if (!empty($cluster)) {
        $new_addresses = array_values(array_diff($addresses, $cluster['addresses']));
        if (empty($new_addresses)) { return; }

        $clusters_transactions_collection = $db->clusters_transactions;
        $clusters_transactions_collection->update(
            ['vins' => ['$in' => $new_addresses]],
            ['$set' => ['cin' => $cluster['_id']]],
            ['multiple' => true]
        );
        $clusters_transactions_collection->update(
            ['vouts' => ['$in' => $new_addresses]],
            ['$addToSet' => ['couts' => $cluster['_id']]],
            ['multiple' => true]
        );
    }

    $db->clusters->update([
        'addresses' => ['$in' => $addresses],
        'changed' => true
    ], [
        '$addToSet' => [
            'addresses' => ['$each' => $addresses]
        ],
        '$set' => [
            'update' => true
        ]
    ], ['upsert' => 1]);
}

function GetAddressByVin($db, $tx, $vout) {
    $transactions_collection = $db->txes;

    $transaction = $transactions_collection->findOne(['txid' => $tx]);
    if (empty($transaction)) { return null; }
    return av($transaction, 'vout', $vout, 'scriptPubKey', 'addresses', 0);
}

function FindClusterWithAllAddresses($db, $addresses) {
    return $db->clusters->findOne(['addresses' => ['$all' => $addresses]]);
}

function GetClusterByAddress($db, $address)
{
    return $db->clusters->findOne(['addresses' => $address]);
}
