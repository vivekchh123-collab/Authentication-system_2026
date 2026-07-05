"use client";

import Link from "next/link";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import { toast } from "react-hot-toast";

export default function ForgotPasswordPage() {
  const router = useRouter();

  const [user, setUser] = useState({
    email: "",
  });

  const [buttonDisabled, setButtonDisabled] = useState(true);
  const [loading, setLoading] = useState(false);

  const onForgotPassword = async () => {
    try {
      setLoading(true);

      const response = await axios.post("/api/users/forgotpassword", user);
      console.log("Forgot password success:", response.data);

      toast.success(
        response.data?.message || "Password reset link sent to your email",
      );
      router.push("/login");
    } catch (error: any) {
      console.log(
        "Forgot password failed:",
        error.response?.data || error.message,
      );

      toast.error(error.response?.data?.message || "Failed to send reset link");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setButtonDisabled(user.email.trim().length === 0);
  }, [user.email]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen py-2">
      <h1>{loading ? "Processing..." : "Forgot Password"}</h1>

      <hr className="my-4 w-full max-w-sm" />

      <label htmlFor="email">Email</label>
      <input
        className="p-2 border border-gray-300 rounded-lg mb-4 focus:outline-none focus:border-gray-600 text-black"
        id="email"
        type="email"
        value={user.email}
        onChange={(e) => setUser({ ...user, email: e.target.value })}
        placeholder="vivek@gmail.com"
      />

      <button
        onClick={onForgotPassword}
        disabled={buttonDisabled || loading}
        className="p-2 border border-gray-300 rounded-lg mb-4 focus:outline-none focus:border-gray-600 disabled:opacity-50"
      >
        {loading ? "Sending..." : "Send Reset Link"}
      </button>

      <Link href="/login">Back to login</Link>
    </div>
  );
}
