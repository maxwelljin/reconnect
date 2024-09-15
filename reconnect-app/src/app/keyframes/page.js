"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from 'next/navigation'; // To get the videoFilePath from query params

export default function KeyframeDisplay() {
  const searchParams = useSearchParams();
  const videoFilePath = searchParams.get('videoFilePath'); // Get videoFilePath from the URL query params

  const [keyframes, setKeyframes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lyrics, setLyrics] = useState(null);
  const [generatingLyrics, setGeneratingLyrics] = useState(false);

  useEffect(() => {
    if (!videoFilePath) return;

    const fetchKeyframes = async () => {
      try {
        const response = await fetch(`/api/extract_keyframe?videoFilePath=${videoFilePath}`, {
          method: 'POST',
        });

        if (response.ok) {
          const { frames } = await response.json();
          setKeyframes(frames); // Store the list of extracted frames
        } else {
          console.error("Failed to extract keyframes.");
          setError("Failed to extract keyframes.");
        }
      } catch (error) {
        console.error("Error fetching keyframes:", error);
        setError("Error extracting keyframes.");
      } finally {
        setLoading(false);
      }
    };

    fetchKeyframes();
  }, [videoFilePath]);

  // Function to generate lyrics
  const generateLyrics = async () => {
    setGeneratingLyrics(true);
    try {
      // Remove the file extension from the videoFilePath (e.g., '.mp3')
      const cleanedFilePath = videoFilePath.replace(/\.[^/.]+$/, ""); // This removes the file extension
  
      // Send the GET request to the API without the .mp3 postfix
      const response = await fetch(`/api/generate_lyric?videoFilePath=${cleanedFilePath}`, {
        method: 'GET',
      });
  
      if (response.ok) {
        const { lyric } = await response.json();
        setLyrics(lyric); // Store the generated lyrics
      } else {
        console.error("Failed to generate lyrics.");
        setError("Failed to generate lyrics.");
      }
    } catch (error) {
      console.error("Error generating lyrics:", error);
      setError("Error generating lyrics.");
    } finally {
      setGeneratingLyrics(false);
    }
  };
  

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 bg-[length:200%_200%] animate-gradient-x p-8">
      <main className="bg-white shadow-xl rounded-lg p-10 sm:p-16 flex flex-col gap-8 items-center max-w-lg w-full">
        <h1 className="text-3xl font-bold text-gray-800">Keyframes</h1>

        {loading ? (
          <p className="text-gray-600">Extracting keyframes, please wait...</p>
        ) : error ? (
          <p className="text-red-600">{error}</p>
        ) : !lyrics && keyframes.length > 0 ? (
          // Hide the keyframes if lyrics are generated
          <div className="grid grid-cols-2 gap-6">
            {keyframes.map((frame, index) => (
              <div key={index} className="relative group transform transition-transform duration-300 hover:scale-105">
                <img
                  src={`${frame}`}
                  alt={`Keyframe ${index + 1}`}
                  className="w-full h-auto rounded-lg shadow-lg hover:shadow-2xl transition-shadow duration-300 opacity-90 hover:opacity-100"
                />
                <span className="absolute top-2 left-2 bg-white bg-opacity-30 text-sm px-2 py-1 rounded-md shadow-md backdrop-blur-md border border-white/20">
                  Frame {index + 1}
                </span>
              </div>
            ))}
          </div>
        ) : (
          !lyrics && <p className="text-gray-600">No keyframes found for this video.</p>
        )}

        {/* Button to trigger lyric generation */}
        <button
          className="mt-6 bg-purple-600 text-white font-semibold py-2 px-4 rounded-lg shadow-lg hover:bg-purple-700 transition duration-300"
          onClick={generateLyrics}
          disabled={generatingLyrics}
        >
          {generatingLyrics ? "Generating Lyrics..." : "Generate Lyrics"}
        </button>

        {/* Display lyrics if available */}
        {generatingLyrics ? (
          <div className="mt-6 animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-purple-600"></div>
        ) : lyrics ? (
          <div className="mt-8 p-6 bg-white rounded-lg shadow-lg w-full max-w-lg text-lg text-center">
            <h2 className="text-2xl font-bold mb-4 text-purple-700">Generated Lyrics</h2>
            <p className="whitespace-pre-wrap text-gray-800">{lyrics}</p>
          </div>
        ) : null}
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
