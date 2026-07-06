"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

const API_BASE = "http://192.168.1.201:8080";

interface Item {
  id: number;
  name: string;
  category: string;
  description: string;
  serial_number: string;
  image_url: string;
  status: "available" | "loaned";
  created_at: string;
}

const NAV_ITEMS = [
  { label: "Inventory", icon: "📦", key: "inventory" },
  { label: "Loans", icon: "🔄", key: "loans" },
  { label: "Borrow List", icon: "📋", key: "borrow" },
];

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

function ItemPlaceholder({ name }: { name: string }) {
  return (
    <div style={{ width: "100%", height: "160px", display: "flex", alignItems: "center", justifyContent: "center", background: "linear-gradient(135deg, rgba(245,166,35,0.15), rgba(0,0,0,0.4))", fontSize: "40px", position: "relative" }}>
      📦
      <span style={{ position: "absolute", bottom: 8, left: 0, right: 0, textAlign: "center", fontSize: "11px", color: "rgba(255,255,255,0.4)", fontFamily: "Times New Roman, serif" }}>{name}</span>
    </div>
  );
}

function ItemCard({ item, onClick }: { item: Item; onClick: () => void }) {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{ borderRadius: "14px", border: `1.5px solid ${hovered ? "#F5A623" : "rgba(245,166,35,0.45)"}`, background: hovered ? "rgba(245,166,35,0.07)" : "rgba(255,255,255,0.03)", cursor: "pointer", overflow: "hidden", transform: hovered ? "scale(1.04)" : "scale(1)", boxShadow: hovered ? "0 8px 32px rgba(245,166,35,0.25), 0 2px 8px rgba(0,0,0,0.5)" : "0 2px 8px rgba(0,0,0,0.3)", transition: "all 0.22s ease", fontFamily: "Times New Roman, serif", position: "relative" }}
    >
      <div style={{ position: "relative", height: "160px", overflow: "hidden" }}>
        {item.image_url ? (
          <img src={item.image_url} alt={item.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        ) : (
          <ItemPlaceholder name={item.name} />
        )}
        <span style={{ position: "absolute", top: 10, right: 10, padding: "3px 10px", borderRadius: "999px", fontSize: "11px", fontWeight: 700, background: item.status === "available" ? "rgba(34,197,94,0.2)" : "rgba(239,68,68,0.2)", color: item.status === "available" ? "#4ade80" : "#f87171", border: `1px solid ${item.status === "available" ? "#4ade80" : "#f87171"}`, fontFamily: "Times New Roman, serif", letterSpacing: "0.05em", textTransform: "capitalize" }}>
          {item.status}
        </span>
      </div>
      <div style={{ padding: "14px 16px 16px" }}>
        <p style={{ margin: "0 0 4px", fontSize: "11px", color: "#F5A623", letterSpacing: "0.08em", textTransform: "uppercase" }}>{item.category}</p>
        <h3 style={{ margin: "0 0 6px", fontSize: "15px", fontWeight: 700, color: "#ffffff", lineHeight: 1.3 }}>{item.name}</h3>
        <p style={{ margin: 0, fontSize: "12px", color: "rgba(255,255,255,0.5)", lineHeight: 1.4 }}>{item.description}</p>
        <p style={{ margin: "8px 0 0", fontSize: "11px", color: "rgba(255,255,255,0.3)" }}>S/N: {item.serial_number}</p>
      </div>
    </div>
  );
}

