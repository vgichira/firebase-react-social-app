const { db } = require("../utils/admin");

// get screams

exports.getScreams = async (req, res) => {
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
}

// post a new scream

exports.newScream = async (req, res) => {
    const body = req.body.body;
    const userHandle = req.user.handle;

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
}