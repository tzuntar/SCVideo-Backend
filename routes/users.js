const router = require('express').Router();
const hub = require('hub');
const uniqueId = require('uniqid');
const {authToken, userIdFromAuthHeader} = require('../utils');
const path = require("path");

router.get('/', authToken, (request, response) => {
    hub.dbPool
        .query('SELECT * FROM users')
        .then(results => response.json(results.rows))
        .catch((error) => {
            console.log(error.stack);
            response.sendStatus(500);
        });
});

router.post('/', authToken, (request, response) => {
    const {full_name, username, password} = request.body;
    const identifier = uniqueId();
    hub.dbPool
        .query(`
            INSERT INTO users (identifier, full_name, username, password)
            VALUES ($1, $2, $3, $4)`, [identifier, full_name, username, password])
        .then(results => response.json(results.rows))
        .catch((error) => {
            console.log(error.stack);
            response.sendStatus(500);
        });
});

router.post('/avatar', authToken, (request, response) => {
    if (!request.files || !request.files.photo)
        return response.status(400).send('File missing');
    const userId = userIdFromAuthHeader(request);

    const photo = request.files.photo;
    const fileName = uniqueId() + '_' + photo.name;
    const filePath = path.join(__dirname, '..', 'public', 'images', 'profile', fileName);
    photo.mv(filePath)
        .then(() => hub.dbPool.query(`
            UPDATE users
            SET photo_uri = $1
            WHERE id_user = $2
            RETURNING *`, [fileName, userId]))
        .then(results => response.json(results.rows[0]))
        .catch(error => {
            console.log(error.stack);
            response.sendStatus(500);
        });
});

router.get('/friends', authToken, (request, response) => {
    const userId = userIdFromAuthHeader(request);
    hub.dbPool
        .query(`
            SELECT u.*
            FROM users u
            INNER JOIN followers f ON f.id_user = u.id_user
            WHERE f.id_user = $1`, [userId])
        .then(results => response.json(results.rows))
        .catch(error => {
            console.log(error.stack);
            response.sendStatus(500);
        });
});

router.get('/followers', authToken, (request, response) => {
    const userId = userIdFromAuthHeader(request);
    hub.dbPool
        .query(`
            SELECT u.*
            FROM users u
                     INNER JOIN followers f ON f.id_followed_user = u.id_user
            WHERE f.id_user = $1`, [userId])
        .then(results => response.json(results.rows))
        .catch(error => {
            console.log(error.stack);
            response.sendStatus(500);
        });
});

router.get('/strangers', authToken, (request, response) => {
    const userId = userIdFromAuthHeader(request);
    hub.dbPool
        .query(`
            SELECT * FROM users
            WHERE id_user NOT IN (
                SELECT id_followed_user
                FROM followers
                WHERE id_user = $1
            ) AND id_user != $1;`, [userId])
        .then(results => response.json(results.rows))
        .catch(error => {
            console.log(error.stack);
            response.sendStatus(500);
        });
});

router.put('/bio', authToken, (request, response) => {
    const userId = userIdFromAuthHeader(request);
    const {bio} = request.body;
    if (!bio) return response.status(400).send('Missing required parameters');
    hub.dbPool
        .query(`
            UPDATE users
            SET bio = $1
            WHERE id_user = $2
            RETURNING *`, [bio, userId])
        .then(results => response.json(results.rows[0]))
        .catch(error => {
            console.log(error.stack);
            response.sendStatus(500);
        });
});

router.get('/:id', authToken, (request, response) => {
    const id = parseInt(request.params.id);
    if (isNaN(id))
        return response.status(400).send('Invalid ID');
    hub.dbPool
        .query(`
            SELECT u.*,
                   jsonb_agg(p.*)      FILTER (WHERE p.id_post IS NOT NULL) AS posts
            FROM users u
            LEFT JOIN posts p on u.id_user = p.id_user
            WHERE u.id_user = $1
            GROUP BY u.id_user, t.* LIMIT 1`, [id])
        .then(results => response.json(results.rows))
        .catch((error) => {
            console.log(error.stack);
            response.sendStatus(500);
        });
});

router.put('/:id', authToken, (request, response) => {
    const id = parseInt(request.params.id);
    if (isNaN(id))
        return response.status(400).send('Invalid ID');
    const {full_name, username, email} = request.body;
    hub.dbPool
        .query(`
            UPDATE users
            SET full_name = $1,
                username = $2,
                email = $3
            WHERE id_user = $4`, [full_name, username, email, id])
        .then(() => response.sendStatus(200))
        .catch((error) => {
            console.log(error.stack);
            response.sendStatus(500);
        });
});

router.delete('/:id', authToken, (request, response) => {
    const id = parseInt(request.params.id);
    if (isNaN(id))
        return response.status(400).send('Invalid ID');
    hub.dbPool
        .query('DELETE FROM users WHERE id_user = $1', [id])
        .then(() => response.sendStatus(200))
        .catch((error) => {
            console.log(error.stack);
            response.sendStatus(500);
        });
});

router.get('/:id/posts', authToken, (request, response) => {
    const id = parseInt(request.params.id);
    if (isNaN(id))
        return response.status(400).send('Invalid ID');
    hub.dbPool
        .query(`
            SELECT p.*,
                row_to_json(u.*) AS user,
                (CASE WHEN (count(r.id_reaction) > 0) THEN 1 ELSE 0 END) AS is_liked
            FROM posts p
            LEFT JOIN users u ON p.id_user = u.id_user
            LEFT JOIN reactions r ON p.id_post = r.id_post AND r.reaction = 'like'
            WHERE p.id_user = $1
            GROUP BY p.id_post, u.id_user, p.added_on
            ORDER BY p.added_on DESC`, [id])
        .then(results => response.json(results.rows))
        .catch((error) => {
            console.log(error.stack);
            response.sendStatus(500);
        });
});

router.post('/:id/friend', authToken, (request, response) => {
    const id = parseInt(request.params.id);
    if (isNaN(id))
        return response.status(400).send('Invalid ID');
    const userId = userIdFromAuthHeader(request);

    hub.dbPool
        .query(`
            INSERT INTO friends (id_user, id_followed_user)
            VALUES ($1, $2)`, [userId, id])
        .then(() => response.sendStatus(200))
        .catch((error) => {
            if (error.code === '23505') // already friends
                return response.status(400).send('User is already a friend')
            console.log(error.stack);
            response.sendStatus(500);
        });
});

router.delete('/:id/friend', authToken, (request, response) => {
    const id = parseInt(request.params.id);
    if (isNaN(id))
        return response.status(400).send('Invalid ID');
    const userId = userIdFromAuthHeader(request);

    hub.dbPool
        .query(`
            DELETE FROM friends
            WHERE id_user = $1 AND id_followed_user = $2`, [userId, id])
        .then(() => response.sendStatus(200))
        .catch((error) => {
            console.log(error.stack);
            response.sendStatus(500);
        });
});

router.use((req, res) => {
    res.status(404).send('Not Found');
});

module.exports = router;
