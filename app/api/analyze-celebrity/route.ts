import { NextResponse } from "next/server";
import { celebrities } from "../../celebrity-face/data";

const CELEBRITY_IDS = Object.keys(celebrities);

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

  const match = image.match(/^data:(image\/(?:jpeg|png|gif|webp));base64,(.+)$/);
  if (!match) {
    return NextResponse.json(
      { error: "Invalid image format. Supported: JPEG, PNG, GIF, WebP" },
      { status: 400 }
    );
  }

  const mediaType = match[1] as "image/jpeg" | "image/png" | "image/gif" | "image/webp";
  const base64Data = match[2];

  const celebrityList = CELEBRITY_IDS.map((id) => {
    const c = celebrities[id];
    return `${id}(${c.name}/${c.gender}/${c.keywords.join(",")})`;
  }).join("\n");

  const prompt = `이 사진의 얼굴을 분석해서 닮은 한국 연예인을 찾아주세요.

연예인 목록:
${celebrityList}

반드시 아래 JSON 형식으로만 응답해주세요. 다른 텍스트는 절대 추가하지 마세요:
{
  "gender": "사진 속 인물의 성별 (male 또는 female)",
  "sameGenderTop5": [
    {"celebrityId": "id", "percentage": 수치},
    {"celebrityId": "id", "percentage": 수치},
    {"celebrityId": "id", "percentage": 수치},
    {"celebrityId": "id", "percentage": 수치},
    {"celebrityId": "id", "percentage": 수치}
  ],
  "oppositeGenderTop2": [
    {"celebrityId": "id", "percentage": 수치, "appealPoint": "어필 포인트 한줄 설명"},
    {"celebrityId": "id", "percentage": 수치, "appealPoint": "어필 포인트 한줄 설명"}
  ],
  "faceAnalysis": {
    "eyes": "눈 분석 (한줄, 재미있게)",
    "nose": "코 분석 (한줄, 재미있게)",
    "lips": "입술 분석 (한줄, 재미있게)",
    "faceShape": "얼굴형 분석 (한줄, 재미있게)"
  },
  "overallVibe": ["분위기 키워드1", "분위기 키워드2", "분위기 키워드3", "분위기 키워드4", "분위기 키워드5"],
  "styleRecommendation": {
    "makeup": "메이크업 추천 (한줄)",
    "hair": "헤어스타일 추천 (한줄)",
    "fashion": "패션 스타일 추천 (한줄)"
  },
  "uniqueRate": 0-100 사이의 희귀도 수치,
  "aiComment": "전체 분석을 종합한 재미있는 AI 코멘트 (2-3문장, 한국어, 칭찬 위주)"
}

주의사항:
- sameGenderTop5: 같은 성별 연예인 정확히 5명, percentage 내림차순, 1위는 40-60%, 합계 100
- oppositeGenderTop2: 이성 연예인 정확히 2명, percentage 합계 100
- celebrityId는 반드시 위 목록의 id 중 하나
- overallVibe는 정확히 5개 키워드
- uniqueRate: 0=매우 흔함, 100=전설급 희귀. 대부분 30-70 사이로
- 모든 텍스트는 재미있고 친근한 톤으로 한국어 작성
- 사람 얼굴이 없어도 재미로 가장 비슷한 연예인을 결정해주세요`;

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
        max_tokens: 2048,
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

    let jsonStr = textContent.text.trim();
    const jsonMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) {
      jsonStr = jsonMatch[1].trim();
    }

    const result = JSON.parse(jsonStr);

    // Validate result structure
    if (
      !result.gender ||
      !Array.isArray(result.sameGenderTop5) ||
      result.sameGenderTop5.length < 5 ||
      !Array.isArray(result.oppositeGenderTop2) ||
      result.oppositeGenderTop2.length < 2
    ) {
      return NextResponse.json(
        { error: "AI 분석 결과를 처리할 수 없어요." },
        { status: 500 }
      );
    }

    // Validate celebrity IDs
    for (const m of [...result.sameGenderTop5, ...result.oppositeGenderTop2]) {
      if (!CELEBRITY_IDS.includes(m.celebrityId)) {
        return NextResponse.json(
          { error: "AI 분석 결과를 처리할 수 없어요." },
          { status: 500 }
        );
      }
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("Analyze celebrity error:", error);
    return NextResponse.json(
      { error: "AI 분석 중 오류가 발생했어요." },
      { status: 500 }
    );
  }
}
