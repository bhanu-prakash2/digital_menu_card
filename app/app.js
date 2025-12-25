// Import express.js
const express = require("express");

// Create express app
var app = express();

// View engine
app.set("view engine", "pug");
app.set("views", "app/views");

// Add static files location
app.use(express.static("static"));

// Get the functions in the db.js file to use
const db = require('./services/db');

// Create a route for /test
app.get("/test", function(req, res) {
    res.render("test");
});


// Start server on port 3000
app.listen(3000,function(){
    console.log(`Server running at http://127.0.0.1:3000/`);
});