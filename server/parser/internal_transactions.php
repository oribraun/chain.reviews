<?php

function GetFirstTagFromCluster($db, $cluster) {
    if (!empty($cluster['tags'])) {
        return $cluster['tags'][0];
    }

    $uniq_tag = md5(strval($cluster['_id']) . time());
    $db->clusters->update(['_id' => $cluster['_id']], ['$addToSet' => ['tags' => $uniq_tag]]);

    return $uniq_tag;
}

function FindClusterWithAllAddresses($db, $addresses) {
    return $db->clusters->findOne(['addresses' => ['$all' => $addresses]]);
}

function InternalTransactions($db) {
    $transactions_collection = $db->txes;

    $clusters_internal_transactions_collection = $db->clusters_internal_transactions;
    $clusters_internal_transactions_collection->createIndex(['cluster_id' => 1]);

    $clusters_block_collection = $db->clusters_block;
    $clusters_last_block = $clusters_block_collection->findOne(['name' => 'last_block']);
    if (empty($clusters_last_block)) {
        return;
    }

    $last_block = $clusters_last_block['block'];


    $internal_last_block = $clusters_block_collection->findOne(['name' => 'internal_last_block']);
    $i_last_block = 0;
    if (!empty($internal_last_block)) {
        $i_last_block = $internal_last_block['block'] + 1;
    }

    while ($i_last_block < $last_block) {
        echo "Internal transaction parser {$i_last_block}/{$last_block}\n";

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
                if (empty($vins)) { continue; }
            }

            $addresses = array_values(array_unique(array_merge($vins, $vouts)));
            if (count($addresses) < 2) { continue; }

            $cluster = FindClusterWithAllAddresses($db, $addresses);
            if (empty($cluster)) {
                continue;
            }

            $clusters_internal_transactions_collection->insert([
                'txid' => $transaction['txid'],
                'cluster_id' => $cluster['_id'],
            ]);
        }
        $clusters_block_collection->update(['name' => 'internal_last_block'], ['$set' => ['block' => $i_last_block]], ['upsert' => 1]);
        $i_last_block++;
    }
}