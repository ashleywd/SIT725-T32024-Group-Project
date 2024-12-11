// controllers/postController.js
const Post = require('../models/post');

const postController = {
    // Create a new post
    createPost: async (req, res) => {
        try {
            const { userId, type, hoursNeeded, description, dateTime } = req.body;
            
            const newPost = new Post({
                userId,
                type,
                hoursNeeded,
                description,
                dateTime
            });

            const savedPost = await newPost.save();
            res.status(201).json(savedPost);
            
        } catch (error) {
            console.error('Error creating post:', error);
            res.status(500).json({ message: 'Error creating post', error: error.message });
        }
    },

    // Get all posts
    getAllPosts: async (req, res) => {
        try {
            const posts = await Post.find();
            res.status(200).json(posts);
        } catch (error) {
            res.status(500).json({ message: 'Error fetching posts', error: error.message });
        }
    }
};

module.exports = postController;