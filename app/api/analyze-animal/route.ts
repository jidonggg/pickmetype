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

  const prompt = `이 사진의 얼굴을 분석해서 닮은 동물상을 판별해주세요.

동물 목록: ${animalList}

반드시 아래 JSON 형식으로만 응답해주세요. 다른 텍스트는 절대 추가하지 마세요:
{
  "animal": "위 목록 중 하나의 id (예: dog, cat, fox 등)",
  "confidence": 0-100 사이의 수치,
  "topMatches": [
    {"animal": "id", "percentage": 수치},
    {"animal": "id", "percentage": 수치},
    {"animal": "id", "percentage": 수치}
  ],
  "analysis": "얼굴 특징과 해당 동물상의 연결고리를 재미있게 설명 (2-3문장, 한국어)"
}

주의사항:
- topMatches는 정확히 3개, percentage 합계는 100
- animal 값은 반드시 위 목록의 id 중 하나
- analysis는 재미있고 친근한 톤으로 한국어로 작성
- 사람 얼굴이 없으면 그래도 재미로 가장 비슷한 동물상을 결정해주세요`;

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
        { error: "AI 분석에 실패했어요. 다시 시도해주세요." },
        { status: 500 }
      );
    }

    const data = await response.json();
    const textContent = data.content?.find(
      (c: { type: string }) => c.type === "text"
    );
    if (!textContent?.text) {
      return NextResponse.json(
        { error: "AI 응답을 처리할 수 없어요." },
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
        { error: "AI 분석 결과를 처리할 수 없어요." },
        { status: 500 }
      );
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("Analyze animal error:", error);
    return NextResponse.json(
      { error: "AI 분석 중 오류가 발생했어요." },
      { status: 500 }
    );
  }
}
