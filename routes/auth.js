const router = require('express').Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const hub = require("hub");
const uniqueId = require('uniqid');
const {signAccessToken, signRefreshToken} = require('../utils');

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
                return resolve({
                    user: user,
                    token: {accessToken, refreshToken}
                });
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
        .then((user) => res.json(user))
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
        .then((user) => res.json(user))
        .catch(() => res.status(500));
});

router.post('/refresh', (req, res) => {
    const refreshToken = req.body.token;
    if (!refreshToken)
        return res.sendStatus(401);
    jwt.verify(refreshToken, process.env.REFRESH_SECRET, (error, user) => {
        if (error)
            return res.sendStatus(403);
        const accessToken = signAccessToken(user);
        res.json({accessToken, refreshToken});
    });
});

router.use((req, res) => {
    res.status(404).send('Not Found');
});

module.exports = router;