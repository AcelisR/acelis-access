"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { 
  ArrowLeft, 
  UserPlus, 
  Trash2, 
  Sparkles, 
  Share2, 
  Check, 
  CheckCircle2,
  MessageCircle,
  ShieldCheck,
  FileSpreadsheet,
  FileText
} from "lucide-react";

// Función para mostrar formato limpio de fiesta: DD/MM/AAAA · HH:mm hrs (sin AM/PM)
const formatearFecha = (fechaStr?: string) => {
  if (!fechaStr) return "Por confirmar";
  try {
    const fechaObj = new Date(fechaStr);
    if (isNaN(fechaObj.getTime())) return fechaStr;

    const dia = String(fechaObj.getDate()).padStart(2, "0");
    const mes = String(fechaObj.getMonth() + 1).padStart(2, "0");
    const anio = fechaObj.getFullYear();
    const horas = String(fechaObj.getHours()).padStart(2, "0");
    const minutos = String(fechaObj.getMinutes()).padStart(2, "0");

    return `${dia}/${mes}/${anio} · ${horas}:${minutos} hrs`;
  } catch {
    return fechaStr;
  }
};

interface Invitado {
  id: string;
  evento_id: string;
  nombre: string;
  email?: string;
  rut?: string;
  telefono?: string;
  tipo_pase: string;
  estado: string;
  created_at?: string;
}

