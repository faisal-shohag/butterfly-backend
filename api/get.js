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

router.get("/all_books", async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const books = await prisma.book.findMany({
      include: { user: true },
      skip,
      take: limit,
      orderBy: { id: 'desc' }
    });

    const totalBooks = await prisma.book.count();
    const totalPages = Math.ceil(totalBooks / limit);

    return res.status(200).json({
      books,
      currentPage: page,
      totalPages,
      totalBooks
    });
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
  const authorId = req.params.authorId;
  const page = parseInt(req.query.page) || 1
  const limit = parseInt(req.query.limit) || 10
  const skip = (page -1) * limit;

  try {
    const [post, totalCount] = await  Promise.all([
      prisma.post.findMany({
        skip,
        take: limit,
        orderBy : {
          createdAt : 'desc'
        },
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
      }),
      prisma.post.count()
    ])
    return res.json({
      posts: post,
      currentPage: page,
      totalPages: Math.ceil(totalCount / limit),
      totalCount,
    })
    // return res.json({ status: 200, data: post });
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
