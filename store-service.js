const fs = require('fs');

let items = [];
let categories = [];

function initialize() {
  return new Promise((resolve, reject) => {
    fs.readFile('./data/items.json', 'utf8', (err, data) => {
      if (err) {
        reject("Unable to read file");
        return;
      }
      items = JSON.parse(data);

      fs.readFile('./data/categories.json', 'utf8', (err, data) => {
        if (err) {
          reject("Unable to read file");
          return;
        }
        categories = JSON.parse(data);
        resolve();
      });
    });
  });
}

function getAllItems() {
  return new Promise((resolve, reject) => {
    if (items.length === 0) {
      reject("No results returned");
    } else {
      resolve(items);
    }
  });
}

function getPublishedItems() {
  return new Promise((resolve, reject) => {
    const publishedItems = items.filter(item => item.published);
    if (publishedItems.length === 0) {
      reject("No results returned");
    } else {
      resolve(publishedItems);
    }
  });
}
function getPublishedItemsByCategory(category) {
  return new Promise((resolve, reject) => {
      // Filter items that are published and belong to the specified category
      db.collection('items').find({ 
          published: true, 
          category: category 
      }).toArray((err, items) => {
          if (err) {
              reject("Error fetching items by category");
          } else {
              resolve(items);
          }
      });

  });
}
function getCategories() {
  return new Promise((resolve, reject) => {
    if (categories.length === 0) {
      reject("No results returned");
    } else {
      resolve(categories);
    }
  });
}


function addItem(itemData) {
  return new Promise((resolve, reject) => {
    // Set 'published' property
    if (itemData.published === undefined) {
      itemData.published = false;
    } else {
      itemData.published = true;
    }

    // Assign a unique ID to the item
    itemData.id = items.length + 1;

    // Set the 'postDate' to the current date (formatted as YYYY-M-D)
    const currentDate = new Date();
    itemData.postDate = currentDate.getFullYear() + '-' + (currentDate.getMonth() + 1) + '-' + currentDate.getDate();

    // Add the item to the items array
    items.push(itemData);

    // Resolve the promise with the new itemData
    resolve(itemData);
  });
}




function getItemsByCategory(category) {
  return new Promise((resolve, reject) => {
    // Filter items that are published and belong to the specified category
    const publishedItemsByCategory = items.filter(item => item.published === true && item.category === category);
    
    // If there are no results, reject with a message
    if (publishedItemsByCategory.length > 0) {
      resolve(publishedItemsByCategory);
    } else {
      reject("No published items found for this category.");
    }
  });
}

function getItemsByMinDate(minDateStr) {
  return new Promise((resolve, reject) => {
    const minDate = new Date(minDateStr);
    const itemsByDate = items.filter(item => new Date(item.postDate) >= minDate);
    if (itemsByDate.length > 0) {
      resolve(itemsByDate);
    } else {
      reject("No results returned");
    }
  });
}

function getItemById(id) {
  return new Promise((resolve, reject) => {
    const item = items.find(item => item.id == id);
    if (item) {
      resolve(item);
    } else {
      reject("No result returned");
    }
  });
}


module.exports = { initialize, getAllItems, getPublishedItems, getPublishedItemsByCategory, getCategories, addItem , getItemsByCategory, getItemsByMinDate, getItemById};