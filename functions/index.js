const functions = require('firebase-functions');
const admin     = require("firebase-admin");
const firebase = require("firebase");
const express = require("express");
const serviceAccount = require("./serviceKey.json");
const app = express();

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: process.env.DATABASE_URL
});

const db = admin.firestore()

const configs = {
    apiKey: process.env.FIREBASE_API_KEY,
    authDomain: process.env.AUTH_DOMAIN,
    databaseURL: process.env.DATABASE_URL,
    projectId: process.env.PROJECT_ID,
    storageBucket: process.env.STORAGE_BUCKET,
    messagingSenderId: process.env.MESSAGING_SENDER_ID,
    appId: process.env.APP_ID,
    measurementId: process.env.MEASUREMENT_ID
};

// initialize firebase

firebase.initializeApp(configs);

// get the screams from screams collection

app.get("/screams", async (req, res) => {
    try{
        let data = [];

        const screams = await db.collection("screams").orderBy("createdAt", "desc").get()

        screams.forEach(scream => {
            return data.push({
                screamId:scream.id,
                body:scream.data().body,
                userHandle:scream.data().userHandle,
                createdAt:scream.data().createdAt
            })
        })

        res.status(200).json({
            status:200,
            data
        })
    }
    catch(error){
        console.error(error)
        res.status(500).json({
            status:500,
            message:error
        })
    }
})

app.post("/scream/new", async (req, res) => {
    const body = req.body.body;
    const userHandle = req.body.userHandle;

    try{

        const newScream = {
            body,
            userHandle,
            createdAt: new Date().toISOString()
        }
    
        const response = await db.collection("screams").add(newScream)
        
        res.status(201).json({
            status:201,
            message:`New document ${response.id} created successfully`
        })
    }
    catch(error) {
        res.status(500).json({
            status:500,
            message: "Oops! An error occurred while processing request."
        })

        console.error(error)
    }
})

// check if the email is valid

const isValidEmail = (email) => {
    const emailRegEx = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;

    if(email.match(emailRegEx)) return true;
}

// firebase signup route

app.post("/signup", (req, res) => {
    let token, userId;

    const newUser = {
        email:req.body.email,
        password:req.body.password,
        confirmPassword:req.body.confirmPassword,
        handle:req.body.handle
    }

    // check if the email has been provided
    let errors = {};

    if(!newUser.email){
        errors.email = "Email address is required";
    } else if(!isValidEmail(newUser.email)){
        errors.email = "Please enter a valid email";
    }

    // validate handle

    if(!newUser.handle) errors.handle = "User handle is required";

    // validate password

    if(!newUser.password) errors.password = "Password is required.";

    // check if both password and confirm password match

    if(newUser.password !== newUser.confirmPassword) errors.confirmPassword = "Passwords do not match";

    if(Object.keys(errors).length > 0) return res.status(400).json(errors);

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