require('dotenv').config();

const express = require('express');
const mongoose = require('mongoose');
// const cors = require('cors');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
// app.use(cors());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

const recipeRoutes = require('./routes/api/recipe');
const userRoutes = require('./routes/api/user');

app.use('/api/recipes', recipeRoutes);
app.use('/api/users', userRoutes);
app.use('/images', express.static(path.join(__dirname, 'images')));

connectDB().then(() => {
    console.log("connected to db");
    app.listen(PORT, () => {
        console.log(`Server is running on http://localhost:${PORT}`);
    });
}).catch(err => console.log(err));

async function connectDB() {
    await mongoose.connect('mongodb://127.0.0.1:27017/Culinary');
    // use `await mongoose.connect('mongodb://user:password@127.0.0.1:27017/Culinary');` if your database has auth enabled
}


