import { NextResponse } from "next/server"

export async function POST() {
  return NextResponse.json(
    {
      success: false,
      error: "Direct deposit status updates are disabled. Payment processors must use the secured webhook flow.",
    },
    { status: 410 }
  )
}
