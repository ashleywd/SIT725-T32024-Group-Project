const jwt = require("jsonwebtoken");

const SESSION_SECRET = process.env.SESSION_SECRET;

const verifyToken = (req, _, next) => {
  const isHandshake = req._query.sid === undefined;
  if (!isHandshake) {
    return next();
  }
  try {
    const token = req.headers["authorization"];
    const decoded = jwt.verify(token, SESSION_SECRET);
    req.userId = decoded.userId;
    next();
  } catch (error) {
    console.error(error);
  }
};

module.exports = verifyToken;
