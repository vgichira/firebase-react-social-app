const { admin, db } = require("../utils/admin");
const { validateSignupData, validateLoginData, reduceUserData } = require("../utils/validators");
const firebase = require("firebase");
const configs = require("../utils/configs");
const path = require("path");
const os = require("os");
const fs = require("fs");
const Busboy = require("busboy");

// initialize firebase

firebase.initializeApp(configs);

// signup user
exports.signupUser = async (req, res) => {
    let token, userId;

    const newUser = {
        email:req.body.email,
        password:req.body.password,
        confirmPassword:req.body.confirmPassword,
        handle:req.body.handle
    }

    const { valid, errors } = validateSignupData(newUser);

    if(!valid) return res.status(400).json(errors);

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
            handle: newUser.handle,
            email: newUser.email,
            imageUrl: `https://firebasestorage.googleapis.com/v0/b/socialape-8c7de.appspot.com/o/no-image.png?alt=media&token=35585b89-1747-4173-9a12-b80734fb2467`,
            userId,
            createdAt: new Date().toISOString()
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
                general:"An error occurred while processing request." 
            })
        }
    })
}

// login user
exports.loginUser = async (req, res) => {
    const email = req.body.email;
    const password = req.body.password;

    const user = {
        email,
        password
    }

    const { valid, errors } = validateLoginData(user);

    if(!valid) return res.status(400).json(errors);

    try{
        const response = await firebase.auth().signInWithEmailAndPassword(email, password);

        const token = await response.user.getIdToken();

        return res.status(200).json({token});
    }
    catch(error){
        console.error(error);

        if(error.code === "auth/wrong-password" || error.code === "auth/user-not-found"){
            return res.status(500).json({
                general:"Incorrect email or password."
            })
        }

        return res.status(500).json({
            error:error.code
        })
    }
}

// add user details
exports.addUserDetails = (req, res)=>{
    const userDetails = reduceUserData(req.body);

    db.doc(`/users/${req.user.handle}`).update(userDetails)
    .then(() => {
        return res.status(200).json({message: "Details updated successfully"})
    })
    .catch(err => {
        console.error(err)
        return res.status(500).json({error: err.code})
    })
}

// get authenticated user data
exports.getAuthenticatedUser = async (req, res) => {
    let userData = {};

    try{
        const doc = await db.doc(`/users/${req.user.handle}`).get();

        if(doc.exists){
            userData.credentials = doc.data();
        }

        const likes = await db.collection("likes").where("userHandle", "==", req.user.handle).get();

        userData.likes = [];

        likes.forEach(like => {
            userData.likes.push(like.data())
        })

        const userNotifs = await db.collection("notifications")
        .where("recipient", "==", req.user.handle).orderBy("createdAt", "desc").limit(10).get();

        userData.notifications = [];

        userNotifs.forEach(notif => {
            const notifData = notif.data();

            userData.notifications.push({
                recipient:notifData.recipient, 
                sender: notifData.sender, 
                createdAt: notifData.createdAt, 
                screamID: notifData.screamID, 
                type: notifData.type, 
                read: notifData.read, 
                notificationID: notif.id 
            })
        })
    
        return res.status(200).json(userData);
    }
    catch(err){
        console.error(err);
        return res.status(500).json({error: err.code})
    }
}

// upload user image
exports.uploadImage = (req, res) => {
    const busboy = new Busboy({headers: req.headers})

    let imageFileName;
    let imageToBeUploaded = {};

    busboy.on("file", (fieldname, file, filename, encoding, mimetype) => {
        if(mimetype !== "image/jpeg" || mimetype !== "image/png"){
            return res.status(400).json({error: "Please upload an image file."})
        }

        const imageExt = filename.split(".")[filename.split(".").length - 1];

        imageFileName = `${Math.round(Math.random()*1000000)}.${imageExt}`;
        const filepath = path.join(os.tmpdir(), imageFileName);
        imageToBeUploaded = {filepath, mimetype};

        file.pipe(fs.createWriteStream(filepath))
    })

    busboy.on("finish", () => {
        admin.storage().bucket().upload(imageToBeUploaded.filepath, {
            resumable:false,
            metadata:{
                metadata:{
                    contentType: imageToBeUploaded.mimetype
                }
            }
        })
        .then(() => {
            const imageUrl = `https://firebasestorage.googleapis.com/v0/b/${configs.storageBucket}/o/${imageFileName}?alt=media`
            return db.doc(`/users/${req.user.handle}`).update({ imageUrl })
        })
        .then(()=>{
            return res.status(201).json({message: "Image uploaded successfully"})
        })
        .catch(err => {
            console.error(err);
            return res.status(500).json({error: err.code})
        })
    })
    busboy.end(req.rawBody);
}

// get any user details
exports.getUserDetails = async (req, res) => {
    const userHandle = req.params.handle;

    if(!userHandle){
        return res.status(400).json({
            status:400,
            message:"User handle is required"
        })
    }

    let userData = {};
    try {
        const userDetails = await db.doc(`/users/${userHandle}`).get()

        // check if the user exists

        if (!userDetails.exists){
            return res.status(404).json({
                status:404,
                message: "Resource not found"
            })
        }

        userData.user = userDetails.data();

        // get the user's screams

        const screams = await db.collection("screams").where("userHandle", "==", userHandle).orderBy("createdAt", "desc").get();

        userData.userScreams = [];

        screams.forEach(scream => {
            const screamData = scream.data();

            userData.userScreams.push({
                body: screamData.body, 
                imageUrl: screamData.imageUrl, 
                userHandle: screamData.userHandle, 
                commentCount: screamData.commentCount, 
                likeCount: screamData.likeCount,
                screamID: scream.id, 
                createdAt: screamData.createdAt, 
            })
        })

        return res.status(200).json(userData);
    } catch (error) {
        console.error(error);
        return res.status(500).json({error: error.code});
    }


}