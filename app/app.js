// Import express.js
const express = require("express");
const { User } = require("./models/user");


const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const session = require("express-session");

// Create express app
var app = express();

// View engine
app.set("view engine", "pug");
app.set("views", "app/views");

// Add static files location
app.use(express.static("static"));

// Parse JSON payloads for API routes
app.use(express.json());
app.use(express.urlencoded({ extended: true }));



// Get the functions in the db.js file to use
const db = require('./services/db');


app.use(cookieParser());
const oneDay = 1000 * 60 * 60 * 24;
app.use(
  session({
    secret: "digitalmenucard",
    saveUninitialized: true,
    resave: false,
    cookie: { maxAge: oneDay },
  })
);

app.use((req, res, next) => {
  res.locals.uid = req.session.uid;
  res.locals.loggedIn = req.session.loggedIn;
  next();
});

function requireLogin(req, res, next) {
  if (!req.session.loggedIn) return res.redirect("/login");
  next();
}

app.get("/test", requireLogin, (req, res) => {
  res.render("test");
});


app.get("/login", (req, res) => {
  if (req.session.loggedIn) return res.redirect("/test");
  res.render("login");
});


// Create a route for login
app.get("/login", function(req, res) {
    res.render("login");
});

// Create a route for registration
app.get("/register", function(req, res) {
    res.render("register");
});

// Handle signup / set-password
app.post("/set-password", async (req, res) => {
  const { email, username, password } = req.body;
  if (!email || !username || !password) {
    return res.status(400).send("All fields are required.");
  }

  try {
    // Check existing by email or username
    const existing = await db.query(
      "SELECT * FROM Users WHERE email = ? OR username = ?",
      [email, username]
    );
    const user = new User(email, username);

    if (existing.length > 0) {
      // update password for existing
      user.id = existing[0].user_id;
      await user.setUserPassword(password);
      return res.send("Password updated successfully.");
    }

    // create new
    await user.addUser(password);
    res.send("Account created! Please log in.");
  } catch (err) {
    console.error("Error in /set-password:", err);
    res.status(500).send("Internal Server Error");
  }
});

// login 
app.post("/authenticate", async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password)
    return res.status(400).send("Email and password are required.");

  const user = new User(email);

  try {
    const uId = await user.getIdFromEmail();
    if (!uId) return res.status(401).send("Invalid email");

    user.id = uId;
    const match = await user.authenticate(password);
    if (!match) return res.status(401).send("Invalid password");

    req.session.uid = uId;
    req.session.loggedIn = true;
    return res.redirect("/test");
    

  } catch (err) {
    console.error("Error in /authenticate:", err);
    res.status(500).send("Internal Server Error");
  }
});


// logout
app.get("/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) console.error(err);
    res.redirect("/login");
  });
});

// Create a route for /test
app.get("/test", function(req, res) {
    res.render("test");
});


// Start server on port 3000
app.listen(3000,function(){
    console.log(`Server running at http://127.0.0.1:3000/`);
});