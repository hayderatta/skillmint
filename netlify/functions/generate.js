
exports.handler = async (event) => {
  const headers = {
    "Content-Type": "application/json"
  };

  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: "Method not allowed" })
    };
  }

  try {
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      throw new Error("Gemini API key is not configured.");
    }

    const data = JSON.parse(event.body || "{}");
    const prompt = data.prompt;

    if (
      typeof prompt !== "string" ||
      !prompt.trim() ||
      prompt.length > 6000
    ) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          error: "Please enter a valid prompt (maximum 6000 characters)."
        })
      };
    }

    const response = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:generateContent?key=" +
      encodeURIComponent(apiKey),
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          contents: [{
            parts: [{ text: prompt }]
          }]
        })
      }
    );

    const result = await response.json();

    if (!response.ok) {
      return {
        statusCode: 502,
        headers,
        body: JSON.stringify({
          error: result.error?.message || "Gemini request failed."
        })
      };
    }

    const output =
      result.candidates?.[0]?.content?.parts
        ?.map(part => part.text || "")
        .join("") || "";

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ output })
    };

  } catch (error) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: error.message || "Something went wrong."
      })
    };
  }
};
