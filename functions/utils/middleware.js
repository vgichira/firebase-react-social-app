const { admin, db } = require("./admin");

module.exports = async (req, res, next) => {
    if(!req.headers.authorization || !req.headers.authorization.startsWith("Bearer ")){
        return res.status(401).json({
            status:401,
            message: "Unauthorized"
        })
    }

    try{
        const idToken = req.headers.authorization.split("Bearer ")[1];

        const decodedToken = await admin.auth().verifyIdToken(idToken);
    
        req.user = decodedToken;

        const data = await db.collection("users")
        .where("userId", "==", req.user.uid)
        .limit(1)
        .get();

        req.user.handle = data.docs[0].data().handle

        return next();
    }
    catch(error){
        console.error(error);
        return res.status(500).json(error);
    }
}