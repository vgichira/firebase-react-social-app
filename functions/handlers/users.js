const {db} = require("../utils/admin");
const { validateSignupData, validateLoginData } = require("../utils/validators");
const firebase = require("firebase");
const configs = require("../utils/configs");

// initialize firebase

firebase.initializeApp(configs);

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
}

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

        if(error.code === "auth/wrong-password"){
            return res.status(200).json({
                general:"Incorrect email or password."
            })
        }

        return res.status(500).json({
            error:error.code
        })
    }
}