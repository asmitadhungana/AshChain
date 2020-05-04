class TransactionPool {
  constructor() {
    this.transactionMap = {}; //maps a trnxn id to a trnxn object
  }

  setTransaction(transaction) {
    this.transactionMap[transaction.id] = transaction;
  }
}

module.exports = TransactionPool;
