const express = require('express');//server side 
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const fs = require('fs');
const path = require('path');
const router = express.Router();
const authMiddleware = require('../authMiddleware');
const usersFilePath = path.join(__dirname, '../data/users.json');
const recipesFilePath = path.join(__dirname, '../data/recipes.json');

const SECRET_KEY = process.env.SECRET_KEY;


const readUsers = () => {
    try {
        const data = fs.readFileSync(usersFilePath, 'utf8');
        return JSON.parse(data || '[]');
    } catch (err) {
        console.error("Error reading users file:", err);
        return [];
    }
};
const readRecipes = () => {
    try {
        const data = fs.readFileSync(recipesFilePath, 'utf8');
        return JSON.parse(data || '[]');
    } catch (err) {
        console.error("Error reading recipes file:", err);
        return [];
    }
};

// Utility function to write user data
const writeUsers = (data) => {
    try {
        fs.writeFileSync(usersFilePath, JSON.stringify(data, null, 2));
    } catch (err) {
        console.error("Error writing to users file:", err);
    }
};

// Register a new user
router.post('/register', async (req, res) => {
    const { email, password } = req.body;

    const usersData = readUsers();

    // Check if the user already exists
    const existingUser = usersData.find(u => u.email === email);
    if (existingUser) {
        return res.status(400).json({ redirectToLogin: true });
    }

    // Hash the password before saving
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create new user with an empty likedRecipes array
    const newUser = { id: generateId(), email, password: hashedPassword, likedRecipes: [] };
    usersData.push(newUser);

    writeUsers(usersData);

    res.status(201).json({ token: jwt.sign({ id: newUser.id, email }, SECRET_KEY) });
});

// Login a user
router.post('/login', async (req, res) => {
    const { email, password } = req.body;

    const usersData = readUsers();

    const user = usersData.find(u => u.email === email);
    if (user) {
        const passwordMatch = await bcrypt.compare(password, user.password);  // Compare hashed password
        if (passwordMatch) {
            res.json({ token: jwt.sign({ id: user.id, email }, SECRET_KEY) });
        } else {
            res.status(401).json({ error: 'Invalid credentials' });
        }
    } else {
        res.status(401).json({ error: 'Invalid credentials' });
    }
});

// Add recipe to user's likedRecipes and update likes in recipes.json
router.post('/like/:recipeId', authMiddleware, (req, res) => {
    const { recipeId } = req.params;

    const usersData = readUsers();
    const recipesData = readRecipes();

    const user = usersData.find(u => u.id === req.user.id);
    const recipe = recipesData.find(r => r.id === recipeId);

    if (!user) {
        return res.status(404).json({ message: 'User not found' });
    }
    if (!recipe) {
        return res.status(404).json({ message: 'Recipe not found' });
    }

    // Add recipe to user's likedRecipes
    if (!user.likedRecipes.includes(recipeId)) {
        user.likedRecipes.push(recipeId);
        recipe.likes = true; // Update the likes field for the recipe
        writeUsers(usersData);
        fs.writeFileSync(recipesFilePath, JSON.stringify(recipesData, null, 2)); // Update recipes.json
    }

    res.status(200).json({ message: 'Recipe liked successfully', likedRecipes: user.likedRecipes });
});


// Remove recipe from user's likedRecipes and update likes in recipes.json
router.delete('/unlike/:recipeId', authMiddleware, (req, res) => {
    const { recipeId } = req.params;

    const usersData = readUsers();
    const recipesData = readRecipes();

    const user = usersData.find(u => u.id === req.user.id);
    const recipe = recipesData.find(r => r.id === recipeId);

    if (!user) {
        return res.status(404).json({ message: 'User not found' });
    }
    if (!recipe) {
        return res.status(404).json({ message: 'Recipe not found' });
    }

    // Remove recipe from user's likedRecipes
    user.likedRecipes = user.likedRecipes.filter(id => id !== recipeId);
    recipe.likes = false; // Update the likes field for the recipe
    writeUsers(usersData);
    fs.writeFileSync(recipesFilePath, JSON.stringify(recipesData, null, 2)); // Update recipes.json

    res.status(200).json({ message: 'Recipe unliked successfully', likedRecipes: user.likedRecipes });
});


// Route to get all liked recipes for the authenticated user
router.get('/liked', authMiddleware, (req, res) => {
    const recipes = readRecipes(); // Read all recipes
    const users = readUsers();    // Read all users

    // Find the logged-in user
    const user = users.find(u => u.id === req.user.id);

    if (!user) {
        return res.status(404).json({ message: 'User not found' });
    }

    // Filter recipes that the user has liked
    const likedRecipes = recipes.filter(recipe => user.likedRecipes.includes(recipe.id));

    if (likedRecipes.length === 0) {
        return res.status(200).json({ message: 'No liked recipes found' });
    }

    res.status(200).json(likedRecipes);
});

// Helper function to generate unique IDs
function generateId() {
    return '_' + Math.random().toString(36).substring(2, 9);
}

module.exports = router;
