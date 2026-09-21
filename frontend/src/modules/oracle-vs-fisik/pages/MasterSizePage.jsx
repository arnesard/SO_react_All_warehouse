import { useEffect, useMemo, useState } from "react";
import { Search, Plus, Pencil, Trash2, Ruler, Loader2 } from "lucide-react";
import SectionCard from "../../../components/SectionCard";
import DataTable from "../../../components/DataTable";
import Modal from "../../../components/Modal";
import { api } from "../../../lib/api";

const EMPTY_FORM = {
  warehouse: "",
  item: "",
  description: "",
  grade: "",
  product: "",
  type: "",
  brand: "",
  category: "",
};

function MasterSizePage() {
  const [query, setQuery] = useState("");
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  async function loadData() {
    setLoading(true);
    setError("");
    try {
      const res = await api.get("/api/master-size/data");
      setRows(res.master_data || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  const filteredRows = useMemo(() => {
    const q = query.toLowerCase();
    return rows.filter(
      (r) =>
        (r.item || "").toLowerCase().includes(q) ||
        (r.description || "").toLowerCase().includes(q),
    );
  }, [rows, query]);

  function openAdd() {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setFormError("");
    setModalOpen(true);
  }

  function openEdit(row) {
    setEditingId(row.id);
    setForm({
      warehouse: row.warehouse || "",
      item: row.item || "",
      description: row.description || "",
      grade: row.grade || "",
      product: row.product || "",
      type: row.type || "",
      brand: row.brand || "",
      category: row.category || "",
    });
    setFormError("");
    setModalOpen(true);
  }

  async function handleDelete(row) {
    if (!confirm(`Hapus master size "${row.item}"?`)) return;
    try {
      await api.del(`/api/master-size/delete/${row.id}`);
      setRows((prev) => prev.filter((r) => r.id !== row.id));
    } catch (err) {
      alert(err.message);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.item.trim()) {
      setFormError("Item wajib diisi.");
      return;
    }
    setSaving(true);
    setFormError("");
    try {
      if (editingId) {
        await api.post(`/api/master-size/update/${editingId}`, form);
      } else {
        await api.post("/api/master-size/store", form);
      }
      setModalOpen(false);
      await loadData();
    } catch (err) {
      setFormError(err.message);
    } finally {
      setSaving(false);
    }
  }

  const columns = [
    { key: "no", label: "No.", render: (_, i) => i + 1 },
    { key: "warehouse", label: "Warehouse" },
    { key: "item", label: "Item", render: (r) => <span className="cell-code">{r.item}</span> },
    { key: "description", label: "Description", render: (r) => <span className="cell-strong">{r.description}</span> },
    { key: "grade", label: "Grade" },
    { key: "product", label: "Product" },
    { key: "type", label: "Type" },
    { key: "brand", label: "Brand" },
    { key: "category", label: "Category" },
    { key: "pattern", label: "Pattern" },
    {
      key: "action",
      label: "Action",
      render: (row) => (
        <div style={{ display: "flex", gap: 6 }}>
          <button className="btn-ctrl" style={{ padding: "5px 8px" }} onClick={() => openEdit(row)}>
            <Pencil size={13} />
          </button>
          <button
            className="btn-ctrl"
            style={{ padding: "5px 8px", color: "var(--danger)" }}
            onClick={() => handleDelete(row)}
          >
            <Trash2 size={13} />
          </button>
        </div>
      ),
    },
  ];

  return (
    <>
      <SectionCard
        icon={Ruler}
        title={`Master Size (${filteredRows.length} item)`}
        actions={
          <>
            <div className="search-box">
              <Search size={14} />
              <input
                className="field-input"
                placeholder="Cari item / deskripsi..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>
            <button className="btn-ctrl primary" onClick={openAdd}>
              <Plus size={14} /> Tambah Master Size
            </button>
          </>
        }
      >
        {error && <div className="form-error" style={{ marginBottom: 12 }}>{error}</div>}
        {loading ? (
          <div style={{ display: "flex", alignItems: "center", gap: 8, padding: 24, opacity: 0.7 }}>
            <Loader2 size={16} className="spin" /> Memuat data...
          </div>
        ) : (
          <DataTable columns={columns} rows={filteredRows} />
        )}
      </SectionCard>

      {modalOpen && (
        <Modal
          title={editingId ? "Edit Master Size" : "Tambah Master Size"}
          onClose={() => setModalOpen(false)}
          footer={
            <>
              <button className="btn-ctrl" type="button" onClick={() => setModalOpen(false)}>
                Batal
              </button>
              <button className="btn-ctrl primary" type="submit" form="master-size-form" disabled={saving}>
                {saving ? "Menyimpan..." : "Simpan"}
              </button>
            </>
          }
        >
          <form id="master-size-form" className="form-grid" onSubmit={handleSubmit}>
            <div className="field-group">
              <label>Warehouse</label>
              <input
                className="field-input"
                value={form.warehouse}
                onChange={(e) => setForm({ ...form, warehouse: e.target.value })}
              />
            </div>
            <div className="field-group">
              <label>Item</label>
              <input
                className="field-input"
                value={form.item}
                onChange={(e) => setForm({ ...form, item: e.target.value })}
              />
            </div>
            <div className="field-group field-full">
              <label>Description</label>
              <input
                className="field-input"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
            </div>
            <div className="field-group">
              <label>Grade</label>
              <input
                className="field-input"
                value={form.grade}
                onChange={(e) => setForm({ ...form, grade: e.target.value })}
              />
            </div>
            <div className="field-group">
              <label>Product</label>
              <input
                className="field-input"
                value={form.product}
                onChange={(e) => setForm({ ...form, product: e.target.value })}
              />
            </div>
            <div className="field-group">
              <label>Type</label>
              <input
                className="field-input"
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value })}
              />
            </div>
            <div className="field-group">
              <label>Brand</label>
              <input
                className="field-input"
                value={form.brand}
                onChange={(e) => setForm({ ...form, brand: e.target.value })}
              />
            </div>
            <div className="field-group field-full">
              <label>Category</label>
              <input
                className="field-input"
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
              />
            </div>
          </form>
          {formError && <div className="form-error">{formError}</div>}
        </Modal>
      )}
    </>
  );
}

export default MasterSizePage;
