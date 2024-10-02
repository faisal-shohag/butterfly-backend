import { Router } from 'express'
import prisma from '../db/db.config.js'
const router = Router()

import ImageKit from "imagekit";

const imageKit = new ImageKit({
  publicKey: "public_Vh5nLR3Jrm4T8zA+77I+lh7nZSY=",
  privateKey: "private_NmXzE7tSS12GF17YPjVqGuEolgM=",
  urlEndpoint: "https://ik.imagekit.io/britto",
});

// Updated Post routes
router.post("/posts", async (req, res) => {
  try {
    const { content, authorId, images, type } = req.body;
    const post = await prisma.post.create({
      data: {
        content,
        type,
        authorId: authorId,
        images: {
          create: images.map(({ url, fileId }) => ({ url, fileId })),
        },
      },
      include: { images: true },
    });
    res.json(post);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});


// get top 5 posts

router.get('/get-popular-posts', async (req, res) => {
  try {
    const popularPosts = await prisma.post.findMany({
      orderBy: {
        likes: {
          _count: 'desc',
        },
      },
      take: 5,
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
        images: true,
        // type: true,
      },
    });

    const formattedPosts = popularPosts.map((post) => {
      return ({
      ...post,
      commentCount: post.comments.length,
      likeCount: post.likes.length,
      isLiked: post.likes.some((like) => like.userId === req.userId),
      comments: undefined,
      likes: undefined,
    })});

    res.json(formattedPosts);
  } catch (error) {
    console.error('Error fetching popular posts:', error);
    res.status(500).json({ error: 'An error occurred while fetching popular posts' });
  }
})

router.get("/allposts/:userId", async (req, res) => {
  const userId = req.params.userId;
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const [posts, totalCount] = await Promise.all([
      prisma.post.findMany({
        skip,
        take: limit,
        orderBy: {
          createdAt: "desc",
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
          images: true,
          // type: true,
        },
      }),
      prisma.post.count(),
    ]);

  
    const formattedPosts = posts.map((post) => {
      return ({
      ...post,
      commentCount: post.comments.length,
      likeCount: post.likes.length,
      isLiked: post.likes.some((like) => like.userId === userId),
      comments: undefined,
      likes: undefined,
    })});

    res.json({
      posts: formattedPosts,
      currentPage: page,
      totalPages: Math.ceil(totalCount / limit),
      totalCount,
    });
  } catch (error) {
    console.error("Error fetching posts:", error);
    res.status(500).json({ error: "An error occurred while fetching posts" });
  }
});

router.get("/user-posts/:userId", async (req, res) => {
  const userId = req.params.userId;
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const [posts, totalCount] = await Promise.all([
      prisma.post.findMany({
        where: { authorId: userId },
        skip,
        take: limit,
        orderBy: {
          createdAt: "desc",
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
          images: true,
          // type: true,
        },
      }),
      prisma.post.count(),
    ]);

  
    const formattedPosts = posts.map((post) => {
      return ({
      ...post,
      commentCount: post.comments.length,
      likeCount: post.likes.length,
      isLiked: post.likes.some((like) => like.userId === userId),
      comments: undefined,
      likes: undefined,
    })});

    res.json({
      posts: formattedPosts,
      currentPage: page,
      totalPages: Math.ceil(totalCount / limit),
      totalCount,
    });
  } catch (error) {
    console.error("Error fetching posts:", error);
    res.status(500).json({ error: "An error occurred while fetching posts" });
  }
});

router.post("/posts/:postId/toggle-like", async (req, res) => {
  try {
    const { postId } = req.params;
    const userId = req.body.userId; // Assuming you have user authentication middleware
    // console.log(userId);

    const existingLike = await prisma.like.findFirst({
      where: {
        userId: userId,
        postId: parseInt(postId),
        commentId: null,
        replyId: null,
      },
    });

    if (existingLike) {
      // Unlike
      await prisma.like.delete({
        where: { id: existingLike.id },
      });
    } else {
      // Like
      await prisma.like.create({
        data: {
          user: { connect: { id: userId } },
          post: { connect: { id: parseInt(postId) } },
        },
      });
    }

    // Get updated like count
    const updatedPost = await prisma.post.findUnique({
      where: { id: parseInt(postId) },
      include: { likes: { select: { id: true } } },
    });

    res.json({
      liked: !existingLike,
      likeCount: updatedPost.likes.length,
    });
  } catch (error) {
    console.error("Error toggling like:", error);
    res.status(500).json({ error: "An error occurred while toggling like" });
  }
});

