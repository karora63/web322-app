/*********************************************************************************
WEB322 – Assignment 03
I declare that this assignment is my own work in accordance with Seneca Academic Policy.
No part of this assignment has been copied manually or electronically from any other source 
(including 3rd party web sites) or distributed to other students.

Name: Mehak Mehak 
Student ID: 144849239
Date: 29/10/2024
Replit Web App URL: https://replit.com/@mehakdhull189/web322-app-1
GitHub Repository URL: https://github.com/MehakDhull/web322-app.git
********************************************************************************/




const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const streamifier = require('streamifier');

const exphbs = require('express-handlebars');





// Import required modules
const express = require('express');
const path = require('path');
const storeService = require('./store-service.js'); // Import the store-service module

// Initialize express app
const app = express();
const PORT = process.env.PORT || 8080;

app.engine('hbs', exphbs.engine({ 
  extname: '.hbs', 
  helpers: {
      navLink: function(url, options) {
          if (url == app.locals.activeRoute) {
              return '<li class="nav-item active"><a class="nav-link" href="' + url + '">' + options.fn(this) + '</a></li>';
          } else {
              return '<li class="nav-item"><a class="nav-link" href="' + url + '">' + options.fn(this) + '</a></li>';
          }
      },
      equal: function(lvalue, rvalue, options) {
          if (arguments.length < 3) {
              throw new Error("Handlebars Helper equal needs 2 parameters");
          }
          if (lvalue != rvalue) {
              return options.inverse(this);
          } else {
              return options.fn(this);
          }
      }
  }
}));
app.set('view engine', 'hbs');
cloudinary.config({
  cloud_name: 'dbxs5ruav',
  api_key: '327625186595629',
  api_secret: 'yMCkWDyCbNg2h0Yc3S6coX_qUDk',
  secure: true
});
const upload = multer(); // No disk storage, we’re using Cloudinary directly.







app.post('/items/add', upload.single('featureImage'), (req, res) => {
  // Check if there’s an uploaded file
  if (req.file) {
    // Helper function to upload image as a stream to Cloudinary
    let streamUpload = (req) => {
      return new Promise((resolve, reject) => {
        let stream = cloudinary.uploader.upload_stream((error, result) => {
          if (result) {
            resolve(result); // Image uploaded successfully
          } else {
            reject(error); // Image upload failed
          }
        });
        // Convert file buffer to stream and pipe it to Cloudinary
        streamifier.createReadStream(req.file.buffer).pipe(stream);
      });
    };

    // Async function to perform the upload
    async function upload(req) {
      let result = await streamUpload(req);
      console.log(result); // Log upload result for debugging
      return result;
    }

    // Call the upload function and handle the uploaded URL
    upload(req).then((uploaded) => {
      processItem(uploaded.url); // Pass image URL to processItem
    }).catch((error) => {
      console.error("Upload failed:", error); // Log any errors
      res.redirect('/items'); // Redirect to /items if upload fails
    });
  } else {
    processItem(""); // No image uploaded, pass empty string
  }

  // Function to process form data and add a new item
  function processItem(imageUrl) {
    req.body.featureImage = imageUrl; // Assign image URL to featureImage in req.body

    // TODO: Add code here to save req.body as a new item in your items array

    res.redirect('/items'); // Redirect to the items list after adding the new item
  }
});




// Middleware for serving static files from the public folder
app.use(express.static('public'));
app.use(function(req, res, next) {
  // Get the route path without the leading slash
  let route = req.path.substring(1);

  // Assign the activeRoute property (ignoring route with numeric parts, e.g., /store/5 becomes /store)
  app.locals.activeRoute = "/" + (isNaN(route.split('/')[1]) ? route.replace(/\/(?!.*)/, "") : route.replace(/\/(.*)/, ""));

  // If a category query exists, store it in app.locals
  app.locals.viewingCategory = req.query.category;

  next();
});


 
// Redirect the root route ("/") to the about page ("/about")
app.get('/about', (req, res) => {
  res.render('about');
});



