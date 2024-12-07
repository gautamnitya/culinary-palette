const express = require('express');//server side 
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const router = express.Router();
const authMiddleware = require('../../authMiddleware');
const User = require('../../models/user.model.js');
const Recipe = require('../../models/recipe.model.js');
const SECRET_KEY = process.env.SECRET_KEY;

// Register a new user
router.post('/register', async (req, res) => {
    const { email, password } = req.body;
    // Check if the user already exists
    const existingUser = await User.findOne({ email: email, deleted_at: null }); // Find user by email
    if (existingUser) {
        return res.status(400).json({ redirectToLogin: true });
    }
    // Hash the password before saving
    const hashedPassword = await bcrypt.hash(password, 10);

    //if user email exists but deleted_at is not null
    let savedUser = await User.findOneAndUpdate({ email: email },
        {
            $set:
            {
                deleted_at: null,
                password: hashedPassword
            }
        });
    if (!savedUser) {
        // Create new user with an empty likedRecipes array
        const newUser = new User({
            email: email,
            password: hashedPassword,
            likedRecipes: [],
            deleted_at: null
        });

        // Save the user to the database
        savedUser = await newUser.save();
    }
    if (savedUser && savedUser._id) {
        console.log('User stored successfully:', savedUser);
        res.status(201).json({ token: jwt.sign({ id: savedUser._id, email }, SECRET_KEY) });
    }
    else {
        return res.status(400).json({ error: "Registration Failed" });
    }
});

// Login a user
router.post('/login', async (req, res) => {
    const { email, password } = req.body;
    const user = await User.findOne({ email: email }); // Find user by email
    if (user) {
        const passwordMatch = await bcrypt.compare(password, user.password);  // Compare hashed password
        if (passwordMatch) {
            res.json({ token: jwt.sign({ id: user._id, email }, SECRET_KEY) });
        } else {
            res.status(401).json({ error: 'Invalid credentials' });
        }
    } else {
        res.status(401).json({ error: 'No User Found' });
    }
});

// Add recipe to user's likedRecipes and update likes in recipes.json
router.post('/like/:recipeId', authMiddleware, async (req, res) => {
    const user = await User.findByIdAndUpdate(
        req.user.id,
        { $addToSet: { likedRecipes: req.params.recipeId } }, // $addToSet prevents duplicates
        { new: true }
    );
    if (!user) {
        return res.status(400).json({ message: 'No user found' });
    }
    res.status(200).json({ message: 'Recipe liked successfully', likedRecipes: user.likedRecipes });
});


// Remove recipe from user's likedRecipes and update likes in recipes.json
router.delete('/unlike/:recipeId', authMiddleware, async (req, res) => {
    const user = await User.findByIdAndUpdate(
        req.user.id,
        { $pull: { likedRecipes: req.params.recipeId } }, // $pull removes specific item from array
        { new: true }
    );

    res.status(200).json({ message: 'Recipe unliked successfully', likedRecipes: user.likedRecipes });
});


// Route to get all liked recipes for the authenticated user
router.get('/liked', authMiddleware, async (req, res) => {
    // Populate liked recipes with full recipe details
    const user = await User.findById(req.user.id);
    if (!user) {
        return res.status(400).json({ message: 'No user found' });
    }
    const likedRecipes = await Recipe.find({
        _id: { $in: user.likedRecipes }
    });
    if (likedRecipes.length === 0) {
        return res.status(200).json({ message: 'No liked recipes found' });
    }
    res.status(200).json(likedRecipes);
});


module.exports = router;
