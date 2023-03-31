const jwt = require('jsonwebtoken');

function authToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token)
        return res.sendStatus(401);
    jwt.verify(token, process.env.JWT_SECRET, (error, user) => {
        if (error)
            return res.sendStatus(403);
        req.user = user;
        next();
    });
}

function signAccessToken(user) {
    return jwt.sign({
        'id_user': user.id_user,
        'username': user.username
    }, process.env.JWT_SECRET, {expiresIn: '1h'});
}

function signRefreshToken(user) {
    return jwt.sign({
        'id_user': user.id_user,
        'username': user.username
    }, process.env.REFRESH_SECRET);
}

module.exports = {authToken, signAccessToken, signRefreshToken};
