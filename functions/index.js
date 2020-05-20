const functions = require('firebase-functions');
const express = require("express");
const { getScreams, newScream, getScream, commentScream, likeScream, unlikeScream, deleteScream } = require("./handlers/screams");
const { signupUser, loginUser, uploadImage, addUserDetails, getAuthenticatedUser } = require("./handlers/users");
const firebaseAuth = require("./utils/middleware");
const { db } = require("./utils/admin");

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

// create a notification after liking a scream
exports.createNotificationOnLike = functions.firestore.document("likes/{id}").onCreate(async (snapshot) => {
    try{
        const scream = await db.doc(`/screams/${snapshot.data().screamID}`).get();

        // check if the scream exists
    
        if(scream.exists){
            await db.doc(`/notifications/${snapshot.id}`).set({
                recipient: scream.data().userHandle,
                sender: snapshot.data().userHandle,
                read: false,
                screamID: scream.id,
                type: "like",
                createdAt: new Date().toISOString()
            })
            return;
        }
    }
    catch(err){
        console.error(err);
        return;
    }
})

// delete notification after unliking a scream
exports.deleteNotificationOnUnlike = functions.firestore.document("likes/{id}").onDelete(snapshot => {
    try{
        db.doc(`/notifications/${snapshot.id}`).delete();
        return;
    }
    catch(err){
        console.error(err);
        return;
    }
})

// create a notification after commenting on a scream
exports.createNotificationOnComment = functions.firestore.document("comments/{id}").onCreate(async (snapshot) => {
    try{
        const scream = await db.doc(`/screams/${snapshot.data().screamID}`).get();

        // check if the scream exists
    
        if(scream.exists){
            await db.doc(`/notifications/${snapshot.id}`).set({
                recipient: scream.data().userHandle,
                sender: snapshot.data().userHandle,
                read: false,
                screamID: scream.id,
                type: "comment",
                createdAt: new Date().toISOString()
            })
            return
        }
    }
    catch(err){
        console.error(err);
        return
    }
})