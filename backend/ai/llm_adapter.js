const GROQ_API_KEY = process.env.GROQ_API_KEY;
const MODEL = 'llama-3.1-8b-instant';
const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';

export async function askModel(prompt) {
  if (!GROQ_API_KEY) {
    return null;
  }

  try {
    const fetch = (await import('node-fetch')).default;
    const res = await fetch(GROQ_API_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${GROQ_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.9,
        max_tokens: 100
      })
    });

    if (!res.ok) {
      const errorText = await res.text();
      console.error('Groq API error:', res.status, errorText);
      return null;
    }

    const data = await res.json();
    
    if (data.choices && data.choices[0] && data.choices[0].message) {
      return data.choices[0].message.content.trim();
    }
    
    return null;
  } catch (error) {
    console.error('LLM API error:', error);
    return null;
  }
}

export async function generateTaunt(situation) {
  const prompt = `In a card game, ${situation}. Respond with a short, playful comment (max 10 words).`;
  return await askModel(prompt);
}

