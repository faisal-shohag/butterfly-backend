import { Router } from 'express'
import prisma from '../db/db.config.js'
const router = Router();

//delete single book
router.delete('/books/:id', async(req, res)=>{
    const id = req.params.id;

    try {
        await prisma.book.delete({
            where : {
                id : parseInt(id)
            }
        })
        return res.json({status: 200, message: "The book successfully deleted "})
        
    } catch (error) {
        return res.status(400).json({error: error.message})
    }
})

export default router