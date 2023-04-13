const router = require('express').Router();
const hub = require('hub');
const path = require("path");
const {authToken, userIdFromAuthHeader} = require('../utils');
const uniqueId = require('uniqid');

router.get('/feed', authToken, (request, response) => {
    // user limiting disabled for testing purposes
    // const userId = userIdFromAuthHeader(request);
    const {limit, offset} = request.query;
    // ToDo: consider the following: WHERE p.status = 'ready'
    //  and WHERE u.id_user != $3
    hub.dbPool
        .query(`
            SELECT p.*,
                   row_to_json(u.*) AS user,
                   (CASE WHEN (COUNT(r.id_reaction) > 0) THEN 1 ELSE 0 END) AS is_liked
            FROM posts p
            LEFT JOIN users u ON p.id_user = u.id_user
            LEFT JOIN reactions r ON p.id_post = r.id_post AND r.reaction = 'like'
            GROUP BY p.id_post, u.id_user, p.added_on
            ORDER BY p.added_on DESC
            LIMIT $1 OFFSET $2`, [limit ? limit : 2, offset ? offset : 0])
        .then(results => response.json(results.rows))
        .catch(error => {
            console.log(error.stack);
            response.sendStatus(500);
        });
})

router.get('/:identifier', authToken, (request, response) => {
    if (request.params.identifier == null)
        return response.status(400).send('Invalid identifier');
    hub.dbPool
        .query(`
            SELECT p.*,
                   row_to_json(u.*) AS user,
                   (CASE WHEN (COUNT(r.id_reaction) > 0) THEN 1 ELSE 0 END) AS is_liked
            FROM posts p
            LEFT JOIN users u ON p.id_user = u.id_user
            LEFT JOIN reactions r ON p.id_post = r.id_post AND r.reaction = 'like'
            WHERE p.identifier = $1
            GROUP BY p.id_post, u.id_user
            LIMIT 1`, [request.params.identifier])
        .then(results => response.json(results.rows))
        .catch(error => {
            console.log(error.stack);
            response.sendStatus(500);
        });
})

router.get('/:id/comments', authToken, (request, response) => {
    const id = parseInt(request.params.id);
    if (isNaN(id))
        return response.status(400).send('Invalid ID');
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
        return response.status(400).send('Invalid ID');
    const userId = userIdFromAuthHeader(request);
    const content = request.body.content;
    if (content == null || userId == null || isNaN(parseInt(userId)))
        return response.status(400).send('Missing required parameters');
    hub.dbPool
        .query(`INSERT INTO comments (identifier, content, id_post, id_user)
                VALUES ($1, $2, $3, $4)`, [uniqueId(), content, id, userId])
        .then(() => response.sendStatus(200))
        .catch(error => {
            console.log(error.stack);
            response.sendStatus(500);
        });
});

router.delete('/:id/comment/:comment', authToken, (request, response) => {
    const id = parseInt(request.params.id);
    if (isNaN(id))
        return response.status(400).send('Invalid ID');
    const commentId = request.params.comment
    const userId = userIdFromAuthHeader(request);
    if (commentId == null || userId == null || isNaN(parseInt(commentId)))
        return response.status(400).send('Missing required parameters');
    hub.dbPool
        .query(`DELETE FROM comments
                WHERE (id_comment = $1)
                  AND (id_user = $2)`, [commentId, userId])
        .then(() => response.sendStatus(200))
        .catch(error => {
            console.log(error.stack);
            response.sendStatus(500);
        });
});

router.post('/:id/like', authToken, (request, response) => {
    const id = parseInt(request.params.id);
    if (isNaN(id))
        return response.status(400).send('Invalid ID');
    const userId = userIdFromAuthHeader(request);
    hub.dbPool
        .query(`INSERT INTO reactions (reaction, id_post, id_user)
                VALUES ('like', $1, $2)`, [id, userId])
        .then(() => response.sendStatus(200))
        .catch(error => {
            if (error.code === '23505') // already liked
                return response.status(400).send('Only one such reaction per post per user is allowed')
            console.log(error.stack)
            response.sendStatus(500);
        });
});

router.delete('/:id/like', authToken, (request, response) => {
    const id = parseInt(request.params.id);
    if (isNaN(id))
        return response.status(400).send('Invalid ID');
    const userId = userIdFromAuthHeader(request);
    hub.dbPool
        .query(`DELETE FROM reactions
                WHERE (id_post = $1)
                  AND (id_user = $2)
                  AND (reaction = 'like')`, [id, userId])
        .then(() => response.sendStatus(200))
        .catch(error => {
            console.log(error.stack)
            response.sendStatus(500);
        });
});

router.post('/video', authToken, (request, response) => {
    if (!request.files || !request.files.video)
        return response.status(400).send('File missing');
    const {title, description} = request.body;
    if (!title)
        return response.status(400).send('Missing required parameters');
    const identifier = uniqueId();
    const userId = userIdFromAuthHeader(request);
    const video = request.files.video;

    const fileName = identifier + '_' + video.name;
    const filePath = path.join(__dirname, '..', 'public', 'posts', 'videos', fileName);
    video.mv(filePath)
        .then(() => hub.dbPool.query(
            `INSERT INTO posts (identifier, title, description, content_uri, id_user)
             VALUES ($1, $2, $3, $4, $5)`,
             [identifier, title, description, fileName, userId]))
        .then(results => response.json(results.rows[0]))
        .catch(error => {
            console.log(error);
            response.sendStatus(500);
        });
});

router.delete('/:id', authToken, (request, response) => {
    const id = parseInt(request.params.id);
    if (isNaN(id))
        return response.status(400).send('Invalid ID');
    hub.dbPool
        .query('DELETE FROM reactions WHERE id_post = $1', [id])
        .then(() => hub.dbPool.query('DELETE FROM comments WHERE id_post = $1', [id]))
        .then(() => hub.dbPool.query('DELETE FROM posts WHERE id_post = $1', [id]))
        .then(() => response.sendStatus(200))
        .catch(error => {
            console.log(error.stack);
            return response.sendStatus(500);
        });
});

router.use((req, res) => {
    res.status(404).send('Not Found');
});

module.exports = router;
