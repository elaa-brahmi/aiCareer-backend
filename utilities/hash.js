const crypto = require("crypto");

function hashId(input) {
    return crypto.createHash("sha256").update(input).digest("hex").slice(0, 32);
  }
module.exports= {hashId}