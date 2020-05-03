const EC = require("elliptic").ec; //EC => elliptic cryptography [:168]

const ec = new EC("secp256k1");

module.exports = { ec };
