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

router.get("/posts/:postId/:userId/comments", async (req, res) => {
  try {
    const { postId, userId } = req.params;
    const { page = 1, limit = 10 } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const comments = await prisma.comment.findMany({
      where: { postId: parseInt(postId) },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
        images: true,
        likes: {
          select: {
            userId: true,
          },
        },
        _count: {
          select: { replies: true }
        }
      },
      orderBy: { createdAt: 'desc' },
      skip: skip,
      take: parseInt(limit),
    });

    const totalComments = await prisma.comment.count({
      where: { postId: parseInt(postId) },
    });

    const commentsWithLikeInfo = comments.map(comment => ({
      id: comment.id,
      content: comment.content,
      createdAt: comment.createdAt,
      updatedAt: comment.updatedAt,
      author: comment.author,
      images: comment.images,
      likeCount: comment.likes.length,
      isLiked: comment.likes.some(like => like.userId === userId),
      replyCount: comment._count.replies,
    }));

    res.json({
      comments: commentsWithLikeInfo,
      totalComments,
      currentPage: parseInt(page),
      totalPages: Math.ceil(totalComments / parseInt(limit)),
    });
  } catch (error) {
    console.error("Error fetching comments:", error);
    res.status(500).json({ error: "An error occurred while fetching comments" });
  }
});

router.post("/comments/:commentId/toggle-like", async (req, res) => {
  try {
    const { commentId } = req.params;
    const userId = req.body.userId;

    const existingLike = await prisma.like.findFirst({
      where: {
        userId: userId,
        commentId: parseInt(commentId),
        postId: null,
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
          comment: { connect: { id: parseInt(commentId) } },
        },
      });
    }

    // Get updated like count
    const updatedComment = await prisma.comment.findUnique({
      where: { id: parseInt(commentId) },
      include: { likes: { select: { id: true } } },
    });

    res.json({
      liked: !existingLike,
      likesCount: updatedComment.likes.length,
    });
  } catch (error) {
    console.error("Error toggling comment like:", error);
    res.status(500).json({ error: "An error occurred while toggling comment like" });
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


router.delete("/comments/:commentId/:userId", async (req, res) => {
  const { commentId, userId } = req.params;

  try {
    // Start a transaction
    await prisma.$transaction(async (prisma) => {
      // Fetch the comment and its associated images, likes, and replies
      const comment = await prisma.comment.findUnique({
        where: { id: parseInt(commentId) },
        include: {
          images: true,
          likes: true,
          replies: {
            include: {
              likes: true,
            },
          },
        },
      });

      // If the comment doesn't exist, throw an error
      if (!comment) {
        throw new Error("Comment not found");
      }

      // Check if the comment belongs to the user
      if (comment.authorId !== userId) {
        throw new Error("You are not authorized to delete this comment");
      }

      // Collect all image file IDs for deletion
      const allImages = comment.images.map(image => image.fileId);

      // Delete associated images from ImageKit (if applicable)
      const deleteImagePromises = allImages.map((fileId) => {
        return new Promise((resolve) => {
          if (!fileId) {
            resolve({ success: false });
            return;
          }

          imageKit.deleteFile(fileId, (error, result) => {
            if (error) {
              console.error(`Failed to delete image with fileId ${fileId}:`, error);
              resolve({ success: false });
            } else {
              resolve({ success: true });
            }
          });
        });
      });

      // Await deletion of images
      const deleteResults = await Promise.all(deleteImagePromises);

      // Log the image deletion results
      deleteResults.forEach((result, idx) => {
        if (result.success) {
          console.log(`Successfully deleted image with fileId: ${allImages[idx]}`);
        } else {
          console.error(`Failed to delete image with fileId: ${allImages[idx]}`);
        }
      });

      // Delete all likes associated with the comment and its replies
      await prisma.like.deleteMany({
        where: {
          OR: [
            { commentId: parseInt(commentId) },
            { replyId: { in: comment.replies.map(reply => reply.id) } },
          ],
        },
      });

      // Delete replies associated with the comment
      await prisma.reply.deleteMany({
        where: { commentId: parseInt(commentId) },
      });

      // Delete the comment itself
      await prisma.comment.delete({
        where: { id: parseInt(commentId) },
      });
    });

    // Send a success response
    res.json({ message: "Comment, associated replies, likes, and images deleted successfully" });
  } catch (error) {
    console.error("Error deleting comment, replies, likes, and images:", error);
    res.status(500).json({
      error: error.message || "An error occurred while deleting the comment",
    });
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




// homepage
//popular posts
router.get('/popular-posts', async (req, res)=> {
   try {
    const popularPosts = await prisma.post.findMany({
      orderBy: {
          likes: {
              _count: "desc",
          },
      },
      take: 5,
      include: {
          author: true,
          _count: {
              select: {
                  likes: true,
                  comments: true,
              },
          },
          images: true,
      },
  })
  res.status(200).json(popularPosts);

   } catch (error) {
    console.error('Error fetching popular posts:', error);
    res.status(500).json({ error: 'Unable to fetch popular posts' });
   }
})


// who to folow 
router.get('/suggested-to-follow-users/:userId', async (req, res)=> {
  try {
    const userId = req.params.userId
    let usersToFollow = []
    if(!userId){
      usersToFollow = await prisma.user.findMany({
        take: 3,
        select: {
            id: true,
            name: true,
            image: true,
            username: true,
        }
    })
    }else {
      usersToFollow = await prisma.user.findMany({
        where: {
            NOT: {
                id: userId
            }
        },
        take: 3,
        select: {
            id: true,
            name: true,
            image: true,
            username: true,
        }
    })
    }

    res.status(200).json(usersToFollow);
  } catch (error) {
    console.error('Error fetching suggested users:', error);
    res.status(500).json({ error: 'Unable to fetch suggested users' });
  }
})


BigInt.prototype.toJSON = function() {       
  return this.toString()
}

//trensding topics
router.get('/trending-topics', async (req, res)=> {
  try {
    const trendingTopics = await prisma.$queryRaw`
    SELECT LOWER(unnest(regexp_matches(content, '#[[:alnum:]_]+', 'g'))) AS hashtag, COUNT(*) AS count
    FROM "Post"
    GROUP BY hashtag
    ORDER BY count DESC, hashtag ASC
    LIMIT 5
`;
  res.status(200).json(trendingTopics);

  } catch (error) {
    console.error('Error fetching trending topics:', error);
    res.status(500).json({ error: 'Unable to fetch trending topics' });
  }
})

export default router;