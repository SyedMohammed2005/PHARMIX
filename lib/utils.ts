import { NextResponse } from "next/server";

export function successResponse<T>(
  data: T,
  status = 200
) {
  return NextResponse.json(
    {
      success: true,
      ...data,
    },
    { status }
  );
}

export function errorResponse(
  message: string,
  status = 500,
  errors?: unknown
) {
  return NextResponse.json(
    {
      success: false,
      message,
      ...(errors !== undefined ? { errors } : {}),
    },
    { status }
  );
}