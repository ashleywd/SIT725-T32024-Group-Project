const express = require("express");
const router = express.Router();
const postController = require("../controllers/postController");
const authMiddleware = require("../middleware/authMiddleware");

router.post("/", authMiddleware, postController.createPost);
router.get("/", authMiddleware, postController.getAllPosts);
router.put("/:postId", authMiddleware, postController.editPost); 
router.get("/my-posts", authMiddleware, postController.getUserPosts);
router.put("/status/:postId", authMiddleware, postController.updatePostStatus);
router.delete("/:postId", authMiddleware, postController.deletePost);

module.exports = router;