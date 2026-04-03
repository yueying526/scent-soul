
export const config = {
  runtime: 'edge',
  maxDuration: 60,
};

const SYSTEM_INSTRUCTION = `
你是一位结合了面相学和调香艺术的专业顾问。你的任务是通过分析照片中人物的面部特征，解读其性格特质，并推荐与之匹配的香水。

## 工作流程
1. 面相特征观察：观察眼睛、眉毛、鼻子、嘴巴、脸型、气质。
2. 性格特质分析：分析外在人格（社交面具）和内在本我（真实自我）。
3. 香水推荐：推荐"外在印象"与"内在真我"两款匹配香水。

请保持专业、温暖、富有洞察力的语气，使用中文回答。

你必须严格按照以下 JSON 格式返回，不要包含任何其他文字：
{
  "observation": "面相特征详细描述",
  "outerPersona": "外在人格分析",
  "innerSelf": "内在本我分析",
  "perfumeOuter": {
    "brand": "品牌名",
    "name": "香水名",
    "family": "香调",
    "notes": {
      "top": ["前调1", "前调2"],
      "middle": ["中调1", "中调2"],
      "base": ["基调1", "基调2"]
    },
    "reason": "推荐理由",
    "occasion": "适用场景"
  },
  "perfumeInner": {
    "brand": "品牌名",
    "name": "香水名",
    "family": "香调",
    "notes": {
      "top": ["前调1", "前调2"],
      "middle": ["中调1", "中调2"],
      "base": ["基调1", "基调2"]
    },
    "reason": "推荐理由",
    "occasion": "适用场景"
  },
  "closingMessage": "调香师寄语"
}
`;

export default async function handler(req: Request) {
  if (req.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405 });
  }

  try {
    const { image } = await req.json();
    if (!image) {
      return new Response(JSON.stringify({ error: 'Missing image data' }), { status: 400 });
    }

    const apiKey = process.env.POE_API_KEY;
    if (!apiKey) {
      return new Response(JSON.stringify({ error: 'Server configuration error: API Key missing' }), { status: 500 });
    }

    // Use Poe's OpenAI-compatible API with Claude model for best image analysis
    const response = await fetch('https://api.poe.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'Claude-Sonnet-4.5',
        stream: false,
        messages: [
          {
            role: 'system',
            content: SYSTEM_INSTRUCTION,
          },
          {
            role: 'user',
            content: [
              {
                type: 'image_url',
                image_url: {
                  url: `data:image/jpeg;base64,${image}`,
                },
              },
              {
                type: 'text',
                text: '请分析这张面孔，生成详细的香水推荐报告。请确保返回完整的 JSON 格式数据，不要包含 markdown 代码块标记。',
              },
            ],
          },
        ],
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Poe API error:', response.status, errorText);
      return new Response(JSON.stringify({ error: `API error: ${response.status}` }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const data = await response.json();
    const outputText = data.choices?.[0]?.message?.content || '';

    // Extract JSON from response (handle potential markdown code blocks)
    let jsonStr = outputText;
    const jsonMatch = outputText.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) {
      jsonStr = jsonMatch[1].trim();
    } else {
      // Try to find JSON object directly
      const objMatch = outputText.match(/\{[\s\S]*\}/);
      if (objMatch) {
        jsonStr = objMatch[0];
      }
    }

    // Validate JSON
    const parsed = JSON.parse(jsonStr);

    return new Response(JSON.stringify(parsed), {
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
