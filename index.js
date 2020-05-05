const bodyParser = require("body-parser");
const express = require("express");
const request = require("request");
const path = require("path"); //frontend
const Blockchain = require("./blockchain");
const PubSub = require("./app/pubsub");
const TransactionPool = require("./wallet/transaction-pool");
const Wallet = require("./wallet");
const TransactionMiner = require("./app/transaction-miner");

const app = express(); //make a local app object that's the result of calling this express fxn
const blockchain = new Blockchain(); //create a main blockchain for the app [local blockchain instance set to that result]
const transactionPool = new TransactionPool();
const wallet = new Wallet();
const pubsub = new PubSub({ blockchain, transactionPool, wallet });
const transactionMiner = new TransactionMiner({
  blockchain,
  transactionPool,
  wallet,
  pubsub,
});

const DEFAULT_PORT = 3000;
const ROOT_NODE_ADDRESS = `http://localhost:${DEFAULT_PORT}`;

app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, "client/dist"))); //middleware that allows us to serve the static files from a directory [frontend]

app.get("/api/blocks", (req, res) => {
  res.json(blockchain.chain); //this'll send back the blockchain.chain in its json form to whoever makes the /api/block request
});

app.post("/api/mine", (req, res) => {
  const { data } = req.body;

  blockchain.addBlock({ data }); //this'll add a new block w/ the data from the requestor

  pubsub.broadcastChain();

  res.redirect("/api/blocks"); //give the requestor confirmation that their req was successful by showing the new block added to the chain
});

//create transactions
app.post("/api/transact", (req, res) => {
  const { amount, recipient } = req.body;

  let transaction = transactionPool.existingTransaction({
    inputAddress: wallet.publicKey,
  });

  try {
    //if transaction already exists call update
    if (transaction) {
      transaction.update({ senderWallet: wallet, recipient, amount });
    } else {
      //create a new trnxn
      transaction = wallet.createTransaction({
        recipient,
        amount,
        chain: blockchain.chain,
      });
    }
  } catch (error) {
    return res.status(400).json({ type: "error", message: error.message }); //return will make sure that the rest of the code in the mthd will not apply | status code (400) stands for 'A BAD REQUEST'
  }

  transactionPool.setTransaction(transaction);

  pubsub.broadcastTransaction(transaction);

  res.json({ type: "success", transaction });
});

app.get("/api/transaction-pool-map", (req, res) => {
  res.json(transactionPool.transactionMap);
});

app.get("/api/mine-transactions", (req, res) => {
  transactionMiner.mineTransactions();

  res.redirect("/api/blocks");
});

app.get("/api/wallet-info", (req, res) => {
  const address = wallet.publicKey;

  res.json({
    address,
    balance: Wallet.calculateBalance({ chain: blockchain.chain, address }),
  });
});

//for serving up the document
//* means "any" endpoint | the backend will serve the frontend appn when it receives a request at any endpoint
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "client/dist/index.html"));
}); //dist is the build dir parcel-bundler will create for us

//to sync the nodes in the ntk
const syncWithRootState = () => {
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

  //syncing transaction-pool-map
  request(
    { url: `${ROOT_NODE_ADDRESS}/api/transaction-pool-map` },
    (error, response, body) => {
      if (!error && response.statusCode === 200) {
        const rootTransactionPoolMap = JSON.parse(body); //200: suceess

        console.log(
          "replace transaction pool map on a sync with",
          rootTransactionPoolMap
        );
        transactionPool.setMap(rootTransactionPoolMap);
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
    syncWithRootState();
  }
});
