import { Router } from "express";
import prisma from "../db/db.config.js";
const router = Router();

router.put('/users/:id', async (req, res) => {
  try {
    const id = req.params.id;
    const updatedUser = await prisma.user.update({
      where: { id: id },
      data: req.body,
    });
    return res.status(200).json(updatedUser);
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: "Internal server error" });
  }
})


router.post('/add_book/:id', async (req, res) => {
  try {
    const userId = req.params.id;
    const { title, author, isbn, publishedYear, publisher, description, cover, genre, lookingFor } = req.body;


    if (!title || !author || !genre) {
      return res.status(400).json({ error: 'Title, author, and genre are required fields' });
    }
    
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
        userId: parseInt(userId, 10)  
      }
    });

    res.status(201).json({ message: 'Book added successfully', book: newBook });
  } catch (error) {
    console.error('Error adding book:', error);
    res.status(500).json({ error: 'An error occurred while adding the book' });
  }
});



export default router;