// Import required modules
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs'); // Import bcryptjs

// Create a Schema variable
const Schema = mongoose.Schema;

// Define the User Schema
const userSchema = new Schema({
  userName: { type: String, unique: true }, // Must be unique
  password: String,                         // Plain text or hashed password
  email: String,                            // User's email
  loginHistory: [                           // Array of login history objects
    {
      dateTime: Date,                       // Date of login
      userAgent: String                     // Browser or client information
    }
  ]
});

// Declare User model placeholder
let User;

// Exported functions
module.exports = {
  // Initialize function to connect to MongoDB and define the User model
  initialize: function () {
    return new Promise((resolve, reject) => {
      const db = mongoose.createConnection("mongodb+srv://khushiofficial7305:Am3H0YmRU3nbBaDy@cluster0.jcnuq.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0");
      db.on('error', (err) => {
        console.error("MongoDB connection error:", err); // Log errors
        reject(err); // Reject the promise if there is a connection error
      });

      db.once('open', () => {
        console.log("MongoDB connection successful!"); // Log successful connection
        User = db.model("users", userSchema); // Define the model based on userSchema
        resolve(); // Resolve the promise to indicate successful connection
      });
    });
  },

  // Function to register a new user
  registerUser: function (userData) {
    return new Promise((resolve, reject) => {
      // Check if passwords match
      if (userData.password !== userData.password2) {
        reject("Passwords do not match");
        return;
      }

      // Hash the password using bcrypt
      bcrypt
        .hash(userData.password, 10) // Generate a hash with 10 salt rounds
        .then((hash) => {
          // Replace the plain text password with the hashed version
          userData.password = hash;

          // Remove the password2 field as it's not needed for storage
          delete userData.password2;

          // Create a new user instance with the hashed password
          let newUser = new User(userData);

          // Save the user to the database
          newUser
            .save()
            .then(() => resolve())
            .catch((err) => {
              if (err.code === 11000) {
                reject("User Name already taken");
              } else {
                reject("There was an error creating the user: " + err);
              }
            });
        })
        .catch(() => {
          reject("There was an error encrypting the password");
        });
    });
  },

  // Function to authenticate a user
  checkUser: function (userData) {
    return new Promise((resolve, reject) => {
      // Find user by userName
      User.find({ userName: userData.userName })
        .then((users) => {
          if (users.length === 0) {
            reject("Unable to find user: " + userData.userName);
            return;
          }

          // Compare the entered password with the hashed password
          bcrypt
            .compare(userData.password, users[0].password)
            .then((isMatch) => {
              if (isMatch) {
                // Update login history
                users[0].loginHistory.push({
                  dateTime: new Date().toString(),
                  userAgent: userData.userAgent
                });

                // Save the updated login history
                User.updateOne(
                  { userName: users[0].userName },
                  { $set: { loginHistory: users[0].loginHistory } }
                )
                  .then(() => resolve(users[0])) // Resolve with the user object
                  .catch((err) => {
                    reject("There was an error verifying the user: " + err); // Error while updating login history
                  });
              } else {
                reject("Incorrect Password for user: " + userData.userName);
              }
            })
            .catch((err) => reject("Error comparing passwords: " + err));
        })
        .catch(() => {
          reject("Unable to find user: " + userData.userName); // Error during user search
        });
    });
  }
};
