import { NextResponse } from "next/server"

export async function POST() {
  return NextResponse.json(
    {
      success: false,
      error: "Direct balance updates are disabled. Use the secured payment routes instead.",
    },
    { status: 403 }
  )
}
