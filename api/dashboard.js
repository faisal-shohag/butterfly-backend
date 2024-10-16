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




router.get('/reports', async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;

      
        const skip = (page - 1) * limit;


        const reports = await prisma.report.findMany({
            skip: skip,
            take: limit,
            include: {
                post: true,
                book: true,
                user: true,
                replies: true, 
            },
        });

 
        const totalReports = await prisma.report.count();
        const totalPages = Math.ceil(totalReports / limit);

       
        return res.status(200).json({
            reports,
            currentPage: page,
            totalPages,
            totalReports,
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ error: error.message });
    }
});



router.post('/reports', async(req, res) => {
    const {itemId, itemType, text, userId} = req.body
    let report;
        try {
            if(itemType === 'post'){
                 report = await prisma.report.create({
                    data: {
                        text,
                        postId: parseInt(itemId),
                        userId
                    }
                })
            } else {
                report = await prisma.report.create({
                    data: {
                        text,
                        bookId: parseInt(itemId),
                        userId
                    }
                })
            }
           
            return res.status(200).json({report})
        } catch (error) {
            console.log(error)
            return res.status(500).json({error: error.message})
        }
    
    
})

router.post('/reportReply/:id', async(req, res) => {
    const {text, userId} = req.body;
    const {id} = req.params;
    try {
        const reportReply = await prisma.reportReplies.create({
            data: {
                text,
                reportId: parseInt(id),
                userId
            }
        })
        return res.status(200).json({reportReply})
    } catch (error) {
        console.log(error)
        return res.status(500).json({error: error.message})
    }
})







export default router;