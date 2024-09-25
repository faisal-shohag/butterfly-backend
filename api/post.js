import { Router } from 'express'
import prisma from '../db/db.config.js'
const router = Router()

router.post('/users', async (req, res) => {
    
    const user = await prisma.user.create({
        data: req.body
    })
    res.json(user)
})


//create a post
router.post('/post', async(req, res)=>{
    try {
        const {content, authorId, type} = req.body;
        const newPost = await prisma.post.create({
            data : {
                content,
                authorId: parseInt(authorId),
                type: type || null
            }
        })

        return res.json({data: newPost, message: "New post added"})
    } catch (error) {
        return res.status(400).json({error : error.message})
    }
})


//post a comment
router.post('/posts/:postId/comment', async(req, res)=>{
    const postId = parseInt(req.params.postId);
    const {content, authorId, images} = req.body;

    try {
        const newComment = await prisma.comment.create({
            data: {
                content,
                authorId : parseInt(authorId),
                postId: postId,
                images : {
                    create: images.map(({ url, fileId }) => ({ url, fileId })),
                },
            },
            include : {
                author : true,
                images : true
            }
            
        })

        return res.json({status: 200, data: newComment, message: "New Comment Added"})
    } catch (error) {
        return res.status(400).json({error : error.message})
    }
})

export default router