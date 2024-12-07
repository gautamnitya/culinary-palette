const express = require('express');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const multer = require('multer');
const sharp = require('sharp');
const authMiddleware = require('../authMiddleware');
const router = express.Router();

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, path.join(__dirname, '../images'));
    },
    filename: (req, file, cb) => {
        const uniqueFilename = `${uuidv4()}-${file.originalname}`;
        cb(null, uniqueFilename);
    }
});

const upload = multer({ storage });

const recipesFilePath = path.join(__dirname, '../data/recipes.json');
const usersFilePath = path.join(__dirname, '../data/users.json');


const readRecipes = () => {
    try {
        const data = fs.readFileSync(recipesFilePath, 'utf8');
        return data ? JSON.parse(data) : [];
    } catch (err) {
        console.error("Error reading file:", err);
        return [];
    }
};

const writeRecipes = (data) => {
    try {
        fs.writeFileSync(recipesFilePath, JSON.stringify(data, null, 2));
    } catch (err) {
        console.error("Error writing file:", err);
    }
};

// Get all recipes
router.get('/', (req, res) => {
    const recipes = readRecipes();
    res.status(200).json(recipes);
});

// Get a recipe by ID
router.get('/:id', (req, res) => {
    const recipes = readRecipes();
    const recipe = recipes.find(r => r.id === req.params.id);
    if (!recipe) {
        return res.status(404).json({ message: "Recipe not found" });
    }
    res.status(200).json(recipe);
});

// Add a new recipe
router.post('/', authMiddleware, upload.single('coverImage'), async (req, res) => {
    const { title, ingredients, instructions, time } = req.body;

    if (!title || !ingredients || !instructions) {
        return res.status(400).json({ message: "Required fields can't be empty" });
    }

    let coverImagePath = null;
    if (req.file) {
        const uniqueFilename = `${uuidv4()}-${req.file.originalname}`;
        const outputFilePath = path.join(__dirname, '../images', uniqueFilename);

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

    const recipes = readRecipes();
    const newRecipe = {
        id: uuidv4(),
        title,
        ingredients: ingredients.split(','),
        instructions,
        time,
        coverImage: coverImagePath,
        createdBy: req.user ? req.user.id : null,
        likes: false,
        comments: [] // Add an empty comments array
    };

    recipes.push(newRecipe);
    writeRecipes(recipes);

    res.status(201).json(newRecipe);
});

// Delete a recipe by ID
router.delete('/:id', authMiddleware, (req, res) => {
    const recipes = readRecipes();
    const filteredRecipes = recipes.filter(r => r.id !== req.params.id);

    if (recipes.length === filteredRecipes.length) {
        return res.status(404).json({ message: "Recipe not found" });
    }

    writeRecipes(filteredRecipes);
    res.status(200).json({ message: "Recipe deleted successfully" });
});

// Add a comment to a recipe
router.post('/:id/comments', authMiddleware, (req, res) => {
    const recipes = readRecipes();
    const recipe = recipes.find(r => r.id === req.params.id);

    if (!recipe) {
        return res.status(404).json({ message: "Recipe not found" });
    }

    const { content } = req.body;
    if (!content) {
        return res.status(400).json({ message: "Comment content is required" });
    }

    const newComment = {
        id: uuidv4(),
        userId: req.user.email,
        content,
        createdAt: new Date().toISOString()
    };

    recipe.comments.push(newComment);
    writeRecipes(recipes);

    res.status(201).json(newComment);
});

// Get all comments for a recipe
router.get('/:id/comments', (req, res) => {
    const recipes = readRecipes();
    const recipe = recipes.find(r => r.id === req.params.id);

    if (!recipe) {
        return res.status(404).json({ message: "Recipe not found" });
    }

    res.status(200).json(recipe.comments);
});

module.exports = router;
