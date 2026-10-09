// src/lib/summarize.ts
export async function summarizeText(transcript: string): Promise<string> {
  const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OpenAI API key not configured. Summarization unavailable.");
  }
  const prompt = `Summarize the following voice note transcript in 2-3 concise sentences, highlighting the key points and action items. Keep the tone neutral and professional.\n\nTranscript:\n"${transcript}"`;
  const body = {
    model: "gpt-4o-mini",
    temperature: 0.5,
    messages: [{ role: "user", content: prompt }],
    max_tokens: 300,
  };
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(body),
  });
  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Summarization failed: ${response.status} ${err}`);
  }
  const data = await response.json();
  const summary = data.choices?.[0]?.message?.content?.trim();
  return summary || "";
}
