const Sequelize = require('sequelize');
const { gte } = Sequelize.Op; // Destructure the 'greater than or equal to' operator

/**
 * Function to retrieve items with postDate greater than or equal to minDateStr
 * @param {string} minDateStr - The minimum date as a string (e.g., "2020-10-1").
 * @returns {Promise} - Resolves with the filtered data or rejects with an error message.
 */

// Replace these values with your ElephantSQL database credentials
const sequelize = new Sequelize('web app', 'web app_owner', 'MVTWhanIzb19', {
    host: 'ep-crimson-hat-a52953bq.us-east-2.aws.neon.tech', 
    dialect: 'postgres',
    port: 5432, // Default PostgreSQL port
    dialectOptions: {
        ssl: { rejectUnauthorized: false } // Enables SSL for secure connection
    },
    query: { raw: true } // Ensures raw SQL queries are returned
});

// Define the Item model
const Item = sequelize.define('Item', {
  body: Sequelize.TEXT,
  title: Sequelize.STRING,
  postDate: Sequelize.DATE,
  featureImage: Sequelize.STRING,
  published: Sequelize.BOOLEAN,
  price: Sequelize.DOUBLE
});
const Category = sequelize.define('Category', {
  category: Sequelize.STRING
});

// Define the relationship
Item.belongsTo(Category, { foreignKey: 'category' }); 

function initialize() {
  return new Promise((resolve, reject) => {
    sequelize.sync()
      .then(() => {
        resolve("Database synced successfully");
      })
      .catch((err) => {
        reject("Unable to sync the database: " + err);
      });
  });
}


function getAllItems() {
  return new Promise((resolve, reject) => {
    Item.findAll()
      .then((data) => {
        if (data.length > 0) {
          resolve(data); // Pass the retrieved data to resolve
        } else {
          reject("no results returned"); // No items found
        }
      })
      .catch((err) => {
        reject("no results returned: " + err); // Error occurred
      });
  });
}


function addItem(itemData) {
  return new Promise((resolve, reject) => {
      try {
          // Ensure the 'published' property is explicitly set to true or false
          itemData.published = itemData.published ? true : false;

          // Replace any empty string properties ("") with null
          for (let property in itemData) {
              if (itemData[property] === "") {
                  itemData[property] = null;
              }
          }

          // Set the 'postDate' property to the current date
          itemData.postDate = new Date();

          // Create a new item using the Sequelize 'create' method
          Item.create(itemData)
              .then(() => {
                  // Resolve the promise if the creation was successful
                  resolve();
              })
              .catch((err) => {
                  // Reject the promise with a meaningful message if there's an error
                  reject(`Unable to create post: ${err.message || "Error occurred"}`);
              });
      } catch (error) {
          // Handle unexpected errors
          reject(`Unexpected error: ${error.message}`);
      }
  });
}

function getPublishedItems() {
  return new Promise((resolve, reject) => {
    Item.findAll({
      where: {
        published: true, // Filter by "published" set to true
      },
    })
      .then((data) => {
        if (data.length > 0) {
          resolve(data); // Return the filtered data
        } else {
          reject("no results returned"); // No published items found
        }
      })
      .catch((err) => {
        reject("no results returned: " + err); // Error during query
      });
  });
}
function getPublishedItemsByCategory(category) {
  return new Promise((resolve, reject) => {
    Item.findAll({
      where: {
        published: true, // Filter by "published" set to true
        category: category, // Filter by the given "category"
      },
    })
      .then((data) => {
        if (data.length > 0) {
          resolve(data); // Return the filtered data
        } else {
          reject("no results returned"); // No items found
        }
      })
      .catch((err) => {
        reject("no results returned: " + err); // Error during query
      });
  });
}

function getCategories() {
  return new Promise((resolve, reject) => {
    Category.findAll()
      .then((data) => {
        if (data.length > 0) {
          resolve(data); // Return the retrieved categories
        } else {
          reject("no results returned"); // No categories found
        }
      })
      .catch((err) => {
        reject("no results returned: " + err); // Error during query
      });
  });
}
function getItemsByCategory(category) {
  return new Promise((resolve, reject) => {
    Item.findAll({
      where: { category: category }, // Filter by the category
    })
      .then((data) => {
        if (data.length > 0) {
          resolve(data); // Pass the retrieved data to resolve
        } else {
          reject("no results returned"); // No items found for the category
        }
      })
      .catch((err) => {
        reject("no results returned: " + err); // Error occurred
      });
  });
}



function getItemsByMinDate(minDateStr) {
    return new Promise((resolve, reject) => {
        // Use Sequelize's findAll method with a condition on postDate
        Item.findAll({
            where: {
                postDate: {
                    [gte]: new Date(minDateStr), // Filter by postDate greater than or equal to minDateStr
                },
            },
        })
        .then((items) => {
            // If the operation succeeds, resolve the promise with the data
            if (items && items.length > 0) {
                resolve(items);
            } else {
                // If no items are found, reject with a meaningful message
                reject('No results returned');
            }
        })
        .catch((err) => {
            // Handle any error that occurs during the operation
            reject(`Error fetching items: ${err.message || 'no results returned'}`);
        });
    });
}

function getItemById(id) {
  return new Promise((resolve, reject) => {
      // Use Sequelize's findAll method with a condition on id
      Item.findAll({
          where: {
              id: id, // Filter by the specified id
          },
      })
      .then((items) => {
          // Check if items were found
          if (items && items.length > 0) {
              resolve(items[0]); // Resolve with the first object
          } else {
              // If no items found, reject with a meaningful message
              reject('No results returned');
          }
      })
      .catch((err) => {
          // Handle any error that occurs during the operation
          reject(`Error fetching item by ID: ${err.message || 'no results returned'}`);
      });
  });
}
function addCategory(categoryData) {
  return new Promise((resolve, reject) => {
    // Replace any blank fields with null
    for (const key in categoryData) {
      if (categoryData[key] === "") {
        categoryData[key] = null;
      }
    }

    // Create a new category
    Category.create(categoryData)
      .then(() => {
        resolve("Category created successfully");
      })
      .catch((err) => {
        reject("unable to create category: " + err);
      });
  });
}
function deleteCategoryById(id) {
  return new Promise((resolve, reject) => {
    Category.destroy({
      where: { id: id },
    })
      .then((rowsDeleted) => {
        if (rowsDeleted > 0) {
          resolve("Category deleted successfully");
        } else {
          reject("Category not found");
        }
      })
      .catch((err) => {
        reject("unable to delete category: " + err);
      });
  });
}
function deletePostById(id) {
  return new Promise((resolve, reject) => {
    Item.destroy({
      where: { id: id },
    })
      .then((rowsDeleted) => {
        if (rowsDeleted > 0) {
          resolve("Item deleted successfully");
        } else {
          reject("Item not found");
        }
      })
      .catch((err) => {
        reject("unable to delete item: " + err);
      });
  });
}


// Exporting the functions
module.exports = {
  initialize,
  getAllItems,
  getCategories,
  getPublishedItems,
  addItem,
  getItemsByCategory,
  getItemsByMinDate,
  getItemById,
  getPublishedItemsByCategory,
  addCategory,
  deleteCategoryById,
  deletePostById
};