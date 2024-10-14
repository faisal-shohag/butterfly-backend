import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
const app = express()
const port = 5000

import get from './api/get.js'
import post from './api/post.js'
import put from './api/put.js'
import genai from './api/genai.js';
import forum from './api/forum.js';
import deleted from './api/delete.js'
import dashboard from './api/dashboard.js';


app.use(cors())
app.use(express.json({ limit: '10mb' }));
app.use(bodyParser.json({ limit: '10mb' })); // Increase the limit as needed
app.use(bodyParser.urlencoded({ extended: true, limit: '10mb' }));



app.get('/', (req, res) => {
    res.send('Working fine!')
})

app.use(get)
app.use(post)
app.use(put)
app.use(genai)
app.use(forum)
app.use(deleted)
app.use(dashboard)

app.listen(port, () => {
    console.log(`App listening on port ${port}`)
})


export default app