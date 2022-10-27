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
            SELECT p.*, row_to_json(u.*) AS user,
                jsonb_agg(c.*) FILTER (WHERE c.id_comment IS NOT NULL) AS comments
            FROM posts p
                LEFT JOIN comments c on p.id_post = c.id_post
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

module.exports = router;
