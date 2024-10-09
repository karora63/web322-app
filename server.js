const express = require('express'); // Require the Express module
const path = require('path'); // Require the path module for file paths
const storeService = require('./store-service'); // Require your store-service module
const app = express(); // Obtain the "app" object
const HTTP_PORT = process.env.PORT || 8080; // Assign a port

// Middleware to serve static files from the "public" directory
app.use(express.static('public')); // This allows serving CSS, JS, and image files

// Route for the root URL that redirects to "/about"
app.get('/', (req, res) => {
    res.redirect('/about'); // Redirect to the About page
});

// Route to serve the about.html file
app.get('/about', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'about.html')); // Serve the about.html file from views folder
});

// Initialize store data
storeService.initialize()
    .then(() => {
        console.log("Data initialized successfully.");
        
        // Add routes for shop, items, and categories
        app.get('/shop', (req, res) => {
            storeService.getPublishedItems()
                .then((data) => res.json(data)) // Return published items as JSON
                .catch((err) => res.status(500).json({ message: err })); // Handle errors
        });

        app.get('/items', (req, res) => {
            storeService.getAllItems()
                .then((data) => res.json(data)) // Return all items as JSON
                .catch((err) => res.status(500).json({ message: err })); // Handle errors
        });

        app.get('/categories', (req, res) => {
            storeService.getCategories()
                .then((data) => res.json(data)) // Return all categories as JSON
                .catch((err) => res.status(500).json({ message: err })); // Handle errors
        });

        // Custom 404 handler
        app.use((req, res) => {
            res.status(404).json({ message: "Page Not Found" }); // Return 404 message
        });

        // Start the server on the port and output a confirmation to the console
        app.listen(HTTP_PORT, () => {
            console.log(`Express http server listening on port: ${HTTP_PORT}`); // Output confirmation message
        });
    })
    .catch((err) => {
        console.error("Failed to initialize data: ", err); // Log error if initialization fails
    });
