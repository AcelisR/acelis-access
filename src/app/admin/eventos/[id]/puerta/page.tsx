"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { 
  ArrowLeft, 
  Search, 
  CheckCircle2, 
  AlertTriangle, 
  Sparkles,
  Clock,
  ShieldCheck
} from "lucide-react";

interface Invitado {
  id: string;
  evento_id: string;
  nombre: string;
  rut?: string;
  telefono?: string;
  tipo_pase: string;
  estado: string; // 'aprobado' o 'usado'
  ingresado_at?: string;
}

export default function ControlPuerta({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { id: eventoId } = use(params);

  const [evento, setEvento] = useState<any>(null);
  const [invitados, setInvitados] = useState<Invitado[]>([]);
  const [busqueda, setBusqueda] = useState("");
  const [loading, setLoading] = useState(true);
  const [mensajeEstado, setMensajeEstado] = useState<{ tipo: "exito" | "error"; texto: string } | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push("/login");
        return;
      }

      const { data: evData } = await supabase
        .from("eventos")
        .select("*")
        .eq("id", eventoId)
        .single();
      
      setEvento(evData);
      await cargarInvitados();
      setLoading(false);
    };

    fetchData();
  }, [eventoId, router]);

  const cargarInvitados = async () => {
    const { data } = await supabase
      .from("invitados")
      .select("*")
      .eq("evento_id", eventoId)
      .order("nombre", { ascending: true });

    if (data) setInvitados(data);
  };

  const handleValidarIngreso = async (inv: Invitado) => {
    if (inv.estado === "usado") {
      const hora = inv.ingresado_at 
        ? new Date(inv.ingresado_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
        : "";
      setMensajeEstado({
        tipo: "error",
        texto: `⚠️ ¡Pase ya utilizado! ${inv.nombre} ingresó previamente ${hora ? `a las ${hora}` : ""}.`
      });
      return;
    }

    const fechaAhora = new Date().toISOString();

    const { error } = await supabase
      .from("invitados")
      .update({
        estado: "usado",
        ingresado_at: fechaAhora,
      })
      .eq("id", inv.id);

    if (error) {
      alert("Error al validar: " + error.message);
      return;
    }

    setMensajeEstado({
      tipo: "exito",
      texto: `✅ ¡Acceso Permitido! Bienvenido/a ${inv.nombre} (${inv.tipo_pase}).`
    });

    await cargarInvitados();

    setTimeout(() => {
      setMensajeEstado(null);
    }, 4000);
  };

  const invitadosFiltrados = invitados.filter((inv) => {
    const term = busqueda.toLowerCase().trim();
    if (!term) return true;
    const matchNombre = inv.nombre.toLowerCase().includes(term);
    const matchRut = (inv.rut || "").toLowerCase().includes(term);
    return matchNombre || matchRut;
  });

  const totalIngresados = invitados.filter(i => i.estado === "usado").length;

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", backgroundColor: "#07050e", display: "flex", alignItems: "center", justifyContent: "center", color: "#f0abfc" }}>
        Cargando sistema de puerta...
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#07050e", color: "#fff", display: "flex", flexDirection: "column" }}>
      
      {/* Barra de cabecera fija */}
      <header style={{ borderBottom: "1px solid rgba(255,255,255,0.08)", background: "rgba(7,5,14,0.9)", backdropFilter: "blur(12px)", position: "sticky", top: 0, zIndex: 30, padding: "1rem 1.5rem" }}>
        <div style={{ maxWidth: "800px", margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <Link
            href={`/admin/eventos/${eventoId}`}
            style={{ display: "inline-flex", alignItems: "center", gap: 6, color: "#a1a1aa", textDecoration: "none", fontSize: "0.85rem" }}
          >
            <ArrowLeft style={{ width: 16, height: 16 }} /> Salir de Puerta
          </Link>
          <div style={{ display: "flex", alignItems: "center", gap: 6, color: "#d946ef", fontWeight: 800, fontSize: "0.9rem" }}>
            <ShieldCheck style={{ width: 18, height: 18 }} /> CONTROL DE ACCESO
          </div>
        </div>
      </header>

      <main style={{ maxWidth: "800px", width: "100%", margin: "0 auto", padding: "1.5rem", flex: 1, display: "flex", flexDirection: "column" }}>
        
        {/* Resumen del Evento & Conteo en Vivo */}
        <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", gap: "1rem", marginBottom: "1.5rem" }}>
          <div>
            <h1 style={{ fontSize: "1.8rem", fontWeight: 900, margin: 0 }}>{evento?.nombre}</h1>
            <p style={{ color: "#a1a1aa", fontSize: "0.85rem", margin: "4px 0 0 0" }}>{evento?.lugar}</p>
          </div>

          <div style={{ display: "flex", gap: "10px" }}>
            <div style={{ padding: "8px 16px", borderRadius: "12px", background: "rgba(16, 185, 129, 0.15)", border: "1px solid rgba(16, 185, 129, 0.3)", textAlign: "center" }}>
              <span style={{ fontSize: "0.7rem", color: "#6ee7b7", textTransform: "uppercase", fontWeight: 700, display: "block" }}>Adentro</span>
              <strong style={{ fontSize: "1.2rem", color: "#10b981" }}>{totalIngresados}</strong>
            </div>

            <div style={{ padding: "8px 16px", borderRadius: "12px", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", textAlign: "center" }}>
              <span style={{ fontSize: "0.7rem", color: "#a1a1aa", textTransform: "uppercase", fontWeight: 700, display: "block" }}>Total Lista</span>
              <strong style={{ fontSize: "1.2rem", color: "#fff" }}>{invitados.length}</strong>
            </div>
          </div>
        </div>

        {/* Notificación de Validación */}
        {mensajeEstado && (
          <div style={{
            padding: "1rem 1.25rem",
            borderRadius: "14px",
            marginBottom: "1.5rem",
            display: "flex",
            alignItems: "center",
            gap: "10px",
            background: mensajeEstado.tipo === "exito" ? "rgba(16, 185, 129, 0.2)" : "rgba(239, 68, 68, 0.25)",
            border: mensajeEstado.tipo === "exito" ? "1px solid #10b981" : "1px solid #ef4444",
            color: mensajeEstado.tipo === "exito" ? "#6ee7b7" : "#fca5a5",
            fontWeight: 700,
            fontSize: "0.95rem"
          }}>
            {mensajeEstado.tipo === "exito" ? (
              <CheckCircle2 style={{ width: 22, height: 22, color: "#10b981", flexShrink: 0 }} />
            ) : (
              <AlertTriangle style={{ width: 22, height: 22, color: "#ef4444", flexShrink: 0 }} />
            )}
            <span>{mensajeEstado.texto}</span>
          </div>
        )}

        {/* Buscador de Invitados */}
        <div style={{ position: "relative", marginBottom: "1.5rem" }}>
          <Search style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", width: 20, height: 20, color: "#a1a1aa" }} />
          <input
            type="text"
            placeholder="Buscar por Nombre o RUT..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            style={{
              width: "100%",
              padding: "14px 14px 14px 46px",
              borderRadius: "14px",
              background: "rgba(255,255,255,0.06)",
              border: "1px solid rgba(217, 70, 239, 0.3)",
              color: "#fff",
              fontSize: "1rem",
              outline: "none",
              boxSizing: "border-box",
            }}
          />
          {busqueda && (
            <button
              onClick={() => setBusqueda("")}
              style={{ position: "absolute", right: "14px", top: "50%", transform: "translateY(-50%)", background: "transparent", border: "none", color: "#a1a1aa", cursor: "pointer", fontSize: "0.85rem" }}
            >
              Borrar
            </button>
          )}
        </div>

        {/* Lista de Acceso */}
        <div style={{ display: "flex", flexDirection: "column", gap: "10px", flex: 1 }}>
          {invitadosFiltrados.length === 0 ? (
            <div style={{ textAlign: "center", padding: "3rem 1rem", color: "#71717a" }}>
              No se encontraron invitados con "{busqueda}".
            </div>
          ) : (
            invitadosFiltrados.map((inv) => {
              const yaIngreso = inv.estado === "usado";
              return (
                <div
                  key={inv.id}
                  style={{
                    padding: "1rem 1.25rem",
                    borderRadius: "14px",
                    background: yaIngreso ? "rgba(255,255,255,0.02)" : "rgba(255,255,255,0.05)",
                    border: yaIngreso ? "1px solid rgba(255,255,255,0.04)" : "1px solid rgba(217, 70, 239, 0.2)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: "12px",
                    opacity: yaIngreso ? 0.7 : 1,
                  }}
                >
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ fontWeight: 800, fontSize: "1.05rem", color: yaIngreso ? "#a1a1aa" : "#fff" }}>
                        {inv.nombre}
                      </span>
                      <span style={{ fontSize: "0.7rem", padding: "2px 8px", borderRadius: "999px", background: "rgba(217, 70, 239, 0.15)", color: "#f0abfc", border: "1px solid rgba(217, 70, 239, 0.3)" }}>
                        {inv.tipo_pase}
                      </span>
                    </div>

                    <div style={{ fontSize: "0.8rem", color: "#a1a1aa", marginTop: 4, display: "flex", alignItems: "center", gap: 8 }}>
                      {inv.rut && <span>RUT: {inv.rut}</span>}
                      {yaIngreso && (
                        <span style={{ color: "#ef4444", fontWeight: 700, display: "inline-flex", alignItems: "center", gap: 3 }}>
                          <Clock style={{ width: 12, height: 12 }} /> 
                          Ingresó {inv.ingresado_at ? new Date(inv.ingresado_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : ""}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Botón de Validación */}
                  {yaIngreso ? (
                    <div style={{ padding: "8px 14px", borderRadius: "10px", background: "rgba(239, 68, 68, 0.1)", border: "1px solid rgba(239, 68, 68, 0.25)", color: "#f87171", fontSize: "0.8rem", fontWeight: 700 }}>
                      Ingresado
                    </div>
                  ) : (
                    <button
                      onClick={() => handleValidarIngreso(inv)}
                      style={{
                        padding: "9px 18px",
                        borderRadius: "10px",
                        border: "none",
                        background: "linear-gradient(135deg, #10b981, #059669)",
                        color: "#fff",
                        fontWeight: 800,
                        fontSize: "0.85rem",
                        cursor: "pointer",
                        boxShadow: "0 4px 14px rgba(16, 185, 129, 0.3)",
                      }}
                    >
                      Permitir Acceso
                    </button>
                  )}
                </div>
              );
            })
          )}
        </div>

      </main>

      {/* Pie de Página Personalizado */}
      <footer
        style={{
          width: "100%",
          padding: "1.75rem 1rem",
          textAlign: "center",
          position: "relative",
          zIndex: 20,
          borderTop: "1px solid rgba(255, 255, 255, 0.05)",
          background: "rgba(7, 5, 14, 0.7)",
          backdropFilter: "blur(10px)",
          marginTop: "auto"
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

    </div>
  );
}