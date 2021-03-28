<?php

function Reindex($db) {
    $clusters_block_collection = $db->clusters_block;
    $reindex_block = $clusters_block_collection->findOne(['name' => 'reindex_block']);

    $block = av($reindex_block, 'block');
    if (empty($block)) { return; }

    $db->clusters_transactions->remove(['block' => ['$gte' => $block]]);
    $db->clusters_internal_transactions->remove(['block' => ['$gte' => $block]]);

    $addresses = $db->clusters_addresses->find(['first_seen' => ['$gte' => $block]]);

    var_dump($block);
    $addresses_to_remove = [];
    foreach ($addresses as $address) {
        $addresses_to_remove[] = $address['address'];
    }

    $offset = 0;
    do {
        $addresses = array_slice($addresses_to_remove, $offset, 100);

        $db->clusters->update([
            'addresses' => ['$in' => $addresses],
            'changed' => true
        ], [
            '$pullAll' => ['addresses' => $addresses]
        ], [
            'multiple' => true
        ]);

        $offset += count($addresses);
    } while ($offset < count($addresses_to_remove));

    $db->clusters->remove(['addresses' => ['$size' => 0]]);
    $db->clusters_addresses->remove(['first_seen' => ['$gte' => $block]]);

    $clusters_block_collection->update([
        'name' => ['$exists' => true]
    ], [
        '$set' => ['block' => max($block - 1, 0)]
    ], [
        'multiple' => true
    ]);
    $clusters_block_collection->remove(['name' => 'reindex_block']);
}
