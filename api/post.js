import { Router } from 'express'
import prisma from '../db/db.config.js'
const router = Router()

router.post('/users', async (req, res) => {
    const user = await prisma.user.create({
        data: req.body
    })
    res.json(user)
})



export default router