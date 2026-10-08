import Link from "next/link";
import { QrCode, ShieldCheck, Sparkles, PartyPopper, ArrowRight } from "lucide-react";

export default function Home() {
  return (
    <main style={{ minHeight: "100vh", backgroundColor: "#07050e", position: "relative", overflow: "hidden", display: "flex", flexDirection: "column", justifyContent: "space-between", alignItems: "center", padding: "2rem 1rem" }}>
      
      {/* Luces de neón de fondo (Efecto Club / Fiesta) */}
      <div style={{ position: "absolute", top: "-100px", left: "-50px", width: "400px", height: "400px", background: "radial-gradient(circle, rgba(217,70,239,0.35) 0%, rgba(0,0,0,0) 70%)", filter: "blur(60px)", pointerEvents: "none" }} />
      <div style={{ position: "absolute", top: "20%", right: "-80px", width: "450px", height: "450px", background: "radial-gradient(circle, rgba(6,182,212,0.3) 0%, rgba(0,0,0,0) 70%)", filter: "blur(70px)", pointerEvents: "none" }} />
      <div style={{ position: "absolute", bottom: "-100px", left: "20%", width: "500px", height: "400px", background: "radial-gradient(circle, rgba(236,72,153,0.25) 0%, rgba(0,0,0,0) 70%)", filter: "blur(80px)", pointerEvents: "none" }} />

      {/* Badge Superior */}
      <header style={{ zIndex: 10, textAlign: "center", marginTop: "1rem" }}>
        <div style={{ display: "inline-flex", alignItems: "center", gap: "8px", padding: "6px 16px", borderRadius: "9999px", background: "rgba(255, 255, 255, 0.06)", border: "1px solid rgba(217, 70, 239, 0.3)", backdropFilter: "blur(12px)", color: "#f0abfc", fontSize: "0.8rem", fontWeight: "600", letterSpacing: "1px", textTransform: "uppercase" }}>
          <Sparkles style={{ width: 14, height: 14, color: "#e879f9" }} />
          Acelis Design Experience
          <PartyPopper style={{ width: 14, height: 14, color: "#facc15" }} />
        </div>
      </header>

      {/* Bloque Central */}
      <div style={{ zIndex: 10, maxWidth: "680px", width: "100%", textAlign: "center", margin: "auto 0", padding: "2rem 0" }}>
        
        {/* Título Principal */}
        <h1 style={{ fontSize: "clamp(2.5rem, 7vw, 4.5rem)", fontWeight: 900, lineHeight: 1.1, margin: "0 0 1rem 0", letterSpacing: "-1px" }}>
          ACELIS{" "}
          <span style={{ background: "linear-gradient(135deg, #f43f5e 0%, #d946ef 50%, #06b6d4 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
            ACCESS
          </span>
        </h1>

        <p style={{ color: "#a1a1aa", fontSize: "clamp(0.95rem, 2vw, 1.15rem)", maxWidth: "480px", margin: "0 auto 2.5rem auto", lineHeight: 1.6 }}>
          Control inteligente de <span style={{ color: "#f472b6", fontWeight: "600" }}>Free Pass</span>, invitaciones de cortesía y validación QR en puerta.
        </p>

        {/* Tarjetas de Acceso */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "1.25rem", padding: "0 0.5rem" }}>
          
          {/* Tarjeta Panel Admin */}
          <Link
            href="/login"
            style={{ textDecoration: "none", textAlign: "left", padding: "1.5rem", borderRadius: "1.25rem", background: "linear-gradient(180deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.02) 100%)", border: "1px solid rgba(217, 70, 239, 0.25)", backdropFilter: "blur(16px)", display: "flex", flexDirection: "column", justifyContent: "space-between", minHeight: "180px", boxShadow: "0 10px 30px rgba(0,0,0,0.5)", transition: "all 0.2s" }}
          >
            <div>
              <div style={{ width: 44, height: 44, borderRadius: 12, background: "linear-gradient(135deg, #d946ef, #ec4899)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "1rem", boxShadow: "0 4px 15px rgba(217, 70, 239, 0.4)" }}>
                <ShieldCheck style={{ width: 22, height: 22, color: "#fff" }} />
              </div>
              <h2 style={{ fontSize: "1.25rem", fontWeight: "bold", color: "#fff", margin: "0 0 6px 0" }}>
                Panel de Control
              </h2>
              <p style={{ color: "#9ca3af", fontSize: "0.85rem", margin: 0 }}>
                Crea eventos, sube flyers y administra las invitaciones.
              </p>
            </div>
            <div style={{ marginTop: "1.5rem", display: "flex", alignItems: "center", gap: 6, color: "#e879f9", fontSize: "0.85rem", fontWeight: "600" }}>
              Ingresar al panel <ArrowRight style={{ width: 14, height: 14 }} />
            </div>
          </Link>

          {/* Tarjeta Escáner QR */}
          <Link
            href="/escanear"
            style={{ textDecoration: "none", textAlign: "left", padding: "1.5rem", borderRadius: "1.25rem", background: "linear-gradient(180deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.02) 100%)", border: "1px solid rgba(6, 182, 212, 0.25)", backdropFilter: "blur(16px)", display: "flex", flexDirection: "column", justifyContent: "space-between", minHeight: "180px", boxShadow: "0 10px 30px rgba(0,0,0,0.5)", transition: "all 0.2s" }}
          >
            <div>
              <div style={{ width: 44, height: 44, borderRadius: 12, background: "linear-gradient(135deg, #06b6d4, #3b82f6)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "1rem", boxShadow: "0 4px 15px rgba(6, 182, 212, 0.4)" }}>
                <QrCode style={{ width: 22, height: 22, color: "#fff" }} />
              </div>
              <h2 style={{ fontSize: "1.25rem", fontWeight: "bold", color: "#fff", margin: "0 0 6px 0" }}>
                Escáner Puerta
              </h2>
              <p style={{ color: "#9ca3af", fontSize: "0.85rem", margin: 0 }}>
                Valida códigos QR en vivo desde el celular del staff.
              </p>
            </div>
            <div style={{ marginTop: "1.5rem", display: "flex", alignItems: "center", gap: 6, color: "#67e8f9", fontSize: "0.85rem", fontWeight: "600" }}>
              Abrir lector <ArrowRight style={{ width: 14, height: 14 }} />
            </div>
          </Link>

        </div>
      </div>

      {/* Footer con tu Autoría */}
      <footer style={{ zIndex: 10, textAlign: "center", fontSize: "0.8rem", color: "#71717a", borderTop: "1px solid rgba(255,255,255,0.08)", width: "100%", maxWidth: "600px", paddingTop: "1rem" }}>
        <p style={{ margin: 0 }}>
          Diseñado con pasión por{" "}
          <span style={{ color: "#f0abfc", fontWeight: "600" }}>
            Alvaro Celis Rubio
          </span>{" "}
          · <span style={{ color: "#e4e4e7", letterSpacing: "1px" }}>ACELIS DESIGN</span>
        </p>
      </footer>

    </main>
  );
}