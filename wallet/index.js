const { STARTING_BALANCE } = require("../config");
const { ec } = require("../util");
const cryptoHash = require("../util/crypto-hash");

class Wallet {
  constructor() {
    this.balance = STARTING_BALANCE;

    this.keyPair = ec.genKeyPair(); //use genKeyPair() mthd in EC to generate the public and private keyPair

    this.publicKey = this.keyPair.getPublic().encode("hex"); //since the generated keys are in the form of points in ellipse, encode('hex') converts it to it's hex form
  }

  sign(data) {
    return this.keyPair.sign(cryptoHash(data));
  }
}

module.exports = Wallet;
