import { Router } from 'express'
import prisma from '../db/db.config.js'
const router = Router()

router.get('/users', async (req, res) => {
    const users = await prisma.user.findMany()
    res.json(users)
})

//get single user
router.get('/users/:email', async(req, res)=>{
    const email = req.params.email;
    const user = await prisma.user.findUnique({
        where : {
            email
        }
    })

    return res.json({status: 200, data:user})
})


//get all posts
router.get('/posts', async(req, res)=>{
    const posts = await prisma.post.findMany()
    return res.json(posts)
})

//get single post
router.get('/posts/:authorId', async(req, res)=>{
    const authorId = parseInt(req.params.authorId);

    try {
        const post = await prisma.post.findMany({
            where : {
                authorId
            },
            include : {
                author : true,
                comments : {
                    select : {
                        id : true,

                    },

                },
                likes : {
                    select : {
                        id: true,
                        userId : true
                    }
                }
            }
        })

        return res.json({status: 200, data: post})
    } catch (error) {
        return res.status(400).json({error : error.message})
    }
})


//get single post comments
router.get('/comment/:postId', async(req, res)=>{
    const postId = parseInt(req.params.postId)

    try {
        const comments = await prisma.comment.findMany({
            where : {
                postId
            }
        })
        return res.json({status: 200, data: comments})
    } catch (error) {
        return res.status(400).json({error: error.message})
    }
})

export default router