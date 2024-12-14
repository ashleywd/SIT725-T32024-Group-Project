// models/post.js
const mongoose = require('mongoose');

const postSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    type: {
        type: String,
        enum: ['offer', 'request'],
        required: true
    },
    status: {
        type: String,
        enum: ['open', 'accepted', 'completed'],
        default: 'open'
    },
    description: {
        type: String,
        required: true
    },
    dateTime: {
        type: Date,
        required: true
    },
    hoursNeeded: {
        type: Number,
        required: true,
        min: 1
    },
    acceptedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Post', postSchema);