import OpenAI from "openai";
import fs from "fs";
import path from "path";

const openai = new OpenAI({
  apiKey: , // Ensure your API key is set in your environment variables
});

export default async function handler(req, res) {
  const { videoFilePath } = req.query;

  if (req.method === "GET") {
    if (!videoFilePath) {
      return res.status(400).json({ error: "Video file path is required." });
    }

    try {
      // The directory where frames are stored (public/frames/{videoFilePath})
      const framesDir = path.join(process.cwd(), "public", "frames", videoFilePath);

      // Check if the directory exists
      if (!fs.existsSync(framesDir)) {
        return res.status(404).json({ error: "Frames directory not found." });
      }

      // Read the files in the directory
      const files = fs.readdirSync(framesDir);

      if (files.length === 0) {
        return res.status(400).json({ error: "No frames found in the directory." });
      }

      // Filter only image files (.jpg or .png)
      const imageFiles = files.filter(file => file.endsWith(".jpg") || file.endsWith(".png"));

      if (imageFiles.length === 0) {
        return res.status(400).json({ error: "No image files found in the directory." });
      }

      // Process each image file in parallel to get descriptions
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

      // Combine all the descriptions into a single string
      const combinedDescription = imageDescriptions.join(" ");

      // Ask GPT-4 to rewrite the combined description as a beautiful lyric
      const lyricResponse = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "user",
            content: `Here are a series of descriptions: "${combinedDescription}". Can you rewrite these descriptions beautifully in the form of a song lyric?`,
          },
        ],
        max_tokens: 500,
      });

      // Get the lyric response from GPT-4
      const beautifulLyric = lyricResponse.choices[0]?.message?.content || "No lyric was generated.";

      // Return the generated lyric to the client
      res.status(200).json({ lyric: beautifulLyric });
    } catch (error) {
      console.error("Error reading frames or calling OpenAI:", error);
      res.status(500).json({ error: "An error occurred while processing the frames." });
    }
  } else {
    res.status(405).json({ error: "Method not allowed" });
  }
}
