const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const cors = require("cors");
const Joi = require("joi");

// Passport
const passport = require("passport");
const LocalStrategy = require("passport-local").Strategy;
const session = require("express-session");

const app = express();
const port = 3000;

// Enable CORS for a specific origin (replace http://localhost:5173 with your frontend origin)
const corsOptions = {
  // origin: "http://localhost:5173",
  origin: ["http://localhost:5173", "https://library-app-eta-khaki.vercel.app"],
  credentials: true,
};

app.use(cors(corsOptions));

// Use express.json() middleware to parse JSON requests
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Initializing Passport
app.use(
  session({
    secret: "Romania",
    resave: false,
    proxy: true, // Required for Heroku & Digital Ocean (regarding X-Forwarded-For)
    name: "BigDaddyG",
    saveUninitialized: false,

    // For Cloud
    cookie: {
      secure: true, // required for cookies to work on HTTPSs
      httpOnly: false,
      sameSite: "none",
    },

    // // For Localhost
    // cookie: {
    //   httpOnly: true,
    //   sameSite: "strict",
    //   // Add other cookie attributes as needed
    // },
  })
);
app.use(passport.initialize());
app.use(passport.session());
const bcrypt = require("bcrypt");
// Passport local strategy configuration
passport.use(
  new LocalStrategy(
    { usernameField: "email", passwordField: "password" },
    async function (email, password, done) {
      try {
        const user = await userModel.findOne({ email });

        if (!user) {
          return done(null, false, { message: "Email not registered." });
        }
        if (!(await bcrypt.compare(password, user.password))) {
          return done(null, false, { message: "Incorrect password." });
        }

        return done(null, user);
      } catch (error) {
        return done(error);
      }
    }
  )
);

// Passport serialize and deserialize user functions
passport.serializeUser(function (user, done) {
  done(null, user._id);
});

passport.deserializeUser(async function (id, done) {
  try {
    const user = await userModel.findById(id);

    // Check if the user is found
    if (!user) {
      return done(null, false);
    }

    done(null, user);
  } catch (error) {
    done(error);
  }
});

// Importing Models
const userModel = require("./models/user");
const bookModel = require("./models/books");

// Function to connect to MongoDB
async function connectToDB() {
  mongoose
    .connect(
      "mongodb+srv://ahmadnadeemjb:Ahmad@cluster0.hqqhtpr.mongodb.net/BookLibrarySystem?retryWrites=true&w=majority"
    )
    .then(console.log("Connected to DB from index.js"))
    .catch((error) => handleError(error));
}
connectToDB();

// Home
app.get("/", (req, res) => {
  res.send("Home");
});

// Routes for user authentication

// Schema for Register validation
const registerSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(6).max(20).required(),
  username: Joi.string().required(),
});

app.post(
  "/register",
  async (req, res, next) => {
    try {
      // Validate request body
      const { error, value } = registerSchema.validate(req.body);

      if (error) {
        return res.status(400).json({ error: error.details[0].message });
      }

      // If validation passes, proceed to user registration
      return next();
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: "Internal Server Error" });
    }
  },
  async (req, res) => {
    try {
      const { email, password, username } = req.body;

      // Check if the email is already registered
      const existingUser = await userModel.findOne({ email });
      if (existingUser) {
        return res
          .status(400)
          .json({ message: "Email is already registered." });
      }

      // Hash the password before saving it
      const hashedPassword = await bcrypt.hash(password, 10);

      // Create a new user with the hashed password
      const newUser = new userModel({
        email,
        password: hashedPassword,
        username,
      });

      await newUser.save();

      // Log in the user after registration
      req.logIn(newUser, (err) => {
        if (err) {
          return next(err);
        }
        // User logged in successfully
        return res
          .status(201)
          .json({ message: "User registered successfully." });
      });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: "Server Error" });
    }
  }
);

const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(6).max(20).required(),
});

app.post(
  "/login",
  async (req, res, next) => {
    try {
      // Validate request body
      const { error, value } = loginSchema.validate(req.body);
      if (error) {
        return res.status(400).json({
          error: error.details[0].message,
        });
      }

      // If validation passes, proceed to passport authentication
      return next();
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: "Internal Server Error" });
    }
  },
  (req, res, next) => {
    passport.authenticate("local", (err, user, info) => {
      if (err) {
        return next(err);
      }
      if (!user) {
        // Authentication failed
        return res.status(401).json({ error: info.message });
      }
      // Authentication successful, log in the user
      req.logIn(user, (err) => {
        if (err) {
          return next(err);
        }
        // User logged in successfully
        return res.json(user);
      });
    })(req, res, next);
  }
);

