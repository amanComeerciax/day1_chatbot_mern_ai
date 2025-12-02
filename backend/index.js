// import express from "express";
// import cors from "cors";
// import dotenv from "dotenv";
// import mongoose from "mongoose";
// import fetch from "node-fetch";
// import Chat from "./models/Chat.js";

// dotenv.config(); // Load .env

// const app = express();
// app.use(cors());
// app.use(express.json());

// // ====================== MONGO CONNECTION ======================
// mongoose.connect(process.env.MONGODB_URI)
//   .then(() => console.log("MongoDB Connected"))
//   .catch((err) => console.log("MongoDB Error ❌", err));

// // ====================== CHAT ENDPOINT ======================
// app.post("/chat", async (req, res) => {
//   const { message } = req.body;

//   try {
//     // Save user message
//     await Chat.create({ role: "user", message });

//     let botReply = "";

//     // 🔥 Intelligent detection for product request
//     if (
//       message.toLowerCase().includes("product") ||
//       message.toLowerCase().includes("item") ||
//       message.toLowerCase().includes("price")
//     ) {
//       // Fetch products from FakeStore API
//       const products = await fetch("https://fakestoreapi.com/products")
//         .then((r) => r.json());

//       botReply =
//         "Here are some top products:\n\n" +
//         products
//           .map((p) => `• ${p.title} - $${p.price}`)
//           .slice(0, 8)
//           .join("\n");

//     } else {
//       // Normal AI reply using Azure/OpenAI
//       const aiRes = await fetch(process.env.AZURE_OPENAI_URL, {
//         method: "POST",
//         headers: {
//           "Content-Type": "application/json",
//           "api-key": process.env.AZURE_OPENAI_API_KEY,
//         },
//         body: JSON.stringify({
//           model: "dolphin-llama3.1",
//           messages: [{ role: "user", content: message }],
//         }),
//       });
      
//       const data = await aiRes.json();
//       botReply = data.choices?.[0]?.message?.content || "Sorry, AI not responding.";
//     }

//     // Save bot reply
//     await Chat.create({ role: "bot", message: botReply });

//     return res.json({ reply: botReply });

//   } catch (error) {
//     console.log("Chat Error ❌", error);
//     return res.status(500).json({ error: "Server error" });
//   }
// });

// // ====================== HISTORY ENDPOINT ======================
// app.get("/history", async (req, res) => {
//   const history = await Chat.find().sort({ timestamp: 1 });
//   res.json(history);
// });

// // ====================== SERVER ======================
// app.listen(5000, () => console.log("Server running on port 5000"));



// server.js
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import mongoose from "mongoose";
import fetch from "node-fetch";
import Chat from "./models/Chat.js";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log("MongoDB Connected"))
  .catch(err => console.log("MongoDB Error:", err));

// Ollama AI Function
async function askAI(prompt) {
  try {
    const response = await fetch("http://localhost:11434/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "dolphin-llama3",   
        messages: [
          {
            role: "system",
            content: `You are a helpful AI assistant. 
            Always reply in clean, structured format using:
            • Short sentences
            • Bullet points when possible
            • Markdown for better readability
            Keep answers professional and friendly.`
          },
          { role: "user", content: prompt }
        ],
        stream: false
      }),
    });

    const data = await response.json();
    return data?.message?.content?.trim() || "Sorry, I couldn't process that.";
  } catch (err) {
    console.log("Ollama Error:", err.message);
    return "AI is not responding right now. Is Ollama running on port 11434?";
  }
}

// POST /chat
app.post("/chat", async (req, res) => {
  const { message } = req.body;

  if (!message?.trim()) return res.status(400).json({ error: "Message required" });

  try {
    // Save user message
    await Chat.create({ role: "user", message });

    let botReply = "";

    // Product Keywords Detection
    const lower = message.toLowerCase();
    if (lower.includes("product") || lower.includes("price") || lower.includes("item") || lower.includes("show") || lower.includes("buy")) {
      const products = await fetch("https://fakestoreapi.com/products").then(r => r.json());
      botReply = `Top Products for You\n\n` +
        products.slice(0, 6)
          .map((p, i) => `${i + 1}. **${p.title}**\n   💰 Price: $${p.price}`)
          .join("\n\n");
    } else {
      botReply = await askAI(message);
    }

    // Save bot reply
    await Chat.create({ role: "bot", message: botReply });

    res.json({ reply: botReply });
  } catch (err) {
    console.error("Chat Error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// GET /history
app.get("/history", async (req, res) => {
  try {
    const history = await Chat.find().sort({ timestamp: 1 });
    res.json(history);
  } catch (err) {
    res.status(500).json({ error: "Failed to load history" });
  }
});

const PORT = 5000;
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});