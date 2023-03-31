const router = require('express').Router();
const hub = require('hub');
const uniqueId = require("uniqid");
const {signAccessToken, signRefreshToken} = require("../utils");

class User {
    constructor(identifier, full_name, username, email, password) {
        this.identifier = identifier;
        this.full_name = full_name;
        this.username = username;
        this.email = email;
        this.password = password;
    }
}

function authenticateAdUser(user) {
    return new Promise((resolve, reject) => {
        hub.dbPool
            .query('CALL insert_if_not_exists($1, $2, $3, $4, $5)',
                [user.identifier, user.full_name, user.username, user.email, user.password])
            .then((results) => {
                if (results.rows.length !== 1)
                    return reject();
                const user = results.rows[0];
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
                console.log(error.stack);
                return reject();
            });
    });
}

router.post('/login', (req, res) => {
    const {full_name, username, email, password} = req.body;
    if (full_name == null || username == null || email == null || password == null)
        return res.status(400).send('Missing required parameters');

    const user = new User(
        req.body.uniqueId || uniqueId(),
        full_name,
        username,
        email,
        password
    );
    authenticateAdUser(user)
        .then((user) => res.json(user))
        .catch((error) => {
            console.log(`AD login attempt failed for user ${username}: ${error}`);
            return res.status(401).send('Invalid credentials');
        });
});

module.exports = router;
