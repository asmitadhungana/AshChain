//We'll store hardcoded and global values in this file
const MINE_RATE = 1000; //1000 milliseconds = 1 sec
const INITIAL_DIFFICULTY = 3;

const GENESIS_DATA = {
  timestamp: 1,
  lastHash: "____",
  hash: "hash-one",
  difficulty: INITIAL_DIFFICULTY,
  nonce: 0,
  data: [],
};

const STARTING_BALANCE = 1000;

const REWARD_INPUT = {
  address: "$authorized-reward$",
};

const MINING_REWARD = 25;

module.exports = {
  GENESIS_DATA,
  MINE_RATE,
  STARTING_BALANCE,
  REWARD_INPUT,
  MINING_REWARD,
};
