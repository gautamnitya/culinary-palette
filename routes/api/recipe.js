const express = require('express');
const { v4: uuidv4 } = require('uuid');
const path = require('path');
const multer = require('multer');
const sharp = require('sharp');
const authMiddleware = require('../../authMiddleware');
const router = express.Router();
const Recipe = require('../../models/recipe.model.js');
const User = require('../../models/user.model.js');

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, path.join(__dirname, '../../images'));
    },
    filename: (req, file, cb) => {
        const uniqueFilename = `${uuidv4()}-${file.originalname}`;
        cb(null, uniqueFilename);
    }
});
const upload = multer({ storage });

// Get all recipes
router.get('/', async (req, res) => {
    const recipes = await Recipe.find({ deleted_at: null }); // Retrieves all recipes
    console.log('Recipes:', recipes);
    res.status(200).json(recipes);
});

// Get a recipe by ID
router.get('/:id', async (req, res) => {
    const recipeId = (req.params.id != undefined || req.params.id != null) ? req.params.id : 0;
    const recipe = await Recipe.findOne({ _id: recipeId }); // Find recipe by _id
    if (!recipe) {
        return res.status(404).json({ message: "Recipe not found" });
    }
    res.status(200).json(recipe);
});

// Add a new recipe
router.post('/', authMiddleware, upload.single('coverImage'), async (req, res) => {
    const { title, ingredients, instructions, time } = req.body;
    console.log(`adding new recipe: ${title}, ${ingredients}, ${instructions}, ${time}`);

    if (!title || !ingredients || !instructions) {
        return res.status(400).json({ message: "Required fields can't be empty" });
    }

    let coverImagePath = null;
    if (req.file) {
        const uniqueFilename = `${uuidv4()}-${req.file.originalname}`;
        const outputFilePath = path.join(__dirname, '../../images', uniqueFilename);

        try {
            await sharp(req.file.path)
                .resize({ width: 200, height: 200 })
                .toFile(outputFilePath);

            coverImagePath = `/images/${uniqueFilename}`;
        } catch (err) {
            console.error("Error processing image:", err);
            return res.status(500).json({ message: "Error processing image" });
        }
    }

    // Create a new recipe instance
    const newRecipe = new Recipe({
        title: title,
        ingredients: ingredients.split(','),
        instructions: instructions,
        time: time,
        coverImage: coverImagePath,
        createdBy: req.user ? req.user.id : null, // User ID of the recipe creator
        likes: false, // Default to `false` if not provided
        comments: [], // Default to an empty array if not provided
        deleted_at: null
    });

    // Save the recipe to the database
    const savedRecipe = await newRecipe.save();
    if (savedRecipe && savedRecipe._id) {
        console.log('Recipe stored successfully:', savedRecipe);
        res.status(201).json(newRecipe);
    }
    else {
        return res.status(400).json({ error: "Failed to add recipe" });
    }
});

// Delete a recipe by ID

router.delete('/:id', authMiddleware, async (req, res) => {
    const updateRecipe = await Recipe.findOneAndUpdate({ _id: req.params.id },
        {
            $set:
            {
                deleted_at: new Date()
            }
        });

    console.log(updateRecipe);
    if (!updateRecipe) {
        return res.status(404).json({ message: "Recipe not found" });
    }
    else {
        res.status(200).json({ message: "Recipe deleted successfully" });
    }
});

// Add a comment to a recipe
router.post('/:id/comments', authMiddleware, async (req, res) => {
    const { content } = req.body;
    if (!content) {
        return res.status(400).json({ message: "Comment content is required" });
    }

    const newComment = {
        userId: req.user.email,
        content,
        createdAt: new Date()
    };

    // Find the recipe and add the comment
    const recipe = await Recipe.findByIdAndUpdate(
        req.params.id,
        {
            $push: {
                comments: newComment
            }
        },
        { new: true } // Return the updated document
    );
    if (recipe && recipe._id) {
        res.status(201).json(newComment);
    }
    else {
        return res.status(404).json({ message: "something went wrong while adding comment" });
    }
});

// Get all comments for a recipe
router.get('/:id/comments', async (req, res) => {
    const recipe = await Recipe.findOne({ _id: req.params.id }); // Retrieves recipe
    if (!recipe) {
        return res.status(404).json({ message: "Recipe not found" });
    }
    res.status(200).json({ comments: recipe.comments });
});

module.exports = router;
