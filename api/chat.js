
export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "POST method only" });
  }

  try {
    const { message } = req.body || {};

    if (typeof message !== "string" || !message.trim()) {
      return res.status(400).json({
        error: "Please enter a message."
      });
    }

    const apiKey = process.env.GROQ_API_KEY;

    if (!apiKey) {
      console.error("GROQ_API_KEY is missing in Vercel.");
      return res.status(500).json({
        error: "GROQ_API_KEY missing. Check Vercel Environment Variables."
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
                "You are LocalPilot AI, a helpful assistant for students, coding, study and business. Reply in the user's language, including Telugu-English when appropriate. Be clear, friendly and safe."
            },
            {
              role: "user",
              content: message.trim().slice(0, 8000)
            }
          ],
          temperature: 0.7,
          max_tokens: 700
        })
      }
    );

    const raw = await response.text();
    let data = {};

    try {
      data = JSON.parse(raw);
    } catch {
      console.error("Groq returned a non-JSON response.");
    }

    if (!response.ok) {
      const providerMessage =
        data.error?.message || raw.slice(0, 300);

      console.error(
        "Groq API failure:",
        response.status,
        providerMessage
      );

      let hint = "Check the Groq API configuration.";

      if (response.status === 401) {
        hint = "API key is invalid or expired. Check your Groq key.";
      } else if (response.status === 403) {
        hint = "Groq access is denied. Check account or key permissions.";
      } else if (response.status === 429) {
        hint = "Groq rate limit or usage limit reached.";
      } else if (response.status === 400) {
        hint = "Groq rejected the request. Check model or request settings.";
      }

      return res.status(502).json({
        error: `Groq error ${response.status}: ${hint}`
      });
    }

    const reply = data.choices?.[0]?.message?.content;

    if (!reply) {
      console.error("Groq response contained no assistant reply.");
      return res.status(502).json({
        error: "Groq returned no reply. Please try again."
      });
    }

    return res.status(200).json({ reply });
  } catch (error) {
    console.error("LocalPilot server error:", error.message);

    return res.status(500).json({
      error: "Server error. Check Vercel function logs."
    });
  }
}
