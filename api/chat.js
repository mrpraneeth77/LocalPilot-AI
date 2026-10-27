
export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({
      error: "POST method only"
    });
  }

  try {
    const { message } = req.body || {};

    if (!message || typeof message !== "string") {
      return res.status(400).json({
        error: "Please enter a message"
      });
    }

    const apiKey = process.env.GROQ_API_KEY;

    if (!apiKey) {
      return res.status(500).json({
        error: "AI setup pending. Please configure the API key."
      });
    }

    const response = await fetch(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: "llama-3.3-70b-versatile",
          messages: [
            {
              role: "system",
              content:
                "You are LocalPilot AI, a helpful assistant for students, coding, study, and business. Reply in the language the user uses, including Telugu-English when appropriate. Be clear, friendly, and safe."
            },
            {
              role: "user",
              content: message.slice(0, 8000)
            }
          ],
          temperature: 0.7,
          max_tokens: 700
        })
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return res.status(502).json({
        error: "AI provider request failed. Check API setup or usage limits."
      });
    }

    return res.status(200).json({
      reply: data.choices?.[0]?.message?.content || "Try again, bro."
    });
  } catch (error) {
    return res.status(500).json({
      error: "Server error. Please try again."
    });
  }
}
