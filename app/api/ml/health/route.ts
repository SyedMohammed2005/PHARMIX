import { NextResponse } from "next/server";
import {
  checkMLServiceHealth,
} from "@/services/prediction.service";

export async function GET() {
  const health =
    await checkMLServiceHealth();

  return NextResponse.json({
    success: health.available,
    mlService: health,
  });
}