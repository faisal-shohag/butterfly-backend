import { Router } from "express";
import prisma from "../db/db.config.js";
const router = Router();
// total users
router.get('/total-count', async(req, res)=>{
    try {
        const totalUsers = await prisma.user.count();
        const totalBooks = await prisma.book.count();
        const totalPosts = await prisma.post.count();
        const totalStoreBooks = await prisma.storeBook.count();
        return res.status(200).json({totalUsers, totalBooks, totalPosts, totalStoreBooks})
    } catch (error) {
        console.log(error)
        return res.status(500).json({error: error.message})
    }
})


router.put('/user_role/:id', async(req, res) => {
    const {role} = req.body;
    const {id} = req.params;
    try {
        const user = await prisma.user.update({
            where: {id},
            data: {role}
        })
        return res.status(200).json({user})
    } catch (error) {
        return res.status(500).json({error: error.message})
    }
})

router.post('/add_store_books', async(req, res) => {
    try {
        const newStoreBook = await prisma.storeBook.create({
            data: req.body
        })
        return res.status(200).json({newStoreBook})
    } catch (error) {
        return res.status(500).json({error: error.message})
    }
    
})

router.get('/store_books', async(req, res) => {
    try {
        const storeBooks = await prisma.storeBook.findMany();
        return res.status(200).json({storeBooks})
    } catch (error) {
        return res.status(500).json({error: error.message})
    }
})


router.get('/reports', async(req, res) => {
    try {
        const reports = await prisma.report.findMany();
        return res.status(200).json({reports})
    } catch (error) {
        return res.status(500).json({error: error.message})
    }
})


router.post('/reports', async(req, res) => {
    try {
        const report = await prisma.report.create({
            data: req.body
        })
        return res.status(200).json({report})
    } catch (error) {
        return res.status(500).json({error: error.message})
    }
})

router.post('/report_reply', async(req, res) => {
    try {
        const reportReply = await prisma.reportReply.create({
            data: req.body
        })
        return res.status(200).json({reportReply})
    } catch (error) {
        return res.status(500).json({error: error.message})
    }
})







export default router;