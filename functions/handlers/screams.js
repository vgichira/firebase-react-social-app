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
    const imageUrl = req.user.imageUrl;

    try{
        const newScream = {
            body, 
            userHandle, 
            imageUrl, 
            likeCount: 0, 
            commentCount: 0, 
            createdAt: new Date().toISOString(), 
        }

        const response = await db.collection("screams").add(newScream)

        newScream.id = response.id

        res.status(201).json({
            status:201, 
            scream:newScream
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

        // update the comment count of the scream

        await scream.ref.update({ commentCount: scream.data().commentCount + 1 })

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

// like a scream

exports.likeScream = async (req, res) => {
    try{
        const userHandle = req.user.handle;
        const screamID = req.params.screamID;
    
        const likeDocument = db.collection("likes").where("userHandle", "==", userHandle)
        .where("screamID", "==", screamID).limit(1);
    
        const screamDocument = db.doc(`/screams/${screamID}`);
    
        let screamData;
    
        // check if the scream exists

        const scream = await screamDocument.get();
    
        if(!scream.exists){
            return res.status(404).json({
                status: 404, 
                message:"Resource not found"
            })
        }

        screamData = scream.data();
        screamData.id = scream.id;

        const like = await likeDocument.get()

        if(like.empty){
            db.collection("likes").add({
                createdAt: new Date().toISOString(),
                userHandle: req.user.handle,
                screamID
            })

            screamData.likeCount++;

            screamDocument.update({ likeCount: screamData.likeCount });

            return res.status(200).json({screamData});
        }else{
            return res.status(404).json({ error: "Scream already liked" })
        }
    }
    catch(err){
        console.error(err);
        return res.status(500).json({error: err.code})
    }
}

// unlike a scream

exports.unlikeScream = async (req, res) => {
    try{
        const userHandle = req.user.handle;
        const screamID = req.params.screamID;
    
        const likeDocument = db.collection("likes").where("userHandle", "==", userHandle)
        .where("screamID", "==", screamID).limit(1);
    
        const screamDocument = db.doc(`/screams/${screamID}`);
    
        let screamData;
    
        // check if the scream exists

        const scream = await screamDocument.get();
    
        if(!scream.exists){
            return res.status(404).json({
                status: 404, 
                message:"Resource not found"
            })
        }

        screamData = scream.data();
        screamData.id = scream.id;

        const like = await likeDocument.get()

        if(like.empty){
            return res.status(404).json({ error: "Scream not liked" })
        }else{
            db.doc(`/likes/${like.docs[0].id}`).delete()

            // update the likes count of the scream

            screamData.likeCount--;

            screamDocument.update({likeCount: screamData.likeCount});

            return res.status(200).json({screamData});
        }
    }
    catch(err){
        console.error(err);
        return res.status(500).json({error: err.code})
    }
}

// delete a scream

exports.deleteScream = async (req, res) => {
    const screamID = req.params.screamID;

    if(!screamID){
        return res.status(400).json({ error: "Scream ID is required" });
    }

    try{
        const document = db.doc(`/screams/${screamID}`);

        const scream = await document.get()

        // check if the scream exists

        if(!scream.exists){
            return res.status(404).json({ error: "Scream does not exist" });
        }

        // check if the person deleting the scream is the owner

        if(scream.data().userHandle !== req.user.handle){
            return res.status(401).json({ error: "Unauthorized" })
        }

        // delete the scream

        await document.delete()

        return res.status(200).json({ message: "Scream deleted successfully" });
    }
    catch(err){
        console.error(err);
        return res.status(500).json({ error: err.code });
    }
}