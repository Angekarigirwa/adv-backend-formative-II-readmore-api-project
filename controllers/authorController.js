const Author = require('../models/Author');
const Book   = require('../models/Book');

// POST /authors
exports.createAuthor = async (req, res) => {
  try {
    const author = await Author.create(req.body);
    res.status(201).json(author);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// GET /authors
exports.getAuthors = async (req, res) => {
  try {
    const authors = await Author.find().sort({ name: 1 });
    res.json(authors);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// GET /authors/:id
exports.getAuthorById = async (req, res) => {
  try {
    const author = await Author.findById(req.params.id);
    if (!author) return res.status(404).json({ error: 'Author not found' });
    res.json(author);
  } catch (err) {
    res.status(400).json({ error: 'Invalid author id' });
  }
};

// PUT /authors/:id
exports.updateAuthor = async (req, res) => {
  try {
    const author = await Author.findByIdAndUpdate(req.params.id, req.body, {
      new: true, runValidators: true
    });
    if (!author) return res.status(404).json({ error: 'Author not found' });
    res.json(author);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// DELETE /authors/:id — Policy A: BLOCK if books exist
exports.deleteAuthor = async (req, res) => {
  try {
    const bookCount = await Book.countDocuments({ author: req.params.id });
    if (bookCount > 0) {
      return res.status(409).json({
        error: `Cannot delete author: ${bookCount} book(s) still assigned.`
      });
    }
    const author = await Author.findByIdAndDelete(req.params.id);
    if (!author) return res.status(404).json({ error: 'Author not found' });
    res.json({ message: 'Author deleted' });
  } catch (err) {
    res.status(400).json({ error: 'Invalid author id' });
  }
};

// GET /authors/:id/books — linking endpoint
exports.getAuthorBooks = async (req, res) => {
  try {
    const author = await Author.findById(req.params.id);
    if (!author) return res.status(404).json({ error: 'Author not found' });
    const books = await Book.find({ author: req.params.id });
    res.json(books);
  } catch (err) {
    res.status(400).json({ error: 'Invalid author id' });
  }
};
// GET /authors/:id/stats
exports.getAuthorStats = async (req, res) => {
  try {
    const author = await Author.findById(req.params.id);
    if (!author) return res.status(404).json({ error: 'Author not found' });

    const books = await Book.find({ author: req.params.id }).sort({ price: 1 });

    if (books.length === 0) {
      return res.json({
        author: author.name,
        bookCount: 0,
        averagePrice: 0,
        cheapestBook: null,
        mostExpensiveBook: null
      });
    }

    const total = books.reduce((sum, b) => sum + b.price, 0);
    res.json({
      author: author.name,
      bookCount: books.length,
      averagePrice: Math.round((total / books.length) * 100) / 100,
      cheapestBook: books[0].title,
      mostExpensiveBook: books[books.length - 1].title
    });
  } catch {
    res.status(400).json({ error: 'Invalid author id' });
  }
};