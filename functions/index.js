const functions = require('firebase-functions');
const express = require("express");
const { getScreams, newScream, getScream, commentScream, likeScream, unlikeScream, deleteScream } = require("./handlers/screams");
const { signupUser, loginUser, uploadImage, addUserDetails, getAuthenticatedUser } = require("./handlers/users");
const firebaseAuth = require("./utils/middleware");

const app = express();

// get the screams from screams collection
app.get("/screams", firebaseAuth, getScreams)
// create a new scream
app.post("/scream/new", firebaseAuth, newScream)
// get one scream
app.get("/scream/:screamID", getScream)

// add a new comment on a scream
app.post("/scream/:screamID/comment", firebaseAuth, commentScream)

// like a scream route
app.get("/scream/:screamID/like", firebaseAuth, likeScream)
// unlike a scream
app.get("/scream/:screamID/unlike", firebaseAuth, unlikeScream)

// delete a scream
app.delete("/scream/:screamID", firebaseAuth, deleteScream);

// firebase signup route
app.post("/signup", signupUser)
// create the login route
app.post("/login", loginUser)
// upload image
app.post("/user/image", firebaseAuth , uploadImage)
// add user details
app.post("/user", firebaseAuth, addUserDetails)
// get authenticated user data
app.get("/user", firebaseAuth, getAuthenticatedUser)

exports.api = functions.https.onRequest(app)