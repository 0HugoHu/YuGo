import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    devMode: process.env.DEV_MODE === "true",
  });
}
