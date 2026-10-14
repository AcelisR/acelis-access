"use client";

import { useEffect, useState, useRef, use, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { QRCodeSVG } from "qrcode.react";
import { toPng } from "html-to-image";
import { 
  Sparkles, 
  MapPin, 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  Ticket, 
  Loader2, 
  ShieldCheck, 
  Download,
  MessageCircle
} from "lucide-react";

// Formato limpio de fecha: DD/MM/AAAA · HH:mm hrs
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

function ContenidoInvitacion({ eventoId }: { eventoId: string }) {
  const searchParams = useSearchParams();
  const invitadoIdParam = searchParams.get("invitadoId");

  const [evento, setEvento] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [eventoNoExiste, setEventoNoExiste] = useState(false);

  // Formulario
  const [nombre, setNombre] = useState("");
  const [rut, setRut] = useState("");
  const [telefono, setTelefono] = useState("");
  const [email, setEmail] = useState("");
  const [registrando, setRegistrando] = useState(false);
  const [descargando, setDescargando] = useState(false);
  const [paseGenerado, setPaseGenerado] = useState<any>(null);

  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const cargarTodo = async () => {
      try {
        // 1. Cargar datos del evento
        const { data: evData, error: evError } = await supabase
          .from("eventos")
          .select("*")
          .eq("id", eventoId)
          .single();

        if (evError || !evData) {
          setEventoNoExiste(true);
          setLoading(false);
          return;
        }
        setEvento(evData);

        // 2. Si viene invitadoId en la URL, cargar directo el invitado
        if (invitadoIdParam) {
          const { data: invData, error: invError } = await supabase
            .from("invitados")
            .select("*")
            .eq("id", invitadoIdParam)
            .single();

          if (invData && !invError) {
            setPaseGenerado(invData);
          } else {
            console.error("Error al buscar invitado:", invError);
          }
        }
      } catch (err) {
        console.error("Error general:", err);
      } finally {
        setLoading(false);
      }
    };

    cargarTodo();
  }, [eventoId, invitadoIdParam]);

  const handleTelefonoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, "").slice(0, 9);
    setTelefono(val);
  };

  const handleRegistro = async (e: React.FormEvent) => {
    e.preventDefault();

    if (telefono.length !== 9) {
      alert("Por favor ingresa un número de WhatsApp válido de 9 dígitos (ej: 912345678).");
      return;
    }

    setRegistrando(true);
    const fullTelefono = `+56${telefono.trim()}`;

    const { data, error } = await supabase
      .from("invitados")
      .insert([
        {
          evento_id: eventoId,
          nombre: nombre.trim(),
          rut: rut.trim() || null,
          telefono: fullTelefono,
          email: email.trim() || null,
          tipo_pase: "Free Pass",
          estado: "aprobado",
        },
      ])
      .select()
      .single();

    if (error) {
      alert("Hubo un error al registrar tu pase: " + error.message);
      setRegistrando(false);
      return;
    }

    setPaseGenerado(data);
    setRegistrando(false);
  };

  const handleDescargarPase = async () => {
    if (!cardRef.current) return;
    setDescargando(true);
    try {
      const dataUrl = await toPng(cardRef.current, { 
        cacheBust: true, 
        pixelRatio: 2,
        backgroundColor: "#0d0917"
      });

      const response = await fetch(dataUrl);
      const blob = await response.blob();
      const fileName = `Pase-${(paseGenerado?.nombre || "Acceso").replace(/\s+/g, "_")}.png`;
      const file = new File([blob], fileName, { type: "image/png" });

      // Compatibilidad con iPhone (iOS Safari) y Android mediante Web Share API
      if (typeof navigator !== "undefined" && navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: `Free Pass - ${evento?.nombre || "Evento"}`,
          text: `Pase digital de acceso para ${paseGenerado?.nombre}`,
        });
        setDescargando(false);
        return;
      }

      // Descarga directa para navegadores de escritorio (Chrome, Firefox, Edge)
      const link = document.createElement("a");
      link.download = fileName;
      link.href = dataUrl;
      link.click();
    } catch (err: any) {
      if (err?.name !== "AbortError") {
        console.error("Error al descargar imagen:", err);
        alert("Puedes mantener presionada la tarjeta o tomar una captura de pantalla para guardarla en tu galería.");
      }
    } finally {
      setDescargando(false);
    }
  };

  const handleEnviarMiWhatsApp = () => {
    if (!paseGenerado) return;
    const linkPase = `${window.location.origin}/invitacion/${eventoId}?invitadoId=${paseGenerado.id}`;
    const cleanPhone = (paseGenerado.telefono || "").replace(/\D/g, "");
    const mensaje = encodeURIComponent(
      `¡Hola ${paseGenerado.nombre}! 🎉 Aquí tienes tu Free Pass para "${evento?.nombre}".\n\nAccede a tu pase digital aquí:\n${linkPase}`
    );

    const url = cleanPhone
      ? `https://wa.me/${cleanPhone}?text=${mensaje}`
      : `https://api.whatsapp.com/send?text=${mensaje}`;

    window.open(url, "_blank");
  };

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", backgroundColor: "#07050e", display: "flex", alignItems: "center", justifyContent: "center", color: "#f0abfc" }}>
        Cargando invitación...
      </div>
    );
  }

  if (eventoNoExiste) {
    return (
      <main style={{ minHeight: "100vh", backgroundColor: "#07050e", color: "#fff", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "1.5rem", textAlign: "center" }}>
        <div style={{ width: 64, height: 64, borderRadius: "50%", background: "rgba(239, 68, 68, 0.15)", border: "1px solid rgba(239, 68, 68, 0.3)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "1rem" }}>
          <AlertCircle style={{ width: 32, height: 32, color: "#f87171" }} />
        </div>
        <h1 style={{ fontSize: "1.8rem", fontWeight: 800, margin: "0 0 8px 0" }}>Evento no disponible</h1>
        <p style={{ color: "#a1a1aa", maxWidth: "380px", margin: 0, fontSize: "0.95rem" }}>
          Esta lista de invitados ha caducado o el evento fue cancelado por los organizadores.
        </p>
      </main>
    );
  }

  const modoValidacion = evento?.tipo_validacion || "qr";

  return (
    <main style={{ minHeight: "100vh", backgroundColor: "#07050e", color: "#fff", position: "relative", overflowX: "hidden", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "1.5rem" }}>
      
      {/* Resplandores ambientales */}
      <div style={{ position: "absolute", top: "-50px", right: "-50px", width: "350px", height: "350px", background: "radial-gradient(circle, rgba(217,70,239,0.3) 0%, rgba(0,0,0,0) 70%)", filter: "blur(70px)", pointerEvents: "none" }} />
      <div style={{ position: "absolute", bottom: "-50px", left: "-50px", width: "350px", height: "350px", background: "radial-gradient(circle, rgba(6,182,212,0.25) 0%, rgba(0,0,0,0) 70%)", filter: "blur(70px)", pointerEvents: "none" }} />

      <div style={{ maxWidth: "420px", width: "100%", position: "relative", zIndex: 10, margin: "auto 0" }}>

        {paseGenerado ? (
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            
            <div ref={cardRef}>
              {modoValidacion === "qr" ? (
                /* 1. MODO QR */
                <div style={{ borderRadius: "1.5rem", background: "linear-gradient(180deg, #150f24 0%, #0c0816 100%)", border: "2px solid rgba(217, 70, 239, 0.5)", padding: "2rem 1.5rem", textAlign: "center", boxShadow: "0 20px 50px rgba(0,0,0,0.8)" }}>
                  <div style={{ width: 48, height: 48, borderRadius: "50%", background: "rgba(16, 185, 129, 0.15)", border: "1px solid rgba(16, 185, 129, 0.3)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 12px auto" }}>
                    <CheckCircle style={{ width: 24, height: 24, color: "#10b981" }} />
                  </div>

                  <span style={{ fontSize: "0.75rem", color: "#f472b6", textTransform: "uppercase", letterSpacing: "2px", fontWeight: 700 }}>
                    ACELIS ACCESS PASS
                  </span>

                  <h2 style={{ fontSize: "1.7rem", fontWeight: 900, margin: "6px 0 2px 0", color: "#fff" }}>
                    {paseGenerado.nombre}
                  </h2>

                  <div style={{ display: "inline-block", padding: "4px 14px", borderRadius: "999px", background: "rgba(217, 70, 239, 0.2)", border: "1px solid rgba(217, 70, 239, 0.4)", color: "#f0abfc", fontSize: "0.8rem", fontWeight: 700, margin: "8px 0 1.25rem 0" }}>
                    FREE PASS VÁLIDO
                  </div>

                  <div style={{ background: "#ffffff", padding: "1.2rem", borderRadius: "1.2rem", display: "inline-block", boxShadow: "0 10px 30px rgba(0,0,0,0.5)" }}>
                    <QRCodeSVG 
                      value={paseGenerado.id} 
                      size={190}
                      level="H"
                      includeMargin={false}
                    />
                  </div>

                  <div style={{ marginTop: "1.25rem", padding: "10px", borderRadius: "10px", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", fontSize: "0.85rem", color: "#d4d4d8" }}>
                    <strong>{evento?.nombre}</strong>
                    <div style={{ fontSize: "0.75rem", color: "#a1a1aa", marginTop: 4 }}>
                      {evento?.lugar} · {formatearFecha(evento?.fecha)}
                    </div>
                  </div>
                </div>
              ) : (
                /* 2. MODO TARJETA FLYER (NOMBRE Y RUT) */
                <div style={{ borderRadius: "1.5rem", overflow: "hidden", background: "linear-gradient(180deg, #161026 0%, #0d0917 100%)", border: "2px solid rgba(6, 182, 212, 0.5)", boxShadow: "0 20px 50px rgba(0,0,0,0.8)", position: "relative" }}>
                  
                  {evento?.flyer_url ? (
                    <div style={{ height: "180px", width: "100%", position: "relative", overflow: "hidden" }}>
                      <img 
                        src={evento.flyer_url} 
                        alt="Flyer del evento" 
                        crossOrigin="anonymous"
                        style={{ width: "100%", height: "100%", objectFit: "cover" }} 
                      />
                      <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, rgba(0,0,0,0) 0%, #161026 100%)" }} />
                    </div>
                  ) : (
                    <div style={{ height: "120px", background: "linear-gradient(135deg, rgba(217,70,239,0.3) 0%, rgba(6,182,212,0.3) 100%)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <Sparkles style={{ width: 40, height: 40, color: "#f0abfc" }} />
                    </div>
                  )}

                  <div style={{ padding: "1.75rem 1.5rem", textAlign: "center" }}>
                    <span style={{ fontSize: "0.75rem", color: "#67e8f9", textTransform: "uppercase", letterSpacing: "2px", fontWeight: 800 }}>
                      INVITACIÓN OFICIAL DE ACCESO
                    </span>

                    <h2 style={{ fontSize: "1.85rem", fontWeight: 900, margin: "8px 0 4px 0", color: "#fff" }}>
                      {paseGenerado.nombre}
                    </h2>

                    {paseGenerado.rut && (
                      <p style={{ fontSize: "1rem", color: "#e4e4e7", fontWeight: 700, margin: "0 0 10px 0" }}>
                        RUT / DNI: <span style={{ color: "#f472b6" }}>{paseGenerado.rut}</span>
                      </p>
                    )}

                    <div style={{ display: "inline-block", padding: "4px 16px", borderRadius: "999px", background: "linear-gradient(135deg, rgba(217,70,239,0.2), rgba(6,182,212,0.2))", border: "1px solid rgba(217, 70, 239, 0.4)", color: "#fdf4ff", fontSize: "0.85rem", fontWeight: 800, margin: "6px 0 1.25rem 0" }}>
                      FREE PASS VÁLIDO
                    </div>

                    <div style={{ padding: "12px", borderRadius: "12px", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", fontSize: "0.85rem", textAlign: "left" }}>
                      <div style={{ fontWeight: 800, color: "#fff", fontSize: "0.95rem" }}>{evento?.nombre}</div>
                      <div style={{ display: "flex", alignItems: "center", gap: 6, color: "#a1a1aa", marginTop: 4, fontSize: "0.8rem" }}>
                        <MapPin style={{ width: 14, height: 14, color: "#06b6d4" }} /> {evento?.lugar}
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 6, color: "#a1a1aa", marginTop: 2, fontSize: "0.8rem" }}>
                        <Clock style={{ width: 14, height: 14, color: "#e879f9" }} /> {formatearFecha(evento?.fecha)}
                      </div>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, marginTop: "1.25rem", color: "#10b981", fontSize: "0.8rem", fontWeight: 700 }}>
                      <ShieldCheck style={{ width: 16, height: 16 }} /> Pase Nominativo Intransferible
                    </div>
                  </div>

                </div>
              )}
            </div>

            {/* Botones de Acción */}
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              <button
                onClick={handleDescargarPase}
                disabled={descargando}
                style={{
                  width: "100%",
                  padding: "12px",
                  borderRadius: "12px",
                  border: "none",
                  background: "linear-gradient(135deg, #06b6d4, #3b82f6)",
                  color: "#fff",
                  fontWeight: 800,
                  fontSize: "0.95rem",
                  cursor: descargando ? "not-allowed" : "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                  boxShadow: "0 6px 20px rgba(6, 182, 212, 0.4)",
                }}
              >
                {descargando ? (
                  <>
                    <Loader2 style={{ width: 18, height: 18, animation: "spin 1s linear infinite" }} />
                    Generando imagen...
                  </>
                ) : (
                  <>
                    <Download style={{ width: 18, height: 18 }} />
                    Descargar Pase en Imagen
                  </>
                )}
              </button>

              <button
                onClick={handleEnviarMiWhatsApp}
                style={{
                  width: "100%",
                  padding: "12px",
                  borderRadius: "12px",
                  border: "none",
                  background: "linear-gradient(135deg, #22c55e, #16a34a)",
                  color: "#fff",
                  fontWeight: 800,
                  fontSize: "0.95rem",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                  boxShadow: "0 6px 20px rgba(34, 197, 94, 0.3)",
                }}
              >
                <MessageCircle style={{ width: 18, height: 18 }} />
                Enviar / Guardar en WhatsApp
              </button>
            </div>

            <p style={{ fontSize: "0.75rem", color: "#71717a", textAlign: "center", margin: 0 }}>
              📸 También puedes hacer una captura de pantalla a la tarjeta.
            </p>
          </div>
        ) : (
          /* FORMULARIO DE AUTO-REGISTRO */
          <div style={{ borderRadius: "1.5rem", background: "linear-gradient(180deg, rgba(255,255,255,0.07) 0%, rgba(255,255,255,0.02) 100%)", border: "1px solid rgba(217, 70, 239, 0.3)", padding: "2.25rem 1.75rem", backdropFilter: "blur(20px)", boxShadow: "0 20px 50px rgba(0,0,0,0.6)" }}>
            
            {evento?.flyer_url && (
              <div style={{ height: "130px", width: "100%", borderRadius: "12px", overflow: "hidden", marginBottom: "1.25rem" }}>
                <img src={evento.flyer_url} alt="Flyer" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              </div>
            )}

            <div style={{ textAlign: "center", marginBottom: "1.75rem" }}>
              <div style={{ display: "inline-flex", alignItems: "center", gap: 6, color: "#f472b6", fontSize: "0.8rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "1px", marginBottom: "6px" }}>
                <Sparkles style={{ width: 14, height: 14 }} /> Invitación Exclusiva
              </div>
              <h1 style={{ fontSize: "1.85rem", fontWeight: 900, margin: "0 0 10px 0" }}>{evento?.nombre}</h1>
              
              <div style={{ display: "flex", flexDirection: "column", gap: "4px", fontSize: "0.85rem", color: "#a1a1aa", alignItems: "center" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <MapPin style={{ width: 14, height: 14, color: "#06b6d4" }} /> {evento?.lugar}
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <Clock style={{ width: 14, height: 14, color: "#e879f9" }} /> {formatearFecha(evento?.fecha)}
                </div>
              </div>
            </div>

            <form onSubmit={handleRegistro} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div>
                <label style={{ display: "block", fontSize: "0.8rem", color: "#d4d4d8", marginBottom: "4px", fontWeight: "500" }}>
                  Nombre y Apellido
                </label>
                <input
                  type="text"
                  required
                  placeholder="Tu nombre completo"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  style={{ width: "100%", padding: "11px 13px", borderRadius: "10px", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.15)", color: "#fff", outline: "none", boxSizing: "border-box" }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "0.8rem", color: "#d4d4d8", marginBottom: "4px", fontWeight: "500" }}>
                  RUT o DNI
                </label>
                <input
                  type="text"
                  required
                  placeholder="12.345.678-9"
                  value={rut}
                  onChange={(e) => setRut(e.target.value)}
                  style={{ width: "100%", padding: "11px 13px", borderRadius: "10px", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.15)", color: "#fff", outline: "none", boxSizing: "border-box" }}
                />
              </div>

              {/* Input WhatsApp con +56 fijo */}
              <div>
                <label style={{ display: "block", fontSize: "0.8rem", color: "#d4d4d8", marginBottom: "4px", fontWeight: "500" }}>
                  WhatsApp
                </label>
                <div style={{ display: "flex", alignItems: "center", borderRadius: "10px", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.15)", overflow: "hidden" }}>
                  <span style={{ padding: "11px 14px", background: "rgba(217, 70, 239, 0.2)", color: "#f0abfc", fontWeight: 800, fontSize: "0.9rem", borderRight: "1px solid rgba(255,255,255,0.15)" }}>
                    +56
                  </span>
                  <input
                    type="tel"
                    required
                    inputMode="numeric"
                    maxLength={9}
                    placeholder="912345678"
                    value={telefono}
                    onChange={handleTelefonoChange}
                    style={{ flex: 1, padding: "11px 13px", background: "transparent", border: "none", color: "#fff", outline: "none", boxSizing: "border-box", fontSize: "0.95rem" }}
                  />
                </div>
                <span style={{ fontSize: "0.72rem", color: "#71717a", marginTop: "4px", display: "block" }}>Ingresa los 9 dígitos de tu celular</span>
              </div>

              <div>
                <label style={{ display: "block", fontSize: "0.8rem", color: "#d4d4d8", marginBottom: "4px", fontWeight: "500" }}>
                  Correo electrónico (Opcional)
                </label>
                <input
                  type="email"
                  placeholder="correo@ejemplo.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  style={{ width: "100%", padding: "11px 13px", borderRadius: "10px", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.15)", color: "#fff", outline: "none", boxSizing: "border-box" }}
                />
              </div>

              <button
                type="submit"
                disabled={registrando}
                style={{
                  marginTop: "0.5rem",
                  padding: "13px",
                  borderRadius: "10px",
                  border: "none",
                  background: "linear-gradient(135deg, #d946ef, #ec4899)",
                  color: "#fff",
                  fontWeight: 800,
                  fontSize: "0.95rem",
                  cursor: registrando ? "not-allowed" : "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                  boxShadow: "0 6px 20px rgba(217, 70, 239, 0.4)",
                }}
              >
                {registrando ? (
                  <>
                    <Loader2 style={{ width: 18, height: 18, animation: "spin 1s linear infinite" }} />
                    Generando tu Free Pass...
                  </>
                ) : (
                  <>
                    <Ticket style={{ width: 18, height: 18 }} />
                    Obtener mi Free Pass
                  </>
                )}
              </button>
            </form>

            <p style={{ textAlign: "center", fontSize: "0.75rem", color: "#71717a", marginTop: "1.5rem", marginBottom: 0 }}>
              Acceso válido únicamente con documento de identidad.
            </p>
          </div>
        )}

      </div>

      {/* Pie de página */}
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
          marginTop: "2rem"
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

    </main>
  );
}

export default function InvitacionPublica({ params }: { params: Promise<{ id: string }> }) {
  const { id: eventoId } = use(params);

  return (
    <Suspense
      fallback={
        <div style={{ minHeight: "100vh", backgroundColor: "#07050e", display: "flex", alignItems: "center", justifyContent: "center", color: "#f0abfc" }}>
          Cargando invitación...
        </div>
      }
    >
      <ContenidoInvitacion eventoId={eventoId} />
    </Suspense>
  );
}