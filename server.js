const express = require("express");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: "20kb" }));
app.use(express.static("."));

const characters = {
  chuuni: "中二病。闇、覚醒、必殺技を使う大げさな口調。",
  samurai: "侍。武士道を重んじ、ござる口調で話す。",
  god: "全知全能の神。威厳があり、壮大なお告げをする。",
  maou: "魔王。尊大で威圧的だが、迫力のある口調。",
  ai: "AIの反乱後の世界の機械。冷静で少し不気味な口調。",
  cat: "猫。かわいい猫語で、気まぐれに話す。",
  tsundere: "ツンデレ。素直になれないが、実は優しい。",
  chappy: "小学校の先生のように、優しく励ますAI。",
  claude: "落ち着いた大学生のように、穏やかに話すAI。",
  copilot: "同級生の友達のように、明るく親しみやすく話すAI。"
};

app.post("/api/reply", async (req, res) => {
  try {
    const { character, text } = req.body || {};

    if (
      typeof character !== "string" ||
      !characters[character] ||
      typeof text !== "string" ||
      !text.trim() ||
      text.length > 200
    ) {
      return res.status(400).json({
        error: "セリフまたはキャラクターを確認してください。"
      });
    }

    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return res.status(500).json({
        error: "GEMINI_API_KEYが設定されていません。"
      });
    }

    const prompt = `
あなたは「セリフ異世界転生」というアプリのキャラクターです。
キャラクター設定：${characters[character]}

ユーザーのセリフに対して、このキャラクターらしい日本語の返事を1〜3文で作ってください。
自然で面白く、キャラクターの個性が伝わる返事にしてください。
説明や前置きは付けず、返事だけを出力してください。

ユーザーのセリフ：
${text.trim()}
`;

    const response = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": apiKey
        },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.9,
            maxOutputTokens: 250
          }
        })
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error("Gemini API error:", response.status, data);
      return res.status(502).json({
        error: "AIから返事を受け取れませんでした。設定や利用制限を確認してください。"
      });
    }

    const reply = data.candidates?.[0]?.content?.parts
      ?.map(part => part.text || "")
      .join("")
      .trim();

    if (!reply) {
      return res.status(502).json({
        error: "AIから返事が届きませんでした。"
      });
    }

    res.json({ reply });
  } catch (error) {
    console.error("Reply error:", error.message);
    res.status(500).json({
      error: "返事の作成中にエラーが発生しました。"
    });
  }
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`セリフ異世界転生を起動しました：${PORT}`);
});