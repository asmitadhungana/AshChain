const Wallet = require("./");
const Transaction = require("./transaction");
const { verifySignature } = require("../util");
const Blockchain = require("../blockchain");
const { STARTING_BALANCE } = require("../config");

describe("Wallet class", () => {
  let wallet;

  beforeEach(() => {
    wallet = new Wallet();
  });

  it("has a `balance`", () => {
    expect(wallet).toHaveProperty("balance");
  });

  it("has a `publicKey`", () => {
    // console.log(wallet.publicKey);
    expect(wallet).toHaveProperty("publicKey");
  });

  describe("signing data", () => {
    const data = "ashbar";

    it("verifies a signature", () => {
      expect(
        verifySignature({
          publicKey: wallet.publicKey,
          data,
          signature: wallet.sign(data),
        })
      ).toBe(true);
    });

    it("does not verify an invalid signature", () => {
      expect(
        verifySignature({
          publicKey: wallet.publicKey,
          data,
          signature: new Wallet().sign(data),
        })
      ).toBe(false);
    });
  });

  describe("createTransaction()", () => {
    describe("and the amount exceeds the wallet balance", () => {
      it("throws an error", () => {
        expect(() =>
          wallet.createTransaction({
            amount: 999999,
            recipient: "ash-recipient",
          })
        ).toThrow("Amount exceeds the wallet balance");
      });
    });

    describe("and the transaction amount is valid", () => {
      let transaction, amount, recipient;

      beforeEach(() => {
        amount = 100;
        recipient = "ash-recipient";
        transaction = wallet.createTransaction({ amount, recipient });
      });
      it("creates an instance of `Transaction`", () => {
        expect(transaction instanceof Transaction).toBe(true);
      });

      it("matches the transaction input with the wallet itself", () => {
        expect(transaction.input.address).toEqual(wallet.publicKey);
      });

      it("outputs the amount to the recipient", () => {
        expect(transaction.outputMap[recipient]).toEqual(amount);
      });
    });
  });

  describe("calculateBalance()", () => {
    //balance will be calculated based off summing all the transaction made by a wallet throughout the BC history
    let blockchain;

    beforeEach(() => {
      blockchain = new Blockchain();
    });

    //two cases to consider
    //case I: the wallet has made no trnxns
    describe("and there are no outputs for the wallet", () => {
      it("returns the `STARTING_BALANCE`", () => {
        expect(
          Wallet.calculateBalance({
            chain: blockchain.chain,
            address: wallet.publicKey,
          })
        ).toEqual(STARTING_BALANCE);
      });
    });

    //caseII : when trnxns have been made from the wallet
    describe("and there are outputs for the wallet", () => {
      //we make two trnxns and track how they affect our wallet balance
      let transactionOne, transactionTwo;

      beforeEach(() => {
        transactionOne = new Wallet().createTransaction({
          recipient: wallet.publicKey,
          amount: 50,
        });

        transactionTwo = new Wallet().createTransaction({
          recipient: wallet.publicKey,
          amount: 60,
        });

        //record these trnxns in the BC history
        blockchain.addBlock({ data: [transactionOne, transactionTwo] });
      });

      it("adds the sum of all outputs from the transactions to the wallet balance", () => {
        expect(
          Wallet.calculateBalance({
            chain: blockchain.chain,
            address: wallet.publicKey,
          })
        ).toEqual(
          STARTING_BALANCE +
            transactionOne.outputMap[wallet.publicKey] +
            transactionTwo.outputMap[wallet.publicKey]
        );
      });
    });
  });
});
