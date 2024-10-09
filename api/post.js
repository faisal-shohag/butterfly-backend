import { Router } from "express";
import prisma from "../db/db.config.js";
const router = Router();

router.post("/users", async (req, res) => {
  const user = await prisma.user.create({
    data: req.body,
  });
  res.json(user);
});

router.post("/add_book/:id", async (req, res) => {
  // console.log(req.params.id);
  try {
    const userId = req.params.id;
    const {
      title,
      author,
      isbn,
      publishedYear,
      publisher,
      description,
      cover,
      genre,
      lookingFor,
    } = req.body;

    // Validate required fields
    if (!title || !author || !genre) {
      return res
        .status(400)
        .json({ error: "Title, author, and genre are required fields" });
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
        userId,
      },
    });

  

    res.status(201).json({ message: "Book added successfully", book: newBook });
  } catch (error) {
    console.error("Error adding book:", error);
    res.status(500).json({ error: "An error occurred while adding the book" });
  }
});

router.post("/toggle-book-like", async (req, res) => {
  const { userId, bookId } = req.body;

  // console.log("toggle Like", userId)

  try {
    const existingLike = await prisma.bookLike.findUnique({
      where: {
        userId_bookId: {
          userId,
          bookId,
        },
      },
    });

    if (existingLike) {
      // Unlike
      await prisma.bookLike.delete({
        where: { id: existingLike.id },
      });
      res.json({ liked: false });
    } else {
      // Like
      await prisma.bookLike.create({
        data: {
          userId,
          bookId,
        },
      });
      res.json({ liked: true });
    }
  } catch (error) {
    console.error("Error toggling like:", error);
    res
      .status(500)
      .json({ error: "An error occurred while toggling the like" });
  }
});

router.post("/add-coin", async(req, res) => {

  try {
    await prisma.coin.create({
      data: req.body,
    });
    res.status(200).json({ message: "Coin added successfully" });
  } catch (error) {
    console.error("Error adding coin:", error);
    res.status(500).json({ error: "An error occurred while adding the coin" });
  }
})

export default router;
