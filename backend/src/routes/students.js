const express = require('express');
const c = require('../controllers/students');

const router = express.Router();

// Express 4 doesn't catch rejected promises, so forward them to the error handler.
const wrap = (fn) => (req, res, next) => fn(req, res, next).catch(next);

router.get('/', wrap(c.list));
router.get('/:id', wrap(c.get));
router.post('/', wrap(c.create));
router.put('/:id', wrap(c.update));
router.delete('/:id', wrap(c.remove));

module.exports = router;
