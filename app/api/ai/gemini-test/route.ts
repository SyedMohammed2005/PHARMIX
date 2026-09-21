import { NextResponse } from "next/server";
import { gemini } from "@/lib/gemini";

export async function GET() {
  try {
    const response = await gemini.models.generateContent({
      model: "gemini-2.5-flash",
      contents: "Reply with exactly: PHARMIX GEMINI CONNECTED",
    });

    return NextResponse.json({
      success: true,
      message: response.text,
    });
  } catch (error) {
    console.error("Gemini test error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Gemini connection failed",
      },
      { status: 500 },
    );
  }
}