const router = require('express').Router();
const hub = require('hub');
const jwt = require("jsonwebtoken");
const uniqueId = require('uniqid');
const authToken = require('../utils');

router.post('/login', (request, response) => {
    const {username, password} = request.body;
    hub.dbPool.query('SELECT * FROM users WHERE username = $1 AND password = $2 LIMIT 1',
        [username, password], (error, results) => {
            if (error) return response.status(500).send(error.description);
            if (results.rows.length !== 1)
                return response.status(400).send('invalid credentials');
            const user = results.rows[0];
            jwt.sign({
                    'id_user': user.id_user,
                    'username': user.username
                }, hub.tokenSecret,
                {algorithm: 'HS256'}, function (error, signed) {
                    hub.tokens.push(signed);
                    return response.status(200).json({
                        'token': signed,
                        'user': user
                    });
                });
        });
});

router.post('/register', (request, response) => {
    const {full_name, username, password} = request.body;
    if (full_name == null || username == null || password == null)
        return response.status(400).send('required parameters missing');

    const identifier = uniqueId();
    hub.dbPool.query('INSERT INTO users (identifier, full_name, username, password) VALUES ($1, $2, $3, $4)',
        [identifier, full_name, username, password], (error, results) => {
            if (error) return response.status(500).send(error.message);

            // query the newly inserted user
            hub.dbPool.query('SELECT * FROM users WHERE username = $1 AND password = $2 LIMIT 1',
                [username, password], (error, results) => {
                    if (error) return response.status(500).send(error.description);
                    if (results.rows.length !== 1)
                        return response.status(400).send('invalid credentials');
                    const user = results.rows[0];
                    jwt.sign({
                            'id_user': user.id_user,
                            'username': user.username
                        }, hub.tokenSecret,
                        {algorithm: 'HS256'}, function (error, signed) {
                            hub.tokens.push(signed);
                            return response.status(200).json({
                                'token': signed,
                                'user': user
                            });
                        });
                });
        });
});

router.post('/logout', authToken, (request, response) => {
    // get the jwt
});

/**
 * array remove
 */
const remove = function (array, value) {
    let index = null;
    while ((index = array.indexOf(value)) !== -1)
        array.splice(index, 1);
    return array;
};

/*router.get('/logout', function (req, res) {
    const token = req.query.token;
    if (hub.tokens.includes(token)) {
        remove(hub.tokens, token);
        return res.status(200).send({
            success: true,
            data: 'user logged out'
        });
    }
    return res.status(200).send({
        success: false,
        data: 'logout failed'
    });
});*/

module.exports = router;
