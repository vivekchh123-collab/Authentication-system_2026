import nodemailer from "nodemailer";
import User from "@/models/userModel";
import bcryptjs from "bcryptjs";

interface SendEmailArgs {
  email: string;
  emailType: "VERIFY" | "RESET";
  userId: string;
}

export const sendEmail = async ({
  email,
  emailType,
  userId,
}: SendEmailArgs) => {
  try {
    if (!userId) throw new Error("userId is missing");
    if (!email) throw new Error("email is missing");

    const baseUrl = process.env.DOMAIN;
    if (!baseUrl) throw new Error("DOMAIN is not configured");

    const hashedToken = await bcryptjs.hash(String(userId), 10);

    const updateData =
      emailType === "VERIFY"
        ? {
            verifyToken: hashedToken,
            verifyTokenExpiry: Date.now() + 3600000,
          }
        : {
            forgotPasswordToken: hashedToken,
            forgotPasswordTokenExpiry: Date.now() + 3600000,
          };

    await User.findByIdAndUpdate(userId, updateData);

    const transport = nodemailer.createTransport({
      host: "sandbox.smtp.mailtrap.io",
      port: 2525,
      auth: {
        user: process.env.MAILTRAP_USER,
        pass: process.env.MAILTRAP_PASS,
      },
    });

    if (!process.env.MAILTRAP_USER || !process.env.MAILTRAP_PASS) {
      throw new Error("Mailtrap credentials are missing");
    }

    const path =
      emailType === "VERIFY"
        ? `/verifyemail?token=${hashedToken}`
        : `/resetpassword?token=${hashedToken}`;

    const fullUrl = `${baseUrl}${path}`;

    const mailOptions = {
      from: process.env.MAIL_FROM || "vivek@gmail.com",
      to: email.trim(),
      subject:
        emailType === "VERIFY" ? "Verify your email" : "Reset your password",
      html: `
        <p>
          Click <a href="${fullUrl}">here</a> to
          ${emailType === "VERIFY" ? "verify your email" : "reset your password"}.
          <br />
          ${fullUrl}
        </p>
      `,
    };

    console.log("mailOptions:", mailOptions);

    return await transport.sendMail(mailOptions);
  } catch (error: any) {
    console.error("sendEmail error:", error);
    throw new Error(error?.message || "Failed to send email");
  }
};
