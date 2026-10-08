"use client";
import Footer from "@/components/Footer";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { ShieldCheck, ArrowLeft, Loader2, Sparkles } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);

    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password: password,
    });

    if (error) {
      console.error("Error devuelto por Supabase:", error);
      setErrorMsg(`Error: ${error.message}`);
      setLoading(false);
      return;
    }

    if (data.user) {
      router.push("/admin");
    }
  };

  return (
    <main
      style={{
        minHeight: "100vh",
        backgroundColor: "#07050e",
        position: "relative",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        padding: "1.5rem",
      }}
    >
      {/* Resplandores ambientales de fiesta */}
      <div
        style={{
          position: "absolute",
          top: "-50px",
          right: "-50px",
          width: "380px",
          height: "380px",
          background: "radial-gradient(circle, rgba(217,70,239,0.3) 0%, rgba(0,0,0,0) 70%)",
          filter: "blur(60px)",
          pointerEvents: "none",
        }}
      />
      <div
        style={{
          position: "absolute",
          bottom: "-50px",
          left: "-50px",
          width: "380px",
          height: "380px",
          background: "radial-gradient(circle, rgba(6,182,212,0.25) 0%, rgba(0,0,0,0) 70%)",
          filter: "blur(60px)",
          pointerEvents: "none",
        }}
      />

      {/* Botón Volver */}
      <div style={{ position: "absolute", top: "1.5rem", left: "1.5rem", zIndex: 20 }}>
        <Link
          href="/"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "6px",
            color: "#a1a1aa",
            textDecoration: "none",
            fontSize: "0.85rem",
            padding: "8px 14px",
            borderRadius: "9999px",
            background: "rgba(255,255,255,0.05)",
            border: "1px solid rgba(255,255,255,0.1)",
            backdropFilter: "blur(10px)",
          }}
        >
          <ArrowLeft style={{ width: 14, height: 14 }} /> Volver al inicio
        </Link>
      </div>

      {/* Tarjeta de Login */}
      <div
        style={{
          zIndex: 10,
          maxWidth: "420px",
          width: "100%",
          padding: "2.5rem 2rem",
          borderRadius: "1.5rem",
          background: "linear-gradient(180deg, rgba(255,255,255,0.07) 0%, rgba(255,255,255,0.02) 100%)",
          border: "1px solid rgba(217, 70, 239, 0.25)",
          backdropFilter: "blur(20px)",
          boxShadow: "0 20px 50px rgba(0,0,0,0.6)",
        }}
      >
        <div style={{ textAlign: "center", marginBottom: "2rem" }}>
          <div
            style={{
              width: 50,
              height: 50,
              borderRadius: "14px",
              background: "linear-gradient(135deg, #d946ef, #ec4899)",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 6px 20px rgba(217, 70, 239, 0.4)",
              marginBottom: "1rem",
            }}
          >
            <ShieldCheck style={{ width: 26, height: 26, color: "#fff" }} />
          </div>
          <h1 style={{ fontSize: "1.75rem", fontWeight: "800", margin: "0 0 6px 0", color: "#fff" }}>
            Acceso Staff
          </h1>
          <p style={{ color: "#a1a1aa", fontSize: "0.85rem", margin: 0 }}>
            Ingresa tus credenciales para administrar eventos
          </p>
        </div>

        {errorMsg && (
          <div
            style={{
              padding: "10px 14px",
              borderRadius: "10px",
              background: "rgba(239, 68, 68, 0.15)",
              border: "1px solid rgba(239, 68, 68, 0.3)",
              color: "#fca5a5",
              fontSize: "0.85rem",
              marginBottom: "1.25rem",
              textAlign: "center",
              wordBreak: "break-word",
            }}
          >
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: "1.2rem" }}>
          <div>
            <label style={{ display: "block", fontSize: "0.8rem", color: "#d4d4d8", marginBottom: "6px", fontWeight: "500" }}>
              Correo electrónico
            </label>
            <input
              type="email"
              required
              placeholder="tu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={{
                width: "100%",
                padding: "12px 14px",
                borderRadius: "10px",
                backgroundColor: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(255,255,255,0.15)",
                color: "#fff",
                fontSize: "0.95rem",
                outline: "none",
                boxSizing: "border-box",
              }}
            />
          </div>

          <div>
            <label style={{ display: "block", fontSize: "0.8rem", color: "#d4d4d8", marginBottom: "6px", fontWeight: "500" }}>
              Contraseña
            </label>
            <input
              type="password"
              required
              placeholder="••••••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{
                width: "100%",
                padding: "12px 14px",
                borderRadius: "10px",
                backgroundColor: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(255,255,255,0.15)",
                color: "#fff",
                fontSize: "0.95rem",
                outline: "none",
                boxSizing: "border-box",
              }}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              marginTop: "0.5rem",
              padding: "12px",
              borderRadius: "10px",
              border: "none",
              background: "linear-gradient(135deg, #d946ef, #ec4899)",
              color: "#fff",
              fontWeight: "700",
              fontSize: "0.95rem",
              cursor: loading ? "not-allowed" : "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
              boxShadow: "0 6px 20px rgba(217, 70, 239, 0.35)",
              opacity: loading ? 0.7 : 1,
            }}
          >
            {loading ? (
              <>
                <Loader2 style={{ width: 18, height: 18, animation: "spin 1s linear infinite" }} />
                Verificando...
              </>
            ) : (
              <>
                Ingresar al Sistema
                <Sparkles style={{ width: 16, height: 16 }} />
              </>
            )}
          </button>
        </form>

        <div style={{ marginTop: "2rem", width: "100%", maxWidth: "420px" }}>
        <Footer />
      </div>
      </div>
    </main>
  );
}