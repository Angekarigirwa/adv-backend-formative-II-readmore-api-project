require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const authorRoutes = require('./routes/authorRoutes'); 

const app = express();
app.use(express.json());

// Health check
app.get('/', (req, res) => {
  res.json({ status: 'ReadMore API is running' });
});

// THIS IS THE CRITICAL LINE
app.use('/authors', authorRoutes); 

const PORT = process.env.PORT || 3000;

mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log('MongoDB connected successfully');
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  })
  .catch(err => {
    console.error('DB connection failed:', err.message);
    process.exit(1);
  });