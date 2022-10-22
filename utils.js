const hub = require('hub');
const jwt = require('jsonwebtoken');

function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (token == null) return res.sendStatus(401);
    jwt.verify(token, hub.tokenSecret, {algorithm: 'HS256'}, (error, user) => {
        if (error) {
            console.log(error);
            return res.sendStatus(403);
        }
        req.user = user;
        next();
    });
}

module.exports = authenticateToken;
