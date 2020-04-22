<?php

include_once "common.php";

function ParseBlocksForClusters($db)
{
    //$db->clusters_addresses->createIndex(['address' => 1]);
    $db->clusters->createIndex(['addresses' => 1]);
    $db->clusters->createIndex(['update' => 1]);


    $clusters_block_collection = $db->clusters_block;

    $current_block = 0;
    $clusters_last_block = $clusters_block_collection->findOne(['name' => 'last_block']);
    if (!empty($clusters_last_block)) {
        $current_block = $clusters_last_block['block'] + 1;
    }

    $transactions_collection = $db->txes;

    $last_block = GetLastBlock($db);

    while ($current_block < $last_block) {
        echo "Block parser {$current_block} / {$last_block}\n";

        $transactions = $transactions_collection->find(['blockindex' => $current_block]);
        foreach ($transactions as $transaction) {
            if (empty($transaction['vin']) && empty($transaction['vout'])) {
                continue;
            }

            $vouts = [];
            foreach ($transaction['vout'] as $item) {
                if (empty($item['scriptPubKey'])) {
                    continue;
                }
                if (empty($item['scriptPubKey']['addresses'])) {
                    continue;
                }
                foreach ($item['scriptPubKey']['addresses'] as $address) {
                    $vouts[] = $address;
                }
            }

            if (!empty($vouts)) {
                foreach ($vouts as $address) {
                    UpdateAddress($db, $address, $transaction['timestamp']);
                }
            }

            if (!empty($transaction['vin'])) {
                $vins = [];
                foreach ($transaction['vin'] as $item) {
                    if (!empty($item['txid'])) {
                        $address = GetAddressByVin($db, $item['txid'], $item['vout']);
                        if (empty($address)) {
                            continue;
                        }
                        $vins[] = $address;
                    }
                }
                $vins = array_unique($vins);

                if (count($vins) > 1) {
                    AddClusterConnection($db, $vins);
                    foreach ($vins as $address) {
                        UpdateAddress($db, $address, $transaction['timestamp']);
                    }
                }
            }
        }

        $clusters_block_collection->update(['name' => 'last_block'], ['$set' => ['block' => $current_block]], ['upsert' => 1]);
        $current_block++;
    }
}