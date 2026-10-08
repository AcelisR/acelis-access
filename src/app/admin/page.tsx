"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { 
  Sparkles, 
  Calendar, 
  PlusCircle, 
  LogOut, 
  ShieldCheck, 
  PartyPopper,
  X,
  MapPin,
  Users,
  Clock,
  Loader2,
  QrCode,
  Image as ImageIcon,
  Crown,
  UploadCloud,
  Trash2
} from "lucide-react";

// Formato en español limpio: 16 de octubre del 2026 · 22:30 hrs
const formatearFechaChile = (fechaStr?: string, horaStr?: string) => {
  if (!fechaStr) return "Por confirmar";
  try {
    const meses = [
      "enero", "febrero", "marzo", "abril", "mayo", "junio",
      "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"
    ];

    if (fechaStr.includes("-")) {
      const [anio, mes, dia] = fechaStr.split("-");
      const nombreMes = meses[parseInt(mes, 10) - 1] || mes;
      const horaFinal = horaStr?.trim() ? ` · ${horaStr.trim()} hrs` : "";
      return `${parseInt(dia, 10)} de ${nombreMes} del ${anio}${horaFinal}`;
    }

    return fechaStr;
  } catch {
    return fechaStr;
  }
};

interface Evento {
  id: string;
  nombre: string;
  fecha?: string;
  lugar?: string;
  capacidad?: number;
  aforo?: number;
  tipo_validacion?: "qr" | "tarjeta";
  flyer_url?: string;
  created_at?: string;
}

