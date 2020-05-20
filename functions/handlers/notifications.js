const { db } = require("../utils/admin");

// mark notification as read

exports.markNotificationRead = async (req, res) => {
    if(!req.body){
        return res.status(400).json({
            status: 400,
            message:"Notification ID is required"
        })
    }

    try {
        const batch = db.batch();

        // loop over the notifications and mark them ad read

        req.body.forEach(notificationId => {
            const notification = db.doc(`/notifications/${notificationId}`);

            batch.update(notification, { read: true});
        })

        await batch.commit();

        return res.json({
            status: 200, 
            message:"Notifications marked as read"
        })
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            status: 500,
            message: error.code
        })
    }
}