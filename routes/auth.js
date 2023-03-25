const router = require('express').Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const hub = require("hub");
const uniqueId = require('uniqid');
const {JWT_SECRET, REFRESH_SECRET} = process.env;

function signAccessToken(user) {
    return jwt.sign({
        'id_user': user.id_user,
        'username': user.username
    }, JWT_SECRET, {expiresIn: '1h'});
}

function signRefreshToken(user) {
    return jwt.sign({
        'id_user': user.id_user,
        'username': user.username
    }, REFRESH_SECRET);
}

function authenticateUser(username, password) {
    return new Promise((resolve, reject) => {
        hub.dbPool
            .query('SELECT u.* FROM users u WHERE (u.username = $1)', [username])
            .then((results) => {
                if (results.rows.length !== 1)
                    return reject('User not found');
                const user = results.rows[0];
                if (!bcrypt.compareSync(password, user.password))
                    return reject('Invalid credentials');
                const accessToken = signAccessToken(user);
                const refreshToken = signRefreshToken(user);
                if (!accessToken || !refreshToken)
                    reject();
                return resolve({accessToken, refreshToken});
            })
            .catch((error) => {
                console.log(error.stack)
                return reject();
            });
    });
}

function registerUser(full_name, username, password) {
    const pass = bcrypt.hashSync(password);
    return new Promise((resolve, reject) => {
        hub.dbPool
            .query(`INSERT INTO users (identifier, full_name, username, password)
                    VALUES ($1, $2, $3, $4)`, [uniqueId(), full_name, username, pass])
            .then(() => resolve())
            .catch((error) => {
                console.log(error.stack)
                return reject();
            });
    });
}

router.post('/login', (req, res) => {
    const {username, password} = req.body;
    if (username == null || password == null)
        return res.status(400).send('Missing required parameters');

    authenticateUser(username, password)
        .then((tokens) => res.json(tokens))
        .catch((error) => {
            console.log(`Login attempt failed for user ${username}: ${error}`);
            return res.status(401).send('Invalid credentials');
        });
});

router.post('/register', (req, res) => {
    const {full_name, username, password} = req.body;
    if (full_name == null || username == null || password == null)
        return res.status(400).send('Missing required parameters');

    registerUser(full_name, username, password)
        .then(() => authenticateUser(username, password))
        .catch((error) => {
            console.log(`Registration attempt failed for user ${username}: ${error}`);
            return res.status(401).send('Registration failed');
        })
        .then((tokens) => res.json(tokens))
        .catch(() => res.status(500));
});

router.post('/refresh', (req, res) => {
    const refreshToken = req.body.token;
    if (!refreshToken)
        return res.sendStatus(401);
    jwt.verify(refreshToken, REFRESH_SECRET, (error, user) => {
        if (error)
            return res.sendStatus(403);
        const accessToken = signAccessToken(user);
        res.json({accessToken});
    });
});

module.exports = router;