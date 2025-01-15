const express = require("express");
const router = express.Router();
const postController = require("../controllers/notificationController");
const authMiddleware = require("../middleware/authMiddleware");

router.post("/", authMiddleware, postController.createNotification);
router.get("/", authMiddleware, postController.getNotifications);
router.put("/", authMiddleware, postController.updateNotificationStatus);
router.delete("/:notificationId", authMiddleware, postController.deleteNotification);

module.exports = router;
