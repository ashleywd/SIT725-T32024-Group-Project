const Post = require("../models/post");

const postController = {
  createPost: async (req, res) => {
    try {
      const io = req.app.get("io");
      const { type, hoursNeeded, description, dateTime } = req.body;

      const userId = req.userId;

      const selectedDate = new Date(dateTime);
      if (selectedDate < new Date()) {
        return res.status(400).json({
          message: "Cannot set date/time in the past",
        });
      }

      // Create and save the post
      const newPost = new Post({
        postedBy: userId,
        type,
        hoursNeeded,
        description,
        dateTime,
      });
      const savedPost = await newPost.save();

      // Notify other users
      io.emit("posts-updated");

      res.status(201).json(savedPost);
    } catch (error) {
      console.error("Error creating post:", error);
      res.status(500).json({
        message: "Error creating post",
        error: error.errors?.type?.message || error.message,
      });
    }
  },

  getAllPosts: async (req, res) => {
    try {
      const posts = await Post.find({
        postedBy: { $ne: req.userId }, // Exclude current user's posts
      }).populate({ path: "postedBy", select: "username" });
      res.status(200).json(posts);
    } catch (error) {
      res
        .status(500)
        .json({ message: "Error fetching posts", error: error.message });
    }
  },

  getPostById: async (req, res) => {
    try {
      const { postId } = req.params;
      const post = await Post.findById(postId);
      res.status(200).json(post);
    } catch (error) {
      console.error("Error fetching post by id:", error);
      res
        .status(500)
        .json({ message: "Error fetching post by id", error: error.message });
    }
  },

  getUserPosts: async (req, res) => {
    try {
      const posts = await Post.find({
        $or: [
          { postedBy: req.userId }, // Posts created by user
        ],
      })
        .populate({ path: "postedBy", select: "username" })
        .sort({ createdAt: -1 });

      res.status(200).json(posts);
    } catch (error) {
      console.error("Error fetching user posts:", error);
      res
        .status(500)
        .json({ message: "Error fetching user posts", error: error.message });
    }
  },

  editPost: async (req, res) => {
    try {
      const io = req.app.get("io");
      const { postId } = req.params;
      const { type, hoursNeeded, description, dateTime } = req.body;
      const userId = req.userId;

      // Validate date
      const selectedDate = new Date(dateTime);
      if (selectedDate < new Date()) {
        return res.status(400).json({
          message: "Cannot set date/time in the past",
        });
      }

      const updatedPost = await Post.findByIdAndUpdate(
        postId,
        { type, hoursNeeded, description, dateTime },
        { new: true }
      ).populate({ path: "postedBy", select: "username" });

      // Notify only the post creator about the edit
      io.to(updatedPost.postedBy.toString()).emit("notify-post-status-update", {
        updatedPost,
        type: "edit",
      });

      // Update everyone's dashboard view
      io.emit("posts-updated");

      res.status(200).json(updatedPost);
    } catch (error) {
      console.error("Error editing post:", error);
      res
        .status(500)
        .json({ message: "Error editing post", error: error.message });
    }
  },

  cancelPost: async (req, res) => {
    try {
      const io = req.app.get("io");
      const { postId } = req.params;

      const post = await Post.findOneAndUpdate(
        {
          _id: postId,
          postedBy: req.userId,
          status: { $nin: ["cancelled", "completed"] },
        },
        { status: "cancelled" },
        { new: true }
      );

      // Emit socket events for post creator
      io.to(req.userId.toString()).emit("notify-post-status-update", {
        updatedPost: post,
      });

      // Emit socket events for post acceptor if exists
      if (post.acceptedBy) {
        io.to(post.acceptedBy.toString()).emit("notify-post-status-update", {
          updatedPost: post,
          type: "cancel",
        });
      }

      // Update everyone's dashboard
      io.emit("posts-updated");

      res.status(200).json({
        message: "Post cancelled successfully",
        post,
      });
    } catch (error) {
      console.error("Error cancelling post:", error);
      res
        .status(500)
        .json({ message: "Error cancelling post", error: error.message });
    }
  },

  updatePostStatus: async (req, res) => {
    try {
      const { postId, postedBy, status } = req.body;
      const userId = req.userId;
      const post = await Post.findById(postId);

      // Update post status
      const io = req.app.get("io");
      const updatedPost = await Post.findByIdAndUpdate(
        postId,
        {
          status,
          acceptedBy: status === "accepted" ? userId : post.acceptedBy,
        },
        { new: true }
      );

      // Emit socket events
      io.to(post.postedBy.toString()).emit("notify-post-status-update", {
        updatedPost,
        type: status,
      });
      if (post.acceptedBy) {
        io.to(post.acceptedBy.toString()).emit("notify-post-status-update", {
          updatedPost,
          type: status,
        });
      }
      io.emit("posts-updated");

      res.status(201).json({ updatedPost });
    } catch (error) {
      console.error("Error updating post status:", error);
      res.status(500).json({ message: "Error updating post status", error });
    }
  },
};

module.exports = postController;
