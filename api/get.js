import { Router } from "express";
import prisma from "../db/db.config.js";
const router = Router();

router.get("/users", async (req, res) => {
  try {

    const page = parseInt(req.query.page) || 1; 
    const limit = parseInt(req.query.limit) || 10; 

  
    const skip = (page - 1) * limit;

 
    const users = await prisma.user.findMany({
      skip: skip,
      take: limit,
    });

    
    const totalUsers = await prisma.user.count();
    const totalPages = Math.ceil(totalUsers / limit);


    return res.status(200).json({
      users,
      currentPage: page,
      totalPages,
      totalUsers,
    });
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
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const userId = req.params.userId;
    const genre = req.query.category;
    const sortBy = req.query.sortBy || 'latest';
    

    let orderBy = {};
    switch (sortBy) {
      case 'oldest':
        orderBy = { createdAt: 'asc' };
        break;
      case 'alphabetical':
        orderBy = { title: 'asc' };
        break;
      case 'latest':
      default:
        orderBy = { createdAt: 'desc' };
    }

    let where = genre ? { genre } : {};
    where = genre === "all" ? {} : {genre}

    const books = await prisma.book.findMany({
      where,
      include: { 
        user: true,
        likes: true,
        requests: true,
      },
      skip,
      take: limit,
      orderBy
    });

    const booksWithLikeAndRequestInfo = books.map(book => ({
      ...book,
      isLiked: userId ? book.likes.some(like => like.userId === userId) : false,
      likeCount: book.likes.length,
      isRequested: userId ? book.requests.some(request => request.requesterId === userId) : false,
      requestCount: book.requests.length,
      likes: undefined,
      requests: undefined,
    }));

    const totalBooks = await prisma.book.count({ where });
    const totalPages = Math.ceil(totalBooks / limit);

    return res.status(200).json({
      books: booksWithLikeAndRequestInfo,
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


router.get('/my-coins/:userId', async (req, res) => {
  const userId = req.params.userId;
  try {
    const recentCoins = await prisma.coin.findMany({
      where: {
        userId,
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 5,
    });

    const totalCoins = await prisma.coin.aggregate({
      where: {
        userId,
      },
      _sum: {
        value: true,
      },
    });

    return res.json({ 
      status: 200, 
      data: {
        recentCoins,
        totalCoins: totalCoins._sum.value || 0,
      }
    });
  } catch (error) {
    console.error(error);
    return res.status(400).json({ error: error.message });
  }
});




router.get('/my-requests/:userId', async (req, res) => {
  const userId = req.params.userId;
  try {
    const requests = await prisma.request.findMany({
      where: {
        requesterId: userId,
      },
      include: {
        book: true,
        requester: true,
      },
    });

    return res.json({
      status: 200,
      data: requests,
    });
  } catch (error) {
    console.error(error);
    return res.status(400).json({ error: error.message });
  }
});


router.get('/purchasedBooks/:id', async (req, res) => {
  const userId = req.params.id;
  const page = parseInt(req.query.page) || 1; 
  const limit = parseInt(req.query.limit) || 10; 
  const offset = (page - 1) * limit; 

  try {
    
    const totalBooks = await prisma.purchase.count({
      where: {
        userId: userId,
      },
    });

    
    const purchasedBooks = await prisma.purchase.findMany({
      where: {
        userId: userId,
      },
      include: {
        book: true,
      },
      skip: offset, 
      take: limit,  
    });

    return res.json({
      status: 200,
      data: purchasedBooks,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalBooks / limit),
        totalRecords: totalBooks,
      },
    });
  } catch (error) {
    console.error(error);
    return res.status(400).json({ error: error.message });
  }
});


router.get('/my-posts/:userId', async(req, res) => {
  const userId = req.params.userId;
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const [posts, totalCount] = await Promise.all([
      prisma.post.findMany({
        where: {
          authorId: userId,
        },
        skip,
        take: limit,
        orderBy: {
          createdAt: "desc",
        },
        include: {
          author: {
            select: {
              id: true,
              name: true,
              image: true,
              username: true,
              email: true,
              role: true,
              _count: {
                select: {
                  followers: true,
                }
              }
            }
          },
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
          images: true,
        },
      }),
      prisma.post.count({
        where: {
          authorId: userId,
        },
      }),
    ]);

    const formattedPosts = posts.map((post) => ({
      ...post,
      commentCount: post.comments.length,
      likeCount: post.likes.length,
      isLiked: post.likes.some((like) => like.userId === userId),
      comments: undefined,
      likes: undefined,
    }));

    res.json({
      posts: formattedPosts,
      currentPage: page,
      totalPages: Math.ceil(totalCount / limit),
      totalCount,
    });
  } catch (error) {
    console.error("Error fetching user posts:", error);
    res.status(500).json({ error: "An error occurred while fetching user posts" });
  }
});

router.get('/my-books/:userId', async(req, res) => {
  const userId = req.params.userId;
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const genre = req.query.category;
    const sortBy = req.query.sortBy || 'latest';

    let orderBy = {};
    switch (sortBy) {
      case 'oldest':
        orderBy = { createdAt: 'asc' };
        break;
      case 'alphabetical':
        orderBy = { title: 'asc' };
        break;
      case 'latest':
      default:
        orderBy = { createdAt: 'desc' };
    }

    let where = { userId };
    if (genre && genre !== "all") {
      where.genre = genre;
    }

    const books = await prisma.book.findMany({
      where,
      include: { 
        user: true,
        likes: true,
        requests: true,
      },
      skip,
      take: limit,
      orderBy
    });

    const booksWithLikeAndRequestInfo = books.map(book => ({
      ...book,
      isLiked: book.likes.some(like => like.userId === userId),
      likeCount: book.likes.length,
      isRequested: book.requests.some(request => request.requesterId === userId),
      requestCount: book.requests.length,
      likes: undefined,
      requests: undefined,
    }));

    const totalBooks = await prisma.book.count({ where });
    const totalPages = Math.ceil(totalBooks / limit);

    return res.status(200).json({
      books: booksWithLikeAndRequestInfo,
      currentPage: page,
      totalPages,
      totalBooks
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
