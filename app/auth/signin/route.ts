import { createClient } from "@/src/infrastructure/auth/supabase";
import { NextRequest, NextResponse } from "next/server";

/**
 * @swagger
 * /api/auth/signin:
 *   post:
 *     description: Sign in with Google token
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               token:
 *                 type: string
 *     responses:
 *       200:
 *         description: Success
 *       400:
 *         description: Missing token
 */
export async function POST(request: NextRequest) {
  try {
    // Parse the request body to get the token
    const body = await request.json();
    const token = body.token;

    if (!token) {
      return NextResponse.json({ error: "Token is required" }, { status: 400 });
    }

    // Google login with supabase
    const supabase = await createClient();
    const { data, error } = await supabase.auth.signInWithIdToken({
      provider: "google",
      token: token,
    });

    if (error) {
      console.error("Google Login Error:", error);
      return NextResponse.json({ error: error.message }, { status: 401 });
    }

    return NextResponse.json(
      { success: true, user: data.user },
      { status: 200 },
    );
  } catch (error) {
    console.error("Signin route error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
