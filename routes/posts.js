const router = require('express').Router();
const hub = require('hub');
const authToken = require('../utils');
const uniqueId = require('uniqid');
const jwt = require("jsonwebtoken");
const path = require("path");

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
        return response.status(500).send(error);
    }
})

router.get('/:identifier', authToken, (request, response) => {
    if (request.params.identifier == null)
        return response.status(400).send('invalid identifier');
    hub.dbPool.query(`
        SELECT p.*, row_to_json(u.*) AS user
        FROM posts p
                 LEFT JOIN users u on p.id_user = u.id_user
        WHERE p.identifier = $1
        GROUP BY p.id_post, u.id_user
        LIMIT 1`, [request.params.identifier], (error, results) => {
        if (error) return response.status(500).send(error.description);
        response.status(200).json(results.rows);
    });
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

router.post('/:id/comment', authToken, (request, response) => {
    const id = parseInt(request.params.id);
    if (isNaN(id))
        return response.status(400).send('invalid id');
    const { content, id_user } = request.body
    if (content == null || id_user == null || isNaN(parseInt(id_user)))
        return response.status(400).send('required parameters missing');
    hub.dbPool.query(
        `INSERT INTO comments (identifier, content, id_post, id_user) VALUES ($1, $2, $3, $4)`,
        [uniqueId(), content, id, id_user], (error, results) => {
            if (error) return response.status(500).send(error.message);
            return response.sendStatus(200);
        }
    )
})

router.post('/:type', authToken, (request, response) => {
    try {
        const type = request.params.type;
        if (type == null || !/^text|photo|video$/.test(type))
            return response.status(400).send('invalid post type');
        if (type !== 'text' && !request.files)
            return response.status(400).send('file missing');
        const {title, description, id_user} = request.body;
        const identifier = uniqueId();
        if (isNaN(parseInt(id_user)))
            return response.status(400).send('required parameters missing or invalid');

        let contentUri = null;
        if (type === 'photo') {
            let photo = request.files.photo;
            let fileName = identifier + '_' + photo.name;
            let filePath = path.join(__dirname, '..', 'public', 'posts', 'photos', fileName);
            photo.mv(filePath);
            contentUri = hub.topLevelAddress + '/posts/photos/' + fileName;
        } else if (type === 'video') {
            let video = request.files.video;
            let fileName = identifier + '_' + video.name;
            let filePath = path.join(__dirname, '..', 'public', 'posts', 'videos', fileName);
            video.mv(filePath);
            contentUri = hub.topLevelAddress + '/posts/videos/' + fileName
        }

        hub.dbPool.query(
            `INSERT INTO posts (identifier, title, description, content_uri, id_user) VALUES ($1, $2, $3, $4, $5)`,
            [identifier, title, description, contentUri, id_user], (error, results) => {
                if (error) return response.status(500).send(error.message);
                return response.sendStatus(200);
            }
        )
    } catch (error) {
        console.log(error);
        response.status(500).send(error);
    }
})

module.exports = router;
