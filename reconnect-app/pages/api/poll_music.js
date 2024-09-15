import fetch from 'node-fetch'; // Import node-fetch for ES modules

export default async function handler(req, res) {
  const { clipId } = req.query; // You can pass clipId as a query parameter
  const userToken = ""; // Store the token in your environment variables for security

  if (!clipId) {
    return res.status(400).json({ error: 'Clip ID is required' });
  }

  const url = `https://studio-api.suno.ai/api/external/clips/?ids=${clipId}`;

  try {
    const response = await fetch(url, {
      method: 'GET', // Use GET method for retrieving data
      headers: {
        'Authorization': `Bearer ${userToken}` // Bearer token for authorization
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    const data = await response.json(); // Parse the JSON response
    console.log(data)
    return res.status(200).json(data); // Return the data from the API
  } catch (error) {
    console.error('Error:', error); // Log errors in the console
    return res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
}
