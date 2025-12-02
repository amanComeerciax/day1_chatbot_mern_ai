import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import fetch from "node-fetch";
import mongoose from "mongoose";
import Chat from "./models/Chat.js";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// Connect MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log("MongoDB Connected ✔"))
  .catch(err => console.log("MongoDB Error ❌", err));

const chatCompletionApiUrl = process.env.AZURE_OPENAI_URL;

// Chat API route
app.post("/chat", async (req, res) => {
  const { message } = req.body;

  try {
    await Chat.create({ role: "user", message });

    const response = await fetch(chatCompletionApiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "api-key": process.env.AZURE_OPENAI_API_KEY,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini-2",
        messages: [{ role: "user", content: message }]
      })
    });

    const data = await response.json();
    const botReply = data.choices[0].message.content;

    await Chat.create({ role: "bot", message: botReply });

    res.json({ reply: botReply });

  } catch (err) {
    console.log("Chat error:", err);
    res.status(500).json({ error: "Chat error" });
  }
});

// Chat History
app.get("/history", async (req, res) => {
  const history = await Chat.find().sort({ timestamp: 1 });
  res.json(history);
});

app.listen(5000, () => console.log("Server running on port 5000"));
