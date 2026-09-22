import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export async function POST(request) {
  try {
    const { message, userName } = await request.json();

    if (!message) {
      return NextResponse.json({ error: "Message is required" }, { status: 400 });
    }

    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    const prompt = `You are Luna AI, a friendly and helpful AI assistant in a group chat application called Chat 2.0. 
You were mentioned by ${userName} in the chat. Keep your responses concise, engaging, and helpful. 
Use emojis occasionally to be more expressive. Don't use markdown formatting — keep it plain text suitable for a chat message.
If someone asks who you are, tell them you're Luna AI, the resident AI assistant.

User's message: ${message}`;

    const result = await model.generateContent(prompt);
    const response = result.response;
    const text = response.text();

    return NextResponse.json({ reply: text });
  } catch (error) {
    console.error("AI Error:", error);
    return NextResponse.json(
      { error: "Oops! I had a little brain freeze 🧊 Try again in a moment." },
      { status: 500 }
    );
  }
}