router.delete("/posts/:postId/:userId", async (req, res) => {
  const { postId } = req.params;
  const userId = req.params.userId; // Assuming you have user authentication middleware

  try {
    // Use a transaction for database operations
    await prisma.$transaction(async (prisma) => {
      // Find the post
      const post = await prisma.post.findUnique({
        where: { id: parseInt(postId) },
        include: { 
          images: true,
          comments: {
            include: { images: true }
          }
        },
      });

      // Check if the post exists and belongs to the user
      if (!post) {
        throw new Error("Post not found");
      }
      if (post.authorId !== userId) {
        throw new Error("You are not authorized to delete this post");
      }

      // Collect all images to delete (post images and comment images)
      const allImages = [
        ...post.images,
        ...post.comments.flatMap(comment => comment.images)
      ];

      // Delete images from ImageKit.io
      const deleteImagePromises = allImages.map((image) => {
        return new Promise((resolve) => {
          if (!image.fileId) {
            console.error(`No fileId found for image: ${image.url}`);
            resolve({ success: false, url: image.url });
            return;
          }

          imageKit.deleteFile(image.fileId, (error, result) => {
            if (error) {
              console.error(`Failed to delete image ${image.fileId}:`, error);
              resolve({ success: false, url: image.url });
            } else {
              resolve({ success: true, url: image.url });
            }
          });
        });
      });

      const deleteResults = await Promise.all(deleteImagePromises);

      // Log results of image deletions
      deleteResults.forEach((result) => {
        if (result.success) {
          console.log(`Successfully deleted image: ${result.url}`);
        } else {
          console.log(`Failed to delete image: ${result.url}`);
        }
      });

      // Delete the post and associated data from the database
      // This will cascade delete comments, images, and likes due to the onDelete: Cascade in your schema
      await prisma.post.delete({
        where: { id: parseInt(postId) },
      });
    });

    res.json({ message: "Post, associated comments, and all images deleted successfully" });
  } catch (error) {
    console.error("Error deleting post, comments, and images:", error);
    res.status(500).json({
      error: error.message || "An error occurred while deleting the post, comments, and images",
    });
  }
});

