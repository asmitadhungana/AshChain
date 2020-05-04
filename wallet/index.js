const Transaction = require("./transaction");
const { STARTING_BALANCE } = require("../config");
const { ec, cryptoHash } = require("../util");

class Wallet {
  constructor() {
    this.balance = STARTING_BALANCE;

    this.keyPair = ec.genKeyPair(); //use genKeyPair() mthd in EC to generate the public and private keyPair

    this.publicKey = this.keyPair.getPublic().encode("hex"); //since the generated keys are in the form of points in ellipse, encode('hex') converts it to it's hex form
  }

  sign(data) {
    return this.keyPair.sign(cryptoHash(data));
  }

  createTransaction({ recipient, amount }) {
    if (amount > this.balance) {
      throw new Error("Amount exceeds the wallet balance");
    }

    return new Transaction({ senderWallet: this, recipient, amount });
  }
}

module.exports = Wallet;
