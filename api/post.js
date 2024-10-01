import { Router } from 'express'
import prisma from '../db/db.config.js'
const router = Router()

router.post('/users', async (req, res) => {
    const user = await prisma.user.create({
        data: req.body
    })
    res.json(user)
})


router.post('/add_book/:id', async (req, res) => {
    // console.log(req.params.id);
    try {
      const userId = req.params.id;
      const { title, author, isbn, publishedYear, publisher, description, cover, genre, lookingFor } = req.body;
  
      // Validate required fields
      if (!title || !author || !genre) {
        return res.status(400).json({ error: 'Title, author, and genre are required fields' });
      }
  
      // Create the book
      const newBook = await prisma.book.create({
        data: {
          title,
          author,
          isbn,
          publishedYear,
          publisher,
          description,
          cover,
          genre,
          lookingFor,
          userId  
        }
      });
  
      res.status(201).json({ message: 'Book added successfully', book: newBook });
    } catch (error) {
      console.error('Error adding book:', error);
      res.status(500).json({ error: 'An error occurred while adding the book' });
    }
  });



export default router