function AddItemModal({ onClose, onAdded }: { onClose: () => void; onAdded: (item: Item) => void }) {
  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [serialNumber, setSerialNumber] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [serialError, setSerialError] = useState<string | null>(null);
  const [generalError, setGeneralError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    setImageFile(file);
    if (file) {
      const reader = new FileReader();
      reader.onload = () => setImagePreview(reader.result as string);
      reader.readAsDataURL(file);
    } else {
      setImagePreview(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setSerialError(null);
    setGeneralError(null);
    try {
      let image_url = "";
      if (imageFile) {
        const formData = new FormData();
        formData.append("image", imageFile);
        const uploadRes = await fetch(`${API_BASE}/upload`, { method: "POST", body: formData });
        if (!uploadRes.ok) throw new Error("Image upload failed");
        const uploadData = await uploadRes.json();
        image_url = uploadData.image_url;
      }
      const res = await fetch(`${API_BASE}/items`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, category, description, serial_number: serialNumber, image_url }),
      });
      if (res.status === 409) { setSerialError("This serial number already exists. Please use a unique serial number."); setSubmitting(false); return; }
      if (!res.ok) throw new Error(`Server error: ${res.status}`);
      const newItem = await res.json();
      onAdded(newItem);
      onClose();
    } catch (err: unknown) {
      setGeneralError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, zIndex: 100, background: "rgba(0,0,0,0.80)", display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(4px)" }}>
      <div onClick={(e) => e.stopPropagation()} style={{ width: "520px", maxWidth: "92vw", borderRadius: "18px", border: "1.5px solid rgba(245,166,35,0.45)", background: "#111111", fontFamily: "Times New Roman, serif", boxShadow: "0 24px 80px rgba(0,0,0,0.8)", maxHeight: "90vh", overflowY: "auto" }}>
        <div style={{ padding: "28px 32px 20px", borderBottom: "1px solid rgba(245,166,35,0.15)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h2 style={{ margin: 0, fontSize: "20px", fontWeight: 700, color: "#ffffff", letterSpacing: "0.04em" }}>Add New Item</h2>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "rgba(255,255,255,0.4)", fontSize: "22px", cursor: "pointer", lineHeight: 1 }}>✕</button>
        </div>
        <form onSubmit={handleSubmit} style={{ padding: "28px 32px 32px", display: "flex", flexDirection: "column", gap: "20px" }}>
          <div>
            <label style={{ display: "block", fontSize: "12px", color: "rgba(255,255,255,0.5)", marginBottom: "8px", letterSpacing: "0.06em", textTransform: "uppercase" }}>Image (optional)</label>
            <div onClick={() => fileRef.current?.click()} style={{ height: "140px", borderRadius: "10px", border: "1.5px dashed rgba(245,166,35,0.4)", background: "rgba(245,166,35,0.04)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", overflow: "hidden" }}>
              {imagePreview ? (
                <img src={imagePreview} alt="preview" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              ) : (
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontSize: "28px", marginBottom: "6px" }}>📷</div>
                  <p style={{ margin: 0, fontSize: "13px", color: "rgba(255,255,255,0.35)" }}>Click to upload image</p>
                </div>
              )}
            </div>
            <input ref={fileRef} type="file" accept="image/*" onChange={handleFileChange} style={{ display: "none" }} />
          </div>
          <div>
            <label style={{ display: "block", fontSize: "12px", color: "rgba(255,255,255,0.5)", marginBottom: "8px", letterSpacing: "0.06em", textTransform: "uppercase" }}>Name *</label>
            <input type="text" required value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Dell Laptop" style={inputStyle} />
          </div>
          <div>
            <label style={{ display: "block", fontSize: "12px", color: "rgba(255,255,255,0.5)", marginBottom: "8px", letterSpacing: "0.06em", textTransform: "uppercase" }}>Category *</label>
            <input type="text" required value={category} onChange={(e) => setCategory(e.target.value)} placeholder="e.g. Electronics" style={inputStyle} />
          </div>
          <div>
            <label style={{ display: "block", fontSize: "12px", color: "rgba(255,255,255,0.5)", marginBottom: "8px", letterSpacing: "0.06em", textTransform: "uppercase" }}>Description</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="e.g. 15-inch, i7, 16GB RAM" rows={3} style={{ ...inputStyle, resize: "none", lineHeight: 1.5 }} />
          </div>
          <div>
            <label style={{ display: "block", fontSize: "12px", color: "rgba(255,255,255,0.5)", marginBottom: "8px", letterSpacing: "0.06em", textTransform: "uppercase" }}>Serial Number *</label>
            <input type="text" required value={serialNumber} onChange={(e) => { setSerialNumber(e.target.value); setSerialError(null); }} placeholder="e.g. SN12345" style={{ ...inputStyle, border: serialError ? "1.5px solid #f87171" : "1.5px solid rgba(245,166,35,0.35)" }} />
            {serialError && <p style={{ margin: "6px 0 0", fontSize: "12px", color: "#f87171" }}>{serialError}</p>}
          </div>
          {generalError && <p style={{ margin: 0, fontSize: "13px", color: "#f87171", textAlign: "center" }}>{generalError}</p>}
          <div style={{ display: "flex", gap: "12px", marginTop: "4px" }}>
            <button type="button" onClick={onClose} style={{ flex: 1, padding: "12px", borderRadius: "8px", background: "transparent", border: "1.5px solid rgba(255,255,255,0.15)", color: "rgba(255,255,255,0.6)", fontWeight: 600, fontSize: "14px", cursor: "pointer", fontFamily: "Times New Roman, serif" }}>Cancel</button>
            <button type="submit" disabled={submitting} style={{ flex: 1, padding: "12px", borderRadius: "8px", background: "#F5A623", border: "none", color: "#000000", fontWeight: 700, fontSize: "14px", cursor: submitting ? "not-allowed" : "pointer", opacity: submitting ? 0.7 : 1, fontFamily: "Times New Roman, serif", letterSpacing: "0.04em" }}>
              {submitting ? "Adding..." : "Add Item"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const router = useRouter();
  const [activeNav, setActiveNav] = useState("inventory");
  const [search, setSearch] = useState("");
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddItem, setShowAddItem] = useState(false);

  useEffect(() => {
    const fetchItems = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await fetch(`${API_BASE}/items`);
        if (!res.ok) throw new Error(`Server error: ${res.status}`);
        const data = await res.json();
        setItems(data);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Failed to load items");
      } finally {
        setLoading(false);
      }
    };
    fetchItems();
  }, []);

  const handleItemAdded = (newItem: Item) => {
    setItems((prev) => [newItem, ...prev]);
  };

  const filtered = items.filter(
    (item) =>
      item.name.toLowerCase().includes(search.toLowerCase()) ||
      item.category.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#000000", fontFamily: "Times New Roman, serif" }}>
      <aside style={{ width: "220px", minHeight: "100vh", background: "#1c1c1c", borderRight: "1px solid rgba(245,166,35,0.2)", display: "flex", flexDirection: "column", position: "fixed", top: 0, left: 0, bottom: 0 }}>
        <div style={{ padding: "28px 24px 24px", borderBottom: "1px solid rgba(245,166,35,0.15)" }}>
          <span style={{ fontSize: "20px", fontWeight: 700, color: "#F5A623", letterSpacing: "0.08em" }}>⚙ GEAR TRACK</span>
        </div>
        <nav style={{ flex: 1, padding: "20px 12px", display: "flex", flexDirection: "column", gap: "4px" }}>
          {NAV_ITEMS.map((nav) => (
            <button key={nav.key} onClick={() => setActiveNav(nav.key)} style={{ display: "flex", alignItems: "center", gap: "12px", padding: "12px 16px", borderRadius: "10px", background: activeNav === nav.key ? "rgba(245,166,35,0.15)" : "transparent", border: activeNav === nav.key ? "1px solid rgba(245,166,35,0.35)" : "1px solid transparent", color: activeNav === nav.key ? "#F5A623" : "rgba(255,255,255,0.55)", fontSize: "14px", fontWeight: activeNav === nav.key ? 700 : 400, cursor: "pointer", textAlign: "left", fontFamily: "Times New Roman, serif", letterSpacing: "0.03em", transition: "all 0.15s ease" }}>
              <span>{nav.icon}</span>{nav.label}
            </button>
          ))}
        </nav>
        <div style={{ padding: "16px 12px", borderTop: "1px solid rgba(245,166,35,0.15)" }}>
          <button
            style={{ display: "flex", alignItems: "center", gap: "12px", width: "100%", padding: "12px 16px", borderRadius: "10px", background: "transparent", border: "1px solid rgba(239,68,68,0.3)", color: "rgba(239,68,68,0.7)", fontSize: "14px", cursor: "pointer", fontFamily: "Times New Roman, serif", letterSpacing: "0.03em", transition: "all 0.15s ease" }}
            onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(239,68,68,0.1)"; e.currentTarget.style.color = "#f87171"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "rgba(239,68,68,0.7)"; }}
          >
            <span>🚪</span> Logout
          </button>
        </div>
      </aside>

      <main style={{ marginLeft: "220px", flex: 1, padding: "36px 40px", minHeight: "100vh" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "32px" }}>
          <div>
            <h1 style={{ margin: 0, fontSize: "26px", fontWeight: 700, color: "#ffffff", letterSpacing: "0.04em" }}>Inventory</h1>
            <p style={{ margin: "4px 0 0", fontSize: "13px", color: "rgba(255,255,255,0.4)" }}>
              {loading ? "Loading..." : `${items.length} items in store`}
            </p>
          </div>
          <div style={{ display: "flex", gap: "14px", alignItems: "center" }}>
            <div style={{ position: "relative" }}>
              <span style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", color: "rgba(255,255,255,0.35)", fontSize: "15px" }}>🔍</span>
              <input type="text" placeholder="Search items..." value={search} onChange={(e) => setSearch(e.target.value)} style={{ padding: "10px 16px 10px 40px", borderRadius: "10px", border: "1.5px solid rgba(245,166,35,0.35)", background: "rgba(255,255,255,0.04)", color: "#ffffff", fontSize: "14px", outline: "none", width: "220px", fontFamily: "Times New Roman, serif" }} />
            </div>
            <button onClick={() => setShowAddItem(true)} style={{ padding: "10px 22px", borderRadius: "10px", background: "#F5A623", border: "none", color: "#000000", fontWeight: 700, fontSize: "14px", cursor: "pointer", fontFamily: "Times New Roman, serif", letterSpacing: "0.04em", whiteSpace: "nowrap" }}>
              + Add Item
            </button>
          </div>
        </div>

        <div style={{ height: "1px", background: "linear-gradient(to right, rgba(245,166,35,0.6), transparent)", marginBottom: "32px" }} />

        {loading && <div style={{ textAlign: "center", padding: "80px 0", color: "rgba(255,255,255,0.4)", fontSize: "16px" }}>Loading inventory...</div>}
        {error && (
          <div style={{ textAlign: "center", padding: "80px 0" }}>
            <p style={{ color: "#f87171", fontSize: "15px", marginBottom: "8px" }}>Could not connect to the server.</p>
            <p style={{ color: "rgba(255,255,255,0.3)", fontSize: "13px" }}>{error}</p>
          </div>
        )}
        {!loading && !error && filtered.length === 0 && (
          <div style={{ textAlign: "center", padding: "80px 0", color: "rgba(255,255,255,0.3)", fontSize: "16px" }}>
            {items.length === 0 ? "No items in inventory yet. Add your first item!" : "No items match your search."}
          </div>
        )}
        {!loading && !error && filtered.length > 0 && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: "24px" }}>
            {filtered.map((item) => (
              <ItemCard key={item.id} item={item} onClick={() => router.push(`/admin/dashboard/item/${item.id}`)} />
            ))}
          </div>
        )}
      </main>

      {showAddItem && <AddItemModal onClose={() => setShowAddItem(false)} onAdded={handleItemAdded} />}
    </div>
  );
}