//get Single post
router.get("/post/:id/:userId", async (req, res) => {
  const userId = req.params.userId;
  try {
    const postId = parseInt(req.params.id);

    if (isNaN(postId)) {
      return res.status(400).json({ error: "Invalid post ID" });
    }

    const post = await prisma.post.findUnique({
      where: { id: postId },
      include: {
        author: true,
        comments: {
          include: {
            author: true,
            images: true,
            likes: true, // Fetch the likes related to the comment
          },
          orderBy: {
            createdAt: "desc",
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
    });

    if (!post) {
      return res.status(404).json({ error: "Post not found" });
    }

    // Format the post and include the likes count for each comment
    const formattedPost = {
      ...post,
      commentCount: post.comments.length,
      // likes: post.likes.map((like) => like.userId),
      likeCount: post.likes.length, // Only return user IDs who liked the post
      isLiked: post.likes.find((like) => like.userId === userId),
      comments: post.comments.map((comment) => ({
        ...comment,
        likesCount: comment.likes.length, // Count the number of likes for each comment
      })),
    };


    // console.log(formattedPost);

    res.json(formattedPost);
  } catch (error) {
    console.error("Error fetching single post:", error);
    res
      .status(500)
      .json({ error: "An error occurred while fetching the post" });
  }
});



// comments
router.post("/posts/:postId/comments", async (req, res) => {
  try {
    const { postId } = req.params;
    const { content, userId, images } = req.body;

    const newComment = await prisma.comment.create({
      data: {
        content,
        postId: parseInt(postId),
        authorId: userId,
        images: {
          create: images.map(({ url, fileId }) => ({ url, fileId })),
        },
      },
      include: {
        author: true,
        images: true,
      },
    });

    // Update post's commentCount
    // await prisma.post.update({
    //   where: { id: parseInt(postId) },
    //   data: { commentCount: { increment: 1 } },
    // });

    res.status(201).json(newComment);
  } catch (error) {
    console.error("Error adding comment:", error);
    res.status(500).json({ error: "An error occurred while adding the comment" });
  }
});

//get comments
router.get("/posts/:postId/:userId/comments", async (req, res) => {
  try {
    const { postId } = req.params;
    const { page = 1, limit = 10 } = req.query;

    const skip = (page - 1) * limit;

    const comments = await prisma.comment.findMany({
      where: { postId: parseInt(postId) },
      include: {
        author: {
          select: {
            id: true,
            displayName: true,
            photoURL: true,
          },
        },
        images: true,
        likes: true,
        replies: {
          include: {
            author: {
              select: {
                id: true,
                displayName: true,
                photoURL: true,
              },
            },
            likes: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip: parseInt(skip),
      take: parseInt(limit),
    });

    const totalComments = await prisma.comment.count({
      where: { postId: parseInt(postId) },
    });

    const commentsWithLikeInfo = comments.map(comment => ({
      ...comment,
      likeCount: comment.likes.length,
      isLiked: comment.likes.some(like => like.userId === req.params.userId),
      commentCount: comment.replies.length, // Add the count of replies
      replies: comment.replies.map(reply => ({
        ...reply,
        likeCount: reply.likes.length,
        isLiked: reply.likes.some(like => like.userId === req.params.userId),
      })),
    }));

    res.json({
      comments: commentsWithLikeInfo,
      totalComments,
      currentPage: parseInt(page),
      totalPages: Math.ceil(totalComments / limit),
    });
  } catch (error) {
    console.error("Error fetching comments:", error);
    res.status(500).json({ error: "An error occurred while fetching comments" });
  }
});


// Add comment like endpoint
router.post("/comments/:commentId/toggle-like", async (req, res) => {
  try {
    const { commentId } = req.params;
    const userId = req.body.userId;

    const existingLike = await prisma.like.findFirst({
      where: {
        commentId: parseInt(commentId),
        userId: userId,
      },
    });

    if (existingLike) {
      await prisma.like.delete({
        where: { id: existingLike.id },
      });
    } else {
      await prisma.like.create({
        data: {
          comment: { connect: { id: parseInt(commentId) } },
          user: { connect: { id: userId } },
        },
      });
    }

    const updatedComment = await prisma.comment.findUnique({
      where: { id: parseInt(commentId) },
      include: {
        likes: true,
      },
    });

    const likeCount = await prisma.like.count({
      where: { commentId: parseInt(commentId) },
    });

    res.json({
      likesCount: updatedComment.likes.length,
      liked: !existingLike,
    });
    // console.log(updatedComment)
  } catch (error) {
    console.error("Error toggling comment like:", error);
    res.status(500).json({ error: "An error occurred while toggling the comment like" });
  }
});

// Add reply endpoint
router.post("/comments/:commentId/replies", async (req, res) => {
  try {
    const { commentId } = req.params;
    const { content, userId } = req.body;

    const newReply = await prisma.comment.create({
      data: {
        content,
        authorId: userId,
        parentId: parseInt(commentId),
        postId: (await prisma.comment.findUnique({ where: { id: parseInt(commentId) } })).postId,
      },
      include: {
        author: true,
      },
    });

    res.status(201).json(newReply);
  } catch (error) {
    console.error("Error adding reply:", error);
    res.status(500).json({ error: "An error occurred while adding the reply" });
  }
});



//toggle follow
router.post('/toggle-follow/:id', async (req, res) => {
  const { id: targetUserId } = req.params;
  const currentUserId = req.user.id; // Assume we have user authentication middleware

  try {
    // Check if the user is trying to follow themselves
    if (currentUserId === targetUserId) {
      return res.status(400).json({ error: 'You cannot follow yourself' });
    }

    // Check if the follow relationship already exists
    const existingFollow = await prisma.follows.findUnique({
      where: {
        followerId_followingId: {
          followerId: currentUserId,
          followingId: targetUserId,
        },
      },
    });

    let result;
    if (existingFollow) {
      // Unfollow: Delete the existing follow relationship
      await prisma.follows.delete({
        where: {
          followerId_followingId: {
            followerId: currentUserId,
            followingId: targetUserId,
          },
        },
      });
      result = { action: 'unfollowed', message: 'User unfollowed successfully' };
    } else {
      // Follow: Create a new follow relationship
      await prisma.follows.create({
        data: {
          followerId: currentUserId,
          followingId: targetUserId,
        },
      });
      result = { action: 'followed', message: 'User followed successfully' };
    }

    res.json(result);
  } catch (error) {
    console.error('Error toggling follow status:', error);
    res.status(500).json({ error: 'Unable to toggle follow status' });
  }
});

export default router;