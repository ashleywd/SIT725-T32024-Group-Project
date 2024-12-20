const jwt = require("jsonwebtoken");
const SESSION_SECRET = process.env.SESSION_SECRET;

const verifyToken = (req, res, next) => {
  try {
      const authHeader = req.header("Authorization");
      
      if (!authHeader) {
          return res.status(401).json({ error: "Access denied - No auth header" });
      }

      const token = authHeader.split(' ')[1];
      
      if (!token) {
          return res.status(401).json({ error: "Access denied - No token" });
      }

      const decoded = jwt.verify(token, SESSION_SECRET);
      
      req.userId = decoded.userId;
      next();
  } catch (error) {
      console.error('Token verification error:', error);
      res.status(401).json({ error: "Invalid token" });
  }
};

module.exports = verifyToken;