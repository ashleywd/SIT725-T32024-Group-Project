const jwt = require('jsonwebtoken');

const authMiddleware = (req, res, next) => {
    const token = req.headers.authorization;

    if (!token) {
        return res.status(401).json({ error: "Unauthorized: No token provided" });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        console.log("Decoded token:", decoded); // Debug: Check decoded token here
        req.userId = decoded.userId; // Ensure this line sets req.userId correctly
        next();
    } catch (err) {
        console.error("Token verification error:", err.message);
        return res.status(401).json({ error: "Unauthorized: Invalid token" });
    }
};

module.exports = authMiddleware;
