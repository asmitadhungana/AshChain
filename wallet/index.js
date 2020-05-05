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

  createTransaction({ recipient, amount, chain }) {
    //as long a the chain is passed this.balance will be based on the BC history of that wallet
    if (chain) {
      this.balance = Wallet.calculateBalance({
        chain,
        address: this.publicKey,
      });
    }

    if (amount > this.balance) {
      throw new Error("Amount exceeds the wallet balance");
    }

    return new Transaction({ senderWallet: this, recipient, amount });
  }

  //calculate wallet's balance
  static calculateBalance({ chain, address }) {
    let hasConductedTransaction = false;
    let outputsTotal = 0; //overall outputs total

    //go through every block in the chain
    for (let i = chain.length - 1; i > 0; i--) {
      const block = chain[i];

      //look at every transactions made in the block
      for (let transaction of block.data) {
        if (transaction.input.address === address) {
          hasConductedTransaction = true;
        }

        const addressOutput = transaction.outputMap[address];

        //if the address has received a tranasaction within the output trnxn map
        if (addressOutput) {
          //add that to the outputsTotal
          outputsTotal = outputsTotal + addressOutput;
        }
      }

      if (hasConductedTransaction) {
        break;
      }
    }

    return hasConductedTransaction
      ? outputsTotal
      : STARTING_BALANCE + outputsTotal;
  }
}

module.exports = Wallet;
