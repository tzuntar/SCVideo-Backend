const router = require('express').Router();
const hub = require('hub');
const authToken = require('../utils');
const jwt = require("jsonwebtoken");

router.get('/feed', authToken, (request, response) => {
    const authHeader = request.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    try {
        const userId = jwt.decode(token).id_user;
        hub.dbPool.query(`
            SELECT p.*, row_to_json(u.*) AS user
            FROM posts p
                LEFT JOIN users u on p.id_user = u.id_user
            GROUP BY p.id_post, u.id_user`, (error, results) => {
            if (error) return response.status(500).send(error.description);
            response.status(200).json(results.rows);
        });
    } catch (error) {
        console.log(error);
        return response.sendStatus(400);
    }
})

router.get('/:id/comments', authToken, (request, response) => {
    const id = parseInt(request.params.id);
    if (isNaN(id))
        return response.status(400).send('invalid id');
    hub.dbPool.query(`
        SELECT c.*, row_to_json(u.*) AS user
        FROM comments c
        LEFT JOIN users u ON c.id_user = u.id_user
        WHERE c.id_post = $1`, [id], (error, results) => {
        if (error) return response.status(500).send(error.description);
        response.status(200).json(results.rows);
    })
})

module.exports = router;
