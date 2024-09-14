import { IncomingForm } from 'formidable';
import fs from 'fs';
import path from 'path';

export const config = {
  api: {
    bodyParser: false, // Disable Next.js built-in body parser to handle file uploads
  },
};

export default function handler(req, res) {
  if (req.method === 'POST') {
    const form = new IncomingForm({ keepExtensions: true, uploadDir: './public/uploads' });

    form.parse(req, (err, fields, files) => {
      if (err) {
        console.error('Error parsing the form:', err);
        res.status(500).json({ message: 'File upload failed' });
        return;
      }

      // Log all the fields and files to see the structure
      console.log("Fields:", fields);
      console.log("Files:", files);

      // Check if 'video' field exists in files
      const uploadedFile = files.video || files.file || Object.values(files)[0];

      // If no file is found, log the error and return
      if (!uploadedFile) {
        console.error("No file uploaded");
        res.status(400).json({ message: 'No file uploaded' });
        return;
      }

      // Log the uploaded file information
      console.log("Uploaded file:", uploadedFile[0]);

      // Respond with the file details
      res.status(200).json({
        message: 'File uploaded successfully!',
        filePath: path.basename(uploadedFile[0].filepath)
      });
    });
  } else {
    res.status(405).json({ message: `Method ${req.method} not allowed` });
  }
}
