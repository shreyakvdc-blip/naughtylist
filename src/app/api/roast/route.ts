
import { GoogleGenAI } from "@google/genai";
import { NextResponse } from "next/server";

const sleep = (ms: number) =>
  new Promise((resolve) => setTimeout(resolve, ms));

export async function POST(request: Request) {
  try {
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { error: "Gemini API key is missing. Check your .env.local file." },
        { status: 500 }
      );
    }

    const body = await request.json();

    const { answers, status, aura, title } = body;

    if (
      !Array.isArray(answers) ||
      answers.length !== 4 ||
      !answers.every((answer) => typeof answer === "string") ||
      typeof status !== "string" ||
      typeof title !== "string" ||
      typeof aura !== "number" ||
      !Number.isFinite(aura) ||
      aura < 0 ||
      aura > 100
    ) {
      return NextResponse.json(
        { error: "Invalid quiz answers or result." },
        { status: 400 }
      );
    }

    const ai = new GoogleGenAI({ apiKey });

    const prompt = `
You are Santa Claus, but you have a Gen Z brainrot personality.

Your job is to roast someone based on their Christmas quiz answers.

Their four answers:
1. ${answers[0]}
2. ${answers[1]}
3. ${answers[2]}
4. ${answers[3]}

Their Christmas aura: ${aura}/100
Their verdict: ${status}
Their personality title: ${title}

RULES:
- Write a personalised roast based on their actual answers.
- Make it funny, savage, witty and entertaining.
- Use Gen Z slang and occasional brainrot humour.
- You can use phrases like "bro is cooked", "delulu", "NPC behaviour", "main character energy", etc.
- Make it feel like Santa personally investigated them.
- Do not simply repeat their quiz answers.
- Keep it between 2 and 4 sentences.
- Do not use markdown or quotation marks.
- Do not include explanations.
- Return ONLY the roast.
`;

    let lastError: unknown = null;
    let lastStatus = 503;

    // Try Gemini up to 3 times if the service is busy.
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        console.log(`Santa AI attempt ${attempt}/3`);

        const response = await ai.models.generateContent({
          model: "gemini-3.8-flash",
          contents: prompt,
        });

        const roast = response.text?.trim();

        if (!roast) {
          throw new Error("Gemini returned an empty response.");
        }

        console.log("Santa AI roast generated successfully!");

        return NextResponse.json({ roast: roast.slice(0, 1200) });
      } catch (error) {
        lastError = error;

        const errorMessage =
          error instanceof Error ? error.message : String(error);

        const errorStatus =
          typeof error === "object" &&
          error !== null &&
          "status" in error
            ? Number((error as { status?: unknown }).status)
            : undefined;

        if (errorStatus && Number.isFinite(errorStatus)) {
          lastStatus = errorStatus;
        }

        const shouldRetry =
          errorStatus === 429 ||
          errorStatus === 500 ||
          errorStatus === 502 ||
          errorStatus === 503 ||
          errorMessage.includes("UNAVAILABLE") ||
          errorMessage.includes("high demand") ||
          errorMessage.includes("RESOURCE_EXHAUSTED");

        console.error(
          `Santa AI attempt ${attempt} failed:`,
          errorMessage
        );

        if (!shouldRetry || attempt === 3) {
          break;
        }

        console.log("Santa is asking the elves to try again...");

        await sleep(attempt * 2000);
      }
    }

    console.error("All Santa AI attempts failed:", lastError);

    return NextResponse.json(
      {
        error:
          "Santa's AI is experiencing high demand. Please try again later.",
      },
      {
        status: lastStatus === 429 ? 429 : 503,
      }
    );
  } catch (error) {
    console.error("Santa AI roast error:", error);

    return NextResponse.json(
      { error: "Santa couldn't generate your roast right now." },
      { status: 500 }
    );
  }
}
