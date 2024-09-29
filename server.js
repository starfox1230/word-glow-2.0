const express = require('express');
const axios = require('axios');
const path = require('path');

const app = express();

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public'))); // Serve static files from 'public' directory

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

if (!OPENAI_API_KEY) {
    console.error('Error: OpenAI API key is not set.');
    process.exit(1);
}

// Endpoint to generate image
app.post('/generate-image', async (req, res) => {
    const story = req.body.story;

    if (!story) {
        return res.status(400).json({ error: 'Story is required.' });
    }

    try {
        // Step 1: Use ChatGPT to create an image prompt
        const chatResponse = await axios.post(
            'https://api.openai.com/v1/chat/completions',
            {
                model: 'gpt-4o-2024-08-06',
                messages: [
                    {
                        role: 'system',
                        content: 'You are a helpful assistant that creates image prompts for DALL·E.'
                    },
                    {
                        role: 'user',
                        content: `Please create a detailed and specific image prompt for DALL·E to generate an image based on the following story. Focus on including key characters, their physical features, important objects, the environment, mood, and any significant action happening in the scene. The prompt should describe everything in a way that will result in a visually accurate and engaging image. The image should be in a whimsical, storybook illustration style. Only return the prompt, do not return any additional words. Here is the story:\n\nStory:\n${story}`
                    }
                ],
                max_tokens: 1000,
                temperature: 0.7,
            },
            {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${OPENAI_API_KEY}`,
                },
            }
        );

        const imagePrompt = chatResponse.data.choices[0].message.content.trim();

        // Step 2: Use DALL·E to generate the image
        const dalleResponse = await axios.post(
            'https://api.openai.com/v1/images/generations',
            {
                prompt: imagePrompt,
                model: 'dall-e-3', // Use 'dall-e-3' if you have access
                n: 1,
                size: '1024x1024', // Updated size to a supported value
                // Remove or comment out the 'quality' parameter if unsupported
                quality: 'hd',
            },
            {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${OPENAI_API_KEY}`,
                },
            }
        );

        const imageUrl = dalleResponse.data.data[0].url;

        res.json({ imageUrl });
    } catch (error) {
        console.error('Error occurred during image generation:');
        if (error.response) {
            console.error('Status:', error.response.status);
            console.error('Data:', error.response.data);
            res.status(500).json({ error: error.response.data.error.message });
        } else {
            console.error('Error Message:', error.message);
            res.status(500).json({ error: 'An unexpected error occurred.' });
        }
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
