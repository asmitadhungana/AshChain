const cryptoHash = require("./crypto-hash");

describe("cryptoHash()", () => {
  it("generates a SHA-256 hashed output", () => {
    expect(cryptoHash("asmee")).toEqual(
      "5e2b803afad14d5c26946a21134e3765fb723c0002afdb004c41f7790f26fc9b"
    ); //hash was gen. using SHA-256 online generator for "asmee"
  });

  it("produces the same hash with the same input arguments inputted in any order", () => {
    expect(cryptoHash("one", "two", "three")).toEqual(
      cryptoHash("two", "three", "one")
    );
  });
});
