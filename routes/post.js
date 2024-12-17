const express = require("express");
const router = express.Router();
const postController = require("../controllers/postController");
const authMiddleware = require("../middleware/authMiddleware");
const Post = require("../models/post");

router.post("/", authMiddleware, postController.createPost);
router.get("/", authMiddleware, postController.getAllPosts);

router.get("/posts", postController.getAllPosts);

module.exports = router;
