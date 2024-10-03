import { Router } from "express";
import prisma from "../db/db.config.js";
const router = Router();

router.get("/users", async (req, res) => {
  try {
    const users = await prisma.user.findMany();
    return res.status(200).json(users);
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

router.get('/check-username/:username', async (req, res) => {
  const { username } = req.params;

  try {
    const user = await prisma.user.findUnique({
      where: { username },
      select: { id: true }, // We only need to know if the user exists, not their details
    });

    if (user) {
      res.json({ exists: true, available: false });
    } else {
      res.json({ exists: false, available: true });
    }
  } catch (error) {
    console.error('Error checking username:', error);
    res.status(500).json({ error: 'Unable to check username availability' });
  }
});

//get single user
router.get("/users/:id", async (req, res) => {
  try {
    const id = req.params.id;
    const user = await prisma.user.findUnique({
      where: {
        id,
      },
      include: {
        posts: true,
        books: true,
      },
    });
    return res.status(200).json(user);
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: "Internal server error" });
  }
});


//get most coined users
router.get("/most-coined-users", async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      include: {
        _count: {
          select: {
            coins: true,
          },
        },
      },
      orderBy: {
        coins: {
          _count: "desc",
        },
      },
      take: 5,
    });
    return res.status(200).json(users);
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: "Internal server error" });
  }
});


//hive hunters
router.get("/hive-hunters", async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      include: {
        _count: {
          select: {
            posts: true,
          },
        },
      },
      orderBy: {
        posts: {
          _count: "desc",
        },
      },
      take: 5,
    });
    return res.status(200).json(users);
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

//get books
router.get("/books", async (req, res) => {
  try {
    const books = await prisma.book.findMany({include:{user: true}});
    return res.status(200).json(books);
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/books/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  try {
    const book = await prisma.book.findUnique({
      where: {
        id,
        
      },
      include:{
        samplePhotos: true,
        user: true,
      }
    });
    return res.status(200).json(book);
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/all_books/:userId", async (req, res) => {
  // console.log(req.params.userId)
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const userId = req.params.userId;

    const books = await prisma.book.findMany({
      include: { 
        user: true,
        likes: true,
      },
      skip,
      take: limit,
      orderBy: { id: 'desc' }
    });

 

    const booksWithLikeInfo = books.map(book => {
      // console.log(book);
      return ({
      ...book,
      isLiked: userId ? book.likes.some(like => like.userId === userId) : false,
      likeCount: book.likes.length,
      likes: undefined, // Remove the likes array from the response
    })});

    const totalBooks = await prisma.book.count();
    const totalPages = Math.ceil(totalBooks / limit);

    return res.status(200).json({
      books: booksWithLikeInfo,
      currentPage: page,
      totalPages,
      totalBooks
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/latest-books/:userId", async (req, res) => {
  try {
    const userId = req.params.userId;

    const books = await prisma.book.findMany({
      include: { 
        user: true,
        likes: true,
      },
      take: 5,
      orderBy: { createdAt: 'desc' }
    });


    const booksWithLikeInfo = books.map(book => {
      return ({
      ...book,
      isLiked: userId ? book.likes.some(like => like.userId === userId) : false,
      likeCount: book.likes.length,
      likes: undefined, // Remove the likes array from the response
    })});



    return res.status(200).json({books: booksWithLikeInfo});
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

//get all posts
router.get("/posts", async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1
    const limit = parseInt(req.query.limit) || 10
    const skip = (page -1) * limit;

    const [posts, totalCount] = await Promise.all([
      prisma.post.findMany({
        skip,
        take: limit,
        orderBy : {
          createdAt : 'desc'
        },
        include :{
          author: true,
          comments: {
            select: {
              id: true,
            },
          },
          likes: {
            select: {
              id: true,
              userId: true,
            },
          },
        }

      }),
      prisma.post.count()
    ])

    return res.json({
      posts: posts,
      currentPage: page,
      totalPages: Math.ceil(totalCount / limit),
      totalCount,
    })
  } catch (error) {
    return res.status(400).json({error: error.message})
  }
  // const posts = await prisma.post.findMany();
  // return res.json(posts);
});

//get single post
router.get("/posts/:authorId", async (req, res) => {
  const authorId = parseInt(req.params.authorId);

  try {
    const post = await prisma.post.findMany({
      where: {
        authorId,
      },
      include: {
        author: true,
        comments: {
          select: {
            id: true,
          },
        },
        likes: {
          select: {
            id: true,
            userId: true,
          },
        },
      },
    });

    return res.json({ status: 200, data: post });
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
});

//get single post comments
router.get("/comment/:postId", async (req, res) => {
  const postId = parseInt(req.params.postId);

  try {
    const comments = await prisma.comment.findMany({
      where: {
        postId,
      },
    });
    return res.json({ status: 200, data: comments });
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
});

export default router;
