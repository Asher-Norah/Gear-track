"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";

const API_BASE = "http://192.168.1.201:8080";

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!token) {
      setError("Invalid reset link. Please request a new one.");
    }
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (newPassword.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`${API_BASE}/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, new_password: newPassword }),
      });

      const data = await res.json();

      if (res.status === 400 && data.error === "invalid or expired reset token") {
        setError("This reset link has expired or already been used. Please request a new one.");
        setLoading(false);
        return;
      }

      if (!res.ok) {
        setError(data.error || "Something went wrong. Try again.");
        setLoading(false);
        return;
      }

      setSuccess(true);
      setTimeout(() => router.push("/login"), 3000);

    } catch {
      setError("Could not reach the server.");
    } finally {
      setLoading(false);
    }
  };

  const inputStyle: React.CSSProperties = {
    width: "100%",
    borderRadius: "999px",
    padding: "14px 24px",
    color: "#ffffff",
    fontWeight: 600,
    fontSize: "15px",
    background: "rgba(245, 166, 35, 1)",
    border: "1px solid rgba(255, 255, 255, 1)",
    outline: "none",
    boxSizing: "border-box",
  };

  return (
    <main
      style={{
        position: "relative",
        minHeight: "100vh",
        width: "100%",
        display: "flex",
        alignItems: "center",
        overflow: "hidden",
        backgroundImage: "url('/images/login-bg.png')",
        backgroundSize: "cover",
        backgroundPosition: "center 20%",
        backgroundRepeat: "no-repeat",
        justifyContent: "center",
      }}
    >
      <div
        style={{
          position: "relative",
          zIndex: 10,
          width: "620px",
          borderRadius: "20px",
          padding: "52px 60px",
          backdropFilter: "blur(10px)",
          WebkitBackdropFilter: "blur(20px)",
          border: "4px solid rgba(255, 255, 255, 1)",
          boxShadow: "0 8px 40px rgba(0,0,0,0.50)",
        }}
      >
        <h1
          style={{
            textAlign: "center",
            color: "#ffffff",
            fontWeight: 700,
            fontSize: "24px",
            letterSpacing: "0.05em",
            marginBottom: "12px",
            marginTop: 0,
          }}
        >
          GEAR-TRACK
        </h1>

        {success ? (
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: "48px", marginBottom: "16px" }}>✅</div>
            <p style={{ color: "#ffffff", fontSize: "15px", fontWeight: 600, marginBottom: "8px" }}>
              Password reset successfully!
            </p>
            <p style={{ color: "rgba(255,255,255,0.6)", fontSize: "13px" }}>
              Redirecting you to login...
            </p>
          </div>
        ) : (
          <>
            <p style={{ textAlign: "center", color: "rgba(255,255,255,0.7)", fontSize: "14px", marginBottom: "32px", marginTop: 0 }}>
              Enter your new password below.
            </p>

            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
              {/* New password */}
              <div style={{ position: "relative" }}>
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="New Password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  style={{ ...inputStyle, paddingRight: "48px" }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((s) => !s)}
                  style={{ position: "absolute", right: "14px", top: "50%", transform: "translateY(-50%)", background: "transparent", border: "none", color: "#ffffff", cursor: "pointer", padding: 0 }}
                >
                  {showPassword ? (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  ) : (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M3 3l18 18" />
                      <path d="M10.6 10.6A3 3 0 0 0 13.4 13.4" />
                      <path d="M9.9 5.1A10.7 10.7 0 0 1 12 5c6.5 0 10 7 10 7a14.7 14.7 0 0 1-4 5.2" />
                      <path d="M6.3 6.3A14.7 14.7 0 0 0 2 12s3.5 7 10 7a10.7 10.7 0 0 0 3.8-.7" />
                    </svg>
                  )}
                </button>
              </div>

              {/* Confirm password */}
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Confirm New Password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                style={inputStyle}
              />

              {error && (
                <p style={{
                  margin: 0,
                  color: "#f87171",
                  fontSize: "13px",
                  textAlign: "center",
                  background: "rgba(239,68,68,0.15)",
                  padding: "10px 16px",
                  borderRadius: "8px",
                }}>
                  {error}{" "}
                  {error.includes("expired") && (
                    <span
                      onClick={() => router.push("/forgot-password")}
                      style={{ textDecoration: "underline", cursor: "pointer" }}
                    >
                      Request a new link
                    </span>
                  )}
                </p>
              )}

              <button
                type="submit"
                disabled={loading || !token}
                style={{
                  width: "100%",
                  borderRadius: "999px",
                  padding: "14px",
                  fontWeight: 700,
                  fontSize: "15px",
                  color: "#ffffff",
                  letterSpacing: "0.15em",
                  textTransform: "uppercase",
                  background: "#000000",
                  border: "none",
                  cursor: loading || !token ? "not-allowed" : "pointer",
                  opacity: loading || !token ? 0.7 : 1,
                  boxSizing: "border-box",
                }}
              >
                {loading ? "Resetting..." : "Reset Password"}
              </button>
            </form>
          </>
        )}

        <div style={{ textAlign: "center", marginTop: "24px" }}>
          <button
            type="button"
            onClick={() => router.push("/login")}
            style={{ background: "none", border: "none", color: "rgba(255,255,255,0.85)", fontSize: "14px", fontWeight: 500, cursor: "pointer" }}
          >
            ← Back to Login
          </button>
        </div>
      </div>
    </main>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense>
      <ResetPasswordForm />
    </Suspense>
  );
}