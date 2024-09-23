import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
const app = express()
const port = 5000


app.use(cors())
app.use(express.json({ limit: '10mb' }));
app.use(bodyParser.json({ limit: '10mb' })); // Increase the limit as needed
app.use(bodyParser.urlencoded({ extended: true, limit: '10mb' }));



app.get('/', (req, res) => {
    res.send('Working fine!')
})

app.listen(port, () => {
    console.log(`App listening on port ${port}`)
})


export default app