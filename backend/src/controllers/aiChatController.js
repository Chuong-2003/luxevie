import { Product } from '../models/Product.js';

const fmt = (n) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n);

export const chatWithAi = async (req, res) => {
  const { message } = req.body;
  const lower = message?.toLowerCase() || "";
  const GROQ_API_KEY = process.env.GROQ_API_KEY;

  try {
    let products = [];
    let contextInfo = "";

    // 1. DATA RETRIEVAL (Same Logic)
    if (lower.includes("mới") || lower.includes("new")) {
      products = await Product.find({ status: 'active' }).sort({ createdAt: -1 }).limit(3).select('name price salePrice slug images');
      contextInfo = "User asked for NEW products. I found these:";
    } else if (lower.includes("bán chạy") || lower.includes("hot")) {
      products = await Product.find({ status: 'active' }).sort({ sold: -1 }).limit(3).select('name price salePrice images');
      contextInfo = "User asked for BEST SELLER products. I found these:";
    } else {
      const ignore = ["xin chào", "hello", "hi", "cảm ơn"];
      if (!ignore.some(w => lower.includes(w)) && message.length > 2) {
        products = await Product.find({ status: 'active', name: { $regex: message, $options: 'i' } }).limit(3).select('name price salePrice images');
        if (products.length > 0) contextInfo = `User searched for "${message}". Found matching products:`;
        else contextInfo = `User searched for "${message}" but NO products were found.`;
      }
    }

    // 2. GENERATE RESPONSE WITH GROQ (Llama 3)
    let reply = "";

    if (GROQ_API_KEY) {
      const productContext = products.map(p => `- ${p.name}: ${fmt(p.salePrice || p.price)}`).join("\n");
      const systemInstruction = `
        You are an intelligent and helpful AI assistant for LuxeVie - a premium fashion shop.
        
        YOUR ROLES:
        1. Sales Assistant: If the Context provided below contains products, help the user choose, compare, or find details about them.
        2. Knowledgeable Companion: If the user asks about fashion trends, styling advice, or GENERAL KNOWLEDGE questions (even unrelated to fashion like math, history, coding, daily life), answer them accurately and naturally.
        
        GUIDELINES:
        - Answer in Vietnamese.
        - Be polite, friendly, and professional.
        - If the user's question is completely unrelated to the shop (e.g., "Who is Einstein?"), just answer it normally. Do not force the conversation back to shopping unless it makes sense.
        - Keep answers concise but sufficient.
      `;
      const userPrompt = `
        CONTEXT FROM DATABASE (if any):
        ${contextInfo}
        
        PRODUCT LIST:
        ${productContext}

        USER MESSAGE: "${message}"
      `;

      // Groq API (OpenAI Compatible)
      const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${GROQ_API_KEY}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          messages: [
            { role: "system", content: systemInstruction },
            { role: "user", content: userPrompt }
          ],
          model: "llama-3.3-70b-versatile", // Or llama3-8b-8192 for speed
          temperature: 0.7
        })
      });

      const data = await response.json();

      if (!response.ok) {
        console.error("GROQ API ERROR:", JSON.stringify(data, null, 2));
        reply = `Lỗi kết nối AI (Groq): ${data.error?.message || "Check Server Logs"}`;
      } else {
        reply = data.choices?.[0]?.message?.content || "AI không phản hồi.";
      }

    } else {
      reply = "Hệ thống chưa cấu hình Key AI.";
    }

    res.json({ reply, products });

  } catch (error) {
    console.error("AI System Error:", error);
    res.json({ reply: "Hệ thống AI đang bảo trì.", products: [] });
  }
};
