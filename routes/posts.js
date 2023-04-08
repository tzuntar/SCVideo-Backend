const router = require('express').Router();
const hub = require('hub');
const {authToken} = require('../utils');
const uniqueId = require('uniqid');
const jwt = require("jsonwebtoken");
const path = require("path");
const exists = require('property-exists');

router.get('/feed', authToken, (request, response) => {
    // user limiting disabled for testing purposes
    //const authHeader = request.headers['authorization'];
    //const token = authHeader && authHeader.split(' ')[1];
    //const userId = jwt.decode(token).id_user;
    const {limit, offset} = request.query;
    try {
        // ToDo: consider the following: WHERE p.status = 'ready'
        //  and WHERE u.id_user != $3
        hub.dbPool.query(`
            SELECT p.*,
                   row_to_json(u.*)                                         AS user,
                   (CASE WHEN (count(r.id_reaction) > 0) THEN 1 ELSE 0 END) AS is_liked
            FROM posts p
                     LEFT JOIN users u ON p.id_user = u.id_user
                     LEFT JOIN reactions r ON p.id_post = r.id_post
                AND r.reaction = 'like'
            GROUP BY p.id_post, u.id_user, p.added_on
            ORDER BY p.added_on DESC
            LIMIT $1 OFFSET $2`, [limit ? limit : 2, offset ? offset : 0], (error, results) => {
            if (error) {
                console.log(error.description);
                return response.status(500);
            }
            return response.status(200).json(results.rows);
        });
    } catch (error) {
        return response.status(500).send(error);
    }
})

router.get('/:identifier', authToken, (request, response) => {
    if (request.params.identifier == null)
        return response.status(400).send('invalid identifier');
    hub.dbPool.query(`
        SELECT p.*,
               row_to_json(u.*)                                         AS user,
               (CASE WHEN (count(r.id_reaction) > 0) THEN 1 ELSE 0 END) AS is_liked
        FROM posts p
                 LEFT JOIN users u ON p.id_user = u.id_user
                 LEFT JOIN reactions r ON p.id_post = r.id_post
            AND r.reaction = 'like'
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
    const {content, id_user} = request.body
    if (content == null || id_user == null || isNaN(parseInt(id_user)))
        return response.status(400).send('required parameters missing');
    hub.dbPool.query(
        `INSERT INTO comments (identifier, content, id_post, id_user)
         VALUES ($1, $2, $3, $4)`,
        [uniqueId(), content, id, id_user], (error, results) => {
            if (error) return response.status(500).send(error.message);
            return response.sendStatus(200);
        }
    )
})

router.delete('/:id/comment/:comment', authToken, (request, response) => {
    const id = parseInt(request.params.id);
    if (isNaN(id))
        return response.status(400).send('invalid id');
    const id_comment = request.params.comment
    if (id_comment == null || isNaN(parseInt(id_comment)))
        return response.status(400).send('required parameters missing');
    hub.dbPool.query('DELETE FROM comments WHERE id_comment = $1', [id_comment])
        .then(() => response.sendStatus(200))
        .catch(error => {
            console.log(error.stack)
            response.sendStatus(500)
        });
})

router.post('/:id/like', authToken, (request, response) => {
    const id = parseInt(request.params.id);
    if (isNaN(id))
        return response.status(400).send('invalid id');
    const authHeader = request.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    try {
        const userId = jwt.decode(token).id_user;
        hub.dbPool.query(`
            INSERT INTO reactions (id_post, id_user)
            VALUES ($1, $2)`, [id, userId], (error) => {
            if (exists(error, 'code'))
                if (error.code === '23505') // already liked
                    return response.status(400).send('only one such reaction per post per user allowed')
            if (error)
                return response.status(500).send(error.description);
            response.sendStatus(200);
        });
    } catch (error) {
        return response.status(500).send(error);
    }
})

router.post('/:id/unlike', authToken, (request, response) => {
    const id = parseInt(request.params.id);
    if (isNaN(id))
        return response.status(400).send('invalid id');
    const authHeader = request.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    try {
        const userId = jwt.decode(token).id_user;
        hub.dbPool.query(`DELETE
                          FROM reactions
                          WHERE (id_post = $1)
                            AND (id_user = $2)
                            AND (reaction = $3)`, [id, userId, 'like'], (error) => {
            if (error)
                return response.status(500).send(error.description);
            response.status(200).send('unliked');
        });
    } catch (error) {
        return response.status(500).send(error);
    }
})

router.post('/:type', authToken, (request, response) => {
    try {
        const type = request.params.type;
        if (type == null || !/^photo|video$/.test(type))
            return response.status(400).send('invalid post type');
        if (!request.files)
            return response.status(400).send('file missing');
        const {title, description, id_user} = request.body;
        const identifier = uniqueId();
        if (isNaN(parseInt(id_user)) || title == null)
            return response.status(400).send('required parameters missing or invalid');

        let contentUri = null;
        if (type === 'photo') {
            let photo = request.files.photo;
            let fileName = identifier + '_' + photo.name;
            let filePath = path.join(__dirname, '..', 'public', 'posts', 'photos', fileName);
            photo.mv(filePath);
            contentUri = fileName;
        } else if (type === 'video') {
            let video = request.files.video;
            let fileName = identifier + '_' + video.name;
            let filePath = path.join(__dirname, '..', 'public', 'posts', 'videos', fileName);
            video.mv(filePath);
            contentUri = fileName
        }

        hub.dbPool.query(
            `INSERT INTO posts (identifier, title, description, content_uri, id_user)
             VALUES ($1, $2, $3, $4, $5)`,
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

router.delete('/:id', authToken, (request, response) => {
    const id = parseInt(request.params.id);
    if (isNaN(id))
        return response.status(400).send('invalid id');
    hub.dbPool
        .query('DELETE FROM reactions WHERE id_post = $1', [id])
        .then(() => {
            hub.dbPool.query('DELETE FROM comments WHERE id_post = $1', [id])
                .then(() => {
                    hub.dbPool.query('DELETE FROM posts WHERE id_post = $1', [id])
                        .then(() => response.sendStatus(200))
                        .catch((error) => {
                            console.log(error.stack);
                            return response.sendStatus(500);
                        });
                })
                .catch((error) => {
                    console.log(error.stack);
                    return response.sendStatus(500);
                });
        })
        .catch((error) => {
            console.log(error.stack);
            return response.sendStatus(500);
        });
});

router.use((req, res) => {
    res.status(404).send('Not Found');
});

module.exports = router;
