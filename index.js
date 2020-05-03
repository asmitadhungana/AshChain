const bodyParser = require("body-parser");
const express = require("express");
const request = require("request");
const Blockchain = require("./blockchain");
const PubSub = require("./app/pubsub");

const app = express(); //make a local app object that's the result of calling this express fxn
const blockchain = new Blockchain(); //create a main blockchain for the app [local blockchain instance set to that result]
const pubsub = new PubSub({ blockchain });

const DEFAULT_PORT = 3000;
const ROOT_NODE_ADDRESS = `http://localhost:${DEFAULT_PORT}`;

app.use(bodyParser.json());

app.get("/api/blocks", (req, res) => {
  res.json(blockchain.chain); //this'll send back the blockchain.chain in its json form to whoever makes the /api/block request
});

app.post("/api/mine", (req, res) => {
  const { data } = req.body;

  blockchain.addBlock({ data }); //this'll add a new block w/ the data from the requestor

  pubsub.broadcastChain();

  res.redirect("/api/blocks"); //give the requestor confirmation that their req was successful by showing the new block added to the chain
});

//to sync the nodes in the ntk
const syncChains = () => {
  request(
    { url: `${ROOT_NODE_ADDRESS}/api/blocks` },
    (error, response, body) => {
      if (!error && response.statusCode === 200) {
        const rootChain = JSON.parse(body);

        console.log("replace chain on a sync with", rootChain);
        blockchain.replaceChain(rootChain);
      }
    }
  );
};

let PEER_PORT;

if (process.env.GENERATE_PEER_PORT === "true") {
  PEER_PORT = DEFAULT_PORT + Math.ceil(Math.random() * 1000); //generates a random value between 1 and 1000 for the  port
}

const PORT = PEER_PORT || DEFAULT_PORT; //if peer port isn't defined, set default port (3000)
app.listen(PORT, () => {
  console.log(`listening at localhost:${PORT}`);

  if (PORT !== DEFAULT_PORT) {
    //don't send the synchronization request to the root node itself
    syncChains();
  }
});
