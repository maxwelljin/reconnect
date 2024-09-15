// /pages/api/merge-audio-video.js
import path from 'path';
import ffmpeg from 'fluent-ffmpeg';
import ffmpegStatic from 'ffmpeg-static';
import fs from 'fs';
import { promisify } from 'util';
import axios from 'axios';

const writeFile = promisify(fs.writeFile);

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Extract parameters from the query string
  const { audioUrl, videoFilePath } = req.query;

  if (!audioUrl || !videoFilePath ) {
    return res.status(400).json({ error: 'Audio URL, video file path, and output file path are required.' });
  }

  try {
    // Define paths
    const videoPath = path.join(process.cwd(), 'public', 'uploads', videoFilePath); // Video file from uploads
    const audioPath = path.join(process.cwd(), 'public', 'temp', 'tempAudio.mp3');  // Temporary audio file
    const outputFile = path.join('public', 'output', videoFilePath);               // The final output file
    const absoluteOutputPath = path.join(process.cwd(), outputFile);                // Absolute path for ffmpeg

    // Ensure the video file exists
    if (!fs.existsSync(videoPath)) {
      return res.status(404).json({ error: 'Video file not found.' });
    }

    // Fetch the audio from the URL and save it locally
    const audioResponse = await axios({
      method: 'GET',
      url: audioUrl,
      responseType: 'arraybuffer',
    });
    await writeFile(audioPath, Buffer.from(audioResponse.data));

    // Configure ffmpeg to use the static version
    ffmpeg.setFfmpegPath(ffmpegStatic);

    // Merge the audio and video, ensuring audio is applied only for the duration it has
    ffmpeg()
      .input(videoPath)
      .input(audioPath)
      .output(absoluteOutputPath) // use the absolute path for the output
      .on('end', () => {
        // Clean up the temporary audio file
        //fs.unlinkSync(audioPath);

        // Respond with the relative path to the merged video
        res.status(200).json({ success: true, filePath: `/output/${videoFilePath}` });
      })
      .on('error', (err) => {
        console.error('Error merging audio and video:', err);
        res.status(500).json({ error: 'Failed to merge audio and video.' });
      })
      .run();
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'An error occurred while processing the request.' });
  }
}
