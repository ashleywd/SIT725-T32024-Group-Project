const User = require("../models/user");
const Post = require("../models/post");
const Notification = require("../models/notification");
const pointsController = require("./pointsController");

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

      if (type === "request") {
        const hasEnoughPoints = await pointsController.checkPoints(
          userId,
          hoursNeeded
        );
        if (!hasEnoughPoints) {
          return res.status(400).json({
            message: "You do not have enough points to create this request.",
          });
        }
        // Single point deduction
        await pointsController.updatePoints(userId, -hoursNeeded);
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
        error: error.message,
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

      // Get original post
      const originalPost = await Post.findById(postId);

      if (type === "request") {
        const pointDifference = hoursNeeded - originalPost.hoursNeeded;
        if (pointDifference > 0) {
          const hasEnoughPoints = await pointsController.checkPoints(
            userId,
            pointDifference
          );
          if (!hasEnoughPoints) {
            return res.status(400).json({
              message: "You do not have enough points to update this request.",
            });
          }
          // Deduct additional points
          await pointsController.updatePoints(userId, -pointDifference);
        } else if (pointDifference < 0) {
          // Refund points if hoursNeeded is reduced
          await pointsController.updatePoints(userId, -pointDifference);
        }
      }

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

      // Refund points if it's a request post
      if (post.type === "request") {
        await pointsController.updatePoints(req.userId, post.hoursNeeded);
      }

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

      if (!post) {
        return res
          .status(404)
          .json({ message: "Post not found", error: "Post not found" });
      }

      // Award points when post is completed
      if (status === "completed") {
        if (post.type === "offer") {
          // For offer posts: award points to the post owner (who did the babysitting)
          await pointsController.updatePoints(post.postedBy, post.hoursNeeded);
        } else if (post.type === "request") {
          // For request posts: award points to the acceptedBy user (who did the babysitting)
          await pointsController.updatePoints(
            post.acceptedBy,
            post.hoursNeeded
          );
        }
      }

      const io = req.app.get("io");
      const updatedPost = await Post.findByIdAndUpdate(
        postId,
        {
          status,
          acceptedBy: status === "accepted" ? userId : post.acceptedBy,
        },
        { new: true }
      );

      const notifyUser = status === "accepted" ? postedBy._id : post.acceptedBy;

      let notificationMessage;
      if (status === "accepted") {
        if (post.type === "offer") {
          notificationMessage = `Your babysitting offer for ${new Date(
            post.dateTime
          ).toLocaleString()} has been accepted.`;
        } else {
          notificationMessage = `Your request for a babysitter on ${new Date(
            post.dateTime
          ).toLocaleString()} has been accepted.`;
        }
      } else if (status === "completed") {
        if (post.type === "offer") {
          notificationMessage = `Your babysitting offer for ${new Date(
            post.dateTime
          ).toLocaleString()} has been marked as completed. ${
            post.hoursNeeded
          } points have been credited to your account.`;
        } else {
          notificationMessage = `The babysitting session you provided on ${new Date(
            post.dateTime
          ).toLocaleString()} has been marked as completed. ${
            post.hoursNeeded
          } points have been credited to your account.`;
        }
      }

      const newNotification = new Notification({
        userId: notifyUser,
        message: notificationMessage,
        isGlobal: false,
      });
      await newNotification.save();

      io.to(notifyUser.toString()).emit("notify-post-status-update", {
        updatedPost,
      });
      io.emit("posts-updated");

      res.status(201).json({ updatedPost });
    } catch (error) {
      console.error("Error updating post status:", error);
      res.status(500).json({ message: "Error updating post status", error });
    }
  },
};

module.exports = postController;
