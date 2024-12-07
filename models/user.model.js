const mongoose = require('mongoose');

// Define the schema
const userSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        unique: true,
        match: /.+\@.+\..+/ // Basic email format validation
    },
    password: {
        type: String,
        required: true,
    },
    likedRecipes: {
        type: [String], // Array of strings (e.g., recipe IDs)
        default: [],
    },
    deleted_at: {
        type: Date, // Stores the date and time the document was soft-deleted
        default: null,
    },
}, {
    timestamps: true, // Automatically adds `createdAt` and `updatedAt` fields
});

// Create the model
const User = mongoose.model('User', userSchema);

module.exports = User;
