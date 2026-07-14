"use client";

import { useState, useEffect, useRef, useCallback } from "react";
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

interface Borrower {
  id: number;
  name: string;
  email?: string;
  phone?: string;
  department?: string;
  created_at?: string;
}

interface Loan {
  id: number;
  item_id: number;
  borrower_id: number;
  checked_out_at: string;
  expected_return_at?: string;
  due_date?: string;
  returned_at: string | null;
  item?: { id: number; name: string; category: string; image_url: string };
  borrower?: { id: number; name: string };
  item_name?: string;
  borrower_name?: string;
}

interface NotificationItem {
  id: number;
  loan_id: number;
  message: string;
  is_read: boolean;
  created_at: string;
}

const NAV_ITEMS = [
  { label: "Inventory", icon: "📦", key: "inventory" },
  { label: "Loans",     icon: "🔄", key: "loans"     },
  { label: "Borrow List",icon: "📋", key: "borrow"   },
  { label: "Register",  icon: "✍️",  key: "register"  },
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

const labelStyle: React.CSSProperties = {
  display: "block",
  fontSize: "12px",
  color: "rgba(255,255,255,0.5)",
  marginBottom: "8px",
  letterSpacing: "0.06em",
  textTransform: "uppercase",
};

// ─── SHARED PLACEHOLDER ───────────────────────────────────────────────────────

function ItemPlaceholder({ name }: { name: string }) {
  return (
    <div style={{ width: "100%", height: "100%", minHeight: "160px", display: "flex", alignItems: "center", justifyContent: "center", background: "linear-gradient(135deg, rgba(245,166,35,0.15), rgba(0,0,0,0.4))", fontSize: "40px", position: "relative" }}>
      📦
      <span style={{ position: "absolute", bottom: 8, left: 0, right: 0, textAlign: "center", fontSize: "11px", color: "rgba(255,255,255,0.4)", fontFamily: "Times New Roman, serif" }}>{name}</span>
    </div>
  );
}

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
}

async function fetchResourceName(url: string) {
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const data = await res.json();
    return typeof data?.name === "string" ? data.name : null;
  } catch {
    return null;
  }
}

function getAuthHeaders(extra: Record<string, string> = {}) {
  if (typeof window === "undefined") return extra;
  const token = window.localStorage.getItem("token");
  return token ? { ...extra, Authorization: `Bearer ${token}` } : extra;
}

