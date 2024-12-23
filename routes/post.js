const express = require("express");
const router = express.Router();
const postController = require("../controllers/postController");
const authMiddleware = require("../middleware/authMiddleware");

router.post("/", authMiddleware, postController.createPost);
router.get("/", authMiddleware, postController.getAllPosts);
router.get("/my-posts", authMiddleware, postController.getUserPosts);

module.exports = router;
