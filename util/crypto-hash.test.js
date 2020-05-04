const cryptoHash = require("./crypto-hash");

describe("cryptoHash()", () => {
  it("generates a SHA-256 hashed output", () => {
    expect(cryptoHash("ash")).toEqual(
      "15e105b2bf800a41d47f7310503b6975cc960457c3ebddd8d66954f2d1f5b970"
    ); //hash was gen. using SHA-256 online generator for "ash" and lowercasing it[including the double quotes since our stringified version of input is hashed now]
  });

  it("produces the same hash with the same input arguments inputted in any order", () => {
    expect(cryptoHash("one", "two", "three")).toEqual(
      cryptoHash("two", "three", "one")
    );
  });

  it("produces a unique hash when the properties have changed on an input", () => {
    //make sure that the hash is unique for any object that has new properties
    //as js treats different references to the same obj as same and generates the same hash for changed instances too
    const ash = {};
    const originalHash = cryptoHash(ash);
    ash["a"] = "a"; //now if we pass in ash to the cryptohash fxn, it should not be equal to the original hash

    expect(cryptoHash(ash)).not.toEqual(originalHash);
  });
});
