# Lightning Network Visualisation
This project is a visualisation of the Lightning Network, a second layer payment protocol that operates on top of a blockchain. The visualisation is created using the [D3.js](https://d3js.org/) library and the data is sourced from the [amboss.space](https://amboss.space/) API.

Data is fetched on the github pages build step with `fetch.sh` and me node's pubkey. currently is going 3 levels deep, but can be changed in the `fetch.sh` file.

## How to run
clone the repository
```bash
git clone https://github.com/dni/lightning-network-visualisation.git
```
install dependencies
```bash
npm i
```
fetch the data
```bash
cd src
sh fetch.sh [YOUR_NODE_PUBKEY]
cd ..
```
start webserver
```bash
npm start
```
