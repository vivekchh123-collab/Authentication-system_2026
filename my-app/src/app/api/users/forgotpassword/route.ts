import { connect } from "@/dbConfig/dbConfig"; // Adjust path to your DB connection file
import User from "@/models/userModel"; // Adjust path to your User model
import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import nodemailer from "nodemailer";

// Ensure the database is connected
connect();

export async function POST(request: NextRequest) {
  try {
    const reqBody = await request.json();
    const { email } = reqBody;

    console.log("Forgot password request received for:", email);

    // 1. Check if user exists
    const user = await User.findOne({ email });
    if (!user) {
      return NextResponse.json(
        { error: "User with this email does not exist" },
        { status: 400 },
      );
    }

    // 2. Generate a secure, temporary reset token
    const resetToken = crypto.randomBytes(32).toString("hex");

    // Hash the token to save it securely in the database (prevents token theft)
    const hashedToken = crypto
      .createHash("sha256")
      .update(resetToken)
      .digest("hex");

    // Set token expiration time (e.g., 1 hour from now)
    const tokenExpiry = Date.now() + 3600000;

    // 3. Save hashed token and expiry to the user document
    user.forgotPasswordToken = hashedToken;
    user.forgotPasswordTokenExpiry = tokenExpiry;
    await user.save();

    // 4. Create the password reset URL pointing to your frontend route
    // In production, make sure NEXT_PUBLIC_DOMAIN is set to your actual domain
    const domain = process.env.DOMAIN || "http://localhost:3000";
    const resetUrl = `${domain}/resetpassword?token=${resetToken}`;

    // 5. Configure Nodemailer Transporter
    // (Use Mailtrap for development, or SendGrid/Amazon SES for production)
    const transporter = nodemailer.createTransport({
      host:"sandbox.smtp.mailtrap.io",
      port:2525,
      auth: {
        user: process.env.MAILTRAP_USER,
        pass: process.env.MAILTRAP_PASS,
      },
    });

    // 6. Define HTML email content
    const mailOptions = {
      from: '"Your App Support" <noreply@yourapp.com>',
      to: user.email,
      subject: "Reset your password",
      html: `
                <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
                    <h2>Password Reset Request</h2>
                    <p>Hello ${user.username || "there"},</p>
                    <p>We received a request to reset your password. Click the button below to choose a new one. This link will expire in 1 hour.</p>
                    <a href="${resetUrl}" style="background-color: #4CAF50; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 15px 0;">Reset Password</a>
                    <p>If you did not request this, please ignore this email and your password will remain unchanged.</p>
                    <p>Alternatively, copy and paste this link into your browser:</p>
                    <p>${resetUrl}</p>
                </div>
            `,
    };

    // 7. Send the email
    await transporter.sendMail(mailOptions);

    return NextResponse.json({
      message: "Password reset link sent to your email successfully",
      success: true,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