export default function AdminDashboard() {
  const router = useRouter();
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [userRol, setUserRol] = useState<string>("admin");
  const [loading, setLoading] = useState(true);
  const [eventos, setEventos] = useState<Evento[]>([]);

  // Modal Crear Evento
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  // Formulario nuevo evento
  const [nombre, setNombre] = useState("");
  const [fechaEvento, setFechaEvento] = useState("");
  const [horaEvento, setHoraEvento] = useState("22:30");
  const [lugar, setLugar] = useState("");
  const [capacidad, setCapacidad] = useState("300");
  const [flyerFile, setFlyerFile] = useState<File | null>(null);
  const [flyerPreview, setFlyerPreview] = useState<string | null>(null);
  const [tipoValidacion, setTipoValidacion] = useState<"qr" | "tarjeta">("tarjeta");

  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push("/login");
        return;
      }
      const email = session.user.email ?? "Admin";
      setUserEmail(email);

      const { data: profile } = await supabase
        .from("profiles")
        .select("rol")
        .eq("id", session.user.id)
        .single();

      if (profile?.rol) {
        setUserRol(profile.rol);
      } else if (email === "acelis@hotmail.cl") {
        setUserRol("super_admin");
      }

      await cargarEventos();
      setLoading(false);
    };

    checkSession();
  }, [router]);

  const cargarEventos = async () => {
    let { data, error } = await supabase
      .from("eventos")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      const retry = await supabase.from("eventos").select("*");
      data = retry.data;
      error = retry.error;
    }

    if (error) {
      console.error("Error al cargar eventos:", error.message);
    } else if (data) {
      setEventos(data);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setFlyerFile(file);
      setFlyerPreview(URL.createObjectURL(file));
    }
  };

  const handleCrearEvento = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    let uploadedFlyerUrl: string | null = null;

    if (flyerFile) {
      const fileExt = flyerFile.name.split(".").pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${fileExt}`;
      const filePath = `flyers/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("flyers")
        .upload(filePath, flyerFile);

      if (uploadError) {
        alert("Error al subir el flyer: " + uploadError.message);
        setSaving(false);
        return;
      }

      const { data: publicData } = supabase.storage
        .from("flyers")
        .getPublicUrl(filePath);

      uploadedFlyerUrl = publicData.publicUrl;
    }

    const valorCapacidad = parseInt(capacidad, 10) || 300;
    const fechaArmada = formatearFechaChile(fechaEvento, horaEvento);

    let { error } = await supabase
      .from("eventos")
      .insert([
        {
          nombre: nombre.trim(),
          fecha: fechaArmada || null,
          lugar: lugar.trim(),
          capacidad: valorCapacidad,
          tipo_validacion: tipoValidacion,
          flyer_url: uploadedFlyerUrl,
        },
      ]);

    if (error && error.message.includes("capacidad")) {
      const retry = await supabase
        .from("eventos")
        .insert([
          {
            nombre: nombre.trim(),
            fecha: fechaArmada || null,
            lugar: lugar.trim(),
            aforo: valorCapacidad,
            tipo_validacion: tipoValidacion,
            flyer_url: uploadedFlyerUrl,
          },
        ]);
      error = retry.error;
    }

    if (error) {
      alert("Error al crear el evento: " + error.message);
      setSaving(false);
      return;
    }

    setNombre("");
    setFechaEvento("");
    setHoraEvento("22:30");
    setLugar("");
    setCapacidad("300");
    setFlyerFile(null);
    setFlyerPreview(null);
    setTipoValidacion("tarjeta");
    setIsModalOpen(false);
    setSaving(false);
    await cargarEventos();
  };

  const handleCambiarTipoValidacion = async (eventoId: string, nuevoTipo: "qr" | "tarjeta") => {
    if (userRol !== "super_admin") return;

    const { error } = await supabase
      .from("eventos")
      .update({ tipo_validacion: nuevoTipo })
      .eq("id", eventoId);

    if (error) {
      alert("Error al actualizar modalidad: " + error.message);
    } else {
      await cargarEventos();
    }
  };

  const handleEliminarEvento = async (evento: Evento) => {
    const confirmacion = window.confirm(
      `¿Estás seguro de que deseas eliminar "${evento.nombre}"?\n\nEsta acción inhabilitará el link de registro y eliminará todas las invitaciones asociadas.`
    );
    if (!confirmacion) return;

    const { error } = await supabase
      .from("eventos")
      .delete()
      .eq("id", evento.id);

    if (error) {
      alert("Error al eliminar el evento: " + error.message);
    } else {
      await cargarEventos();
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", backgroundColor: "#07050e", display: "flex", alignItems: "center", justifyContent: "center", color: "#f0abfc", fontSize: "1.1rem" }}>
        Cargando Panel Acelis Access...
      </div>
    );
  }

  const esSuperAdmin = userRol === "super_admin";

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#07050e", color: "#fff", position: "relative", overflowX: "hidden", display: "flex", flexDirection: "column" }}>
      
      {/* Resplandores ambientales */}
      <div style={{ position: "absolute", top: "-80px", right: "-40px", width: "450px", height: "450px", background: "radial-gradient(circle, rgba(217,70,239,0.2) 0%, rgba(0,0,0,0) 70%)", filter: "blur(80px)", pointerEvents: "none" }} />
      <div style={{ position: "absolute", top: "35%", left: "-100px", width: "450px", height: "450px", background: "radial-gradient(circle, rgba(6,182,212,0.18) 0%, rgba(0,0,0,0) 70%)", filter: "blur(90px)", pointerEvents: "none" }} />

      {/* Header Superior */}
      <header style={{ borderBottom: "1px solid rgba(255,255,255,0.08)", backdropFilter: "blur(16px)", background: "rgba(7,5,14,0.75)", position: "sticky", top: 0, zIndex: 30 }}>
        <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "1rem 1.5rem", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: "linear-gradient(135deg, #d946ef, #ec4899)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 4px 14px rgba(217, 70, 239, 0.4)" }}>
              <ShieldCheck style={{ width: 20, height: 20, color: "#fff" }} />
            </div>
            <div>
              <span style={{ fontWeight: 900, letterSpacing: "-0.5px", fontSize: "1.1rem" }}>ACELIS</span>{" "}
              <span style={{ color: "#d946ef", fontWeight: 700, fontSize: "1.1rem" }}>ACCESS</span>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "0.85rem", color: "#a1a1aa" }}>
              {esSuperAdmin && <Crown style={{ width: 14, height: 14, color: "#facc15" }} />}
              <span>{userEmail}</span>
              <span style={{ fontSize: "0.7rem", padding: "2px 6px", borderRadius: 4, background: esSuperAdmin ? "rgba(234, 179, 8, 0.15)" : "rgba(255,255,255,0.08)", color: esSuperAdmin ? "#facc15" : "#a1a1aa", border: "1px solid rgba(255,255,255,0.1)" }}>
                {esSuperAdmin ? "SUPER ADMIN" : "ADMIN"}
              </span>
            </div>
            <button
              onClick={handleLogout}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                background: "rgba(255,255,255,0.06)",
                border: "1px solid rgba(255,255,255,0.12)",
                color: "#e4e4e7",
                padding: "6px 12px",
                borderRadius: "8px",
                fontSize: "0.8rem",
                cursor: "pointer",
              }}
            >
              <LogOut style={{ width: 14, height: 14 }} /> Salir
            </button>
          </div>

        </div>
      </header>

      {/* Contenido Principal */}
      <main style={{ maxWidth: "1200px", width: "100%", margin: "0 auto", padding: "2.5rem 1.5rem", position: "relative", zIndex: 10, flex: 1 }}>
        
        {/* Cabecera del Panel */}
        <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: "1rem", marginBottom: "2.5rem" }}>
          <div>
            <div style={{ display: "inline-flex", alignItems: "center", gap: "6px", color: "#e879f9", fontSize: "0.8rem", fontWeight: "600", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "6px" }}>
              <Sparkles style={{ width: 14, height: 14 }} /> Gestión Central
            </div>
            <h1 style={{ fontSize: "2.2rem", fontWeight: 900, margin: 0 }}>Panel de Control</h1>
          </div>

          <button
            onClick={() => setIsModalOpen(true)}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              padding: "12px 20px",
              borderRadius: "12px",
              border: "none",
              background: "linear-gradient(135deg, #d946ef, #ec4899)",
              color: "#fff",
              fontWeight: "700",
              fontSize: "0.9rem",
              cursor: "pointer",
              boxShadow: "0 6px 20px rgba(217, 70, 239, 0.4)",
            }}
          >
            <PlusCircle style={{ width: 18, height: 18 }} /> Crear Evento
          </button>
        </div>

        {/* Métricas Rápidas */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "1.25rem", marginBottom: "2.5rem" }}>
          
          <div style={{ padding: "1.5rem", borderRadius: "1.25rem", background: "linear-gradient(180deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.02) 100%)", border: "1px solid rgba(255,255,255,0.08)", backdropFilter: "blur(12px)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", color: "#a1a1aa", fontSize: "0.85rem", marginBottom: "8px" }}>
              <span>Eventos Activos</span>
              <Calendar style={{ width: 18, height: 18, color: "#d946ef" }} />
            </div>
            <p style={{ fontSize: "2rem", fontWeight: 800, margin: 0 }}>{eventos.length}</p>
          </div>

          <div style={{ padding: "1.5rem", borderRadius: "1.25rem", background: "linear-gradient(180deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.02) 100%)", border: "1px solid rgba(255,255,255,0.08)", backdropFilter: "blur(12px)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", color: "#a1a1aa", fontSize: "0.85rem", marginBottom: "8px" }}>
              <span>Modalidad Tarjeta Flyer</span>
              <ImageIcon style={{ width: 18, height: 18, color: "#f472b6" }} />
            </div>
            <p style={{ fontSize: "2rem", fontWeight: 800, margin: 0 }}>
              {eventos.filter(e => (e.tipo_validacion || "tarjeta") === "tarjeta").length}
            </p>
          </div>

          <div style={{ padding: "1.5rem", borderRadius: "1.25rem", background: "linear-gradient(180deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.02) 100%)", border: "1px solid rgba(255,255,255,0.08)", backdropFilter: "blur(12px)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", color: "#a1a1aa", fontSize: "0.85rem", marginBottom: "8px" }}>
              <span>Modalidad QR</span>
              <QrCode style={{ width: 18, height: 18, color: "#06b6d4" }} />
            </div>
            <p style={{ fontSize: "2rem", fontWeight: 800, margin: 0 }}>
              {eventos.filter(e => e.tipo_validacion === "qr").length}
            </p>
          </div>

        </div>

        {/* Lista de Eventos */}
        <section>
          <h2 style={{ fontSize: "1.3rem", fontWeight: 700, marginBottom: "1rem" }}>Tus Fiestas y Eventos</h2>

          {eventos.length === 0 ? (
            <div style={{ padding: "3rem 1.5rem", textAlign: "center", borderRadius: "1.25rem", background: "rgba(255,255,255,0.02)", border: "1px dashed rgba(255,255,255,0.15)" }}>
              <PartyPopper style={{ width: 40, height: 40, color: "#a1a1aa", margin: "0 auto 12px auto" }} />
              <h3 style={{ fontSize: "1.1rem", fontWeight: 600, margin: "0 0 6px 0" }}>Aún no hay eventos creados</h3>
              <p style={{ color: "#71717a", fontSize: "0.85rem", margin: 0 }}>Empieza creando tu primer evento para emitir pases.</p>
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))", gap: "1.25rem" }}>
              {eventos.map((ev) => {
                const modoActual = ev.tipo_validacion || "tarjeta";
                return (
                  <div 
                    key={ev.id} 
                    style={{ 
                      borderRadius: "1.25rem", 
                      background: "linear-gradient(180deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.02) 100%)", 
                      border: "1px solid rgba(217, 70, 239, 0.2)",
                      backdropFilter: "blur(12px)",
                      display: "flex",
                      flexDirection: "column",
                      overflow: "hidden"
                    }}
                  >
                    {/* Flyer */}
                    {ev.flyer_url && (
                      <div style={{ width: "100%", height: "130px", position: "relative", overflow: "hidden" }}>
                        <img 
                          src={ev.flyer_url} 
                          alt={ev.nombre} 
                          style={{ width: "100%", height: "100%", objectFit: "cover" }} 
                        />
                        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, rgba(0,0,0,0) 0%, rgba(7,5,14,0.85) 100%)" }} />
                      </div>
                    )}

                    <div style={{ padding: "1.5rem", flex: 1, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                      <div>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                          <span style={{ fontSize: "0.75rem", fontWeight: 600, color: "#f472b6", textTransform: "uppercase", letterSpacing: "1px" }}>Evento Activo</span>
                          
                          <span style={{ 
                            fontSize: "0.7rem", 
                            padding: "3px 8px", 
                            borderRadius: "999px", 
                            fontWeight: 700,
                            background: modoActual === "tarjeta" ? "rgba(244,114,182,0.15)" : "rgba(6,182,212,0.15)",
                            color: modoActual === "tarjeta" ? "#f472b6" : "#67e8f9",
                            border: modoActual === "tarjeta" ? "1px solid rgba(244,114,182,0.3)" : "1px solid rgba(6,182,212,0.3)",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "4px"
                          }}>
                            {modoActual === "tarjeta" ? <ImageIcon style={{ width: 12, height: 12 }} /> : <QrCode style={{ width: 12, height: 12 }} />}
                            {modoActual === "tarjeta" ? "Tarjeta Flyer" : "Pase con QR"}
                          </span>
                        </div>

                        <h3 style={{ fontSize: "1.4rem", fontWeight: 800, margin: "6px 0 10px 0" }}>{ev.nombre}</h3>
                        
                        <div style={{ display: "flex", flexDirection: "column", gap: "6px", fontSize: "0.85rem", color: "#a1a1aa" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                            <MapPin style={{ width: 14, height: 14, color: "#06b6d4" }} /> {ev.lugar || "Sin locación definida"}
                          </div>
                          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                            <Clock style={{ width: 14, height: 14, color: "#e879f9" }} /> {ev.fecha || "Por confirmar"}
                          </div>
                          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                            <Users style={{ width: 14, height: 14, color: "#10b981" }} /> Capacidad: {ev.capacidad || ev.aforo || 300} personas
                          </div>
                        </div>

                        {/* Control SuperAdmin para cambiar modalidad */}
                        {esSuperAdmin && (
                          <div style={{ marginTop: "1rem", padding: "8px 10px", borderRadius: "8px", background: "rgba(0,0,0,0.3)", border: "1px solid rgba(255,255,255,0.06)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                            <span style={{ fontSize: "0.75rem", color: "#d4d4d8", fontWeight: 500 }}>Modalidad:</span>
                            <div style={{ display: "flex", gap: "6px" }}>
                              <button
                                onClick={() => handleCambiarTipoValidacion(ev.id, "tarjeta")}
                                style={{
                                  padding: "4px 8px",
                                  borderRadius: "6px",
                                  fontSize: "0.7rem",
                                  fontWeight: 700,
                                  cursor: "pointer",
                                  border: modoActual === "tarjeta" ? "1px solid #d946ef" : "1px solid rgba(255,255,255,0.1)",
                                  background: modoActual === "tarjeta" ? "rgba(217,70,239,0.25)" : "transparent",
                                  color: modoActual === "tarjeta" ? "#f0abfc" : "#71717a",
                                }}
                              >
                                Tarjeta Flyer
                              </button>
                              <button
                                onClick={() => handleCambiarTipoValidacion(ev.id, "qr")}
                                style={{
                                  padding: "4px 8px",
                                  borderRadius: "6px",
                                  fontSize: "0.7rem",
                                  fontWeight: 700,
                                  cursor: "pointer",
                                  border: modoActual === "qr" ? "1px solid #06b6d4" : "1px solid rgba(255,255,255,0.1)",
                                  background: modoActual === "qr" ? "rgba(6,182,212,0.25)" : "transparent",
                                  color: modoActual === "qr" ? "#67e8f9" : "#71717a",
                                }}
                              >
                                QR
                              </button>
                            </div>
                          </div>
                        )}
                      </div>

                      <div style={{ marginTop: "1.25rem", display: "flex", gap: "8px" }}>
                        <button
                          onClick={() => router.push(`/admin/eventos/${ev.id}`)}
                          style={{
                            flex: 1,
                            padding: "9px 12px",
                            borderRadius: "8px",
                            border: "1px solid rgba(217, 70, 239, 0.4)",
                            background: "rgba(217, 70, 239, 0.15)",
                            color: "#f0abfc",
                            fontSize: "0.85rem",
                            fontWeight: 600,
                            cursor: "pointer"
                          }}
                        >
                          Gestionar Invitados
                        </button>

                        <button
                          onClick={() => handleEliminarEvento(ev)}
                          title="Eliminar Evento"
                          style={{
                            padding: "9px 12px",
                            borderRadius: "8px",
                            border: "1px solid rgba(239, 68, 68, 0.35)",
                            background: "rgba(239, 68, 68, 0.12)",
                            color: "#f87171",
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center"
                          }}
                        >
                          <Trash2 style={{ width: 16, height: 16 }} />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
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

      {/* Modal para Crear Evento */}
      {isModalOpen && (
        <div style={{ position: "fixed", inset: 0, zIndex: 50, backgroundColor: "rgba(0,0,0,0.75)", backdropFilter: "blur(8px)", display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem" }}>
          <div style={{ maxWidth: "480px", width: "100%", borderRadius: "1.5rem", background: "#0f0b1a", border: "1px solid rgba(217, 70, 239, 0.3)", padding: "2rem", boxShadow: "0 25px 60px rgba(0,0,0,0.8)", position: "relative", maxHeight: "90vh", overflowY: "auto" }}>
            
            <button 
              onClick={() => {
                setIsModalOpen(false);
                setFlyerFile(null);
                setFlyerPreview(null);
              }}
              style={{ position: "absolute", top: "1.25rem", right: "1.25rem", background: "transparent", border: "none", color: "#a1a1aa", cursor: "pointer" }}
            >
              <X style={{ width: 20, height: 20 }} />
            </button>

            <h2 style={{ fontSize: "1.5rem", fontWeight: 800, margin: "0 0 6px 0", color: "#fff" }}>Nuevo Evento / Fiesta</h2>
            <p style={{ color: "#a1a1aa", fontSize: "0.85rem", margin: "0 0 1.5rem 0" }}>Configura los datos del evento para emitir pases.</p>

            <form onSubmit={handleCrearEvento} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div>
                <label style={{ display: "block", fontSize: "0.8rem", color: "#d4d4d8", marginBottom: "4px" }}>Nombre del Evento</label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Acelis Neon Night 2026"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  style={{ width: "100%", padding: "10px 12px", borderRadius: "8px", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.15)", color: "#fff", outline: "none", boxSizing: "border-box" }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "0.8rem", color: "#d4d4d8", marginBottom: "4px" }}>Lugar o Club</label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Club Hípico / Terraza VIP"
                  value={lugar}
                  onChange={(e) => setLugar(e.target.value)}
                  style={{ width: "100%", padding: "10px 12px", borderRadius: "8px", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.15)", color: "#fff", outline: "none", boxSizing: "border-box" }}
                />
              </div>

              {/* Subir Flyer como archivo */}
              <div>
                <label style={{ display: "block", fontSize: "0.8rem", color: "#d4d4d8", marginBottom: "6px" }}>
                  Flyer del Evento (Imagen)
                </label>
                
                {flyerPreview ? (
                  <div style={{ position: "relative", width: "100%", height: "140px", borderRadius: "10px", overflow: "hidden", border: "1px solid rgba(217, 70, 239, 0.4)" }}>
                    <img src={flyerPreview} alt="Preview" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    <button
                      type="button"
                      onClick={() => {
                        setFlyerFile(null);
                        setFlyerPreview(null);
                      }}
                      style={{ position: "absolute", top: "8px", right: "8px", background: "rgba(0,0,0,0.75)", color: "#f87171", border: "none", borderRadius: "50%", padding: "6px", cursor: "pointer" }}
                    >
                      <X style={{ width: 14, height: 14 }} />
                    </button>
                  </div>
                ) : (
                  <label
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                      padding: "1.5rem",
                      borderRadius: "10px",
                      border: "2px dashed rgba(255,255,255,0.15)",
                      background: "rgba(255,255,255,0.02)",
                      cursor: "pointer",
                      gap: "8px",
                      color: "#a1a1aa",
                      fontSize: "0.85rem",
                    }}
                  >
                    <UploadCloud style={{ width: 28, height: 28, color: "#d946ef" }} />
                    <span>Haz clic para seleccionar el flyer (JPG, PNG)</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      style={{ display: "none" }}
                    />
                  </label>
                )}
              </div>

              {/* Fecha y Hora (24 hrs) separadas */}
              <div style={{ display: "grid", gridTemplateColumns: "1.2fr 0.8fr", gap: "10px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "0.8rem", color: "#d4d4d8", marginBottom: "4px" }}>Fecha</label>
                  <input
                    type="date"
                    required
                    value={fechaEvento}
                    onChange={(e) => setFechaEvento(e.target.value)}
                    style={{ width: "100%", padding: "10px 12px", borderRadius: "8px", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.15)", color: "#fff", outline: "none", boxSizing: "border-box" }}
                  />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "0.8rem", color: "#d4d4d8", marginBottom: "4px" }}>Hora (24 hrs)</label>
                  <input
                    type="text"
                    required
                    maxLength={5}
                    placeholder="22:30"
                    value={horaEvento}
                    onChange={(e) => {
                      const val = e.target.value.replace(/[^0-9:]/g, "");
                      setHoraEvento(val);
                    }}
                    style={{ 
                      width: "100%", 
                      padding: "10px 12px", 
                      borderRadius: "8px", 
                      background: "rgba(255,255,255,0.06)", 
                      border: "1px solid rgba(255,255,255,0.15)", 
                      color: "#fff", 
                      outline: "none", 
                      boxSizing: "border-box",
                      textAlign: "center",
                      fontWeight: 700
                    }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: "block", fontSize: "0.8rem", color: "#d4d4d8", marginBottom: "4px" }}>Aforo Máximo</label>
                <input
                  type="number"
                  min="1"
                  placeholder="300"
                  value={capacidad}
                  onChange={(e) => setCapacidad(e.target.value)}
                  style={{ width: "100%", padding: "10px 12px", borderRadius: "8px", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.15)", color: "#fff", outline: "none", boxSizing: "border-box" }}
                />
              </div>

              {/* Selector de Modalidad (Solo SuperAdmin) */}
              {esSuperAdmin && (
                <div>
                  <label style={{ display: "block", fontSize: "0.8rem", color: "#d4d4d8", marginBottom: "6px" }}>
                    Modalidad de Pases (Configuración SuperAdmin)
                  </label>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                    <button
                      type="button"
                      onClick={() => setTipoValidacion("tarjeta")}
                      style={{
                        padding: "10px",
                        borderRadius: "8px",
                        border: tipoValidacion === "tarjeta" ? "1px solid #d946ef" : "1px solid rgba(255,255,255,0.1)",
                        background: tipoValidacion === "tarjeta" ? "rgba(217,70,239,0.2)" : "rgba(255,255,255,0.04)",
                        color: tipoValidacion === "tarjeta" ? "#f0abfc" : "#a1a1aa",
                        fontWeight: 600,
                        fontSize: "0.8rem",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: "6px"
                      }}
                    >
                      <ImageIcon style={{ width: 14, height: 14 }} /> Tarjeta Flyer (Predeterminada)
                    </button>
                    <button
                      type="button"
                      onClick={() => setTipoValidacion("qr")}
                      style={{
                        padding: "10px",
                        borderRadius: "8px",
                        border: tipoValidacion === "qr" ? "1px solid #06b6d4" : "1px solid rgba(255,255,255,0.1)",
                        background: tipoValidacion === "qr" ? "rgba(6,182,212,0.2)" : "rgba(255,255,255,0.04)",
                        color: tipoValidacion === "qr" ? "#67e8f9" : "#a1a1aa",
                        fontWeight: 600,
                        fontSize: "0.8rem",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: "6px"
                      }}
                    >
                      <QrCode style={{ width: 14, height: 14 }} /> Pase con QR
                    </button>
                  </div>
                </div>
              )}

              <div style={{ display: "flex", gap: "10px", marginTop: "1rem" }}>
                <button
                  type="button"
                  onClick={() => {
                    setIsModalOpen(false);
                    setFlyerFile(null);
                    setFlyerPreview(null);
                  }}
                  style={{ flex: 1, padding: "10px", borderRadius: "10px", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", color: "#d4d4d8", cursor: "pointer", fontWeight: 600 }}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  style={{ flex: 1, padding: "10px", borderRadius: "10px", border: "none", background: "linear-gradient(135deg, #d946ef, #ec4899)", color: "#fff", cursor: saving ? "not-allowed" : "pointer", fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}
                >
                  {saving ? <Loader2 style={{ width: 16, height: 16, animation: "spin 1s linear infinite" }} /> : "Guardar Evento"}
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

    </div>
  );
}