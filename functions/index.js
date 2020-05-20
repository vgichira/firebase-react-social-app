const functions = require('firebase-functions');
const express = require("express");
const { getScreams, newScream, getScream, commentScream, likeScream, unlikeScream, deleteScream } = require("./handlers/screams");
const { signupUser, loginUser, uploadImage, addUserDetails, getAuthenticatedUser, getUserDetails } = require("./handlers/users");
const firebaseAuth = require("./utils/middleware");
const { db } = require("./utils/admin");
const { markNotificationRead } = require("./handlers/notifications");

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
// get any user details
app.get("/user/:handle/details", getUserDetails)
// mark notification as read
app.post("/notifications/read", firebaseAuth, markNotificationRead)

exports.api = functions.https.onRequest(app)

// create a notification after liking a scream
exports.createNotificationOnLike = functions.firestore.document("likes/{id}").onCreate(async (snapshot) => {
    try{
        const scream = await db.doc(`/screams/${snapshot.data().screamID}`).get();

        // check if the scream exists
    
        if(scream.exists && scream.data().userHandle !== snapshot.data().userHandle){
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
    
        if(scream.exists && scream.data().userHandle !== snapshot.data().userHandle){
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

// firebase trigger to change the image url on screams after the user image changes

exports.onUserImageChange = functions.firestore.document("users/{userId}").onUpdate( async change => {
    const beforeData = change.before.data();
    const afterData  = change.after.data();

    // only update the image url in case it changes

    if(beforeData.imageUrl !== afterData.imageUrl){
        const batch = db.batch();

        // get the screams

        const screams = await db.collection("screams").where("userHandle", "==", beforeData.handle).get();

        screams.forEach(scream => {
            batch.update(db.doc(`/screams/${scream.id}`), { imageUrl: afterData.imageUrl })
        })

        batch.commit();
    }
})

// firebase trigger to delete comments, likes, and notifications for a scream on delete

exports.onDeleteScream = functions.firestore.document("screams/{screamID}").onDelete( async (snapshot, context) => {
    const screamID = context.params.screamID;
    try {
        const batch = db.batch();

        // delete the comments associated to the scream

        const comments = await db.collection("comments").where("screamID", "==", screamID).get();

        comments.forEach(comment => {
            batch.delete(db.doc(`/comments/${comment.id}`))
        })

        // delete the likes associated to the scream

        const likes = await db.collection("likes").where("screamID", "==", screamID).get();

        likes.forEach(like => {
            batch.delete(db.doc(`/likes/${like.id}`))
        })

        // delete the notifications associated to the scream

        const notifications = await db.collection("notifications").where("screamID", "==", screamID).get();

        notifications.forEach(notification => {
            batch.delete(db.doc(`/notifications/${notification.id}`))
        })

        // commit the changes

        batch.commit();
    } catch (error) {
        console.error(error);
    }
})