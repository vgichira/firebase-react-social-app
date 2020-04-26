const functions = require('firebase-functions');
const admin     = require("firebase-admin");
const serviceAccount = require("./serviceKey.json");

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: "https://socialape-8c7de.firebaseio.com"
});

// // Create and Deploy Your First Cloud Functions
// // https://firebase.google.com/docs/functions/write-firebase-functions
//
exports.helloWorld = functions.https.onRequest((request, response) => {
 response.send("Hello World! This is my first firebase function");
});

// get the screams from screams collection

exports.getScreams = functions.https.onRequest((req, res)=>{
    admin.firestore().collection("screams").get()
    .then(docs => {
        let screams = [];

        docs.forEach(doc => {
            screams.push(doc.data())
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

exports.createScream = functions.https.onRequest((req, res)=>{
    if(req.method != "POST"){
        return res.status(400).json({
            status: 400,
            message:"Method not allowed"
        })
    }

    const newScream = {
        body:req.body.body,
        userHandle: req.body.userHandle,
        createdAt: admin.firestore.Timestamp.fromDate(new Date())
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