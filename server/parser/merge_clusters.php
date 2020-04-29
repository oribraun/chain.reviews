<?php

include_once "common.php";

function MergeClusters($db)
{
    $clusters_collection = $db->clusters;
    $clusters_internal_transactions_collection = $db->clusters_internal_transactions;

    while (($clusters_to_merge_count = $clusters_collection->count(['update' => true])) > 0) {
        echo "Merge clusters - {$clusters_to_merge_count} left\n";

        $cluster_to_update = $clusters_collection->findOne(['update' => true]);
        if (empty($cluster_to_update)) {
            continue;
        }

        $clusters = [];
        $offset = 0;
        do {
            $addresses = array_slice($cluster_to_update['addresses'], $offset, 100);
            $clusters_cursor = $clusters_collection->find(['addresses' => ['$in' => $addresses]]);
            foreach ($clusters_cursor as $item) {
                $clusters[strval($item['_id'])] = $item;
            }
            $offset += count($addresses);
        } while ($offset < count($cluster_to_update['addresses']));

        unset($clusters[strval($cluster_to_update['_id'])]);

        if (count($clusters) > 0) {
            $tags = [];
            $addresses = [];

            foreach ($clusters as $cluster) {
                foreach ($cluster['addresses'] as $address) {
                    $addresses[] = $address;
                }
                if (!empty($cluster['tags'])) {
                    foreach ($cluster['tags'] as $tag) {
                        $tags[] = $tag;
                    }
                }
            }

            $tags = array_values(array_unique($tags));
            $addresses = array_values(array_diff(array_unique($addresses), $cluster_to_update['addresses']));

            if (!empty($tags)) {
                $clusters_collection->update(['_id' => $cluster_to_update['_id']], [
                    '$addToSet' => [
                        'tags' => ['$each' => $tags]
                    ]
                ]);
            }
            if (!empty($addresses)) {
                $clusters_collection->update(['_id' => $cluster_to_update['_id']], [
                    '$addToSet' => [
                        'addresses' => ['$each' => $addresses]
                    ]
                ]);
            }

            foreach ($clusters as $cluster) {
                $clusters_internal_transactions_collection->update([
                    'cluster_id' => $cluster['_id']
                ], [
                    '$set' => [
                        'cluster_id' => $cluster_to_update['_id']
                    ]
                ], [
                    'multiple' => true
                ]);
                $clusters_collection->remove(['_id' => $cluster['_id']]);
            }
        }

        $clusters_collection->update(['_id' => $cluster_to_update['_id']], ['$set' => ['update' => false]]);
    }
}