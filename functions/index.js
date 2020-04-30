const functions = require('firebase-functions');
const express = require("express");
const { getScreams, newScream } = require("./handlers/screams");
const { signupUser, loginUser } = require("./handlers/users");
const firebaseAuth = require("./utils/middleware");

const app = express();

// get the screams from screams collection
app.get("/screams", firebaseAuth, getScreams)

// create a new scream
app.post("/scream/new", firebaseAuth, newScream)

// firebase signup route
app.post("/signup", signupUser)

// create the login route
app.post("/login", loginUser)

exports.api = functions.https.onRequest(app)