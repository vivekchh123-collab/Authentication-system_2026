import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import { connect } from "@/dbConfig/dbConfig";
import User from "@/models/userModel";
import { sendEmail } from "@/helpers/mailer";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    await connect();

    const { email } = await request.json();

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const resetToken = crypto.randomBytes(32).toString("hex");
    const hashedResetToken = await bcrypt.hash(resetToken, 10);

    user.forgotPasswordToken = hashedResetToken;
    user.forgotPasswordTokenExpiry = Date.now() + 60 * 60 * 1000;

    await user.save();

    const domain = process.env.DOMAIN;
    if (!domain) {
      return NextResponse.json(
        { error: "DOMAIN is not configured" },
        { status: 500 },
      );
    }

    const resetUrl = `${domain}/resetpassword?token=${resetToken}`;

    await sendEmail({
      email: user.email,
      subject: "Password Reset Request",
      message: `
        <h1>Password Reset</h1>
        <p>You requested a password reset.</p>
        <p>Click the link below to reset your password:</p>
        <a href="${resetUrl}">${resetUrl}</a>
        <p>This link will expire in 1 hour.</p>
      `,
    });

    return NextResponse.json(
      { message: "Password reset link sent successfully" },
      { status: 200 },
    );
  } catch (error: any) {
    console.error("Forgot password error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 },
    );
  }
}
