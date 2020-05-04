class TransactionPool {
  constructor() {
    this.transactionMap = {}; //maps a trnxn id to a trnxn object
  }

  setTransaction(transaction) {
    this.transactionMap[transaction.id] = transaction;
  }

  existingTransaction({ inputAddress }) {
    //get an arr of all the transactions in the map
    const transactions = Object.values(this.transactionMap);

    //return the first item in the arr that matches the incoming input address given to the fxn
    return transactions.find(
      (transaction) => transaction.input.address === inputAddress
    );
  }
}

module.exports = TransactionPool;
