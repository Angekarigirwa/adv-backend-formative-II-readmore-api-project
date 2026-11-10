# ReadMore API — Express + MongoDB (Mongoose)

A RESTful API for a bookstore, built with Express.js, MongoDB Atlas, and Mongoose. It manages Authors and Books with a one-to-many relationship, enforcing several business rules.

## 🎥 Video Walkthrough
[Watch the implementation walkthrough here] https://youtu.be/bzxHxpVlj8g

## 📁 Project Architecture & Folder Structure

```text
readmore-api/
├── .env                  # MongoDB connection string and port (ignored by Git)
├── .gitignore            # Ignores node_modules and .env
├── server.js             # App entry point: connects to DB & mounts routes
├── models/               # Mongoose schemas
│   ├── Author.js
│   └── Book.js
├── controllers/          # Business logic (where the rules live)
│   ├── authorController.js
│   └── bookController.js
└── routes/               # Maps URLs to controller functions
    ├── authorRoutes.js
    └── bookRoutes.js

🚀 Step-by-Step Implementation Guide
Setup: Initialized Node.js, installed express, mongoose, dotenv, and nodemon.

Connection: Configured server.js to connect to MongoDB Atlas via .env before starting the Express server.

Models: Created Author and Book schemas. The Book schema uses mongoose.Schema.Types.ObjectId with ref: 'Author' to link them.

Author CRUD: Built controllers for POST, GET, PUT, DELETE on /authors.

Book CRUD: Built controllers for POST, GET, PUT, DELETE on /books, using .populate('author') on reads.

Business Rules: Implemented all Part 4 rules in the controllers (see below).

🧠 Business Rules & Critical Thinking
All of these are enforced in the controllers (not just the schema):

Rule	Status Code	Implementation Detail
No Orphan Books	400 Bad Request	Before saving a book, the controller checks Author.findById(author). A fake ID is still a valid ObjectId, so required: true on the schema isn't enough.
No Duplicate Titles per Author	409 Conflict	Uses a case-insensitive regex ($options: 'i') scoped to the specific author ID. Two different authors can have the same title, but the same author cannot.
Price & Year Validation	422 Unprocessable Entity	Rejects price <= 0 and publishedYear > currentYear or < 1450.
Delete Policy (Option A: Block)	409 Conflict	I chose to block the delete. Why? A real bookstore's book records are historical sales data. Cascade-deleting (Option B) would break any order records referencing that book. Blocking forces an admin to consciously handle the books first. Downside: It's inconvenient — you must delete books manually before deleting an author.
Search & Filter	200 OK	GET /books dynamically builds a query object from optional params (genre, minPrice, maxPrice, author, search, sort, order). Only present params are applied.
Author Stats	200 OK	GET /authors/:id/stats computes book count, average price, and cheapest/most expensive titles. If the author has no books, it returns 0 / null instead of crashing.
Pagination (Challenge)	200 OK	GET /books?page=1&limit=5 returns { page, limit, total, results }.
🛠️ How to Run and Test the Project
Prerequisites
Node.js 18+

A MongoDB Atlas account (free tier works)

1. Installation
bash
git clone <your-repo-url>
cd adv-backend-formative-II-readmore-api-project
npm install
2. Environment Variables
Create a .env file in the root directory:

env
MONGO_URI=mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/readmore?retryWrites=true&w=majority
PORT=3000
3. Run the Server
bash
npm run dev
Server should log: MongoDB connected successfully and Server running on port 3000.

4. Testing
Use Postman (or curl). A sample workflow:

POST /authors with { "name": "Nishimwe Naomi", "country": "Rwanda", "bio": "..." } → copy the _id.

POST /books with { "title": "...", "genre": "...", "price": 25, "publishedYear": 2021, "author": "<the _id>" }.

GET /books → verify the author field is populated with the full object.

📚 API Endpoint Reference Summary
Authors
Method	Endpoint	Description
POST	/authors	Create a new author
GET	/authors	Get all authors
GET	/authors/:id	Get one author by ID
PUT	/authors/:id	Update an author
DELETE	/authors/:id	Delete an author (blocked if they have books)
GET	/authors/:id/books	Get all books by this author
GET	/authors/:id/stats	Get book count, avg price, cheapest/most expensive
Books
Method	Endpoint	Description
POST	/books	Create a book (requires valid author ID)
GET	/books	Get all books (supports dynamic filters, sort, pagination)
GET	/books/:id	Get one book by ID
PUT	/books/:id	Update a book
DELETE	/books/:id	Delete a book
Query Parameters for GET /books
genre — filter by genre

minPrice / maxPrice — filter by price range

author — filter by author ID

search — case-insensitive title search

sort — price, title, or publishedYear

order — asc or desc

page / limit — pagination
