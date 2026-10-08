import React from "react";
import { Sparkles } from "lucide-react";

export default function Footer() {
  return (
    <footer
      style={{
        width: "100%",
        padding: "1.75rem 1rem",
        textAlign: "center",
        position: "relative",
        zIndex: 20,
        borderTop: "1px solid rgba(255, 255, 255, 0.05)",
        background: "rgba(7, 5, 14, 0.6)",
        backdropFilter: "blur(10px)",
      }}
    >
      <div
        style={{
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "8px",
          fontSize: "0.82rem",
          color: "#a1a1aa",
          letterSpacing: "0.5px",
        }}
      >
        <Sparkles style={{ width: 14, height: 14, color: "#d946ef" }} />
        <span>
          Diseñado con pasión por{" "}
          <strong style={{ color: "#fdf4ff", fontWeight: 700 }}>
            Alvaro Celis Rubio
          </strong>{" "}
          ·{" "}
          <span
            style={{
              background: "linear-gradient(135deg, #d946ef 0%, #06b6d4 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              fontWeight: 800,
              letterSpacing: "1px",
            }}
          >
            ACELIS DESIGN
          </span>
        </span>
      </div>
    </footer>
  );
}