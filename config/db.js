const mongoose = require('mongoose');

const connectDB = async () => {
    const mongoURI = process.env.NODE_ENV === 'test' 
        ? process.env.MONGODB_URI_E2E 
        : process.env.MONGODB_URI || 'mongodb://localhost:27017/babyswap';

    try {
        await mongoose.connect(mongoURI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        console.log(`Connected to MongoDB successfully: ${mongoURI}`);
    } catch (err) {
        console.error('MongoDB connection error:', err);
        process.exit(1);
    }
};

module.exports = connectDB;