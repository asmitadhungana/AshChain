const Block = require("./block");
const Transaction = require("../wallet/transaction");
const Wallet = require("../wallet");
const { cryptoHash } = require("../util");
const { REWARD_INPUT, MINING_REWARD } = require("../config");

class Blockchain {
  constructor() {
    this.chain = [Block.genesis()];
  }

  addBlock({ data }) {
    const newBlock = Block.mineBlock({
      lastBlock: this.chain[this.chain.length - 1],
      data,
    });

    this.chain.push(newBlock);
  }

  replaceChain(chain, validateTransactions, onSuccess) {
    //don't replace the chain
    if (chain.length <= this.chain.length) {
      console.error("The incoming new chain must be longer!");
      return;
    }

    //don't replace the chain
    if (!Blockchain.isValidChain(chain)) {
      console.error("The incoming chain must be valid!");
      return;
    }

    //don't replace the chain
    if (validateTransactions && !this.validTransactionData({ chain })) {
      console.error("The incoming chain has invalid data");
      return;
    }

    if (onSuccess) onSuccess();
    console.log("replacing the chain with", chain);
    this.chain = chain;
  }

  static isValidChain(chain) {
    if (JSON.stringify(chain[0]) !== JSON.stringify(Block.genesis())) {
      return false;
    }

    for (let i = 1; i < chain.length; i++) {
      const block = chain[i];

      const actualLastHash = chain[i - 1].hash;

      const lastDifficulty = chain[i - 1].difficulty;

      const { timestamp, lastHash, hash, nonce, difficulty, data } = block;

      if (lastHash !== actualLastHash) return false;

      const validatedHash = cryptoHash(
        timestamp,
        lastHash,
        data,
        nonce,
        difficulty
      ); //regenerating the hashes to compare | cryptoHash is a node module we've imported and set in "crypto-hash.js"

      if (hash !== validatedHash) return false;

      if (Math.abs(lastDifficulty - difficulty > 1)) return false; //to prevent difficulty jumps from going too high or too low [which can be made by hackers]
    }
    return true;
  }

  validTransactionData({ chain }) {
    //skip the genesis block, index=0
    for (let i = 1; i < chain.length; i++) {
      const block = chain[i];
      const transactionSet = new Set(); //Set() in js makes a collection of unique items
      let rewardTransactionCount = 0;

      for (let transaction of block.data) {
        //if the trnxn we're looking at is a reward trnxn
        if (transaction.input.address === REWARD_INPUT.address) {
          rewardTransactionCount += 1;

          //there should be only one reward trnxn per block
          if (rewardTransactionCount > 1) {
            console.error(
              "Miner rewards exceed limit[1 reward transaction per data]"
            );
            return false;
          }

          //we don't necessarily know the miner wallet's public key, but we can iterate through the outputMaps in the trnxn and since there should be only one value specified for the reward trnxn
          //get the first value and check if it's equal to the mining_reward const value
          if (Object.values(transaction.outputMap)[0] !== MINING_REWARD) {
            console.error("Miner reward amount is invalid");
            return false;
          }
        }
        //if the transaction is not a reward transaction [for regular transactions]
        else {
          //check if it is valid
          if (!Transaction.validTransaction(transaction)) {
            console.error("Invalid transaction");
            return false;
          }

          //the block's input amt should be valid according to the blockchain history
          const trueBalance = Wallet.calculateBalance({
            chain: this.chain,
            address: transaction.input.address,
          });

          //when the attacker is trying to fake his/her balance
          if (transaction.input.amount !== trueBalance) {
            console.error("Invalid input amount");
            return false;
          }

          //there cannot be multiple identical transactions in the same block
          if (transactionSet.has(transaction)) {
            //if the block already contains the transaction being passed
            console.error(
              "An identical transaction appears more than once in the block"
            );
            return false;
          } else {
            //if not add the trnxn to the trnxn Set
            transactionSet.add(transaction);
          }
        }
      }
    }

    return true;
  }
}

module.exports = Blockchain;
