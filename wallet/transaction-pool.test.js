const TransactionPool = require("./transaction-pool");
const Transaction = require("./transaction");
const Wallet = require("./index");
const Blockchain = require("../blockchain");

describe("TransactionPool", () => {
  let transactionPool, transaction, senderWallet;

  beforeEach(() => {
    transactionPool = new TransactionPool();
    senderWallet = new Wallet();
    transaction = new Transaction({
      senderWallet,
      recipient: "a-fake-recipient",
      amount: 100,
    });
  });

  describe("setTransaction()", () => {
    it("adds a transaction", () => {
      transactionPool.setTransaction(transaction);

      expect(transactionPool.transactionMap[transaction.id]).toBe(transaction); //toBe() coz we want the transaction in the pool to be the exact transaction obect we're passing into the fxn
    });
  });

  describe("existingTransaction()", () => {
    it("returns an existing transaction given an input address", () => {
      transactionPool.setTransaction(transaction);

      expect(
        transactionPool.existingTransaction({
          inputAddress: senderWallet.publicKey,
        })
      ).toBe(transaction);
    });
  });

  describe("validTransactions()", () => {
    let validTransactions, errorMock;

    beforeEach(() => {
      validTransactions = []; //local arr of validTrnxns set to an empty arr
      errorMock = jest.fn();
      global.console.error = errorMock;

      for (let i = 0; i < 10; i++) {
        //on every iteration, we reset the trnxn to a new trxn
        transaction = new Transaction({
          senderWallet,
          recipient: "any-recipient",
          amount: 50,
        });

        //randomly messing around with some trnxns to make em invalid
        if (i % 3 === 0) {
          //if value is 3, 6, 9 or ... mess with these trnxns to make them invalid
          transaction.input.amount = 999999;
        } else if (i % 3 === 1) {
          //make the signature invalid
          transaction.input.signature = new Wallet().sign("foo"); //new sign gen from a valid wallet but not the matching sign for then trnxn
        } else {
          //unmessed-with trnxns are pushed to the validTrnxns
          validTransactions.push(transaction);
        }

        transactionPool.setTransaction(transaction); //set this trnxn within the pool so that it can exist when we call validTransactions on the trxn pool
      }
    });

    it("returns valid transactions", () => {
      expect(transactionPool.validTransactions()).toEqual(validTransactions);
    });

    it("logs errors for the invalid transactions", () => {
      transactionPool.validTransactions();
      expect(errorMock).toHaveBeenCalled();
    });
  });

  //to make sure that the trnsxn pool can be cleared
  describe("clear()", () => {
    it("clears the transactions", () => {
      transactionPool.clear();

      expect(transactionPool.transactionMap).toEqual({});
    });
  });

  //it should clear only those trnxns in the trnxn pool if they're included in a new accepted blockchain
  describe("clearBlockchainTransactions()", () => {
    it("clears the pool of any existing blockchain transactions", () => {
      const blockchain = new Blockchain(); //make a local BC
      const expectedTransactionMap = {}; //and this

      for (let i = 0; i < 6; i++) {
        //everytime we make a unique trnxn
        const transaction = new Wallet().createTransaction({
          recipient: "ash",
          amount: 10,
        });

        //and setting it to the pool
        transactionPool.setTransaction(transaction);

        //for half of the loop we're gonna add this block consisting of a data array to the local blockchain
        if (i % 2 === 0) {
          blockchain.addBlock({ data: [transaction] });
        } else {
          //for the other half, set these trnxns in the expected trnxn map
          expectedTransactionMap[transaction.id] = transaction;
        }
      }

      //call clearBlockchainTransactions()
      transactionPool.clearBlockchainTransactions({ chain: blockchain.chain });

      //the only trnxns that should remain in the pool even though we've set all the trnxns wihtin the pool itself,
      //should be the trnxns in the expectedTransationMap
      expect(transactionPool.transactionMap).toEqual(expectedTransactionMap);
    });
  });
});
