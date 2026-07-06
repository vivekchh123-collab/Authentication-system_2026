"use client";
import Link from "next/link";
import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import { toast } from "react-hot-toast";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [user, setUser] = React.useState({
    email: "",
  });
  const [buttonDisabled, setButtonDisabled] = React.useState(false);
  const [loading, setLoading] = React.useState(false);

  const onForgotPassword = async () => {
    try {
      setLoading(true);
      const response = await axios.post("/api/users/forgotpassword", user);
      console.log("Reset email sent successfully", response.data);
      toast.success("Password reset link sent to your email!");

      // Optionally redirect to login or a confirmation page
      router.push("/login");
    } catch (error: any) {
      console.log("Forgot password request failed", error.message);
      // Fallback to error response message if available from your backend
      const errorMessage = error.response?.data?.error || error.message;
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user.email.length > 0) {
      setButtonDisabled(false);
    } else {
      setButtonDisabled(true);
    }
  }, [user]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen py-2">
      <h1>{loading ? "Processing" : "Forgot Password"}</h1>
      <p className="text-gray-400 text-sm mb-4">
        Enter your email address to receive a password reset link.
      </p>
      <hr className="w-full max-w-xs mb-4" />

      <label htmlFor="email">Email</label>
      <input
        className="p-2 border border-gray-300 rounded-lg mb-4 focus:outline-none focus:border-gray-600 text-white"
        id="email"
        type="email"
        value={user.email}
        onChange={(e) => setUser({ ...user, email: e.target.value })}
        placeholder="Enter your email"
      />

      <button
        onClick={onForgotPassword}
        disabled={buttonDisabled || loading}
        className={`p-2 border border-gray-300 rounded-lg mb-4 focus:outline-none focus:border-gray-600 ${
          buttonDisabled ? "opacity-50 cursor-not-allowed" : "hover:bg-gray-800"
        }`}
      >
        {loading ? "Sending..." : "Send Reset Link"}
      </button>

      <Link href="/login" className="text-blue-500 hover:underline mb-2">
        Back to Login
      </Link>
      <Link href="/signup" className="text-blue-500 hover:underline">
        Don't have an account? Signup
      </Link>
    </div>
  );
}
