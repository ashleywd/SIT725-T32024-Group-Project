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
        enum: ['open', 'pending', 'accepted', 'rejected', 'completed'],
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
    offers: [{
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        message: String,
        status: {
            type: String,
            enum: ['pending', 'accepted', 'rejected'],
            default: 'pending'
        },
        createdAt: {
            type: Date,
            default: Date.now
        }
    }],
    acceptedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
    },
    responseMessage: String
}, {
    timestamps: true
});

module.exports = mongoose.model('Post', postSchema);