function NotificationSidebarSection({
  notifications,
  loading,
  error,
  expanded,
  unreadCount,
  onToggle,
  onMarkAllRead,
}: {
  notifications: NotificationItem[];
  loading: boolean;
  error: string | null;
  expanded: boolean;
  unreadCount: number;
  onToggle: () => void;
  onMarkAllRead: () => void;
}) {
  return (
    <div style={{ padding: "12px 12px 0", borderTop: "1px solid rgba(245,166,35,0.15)" }}>
      <button
        onClick={onToggle}
        style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%", padding: "12px 16px", borderRadius: "10px", background: expanded ? "rgba(245,166,35,0.15)" : "transparent", border: expanded ? "1px solid rgba(245,166,35,0.35)" : "1px solid transparent", color: expanded ? "#F5A623" : "rgba(255,255,255,0.55)", fontSize: "14px", fontWeight: expanded ? 700 : 400, cursor: "pointer", textAlign: "left", fontFamily: "Times New Roman, serif", letterSpacing: "0.03em", transition: "all 0.15s ease" }}
      >
        <span style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <span>🔔</span>
          Notifications
        </span>
        {unreadCount > 0 && (
          <span style={{ minWidth: "24px", padding: "2px 8px", borderRadius: "999px", background: "rgba(239,68,68,0.2)", color: "#f87171", fontSize: "11px", fontWeight: 700, textAlign: "center" }}>
            {unreadCount}
          </span>
        )}
      </button>

      {expanded && (
        <div style={{ marginTop: "10px", padding: "10px", borderRadius: "10px", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(245,166,35,0.2)", maxHeight: "320px", overflowY: "auto" }}>
          {loading && <p style={{ margin: 0, fontSize: "12px", color: "rgba(255,255,255,0.45)" }}>Loading notifications...</p>}
          {error && <p style={{ margin: 0, fontSize: "12px", color: "#f87171" }}>{error}</p>}
          {!loading && !error && notifications.length === 0 && (
            <p style={{ margin: 0, fontSize: "12px", color: "rgba(255,255,255,0.45)" }}>No notifications yet.</p>
          )}
          {!loading && !error && notifications.length > 0 && (
            <>
              {unreadCount > 0 && (
                <button onClick={onMarkAllRead} style={{ width: "100%", marginBottom: "8px", padding: "8px 10px", borderRadius: "8px", background: "transparent", border: "1px solid rgba(245,166,35,0.3)", color: "#F5A623", cursor: "pointer", fontSize: "12px", fontFamily: "Times New Roman, serif" }}>
                  Mark all read
                </button>
              )}
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {notifications.map((notification) => (
                  <div key={notification.id} style={{ padding: "8px 10px", borderRadius: "8px", background: notification.is_read ? "transparent" : "rgba(245,166,35,0.08)", border: notification.is_read ? "1px solid transparent" : "1px solid rgba(245,166,35,0.2)" }}>
                    <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "8px" }}>
                      <p style={{ margin: 0, fontSize: "12px", color: "rgba(255,255,255,0.8)", lineHeight: 1.4 }}>{notification.message}</p>
                      {!notification.is_read && <span style={{ flexShrink: 0, fontSize: "10px", color: "#F5A623", fontWeight: 700 }}>NEW</span>}
                    </div>
                    <p style={{ margin: "6px 0 0", fontSize: "10px", color: "rgba(255,255,255,0.35)" }}>
                      {new Date(notification.created_at).toLocaleString()}
                    </p>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

// ─── INVENTORY CARD ───────────────────────────────────────────────────────────

function ItemCard({ item, onClick, onCheckout, onEdit, onDelete }: { item: Item; onClick: () => void; onCheckout: () => void; onEdit: () => void; onDelete: () => void }) {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{ borderRadius: "14px", border: `1.5px solid ${hovered ? "#F5A623" : "rgba(245,166,35,0.45)"}`, background: hovered ? "rgba(245,166,35,0.07)" : "rgba(255,255,255,0.03)", cursor: "pointer", overflow: "hidden", transform: hovered ? "scale(1.04)" : "scale(1)", boxShadow: hovered ? "0 8px 32px rgba(245,166,35,0.25), 0 2px 8px rgba(0,0,0,0.5)" : "0 2px 8px rgba(0,0,0,0.3)", transition: "all 0.22s ease", fontFamily: "Times New Roman, serif" }}
    >
      <div style={{ position: "relative", height: "160px", overflow: "hidden" }}>
        {item.image_url
          ? <img src={item.image_url} alt={item.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          : <ItemPlaceholder name={item.name} />}
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

// ─── ADD ITEM MODAL ───────────────────────────────────────────────────────────

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
    setSubmitting(true); setSerialError(null); setGeneralError(null);
    try {
      let image_url = "";
      if (imageFile) {
        const fd = new FormData(); fd.append("image", imageFile);
        const up = await fetch(`${API_BASE}/upload`, { method: "POST", body: fd });
        if (!up.ok) throw new Error("Image upload failed");
        image_url = (await up.json()).image_url;
      }
      const res = await fetch(`${API_BASE}/items`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, category, description, serial_number: serialNumber, image_url }),
      });
      if (res.status === 409) { setSerialError("This serial number already exists."); setSubmitting(false); return; }
      if (!res.ok) throw new Error(`Server error: ${res.status}`);
      onAdded(await res.json()); onClose();
    } catch (err: unknown) {
      setGeneralError(err instanceof Error ? err.message : "Something went wrong");
    } finally { setSubmitting(false); }
  };

  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, zIndex: 100, background: "rgba(0,0,0,0.80)", display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(4px)" }}>
      <div onClick={e => e.stopPropagation()} style={{ width: "520px", maxWidth: "92vw", borderRadius: "18px", border: "1.5px solid rgba(245,166,35,0.45)", background: "#111111", fontFamily: "Times New Roman, serif", boxShadow: "0 24px 80px rgba(0,0,0,0.8)", maxHeight: "90vh", overflowY: "auto" }}>
        <div style={{ padding: "28px 32px 20px", borderBottom: "1px solid rgba(245,166,35,0.15)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h2 style={{ margin: 0, fontSize: "20px", fontWeight: 700, color: "#ffffff" }}>Add New Item</h2>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "rgba(255,255,255,0.4)", fontSize: "22px", cursor: "pointer" }}>✕</button>
        </div>
        <form onSubmit={handleSubmit} style={{ padding: "28px 32px 32px", display: "flex", flexDirection: "column", gap: "20px" }}>
          <div>
            <label style={labelStyle}>Image (optional)</label>
            <div onClick={() => fileRef.current?.click()} style={{ height: "140px", borderRadius: "10px", border: "1.5px dashed rgba(245,166,35,0.4)", background: "rgba(245,166,35,0.04)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", overflow: "hidden" }}>
              {imagePreview
                ? <img src={imagePreview} alt="preview" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                : <div style={{ textAlign: "center" }}><div style={{ fontSize: "28px", marginBottom: "6px" }}>📷</div><p style={{ margin: 0, fontSize: "13px", color: "rgba(255,255,255,0.35)" }}>Click to upload image</p></div>}
            </div>
            <input ref={fileRef} type="file" accept="image/*" onChange={handleFileChange} style={{ display: "none" }} />
          </div>
          <div><label style={labelStyle}>Name *</label><input type="text" required value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Dell Laptop" style={inputStyle} /></div>
          <div><label style={labelStyle}>Category *</label><input type="text" required value={category} onChange={e => setCategory(e.target.value)} placeholder="e.g. Electronics" style={inputStyle} /></div>
          <div><label style={labelStyle}>Description</label><textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="e.g. 15-inch, i7, 16GB RAM" rows={3} style={{ ...inputStyle, resize: "none", lineHeight: 1.5 }} /></div>
          <div>
            <label style={labelStyle}>Serial Number *</label>
            <input type="text" required value={serialNumber} onChange={e => { setSerialNumber(e.target.value); setSerialError(null); }} placeholder="e.g. SN12345" style={{ ...inputStyle, border: serialError ? "1.5px solid #f87171" : "1.5px solid rgba(245,166,35,0.35)" }} />
            {serialError && <p style={{ margin: "6px 0 0", fontSize: "12px", color: "#f87171" }}>{serialError}</p>}
          </div>
          {generalError && <p style={{ margin: 0, fontSize: "13px", color: "#f87171", textAlign: "center" }}>{generalError}</p>}
          <div style={{ display: "flex", gap: "12px" }}>
            <button type="button" onClick={onClose} style={{ flex: 1, padding: "12px", borderRadius: "8px", background: "transparent", border: "1.5px solid rgba(255,255,255,0.15)", color: "rgba(255,255,255,0.6)", fontWeight: 600, fontSize: "14px", cursor: "pointer", fontFamily: "Times New Roman, serif" }}>Cancel</button>
            <button type="submit" disabled={submitting} style={{ flex: 1, padding: "12px", borderRadius: "8px", background: "#F5A623", border: "none", color: "#000", fontWeight: 700, fontSize: "14px", cursor: submitting ? "not-allowed" : "pointer", opacity: submitting ? 0.7 : 1, fontFamily: "Times New Roman, serif" }}>
              {submitting ? "Adding..." : "Add Item"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── LOANS SECTION ────────────────────────────────────────────────────────────

function LoansSection({ refreshTrigger = 0 }: { refreshTrigger?: number }) {
  const [loans, setLoans] = useState<Loan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [returningId, setReturningId] = useState<number | null>(null);
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [activeReturnLoan, setActiveReturnLoan] = useState<Loan | null>(null);
  const [returnDateInput, setReturnDateInput] = useState("");
  const [loanLabels, setLoanLabels] = useState<Record<number, { itemName: string | null; borrowerName: string | null }>>({});

  const fetchLoans = useCallback(async () => {
    try {
      setLoading(true); setError(null);
      const res = await fetch(`${API_BASE}/loans?active=true`);
      if (!res.ok) throw new Error(`Server error: ${res.status}`);
      const data = await res.json();
      const loanData = Array.isArray(data) ? data : [];
      const labels: Record<number, { itemName: string | null; borrowerName: string | null }> = {};

      await Promise.all(
        loanData.map(async (loan: Loan) => {
          const itemName = loan.item?.name || loan.item_name || (loan.item_id ? await fetchResourceName(`${API_BASE}/items/${loan.item_id}`) : null);
          const borrowerName = loan.borrower?.name || loan.borrower_name || (loan.borrower_id ? await fetchResourceName(`${API_BASE}/borrowers/${loan.borrower_id}`) : null);
          labels[loan.id] = { itemName, borrowerName };
        })
      );

      setLoans(loanData);
      setLoanLabels(labels);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load loans");
    } finally { setLoading(false); }
  }, []);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void fetchLoans();
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [fetchLoans, refreshTrigger]);

  const openReturnModal = async (loan: Loan) => {
    setActiveReturnLoan(loan);
    setReturnDateInput(new Date().toISOString().slice(0, 10));
    setShowReturnModal(true);

    try {
      const res = await fetch(`${API_BASE}/loans/${loan.id}`);
      if (!res.ok) return;
      const data = await res.json();
      if (data) setActiveReturnLoan(prev => ({ ...(prev ?? loan), ...data }));
    } catch (err) {
      // ignore — show what we have
      console.error("Failed to fetch loan details:", err);
    }
  };

  const performReturn = async (loanId: number, returnDate: string) => {
    setReturningId(loanId);
    try {
      const res = await fetch(`${API_BASE}/loans/${loanId}/return`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ returned_at: `${returnDate}T00:00:00Z` }),
      });
      if (!res.ok) throw new Error(`Server error: ${res.status}`);
      setLoans(prev => prev.filter(l => l.id !== loanId));
      setShowReturnModal(false);
      setActiveReturnLoan(null);
    } catch (err) { console.error("Return failed:", err); }
    finally { setReturningId(null); }
  };

  const getReturnDate = (loan: Loan) => loan.due_date || loan.expected_return_at || "";
  const isOverdue   = (loan: Loan) => { const d = getReturnDate(loan); return d ? new Date(d) < new Date() : false; };

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "32px" }}>
        <div>
          <h1 style={{ margin: 0, fontSize: "26px", fontWeight: 700, color: "#ffffff", letterSpacing: "0.04em" }}>Active Loans</h1>
          <p style={{ margin: "4px 0 0", fontSize: "13px", color: "rgba(255,255,255,0.4)" }}>
            {loading ? "Loading..." : `${loans.length} item${loans.length !== 1 ? "s" : ""} currently checked out`}
          </p>
        </div>
        <button onClick={fetchLoans} style={{ padding: "8px 18px", borderRadius: "8px", background: "transparent", border: "1.5px solid rgba(245,166,35,0.35)", color: "#F5A623", fontSize: "13px", cursor: "pointer", fontFamily: "Times New Roman, serif" }}>↻ Refresh</button>
      </div>

      <div style={{ height: "1px", background: "linear-gradient(to right, rgba(245,166,35,0.6), transparent)", marginBottom: "32px" }} />

      {loading && <div style={{ textAlign: "center", padding: "80px 0", color: "rgba(255,255,255,0.4)", fontSize: "16px" }}>Loading loans...</div>}
      {error && (
        <div style={{ textAlign: "center", padding: "80px 0" }}>
          <p style={{ color: "#f87171", fontSize: "15px", marginBottom: "8px" }}>Could not load loans.</p>
          <p style={{ color: "rgba(255,255,255,0.3)", fontSize: "13px" }}>{error}</p>
        </div>
      )}
      {!loading && !error && loans.length === 0 && (
        <div style={{ textAlign: "center", padding: "80px 0", color: "rgba(255,255,255,0.3)", fontSize: "16px" }}>No items are currently checked out.</div>
      )}

      {!loading && !error && loans.length > 0 && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: "24px" }}>
          {loans.map(loan => {
            const overdue      = isOverdue(loan);
            const returnDate   = getReturnDate(loan);
            const labels       = loanLabels[loan.id];
            const itemName     = loan.item?.name || loan.item_name || labels?.itemName || `Item #${loan.item_id}`;
            const borrowerName = loan.borrower?.name || loan.borrower_name || labels?.borrowerName || `Borrower #${loan.borrower_id}`;
            const itemImage    = loan.item?.image_url;

            return (
              <div key={loan.id} style={{ borderRadius: "14px", border: `1.5px solid ${overdue ? "rgba(239,68,68,0.55)" : "rgba(245,166,35,0.45)"}`, background: overdue ? "rgba(239,68,68,0.03)" : "rgba(255,255,255,0.03)", overflow: "hidden", fontFamily: "Times New Roman, serif", boxShadow: "0 2px 8px rgba(0,0,0,0.3)" }}>

                {/* ── Image + badge (same layout as ItemCard) ── */}
                <div style={{ position: "relative", height: "160px", overflow: "hidden" }}>
                  {itemImage
                    ? <img src={itemImage} alt={itemName} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    : <ItemPlaceholder name={itemName} />}

                  {/* Overdue / Loaned badge — identical position to "available" badge */}
                  <span style={{ position: "absolute", top: 10, right: 10, padding: "3px 10px", borderRadius: "999px", fontSize: "11px", fontWeight: 700, background: overdue ? "rgba(239,68,68,0.25)" : "rgba(245,166,35,0.2)", color: overdue ? "#f87171" : "#F5A623", border: `1px solid ${overdue ? "#f87171" : "#F5A623"}`, fontFamily: "Times New Roman, serif", letterSpacing: "0.05em", textTransform: "uppercase" }}>
                    {overdue ? "Overdue" : "Loaned"}
                  </span>
                </div>

                {/* ── Details ── */}
                <div style={{ padding: "14px 16px 16px" }}>
                  <h3 style={{ margin: "0 0 6px", fontSize: "15px", fontWeight: 700, color: "#ffffff", lineHeight: 1.3 }}>{itemName}</h3>
                  <p style={{ margin: "0 0 4px", fontSize: "12px", color: "rgba(255,255,255,0.5)" }}>
                    By <span style={{ color: "#F5A623", fontWeight: 600 }}>{borrowerName}</span>
                  </p>
                  <p style={{ margin: "0 0 2px", fontSize: "11px", color: "rgba(255,255,255,0.35)" }}>
                    Out: {fmtDate(loan.checked_out_at)}
                  </p>
                  {returnDate && (
                    <p style={{ margin: "0 0 12px", fontSize: "11px", color: overdue ? "#f87171" : "rgba(255,255,255,0.35)" }}>
                      Due: {fmtDate(returnDate)}
                    </p>
                  )}

                  <button
                    onClick={() => openReturnModal(loan)}
                    disabled={returningId === loan.id}
                    style={{ width: "100%", padding: "9px", borderRadius: "8px", background: "transparent", border: "1.5px solid rgba(245,166,35,0.5)", color: "#F5A623", fontWeight: 600, fontSize: "12px", cursor: returningId === loan.id ? "not-allowed" : "pointer", opacity: returningId === loan.id ? 0.7 : 1, fontFamily: "Times New Roman, serif", letterSpacing: "0.03em" }}
                  >
                    {returningId === loan.id ? "Returning..." : "Mark Returned"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
      {showReturnModal && activeReturnLoan && (
        <div onClick={() => setShowReturnModal(false)} style={{ position: "fixed", inset: 0, zIndex: 150, background: "rgba(0,0,0,0.6)", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div onClick={e => e.stopPropagation()} style={{ width: "420px", borderRadius: "12px", background: "#111", border: "1px solid rgba(245,166,35,0.35)", padding: "20px" }}>
            <h3 style={{ margin: 0, color: "#fff" }}>Confirm Return</h3>
            <p style={{ color: "rgba(255,255,255,0.6)", marginTop: 8 }}>Due date: {getReturnDate(activeReturnLoan) ? fmtDate(getReturnDate(activeReturnLoan)) : "—"}</p>
            <div style={{ marginTop: 12 }}>
              <label style={labelStyle}>Return Date</label>
              <input type="date" value={returnDateInput} onChange={e => setReturnDateInput(e.target.value)} style={{ ...inputStyle, background: "#ffffff", color: "#000000" }} />
            </div>
            <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
              <button onClick={() => { setShowReturnModal(false); setActiveReturnLoan(null); }} style={{ flex: 1, padding: "10px", borderRadius: 8, background: "transparent", border: "1px solid rgba(255,255,255,0.15)", color: "rgba(255,255,255,0.7)" }}>Cancel</button>
              <button onClick={() => performReturn(activeReturnLoan.id, returnDateInput)} disabled={returningId === activeReturnLoan.id} style={{ flex: 1, padding: "10px", borderRadius: 8, background: "#F5A623", border: "none", color: "#000", fontWeight: 700 }}> {returningId === activeReturnLoan.id ? "Returning..." : "Confirm Return"} </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── BORROW LIST SECTION ──────────────────────────────────────────────────────

function BorrowerListSection() {
  const [borrowers, setBorrowers] = useState<Borrower[]>([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState<string | null>(null);

  useEffect(() => {
    const fetch_ = async () => {
      try {
        setLoading(true); setError(null);
        const res = await fetch(`${API_BASE}/borrowers`);
        if (!res.ok) throw new Error(`Server error: ${res.status}`);
        const data = await res.json();
        setBorrowers(Array.isArray(data) ? data : []);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Failed to load borrowers");
      } finally { setLoading(false); }
    };
    fetch_();
  }, []);

  return (
    <div>
      <div style={{ marginBottom: "32px" }}>
        <h1 style={{ margin: 0, fontSize: "26px", fontWeight: 700, color: "#ffffff", letterSpacing: "0.04em" }}>Borrowers</h1>
        <p style={{ margin: "4px 0 0", fontSize: "13px", color: "rgba(255,255,255,0.4)" }}>
          {loading ? "Loading..." : `${borrowers.length} registered borrower${borrowers.length !== 1 ? "s" : ""}`}
        </p>
      </div>

      <div style={{ height: "1px", background: "linear-gradient(to right, rgba(245,166,35,0.6), transparent)", marginBottom: "32px" }} />

      {loading && <div style={{ textAlign: "center", padding: "80px 0", color: "rgba(255,255,255,0.4)", fontSize: "16px" }}>Loading borrowers...</div>}
      {error   && (
        <div style={{ textAlign: "center", padding: "80px 0" }}>
          <p style={{ color: "#f87171", fontSize: "15px", marginBottom: "8px" }}>Could not load borrowers.</p>
          <p style={{ color: "rgba(255,255,255,0.3)", fontSize: "13px" }}>{error}</p>
        </div>
      )}
      {!loading && !error && borrowers.length === 0 && (
        <div style={{ textAlign: "center", padding: "80px 0", color: "rgba(255,255,255,0.3)", fontSize: "16px" }}>
          No borrowers registered yet. Use the Register tab to add one.
        </div>
      )}

      {!loading && !error && borrowers.length > 0 && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "20px" }}>
          {borrowers.map(b => (
            <div key={b.id} style={{ borderRadius: "14px", border: "1.5px solid rgba(245,166,35,0.35)", background: "rgba(255,255,255,0.03)", padding: "22px", fontFamily: "Times New Roman, serif", boxShadow: "0 2px 8px rgba(0,0,0,0.3)" }}>
              {/* Avatar circle */}
              <div style={{ width: "48px", height: "48px", borderRadius: "50%", background: "linear-gradient(135deg, rgba(245,166,35,0.3), rgba(0,0,0,0.4))", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "22px", marginBottom: "14px", border: "1.5px solid rgba(245,166,35,0.25)" }}>
                👤
              </div>

              <h3 style={{ margin: "0 0 10px", fontSize: "15px", fontWeight: 700, color: "#ffffff" }}>{b.name}</h3>

              {b.email && (
                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px" }}>
                  <span style={{ fontSize: "13px" }}>✉</span>
                  <span style={{ fontSize: "13px", color: "rgba(255,255,255,0.5)" }}>{b.email}</span>
                </div>
              )}
              {b.phone && (
                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "10px" }}>
                  <span style={{ fontSize: "13px" }}>📱</span>
                  <span style={{ fontSize: "13px", color: "rgba(255,255,255,0.5)" }}>{b.phone}</span>
                </div>
              )}

              <div style={{ height: "1px", background: "rgba(245,166,35,0.1)", margin: "10px 0" }} />
              <p style={{ margin: 0, fontSize: "11px", color: "rgba(255,255,255,0.3)" }}>
                Registered {b.created_at ? fmtDate(b.created_at) : "recently"}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── REGISTER SECTION ─────────────────────────────────────────────────────────

function RegisterSection({ onRegistered }: { onRegistered: () => void }) {
  const [name, setName]       = useState("");
  const [email, setEmail]     = useState("");
  const [phone, setPhone]     = useState("");
  const [submitting, setSub]  = useState(false);
  const [error, setError]     = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSub(true); setError(null); setSuccess(false);
    try {
      const res = await fetch(`${API_BASE}/borrowers`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, phone }),
      });
      if (!res.ok) throw new Error(`Server error: ${res.status}`);
      setSuccess(true);
      setName(""); setEmail(""); setPhone("");
      onRegistered();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to register borrower");
    } finally { setSub(false); }
  };

  return (
    <div>
      <div style={{ marginBottom: "32px" }}>
        <h1 style={{ margin: 0, fontSize: "26px", fontWeight: 700, color: "#ffffff", letterSpacing: "0.04em" }}>Register Borrower</h1>
        <p style={{ margin: "4px 0 0", fontSize: "13px", color: "rgba(255,255,255,0.4)" }}>Add a new borrower profile to the system</p>
      </div>

      <div style={{ height: "1px", background: "linear-gradient(to right, rgba(245,166,35,0.6), transparent)", marginBottom: "32px" }} />

      <div style={{ maxWidth: "520px" }}>
        {success && (
          <div style={{ background: "rgba(34,197,94,0.08)", border: "1.5px solid rgba(34,197,94,0.3)", borderRadius: "10px", padding: "14px 20px", marginBottom: "24px", color: "#4ade80", fontSize: "14px", fontFamily: "Times New Roman, serif" }}>
            ✅ Borrower registered successfully! They now appear in the Borrow List.
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "20px", fontFamily: "Times New Roman, serif" }}>
          <div>
            <label style={labelStyle}>Full Name *</label>
            <input type="text" required value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Jane Doe" style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>Email</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="e.g. jane@example.com" style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>Phone</label>
            <input type="text" value={phone} onChange={e => setPhone(e.target.value)} placeholder="e.g. 0712345678" style={inputStyle} />
          </div>

          {error && <p style={{ margin: 0, fontSize: "13px", color: "#f87171" }}>{error}</p>}

          <button
            type="submit" disabled={submitting}
            style={{ padding: "13px", borderRadius: "10px", background: "#F5A623", border: "none", color: "#000", fontWeight: 700, fontSize: "14px", cursor: submitting ? "not-allowed" : "pointer", opacity: submitting ? 0.7 : 1, fontFamily: "Times New Roman, serif", letterSpacing: "0.04em" }}
          >
            {submitting ? "Registering..." : "Register Borrower"}
          </button>
        </form>
      </div>
    </div>
  );
}

// ─── MAIN DASHBOARD ───────────────────────────────────────────────────────────

export default function DashboardPage() {
  const router = useRouter();
  const [activeNav, setActiveNav] = useState("inventory");
  const [search, setSearch]       = useState("");
  const [items, setItems]         = useState<Item[]>([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState<string | null>(null);
  const [showAddItem, setShowAdd] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [checkoutItem, setCheckoutItem] = useState<Item | null>(null);
  const [borrowers, setBorrowers] = useState<Borrower[]>([]);
  const [borrowerId, setBorrowerId] = useState<number | null>(null);
  const [dueDate, setDueDate] = useState("");
  const [checkingOut, setCheckingOut] = useState(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const [loanRefreshKey, setLoanRefreshKey] = useState(0);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [notificationsLoading, setNotificationsLoading] = useState(false);
  const [notificationsError, setNotificationsError] = useState<string | null>(null);
  const [notificationsExpanded, setNotificationsExpanded] = useState(false);

  useEffect(() => {
    const go = async () => {
      try {
        setLoading(true); setError(null);
        const res = await fetch(`${API_BASE}/items`);
        if (!res.ok) throw new Error(`Server error: ${res.status}`);
        setItems(await res.json());
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Failed to load items");
      } finally { setLoading(false); }
    };
    go();
  }, []);

  const filtered = items.filter(i =>
    i.name.toLowerCase().includes(search.toLowerCase()) ||
    i.category.toLowerCase().includes(search.toLowerCase())
  );

  const fetchNotifications = useCallback(async () => {
    try {
      setNotificationsLoading(true);
      setNotificationsError(null);
      const res = await fetch(`${API_BASE}/admin/notifications`, {
        headers: getAuthHeaders(),
      });
      if (!res.ok) throw new Error(`Server error: ${res.status}`);
      const data = await res.json();
      setNotifications(Array.isArray(data) ? data : []);
    } catch (err: unknown) {
      setNotificationsError(err instanceof Error ? err.message : "Failed to load notifications");
    } finally {
      setNotificationsLoading(false);
    }
  }, []);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void fetchNotifications();
    }, 0);

    const intervalId = window.setInterval(() => {
      void fetchNotifications();
    }, 60000);

    return () => {
      window.clearTimeout(timeoutId);
      window.clearInterval(intervalId);
    };
  }, [fetchNotifications]);

  const markNotificationAsRead = useCallback(async (notificationId: number) => {
    try {
      const res = await fetch(`${API_BASE}/admin/notifications/${notificationId}/read`, {
        method: "PUT",
        headers: getAuthHeaders(),
      });
      if (!res.ok) throw new Error(`Server error: ${res.status}`);
      setNotifications(prev => prev.map(notification => (
        notification.id === notificationId ? { ...notification, is_read: true } : notification
      )));
    } catch (err: unknown) {
      console.error("Could not mark notification as read:", err);
    }
  }, []);

  const handleToggleNotifications = async () => {
    const shouldOpen = !notificationsExpanded;
    setNotificationsExpanded(shouldOpen);

    if (shouldOpen) {
      const unreadNotifications = notifications.filter(notification => !notification.is_read);
      if (unreadNotifications.length > 0) {
        await Promise.allSettled(unreadNotifications.map(notification => markNotificationAsRead(notification.id)));
      }
    }
  };

  const handleMarkAllRead = async () => {
    const unreadNotifications = notifications.filter(notification => !notification.is_read);
    if (unreadNotifications.length === 0) return;

    await Promise.allSettled(unreadNotifications.map(notification => markNotificationAsRead(notification.id)));
  };

  const unreadNotificationCount = notifications.filter(notification => !notification.is_read).length;

  const openCheckoutModal = async (item: Item) => {
    setCheckoutOpen(true);
    setCheckoutItem(item);
    setCheckoutError(null);
    setBorrowerId(null);
    setDueDate("");
    try {
      const res = await fetch(`${API_BASE}/borrowers`);
      if (!res.ok) throw new Error(`Server error: ${res.status}`);
      setBorrowers(Array.isArray(await res.json()) ? await res.json() : []);
    } catch (err: unknown) {
      setCheckoutError(err instanceof Error ? err.message : "Could not load borrowers");
    }
  };

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!checkoutItem || !borrowerId || !dueDate) {
      setCheckoutError("Please select a borrower and a return date.");
      return;
    }

    setCheckingOut(true);
    setCheckoutError(null);
    try {
      const loanRes = await fetch(`${API_BASE}/loans`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ item_id: checkoutItem.id, borrower_id: borrowerId, expected_return_at: `${dueDate}T00:00:00Z` }),
      });
      if (!loanRes.ok) {
        const payload = await loanRes.json().catch(() => null);
        throw new Error(payload?.error || `Server error: ${loanRes.status}`);
      }

      setItems(prev => prev.map(item => item.id === checkoutItem.id ? { ...item, status: "loaned" } : item));
      setCheckoutOpen(false);
      setCheckoutItem(null);
      setLoanRefreshKey(prev => prev + 1);
      setBorrowerId(null);
      setDueDate("");
    } catch (err: unknown) {
      setCheckoutError(err instanceof Error ? err.message : "Checkout failed");
    } finally {
      setCheckingOut(false);
    }
  };

  const handleDeleteItem = async (item: Item) => {
    const confirmDelete = window.confirm(`Delete "${item.name}"?`);
    if (!confirmDelete) return;

    try {
      const res = await fetch(`${API_BASE}/items/${item.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error(`Server error: ${res.status}`);
      setItems(prev => prev.filter(existing => existing.id !== item.id));
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to delete item");
    }
  };

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#000000", fontFamily: "Times New Roman, serif" }}>

      {/* ── Sidebar ── */}
      <aside style={{ width: "220px", minHeight: "100vh", background: "#1c1c1c", borderRight: "1px solid rgba(245,166,35,0.2)", display: "flex", flexDirection: "column", position: "fixed", top: 0, left: 0, bottom: 0 }}>
        <div style={{ padding: "28px 24px 24px", borderBottom: "1px solid rgba(245,166,35,0.15)" }}>
          <span style={{ fontSize: "20px", fontWeight: 700, color: "#F5A623", letterSpacing: "0.08em" }}>⚙ GEAR TRACK</span>
        </div>
        <nav style={{ flex: 1, padding: "20px 12px", display: "flex", flexDirection: "column", gap: "4px" }}>
          {NAV_ITEMS.map(nav => (
            <button
              key={nav.key} onClick={() => setActiveNav(nav.key)}
              style={{ display: "flex", alignItems: "center", gap: "12px", padding: "12px 16px", borderRadius: "10px", background: activeNav === nav.key ? "rgba(245,166,35,0.15)" : "transparent", border: activeNav === nav.key ? "1px solid rgba(245,166,35,0.35)" : "1px solid transparent", color: activeNav === nav.key ? "#F5A623" : "rgba(255,255,255,0.55)", fontSize: "14px", fontWeight: activeNav === nav.key ? 700 : 400, cursor: "pointer", textAlign: "left", fontFamily: "Times New Roman, serif", letterSpacing: "0.03em", transition: "all 0.15s ease" }}
            >
              <span>{nav.icon}</span>{nav.label}
            </button>
          ))}
        </nav>
        <NotificationSidebarSection
          notifications={notifications}
          loading={notificationsLoading}
          error={notificationsError}
          expanded={notificationsExpanded}
          unreadCount={unreadNotificationCount}
          onToggle={handleToggleNotifications}
          onMarkAllRead={handleMarkAllRead}
        />
        <div style={{ padding: "16px 12px", borderTop: "1px solid rgba(245,166,35,0.15)" }}>
          <button
            onClick={() => { localStorage.removeItem("token"); router.push("/login"); }}
            style={{ display: "flex", alignItems: "center", gap: "12px", width: "100%", padding: "12px 16px", borderRadius: "10px", background: "transparent", border: "1px solid rgba(239,68,68,0.3)", color: "rgba(239,68,68,0.7)", fontSize: "14px", cursor: "pointer", fontFamily: "Times New Roman, serif", letterSpacing: "0.03em", transition: "all 0.15s ease" }}
            onMouseEnter={e => { e.currentTarget.style.background = "rgba(239,68,68,0.1)"; e.currentTarget.style.color = "#f87171"; }}
            onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "rgba(239,68,68,0.7)"; }}
          >
            <span>🚪</span> Logout
          </button>
        </div>
      </aside>

      {checkoutOpen && checkoutItem && (
        <div onClick={() => setCheckoutOpen(false)} style={{ position: "fixed", inset: 0, zIndex: 100, background: "rgba(0,0,0,0.80)", display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(4px)" }}>
          <div onClick={(e) => e.stopPropagation()} style={{ width: "480px", maxWidth: "92vw", borderRadius: "18px", border: "1.5px solid rgba(245,166,35,0.45)", background: "#111111", boxShadow: "0 24px 80px rgba(0,0,0,0.8)", padding: "28px 30px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
              <h2 style={{ margin: 0, fontSize: "20px", fontWeight: 700, color: "#ffffff" }}>Check Out</h2>
              <button onClick={() => setCheckoutOpen(false)} style={{ background: "none", border: "none", color: "rgba(255,255,255,0.4)", fontSize: "22px", cursor: "pointer" }}>✕</button>
            </div>
            <p style={{ margin: "0 0 20px", color: "rgba(255,255,255,0.6)", fontSize: "14px" }}>Checking out <span style={{ color: "#F5A623", fontWeight: 700 }}>{checkoutItem.name}</span></p>
            <form onSubmit={handleCheckout} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div>
                <label style={labelStyle}>Borrower *</label>
                <select value={borrowerId ?? ""} onChange={(e) => setBorrowerId(e.target.value ? Number(e.target.value) : null)} style={{ ...inputStyle, appearance: "none", WebkitAppearance: "none", MozAppearance: "none" }}>
                  <option value="">Select a borrower</option>
                  {borrowers.map((borrower) => <option key={borrower.id} value={borrower.id}>{borrower.name}</option>)}
                </select>
              </div>
              <div>
                <label style={labelStyle}>Return Date *</label>
                <input type="date" required value={dueDate} onChange={(e) => setDueDate(e.target.value)} style={inputStyle} />
              </div>
              {checkoutError && <p style={{ margin: 0, fontSize: "13px", color: "#f87171" }}>{checkoutError}</p>}
              <div style={{ display: "flex", gap: "12px", marginTop: "8px" }}>
                <button type="button" onClick={() => setCheckoutOpen(false)} style={{ flex: 1, padding: "12px", borderRadius: "8px", background: "transparent", border: "1.5px solid rgba(255,255,255,0.15)", color: "rgba(255,255,255,0.6)", fontWeight: 600, fontSize: "14px", cursor: "pointer", fontFamily: "Times New Roman, serif" }}>Cancel</button>
                <button type="submit" disabled={checkingOut} style={{ flex: 1, padding: "12px", borderRadius: "8px", background: "#F5A623", border: "none", color: "#000", fontWeight: 700, fontSize: "14px", cursor: checkingOut ? "not-allowed" : "pointer", opacity: checkingOut ? 0.7 : 1, fontFamily: "Times New Roman, serif" }}>{checkingOut ? "Checking out..." : "Check Out"}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Main ── */}
      <main style={{ marginLeft: "220px", flex: 1, padding: "36px 40px", minHeight: "100vh" }}>

        {/* INVENTORY */}
        {activeNav === "inventory" && (
          <>
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
                  <input type="text" placeholder="Search items..." value={search} onChange={e => setSearch(e.target.value)} style={{ padding: "10px 16px 10px 40px", borderRadius: "10px", border: "1.5px solid rgba(245,166,35,0.35)", background: "rgba(255,255,255,0.04)", color: "#ffffff", fontSize: "14px", outline: "none", width: "220px", fontFamily: "Times New Roman, serif" }} />
                </div>
                <button onClick={() => setShowAdd(true)} style={{ padding: "10px 22px", borderRadius: "10px", background: "#F5A623", border: "none", color: "#000", fontWeight: 700, fontSize: "14px", cursor: "pointer", fontFamily: "Times New Roman, serif", letterSpacing: "0.04em", whiteSpace: "nowrap" }}>
                  + Add Item
                </button>
              </div>
            </div>

            <div style={{ height: "1px", background: "linear-gradient(to right, rgba(245,166,35,0.6), transparent)", marginBottom: "32px" }} />

            {loading  && <div style={{ textAlign: "center", padding: "80px 0", color: "rgba(255,255,255,0.4)", fontSize: "16px" }}>Loading inventory...</div>}
            {error    && (
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
                {filtered.map(item => (
                  <ItemCard
                    key={item.id}
                    item={item}
                    onClick={() => router.push(`/admin/dashboard/item/${item.id}`)}
                    onCheckout={() => openCheckoutModal(item)}
                    onEdit={() => router.push(`/admin/dashboard/item/${item.id}`)}
                    onDelete={() => handleDeleteItem(item)}
                  />
                ))}
              </div>
            )}
          </>
        )}

        {activeNav === "loans"    && <LoansSection refreshTrigger={loanRefreshKey} />}
        {activeNav === "borrow"   && <BorrowerListSection />}
        {activeNav === "register" && <RegisterSection onRegistered={() => setActiveNav("borrow")} />}
      </main>

      {showAddItem && <AddItemModal onClose={() => setShowAdd(false)} onAdded={item => setItems(p => [item, ...p])} />}
    </div>
  );
}