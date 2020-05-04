const crypto = require("crypto"); //node module [has createHash() fxn]

const cryptoHash = (...inputs) => {
  const hash = crypto.createHash("sha256"); //we want sha256

  hash.update(
    inputs
      .map((input) => JSON.stringify(input))
      .sort()
      .join(" ")
  ); //mapping into the inputs and turning all the inner items to their stringified forms
  //by stringifying all the inputs, we'll make sure that if an object's property has changed, the stringified form will represent those changes

  return hash.digest("hex"); //digest=[a term in cryptography to represent the result of the hash] | in hex form
};

module.exports = cryptoHash;
