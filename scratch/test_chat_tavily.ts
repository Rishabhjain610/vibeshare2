import axios from "axios";
import dotenv from "dotenv";
dotenv.config();

async function testChatTavily() {
  const body = {
    messages: [
      {
        role: "user",
        content: "latest news on ai",
        id: "msg_123",
        parts: [{ type: "text", text: "latest news on ai" }],
      },
    ],
    model: "minimax-m3:cloud",
  };

  try {
    console.log("Sending request to /api/chat...");
    const response = await axios.post("http://localhost:3000/api/chat", body, {
      headers: {
        "Content-Type": "application/json",
      },
    });
    console.log("Response Status:", response.status);
    console.log("Response Headers:", response.headers);
    console.log("Response Body preview:", String(response.data).substring(0, 1000));
  } catch (err: any) {
    console.error("API Call failed:", err.response?.data || err.message);
  }
}

testChatTavily();
