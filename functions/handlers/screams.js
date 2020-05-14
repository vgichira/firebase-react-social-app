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

// get one scream with the scream ID

exports.getScream = async (req, res) => {
    try{
        let screamData = {};

        const screamID = req.params.screamID
        const scream = await db.doc(`/screams/${screamID}`).get();
    
        if(!scream.exists){
            return res.status(404).json({error: "Resource not found"})
        }
    
        screamData = scream.data();
        screamData.id = screamID;
    
        const screamComments = await db.collection("comments")
        .orderBy("createdAt", "desc")
        .where("screamID", "==", screamID)
        .get();
        
        screamData.comments = [];
    
        screamComments.forEach(comment => {
            screamData.comments.push(comment.data())
        })
    
        return res.status(200).json({screamData});
    }
    catch(err){
        console.error(err);
        return res.status(500).json({error: err.code});
    }
}

// comment on a scream

exports.commentScream = async (req, res) => {
    try{
        const screamID = req.params.screamID;

        const newComment = {
            screamID, 
            userHandle: req.user.handle, 
            userImage: req.user.imageUrl,
            body: req.body.comment, 
            createdAt: new Date().toISOString(),
        }
    
        if(!newComment.body){
            return res.status(400).json({error: "Comment is required"});
        }

        // check if the scream exists

        const scream = await db.doc(`/screams/${screamID}`).get()

        if(!scream.exists){
            return res.status(404).json({error:"Scream does not exist"})
        }
    
        // add the comment

        const response = await db.collection("comments").add(newComment);

        return res.status(201).json({
            status: 201, 
            comment:newComment 
        })
    }
    catch(err){
        console.error(err);
        return res.status(500).json({error: err.code});
    }

}