"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const API_BASE = "http://192.168.1.201:8080";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`${API_BASE}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (res.status === 401 || res.status === 400) {
        setError("Invalid email or password.");
        setLoading(false);
        return;
      }

      if (!res.ok) {
        setError("Something went wrong. Try again.");
        setLoading(false);
        return;
      }

      localStorage.setItem("token", data.token);
      router.push("/admin/dashboard");

    } catch {
      setError("Could not reach the server.");
      setLoading(false);
    }
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
      {/* Glass card */}
      <div
        style={{
          position: "relative",
          zIndex: 10,
          width: "620px",
          borderRadius: "20px",
          padding: "52px 60px",
          background: "",
          backdropFilter: "blur(10px)",
          WebkitBackdropFilter: "blur(20px)",
          border: "4px solid rgba(255, 255, 255, 1)",
          boxShadow: "0 8px 40px rgba(0,0,0,0.50)",
        }}
      >
        {/* Title */}
        <h1
          style={{
            textAlign: "center",
            color: "#ffffff",
            fontWeight: 700,
            fontSize: "24px",
            letterSpacing: "0.05em",
            marginBottom: "36px",
            marginTop: 0,
          }}
        >
          GEAR-TRACK
        </h1>

        <form
          onSubmit={handleLogin}
          style={{ display: "flex", flexDirection: "column", gap: "20px" }}
        >
          {/* Email field */}
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="roseInput"
            style={{
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
            }}
          />

          {/* Password field */}
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="roseInput"
            style={{
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
            }}
          />

          {/* Error message */}
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
              {error}
            </p>
          )}

          {/* Login button */}
          <button
            type="submit"
            disabled={loading}
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
              cursor: loading ? "not-allowed" : "pointer",
              opacity: loading ? 0.7 : 1,
              marginTop: "4px",
              boxSizing: "border-box",
            }}
          >
            {loading ? "Signing in..." : "Login"}
          </button>
        </form>

        {/* Forgot password */}
        <div style={{ textAlign: "center", marginTop: "24px" }}>
          <button
            type="button"
            style={{
              background: "none",
              border: "none",
              color: "rgba(255,255,255,0.85)",
              fontSize: "14px",
              fontWeight: 500,
              cursor: "pointer",
            }}
          >
            Forgot Password ?
          </button>
        </div>
      </div>
    </main>
  );
}