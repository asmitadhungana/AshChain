const Transaction = require("./transaction");

class TransactionPool {
  constructor() {
    this.transactionMap = {}; //maps a trnxn id to a trnxn object
  }

  setTransaction(transaction) {
    this.transactionMap[transaction.id] = transaction;
  }

  setMap(transactionMap) {
    this.transactionMap = transactionMap;
  }

  existingTransaction({ inputAddress }) {
    //get an arr of all the transactions in the map
    const transactions = Object.values(this.transactionMap);

    //return the first item in the arr that matches the incoming input address given to the fxn
    return transactions.find(
      (transaction) => transaction.input.address === inputAddress
    );
  }

  validTransactions() {
    //make use of the existing static validTransactions() mthd in the Transaction class imported above
    //get an array of all the trnxns currently in the map
    return Object.values(this.transactionMap).filter((transaction) =>
      Transaction.validTransaction(transaction)
    ); //this fxn will return false if a trnxn has been tampered with
  }
}

module.exports = TransactionPool;
