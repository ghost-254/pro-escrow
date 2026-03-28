import { NextResponse } from "next/server"

export async function POST() {
  return NextResponse.json(
    {
      success: false,
      error: "This legacy withdrawal webhook is disabled.",
    },
    { status: 410 }
  )
}
