import { Router } from "express";
import prisma from "../db/db.config.js";
const router = Router();

router.post('/add_store_books', async(req, res) => {
    try {
        const newStoreBook = await prisma.storeBook.create({
            data: req.body
        })
        return res.status(200).json({newStoreBook})
    } catch (error) {
        console.log(error)
        return res.status(500).json({error: error.message})
    }
    
})

router.get('/store_books', async (req, res) => {
    try {
       
        const page = parseInt(req.query.page) || 1; 
        const limit = parseInt(req.query.limit) || 10; 
        
        const skip = (page - 1) * limit;

        
        const storeBooks = await prisma.storeBook.findMany({
            skip: skip,
            take: limit,
        });

        
        const totalBooks = await prisma.storeBook.count();
        const totalPages = Math.ceil(totalBooks / limit);

        return res.status(200).json({
            storeBooks,
            currentPage: page,
            totalPages,
            totalBooks,
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ error: error.message });
    }
});


router.get('/store_books/:id', async(req, res) => {
    const id = req.params.id;
    try {
        const storeBook = await prisma.storeBook.findUnique({
            where: {
                id: parseInt(id)
            },
          
        })
        return res.status(200).json({storeBook})
    } catch (error) {
        console.log(error)
        return res.status(500).json({error: error.message})
    }
})

router.get('/store_books-with-reviews/:id', async(req, res) => {
    const id = req.params.id;
    try {
        const storeBook = await prisma.storeBook.findUnique({
            where: {
                id: parseInt(id)
            },
            include: {
                reviews: {
                    include: {
                        user: true
                    }
                }
            }
        })
        return res.status(200).json({storeBook})
    } catch (error) {
        console.log(error)
        return res.status(500).json({error: error.message})
    }
})

// add reviews
router.post('/store_books/reviews', async(req, res) => {
    const { bookId, rating, review, userId } = req.body;
    
    try {
        const newReview = await prisma.bookReview.create({
            data: {
                bookId: parseInt(bookId),
                rating: parseFloat(rating),
                review,
                userId
            },
            include: {
                user: true
            }
        });
        
        return res.status(201).json({ review: newReview });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ error: error.message });
    }
});

router.put('/store_books/:id', async(req, res) => {
    const id = req.params.id;
    try {
        const updatedStoreBook = await prisma.storeBook.update({
            where: {
                id: parseInt(id)
            },
            data: req.body
        })
        return res.status(200).json({updatedStoreBook})
    } catch (error) {
        console.log(error)
        return res.status(500).json({error: error.message})
    }
})


router.delete('/store_books/:id', async(req, res) => {
    const id = req.params.id;
    try {
        const deletedStoreBook = await prisma.storeBook.delete({
            where: {
                id: parseInt(id)
            }
        })
        return res.status(200).json({deletedStoreBook})
    } catch (error) {
        console.log(error)
        return res.status(500).json({error: error.message})
    }
})


router.get('/store_books_with_categories_and_filter', async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const category = req.query.category;
        const sortBy = req.query.sortBy;

        const skip = (page - 1) * limit;

        let orderBy = {};
        switch (sortBy) {
            case 'newest':
                orderBy = { publishedDate: 'desc' };
                break;
            case 'oldest':
                orderBy = { publishedDate: 'asc' };
                break;
            case 'most_discounted':
                orderBy = { discount: 'desc' };
                break;
            case 'lowest_price':
                orderBy = { price: 'asc' };
                break;
            case 'highest_price':
                orderBy = { price: 'desc' };
                break;
            default:
                orderBy = { publishedDate: 'desc' };
        }

        const where = !category || category === 'all' ? {} : { category }; 

        const storeBooks = await prisma.storeBook.findMany({
            where,
            skip,
            take: limit,
            orderBy,
        });

        const totalBooks = await prisma.storeBook.count({ where });
        const totalPages = Math.ceil(totalBooks / limit);

        const categories = await prisma.storeBook.findMany({
            select: {
                category: true,
            },
            distinct: ['category'],
        });

        return res.status(200).json({
            storeBooks,
            currentPage: page,
            totalPages,
            totalBooks,
            categories: categories.map(c => c.category),
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ error: error.message });
    }
});

router.get('/latest_store_books', async(req, res) => {
    try {
        const latestStoreBooks = await prisma.storeBook.findMany({
            orderBy: {
                publishedDate: 'desc'
            },
            take: 10
        })
        return res.status(200).json({latestStoreBooks})
    } catch (error) {
        console.log(error)
        return res.status(500).json({error: error.message})
    }
})


router.get('/trending-books', async (req, res) => {
    try {
        const trendingBooks = await prisma.storeBook.findMany({
            where: {
                category: {
                    contains: 'Trending',
                    mode: 'insensitive' // Case-insensitive search
                }
            },
            take: 5, // Limit to 5 records
            select: {
                id: true,
                title: true,
                description: true,
                author: true,
                price: true,
                coin: true,
                discount: true,
                category: true,
                language: true,
                cover: true,
                publishedDate: true
            },
            orderBy: {
                publishedDate: 'desc' // Sort by latest published date
            }
        });

        if (!trendingBooks.length) {
            return res.status(404).json({
                success: false,
                message: 'No trending books found'
            });
        }

        return res.status(200).json({
            success: true,
            data: trendingBooks,
            message: 'Trending books retrieved successfully'
        });

    } catch (error) {
        console.error('Error fetching trending books:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
});


router.get('/popular-books', async (req, res) => {
    try {
        const trendingBooks = await prisma.storeBook.findMany({
            where: {
                category: {
                    contains: 'Popular',
                    mode: 'insensitive' // Case-insensitive search
                }
            },
            take: 5, // Limit to 5 records
            select: {
                id: true,
                title: true,
                description: true,
                author: true,
                price: true,
                coin: true,
                discount: true,
                category: true,
                language: true,
                cover: true,
                publishedDate: true
            },
            orderBy: {
                publishedDate: 'desc' // Sort by latest published date
            }
        });

        if (!trendingBooks.length) {
            return res.status(404).json({
                success: false,
                message: 'No trending books found'
            });
        }

        return res.status(200).json({
            success: true,
            data: trendingBooks,
            message: 'Trending books retrieved successfully'
        });

    } catch (error) {
        console.error('Error fetching trending books:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
});


export default router