// Route to get all items (from items.json)
// Route to get all items and render them in the "items" view (items.hbs)
app.get('/items', (req, res) => {
  storeService.getAllItems()  // Fetching items from the service (or database)
    .then((data) => {
      if (data && data.length > 0) {
        // Render the "items" view and pass the data (items) to the view
        res.render('items', { items: data });
      } else {
        // If no items are found, render with a message
        res.render('items', { message: "No items available." });
      }
    })
    .catch((err) => {
      // If there's an error, render with an error message
      res.render('items', { message: "An error occurred while fetching items." });
    });
});

// Route to get published items (published == true)
app.get('/shop', (req, res) => {
  storeService.getPublishedItems()
    .then((data) => res.json(data))
    .catch((err) => res.status(500).json({ message: err }));
});



// Route to get all categories (from categories.json)
app.get('/categories', (req, res) => {
  storeService.getCategories()
    .then((data) => {
      // Render the categories view with the categories data
      res.render("categories", { categories: data });
    })
    .catch((err) => {
      // If there's an error, render the categories view with an error message
      res.render("categories", { message: "Error retrieving categories" });
    });
});

// Route to get published items by category
app.get('/store', (req, res) => {
  const category = req.query.category;  // Get category from query parameter
  
  storeService.getPublishedItemsByCategory(category)
    .then((data) => {
      res.render('store', { items: data });  // Render store view with filtered items
    })
    .catch((err) => {
      res.render('store', { message: err });  // Render store view with error message if no items are found
    });
});



//
let items = [];

// Route to show the 'Add Item' form
app.get('/items/add', (req, res) => {
  res.render('addItem'); // Render 'addItem.hbs' template
});

// Route to handle item addition (POST request)
app.post('/items/add', (req, res) => {
  const newItem = {
    name: req.body.name,   // assuming 'name' is the field in your form
    description: req.body.description // assuming 'description' is the field in your form
  };
  
  // Add new item to the items array
  items.push(newItem);
  
  // Redirect to the 'Items' page to see the updated list
  res.redirect('/Items');
});

// Route to display all items
app.get('/Items', (req, res) => {
  res.render('items', { items: items }); // Pass items to 'items.hbs' template
});


// 404 Route (for routes not matching any of the above)
app.use((req, res) => {
  res.status(404).send("Page Not Found");
});




app.get('/items', (req, res) => {
  if (req.query.category) {
    storeService.getItemsByCategory(req.query.category)
      .then(items => res.json(items))
      .catch(err => res.status(500).json({ message: err }));
  } else if (req.query.minDate) {
    storeService.getItemsByMinDate(req.query.minDate)
      .then(items => res.json(items))
      .catch(err => res.status(500).json({ message: err }));
  } else {
    storeService.getAllItems()
      .then(items => res.json(items))
      .catch(err => res.status(500).json({ message: err }));
  }
});

const itemData = require("./store-service");
app.get('/', (req, res) => {
  let category = req.query.category || null;
  let promise;

  if (category) {
      promise = itemData.getPublishedItemsByCategory(category);
  } else {
      promise = itemData.getPublishedItems(); // Assuming getPublishedItems fetches all items
  }

  promise
      .then(items => {
          itemData.getCategories()
              .then(categories => {
                  res.redirect('shop', {
                      post: null, // If it's the main shop, no specific post
                      posts: items,
                      categories: categories,
                      message: "No items available for the selected category.",
                  });
              })
              .catch(err => res.status(500).send(err));
      })
      .catch(err => {
          res.status(500).send(err);
      });
});

// Route to display a specific item by its ID
app.get('/shop/:id', (req, res) => {
  let id = req.params.id;

  itemData.getItemById(id)  // Assuming a method to get an item by ID
      .then(item => {
          if (!item) {
              res.render('shop', {
                  message: "Item not found.",
                  posts: [],
                  categories: [],
              });
          } else {
              itemData.getCategories()
                  .then(categories => {
                      res.render('shop', {
                          post: item,
                          posts: [],
                          categories: categories,
                          message: "",
                      });
                  })
                  .catch(err => res.status(500).send(err));
          }
      })
      .catch(err => res.status(500).send(err));
});



app.get('/item/:id', (req, res) => {
  storeService.getItemById(req.params.id)
    .then(item => res.json(item))
    .catch(err => res.status(500).json({ message: err }));
});

// Initialize the store service and then start the server
storeService.initialize()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Express http server listening on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.log("Failed to initialize the store: " + err);
  });
