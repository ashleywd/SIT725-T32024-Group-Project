const express = require("express");
const router = express.Router();
const postController = require("../controllers/postController");
const authMiddleware = require("../middleware/authMiddleware");

router.post("/", authMiddleware, postController.createPost);
router.get("/", authMiddleware, postController.getAllPosts);
router.get("/my-posts", authMiddleware, postController.getUserPosts);
router.get("/:postId", authMiddleware, postController.getPostById);
router.put("/:postId", authMiddleware, postController.editPost);
router.put("/status/:postId", authMiddleware, postController.updatePostStatus);
router.put("/cancel/:postId", authMiddleware, postController.cancelPost);

module.exports = router;
