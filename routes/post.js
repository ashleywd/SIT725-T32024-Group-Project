const express = require("express");
const router = express.Router();
const postController = require("../controllers/postController");
const authMiddleware = require("../middleware/authMiddleware");

// Basic CRUD operations
router.post("/", authMiddleware, postController.createPost);
router.get("/", authMiddleware, postController.getAllPosts);
router.get('/my-posts', authMiddleware, postController.getUserPosts);
router.put('/:postId', authMiddleware, postController.editPost);

// Post status changes
router.post('/:postId/accept', authMiddleware, postController.acceptPost);
router.post('/:postId/cancel', authMiddleware, postController.cancelPost);
router.post('/:postId/complete', authMiddleware, postController.completePost);

// Offer handling
router.post('/:postId/offer-help', authMiddleware, postController.offerHelp);
router.post('/:postId/handle-offer', authMiddleware, postController.handleOffer);
router.post('/:postId/cancel-offer', authMiddleware, postController.cancelOffer);

// Acceptance handling
router.post('/:postId/cancel-acceptance', authMiddleware, postController.cancelAcceptance);

module.exports = router;