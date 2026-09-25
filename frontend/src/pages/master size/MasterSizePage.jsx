import { useEffect, useMemo, useState } from "react";
import { swal } from "../../lib/swal";
import {
  Search,
  Plus,
  Pencil,
  Trash2,
  Ruler,
  Loader2,
  Warehouse,
} from "lucide-react";
import SectionCard from "../../components/SectionCard";
import DataTable from "../../components/DataTable";
import Modal from "../../components/Modal";
import { api } from "../../lib/api";

const WAREHOUSE_OPTIONS = ["APW", "BPW", "DPW", "RPW", "JMW", "DCK"];
const PRODUCT_OPTIONS = ["TIRE", "TUBE", "VALVE", "RIMBAND"];
const TYPE_OPTIONS = ["TUBELESS", "TUBETYPE", "-"];
const BRAND_OPTIONS = ["IRC", "GT", "ZENEOS", "-"];
const CATEGORY_OPTIONS = ["REGULER", "SPAREPART", "IMPORT", "EXPORT", "-"];

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

// Sama persis kayak window.calculateAutoGrade di Laravel: dilihat dari 2 karakter
// terakhir kode item. "-0" => OE, "-1" => OK, selain itu => "-".
function calculateAutoGrade(itemCode) {
  const trimmed = (itemCode || "").trim();
  if (trimmed.length < 2) return "";
  const lastTwo = trimmed.slice(-2);
  if (lastTwo === "-0") return "OE";
  if (lastTwo === "-1") return "OK";
  return "-";
}

function gradeBadgeClass(grade) {
  if (grade === "OE") return "badge-pill ok";
  if (grade === "OK") return "badge-pill info";
  return "badge-pill neutral";
}

