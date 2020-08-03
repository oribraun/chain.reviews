<?php

function ClusterTransactions($db) {
    $transactions_collection = $db->txes;

    $clusters_transactions_collection = $db->clusters_transactions;
    $clusters_transactions_collection->createIndex(['txid' => 1]);
    $clusters_transactions_collection->createIndex(['vins' => 1]);
    $clusters_transactions_collection->createIndex(['vouts' => 1]);
    $clusters_transactions_collection->createIndex(['cin' => 1]);
    $clusters_transactions_collection->createIndex(['couts' => 1]);

    $clusters_block_collection = $db->clusters_block;
    $clusters_last_block = $clusters_block_collection->findOne(['name' => 'last_block']);
    if (empty($clusters_last_block)) {
        return;
    }

    $last_block = $clusters_last_block['block'];


    $transactions_last_block = $clusters_block_collection->findOne(['name' => 'transactions_last_block']);
    $i_last_block = 0;
    if (!empty($transactions_last_block)) {
        $i_last_block = $transactions_last_block['block'] + 1;
    }

    while ($i_last_block < $last_block) {
        echo "Cluster transaction parser {$i_last_block}/{$last_block}\n";

        $transactions = $transactions_collection->find(['blockindex' => $i_last_block]);
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

            if (empty($vouts)) { continue; }
            $vouts = array_values(array_unique($vouts));

            $vins = [];
            $txins = [];
            if (!empty($transaction['vin'])) {
                foreach ($transaction['vin'] as $item) {
                    if (!empty($item['txid'])) {
                        $address = GetAddressByVin($db, $item['txid'], $item['vout']);
                        if (empty($address)) {
                            continue;
                        }
                        $vins[] = $address;
                        $txins[] =  $item['txid'];
                    }
                }
                if (empty($vins)) { continue; }
                $vins = array_values(array_unique($vins));
                $txins = array_values(array_unique($txins));
            }

            $in_cluster = FindClusterWithAllAddresses($db, $vins);
            $out_clusters = [];
            foreach ($vouts as $vout) {
                $cluster = GetClusterByAddress($db, $vout);
                if (!empty($cluster)) {
                    $out_clusters[] = $cluster['_id'];
                }
            }
            if (!empty($out_clusters)) {
                $out_clusters = array_values(array_unique($out_clusters));
            }

            $clusters_transactions_collection->update(
                ['txid' => $transaction['txid']],
                [
                    '$set' => [
                        'vins' => $vins,
                        'txins' => $txins,
                        'vouts' => $vouts,
                        'cin' => av($in_cluster, '_id'),
                        'couts' => $out_clusters,
                    ],
                    '$setOnInsert' => ['block' => $i_last_block],
                ],
                ['upsert' => 1]
            );
        }
        $clusters_block_collection->update(['name' => 'transactions_last_block'], ['$set' => ['block' => $i_last_block]], ['upsert' => 1]);
        $i_last_block++;
    }
}