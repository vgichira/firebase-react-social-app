const functions = require('firebase-functions');
const admin     = require("firebase-admin");
const serviceAccount = require("./serviceKey.json");
const firebase = require("firebase");
const express = require("express");
const app = express();

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: "https://socialape-8c7de.firebaseio.com"
});

const db = admin.firestore()

const configs = {
    apiKey: "AIzaSyBOKGoTbv-qUn8uzgCFyfiEYdpZ_cVCQfA",
    authDomain: "socialape-8c7de.firebaseapp.com",
    databaseURL: "https://socialape-8c7de.firebaseio.com",
    projectId: "socialape-8c7de",
    storageBucket: "socialape-8c7de.appspot.com",
    messagingSenderId: "380051644460",
    appId: "1:380051644460:web:04b7a005fd9d4846f4b189",
    measurementId: "G-212W7HYVXP"
};

// initialize firebase

firebase.initializeApp(configs);

// get the screams from screams collection

app.get("/screams", (req, res) => {
    db
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

    db
    .collection("screams")
    .add(newScream)
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

// firebase signup route

app.post("/signup", (req, res) => {
    let token, userId;

    const newUser = {
        email:req.body.email,
        password:req.body.password,
        confirmPassword:req.body.confirmPassword,
        handle:req.body.handle
    }

    // TODO validation

    db.doc(`/users/${newUser.handle}`)
    .get()
    .then(doc => {
        if(doc.exists){
            return res.status(400).json({
                status: 400,
                message:`Handle ${newUser.handle} is already taken`
            })
        } else{
            return firebase
            .auth()
            .createUserWithEmailAndPassword(newUser.email, newUser.password)
        }
    })
    .then(data => {
        userId = data.user.uid;

        return data.user.getIdToken()
    })
    .then(idToken => {
        token = idToken

        const userCredentials = {
            handle:newUser.handle,
            email:newUser.email,
            userId,
            createdAt:new Date().toISOString()
        }

        return db.doc(`/users/${newUser.handle}`).set(userCredentials)
    })
    .then(() => {
        res.status(201).json({
            status:200,
            token
        })
    })
    .catch(error => {
        console.error(error)

        if(error.code === "auth/email-already-in-use"){
            return res.status(400).json({
                status: 400,
                message:"Email address is already registered"
            })
        }else{
            return res.status(500).json({
                status:500,
                message:"An error occurred while processing request."
            })
        }
    })
})

exports.api = functions.https.onRequest(app)