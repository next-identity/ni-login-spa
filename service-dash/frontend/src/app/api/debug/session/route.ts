import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await auth();
  
  return NextResponse.json({
    session,
    hasAccessToken: !!(session as any)?.accessToken,
    accessToken: (session as any)?.accessToken ? 
      `${(session as any)?.accessToken.substring(0, 20)}...` : 
      'missing',
  });
}