app.patch(
  "/update",
  isAuthenticated, // Use the isAuthenticated middleware here
  async (req, res) => {
    try {
      const { username, currentPassword, newPassword, email } = req.body;

      // Get the currently logged-in user
      const currentUser = req.user;

      if (!currentPassword) {
        return res.status(401).json({
          message: "Current password is required to make any changes",
        });
      }

      // Verify the current password
      const isPasswordValid = await bcrypt.compare(
        currentPassword,
        currentUser.password
      );

      if (!isPasswordValid) {
        return res.status(401).json({ message: "Invalid current password." });
      }

      if (!(username || newPassword || email)) {
        return res.status(401).json({ message: "No fields given to update." });
      }

      
      if (email) {
        if (email.toLowerCase() === currentUser.email) {
          return res.status(400).json({
            message: "New email must be different from the current one.",
          });
        }

        // Check if the new email is already registered with another account
        const existingUser = await userModel.findOne({ email });
        if (
          existingUser &&
          existingUser._id.toString() !== currentUser._id.toString()
        ) {
          return res.status(400).json({
            message: "Email is already registered with another account.",
          });
        }

        // Update the email
        currentUser.email = email;
      }

      if (username && username === currentUser.username) {
        // Check if new inputs are the same as old ones
        return res.status(400).json({
          message: "New username must be different from the current one.",
        });
      }

      // Update user information if provided
      if (username) {
        currentUser.username = username;
      }

      if (newPassword) {
        // Check if new password is different from the current one
        if (await bcrypt.compare(newPassword, currentUser.password)) {
          return res.status(400).json({
            message: "New password must be different from the current one.",
          });
        }

        const hashedNewPassword = await bcrypt.hash(newPassword, 10);
        currentUser.password = hashedNewPassword;
      }

      // Save the updated user information
      await currentUser.save();

      return res.json({
        message: "User information updated successfully.",
        user: currentUser,
      });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: "Server Error." });
    }
  }
);

// Logout route
app.get("/logout", (req, res) => {
  // Use passport's built-in logout method
  req.logout(function (err) {
    // Handle any errors
    if (err) {
      console.error(err);
      return res.status(500).json({ error: "Internal Server Error" });
    }

    // Destroy the session
    req.session.destroy(() => {
      // Clear the cookie
      res.clearCookie("BigDaddyG");

      // Redirect to home page
      res.redirect("/");
    });
  });
});

// Delete account route
app.delete("/delete", isAuthenticated, async (req, res) => {
  try {
    // Retrieve a specific user by ID from the database

    const { currentPassword } = req.body;

    // Get the currently logged-in user
    const currentUser = req.user;

    if (!currentUser) {
      // If the user is not found, send a 404 Not Found response
      return res.status(404).json({ error: "User not found" });
    }

    // Verify the current password
    const isPasswordValid = await bcrypt.compare(
      currentPassword,
      currentUser.password
    );

    if (!isPasswordValid) {
      return res.status(401).json({ message: "Invalid current password." });
    }

    // Get the currently logged-in user ID
    const userId = currentUser._id;

    // Delete the user by ID
    await userModel.findByIdAndDelete(userId);

    // Log out the user
    req.logout((err) => {
      // Handle any errors
      if (err) {
        console.error(err);
        return res
          .status(500)
          .json({ error: "Internal Server Error while logging out" });
      }

      // Destroy the session
      req.session.destroy(() => {
        // Clear the cookie
        res.clearCookie("BigDaddyG");

        // Send the JSON response
        return res.status(200).json({ message: "User deleted successfully." });
      });
    });
  } catch (error) {
    // Handle errors and send a 500 Internal Server Error response
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.get("/profile", isAuthenticated, (req, res) => {
  res.json(req.user);
});

function isAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    return next(); // User is authenticated, proceed to the next middleware
  }

  res.status(401).json({ error: "Please logout and login again" });
}

// ----------------Books Endpoints--------------
app.post("/api/book", async (req, res) => {
  try {
    const newBook = await bookModel.create(req.body);
    res.json(newBook);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.put("/api/book/:id", async (req, res) => {
  try {
    const updatedBook = await bookModel.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
      }
    );
    if (!updatedBook) {
      res.status(404).json({ error: "Book not found" });
      return;
    }
    res.json(updatedBook);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.delete("/api/book/:id", async (req, res) => {
  try {
    const deletedBook = await bookModel.findByIdAndDelete(req.params.id);
    if (!deletedBook) {
      res.status(404).json({ error: "Book not found" });
      return;
    }
    res.json(deletedBook);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.get("/api/books", async (req, res) => {
  try {
    // Retrieve all books from the database, populating the 'author' field
    const books = await bookModel.find().populate("author");
    res.json(books);
  } catch (error) {
    // Handle errors and send a 500 Internal Server Error response
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Get a specific book by ID
app.get("/api/books/:id", async (req, res) => {
  try {
    // Retrieve a specific book by ID from the database, populating the 'author' field
    const book = await bookModel.findById(req.params.id).populate("author");
    if (!book) {
      // If the book is not found, send a 404 Not Found response
      res.status(404).json({ error: "Book not found" });
      return;
    }
    res.json(book);
  } catch (error) {
    // Handle errors and send a 500 Internal Server Error response
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Start the server on the specified port
app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
