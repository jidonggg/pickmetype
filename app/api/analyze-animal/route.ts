import { NextResponse } from "next/server";

const ANIMAL_IDS = [
  "dog",
  "cat",
  "fox",
  "bear",
  "rabbit",
  "deer",
  "dino",
  "wolf",
  "penguin",
  "owl",
  "hamster",
  "tiger",
  "dolphin",
  "butterfly",
  "squirrel",
  "sloth",
  "panda",
  "parrot",
] as const;

const ANIMAL_LABELS: Record<string, string> = {
  dog: "강아지",
  cat: "고양이",
  fox: "여우",
  bear: "곰",
  rabbit: "토끼",
  deer: "사슴",
  dino: "공룡",
  wolf: "늑대",
  penguin: "펭귄",
  owl: "부엉이",
  hamster: "햄스터",
  tiger: "호랑이",
  dolphin: "돌고래",
  butterfly: "나비",
  squirrel: "다람쥐",
  sloth: "나무늘보",
  panda: "판다",
  parrot: "앵무새",
};

export async function POST(request: Request) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "API key not configured" },
      { status: 500 }
    );
  }

  let body: { image: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid request body" },
      { status: 400 }
    );
  }

  const { image } = body;
  if (!image || typeof image !== "string") {
    return NextResponse.json(
      { error: "Image data is required" },
      { status: 400 }
    );
  }

  // Extract base64 data and media type from data URL
  const match = image.match(/^data:(image\/(?:jpeg|png|gif|webp));base64,(.+)$/);
  if (!match) {
    return NextResponse.json(
      { error: "Invalid image format. Supported: JPEG, PNG, GIF, WebP" },
      { status: 400 }
    );
  }

  const mediaType = match[1] as "image/jpeg" | "image/png" | "image/gif" | "image/webp";
  const base64Data = match[2];

  const animalList = ANIMAL_IDS.map((id) => `${id}(${ANIMAL_LABELS[id]})`).join(", ");

  const prompt = `\uC774 \uC0AC\uC9C4\uC758 \uC5BC\uAD74\uC744 \uBD84\uC11D\uD574\uC11C \uB2EE\uC740 \uB3D9\uBB3C\uC0C1\uC744 \uD310\uBCC4\uD574\uC8FC\uC138\uC694.

\uB3D9\uBB3C \uBAA9\uB85D: ${animalList}

\uBC18\uB4DC\uC2DC \uC544\uB798 JSON \uD615\uC2DD\uC73C\uB85C\uB9CC \uC751\uB2F5\uD574\uC8FC\uC138\uC694. \uB2E4\uB978 \uD14D\uC2A4\uD2B8\uB294 \uC808\uB300 \uCD94\uAC00\uD558\uC9C0 \uB9C8\uC138\uC694:
{
  "animal": "\uC704 \uBAA9\uB85D \uC911 \uD558\uB098\uC758 id (\uC608: dog, cat, fox \uB4F1)",
  "confidence": 0-100 \uC0AC\uC774\uC758 \uC218\uCE58,
  "topMatches": [
    {"animal": "id", "percentage": \uC218\uCE58},
    {"animal": "id", "percentage": \uC218\uCE58},
    {"animal": "id", "percentage": \uC218\uCE58}
  ],
  "analysis": "\uC5BC\uAD74 \uD2B9\uC9D5\uACFC \uD574\uB2F9 \uB3D9\uBB3C\uC0C1\uC758 \uC5F0\uACB0\uACE0\uB9AC\uB97C \uC7AC\uBBF8\uC788\uAC8C \uC124\uBA85 (2-3\uBB38\uC7A5, \uD55C\uAD6D\uC5B4)"
}

\uC8FC\uC758\uC0AC\uD56D:
- topMatches\uB294 \uC815\uD655\uD788 3\uAC1C, percentage \uD569\uACC4\uB294 100
- animal \uAC12\uC740 \uBC18\uB4DC\uC2DC \uC704 \uBAA9\uB85D\uC758 id \uC911 \uD558\uB098
- analysis\uB294 \uC7AC\uBBF8\uC788\uACE0 \uCE5C\uADFC\uD55C \uD1A4\uC73C\uB85C \uD55C\uAD6D\uC5B4\uB85C \uC791\uC131
- \uC0AC\uB78C \uC5BC\uAD74\uC774 \uC5C6\uC73C\uBA74 \uADF8\uB798\uB3C4 \uC7AC\uBBF8\uB85C \uAC00\uC7A5 \uBE44\uC2B7\uD55C \uB3D9\uBB3C\uC0C1\uC744 \uACB0\uC815\uD574\uC8FC\uC138\uC694`;

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 1024,
        messages: [
          {
            role: "user",
            content: [
              {
                type: "image",
                source: {
                  type: "base64",
                  media_type: mediaType,
                  data: base64Data,
                },
              },
              {
                type: "text",
                text: prompt,
              },
            ],
          },
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Anthropic API error:", response.status, errorText);
      return NextResponse.json(
        { error: "AI \uBD84\uC11D\uC5D0 \uC2E4\uD328\uD588\uC5B4\uC694. \uB2E4\uC2DC \uC2DC\uB3C4\uD574\uC8FC\uC138\uC694." },
        { status: 500 }
      );
    }

    const data = await response.json();
    const textContent = data.content?.find(
      (c: { type: string }) => c.type === "text"
    );
    if (!textContent?.text) {
      return NextResponse.json(
        { error: "AI \uC751\uB2F5\uC744 \uCC98\uB9AC\uD560 \uC218 \uC5C6\uC5B4\uC694." },
        { status: 500 }
      );
    }

    // Extract JSON from response (handle possible markdown code blocks)
    let jsonStr = textContent.text.trim();
    const jsonMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) {
      jsonStr = jsonMatch[1].trim();
    }

    const result = JSON.parse(jsonStr);

    // Validate result structure
    if (
      !result.animal ||
      !ANIMAL_IDS.includes(result.animal) ||
      !Array.isArray(result.topMatches) ||
      result.topMatches.length < 3
    ) {
      return NextResponse.json(
        { error: "AI \uBD84\uC11D \uACB0\uACFC\uB97C \uCC98\uB9AC\uD560 \uC218 \uC5C6\uC5B4\uC694." },
        { status: 500 }
      );
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("Analyze animal error:", error);
    return NextResponse.json(
      { error: "AI \uBD84\uC11D \uC911 \uC624\uB958\uAC00 \uBC1C\uC0DD\uD588\uC5B4\uC694." },
      { status: 500 }
    );
  }
}
