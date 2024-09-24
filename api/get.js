import { Router } from 'express'
import prisma from '../db/db.config.js'
const router = Router()

router.get('/users', async (req, res) => {
    const users = await prisma.user.findMany()
    res.json(users)
})




export default router