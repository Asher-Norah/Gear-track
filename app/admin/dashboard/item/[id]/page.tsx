"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, useParams } from "next/navigation";

const API_BASE = "http://192.168.1.201:8080";

interface Item {
  id: number;
  name: string;
  category: string;
  description: string;
  serial_number: string;
  image_url: string;
  status: "available" | "Checked_out" | "Maintenance";
  created_at: string;
}

const labelStyle: React.CSSProperties = {
  display: "block",
  fontSize: "12px",
  color: "rgba(255,255,255,0.5)",
  marginBottom: "8px",
  letterSpacing: "0.06em",
  textTransform: "uppercase",
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "11px 16px",
  borderRadius: "8px",
  border: "1.5px solid rgba(245,166,35,0.35)",
  background: "rgba(255,255,255,0.04)",
  color: "#ffffff",
  fontSize: "14px",
  outline: "none",
  fontFamily: "Times New Roman, serif",
  boxSizing: "border-box",
};

function DetailPlaceholder({ name }: { name: string }) {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        minHeight: "420px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(135deg, rgba(245,166,35,0.15), rgba(0,0,0,0.4))",
        fontSize: "64px",
        position: "relative",
        borderRadius: "16px",
      }}
    >
      📦
      <span
        style={{
          position: "absolute",
          bottom: 16,
          left: 0,
          right: 0,
          textAlign: "center",
          fontSize: "13px",
          color: "rgba(255,255,255,0.4)",
          fontFamily: "Times New Roman, serif",
        }}
      >
        {name}
      </span>
    </div>
  );
}

