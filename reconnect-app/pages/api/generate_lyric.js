import fetch from 'node-fetch'; // Import node-fetch for ES modules
import OpenAI from "openai";
import fs from "fs";
import path from "path";

// Initialize OpenAI with your API key
const openai = new OpenAI({
  apiKey: "", 
});

// Suno API URL and headers
const sunoUrl = 'https://studio-api.suno.ai/api/external/generate/';
const sunoHeaders = {
  'Accept': '/',
  'Accept-Language': 'en-US,en;q=0.9',
  'Affiliate-Id': 'undefined',
  'Authorization': `Bearer `, // Replace with your actual Suno API token
  'Content-Type': 'text/plain;charset=UTF-8',
  'Origin': 'https://suno.com/',
  'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36'
};

// Function to generate music using Suno API
async function generateMusic(prompt) {
  console.log(prompt)
  const body = JSON.stringify({
    "prompt": "This is a song about HackMIT\n yeah HackMIT\n yeah HackMIT\n la la la",
    "tags": "pop",
    "topic": prompt,
    "mv": "chirp-v3-5"
  });

  try {
    const response = await fetch(sunoUrl, {
      method: 'POST',
      headers: sunoHeaders,
      body: body
    });
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error generating music:', error);
  }
}

// OpenAI image description to lyric creation function
async function generateLyricsFromImages(videoFilePath) {
  // The directory where frames are stored (public/frames/{videoFilePath})
  const framesDir = path.join(process.cwd(), "public", "frames", videoFilePath);

  if (!fs.existsSync(framesDir)) {
    throw new Error("Frames directory not found.");
  }

  const files = fs.readdirSync(framesDir);
  const imageFiles = files.filter(file => file.endsWith(".jpg") || file.endsWith(".png"));

  if (imageFiles.length === 0) {
    throw new Error("No image files found.");
  }

  const imageDescriptions = await Promise.all(
    imageFiles.map(async (file) => {
      const imagePath = path.join(framesDir, file);
      
      // Read the image file as base64
      const base64Image = fs.readFileSync(imagePath, { encoding: "base64" });

      // Create a base64 image URL
      const base64ImageUrl = `data:image/jpeg;base64,${base64Image}`;

      // Make the request to OpenAI to describe the image
      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: 'Please describe the contents of the following image.'
              },
              {
                type: "image_url",
                image_url: {
                  url: base64ImageUrl
                }
              }
            ],
          },
        ],
        max_tokens: 300,
      });

      // Extract the description from the response
      const description = response.choices[0]?.message?.content || "No description found.";
      return description;
    })
  );

  // Combine descriptions
  const combinedDescription = imageDescriptions.join(" ");

  // Ask GPT-4 to generate song lyrics from descriptions
  const lyricResponse = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      {
        role: "user",
        content: `Here are a series of descriptions: "${combinedDescription}". Can you rewrite these descriptions beautifully as the context of the lyric, only one sentence`,
      },
    ],
    max_tokens: 500,
  });

  let beautifulLyric = lyricResponse.choices[0]?.message?.content || "No lyric was generated.";

  // Limit the lyrics to 2000 characters
  if (beautifulLyric.length > 2000) {
    beautifulLyric = beautifulLyric.substring(0, 2000);
  }

  return beautifulLyric;
}

// Main handler for the API request
export default async function handler(req, res) {
  const { videoFilePath } = req.query;

  if (req.method === "GET") {
    try {
      // Generate lyrics from OpenAI based on image frames
      const lyrics = await generateLyricsFromImages(videoFilePath);
      //const lyrics = "HackMIt is great, hack mit is great!!"

      // Generate music from Suno API
      const musicData = await generateMusic(lyrics);
      
      // Combine and return both results
      res.status(200).json({
        musicData,
        lyrics
      });
      
    } catch (error) {
      console.error("Error in handler:", error);
      res.status(500).json({ error: "An error occurred while processing the request." });
    }
  } else {
    res.status(405).json({ error: "Method not allowed" });
  }
}
