const jwt = require("jsonwebtoken");
const User = require("../models/user");
const config = require("../config/config");
const secretKey = config.JWT_SECRET;

const auth = async (req, res, next) => {
  try {
    const token = req.header("Authorization")?.replace("Bearer ", "");

    if (!token) {
      return res.status(401).json({ message: "Authentication token missing" });
    }

    let decodedData;

    const isCustomAuth = token.length < 500;

    if (isCustomAuth) decodedData = jwt.verify(token, secretKey);
    else decodedData = jwt.decode(token);

    req.user = await User.findOne({ where: { id: decodedData?.id } });

    if (!req.user) {
      return res.status(401).json({ message: "Please authenticate again" });
    }
    req.userLoggedIn = req.user;

    next();
  } catch (error) {
    console.error(error);

    if (error.name === "TokenExpiredError") {
      return res.status(401).json({ message: "Token has expired" });
    }

    return res.status(401).json({ message: "Invalid token" });
  }
};

module.exports = auth;
