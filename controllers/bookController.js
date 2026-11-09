const Book   = require('../models/Book');
const Author = require('../models/Author');

// Helper: Rule 2 — duplicate title per author, case-insensitive
async function isDuplicateTitle(authorId, title, excludeId = null) {
  const query = {
    author: authorId,
    title: { $regex: `^${escapeRegex(title)}$`, $options: 'i' }
  };
  if (excludeId) query._id = { $ne: excludeId };
  return !!(await Book.findOne(query));
}
function escapeRegex(s) { return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }

// POST /books
exports.createBook = async (req, res) => {
  const { title, genre, price, publishedYear, author } = req.body;

  // Rule 3: business validation (do this first — cheap)
  if (price == null || price <= 0) {
    return res.status(422).json({ error: 'price must be greater than 0' });
  }
  const currentYear = new Date().getFullYear();
  if (publishedYear == null || publishedYear > currentYear || publishedYear < 1450) {
    return res.status(422).json({ error: 'publishedYear must be between 1450 and the current year' });
  }

  // Rule 1: no orphan books
  let authorDoc;
  try {
    authorDoc = await Author.findById(author);
  } catch {
    return res.status(400).json({ error: 'Invalid author id' });
  }
  if (!authorDoc) return res.status(400).json({ error: 'Author does not exist' });

  // Rule 2: no duplicate title per author
  if (await isDuplicateTitle(author, title)) {
    return res.status(409).json({ error: 'This author already has a book with that title' });
  }

  try {
    const book = await Book.create({ title, genre, price, publishedYear, author });
    res.status(201).json(book);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// GET /books — dynamic filter, sort, populate, optional pagination
exports.getBooks = async (req, res) => {
  const { genre, minPrice, maxPrice, author, search, sort, order, page, limit } = req.query;

  // Build filter object dynamically — only add keys that exist
  const filter = {};
  if (genre)  filter.genre = genre;
  if (author) filter.author = author;
  if (search) filter.title = { $regex: search, $options: 'i' };
  if (minPrice || maxPrice) {
    filter.price = {};
    if (minPrice) filter.price.$gte = Number(minPrice);
    if (maxPrice) filter.price.$lte = Number(maxPrice);
  }

  // Sort
  const sortableFields = ['price', 'title', 'publishedYear'];
  const sortField = sortableFields.includes(sort) ? sort : null;
  const sortOrder = order === 'desc' ? -1 : 1;
  const sortObj = sortField ? { [sortField]: sortOrder } : {};

  let query = Book.find(filter).populate('author', 'name country bio').sort(sortObj);

  // Challenge: pagination
  let meta = {};
  if (page || limit) {
    const p = Math.max(1, parseInt(page) || 1);
    const l = Math.max(1, parseInt(limit) || 10);
    const total = await Book.countDocuments(filter);
    query = query.skip((p - 1) * l).limit(l);
    meta = { page: p, limit: l, total };
  }

  const books = await query;
  res.json(Object.keys(meta).length ? { ...meta, results: books } : books);
};

// GET /books/:id
exports.getBookById = async (req, res) => {
  try {
    const book = await Book.findById(req.params.id).populate('author', 'name country bio');
    if (!book) return res.status(404).json({ error: 'Book not found' });
    res.json(book);
  } catch {
    res.status(400).json({ error: 'Invalid book id' });
  }
};

// PUT /books/:id
exports.updateBook = async (req, res) => {
  const { title, price, publishedYear, author } = req.body;

  // Rule 3 (only if provided)
  if (price != null && price <= 0)
    return res.status(422).json({ error: 'price must be greater than 0' });
  const currentYear = new Date().getFullYear();
  if (publishedYear != null && (publishedYear > currentYear || publishedYear < 1450))
    return res.status(422).json({ error: 'publishedYear out of range' });

  try {
    const existing = await Book.findById(req.params.id);
    if (!existing) return res.status(404).json({ error: 'Book not found' });

    // Rule 1 (if author changed)
    const targetAuthor = author || existing.author;
    if (author && !(await Author.findById(author).catch(() => null)))
      return res.status(400).json({ error: 'Author does not exist' });

    // Rule 2 (if title or author changed)
    if ((title && title !== existing.title) || author) {
      if (await isDuplicateTitle(targetAuthor, title || existing.title, existing._id))
        return res.status(409).json({ error: 'Duplicate title for this author' });
    }

    const updated = await Book.findByIdAndUpdate(req.params.id, req.body, {
      new: true, runValidators: true
    }).populate('author', 'name country bio');
    res.json(updated);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// DELETE /books/:id
exports.deleteBook = async (req, res) => {
  try {
    const book = await Book.findByIdAndDelete(req.params.id);
    if (!book) return res.status(404).json({ error: 'Book not found' });
    res.json({ message: 'Book deleted' });
  } catch {
    res.status(400).json({ error: 'Invalid book id' });
  }
};