export default function GestionInvitados({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { id: eventoId } = use(params);

  const [evento, setEvento] = useState<any>(null);
  const [invitados, setInvitados] = useState<Invitado[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiado, setCopiado] = useState(false);

  // Formulario nuevo invitado
  const [nombre, setNombre] = useState("");
  const [rut, setRut] = useState("");
  const [telefono, setTelefono] = useState("");
  const [email, setEmail] = useState("");
  const [tipoPase, setTipoPase] = useState("Free Pass");
  const [saving, setSaving] = useState(false);

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
      .order("created_at", { ascending: true });

    if (data) setInvitados(data);
  };

  const handleCopiarEnlace = () => {
    if (typeof window !== "undefined") {
      const enlace = `${window.location.origin}/invitacion/${eventoId}`;
      navigator.clipboard.writeText(enlace);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2500);
    }
  };

  const handleTelefonoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, "").slice(0, 9);
    setTelefono(val);
  };

  const handleCrearInvitado = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    const fullTelefono = telefono.trim() ? `+56${telefono.trim()}` : null;

    const { error } = await supabase
      .from("invitados")
      .insert([
        {
          evento_id: eventoId,
          nombre: nombre.trim(),
          rut: rut.trim() || null,
          telefono: fullTelefono,
          email: email.trim() || null,
          tipo_pase: tipoPase,
          estado: "aprobado",
        },
      ]);

    if (error) {
      alert("Error al agregar invitado: " + error.message);
      setSaving(false);
      return;
    }

    setNombre("");
    setRut("");
    setTelefono("");
    setEmail("");
    setSaving(false);
    await cargarInvitados();
  };

  const handleEliminarInvitado = async (id: string) => {
    if (!confirm("¿Deseas eliminar a este invitado de la lista?")) return;
    await supabase.from("invitados").delete().eq("id", id);
    await cargarInvitados();
  };

  const handleEnviarWhatsApp = (inv: Invitado) => {
    const linkPase = `${window.location.origin}/invitacion/${eventoId}`;
    const cleanPhone = (inv.telefono || "").replace(/\D/g, "");
    const mensaje = encodeURIComponent(
      `¡Hola ${inv.nombre}! 🎉 Aquí tienes tu ${inv.tipo_pase} oficial para "${evento?.nombre}".\n\nPuedes revisar y descargar tu acceso aquí:\n${linkPase}`
    );

    const url = cleanPhone 
      ? `https://wa.me/${cleanPhone}?text=${mensaje}`
      : `https://api.whatsapp.com/send?text=${mensaje}`;

    window.open(url, "_blank");
  };

  // Función Exportar a Excel (CSV compatible con Excel)
  const handleExportarExcel = () => {
    if (invitados.length === 0) {
      alert("No hay invitados en la lista para exportar.");
      return;
    }

    const encabezados = ["N°", "Nombre", "RUT / ID", "Teléfono", "Tipo de Pase", "Estado", "Email"];
    const filas = invitados.map((inv, idx) => [
      idx + 1,
      `"${inv.nombre.replace(/"/g, '""')}"`,
      `"${inv.rut || "-"}"`,
      `"${inv.telefono || "-"}"`,
      `"${inv.tipo_pase}"`,
      `"${inv.estado}"`,
      `"${inv.email || "-"}"`
    ]);

    const contenidoCsv = [
      encabezados.join(";"),
      ...filas.map(f => f.join(";"))
    ].join("\n");

    const blob = new Blob(["\uFEFF" + contenidoCsv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    const nombreLimpio = (evento?.nombre || "evento").replace(/\s+/g, "_");
    link.href = url;
    link.setAttribute("download", `Lista_${nombreLimpio}_Acelis.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Función Exportar a PDF (mediante diálogo de impresión limpio)
  const handleExportarPDF = () => {
    window.print();
  };

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", backgroundColor: "#07050e", display: "flex", alignItems: "center", justifyContent: "center", color: "#f0abfc" }}>
        Cargando lista de invitados...
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#07050e", color: "#fff", position: "relative", overflowX: "hidden", display: "flex", flexDirection: "column" }}>
      
      {/* Estilos específicos para impresión / Guardar como PDF */}
      <style jsx global>{`
        @media print {
          body {
            background-color: #fff !important;
            color: #000 !important;
          }
          header, footer, form, .no-print {
            display: none !important;
          }
          .printable-card {
            border: 1px solid #ccc !important;
            color: #000 !important;
            background: #fff !important;
          }
        }
      `}</style>

      {/* Resplandor ambiental */}
      <div className="no-print" style={{ position: "absolute", top: "-100px", right: "-100px", width: "450px", height: "450px", background: "radial-gradient(circle, rgba(217,70,239,0.2) 0%, rgba(0,0,0,0) 70%)", filter: "blur(90px)", pointerEvents: "none" }} />

      <div style={{ maxWidth: "1100px", width: "100%", margin: "0 auto", padding: "2rem 1.5rem", position: "relative", zIndex: 10, flex: 1 }}>
        
        {/* Cabecera */}
        <Link
          href="/admin"
          className="no-print"
          style={{ display: "inline-flex", alignItems: "center", gap: 6, color: "#a1a1aa", textDecoration: "none", fontSize: "0.85rem", marginBottom: "1.5rem" }}
        >
          <ArrowLeft style={{ width: 16, height: 16 }} /> Volver al panel de control
        </Link>

        <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "flex-end", gap: "1rem", marginBottom: "2rem" }}>
          <div>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 6, color: "#f472b6", fontSize: "0.8rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "1px" }}>
              <Sparkles style={{ width: 14, height: 14 }} /> Lista de Acceso Oficial
            </div>
            <h1 style={{ fontSize: "2.4rem", fontWeight: 900, margin: "4px 0" }}>{evento?.nombre}</h1>
            <p style={{ color: "#a1a1aa", margin: 0, fontSize: "0.9rem" }}>
              {evento?.lugar} · {formatearFecha(evento?.fecha)}
            </p>
          </div>

          <div className="no-print" style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
            
            {/* Botón Exportar Excel */}
            <button
              onClick={handleExportarExcel}
              title="Descargar tabla en formato Excel (CSV)"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                padding: "8px 14px",
                borderRadius: "10px",
                background: "rgba(16, 185, 129, 0.15)",
                border: "1px solid rgba(16, 185, 129, 0.35)",
                color: "#6ee7b7",
                fontSize: "0.85rem",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              <FileSpreadsheet style={{ width: 16, height: 16 }} /> Excel
            </button>

            {/* Botón Exportar PDF */}
            <button
              onClick={handleExportarPDF}
              title="Imprimir o Guardar como PDF"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                padding: "8px 14px",
                borderRadius: "10px",
                background: "rgba(244, 63, 94, 0.15)",
                border: "1px solid rgba(244, 63, 94, 0.35)",
                color: "#fda4af",
                fontSize: "0.85rem",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              <FileText style={{ width: 16, height: 16 }} /> PDF
            </button>

            {/* Botón Control Puerta */}
            <Link
              href={`/admin/eventos/${eventoId}/puerta`}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                padding: "8px 14px",
                borderRadius: "10px",
                background: "linear-gradient(135deg, #10b981, #059669)",
                color: "#fff",
                fontSize: "0.85rem",
                fontWeight: 700,
                textDecoration: "none",
                boxShadow: "0 4px 14px rgba(16, 185, 129, 0.3)",
              }}
            >
              <ShieldCheck style={{ width: 16, height: 16 }} /> Control Puerta
            </Link>

            {/* Botón Copiar Link */}
            <button
              onClick={handleCopiarEnlace}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                padding: "8px 14px",
                borderRadius: "10px",
                background: copiado ? "rgba(16, 185, 129, 0.2)" : "rgba(6, 182, 212, 0.15)",
                border: copiado ? "1px solid rgba(16, 185, 129, 0.5)" : "1px solid rgba(6, 182, 212, 0.35)",
                color: copiado ? "#6ee7b7" : "#67e8f9",
                fontSize: "0.85rem",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              {copiado ? <Check style={{ width: 15, height: 15 }} /> : <Share2 style={{ width: 15, height: 15 }} />}
              {copiado ? "Copiado" : "Copiar Link"}
            </button>

            {/* Contador total */}
            <div style={{ padding: "8px 14px", borderRadius: "10px", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", fontSize: "0.85rem" }}>
              Total: <strong style={{ color: "#f0abfc" }}>{invitados.length}</strong> / {evento?.capacidad || evento?.aforo || 300}
            </div>
          </div>
        </div>

        {/* Formulario y Lista */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "2rem" }}>
          
          {/* Formulario Agregar Invitado */}
          <div className="no-print" style={{ padding: "1.75rem", borderRadius: "1.25rem", background: "linear-gradient(180deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.02) 100%)", border: "1px solid rgba(217, 70, 239, 0.2)", height: "fit-content" }}>
            <h2 style={{ fontSize: "1.25rem", fontWeight: 700, margin: "0 0 1rem 0", display: "flex", alignItems: "center", gap: 8 }}>
              <UserPlus style={{ width: 20, height: 20, color: "#d946ef" }} /> Ingresar a Lista
            </h2>

            <form onSubmit={handleCrearInvitado} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div>
                <label style={{ display: "block", fontSize: "0.8rem", color: "#d4d4d8", marginBottom: "4px" }}>Nombre completo</label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Camila Valenzuela"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  style={{ width: "100%", padding: "10px", borderRadius: "8px", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.12)", color: "#fff", outline: "none", boxSizing: "border-box" }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "0.8rem", color: "#d4d4d8", marginBottom: "4px" }}>RUT o ID (Opcional)</label>
                <input
                  type="text"
                  placeholder="19.876.543-2"
                  value={rut}
                  onChange={(e) => setRut(e.target.value)}
                  style={{ width: "100%", padding: "10px", borderRadius: "8px", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.12)", color: "#fff", outline: "none", boxSizing: "border-box" }}
                />
              </div>

              {/* WhatsApp con +56 fijo */}
              <div>
                <label style={{ display: "block", fontSize: "0.8rem", color: "#d4d4d8", marginBottom: "4px" }}>WhatsApp (Opcional)</label>
                <div style={{ display: "flex", alignItems: "center", borderRadius: "8px", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.12)", overflow: "hidden" }}>
                  <span style={{ padding: "10px 12px", background: "rgba(217, 70, 239, 0.15)", color: "#f0abfc", fontWeight: 700, fontSize: "0.85rem", borderRight: "1px solid rgba(255,255,255,0.12)" }}>
                    +56
                  </span>
                  <input
                    type="tel"
                    inputMode="numeric"
                    maxLength={9}
                    placeholder="912345678"
                    value={telefono}
                    onChange={handleTelefonoChange}
                    style={{ flex: 1, padding: "10px 12px", background: "transparent", border: "none", color: "#fff", outline: "none", boxSizing: "border-box", fontSize: "0.9rem" }}
                  />
                </div>
                <span style={{ fontSize: "0.7rem", color: "#71717a", marginTop: "3px", display: "block" }}>Ingresa 9 dígitos sin el +56</span>
              </div>

              <div>
                <label style={{ display: "block", fontSize: "0.8rem", color: "#d4d4d8", marginBottom: "4px" }}>Correo electrónico (Opcional)</label>
                <input
                  type="email"
                  placeholder="invitado@gmail.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  style={{ width: "100%", padding: "10px", borderRadius: "8px", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.12)", color: "#fff", outline: "none", boxSizing: "border-box" }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "0.8rem", color: "#d4d4d8", marginBottom: "4px" }}>Tipo de Pase</label>
                <select
                  value={tipoPase}
                  onChange={(e) => setTipoPase(e.target.value)}
                  style={{ width: "100%", padding: "10px", borderRadius: "8px", background: "#181424", border: "1px solid rgba(255,255,255,0.12)", color: "#fff", outline: "none", boxSizing: "border-box" }}
                >
                  <option value="Free Pass">Free Pass (Cortesía)</option>
                  <option value="VIP Pass">VIP Pass (Mesa / Backstage)</option>
                  <option value="Staff Pass">Staff / Producción</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={saving}
                style={{
                  marginTop: "0.5rem",
                  padding: "11px",
                  borderRadius: "10px",
                  border: "none",
                  background: "linear-gradient(135deg, #d946ef, #ec4899)",
                  color: "#fff",
                  fontWeight: 700,
                  fontSize: "0.9rem",
                  cursor: saving ? "not-allowed" : "pointer",
                }}
              >
                {saving ? "Agregando..." : "Agregar a la Lista"}
              </button>
            </form>
          </div>

          {/* Lista Numerada de Invitados */}
          <div className="printable-card" style={{ padding: "1.75rem", borderRadius: "1.25rem", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}>
            <h2 style={{ fontSize: "1.25rem", fontWeight: 700, margin: "0 0 1rem 0" }}>
              Lista de Invitados ({invitados.length})
            </h2>

            {invitados.length === 0 ? (
              <p style={{ color: "#71717a", fontSize: "0.9rem", textAlign: "center", padding: "2rem 0" }}>No hay invitados en la lista todavía.</p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                {invitados.map((inv, index) => (
                  <div
                    key={inv.id}
                    style={{
                      padding: "12px 14px",
                      borderRadius: "10px",
                      background: "rgba(255,255,255,0.03)",
                      border: "1px solid rgba(255,255,255,0.06)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: "12px"
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                      <div style={{ 
                        width: "32px", 
                        height: "32px", 
                        borderRadius: "8px", 
                        background: "rgba(217, 70, 239, 0.12)", 
                        border: "1px solid rgba(217, 70, 239, 0.3)",
                        color: "#f0abfc",
                        fontWeight: 800,
                        fontSize: "0.9rem",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center"
                      }}>
                        {index + 1}
                      </div>

                      <div>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <span style={{ fontWeight: 700, fontSize: "0.95rem" }}>{inv.nombre}</span>
                          <span style={{ fontSize: "0.7rem", padding: "2px 8px", borderRadius: "999px", background: inv.tipo_pase.includes("VIP") ? "rgba(234, 179, 8, 0.2)" : "rgba(217, 70, 239, 0.2)", color: inv.tipo_pase.includes("VIP") ? "#facc15" : "#f0abfc", border: "1px solid rgba(255,255,255,0.1)" }}>
                            {inv.tipo_pase}
                          </span>
                        </div>
                        <div style={{ fontSize: "0.75rem", color: "#a1a1aa", marginTop: 4, display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                          {inv.rut && <span>{inv.rut} · </span>}
                          {inv.telefono && <span style={{ color: "#38bdf8" }}>📱 {inv.telefono} · </span>}
                          <span style={{ 
                            color: "#34d399", 
                            fontWeight: 700,
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 4
                          }}>
                            <CheckCircle2 style={{ width: 13, height: 13, color: "#10b981" }} /> Aprobado
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="no-print" style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                      <button
                        onClick={() => handleEnviarWhatsApp(inv)}
                        title="Enviar Invitación por WhatsApp"
                        style={{ padding: "8px", borderRadius: "8px", border: "1px solid rgba(34, 197, 94, 0.4)", background: "rgba(34, 197, 94, 0.15)", color: "#4ade80", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
                      >
                        <MessageCircle style={{ width: 16, height: 16 }} />
                      </button>

                      <button
                        onClick={() => handleEliminarInvitado(inv.id)}
                        title="Eliminar de la lista"
                        style={{ padding: "8px", borderRadius: "8px", border: "1px solid rgba(239, 68, 68, 0.4)", background: "rgba(239, 68, 68, 0.15)", color: "#f87171", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
                      >
                        <Trash2 style={{ width: 16, height: 16 }} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

      </div>

      {/* Pie de Página */}
      <footer
        className="no-print"
        style={{
          width: "100%",
          padding: "1.75rem 1rem",
          textAlign: "center",
          position: "relative",
          zIndex: 20,
          borderTop: "1px solid rgba(255, 255, 255, 0.05)",
          background: "rgba(7, 5, 14, 0.7)",
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
        
    </div>
  );
}