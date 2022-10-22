const router = require('express').Router();
const hub = require('hub');
const uniqueId = require('uniqid');
const authToken = require('../utils');

router.get('/', (request, response) => {
    hub.dbPool.query('SELECT * FROM users', (error, results) => {
        if (error) return response.status(500).send(error.description);
        response.status(200).json(results.rows);
    });
});

router.get('/:id', authToken, (request, response) => {
    const id = parseInt(request.params.id);
    if (isNaN(id))
        return response.status(400).send('invalid id');
    hub.dbPool.query('SELECT * FROM users WHERE id_user = $1 LIMIT 1', [id], (error, results) => {
        if (error) return response.status(500).send(error.description);
        response.status(200).json(results.rows);
    });
});

router.post('/', (request, response) => {
    const {full_name, username, password} = request.body;
    const identifier = uniqueId();
    hub.dbPool.query('INSERT INTO users (identifier, full_name, username, password) VALUES ($1, $2, $3, $4)',
        [identifier, full_name, username, password], (error, results) => {
            if (error) return response.status(500).send(error.description);
            response.status(200).json(results.rows);
        });
});

router.put('/:id', (request, response) => {
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

router.delete('/:id', (request, response) => {
    const id = parseInt(request.params.id);
    if (isNaN(id))
        return response.status(400).send('invalid id');
    hub.dbPool.query('DELETE FROM users WHERE id_user = $1', [id], (error, results) => {
        if (error) return response.status(500).send(error.description);
        response.status(200).send();
    });
});

module.exports = router;
