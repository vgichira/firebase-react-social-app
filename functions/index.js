const functions = require('firebase-functions');
const admin     = require("firebase-admin");
const serviceAccount = require("./serviceKey.json");
const express = require("express");
const app = express();

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: "https://socialape-8c7de.firebaseio.com"
});

// get the screams from screams collection

app.get("/screams", (req, res) => {
    admin
    .firestore()
    .collection("screams")
    .orderBy("createdAt", "desc")
    .get()
    .then(docs => {
        let screams = [];

        docs.forEach(doc => {
            screams.push({
                screamId:doc.id,
                body:doc.data().body,
                userHandle:doc.data().userHandle,
                createdAt:doc.data().createdAt
            })
        })

        res.json({
            status: 200,
            data:screams
        });
    })
    .catch(error => {
        console.error(error)
    });
})

app.post("/scream/new", (req, res)=>{
    const newScream = {
        body:req.body.body,
        userHandle: req.body.userHandle,
        createdAt: new Date().toISOString()
    }

    admin.firestore().collection("screams").add(newScream)
    .then(doc => {
        res.json({
            status: 200,
            message: `New document ${doc.id} created successfully`
        })
    })
    .catch(error=>{
        res.status(500).json({
            status:500,
            message: "Oops! An error occurred while processing request."
        })

        console.error(error)
    })
})

exports.api = functions.https.onRequest(app)