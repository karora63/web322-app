/*********************************************************************************
WEB322 – Assignment 06
I declare that this assignment is my own work in accordance with Seneca Academic Policy.
No part of this assignment has been copied manually or electronically from any other source 
(including 3rd party web sites) or distributed to other students.

Name: __Khushi Arora______ 
Student ID: __146209234______ 
Date: ____11-12-2024____________
Repit Web App URL: _____https://replit.com/@karora63/web322-app?v=1________________
GitHub Repository URL: _______https://github.com/karora63/web322-app.git___________________
********************************************************************************/
// Import required modules
const express = require('express');
const app = express();
const path = require('path');
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const streamifier = require('streamifier');
const exphbs = require('express-handlebars');
const Handlebars = require('handlebars');
const clientSessions = require('client-sessions');
const storeService = require('./store-service');
const authData = require('./auth-service');

// Configure client-sessions middleware
app.use(clientSessions({
  cookieName: "session", // Cookie name
  secret: "rJ3QECTeCMjoibajvIyPQs6UeCWSvaMb", // Replace with a strong secret key
  duration: 24 * 60 * 60 * 1000, // Session duration in milliseconds (1 day)
  activeDuration: 1000 * 60 * 5 // Extend session by 5 minutes if active
}));

// Middleware to make session data available to templates
app.use((req, res, next) => {
  res.locals.session = req.session; // Attach session data to res.locals
  next();
});

// Helper middleware to check if a user is logged in
function ensureLogin(req, res, next) {
  if (!req.session.user) {
    res.redirect("/login"); // Redirect to login page if not logged in
  } else {
    next(); // Proceed if logged in
  }
}

// Middleware to parse form data and serve static files
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

// Middleware to track active route
app.use((req, res, next) => {
  let route = req.path.substring(1);
  app.locals.activeRoute = "/" + (isNaN(route.split('/')[1]) ? route.replace(/\/(?!.)/, "") : route.replace(/\/(.)/, ""));
  app.locals.viewingCategory = req.query.category ? req.query.category : null;
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
  cloud_name: 'dbxs5ruav',
  api_key: '327625186595629',
  api_secret: 'yMCkWDyCbNg2h0Yc3S6coX_qUDk',
  secure: true
});

// Redirect root to /about
app.get('/about', (req, res) => {
  res.render('about');
});

const upload = multer();

// Authentication Routes
app.get('/login', (req, res) => {
  res.render('login');
});

app.post('/login', (req, res) => {
  req.body.userAgent = req.get('User-Agent');
  authData.checkUser(req.body)
    .then((user) => {
      req.session.user = {
        userName: user.userName,
        email: user.email,
        loginHistory: user.loginHistory
      };
      res.redirect('/items');
    })
    .catch((err) => {
      res.render('login', { errorMessage: err, userName: req.body.userName });
    });
});

app.get('/register', (req, res) => {
  res.render('register');
});

app.post('/register', (req, res) => {
  authData.registerUser(req.body)
    .then(() => {
      res.render('register', { successMessage: "User created successfully!" });
    })
    .catch((err) => {
      res.render('register', { errorMessage: err, userName: req.body.userName });
    });
});

app.get('/logout', (req, res) => {
  req.session.reset(); // Clear session
  res.redirect('/login');
});

app.get('/userHistory', ensureLogin, (req, res) => {
  res.render('userHistory', { user: req.session.user });
});

// Categories and Items Routes
app.get('/categories/add', ensureLogin, (req, res) => {
  res.render('addCategory');
});

app.post('/categories/add', ensureLogin, (req, res) => {
  storeService.addCategory(req.body)
    .then(() => {
      res.redirect('/categories');
    })
    .catch(() => {
      res.status(500).send("Unable to Add Category");
    });
});

app.get('/categories/delete/:id', ensureLogin, (req, res) => {
  storeService.deleteCategoryById(req.params.id)
    .then(() => {
      res.redirect('/categories');
    })
    .catch(() => {
      res.status(500).send("Unable to Remove Category / Category not found");
    });
});

app.get('/items/add', ensureLogin, (req, res) => {
  storeService.getCategories()
    .then((categories) => {
      res.render('addItem', { categories });
    })
    .catch(() => {
      res.render('addItem', { categories: [] });
    });
});

app.post('/items/add', ensureLogin, upload.single('featureImage'), (req, res) => {
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
    }).catch(() => {
      res.status(500).send('Failed to upload image');
    });
  } else {
    processItem('');
  }

  function processItem(imageUrl) {
    req.body.featureImage = imageUrl;
    storeService.addItem(req.body)
      .then(() => {
        res.redirect('/items');
      })
      .catch(() => {
        res.status(500).send('Failed to add item');
      });
  }
});

// Fetching Items and Categories
app.get('/items', ensureLogin, async (req, res) => {
  let viewData = {};
  try {
    const items = await storeService.getAllItems();
    viewData.items = items.length > 0 ? items : "No items found.";
    const categories = await storeService.getCategories();
    viewData.categories = categories.length > 0 ? categories : "No categories available.";
  } catch {
    viewData.message = "Error fetching data.";
  }
  res.render('items', { data: viewData });
});

app.get('/categories', ensureLogin, async (req, res) => {
  let viewData = {};
  try {
    const categories = await storeService.getCategories();
    viewData.categories = categories.length > 0 ? categories : "No categories found.";
  } catch {
    viewData.message = "Error fetching categories.";
  }
  res.render('categories', { data: viewData });
});

// Shop Route
app.get('/shop',ensureLogin, async (req, res) => {
  let viewData = {};
  const category = req.query.category;
  const selectedItemId = req.query.id ? parseInt(req.query.id) : null;

  try {
    if (category) {
      viewData.posts = await storeService.getPublishedItemsByCategory(category);
    } else {
      viewData.posts = await storeService.getPublishedItems();
    }
  } catch {
    viewData.posts = [];
    viewData.message = "No items available.";
  }

  try {
    viewData.categories = await storeService.getCategories();
  } catch {
    viewData.categories = [];
    viewData.categoriesMessage = "No categories available.";
  }

  try {
    if (selectedItemId) {
      viewData.post = await storeService.getItemById(selectedItemId);
    } else {
      viewData.post = null;
    }
  } catch {
    viewData.post = null;
    viewData.message = "Item not found.";
  }

  res.render('shop', { data: viewData });
});

app.use((req, res) => {
  res.status(404).render('404');
});

// Initialize services and start the server
storeService.initialize()
  .then(authData.initialize) // Initialize authData after storeService
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Express http server listening on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.log("Unable to start server: " + err);
  });