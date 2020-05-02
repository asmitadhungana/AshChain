const { GENESIS_DATA, MINE_RATE } = require("./config");
const cryptoHash = require("./crypto-hash");

class Block {
  constructor({ timestamp, lastHash, hash, data, nonce, difficulty }) {
    this.timestamp = timestamp;
    this.lastHash = lastHash;
    this.hash = hash;
    this.data = data;
    this.nonce = nonce;
    this.difficulty = difficulty;
  }

  static genesis() {
    return new this(GENESIS_DATA);
  }

  static mineBlock({ lastBlock, data }) {
    let hash, timestamp;
    //const timestamp = Date.now();
    const lastHash = lastBlock.hash;
    const { difficulty } = lastBlock; //retrieving difficulty from the last block
    let nonce = 0; //nonce should be able to adjust while we're going through the mining block algorithm

    //do trials to find correct nonce until a certain difficulty criteria is met
    do {
      nonce++;
      timestamp = Date.now();
      hash = cryptoHash(timestamp, lastHash, data, nonce, difficulty);
    } while (hash.substring(0, difficulty) !== "0".repeat(difficulty));

    return new this({
      timestamp,
      lastHash,
      data,
      difficulty,
      nonce,
      hash,
    });
  }

  static adjustDifficulty({ originalBlock, timestamp }) {
    const { difficulty } = originalBlock;

    const difference = timestamp - originalBlock.timestamp; //diff btn the newBlock's timestamp and the originalBlock's(last) timestamp

    if (difference > MINE_RATE) return difficulty - 1;

    return difficulty + 1;
  }
}

module.exports = Block;
