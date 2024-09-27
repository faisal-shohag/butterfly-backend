import { GoogleGenerativeAI } from '@google/generative-ai';
import { Router } from 'express'
const router = Router()
import dotenv from 'dotenv';


//gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
router.post('/gemini', async (req, res) => {
  try {
    // Extract prompt from the request body
    const { text_input } = req.body;

    if (!text_input) {
      return res.status(400).json({ error: "Prompt is required" });
    }

    // Fetch the model (gemini-1.5-flash) and generate content
    const model = await genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const result = await model.generateContent(text_input);
    // console.log(result.response);

    // Return the generated content
    res.status(200).json({ generatedText: result.response});
  } catch (error) {
    console.error('Error generating content:', error.message);
    res.status(500).json({ error: 'An error occurred while generating content' });
  }
});

export default router;