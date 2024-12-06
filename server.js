/*********************************************************************************
WEB322 – Assignment 05
I declare that this assignment is my own work in accordance with Seneca Academic Policy.
No part of this assignment has been copied manually or electronically from any other source 
(including 3rd party web sites) or distributed to other students.

Name: Khushi Arora 
Student ID: 146209234
Date: 6 December 2024
Replit Web App URL: 
GitHub Repository URL: 
********************************************************************************/
const express = require('express');
const app = express();
const storeService = require('./store-service');
const path = require('path');
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const streamifier = require('streamifier');
const exphbs = require('express-handlebars');
const Handlebars = require('handlebars');


// Serving static files
app.use(express.static('public'));
// Middleware to parse form data
app.use(express.urlencoded({ extended: true }));
// Route to about page
app.use((req, res, next) => {
  let route = req.path.substring(1);
  app.locals.activeRoute = "/" + (isNaN(route.split('/')[1]) ? route.replace(/\/(?!.)/, "") : route.replace(/\/(.)/, ""));
  app.locals.viewingCategory = req.query.category ? req.query.category : null; // Ensure category is set or null
  next();
});


// Configure Handlebars as the template engine
app.engine('.hbs', exphbs.engine({
  extname: '.hbs',
  defaultLayout: 'main',
  layoutsDir: path.join(__dirname, 'views', 'layouts'),
  helpers: {
    navLink: function(url, options) {
      return `<li class="nav-item${url === options.data.root.activeRoute ? ' active' : ''}">
                  <a class="nav-link" href="${url}">${options.fn(this)}</a>
              </li>`;
    },
    equal: function(lvalue, rvalue, options) {
      if (arguments.length < 3) {
        throw new Error("Handlebars Helper equal needs 2 parameters");
      }
      return lvalue != rvalue ? options.inverse(this) : options.fn(this);
    },
    safeHTML: function(context) {
      return context ? new Handlebars.SafeString(context) : "";
    }
  }
}));
app.set('view engine', '.hbs');
app.set('views', path.join(__dirname, 'views'));

const PORT = process.env.PORT || 8080;
// Configure Cloudinary
cloudinary.config({
  cloud_name: 'detwfq4z8',
  api_key: '188847515436942',
  api_secret: 'yT4bj0ZdJx0nYNux92dbiz3HxTA',
  secure: true
});

  app.get('/categories/add', (req, res) => {
    res.render('addCategory'); // Render the "addCategory" view (to be created)
  });
  app.post('/categories/add', (req, res) => {
    storeService.addCategory(req.body)
      .then(() => {
        res.redirect('/categories'); // Redirect to the categories view
      })
      .catch((err) => {
        res.status(500).send("Unable to Add Category"); // Handle errors
      });
  });
  app.get('/categories/delete/:id', (req, res) => {
    storeService.deleteCategoryById(req.params.id)
      .then(() => {
        res.redirect('/categories'); // Redirect to the categories view
      })
      .catch((err) => {
        res.status(500).send("Unable to Remove Category / Category not found"); // Handle errors
      });
  });
  app.get('/items/delete/:id', (req, res) => {
    storeService.deletePostById(req.params.id)
      .then(() => {
        res.redirect('/items'); // Redirect to the items view
      })
      .catch((err) => {
        res.status(500).send("Unable to Remove Item / Item not found"); // Handle errors
      });
  });

// Multer configuration (no disk storage)
const upload = multer();
app.get('/', (req, res) => {
  res.redirect('/shop');
});

// Redirect root to /about
app.get('/about', (req, res) => {
  res.render('about');
});
  
  // Route to fetch all items for /items
  app.get('/items', async (req, res) => {
    let viewData = {};
  
    try {
      // Get all items
      const items = await storeService.getAllItems();
      if (items.length > 0) {
        viewData.items = items;
      } else {
        viewData.message = "no results";
      }
    } catch (err) {
      viewData.message = "no results"; // Handle promise rejection
    }
  
    try {
      // Get all categories
      const categories = await storeService.getCategories();
      if (categories.length > 0) {
        viewData.categories = categories;
      } else {
        viewData.categoriesMessage = "no categories available";
      }
    } catch (err) {
      viewData.categoriesMessage = "no categories available"; // Handle promise rejection
    }
  
    // Render the "Items" view with the data or messages
    res.render('items', { data: viewData });
  });
  
  // Route to fetch all categories for /categories
  app.get('/categories', async (req, res) => {
    let viewData = {};
  
    try {
      // Get all categories
      const categories = await storeService.getCategories();
      if (categories.length > 0) {
        viewData.categories = categories;
      } else {
        viewData.message = "no results";
      }
    } catch (err) {
      viewData.message = "no results"; // Handle promise rejection
    }
  
    // Render the "categories" view with the data or messages
    res.render('categories', { data: viewData });
  });
  

  // to add new route to add itmes
  app.get('/items/add', (req, res) => {
    storeService.getCategories()
      .then((categories) => {
        res.render('addItem', { categories }); // Pass the categories to the view
      })
      .catch(() => {
        res.render('addItem', { categories: [] }); // Render with an empty array if no categories
      });
  });

  // POST /items/add route to handle item creation
