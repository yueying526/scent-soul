
import { GoogleGenAI, Type, Schema } from "@google/genai";

// 使用 Vercel Edge Runtime 以获得最快响应
export const config = {
  runtime: 'edge',
};

const SYSTEM_INSTRUCTION = `
你是一位结合了面相学和调香艺术的专业顾问。你的任务是通过分析照片中人物的面部特征，解读其性格特质，并推荐与之匹配的香水。

## 工作流程
1. 面相特征观察：观察眼睛、眉毛、鼻子、嘴巴、脸型、气质。
2. 性格特质分析：分析外在人格（社交面具）和内在本我（真实自我）。
3. 香水推荐：推荐“外在印象”与“内在真我”两款匹配香水。

请保持专业、温暖、富有洞察力的语气，使用中文回答。
`;

const responseSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    observation: { type: Type.STRING, description: "面相特征详细描述" },
    outerPersona: { type: Type.STRING, description: "外在人格分析" },
    innerSelf: { type: Type.STRING, description: "内在本我分析" },
    perfumeOuter: {
      type: Type.OBJECT,
      properties: {
        brand: { type: Type.STRING },
        name: { type: Type.STRING },
        family: { type: Type.STRING },
        notes: {
          type: Type.OBJECT,
          properties: {
            top: { type: Type.ARRAY, items: { type: Type.STRING } },
            middle: { type: Type.ARRAY, items: { type: Type.STRING } },
            base: { type: Type.ARRAY, items: { type: Type.STRING } },
          },
        },
        reason: { type: Type.STRING },
        occasion: { type: Type.STRING },
      },
      required: ["brand", "name", "family", "notes", "reason", "occasion"],
    },
    perfumeInner: {
      type: Type.OBJECT,
      properties: {
        brand: { type: Type.STRING },
        name: { type: Type.STRING },
        family: { type: Type.STRING },
        notes: {
          type: Type.OBJECT,
          properties: {
            top: { type: Type.ARRAY, items: { type: Type.STRING } },
            middle: { type: Type.ARRAY, items: { type: Type.STRING } },
            base: { type: Type.ARRAY, items: { type: Type.STRING } },
          },
        },
        reason: { type: Type.STRING },
        occasion: { type: Type.STRING },
      },
      required: ["brand", "name", "family", "notes", "reason", "occasion"],
    },
    closingMessage: { type: Type.STRING, description: "调香师寄语" },
  },
  required: ["observation", "outerPersona", "innerSelf", "perfumeOuter", "perfumeInner", "closingMessage"],
};

export default async function handler(req: Request) {
  if (req.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405 });
  }

  try {
    const { image } = await req.json();
    if (!image) {
      return new Response(JSON.stringify({ error: 'Missing image data' }), { status: 400 });
    }

    const apiKey = process.env.API_KEY;
    if (!apiKey) {
      return new Response(JSON.stringify({ error: 'Server configuration error: API Key missing' }), { status: 500 });
    }

    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: "image/jpeg",
              data: image,
            },
          },
          {
            text: "请分析这张面孔，生成详细的香水推荐报告。请确保返回完整的 JSON 格式数据。",
          },
        ],
      },
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        responseMimeType: "application/json",
        responseSchema: responseSchema,
      },
    });

    const outputText = response.text;
    return new Response(outputText, {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error("Proxy Error:", error);
    return new Response(JSON.stringify({ error: error.message || 'Internal Server Error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
