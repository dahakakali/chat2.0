import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
  console.error("[AI Route] ❌ GEMINI_API_KEY is not set in environment variables");
}

const genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null;

export async function POST(request) {
  if (!genAI) {
    return NextResponse.json(
      { error: "AI is not configured. GEMINI_API_KEY is missing." },
      { status: 503 }
    );
  }

  try {
    const { message, userName } = await request.json();

    if (!message) {
      return NextResponse.json({ error: "Message is required" }, { status: 400 });
    }

    const prompt = `You are Luna AI, a friendly and helpful AI assistant in a group chat application called Chat 2.0. 
You were mentioned by ${userName} in the chat. Keep your responses concise, engaging, and helpful. 
Use emojis occasionally to be more expressive. Don't use markdown formatting — keep it plain text suitable for a chat message.
If someone asks who you are, tell them you're Luna AI, the resident AI assistant.

User's message: ${message}`;

    const models = ["gemini-2.0-flash", "gemini-1.5-flash"];
    let lastError = null;

    for (const modelName of models) {
      try {
        console.log(`[AI Route] Trying model: ${modelName}`);
        const model = genAI.getGenerativeModel({ model: modelName });
        const result = await model.generateContent(prompt);
        const text = result.response.text();
        console.log(`[AI Route] ✅ Success with model: ${modelName}`);
        return NextResponse.json({ reply: text });
      } catch (err) {
        console.warn(`[AI Route] ⚠️ Model ${modelName} failed:`, err.message || err);
        lastError = err;
      }
    }

    throw lastError;
  } catch (error) {
    console.error("[AI Route] ❌ All models failed:", error.message || error);
    return NextResponse.json(
      { error: "Oops! I had a little brain freeze 🧊 Try again in a moment." },
      { status: 500 }
    );
  }
}