app.post('/items/add', upload.single('featureImage'), (req, res) => {
  if (req.file) {
    let streamUpload = (req) => {
      return new Promise((resolve, reject) => {
        let stream = cloudinary.uploader.upload_stream((error, result) => {
          if (result) resolve(result);
          else reject(error);
        });
        streamifier.createReadStream(req.file.buffer).pipe(stream);
      });
    };

    async function upload(req) {
      let result = await streamUpload(req);
      return result;
    }

    upload(req).then((uploaded) => {
      processItem(uploaded.url);
    }).catch((error) => {
      console.error('Upload failed:', error);
      res.status(500).send('Failed to upload image');
    });
  } else {
    processItem('');
  }

  function processItem(imageUrl) {
    req.body.featureImage = imageUrl;
    storeService.addItem(req.body).then(() => {
      res.redirect('/items');
    }).catch((err) => {
      res.status(500).send('Failed to add item');
    });
  }
});

// Route to fetch all items with optional filters
app.get('/items', (req, res) => {
  const { category, minDate } = req.query;

  if (category) {
    storeService.getItemsByCategory(category)
      .then((data) => res.json(data))
      .catch((err) => res.status(500).json({ message: err }));
  } else if (minDate) {
    storeService.getItemsByMinDate(minDate)
      .then((data) => res.json(data))
      .catch((err) => res.status(500).json({ message: err }));
  } else {
    storeService.getAllItems()
      .then((data) => res.json(data))
      .catch((err) => res.status(500).json({ message: err }));
  }
});


// Route to fetch all published items for /shop
app.get('/shop', async (req, res) => {
  let viewData = {};
  const category = req.query.category;
  const selectedItemId = req.query.id ? parseInt(req.query.id) : null;

  try {
    // Fetch items filtered by category, if provided
    if (category) {
      viewData.posts = await storeService.getPublishedItemsByCategory(category);
    } else {
      viewData.posts = await storeService.getPublishedItems();
    }
  } catch (err) {
    viewData.posts = [];
    viewData.message = "No items available.";
  }

  try {
    // Fetch categories for the sidebar
    viewData.categories = await storeService.getCategories();
  } catch (err) {
    viewData.categories = [];
    viewData.categoriesMessage = "No categories available.";
  }

  try {
    // Fetch the selected item's details, if an ID is provided
    if (selectedItemId) {
      viewData.post = await storeService.getItemById(selectedItemId);
    } else {
      viewData.post = null;
    }
  } catch (err) {
    viewData.post = null;
    viewData.message = "Item not found.";
  }

  res.render('shop', { data: viewData });
});
  
  // Handle non-matching routes (404)
  app.use((req, res) => {
    res.status(404).render('404');
});

app.get('/shop/:id', async (req, res) => {
  let viewData = {};
  const id = parseInt(req.params.id); // Convert the id to an integer

  try {
    console.log("Fetching item with ID:", id); // Debugging
    // Fetch the specific item by ID
    const item = await storeService.getItemById(id);
    console.log("Item fetched:", item); // Debugging
    viewData.post = item;
  } catch (err) {
    console.error("Error fetching item:", err); // Debugging
    viewData.post = null;
    viewData.message = "Item not found.";
  }

  try {
    // Fetch all published items for the sidebar
    const items = await storeService.getPublishedItems();
    viewData.posts = items;
  } catch (err) {
    viewData.posts = [];
    viewData.message = "No items available.";
  }

  try {
    // Fetch all categories for the sidebar
    const categories = await storeService.getCategories();
    viewData.categories = categories;
  } catch (err) {
    viewData.categories = [];
    viewData.categoriesMessage = "No categories available.";
  }

  res.render('shop', { data: viewData });
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