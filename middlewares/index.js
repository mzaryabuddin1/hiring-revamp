const jwt = require('jsonwebtoken');
const Admin_users = require('../models/Admin_users');

const adminAuth = (req, res, next) => {
    try {

        // Check if the Authorization header exists in the request
        if (!req.headers || !req.headers.authorization) { return res.status(401).json({ error: "Authorization header is required!" }); }

        // Extract the token from the Authorization header
        const authHeader = req.headers.authorization;

        // Split the header value to separate the token
        const token = authHeader.split(' ')[1]; // Assuming Bearer token is used

        // const token = req.cookies.access_token
        if (!token)
            return res.status(401).json({ error: "Authentication token is required!" });

        jwt.verify(token, process.env.ADMIN_ACCESS_TOKEN_SECRET, async (err, user) => {
            if (err)
                return res.status(401).json({ error: "Invalid Authentication!" });

            req.user = user
            const { id } = user

            // Find the user record based on the _id from the token
            try {
                const record = await Admin_users.findById(id)
                if (!record) 
                    return res.status(404).json({ error: "User does not exist!" });


                if (!record.status)
                    return res.status(403).json({ error: "Account status is blocked." });

                next();
            } catch (err) {
                return res.status(500).json({ error: "An internal server error occurred. Please try again later."  });
            }

        })
    } catch (err) {
        console.log("Authentication Error: " , err.message);
        return res.status(500).json({ error: "An internal server error occurred. Please try again later."  });
    }
}

module.exports = adminAuth

