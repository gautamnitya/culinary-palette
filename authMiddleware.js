const jwt = require('jsonwebtoken');
require('dotenv').config();

const authMiddleware = (req, res, next) => {
    // Get the token from the Authorization header
    const token = req.headers['authorization']?.split(' ')[1];  // 'Bearer <token>'

    if (!token) {
        return res.status(401).json({ message: 'No token provided' });
    }

    jwt.verify(token, process.env.SECRET_KEY, (err, decoded) => {
        if (err) {
            
            if (err.name === 'TokenExpiredError') {
                return res.status(401).json({ message: 'Token has expired' });
            }
            // If other error, send a 403 Forbidden error
            return res.status(403).json({ message: 'Failed to authenticate token' });
        }

        // If token is valid, attach the decoded user info to the request object
        req.user = decoded;  // decoded contains the user id and email from the token
        next();  // Proceed to the next middleware or route handler
    });
};

module.exports = authMiddleware;
