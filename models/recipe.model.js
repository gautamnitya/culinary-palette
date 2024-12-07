const mongoose = require('mongoose');

// Define the schema for comments
const commentSchema = new mongoose.Schema({
    userId: {
        type: String,
        required: true,
    },
    content: {
        type: String,
        required: true,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
    deleted_at: {
        type: Date, // Stores the date and time when the comment is soft-deleted
        default: null,
    },
});

// Define the schema for recipes
const recipeSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
    },
    ingredients: {
        type: [String], // Array of strings
        required: true,
    },
    instructions: {
        type: String,
        required: true,
    },
    time: {
        type: String, // Time as a string, e.g., "10 min"
        required: true,
    },
    coverImage: {
        type: String, // Path or URL to the image
        required: true,
    },
    createdBy: {
        type: String, // User ID of the creator
        required: true,
    },
    likes: {
        type: Boolean, // Whether the recipe is liked
        default: false,
    },
    comments: {
        type: [commentSchema], // Array of comments
        default: [],
    },
    deleted_at: {
        type: Date, // Stores the date and time when the recipe is soft-deleted
        default: null,
    },
}, {
    timestamps: true, // Automatically adds `createdAt` and `updatedAt` fields
});

// Create the model
const Recipe = mongoose.model('Recipe', recipeSchema);

module.exports = Recipe;
