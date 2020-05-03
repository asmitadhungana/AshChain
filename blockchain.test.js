const Blockchain = require("./blockchain");
const Block = require("./block");
const cryptoHash = require("./crypto-hash");

describe("Blockchain", () => {
  let blockchain, newChain, originalChain;

  beforeEach(() => {
    blockchain = new Blockchain();
    newChain = new Blockchain();

    originalChain = blockchain.chain;
  });

  it("contains a `chain` Array instance", () => {
    expect(blockchain.chain instanceof Array).toBe(true);
  });

  it("starts with the genesis block", () => {
    expect(blockchain.chain[0]).toEqual(Block.genesis());
  });

  it("adds a new block to the chain", () => {
    const newData = "asmee bar";
    blockchain.addBlock({ data: newData });

    expect(blockchain.chain[blockchain.chain.length - 1].data).toEqual(newData); //lastelement in chain
  });

  describe("isValidChain()", () => {
    describe("when the chain does not start with the genesis block", () => {
      it("returns false", () => {
        blockchain.chain[0] = { data: "fake-genesis-block" };

        expect(Blockchain.isValidChain(blockchain.chain)).toBe(false);
      });
    });

    describe("when the chain starts with the genesis block and the chain has multiple blocks", () => {
      beforeEach(() => {
        blockchain.addBlock({ data: "Apple" });
        blockchain.addBlock({ data: "Ball" });
        blockchain.addBlock({ data: "Cat" });
      });

      describe("and a lastHash reference has changed", () => {
        it("returns false", () => {
          blockchain.chain[2].lastHash = "broken-lastHash";

          expect(Blockchain.isValidChain(blockchain.chain)).toBe(false);
        });
      });

      describe("and the chain contains a block with an invalid field", () => {
        it("returns false", () => {
          blockchain.chain[2].data = "altered-data";

          expect(Blockchain.isValidChain(blockchain.chain)).toBe(false);
        });
      });

      describe("and the chain contains a block with a jumped difficulty", () => {
        it("returns false", () => {
          const lastBlock = blockchain.chain[blockchain.chain.length - 1];
          const lastHash = lastBlock.hash;
          const timestamp = Date.now();
          const nonce = 0;
          const data = [];

          const difficulty = lastBlock.difficulty - 3; //setting the difficulty to be a jumped value(since lowering or increasing is in range of 1)

          const hash = cryptoHash(timestamp, lastHash, nonce, difficulty, data); //generating a hash with the jumped difficulty

          const badBlock = new Block({
            timestamp,
            lastHash,
            hash,
            nonce,
            difficulty,
            data,
          }); //finally make a bad block with these instances

          blockchain.chain.push(badBlock); //push this badBlock to the blockchain

          expect(Blockchain.isValidChain(blockchain.chain)).toBe(false); //the result should be false[the chain should come off a s invalid]
        });
      });

      describe("and the chain does not contain any invalid blocks", () => {
        it("returns true", () => {
          expect(Blockchain.isValidChain(blockchain.chain)).toBe(true);
        });
      });
    });
  });

  describe("replaceChain()", () => {
    //to silence the console output in tests
    let errorMock, logMock;

    beforeEach(() => {
      errorMock = jest.fn();
      logMock = jest.fn(); //this fxn of jest allows us to create temporary methods for tests
      //to keep track of wheather or not certain mthds were called during the execn of some code

      global.console.error = errorMock; //replacing the global console.error mthd with jest fxn
      global.console.log = logMock; //similar
    });
    describe("when the new chain is not longer", () => {
      beforeEach(() => {
        newChain.chain[0] = { new: "chain" };

        blockchain.replaceChain(newChain.chain);
      });

      it("does not replace the chain", () => {
        expect(blockchain.chain).toEqual(originalChain);
      });

      it("logs an error", () => {
        expect(errorMock).toHaveBeenCalled(); //checks if the errorMock fxn that we set was fired
      });
    });

    describe("when the new chain is longer", () => {
      beforeEach(() => {
        newChain.addBlock({ data: "Apple" });
        newChain.addBlock({ data: "Ball" });
        newChain.addBlock({ data: "Cat" });
      });
      describe("and the chain is invalid ", () => {
        beforeEach(() => {
          newChain.chain[2].hash = "some-fake-hash";

          blockchain.replaceChain(newChain.chain);
        });
        it("does not replace the chain", () => {
          expect(blockchain.chain).toEqual(originalChain);
        });

        it("logs an error", () => {
          expect(errorMock).toHaveBeenCalled(); //checks if the errorMock fxn that we set was fired
        });
      });

      describe("and the chain is valid ", () => {
        beforeEach(() => {
          blockchain.replaceChain(newChain.chain);
        });

        it("does replace the chain", () => {
          expect(blockchain.chain).toEqual(newChain.chain);
        });

        it("logs about the chain replacement", () => {
          expect(logMock).toHaveBeenCalled();
        });
      });
    });
  });
});
