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
            }
        })
        return res.status(200).json({storeBook})
    } catch (error) {
        console.log(error)
        return res.status(500).json({error: error.message})
    }
})

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



export default router