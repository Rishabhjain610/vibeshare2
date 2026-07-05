import { NextRequest, NextResponse } from "next/server";
import { rateLimit } from "@/lib/rate-limiter";
import { getProfileByUsername } from "@/lib/profile-service";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  try {
    const { username } = await params;
    if (!username) {
      return NextResponse.json({ error: "Username is required" }, { status: 400 });
    }

    // 1. Get client IP for rate limiting
    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0] ||
      request.headers.get("x-real-ip") ||
      "127.0.0.1";

    // 2. Perform Redis-based rate limiting
    const limitResult = await rateLimit(ip, `profile_get:${username.toLowerCase()}`);

    if (!limitResult.success) {
      console.warn(`[API_PROFILE_GET] Rate limit exceeded for IP: ${ip} on @${username}`);
      return NextResponse.json(
        {
          error: "Too Many Requests",
          limit: limitResult.limit,
          remaining: limitResult.remaining,
          reset: limitResult.reset,
        },
        {
          status: 429,
          headers: {
            "X-RateLimit-Limit": String(limitResult.limit),
            "X-RateLimit-Remaining": String(limitResult.remaining),
            "X-RateLimit-Reset": String(limitResult.reset),
          },
        }
      );
    }

    // 3. Fetch user profile (using Redis cache-aside)
    const profile = await getProfileByUsername(username);

    if (!profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    // 4. Return profile with rate limit headers
    return NextResponse.json(profile, {
      status: 200,
      headers: {
        "X-RateLimit-Limit": String(limitResult.limit),
        "X-RateLimit-Remaining": String(limitResult.remaining),
        "X-RateLimit-Reset": String(limitResult.reset),
      },
    });
  } catch (error) {
    console.error("[API_PROFILE_GET] Error getting profile:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
