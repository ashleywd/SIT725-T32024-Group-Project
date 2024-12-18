const Post = require("../models/post");

const postController = {
  createPost: async (req, res) => {
    try {
      const { type, hoursNeeded, description, dateTime } = req.body;
      const userId = req.userId;

      const newPost = new Post({
        userId,
        type,
        hoursNeeded,
        description,
        dateTime,
      });

      const savedPost = await newPost.save();
      res.status(201).json(savedPost);
    } catch (error) {
      console.error("Error creating post:", error);
      res.status(500).json({ message: "Error creating post", error: error.message });
    }
  },

  getAllPosts: async (req, res) => {
    try {
      const posts = await Post.find({ 
        userId: { $ne: req.userId } 
      })
        .populate("userId", "username")
        .sort({ createdAt: -1 });
      
      console.log("Posts found:", posts);
      res.status(200).json(posts);
    } catch (error) {
      console.error("Error in getAllPosts:", error);
      res.status(500).json({ message: "Error fetching posts", error: error.message });
    }
  },

  getUserPosts: async (req, res) => {
    try {
      const posts = await Post.find({ userId: req.userId });
      res.status(200).json(posts);
    } catch (error) {
      res.status(500).json({ message: "Error fetching user posts", error: error.message });
    }
  },
  
  acceptPost: async (req, res) => {
    try {
      const post = await Post.findById(req.params.postId);
      
      if (!post) {
        return res.status(404).json({ message: "Post not found" });
      }
      
      if (post.userId.toString() === req.userId) {
        return res.status(400).json({ message: "Cannot accept your own post" });
      }
      
      if (post.status !== 'open') {
        return res.status(400).json({ message: "This post is no longer available" });
      }
      
      post.status = 'accepted';
      post.acceptedBy = req.userId;
      post.responseMessage = req.body.message;
      await post.save();
      
      res.status(200).json(post);
    } catch (error) {
      res.status(500).json({ message: "Error accepting post", error: error.message });
    }
  },

  offerHelp: async (req, res) => {
    try {
      const post = await Post.findById(req.params.postId);
      
      if (!post) {
        return res.status(404).json({ message: "Post not found" });
      }
      
      if (post.userId.toString() === req.userId) {
        return res.status(400).json({ message: "Cannot offer help on your own post" });
      }
      
      if (post.status !== 'open') {
        return res.status(400).json({ message: "This post is no longer available" });
      }

      post.offers.push({
        userId: req.userId,
        message: req.body.message
      });
      post.status = 'pending';
      await post.save();
      
      res.status(200).json(post);
    } catch (error) {
      res.status(500).json({ message: "Error offering help", error: error.message });
    }
  },

  handleOffer: async (req, res) => {
    try {
      const { postId } = req.params;
      const { offerId, action } = req.body;
      
      const post = await Post.findById(postId);
      
      if (!post) {
        return res.status(404).json({ message: "Post not found" });
      }
      
      if (post.userId.toString() !== req.userId) {
        return res.status(403).json({ message: "Not authorized to handle offers on this post" });
      }

      const offer = post.offers.id(offerId);
      if (!offer) {
        return res.status(404).json({ message: "Offer not found" });
      }

      if (action === 'accept') {
        offer.status = 'accepted';
        post.status = 'accepted';
        post.acceptedBy = offer.userId;
        // Set all other offers to rejected
        post.offers.forEach(o => {
          if (o._id.toString() !== offerId) {
            o.status = 'rejected';
          }
        });
      } else if (action === 'reject') {
        offer.status = 'rejected';
        // If all offers are rejected, set post back to open
        if (post.offers.every(o => o.status === 'rejected')) {
          post.status = 'open';
        }
      }

      await post.save();
      res.status(200).json(post);
    } catch (error) {
      res.status(500).json({ message: "Error handling offer", error: error.message });
    }
  },

  completePost: async (req, res) => {
    try {
      const post = await Post.findById(req.params.postId);
      
      if (!post) {
        return res.status(404).json({ message: "Post not found" });
      }
      
      if (post.userId.toString() !== req.userId) {
        return res.status(403).json({ message: "Not authorized to complete this post" });
      }
      
      if (post.status !== 'accepted') {
        return res.status(400).json({ message: "Post must be accepted before being completed" });
      }
      
      post.status = 'completed';
      await post.save();
      
      res.status(200).json(post);
    } catch (error) {
      res.status(500).json({ message: "Error completing post", error: error.message });
    }
  }
};

module.exports = postController;