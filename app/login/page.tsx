"use client";

import { useState } from "react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    // TODO: connect to backend auth endpoint
    console.log("Login attempt:", { email, password });
    setTimeout(() => setLoading(false), 1500);
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
          Welcome
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