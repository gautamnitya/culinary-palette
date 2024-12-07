document.addEventListener("DOMContentLoaded", function () {
    const recipesContainer = document.getElementById('recipes');
    const userNav = document.getElementById('userNav');
    const token = localStorage.getItem('token');
    const userEmail = localStorage.getItem('userEmail');
    const searchInput = document.getElementById("searchInput");
    const searchForm = document.getElementById("searchForm");
    const searchResultsContainer = document.getElementById("searchResults");
    // Update the navbar based on the login status
    if (userNav) {
        if (token && userEmail) {
            const emailInitials = userEmail.split('@')[0].charAt(0).toUpperCase();

            userNav.innerHTML = `
                <a href="search.html">
                <img src="search-icon.png" alt="Search" id="searchIcon" />
                </a>
                <a href="liked.html">❤️</a>
                <a href="profile.html" class="circle-initials">${emailInitials}</a>
                <button id="logoutButton" class="nbutton">Logout</button>
            `;
            // Add logout functionality
            document.getElementById('logoutButton').addEventListener('click', function () {
                localStorage.removeItem('token');
                localStorage.removeItem('userEmail');
                window.location.href = 'login.html';
            });
        } else {
            userNav.innerHTML = `
                <a href="login.html" class="nbutton"><button>Login</button></a>
                <a href="register.html" class="nbutton"><button>Register</button></a>
            `;
        }
    }

    // Fetch and display all recipes on the index.html page
    fetch('/api/recipes')
        .then(response => response.json())
        .then(recipes => {
            recipes.forEach(recipe => {
                const recipeDiv = document.createElement('div');
                recipeDiv.className = 'recipe';

                const imageHTML = recipe.coverImage ? `<img src="${recipe.coverImage}" alt="${recipe.title}" />` : '';

                const likeButton = document.createElement('button');
                likeButton.className = 'likeButton';
                likeButton.textContent = recipe.isLiked ? '❤️' : '♡';
                likeButton.setAttribute('data-recipe-id', recipe._id);

                const titleAndButton = document.createElement('h2');
                titleAndButton.innerHTML = `${recipe.title}`;

                recipeDiv.appendChild(titleAndButton);
                recipeDiv.innerHTML += imageHTML;

                recipesContainer.appendChild(recipeDiv);

                // Add event listener for "Like" button
                likeButton.addEventListener('click', function (e) {
                    e.stopPropagation();
                    const recipeId = likeButton.getAttribute('data-recipe-id');
                    toggleLike(recipeId, likeButton);
                });

                // When recipe is clicked, navigate to recipe details page
                recipeDiv.onclick = () => {
                    window.location.href = `/recipe.html?id=${recipe._id}`;
                };
            });
        })
        .catch(error => console.error('Error fetching recipes:', error));


    // Check if the current page is recipe.html
    if (window.location.pathname.includes('recipe.html')) {
        const params = new URLSearchParams(window.location.search);
        const recipeId = params.get('id');

        if (recipeId) {
            // Fetch the recipe details using the ID
            fetch(`/api/recipes/${recipeId}`)
                .then(response => response.json())
                .then(recipe => {
                    if (recipe) {
                        document.getElementById('title').innerText = recipe.title;
                        document.getElementById('ingredients').innerText = `Ingredients: ${recipe.ingredients.join(', ')}`;
                        document.getElementById('instructions').innerText = `Instructions: ${recipe.instructions}`;
                        document.getElementById('time').innerText = `Cooking Time: ${recipe.time}`;

                        if (recipe.coverImage) {
                            document.getElementById('recipeImage').src = recipe.coverImage;
                        } else {
                            document.getElementById('recipeImage').alt = 'No image available';
                        }

                        // Ensure recipeDetails element exists before appending like button
                        const recipeDetailsElement = document.getElementById('recipeDetails');
                        if (recipeDetailsElement) {
                            const likeButton = document.createElement('button');
                            likeButton.className = 'likeButton';
                            likeButton.textContent = recipe.isLiked ? '❤️' : '♡';
                            recipeDetailsElement.appendChild(likeButton);

                            // Add click event to toggle like/unlike
                            likeButton.addEventListener('click', async function () {
                                if (likeButton.textContent === '♡') {
                                    const success = await likeRecipe(recipeId);
                                    if (success) likeButton.textContent = '❤️';
                                } else {
                                    const success = await unlikeRecipe(recipeId);
                                    if (success) likeButton.textContent = '♡';
                                }
                            });
                        } else {
                            console.error("recipeDetails element not found");
                        }
                    } else {
                        document.getElementById('title').innerText = "Recipe not found";
                    }
                })
                .catch(error => {
                    console.error('Error fetching recipe:', error);
                    document.getElementById('title').innerText = "Error loading recipe";
                });
        }
    }

    // Function to like a recipe
    async function likeRecipe(recipeId) {
        try {
            const response = await fetch(`http://localhost:3000/api/users/like/${recipeId}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${localStorage.getItem('token')}`, // Include token
                },
                body: JSON.stringify({ recipeId }),
            });
            if (response.ok) {
                console.log('Recipe liked successfully!');
                return true;
            } else {
                console.error('Failed to like the recipe');
                return false;
            }
        } catch (error) {
            console.error('Error:', error);
            return false;
        }
    }

    // Function to unlike a recipe
    async function unlikeRecipe(recipeId) {
        try {
            const response = await fetch(`http://localhost:3000/api/users/unlike/${recipeId}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${localStorage.getItem('token')}`, // Include token
                },
                body: JSON.stringify({ recipeId }),
            });
            if (response.ok) {
                console.log('Recipe unliked successfully!');
                return true;
            } else {
                console.error('Failed to unlike the recipe');
                return false;
            }
        } catch (error) {
            console.error('Error:', error);
            return false;
        }
    }

    // Ensure liked recipes are fetched based on user info
    async function fetchLikedRecipes() {
        try {
            const response = await fetch(`http://localhost:3000/api/users/liked`, {
                method: 'GET',
                headers: {
                    Authorization: `Bearer ${localStorage.getItem('token')}` // Ensure token is sent
                }
            });
            if (response.ok) {
                const likedRecipes = await response.json();
                console.log('Liked Recipes:', likedRecipes);
                displayLikedRecipes(likedRecipes);
            } else {
                console.error('Failed to fetch liked recipes');
            }
        } catch (error) {
            console.error('Error:', error);
        }
    }

    function displayLikedRecipes(recipes) {
        const container = document.getElementById('liked-recipes-container');
        container.innerHTML = ''; // Clear previous content
        recipes.forEach(recipe => {
            const recipeDiv = document.createElement('div');
            recipeDiv.className = 'recipe';

            // Create the like button
            const likeButton = document.createElement('button');
            likeButton.className = 'likeButton';
            likeButton.textContent = '❤️'; // Since these are already liked
            likeButton.setAttribute('data-recipe-id', recipe._id);

            // Add event listener for unlike action
            likeButton.addEventListener('click', async function () {
                const recipeId = recipe._id;

                const success = await unlikeRecipe(recipeId);

                if (success) {
                    recipeDiv.remove();

                    if (container.children.length === 0) {
                        container.innerHTML = '<p>You have no liked recipes.</p>';
                    }
                }
            });

            recipeDiv.innerHTML = `
            <img src="${recipe.coverImage}" alt="${recipe.title}" />
            <h3>${recipe.title}</h3>
        `;

            recipeDiv.appendChild(likeButton);

            container.appendChild(recipeDiv);
        });
    }

    // Fetch liked recipes when the page loads
    fetchLikedRecipes();

    // Handle form submission for new recipe on newrecipe.html page
    if (window.location.pathname.includes('newrecipe.html')) {
        const recipeForm = document.getElementById('recipeForm');

        recipeForm.addEventListener('submit', function (e) {
            e.preventDefault();
            const formData = new FormData(recipeForm);
            const token = localStorage.getItem('token');

            fetch(`http://localhost:3000/api/recipes`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: formData
            })
                .then(response => {
                    if (!response.ok) {
                        return response.json().then(err => { throw err; });
                    }
                    return response.json();
                })
                .then(newRecipe => {
                    alert('Recipe added successfully!');
                    window.location.href = '/index.html'; // Redirect to home page after submission
                })
                .catch(error => {
                    console.error('Error adding recipe:', error);
                    alert(error.message || 'Failed to add recipe.');
                });
        });
    }


    // Handle the liked.html page (view liked recipes)
    if (window.location.pathname.includes('liked.html')) {
        const likedRecipesContainer = document.getElementById('likedRecipesContainer');
        const token = localStorage.getItem('token');

        fetch('http://localhost:3000/api/users/liked', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        })
            .then(response => response.json())
            .then(likedRecipes => {
                if (Array.isArray(likedRecipes)) {
                    likedRecipes.forEach(recipe => {
                        const recipeDiv = document.createElement('div');
                        recipeDiv.className = 'recipe';

                        const imageHTML = recipe.coverImage ? `<img src="${recipe.coverImage}" alt="${recipe.title}" />` : '';

                        recipeDiv.innerHTML = `
                    <h2>${recipe.title}</h2>
                    ${imageHTML}
                `;

                        recipeDiv.onclick = () => {
                            window.location.href = `/recipe.html?id=${recipe._id}`;
                        };
                        likedRecipesContainer.appendChild(recipeDiv);
                    });
                } else {
                    console.error('No liked recipes found or invalid response format');
                    likedRecipesContainer.innerHTML = '<p>No liked recipes available</p>';
                }
            })
            .catch(error => {
                console.error('Error fetching liked recipes:', error);
                likedRecipesContainer.innerHTML = '<p>Error loading liked recipes</p>';
            });
    }


    // Handle login form submission on login.html page
    if (window.location.pathname.includes('login.html')) {
        const loginSection = document.getElementById('loginSection');
        const token = localStorage.getItem('token');
        const userEmail = localStorage.getItem('userEmail');

        if (token && userEmail) {
            loginSection.style.display = 'none';
            window.location.href = '/index.html';
        }

        const loginForm = document.getElementById('loginForm');
        if (loginForm) {
            loginForm.addEventListener('submit', function (e) {
                e.preventDefault();
                const email = document.getElementById('email').value;
                const password = document.getElementById('password').value;

                fetch(`http://localhost:3000/api/users/login`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ email, password })
                })
                    .then(response => {
                        if (!response.ok) {
                            // Handle login errors
                            return response.json().then(data => {
                                throw new Error(data.error || 'Error during login');
                            });
                        }
                        return response.json();
                    })
                    .then(data => {
                        if (data.token) {
                            localStorage.setItem('token', data.token);
                            localStorage.setItem('userEmail', email);
                            alert('Login successful');
                            window.location.href = '/index.html'; // Redirect to home page after login
                        }
                    })
                    .catch(error => {
                        alert(error.message);
                        console.error('Error during login:', error);
                    });
            });
        }
    }

    // Handle registration form submission on register.html page
    if (window.location.pathname.includes('register.html')) {
        const registerForm = document.getElementById('registerForm');

        registerForm.addEventListener('submit', function (e) {
            e.preventDefault();
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;

            fetch(`http://localhost:3000/api/users/register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email, password })
            })
                .then(response => {
                    if (!response.ok) {

                        return response.json().then(data => {
                            if (data.redirectToLogin) {
                                throw new Error('User already exists. Please log in.');
                            }
                            throw new Error(data.error || 'Registration failed');
                        });
                    }
                    return response.json();
                })
                .then(data => {
                    if (data.token) {
                        localStorage.setItem('token', data.token);
                        localStorage.setItem('userEmail', email); // Store email
                        alert('Registration successful. Please log in.');
                        window.location.href = '/login.html'; // Redirect to login page after registration
                    }
                })
                .catch(error => {
                    alert(error.message);
                    console.error('Error during registration:', error);
                });
        });
    }
    if (window.location.pathname.includes('profile.html')) {
        const emailDisplay = document.getElementById('user-email'); // Ensure this ID matches the one in profile.html

        if (token && userEmail) {
            emailDisplay.innerText = `Email: ${userEmail}`;

            // Fetch and display user-specific recipes
            fetch('/api/recipes')
                .then(response => response.json())
                .then(recipes => {
                    const userRecipes = recipes.filter(recipe => recipe.createdBy === JSON.parse(atob(token.split('.')[1]))._id);
                    const recipesContainer = document.getElementById('recipes-container');

                    userRecipes.forEach(recipe => {
                        const recipeDiv = document.createElement('div');
                        recipeDiv.className = 'recipe';
                        recipeDiv.innerHTML = `
                        <h3>${recipe.title}</h3>
                        <p>Ingredients: ${recipe.ingredients.join(', ')}</p>
                        <p>Instructions: ${recipe.instructions}</p>
                        <p>Cooking Time: ${recipe.time}</p>
                        ${recipe.coverImage ? `<img src="${recipe.coverImage}" alt="${recipe.title}" />` : ''}
                        <button class="delete-btn" data-id="${recipe._id}">D</button>
                    `;
                        recipesContainer.appendChild(recipeDiv);
                    });

                    // Add delete functionality for user recipes
                    recipesContainer.addEventListener('click', async (event) => {
                        if (event.target.classList.contains('delete-btn')) {
                            const recipeId = event.target.getAttribute('data-id');
                            const deleteResponse = await fetch(`/api/recipes/${recipeId}`, {
                                method: 'DELETE',
                                headers: {
                                    'Authorization': `Bearer ${token}`
                                }
                            });

                            if (deleteResponse.ok) {
                                location.reload(); // Reload to see changes
                            } else {
                                alert('Failed to delete recipe');
                            }
                        }
                    });
                })
                .catch(error => {
                    console.error('Error fetching user recipes:', error);
                });
        } else {
            window.location.href = 'login.html'; // Redirect to login if not logged in
        }
    }
    const fetchRecipes = async () => {
        try {
            const response = await fetch('/api/recipes');
            const recipes = await response.json();
            return recipes;
        } catch (error) {
            console.error("Error fetching recipes:", error);
            return [];
        }
    };


    const displayAllRecipes = async () => {
        const recipes = await fetchRecipes();
        recipes.forEach(recipe => {
            const recipeDiv = document.createElement('div');
            recipeDiv.className = 'recipe';
            recipeDiv.innerHTML = `
            <h12>${recipe.title}</h12>
            <img src="${recipe.coverImage || '/default-image.jpg'}" alt="${recipe.title}" />
        `;
            recipeDiv.onclick = () => window.location.href = `/recipe.html?id=${recipe._id}`;
            recipesContainer.appendChild(recipeDiv);
        });
    };

    const displaySearchResults = (filteredRecipes) => {
        searchResultsContainer.innerHTML = "";

        if (filteredRecipes.length === 0) {
            searchResultsContainer.innerHTML = `<p>No recipes found matching your search.</p>`;
        } else {
            filteredRecipes.forEach((recipe) => {
                const recipeCard = document.createElement("div");
                recipeCard.className = "searchedrecipe";

                recipeCard.innerHTML = `
                <div class="recipe-image-container">
                    <img src="${recipe.coverImage || '/default-image.jpg'}" alt="${recipe.title}" class="recipe-image" />
                </div>
                <div class="recipe-content">
                    <h3 class="recipe-title">${recipe.title}</h3>
                    <p class="recipe-description">${recipe.ingredients.slice(0, 3).join(", ")}...</p>
                    <button class="recipe-link view-recipe-button">View Recipe</button>
                </div>
            `;

                // Attach the card to the container
                searchResultsContainer.appendChild(recipeCard);

                // Add the navigation functionality for the entire card
                recipeCard.addEventListener('click', () => {
                    window.location.href = `/recipe.html?id=${recipe._id}`;
                });

                // Prevent the card navigation when clicking on the button
                const viewRecipeButton = recipeCard.querySelector(".view-recipe-button");
                viewRecipeButton.addEventListener('click', (e) => {
                    e.stopPropagation(); // Stop the event from propagating to the card
                    window.location.href = `/recipe.html?id=${recipe._id}`;
                });
            });
        }
    };

    const navigateToRecipe = (id) => {
        window.location.href = `/recipe.html?id=${id}`;
    };
    // Function to handle search functionality
    const searchRecipes = async () => {
        const query = searchInput.value.trim().toLowerCase(); // Get and normalize the query input

        if (!query) {
            searchResultsContainer.innerHTML = "<p>Please enter a search term.</p>";
            return;
        }

        const recipes = await fetchRecipes();  // Fetch all recipes

        // Filter recipes based on the query (case-insensitive) matching only the title
        const filteredRecipes = recipes.filter(recipe =>
            recipe.title.toLowerCase().includes(query)
        );

        // If no results found, show a message
        if (filteredRecipes.length === 0) {
            searchResultsContainer.innerHTML = `<p>No recipes found matching your search.</p>`;
        } else {
            displaySearchResults(filteredRecipes);
        }
    };



    // Listen for search form submission
    searchForm.addEventListener("submit", function (e) {
        e.preventDefault();
        searchRecipes();
    });

    // Optionally: Perform search when the user types in the search input (live search)
    searchInput.addEventListener("input", function () {
        searchRecipes();
    });

});
