const express = require("express");
const router = express.Router();
const postController = require("../controllers/postController");
const authMiddleware = require("../middleware/authMiddleware");

router.post("/", authMiddleware, postController.createPost);
router.get("/", authMiddleware, postController.getAllPosts);
router.get('/my-posts', authMiddleware, postController.getUserPosts);

// Post interactions
router.post('/:postId/accept', authMiddleware, postController.acceptPost);
router.post('/:postId/offer-help', authMiddleware, postController.offerHelp);
router.post('/:postId/handle-offer', authMiddleware, postController.handleOffer);
router.post('/:postId/complete', authMiddleware, postController.completePost);

module.exports = router;
