console.log("[Vocab] background script loaded");

const GEMINI_API_KEY = "AIzaSyC9ARC_C2BlEUEIIhs1vDDX8279PztH1iE";
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-lite:generateContent?key=${GEMINI_API_KEY}`;

async function callGemini(word) {
  const res = await fetch(GEMINI_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [
        {
          parts: [
            {
              text: `Translate "${word}" to Vietnamese. Return JSON only: {"translation":"...","synonyms":["..."],"examples":["..."]}`,
            },
          ],
        },
      ],
      generationConfig: {
        response_mime_type: "application/json",
      },
    }),
  });

  const data = await res.json();

  // Handle lỗi từ Gemini rõ ràng
  if (!res.ok) {
    console.error("[Vocab] Gemini API error:", res.status, data.error?.message);
    throw new Error(`Gemini ${res.status}: ${data.error?.message}`);
  }

  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  return JSON.parse(text);
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log("[Vocab] message received:", message);

  callGemini(message.word)
    .then((result) => {
      console.log("[Vocab] gemini result:", result);
      sendResponse(result);
    })
    .catch((err) => {
      console.error("[Vocab] gemini error:", err);
      sendResponse({ error: err.message });
    });

  return true;
});
