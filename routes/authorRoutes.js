const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/authorController');

router.get('/:id/stats', ctrl.getAuthorStats);
router.post('/', ctrl.createAuthor);
router.get('/', ctrl.getAuthors);
router.get('/:id/books', ctrl.getAuthorBooks);
router.get('/:id', ctrl.getAuthorById);
router.put('/:id', ctrl.updateAuthor);
router.delete('/:id', ctrl.deleteAuthor);

module.exports = router;