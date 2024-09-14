import ffmpeg from 'fluent-ffmpeg';
import path from 'path';
import fs from 'fs';
import { promisify } from 'util';

const stat = promisify(fs.stat);
const mkdir = promisify(fs.mkdir);

// Function to extract frames from video file
const extractFrames = (videoPath, outputDir, frameInterval = 20) => {
  return new Promise((resolve, reject) => {
    ffmpeg(videoPath)
      .on('filenames', function (filenames) {
        console.log('Frames will be saved as:', filenames);
      })
      .on('end', function () {
        console.log('Frames extraction finished');
        resolve();
      })
      .on('error', function (err) {
        console.error('Error occurred: ' + err.message);
        reject(err);
      })
      .output(path.join(outputDir, 'frame-%03d.png'))
      .outputOptions([`-vf fps=1/${frameInterval}`]) // Extract one frame every 20 frames
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

    const videoPath = path.join(process.cwd(), 'public/uploads', videoFilePath); // Full path to the video file

    const videoBaseName = path.basename(videoFilePath, path.extname(videoFilePath));
    const outputDir = path.join(process.cwd(), 'public', 'frames', videoBaseName);  // Directory for frames

    // Ensure the frames directory exists
    try {
      await stat(outputDir);
    } catch (error) {
      await mkdir(outputDir, { recursive: true });
    }

    try {
      // Extract frames from the video
      await extractFrames(videoPath, outputDir, 20);
      return res.status(200).json({ message: 'Frames extracted successfully' });
    } catch (error) {
      return res.status(500).json({ message: 'Error extracting frames', error: error.message });
    }
  } else {
    return res.status(405).json({ message: 'Method not allowed' });
  }
}
