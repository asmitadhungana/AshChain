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

    //when a chain is passed to the method
    describe("and a chain is passed to the mthd", () => {
      //we expect this fxn to be called
      it("calls `Wallet.calculateBalance`", () => {
        const calculateBalanceMock = jest.fn();

        const originalCalculateBalance = Wallet.calculateBalance; //save whatever the W.cB mthd is currently set to

        Wallet.calculateBalance = calculateBalanceMock;

        wallet.createTransaction({
          recipient: "ash",
          amount: 20,
          chain: new Blockchain().chain,
        });

        expect(calculateBalanceMock).toHaveBeenCalled();

        //restore W.cB() mthd to its original cB() fxn once we're done with this test
        Wallet.calculateBalance = originalCalculateBalance;
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

      describe("and the wallet has made a transaction", () => {
        let recentTransaction;

        beforeEach(() => {
          recentTransaction = wallet.createTransaction({
            recipient: "ash-address",
            amount: 15,
          });

          //add the recent trnxn to the BC as data arr within the block
          blockchain.addBlock({ data: [recentTransaction] });
        });

        it("returns the output amount of the recent transaction", () => {
          expect(
            Wallet.calculateBalance({
              chain: blockchain.chain,
              address: wallet.publicKey,
            })
          ).toEqual(recentTransaction.outputMap[wallet.publicKey]);
        });

        describe("and there are outputs next to and after the recent transaction", () => {
          //2 kinds of trnxns to consider : made in the same block and made in the next block
          let sameBlockTransaction, nextBlockTransaction;

          //set up a scenario for both the kinds
          beforeEach(() => {
            recentTransaction = wallet.createTransaction({
              recipient: "later-ash-address",
              amount: 30,
            }); //wallet should create a trnxn that's recent

            //trnxn to minerWallet happens in the same block
            sameBlockTransaction = Transaction.rewardTransaction({
              minerWallet: wallet,
            });

            //add a block consisting of both the recent and sameBlock trnxns
            blockchain.addBlock({
              data: [recentTransaction, sameBlockTransaction],
            });

            //afterwards it's receiving another trnxn in a subsequent block
            nextBlockTransaction = new Wallet().createTransaction({
              recipient: wallet.publicKey,
              amount: 35,
            }); //add this outputTotal gotten from receiving from this trnxn

            //add a block consisting of this trnxn
            blockchain.addBlock({ data: [nextBlockTransaction] });
          });

          it("includes the output amounts in the returned balance", () => {
            expect(
              Wallet.calculateBalance({
                chain: blockchain.chain,
                address: wallet.publicKey,
              })
            ).toEqual(
              recentTransaction.outputMap[wallet.publicKey] +
                sameBlockTransaction.outputMap[wallet.publicKey] +
                nextBlockTransaction.outputMap[wallet.publicKey]
            ); //overall blnc for this wallet should be the addn of all of its receiving values in all of these trnxns
          });
        });
      });
    });
  });
});
