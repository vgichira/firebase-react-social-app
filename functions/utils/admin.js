const admin     = require("firebase-admin");
const serviceAccount = require("../serviceKey.json");
require("dotenv").config();

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: process.env.DATABASE_URL
});

const db = admin.firestore()

module.exports = {
    admin,
    db
}