function MasterSizePage() {
  const [rows, setRows] = useState([]);
  const [filterWhOptions, setFilterWhOptions] = useState([]);
  const [filterGradeOptions, setFilterGradeOptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Sama kayak Laravel: harus pilih Warehouse dulu sebelum tabel nongol
  const [selectedWh, setSelectedWh] = useState("");
  const [selectedGrade, setSelectedGrade] = useState("");
  const [query, setQuery] = useState("");

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
      setFilterWhOptions(res.filter_wh || []);
      setFilterGradeOptions(res.filter_grade || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  // Filter warehouse -> grade -> teks pencarian, persis alur filterMasterSizeTable di Laravel
  const filteredRows = useMemo(() => {
    if (!selectedWh) return [];
    const g = selectedGrade.toLowerCase();
    const q = query.toLowerCase();

    return rows.filter((r) => {
      if ((r.warehouse || "").toLowerCase() !== selectedWh.toLowerCase())
        return false;
      if (g && (r.grade || "").toLowerCase() !== g) return false;
      if (q && !Object.values(r).join(" ").toLowerCase().includes(q))
        return false;
      return true;
    });
  }, [rows, selectedWh, selectedGrade, query]);

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

  function handleItemChange(value) {
    setForm((prev) => ({
      ...prev,
      item: value,
      grade: calculateAutoGrade(value),
    }));
  }

  async function handleDelete(row) {
    const result = await swal.fire({
      title: "Yakin mau hapus ?",
      text: "Data master size ini bakal hilang permanen dari database!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Ya, Hapus!",
      cancelButtonText: "Batal",
      customClass: {
        popup: "swal-theme-popup",
        confirmButton: "btn-ctrl danger",
        cancelButton: "btn-ctrl",
      },
    });
    if (!result.isConfirmed) return;

    try {
      await api.del(`/api/master-size/delete/${row.id}`);
      swal.fire({
        icon: "success",
        title: "Terhapus!",
        text: "Data Master Size berhasil dihapus!",
        timer: 1200,
        showConfirmButton: false,
      });
      setRows((prev) => prev.filter((r) => r.id !== row.id));
    } catch (err) {
      swal.fire({
        icon: "error",
        title: "Gagal Hapus!",
        text: err.message || "Data gagal dihapus dari database bro.",
      });
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();

    if (
      !form.warehouse ||
      !form.item.trim() ||
      !form.grade ||
      !form.description.trim()
    ) {
      swal.fire({
        // <- Swal.fire jadi swal.fire
        icon: "warning",
        title: "Data Kurang Lengkap",
        text: "Kolom Warehouse, Item Code, Grade, dan Description wajib diisi bro!",
      });
      return;
    }

    setSaving(true);
    setFormError("");

    const payload = {
      ...form,
      item: form.item.toUpperCase(),
      description: form.description.toUpperCase(),
      product: (form.product || "").toUpperCase(),
      type: (form.type || "").toUpperCase(),
      brand: (form.brand || "").toUpperCase(),
      category: (form.category || "").toUpperCase(),
    };

    swal.fire({
      // <- Swal.fire jadi swal.fire
      title: "Menyimpan Data...",
      text: "Harap tunggu sejenak bro.",
      allowOutsideClick: false,
      didOpen: () => swal.showLoading(), // <- Swal.showLoading jadi swal.showLoading
    });

    try {
      if (editingId) {
        await api.post(`/api/master-size/update/${editingId}`, payload);
      } else {
        await api.post("/api/master-size/store", payload);
      }
      swal.fire({
        // <- Swal.fire jadi swal.fire
        icon: "success",
        title: "Berhasil",
        text: editingId
          ? "Data Master Size berhasil diupdate!"
          : "Data Master Size berhasil disimpan!",
        timer: 1500,
        showConfirmButton: false,
      });
      setModalOpen(false);
      await loadData();
    } catch (err) {
      swal.fire({
        // <- Swal.fire jadi swal.fire
        icon: "error",
        title: "Gagal Simpan!",
        text: err.message || "Gagal memproses data ke database bro.",
      });
      setFormError(err.message);
    } finally {
      setSaving(false);
    }
  }

  const columns = [
    { key: "no", label: "No.", width: "50px", render: (_, i) => i + 1 },
    { key: "warehouse", label: "Warehouse", width: "90px" },
    {
      key: "item",
      label: "Item",
      width: "130px",
      render: (r) => <span className="cell-code">{r.item}</span>,
    },
    {
      key: "description",
      label: "Description",
      render: (r) => <span className="cell-strong">{r.description}</span>,
    },
    {
      key: "grade",
      label: "Grade",
      width: "70px",
      render: (r) => (
        <span className={gradeBadgeClass(r.grade)}>{r.grade}</span>
      ),
    },
    { key: "product", label: "Product", width: "90px" },
    { key: "type", label: "Type", width: "100px" },
    { key: "brand", label: "Brand", width: "90px" },
    { key: "category", label: "Category", width: "110px" },
    { key: "pattern", label: "Pattern", render: (r) => r.pattern || "-" },
    {
      key: "action",
      label: "Action",
      width: "90px",
      render: (row) => (
        <div style={{ display: "flex", gap: 6, justifyContent: "center" }}>
          <button
            className="btn-icon-action edit"
            onClick={() => openEdit(row)}
          >
            <Pencil size={13} />
          </button>
          <button
            className="btn-icon-action delete"
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
        title={`Master Size ${selectedWh ? `(${filteredRows.length} item)` : ""}`}
      >
        <div className="filter-bar">
          <select
            className="field-select"
            value={selectedWh}
            onChange={(e) => setSelectedWh(e.target.value)}
          >
            <option value="">PILIH GUDANG</option>
            {filterWhOptions.map((wh) => (
              <option key={wh} value={wh}>
                {wh}
              </option>
            ))}
          </select>

          <select
            className="field-select"
            value={selectedGrade}
            onChange={(e) => setSelectedGrade(e.target.value)}
          >
            <option value="">ALL GRADE</option>
            {filterGradeOptions.map((g) => (
              <option key={g} value={g}>
                {g}
              </option>
            ))}
          </select>

          <div className="search-box">
            <Search size={14} />
            <input
              className="field-input"
              placeholder="Cari item / deskripsi..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>

          <button
            className="btn-ctrl primary"
            style={{ marginLeft: "auto" }}
            onClick={openAdd}
          >
            <Plus size={14} /> Tambah Item
          </button>
        </div>

        {error && (
          <div className="form-error" style={{ marginBottom: 12 }}>
            {error}
          </div>
        )}

        {loading ? (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: 24,
              opacity: 0.7,
            }}
          >
            <Loader2 size={16} className="spin" /> Memuat data...
          </div>
        ) : !selectedWh ? (
          <div className="table-empty">
            <div style={{ marginBottom: 8 }}>
              <Warehouse size={28} style={{ opacity: 0.6 }} />
            </div>
            <div style={{ fontWeight: 700, marginBottom: 4 }}>
              Silakan Pilih Warehouse Terlebih Dahulu
            </div>
            <div style={{ fontSize: 12.5 }}>
              Pilih salah satu lokasi gudang di atas untuk memunculkan tabel
              data master size.
            </div>
          </div>
        ) : (
          <DataTable
            columns={columns}
            rows={filteredRows}
            emptyText={`Belum ada rekaman master size di gudang ${selectedWh.toUpperCase()} bro.`}
          />
        )}
      </SectionCard>

      {modalOpen && (
        <Modal
          title={editingId ? "Edit Master Size" : "Tambah Master Size"}
          onClose={() => setModalOpen(false)}
          footer={
            <>
              <button
                className="btn-ctrl"
                type="button"
                onClick={() => setModalOpen(false)}
              >
                Batal
              </button>
              <button
                className="btn-ctrl primary"
                type="submit"
                form="master-size-form"
                disabled={saving}
              >
                {saving ? "Menyimpan..." : "Simpan Data"}
              </button>
            </>
          }
        >
          <form
            id="master-size-form"
            className="form-grid"
            onSubmit={handleSubmit}
          >
            <div className="field-group">
              <label>Warehouse</label>
              <select
                className="field-select"
                required
                value={form.warehouse}
                onChange={(e) =>
                  setForm({ ...form, warehouse: e.target.value })
                }
              >
                <option value="" disabled>
                  Pilih WH...
                </option>
                {WAREHOUSE_OPTIONS.map((wh) => (
                  <option key={wh} value={wh}>
                    {wh}
                  </option>
                ))}
              </select>
            </div>

            <div className="field-group">
              <label>Item Code</label>
              <input
                className="field-input"
                required
                placeholder="CONTOH: PXF2514-0"
                value={form.item}
                onChange={(e) => handleItemChange(e.target.value)}
                style={{ textTransform: "uppercase" }}
              />
            </div>

            <div className="field-group">
              <label>Grade</label>
              <input
                className="field-input"
                readOnly
                required
                placeholder="Otomatis terisi..."
                value={form.grade}
                style={{ textAlign: "center", fontWeight: 700, opacity: 0.85 }}
              />
            </div>

            <div className="field-group field-full">
              <label>Description</label>
              <input
                className="field-input"
                required
                placeholder="MASUKKAN DESKRIPSI BARANG..."
                value={form.description}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
                style={{ textTransform: "uppercase" }}
              />
            </div>

            <div className="field-group">
              <label>Product</label>
              <input
                className="field-input"
                list="list-product"
                placeholder="PILIH / KETIK..."
                value={form.product}
                onChange={(e) => setForm({ ...form, product: e.target.value })}
                style={{ textTransform: "uppercase" }}
              />
            </div>

            <div className="field-group">
              <label>Type</label>
              <input
                className="field-input"
                list="list-type"
                placeholder="PILIH / KETIK..."
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value })}
                style={{ textTransform: "uppercase" }}
              />
            </div>

            <div className="field-group">
              <label>Brand</label>
              <input
                className="field-input"
                list="list-brand"
                placeholder="PILIH / KETIK..."
                value={form.brand}
                onChange={(e) => setForm({ ...form, brand: e.target.value })}
                style={{ textTransform: "uppercase" }}
              />
            </div>

            <div className="field-group">
              <label>Category</label>
              <input
                className="field-input"
                list="list-category"
                placeholder="PILIH / KETIK..."
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                style={{ textTransform: "uppercase" }}
              />
            </div>
          </form>

          {formError && <div className="form-error">{formError}</div>}

          <datalist id="list-product">
            {PRODUCT_OPTIONS.map((v) => (
              <option key={v} value={v} />
            ))}
          </datalist>
          <datalist id="list-type">
            {TYPE_OPTIONS.map((v) => (
              <option key={v} value={v} />
            ))}
          </datalist>
          <datalist id="list-brand">
            {BRAND_OPTIONS.map((v) => (
              <option key={v} value={v} />
            ))}
          </datalist>
          <datalist id="list-category">
            {CATEGORY_OPTIONS.map((v) => (
              <option key={v} value={v} />
            ))}
          </datalist>
        </Modal>
      )}
    </>
  );
}

export default MasterSizePage;
