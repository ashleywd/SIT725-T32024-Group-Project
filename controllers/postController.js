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
                status: 'open',
                createdAt: new Date()
            });

            const savedPost = await newPost.save();
            const populatedPost = await Post.findById(savedPost._id)
                .populate("userId", "username");
            
            res.status(201).json(populatedPost);
        } catch (error) {
            console.error("Error creating post:", error);
            res.status(500).json({ message: "Error creating post", error: error.message });
        }
    },

    editPost: async (req, res) => {
      try {
          const { type, hoursNeeded, description, dateTime } = req.body;
          const post = await Post.findById(req.params.postId);
          
          if (!post) {
              return res.status(404).json({ message: "Post not found" });
          }

          const postUserIdStr = post.userId.toString();
          const reqUserIdStr = req.userId.toString();
          
          if (postUserIdStr !== reqUserIdStr) {
              return res.status(403).json({ 
                  message: "Not authorized to edit this post",
                  debug: {
                      postUserId: postUserIdStr,
                      requestUserId: reqUserIdStr
                  }
              });
          }
          
          if (post.status !== 'open') {
              return res.status(400).json({ message: "Can only edit posts that are still open" });
          }
  
          // Update post fields
          const updateFields = { type, hoursNeeded, description, dateTime };
  
          const updatedPost = await Post.findByIdAndUpdate(
              req.params.postId,
              updateFields,
              { 
                  new: true,
                  runValidators: true 
              }
          ).populate("userId", "username");
          
          res.status(200).json(updatedPost);
      } catch (error) {
          console.error("Error editing post:", error);
          res.status(500).json({ message: "Error editing post", error: error.message });
      }
    },

    getAllPosts: async (req, res) => {
      try {
          const posts = await Post.find()
              .populate("userId", "username")
              .populate("acceptedBy", "username")
              .populate("offers.userId", "username")
              .sort({ createdAt: -1 });
          
          // Filter offers based on ownership
          const filteredPosts = posts.map(post => {
              const postObject = post.toObject();
              
              // If it's the user's own post, keep all offers
              if (postObject.userId._id.toString() === req.userId) {
                  return postObject;
              }
              
              // For others' posts, only show the user's own offers
              postObject.offers = postObject.offers.filter(
                  offer => offer.userId._id.toString() === req.userId
              );
              
              return postObject;
          });
          
          res.status(200).json(filteredPosts);
      } catch (error) {
          console.error("Error in getAllPosts:", error);
          res.status(500).json({ message: "Error fetching posts" });
      }
    }, 

    getUserPosts: async (req, res) => {
      try {
          
          const posts = await Post.find({
              $or: [
                  { userId: req.userId },              // Posts created by user
                  { acceptedBy: req.userId },          // Posts accepted by user
                  { "offers.userId": req.userId }      // Posts user has offered on
              ]
          })
              .populate("userId", "username")
              .populate("acceptedBy", "username")
              .populate("offers.userId", "username")
              .sort({ createdAt: -1 });
  
          res.status(200).json(posts);
      } catch (error) {
          console.error("Error fetching user posts:", error);
          res.status(500).json({ message: "Error fetching user posts", error: error.message });
      }
  },

    offerHelp: async (req, res) => {
        try {
            const post = await Post.findById(req.params.postId)
                .populate("userId", "username");
            
            if (!post) {
                return res.status(404).json({ message: "Post not found" });
            }
            
            if (post.userId._id.toString() === req.userId) {
                return res.status(400).json({ message: "Cannot offer help on your own post" });
            }
            
            if (post.status !== 'open') {
                return res.status(400).json({ message: "This post is no longer available" });
            }

            // Check if user has already made an offer
            if (post.offers.some(offer => offer.userId.toString() === req.userId)) {
                return res.status(400).json({ message: "You have already made an offer on this post" });
            }

            post.offers.push({
                userId: req.userId,
                message: req.body.message,
                status: 'pending',
                createdAt: new Date()
            });
            await post.save();
            
            const populatedPost = await Post.findById(post._id)
                .populate("userId", "username")
                .populate("offers.userId", "username");
            
            res.status(200).json(populatedPost);
        } catch (error) {
            res.status(500).json({ message: "Error offering help", error: error.message });
        }
    },

    handleOffer: async (req, res) => {
      try {
          const { postId } = req.params;
          const { offerId, action } = req.body;
          
          const post = await Post.findById(postId)
              .populate("offers.userId", "username");
          
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
              // Update the accepted offer
              offer.status = 'accepted';
              offer.respondedAt = new Date();
              
              // Update post status
              post.status = 'active';
              post.acceptedBy = offer.userId;
              post.acceptedAt = new Date();
              
              // Reject all other offers
              post.offers.forEach(o => {
                  if (o._id.toString() !== offerId) {
                      o.status = 'rejected';
                      o.respondedAt = new Date();
                  }
              });
          } else if (action === 'reject') {
              offer.status = 'rejected';
              offer.respondedAt = new Date();
          }

          await post.save();
          
          const populatedPost = await Post.findById(post._id)
              .populate("userId", "username")
              .populate("acceptedBy", "username")
              .populate("offers.userId", "username");
          
          res.status(200).json(populatedPost);
      } catch (error) {
          res.status(500).json({ message: "Error handling offer" });
      }
    },

    cancelPost: async (req, res) => {
      try {
          const post = await Post.findById(req.params.postId);
          
          if (!post) {
              return res.status(404).json({ message: "Post not found" });
          }
          
          if (post.userId.toString() !== req.userId) {
              return res.status(403).json({ message: "Not authorized to cancel this post" });
          }
          
          if (post.status === 'completed') {
              return res.status(400).json({ message: "Cannot cancel a completed post" });
          }
  
          post.status = 'cancelled';
          await post.save();
          
          const populatedPost = await Post.findById(post._id)
              .populate("userId", "username")
              .populate("acceptedBy", "username")
              .populate("offers.userId", "username");
  
          res.status(200).json(populatedPost);
      } catch (error) {
          console.error("Error cancelling post:", error);
          res.status(500).json({ message: "Error cancelling post", error: error.message });
      }
    },

    acceptPost: async (req, res) => {
      try {
          const post = await Post.findById(req.params.postId)
              .populate("userId", "username");
          
          if (!post) {
              return res.status(404).json({ message: "Post not found" });
          }
          
          if (post.userId._id.toString() === req.userId) {
              return res.status(400).json({ message: "Cannot accept your own post" });
          }
          
          if (post.status !== 'open') {
              return res.status(400).json({ message: "This post is no longer available" });
          }
          
          post.status = 'active';
          post.acceptedBy = req.userId;
          post.responseMessage = req.body.message;
          await post.save();
          
          const populatedPost = await Post.findById(post._id)
              .populate("userId", "username")
              .populate("acceptedBy", "username");
          
          res.status(200).json(populatedPost);
      } catch (error) {
          res.status(500).json({ message: "Error accepting post", error: error.message });
      }
    },

    cancelOffer: async (req, res) => {
      try {
          const post = await Post.findById(req.params.postId);
          
          if (!post) {
              return res.status(404).json({ message: "Post not found" });
          }
          
          // Find and remove the offer entirely
          post.offers = post.offers.filter(offer => 
              offer.userId.toString() !== req.userId
          );
          
          // If no more offers, ensure post is open
          if (post.offers.length === 0 && post.status !== 'active') {
              post.status = 'open';
          }
          
          await post.save();
  
          const populatedPost = await Post.findById(post._id)
              .populate("userId", "username")
              .populate("acceptedBy", "username")
              .populate("offers.userId", "username");
  
          res.status(200).json(populatedPost);
      } catch (error) {
          console.error("Error cancelling offer:", error);
          res.status(500).json({ message: "Error cancelling offer", error: error.message });
      }
    },

    cancelAcceptance: async (req, res) => {
        try {
            const post = await Post.findById(req.params.postId)
                .populate("userId", "username");
            
            if (!post) {
                return res.status(404).json({ message: "Post not found" });
            }
            
            if (post.acceptedBy?.toString() !== req.userId) {
                return res.status(403).json({ message: "Not authorized to cancel this acceptance" });
            }
            
            if (post.status !== 'active') {
                return res.status(400).json({ message: "Post is not currently active" });
            }

            post.status = 'open';
            post.acceptedBy = null;
            post.responseMessage = null;

            // Update the related offer status
            const offer = post.offers.find(o => o.userId.toString() === req.userId);
            if (offer) {
                offer.status = 'cancelled';
            }

            await post.save();
            
            const populatedPost = await Post.findById(post._id)
                .populate("userId", "username")
                .populate("acceptedBy", "username")
                .populate("offers.userId", "username");

            res.status(200).json(populatedPost);
        } catch (error) {
            res.status(500).json({ message: "Error cancelling acceptance", error: error.message });
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
          
          if (post.status !== 'active') {
              return res.status(400).json({ message: "Post must be active before being completed" });
          }
          
          post.status = 'completed';
          post.completedAt = new Date();

          // Update the accepted offer status
          const acceptedOffer = post.offers?.find(o => o.status === 'accepted');
          if (acceptedOffer) {
              acceptedOffer.status = 'completed';
          }

          await post.save();
          
          const populatedPost = await Post.findById(post._id)
              .populate("userId", "username")
              .populate("acceptedBy", "username")
              .populate("offers.userId", "username");
          
          res.status(200).json(populatedPost);
      } catch (error) {
          console.error("Error completing post:", error);
          res.status(500).json({ message: "Error completing post", error: error.message });
      }
  }
};

module.exports = postController;