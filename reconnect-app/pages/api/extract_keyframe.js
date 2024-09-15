import ffmpeg from 'fluent-ffmpeg';
import path from 'path';
import fs from 'fs';
import { promisify } from 'util';

const stat = promisify(fs.stat);
const mkdir = promisify(fs.mkdir);
const readdir = promisify(fs.readdir); // Promisify fs.readdir to read directory contents

// Function to extract frames from video file
const extractFrames = (videoPath, outputDir, frameInterval = 20) => {
  return new Promise((resolve, reject) => {
    ffmpeg(videoPath)
      .on('end', function () {
        console.log('Frames extraction finished');
        resolve(); // Resolve without filenames
      })
      .on('error', function (err) {
        console.error('Error occurred: ' + err.message);
        reject(err);
      })
      .output(path.join(outputDir, 'frame-%03d.png'))
      .outputOptions([`-vf fps=1/${frameInterval}`]) // Extract one frame every frameInterval
      .run();
  });
};

export default async function handler(req, res) {
  if (req.method === 'POST') {
    // Retrieve videoFilePath from the query parameter instead of the body
    const { videoFilePath } = req.query;

    if (!videoFilePath) {
      return res.status(400).json({ message: 'Video file path is required' });
    }

    // Define the full path to the video file in the uploads folder
    const videoPath = path.join(process.cwd(), 'public', 'uploads', videoFilePath);

    // Extract the base name (without extension) to create the frames output directory
    const videoBaseName = path.basename(videoFilePath, path.extname(videoFilePath));
    const outputDir = path.join(process.cwd(), 'public', 'frames', videoBaseName);  // Directory for frames

    // Ensure the frames directory exists, create it if it doesn't
    try {
      await stat(outputDir);
    } catch (error) {
      await mkdir(outputDir, { recursive: true });
    }

    try {
      // Extract frames from the video and save to the output directory
      await extractFrames(videoPath, outputDir, 20);

      // After extraction, read the directory to get the list of generated frame files
      const frames = await readdir(outputDir);

      // Filter out non-image files (if any)
      const frameFiles = frames.filter(file => /\.(png|jpg|jpeg)$/i.test(file));

      return res.status(200).json({
        message: 'Frames extracted successfully',
        frames: frameFiles.map(frame => `/frames/${videoBaseName}/${frame}`) // Include full file path for front-end usage
      });
    } catch (error) {
      console.error('Frame extraction failed:', error);
      return res.status(500).json({ message: 'Error extracting frames', error: error.message });
    }
  } else {
    return res.status(405).json({ message: 'Method not allowed' });
  }
}
