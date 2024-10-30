/*********************************************************************************
*  WEB322 – Assignment 03
*  I declare that this assignment is my own work in accordance with Seneca Academic Policy.  
*  No part of this assignment has been copied manually or electronically from any other source 
*  (including 3rd party web sites) or distributed to other students.
* 
*  Name: Khushi Arora     Student ID: [Your Student ID]     Date: [Current Date]
*
*  Cyclic Web App URL: __________________________________________
*  GitHub Repository URL: ______________________________________
********************************************************************************/ 

const express = require('express');
const path = require('path');
const multer = require("multer");
const cloudinary = require('cloudinary').v2;
const streamifier = require('streamifier');
const storeService = require('./store-service');

const app = express();
const upload = multer(); // No disk storage

// Cloudinary configuration
cloudinary.config({
    cloud_name: 'detwfq4z8',
    api_key: '188847515436942',
    api_secret: 'yT4bj0ZdJx0nYNux92dbiz3HxTA',
    secure: true
});

// Serve static files
app.use(express.static('public'));

// Route to serve the addItem.html form
app.get('/items/add', (req, res) => {
    res.sendFile(path.join(__dirname, "/views/addItem.html"));
});

// Route to handle adding a new item with image upload
app.post('/items/add', upload.single("featureImage"), (req, res) => {
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
        });
    } else {
        processItem("");
    }

    function processItem(imageUrl) {
        req.body.featureImage = imageUrl;
        storeService.addItem(req.body).then(() => {
            res.redirect('/items');
        }).catch(err => res.status(500).json({ message: err }));
    }
});

// Route to list items with optional filters
app.get('/items', (req, res) => {
    const { category, minDate } = req.query;

    if (category) {
        storeService.getItemsByCategory(category)
            .then(items => res.json(items))
            .catch(err => res.status(404).json({ message: err }));
    } else if (minDate) {
        storeService.getItemsByMinDate(minDate)
            .then(items => res.json(items))
            .catch(err => res.status(404).json({ message: err }));
    } else {
        storeService.getAllItems()
            .then(items => res.json(items))
            .catch(err => res.status(500).json({ message: err }));
    }
});

// Route to get a single item by ID
app.get('/item/:id', (req, res) => {
    const id = parseInt(req.params.id);
    storeService.getItemById(id)
        .then(item => res.json(item))
        .catch(err => res.status(404).json({ message: err }));
});

// Start server
const HTTP_PORT = process.env.PORT || 8080;
app.listen(HTTP_PORT, () => {
    console.log(`Server is listening on port ${HTTP_PORT}`);
});
