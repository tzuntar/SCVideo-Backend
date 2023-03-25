const router = require('express').Router();
const hub = require('hub');
const uniqueId = require('uniqid');
const authToken = require('../utils');
const jwt = require("jsonwebtoken");
const exists = require("property-exists");

router.get('/', authToken, (request, response) => {
    hub.dbPool.query(`
        SELECT u.*, row_to_json(t.*) AS town
        FROM users u
        LEFT JOIN towns t ON u.id_town = t.id_town`, (error, results) => {
        if (error) return response.status(500).send(error.description);
        response.status(200).json(results.rows);
    });
});

router.get('/followers', authToken, (request, response) => {
    const authHeader = request.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    try {
        const userId = jwt.decode(token).id_user;
        hub.dbPool.query(`
            SELECT u.*, row_to_json(t.*) AS town
            FROM users u
            LEFT JOIN towns t ON u.id_town = t.id_town
            INNER JOIN followers f ON f.id_followed_user = u.id_user
            WHERE f.id_user = $1`, [userId], (error, results) => {
            if (error) return response.status(500).send(error.description);
            response.status(200).json(results.rows);
        });
    } catch (error) {
        return response.status(500).send(error);
    }
});

router.get('/friends', authToken, (request, response) => {
    const authHeader = request.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    try {
        const userId = jwt.decode(token).id_user;
        hub.dbPool.query(`
            SELECT u.*, row_to_json(t.*) AS town
            FROM users u
            LEFT JOIN towns t ON u.id_town = t.id_town
            INNER JOIN followers f ON f.id_user = u.id_user
            WHERE f.id_user = $1`, [userId], (error, results) => {
            if (error) return response.status(500).send(error.description);
            response.status(200).json(results.rows);
        });
    } catch (error) {
        return response.status(500).send(error);
    }
});

router.get('/:id', authToken, (request, response) => {
    const id = parseInt(request.params.id);
    if (isNaN(id))
        return response.status(400).send('invalid id');
    hub.dbPool.query(`
        SELECT u.*, row_to_json(t.*) AS town,
               jsonb_agg(p.*) FILTER (WHERE p.id_post IS NOT NULL) AS posts
        FROM users u
        LEFT JOIN towns t ON u.id_town = t.id_town
        LEFT JOIN posts p on u.id_user = p.id_user
        WHERE u.id_user = $1
        GROUP BY u.id_user, t.* LIMIT 1`, [id], (error, results) => {
        if (error) return response.status(500).send(error.description);
        response.status(200).json(results.rows);
    });
});

router.post('/', authToken, (request, response) => {
    const {full_name, username, password} = request.body;
    const identifier = uniqueId();
    hub.dbPool.query('INSERT INTO users (identifier, full_name, username, password) VALUES ($1, $2, $3, $4)',
        [identifier, full_name, username, password], (error, results) => {
            if (error) return response.status(500).send(error.description);
            response.status(200).json(results.rows);
        });
});

router.put('/:id', authToken, (request, response) => {
    const id = parseInt(request.params.id);
    if (isNaN(id))
        return response.status(400).send('invalid id');
    const {full_name, username, email} = request.body;
    hub.dbPool.query('UPDATE users SET full_name = $1, username = $2, email = $3 WHERE id_user = $4',
        [full_name, username, email, id], (error, results) => {
            if (error) return response.status(500).send(error.description);
            response.status(200).send();
        });
});

router.delete('/:id', authToken, (request, response) => {
    const id = parseInt(request.params.id);
    if (isNaN(id))
        return response.status(400).send('invalid id');
    hub.dbPool.query('DELETE FROM users WHERE id_user = $1', [id], (error, results) => {
        if (error) return response.status(500).send(error.description);
        response.status(200).send();
    });
});

router.post('/:id/add_friend', authToken, (request, response) => {
    const id = parseInt(request.params.id);
    if (isNaN(id))
        return response.status(400).send('invalid id');
    const authHeader = request.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    try {
        const userId = jwt.decode(token).id_user;
        hub.dbPool.query(`
            INSERT INTO friends (id_user, id_followed_user) VALUES ($1, $2)`, [userId, id], (error) => {
            if (exists(error, 'code'))
                if (error.code === '23505') // already friends
                    return response.status(400).send('already followed')
            if (error)
                return response.status(500).send(error.description);
            response.sendStatus(200);
        })
    } catch (error) {
        return response.status(500).send(error);
    }
})

module.exports = router;
