const fs = require('fs'); // Import the file system module

let items = []; // Array to hold item data
let categories = []; // Array to hold category data

// Function to initialize data from JSON files
function initialize() {
    return new Promise((resolve, reject) => {
        // Read items.json
        fs.readFile('./data/items.json', 'utf8', (err, data) => {
            if (err) {
                return reject("Unable to read items file");
            }
            items = JSON.parse(data); // Parse JSON data into the items array

            // Read categories.json
            fs.readFile('./data/categories.json', 'utf8', (err, data) => {
                if (err) {
                    return reject("Unable to read categories file");
                }
                categories = JSON.parse(data); // Parse JSON data into the categories array
                resolve(); // Resolve the promise once both files are read successfully
            });
        });
    });
}

// Function to get all items
function getAllItems() {
    return new Promise((resolve, reject) => {
        if (items.length === 0) {
            return reject("No results returned");
        }
        resolve(items); // Return all items
    });
}

// Function to get published items
function getPublishedItems() {
    return new Promise((resolve, reject) => {
        const publishedItems = items.filter(item => item.published);
        if (publishedItems.length === 0) {
            return reject("No results returned");
        }
        resolve(publishedItems); // Return published items
    });
}

// Function to get all categories
function getCategories() {
    return new Promise((resolve, reject) => {
        if (categories.length === 0) {
            return reject("No results returned");
        }
        resolve(categories); // Return all categories
    });
}

module.exports = {
    initialize,
    getAllItems,
    getPublishedItems,
    getCategories
};