export default function ItemDetailPage() {
  const router = useRouter();
  const params = useParams();
  const itemId = params?.id as string;

  const [item, setItem] = useState<Item | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  // edit form state
  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [serialNumber, setSerialNumber] = useState("");
  const [state, setState] = useState<"available" | "Checked_out" | "Maintenance">("available");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!itemId) return;
    const fetchItem = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await fetch(`${API_BASE}/items/${itemId}`);
        if (!res.ok) throw new Error(`Server error: ${res.status}`);
        const data = await res.json();
        setItem(data);
        setName(data.name);
        setCategory(data.category);
        setDescription(data.description);
        setSerialNumber(data.serial_number);
        setState(data.status);
        setImagePreview(data.image_url || null);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Failed to load item");
      } finally {
        setLoading(false);
      }
    };
    fetchItem();
  }, [itemId]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    setImageFile(file);
    if (file) {
      const reader = new FileReader();
      reader.onload = () => setImagePreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const startEditing = () => {
    if (!item) return;
    setName(item.name);
    setCategory(item.category);
    setDescription(item.description);
    setSerialNumber(item.serial_number);
    setState(item.status);
    setImagePreview(item.image_url || null);
    setImageFile(null);
    setActionError(null);
    setEditing(true);
  };

  const cancelEditing = () => {
    setEditing(false);
    setImageFile(null);
    setActionError(null);
    if (item) setImagePreview(item.image_url || null);
  };

  const handleSave = async () => {
    if (!item) return;
    setSaving(true);
    setActionError(null);
    try {
      let image_url = item.image_url;
      if (imageFile) {
        const formData = new FormData();
        formData.append("image", imageFile);
        const uploadRes = await fetch(`${API_BASE}/upload`, { method: "POST", body: formData });
        if (!uploadRes.ok) throw new Error("Image upload failed");
        const uploadData = await uploadRes.json();
        image_url = uploadData.image_url;
      }

      const res = await fetch(`${API_BASE}/items/${item.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          category,
          description,
          serial_number: serialNumber,
          status: state,
          image_url,
        }),
      });
      if (res.status === 409) {
        setActionError("This serial number already exists. Please use a unique serial number.");
        setSaving(false);
        return;
      }
      if (!res.ok) throw new Error(`Server error: ${res.status}`);
      const updated = await res.json();
      setItem(updated);
      setEditing(false);
    } catch (err: unknown) {
      setActionError(err instanceof Error ? err.message : "Failed to save changes");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!item) return;
    setDeleting(true);
    setActionError(null);
    try {
      const res = await fetch(`${API_BASE}/items/${item.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error(`Server error: ${res.status}`);
      router.push("/admin/dashboard");
    } catch (err: unknown) {
      setActionError(err instanceof Error ? err.message : "Failed to delete item");
      setDeleting(false);
      setConfirmDelete(false);
    }
  };

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", background: "#000", display: "flex", alignItems: "center", justifyContent: "center", color: "rgba(255,255,255,0.4)", fontFamily: "Times New Roman, serif", fontSize: "16px" }}>
        Loading item...
      </div>
    );
  }

  if (error || !item) {
    return (
      <div style={{ minHeight: "100vh", background: "#000", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", fontFamily: "Times New Roman, serif", gap: "16px" }}>
        <p style={{ color: "#f87171", fontSize: "15px" }}>{error || "Item not found."}</p>
        <button
          onClick={() => router.push("/admin/dashboard")}
          style={{ padding: "10px 20px", borderRadius: "8px", background: "#F5A623", border: "none", color: "#000", fontWeight: 700, cursor: "pointer", fontFamily: "Times New Roman, serif" }}
        >
          Back to Inventory
        </button>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "#000000", fontFamily: "Times New Roman, serif", padding: "36px 40px" }}>
      {/* Breadcrumb / back */}
      <button
        onClick={() => router.push("/admin/dashboard")}
        style={{ background: "none", border: "none", color: "#ffffff", fontSize: "13px", cursor: "pointer", marginBottom: "28px", padding: 0, fontFamily: "Times New Roman, serif" }}
      >
        ← Back to Inventory
      </button>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "48px", maxWidth: "1100px", margin: "36px auto 0" }}>
        {/* Left: image */}
        <div>
          <div style={{ borderRadius: "16px", overflow: "hidden", border: "1.5px solid rgba(245,166,35,0.3)", background: "rgba(255,255,255,0.02)" }}>
            {editing ? (
              <div
                onClick={() => fileRef.current?.click()}
                style={{ height: "420px", cursor: "pointer", position: "relative", display: "flex", alignItems: "center", justifyContent: "center" }}
              >
                {imagePreview ? (
                  <img src={imagePreview} alt={name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                ) : (
                  <DetailPlaceholder name={name} />
                )}
                <div style={{ position: "absolute", bottom: 12, right: 12, background: "rgba(0,0,0,0.7)", color: "#F5A623", padding: "6px 14px", borderRadius: "8px", fontSize: "12px" }}>
                  📷 Click to change
                </div>
                <input ref={fileRef} type="file" accept="image/*" onChange={handleFileChange} style={{ display: "none" }} />
              </div>
            ) : item.image_url ? (
              <img src={item.image_url} alt={item.name} style={{ width: "100%", height: "420px", objectFit: "cover" }} />
            ) : (
              <DetailPlaceholder name={item.name} />
            )}
          </div>
        </div>

        {/* Right: details */}
        <div>
          <p style={{ margin: "0 0 6px", fontSize: "12px", color: "#F5A623", letterSpacing: "0.08em", textTransform: "uppercase" }}>
            {editing ? (
              <input value={category} onChange={(e) => setCategory(e.target.value)} style={{ ...inputStyle, padding: "6px 10px", fontSize: "12px", width: "auto" }} />
            ) : (
              item.category
            )}
          </p>

          {editing ? (
            <input value={name} onChange={(e) => setName(e.target.value)} style={{ ...inputStyle, fontSize: "24px", fontWeight: 700, marginBottom: "16px" }} />
          ) : (
            <h1 style={{ margin: "0 0 16px", fontSize: "28px", fontWeight: 700, color: "#ffffff" }}>{item.name}</h1>
          )}

          <span
            style={{
              display: "inline-block",
              padding: "4px 14px",
              borderRadius: "999px",
              fontSize: "12px",
              fontWeight: 700,
              marginBottom: "20px",
              background: (editing ? state : item.status) === "available"
                ? "rgba(34,197,94,0.2)"
                : (editing ? state : item.status) === "Checked_out"
                ? "rgba(239,68,68,0.2)"
                : "rgba(245,166,35,0.2)",
              color: (editing ? state : item.status) === "available"
                ? "#4ade80"
                : (editing ? state : item.status) === "Checked_out"
                ? "#f87171"
                : "#F5A623",
              border: `1px solid ${(editing ? state : item.status) === "available"
                ? "#4ade80"
                : (editing ? state : item.status) === "Checked_out"
                ? "#f87171"
                : "#F5A623"}`,
              textTransform: "capitalize",
              cursor: editing ? "pointer" : "default",
            }}
            onClick={() => editing && setState(state === "available" ? "Checked_out" : "available")}
            title={editing ? "Click to toggle state" : undefined}
          >
            {editing ? state : item.status} {editing && "✎"}
          </span>

          <div style={{ height: "1px", background: "rgba(245,166,35,0.2)", margin: "8px 0 20px" }} />

          {editing ? (
            <div style={{ marginBottom: "20px" }}>
              <label style={labelStyle}>Description</label>
              <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={4} style={{ ...inputStyle, resize: "none", lineHeight: 1.5 }} />
            </div>
          ) : (
            <p style={{ fontSize: "14px", color: "rgba(255,255,255,0.6)", lineHeight: 1.6, marginBottom: "20px" }}>{item.description}</p>
          )}

          <div style={{ marginBottom: "24px" }}>
            <label style={labelStyle}>Serial Number</label>
            {editing ? (
              <input value={serialNumber} onChange={(e) => setSerialNumber(e.target.value)} style={inputStyle} />
            ) : (
              <p style={{ margin: 0, fontSize: "14px", color: "rgba(255,255,255,0.5)" }}>{item.serial_number}</p>
            )}
          </div>

          <div style={{ marginBottom: "24px" }}>
            <label style={labelStyle}>State</label>
            {editing ? (
              <select value={state} onChange={(e) => setState(e.target.value as "available" | "Checked_out" | "Maintenance")} style={{ ...inputStyle, appearance: "none", WebkitAppearance: "none", MozAppearance: "none" }}>
                <option value="available">Available</option>
                <option value="Checked_out">Checked Out</option>
                <option value="Maintenance">Maintenance</option>
              </select>
            ) : (
              <p style={{ margin: 0, fontSize: "14px", color: "rgba(255,255,255,0.5)" }}>{item.status}</p>
            )}
          </div>

          <div style={{ marginBottom: "24px" }}>
            <label style={labelStyle}>Added</label>
            <p style={{ margin: 0, fontSize: "13px", color: "rgba(255,255,255,0.4)" }}>
              {new Date(item.created_at).toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" })}
            </p>
          </div>

          {actionError && <p style={{ color: "#f87171", fontSize: "13px", marginBottom: "16px" }}>{actionError}</p>}

          {/* Action buttons */}
          {!editing ? (
            <div style={{ display: "flex", gap: "12px" }}>
              <button
                onClick={startEditing}
                style={{ flex: 1, padding: "13px", borderRadius: "10px", background: "#F5A623", border: "none", color: "#000", fontWeight: 700, fontSize: "14px", cursor: "pointer", fontFamily: "Times New Roman, serif" }}
              >
                Edit Item
              </button>
              {!confirmDelete ? (
                <button
                  onClick={() => setConfirmDelete(true)}
                  style={{ flex: 1, padding: "13px", borderRadius: "10px", background: "transparent", border: "1.5px solid rgba(239,68,68,0.5)", color: "#f87171", fontWeight: 700, fontSize: "14px", cursor: "pointer", fontFamily: "Times New Roman, serif" }}
                >
                  Delete Item
                </button>
              ) : (
                <div style={{ flex: 1, display: "flex", gap: "8px" }}>
                  <button
                    onClick={handleDelete}
                    disabled={deleting}
                    style={{ flex: 1, padding: "13px", borderRadius: "10px", background: "#ef4444", border: "none", color: "#fff", fontWeight: 700, fontSize: "13px", cursor: deleting ? "not-allowed" : "pointer", opacity: deleting ? 0.7 : 1, fontFamily: "Times New Roman, serif" }}
                  >
                    {deleting ? "Deleting..." : "Confirm"}
                  </button>
                  <button
                    onClick={() => setConfirmDelete(false)}
                    style={{ flex: 1, padding: "13px", borderRadius: "10px", background: "transparent", border: "1.5px solid rgba(255,255,255,0.2)", color: "rgba(255,255,255,0.6)", fontWeight: 600, fontSize: "13px", cursor: "pointer", fontFamily: "Times New Roman, serif" }}
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div style={{ display: "flex", gap: "12px" }}>
              <button
                onClick={handleSave}
                disabled={saving}
                style={{ flex: 1, padding: "13px", borderRadius: "10px", background: "#F5A623", border: "none", color: "#000", fontWeight: 700, fontSize: "14px", cursor: saving ? "not-allowed" : "pointer", opacity: saving ? 0.7 : 1, fontFamily: "Times New Roman, serif" }}
              >
                {saving ? "Saving..." : "Save Changes"}
              </button>
              <button
                onClick={cancelEditing}
                style={{ flex: 1, padding: "13px", borderRadius: "10px", background: "transparent", border: "1.5px solid rgba(255,255,255,0.2)", color: "rgba(255,255,255,0.6)", fontWeight: 600, fontSize: "14px", cursor: "pointer", fontFamily: "Times New Roman, serif" }}
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}