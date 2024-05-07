#!/bin/sh
fetch(){
    query='query GetNodeChannelCapacities($pubkey: String!) { getNodeChannelCapacities(pubkey: $pubkey) { peer_pubkey decoded_channel_id capacity block_age node_info { channels { num_channels total_capacity } node { alias color } } } }'
    params='{"query":"'$query'","variables":{"pubkey":"'$1'"}}'
    curl -s -X POST \
        -H "Content-Type: application/json" \
        -d "$params" https://api.amboss.space/graphql \
        | jq .data.getNodeChannelCapacities \
        | jq  --arg pubkey $1 '.[] += {"pubkey": $pubkey}'
}
fetch_level(){
    pubkeys=$1
    level=$2
    for pubkey in $pubkeys; do
        echo "level $level: fetching $pubkey"
        fetch $pubkey > data/data_$pubkey.json
    done
}

echo "[]" > data.json

echo "level 0: fetching $1"
fetch $1 > data/data_$1.json
cat data/data_$1.json | jq -r '.[].peer_pubkey' > pubkeys_1
rm pubkeys_2
for pubkey in $(uniq -u pubkeys_1); do
    if [ -f data/data_$pubkey.json ]; then
        echo "level 1: skipping $pubkey"
    else
        echo "level 1: fetching $pubkey"
        fetch $pubkey > data/data_$pubkey.json
    fi
    cat data/data_$pubkey.json | jq -r '.[].peer_pubkey' >> pubkeys_2
done

echo "total count level 2: $(uniq -u pubkeys_2 | wc -l)"

# for pubkey in $(uniq -u pubkeys_2); do
#     if [ -f data/data_$pubkey.json ]; then
#         echo "level 2: skipping $pubkey"
#     else
#         echo "level 2: fetching $pubkey"
#         fetch $pubkey > data/data_$pubkey.json
#     fi
# done


jq -s 'map(.[])' data/data_*.json > data.json


echo '{
    "date": "'$(date +%s)'",
    "levels": [
        {
            "level": 0,
            "pubkeys": ["'$1'"]
        },
        {
            "level": 1,
            "pubkeys": '$pubkeys_1'
        },
        {
            "level": 2,
            "pubkeys": '$pubkeys_2'
        }
    ]
}' > config.json
