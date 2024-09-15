"use client";

import { useState } from "react";

export default function VideoUpload() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [isUploaded, setIsUploaded] = useState(false);
  const [uploadError, setUploadError] = useState(false);

  const handleFileChange = (e) => {
    setSelectedFile(e.target.files[0]);
    setIsUploaded(false);
    setUploadError(false);
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setUploadError(true);
      return;
    }

    const formData = new FormData();
    formData.append("file", selectedFile); // This is the file field in the backend

    try {
      const response = await fetch("http://localhost:3000/api/upload", {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        setIsUploaded(true);
        console.log("Upload successful!");
      } else {
        console.error("Upload failed!");
        setUploadError(true);
      }
    } catch (error) {
      console.error("Error while uploading:", error);
      setUploadError(true);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 bg-[length:200%_200%] animate-gradient-x p-8">
      <main className="bg-white shadow-xl rounded-lg p-10 sm:p-16 flex flex-col gap-8 items-center max-w-lg w-full">
        <h1 className="text-3xl font-bold text-gray-800">Upload Your Video</h1>
        <p className="text-gray-600 text-center">
          Easily upload your video file and share it with the world!
        </p>

        <div className="w-full flex flex-col items-center">
          <label className="block text-lg font-semibold mb-4 text-gray-800">
            Select Video File
          </label>
          <div className="relative w-full h-44 max-w-md bg-gray-100 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center hover:border-blue-500 transition-all duration-300">
            <input
              type="file"
              accept="video/*"
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              onChange={handleFileChange}
            />
            <div className="text-center flex flex-col items-center">
              <svg
                className="w-10 h-10 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 16V8a1 1 0 011-1h16a1 1 0 011 1v8a1 1 0 01-1 1H4a1 1 0 01-1-1z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 11V7m0 0l-3 3m3-3l3 3m-6 2h6"
                />
              </svg>
              <p className="text-sm text-gray-500 mt-2">
                Drag & Drop or Click to Upload
              </p>
              {selectedFile && (
                <p className="mt-2 text-sm text-gray-500">
                  Selected: {selectedFile.name}
                </p>
              )}
            </div>
          </div>
        </div>

        <button
          onClick={handleUpload}
          className="bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors w-full"
        >
          Upload Video
        </button>

        {isUploaded && (
          <p className="text-green-600 font-semibold mt-4">
            Video uploaded successfully!
          </p>
        )}

        {uploadError && (
          <p className="text-red-600 font-semibold mt-4">
            Error uploading video. Please try again.
          </p>
        )}
      </main>

      <footer className="mt-8">
        <a
          className="text-white text-sm hover:underline"
          href="https://nextjs.org"
          target="_blank"
          rel="noopener noreferrer"
        >
          Written by Carter, Sophie, Eliza, and Max
        </a>
      </footer>
    </div>
  );
}
