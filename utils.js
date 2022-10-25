const hub = require('hub');
const jwt = require('jsonwebtoken');

function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (token == null) return res.sendStatus(401);
    try {
        jwt.verify(token, hub.tokenSecret, {algorithm: 'HS256'}, (error, user) => {
            if (error) {
                return res.sendStatus(403);
            }
            req.user = user;
            next();
        });
    } catch (error) {
        console.log(error);
        return res.sendStatus(403);
    }
}

module.exports = authenticateToken;
