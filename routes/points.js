const express = require("express");
const router = express.Router();
const pointsController = require("../controllers/pointsController");
const authMiddleware = require("../middleware/authMiddleware");

router.get("/", authMiddleware, pointsController.getPoints);
router.put("/", authMiddleware, pointsController.updatePoints);

module.exports = router;
