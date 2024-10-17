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

router.post('/toggle-book-request', async (req, res) => {
  const { userId, bookId, message } = req.body;

  try {
    const existingRequest = await prisma.request.findFirst({
      where: {
        requesterId: userId,
        bookId: bookId,
      },
    });

    if (existingRequest) {
      // Cancel request
      await prisma.request.delete({
        where: { id: existingRequest.id },
      });

      const requestCount = await prisma.request.count({
        where: { bookId: bookId },
      });

      res.json({ requested: false, requestCount });
    } else {
      // Create new request
      await prisma.request.create({
        data: {
          requesterId: userId,
          bookId: bookId,
          message: message,
          status: 'pending',
        },
      });

      const requestCount = await prisma.request.count({
        where: { bookId: bookId },
      });

      res.json({ requested: true, requestCount });
    }
  } catch (error) {
    console.error('Error toggling book request:', error);
    res.status(500).json({ error: 'An error occurred while processing your request' });
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

router.post('/deduct-coins/:userId', async (req, res) => {
  const { userId } = req.params;
  const { amount, reason } = req.body;

  if (!amount || amount <= 0) {
    return res.status(400).json({ error: "Invalid amount. Please provide a positive number." });
  }

  try {
    // Start a transaction
    const result = await prisma.$transaction(async (prisma) => {
      // Get the current coin balance
      const currentBalance = await prisma.coin.aggregate({
        where: { userId },
        _sum: { value: true }
      });

      const totalCoins = currentBalance._sum.value || 0;

      // Check if the user has enough coins
      if (totalCoins < amount) {
        throw new Error("Insufficient coins");
      }

      // Create a new Coin record for the deduction
      const deduction = await prisma.coin.create({
        data: {
          type: 'deduction',
          reason: reason || 'Coin deduction',
          value: -amount, // Store as a negative value
          userId: userId
        }
      });

      // Calculate new balance
      const newBalance = totalCoins - amount;

      return { deduction, newBalance };
    });

    res.status(200).json({
      message: "Coins deducted successfully",
      deductedAmount: amount,
      newBalance: result.newBalance,
      deductionRecord: result.deduction
    });

  } catch (error) {
    console.error("Error deducting coins:", error);
    if (error.message === "Insufficient coins") {
      return res.status(400).json({ error: "Insufficient coins for this transaction" });
    }
    res.status(500).json({ error: "An error occurred while deducting coins" });
  }
});


export default router;
