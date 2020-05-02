const crypto = require("crypto"); //node module [has createHash() fxn]

const cryptoHash = (...inputs) => {
  const hash = crypto.createHash("sha256"); //we want sha256

  hash.update(inputs.sort().join(" "));

  return hash.digest("hex"); //digest=[a term in cryptography to represent the result of the hash] | in hex form
};

module.exports = cryptoHash;
