import { NextResponse } from "next/server"

export async function POST() {
  return NextResponse.json(
    {
      success: false,
      error: "This legacy withdrawal endpoint is disabled. Use /api/withdrawals instead.",
    },
    { status: 410 }
  )
}
