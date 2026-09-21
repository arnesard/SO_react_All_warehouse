import { Link } from "react-router-dom";
import {
  Database,
  Barcode,
  Boxes,
  ShieldCheck,
  ArrowRight,
  GitCompareArrows,
  Gauge,
  History,
} from "lucide-react";
import PageHeader from "../../components/PageHeader";
import StatCard from "../../components/StatCard";
import SectionCard from "../../components/SectionCard";

function FlowNode({ icon: Icon, tone }) {
  return (
    <div
      className="stat-card-icon"
      style={{
        width: 64,
        height: 64,
        borderRadius: 16,
        "--tone": `var(--${tone})`,
        "--tone-soft": `var(--${tone}-soft)`,
      }}
    >
      <Icon size={26} />
    </div>
  );
}

function DashboardPage() {
  return (
    <div>
      <PageHeader
        eyebrow="STOCK ACCURACY CONTROL CENTER"
        title="Ringkasan Akurasi Stok Ban Motor"
        description="Pantau kesesuaian data antara sistem Oracle, hasil scan barcode, dan kondisi fisik aktual di gudang."
      />

      <div className="stat-grid">
        <StatCard icon={Gauge} label="Akurasi Keseluruhan" value="97.8%" sub="+0.6% dari SO minggu lalu" subDirection="up" tone="ok" />
        <StatCard icon={Database} label="SKU Termonitor" value="1.248" sub="Data Oracle aktif hari ini" tone="accent" />
        <StatCard icon={Barcode} label="Selisih Oracle vs Barcode" value="14 SKU" sub="Perlu verifikasi ulang" subDirection="down" tone="warn" />
        <StatCard icon={Boxes} label="Selisih Oracle vs Fisik" value="9 SKU" sub="Menunggu tag stock" tone="danger" />
      </div>

      <div className="hero-wrap">
        <p className="hero-eyebrow">ALUR VALIDASI</p>
        <h2 className="hero-title">Tiga sumber data, satu titik kebenaran stok.</h2>
        <p className="hero-desc" style={{ marginBottom: 26 }}>
          Data Oracle disandingkan dengan hasil scan barcode dan hitung fisik di rak,
          supaya selisih ketahuan lebih awal sebelum jadi masalah saat stock opname.
        </p>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 18, flexWrap: "wrap" }}>
          <div style={{ textAlign: "center" }}>
            <FlowNode icon={Database} tone="accent" />
            <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-secondary)", marginTop: 8 }}>ORACLE</div>
          </div>
          <ArrowRight size={18} color="var(--text-muted)" />
          <div style={{ textAlign: "center" }}>
            <FlowNode icon={Barcode} tone="cyan" />
            <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-secondary)", marginTop: 8 }}>BARCODE</div>
          </div>
          <ArrowRight size={18} color="var(--text-muted)" />
          <div style={{ textAlign: "center" }}>
            <FlowNode icon={Boxes} tone="warn" />
            <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-secondary)", marginTop: 8 }}>FISIK</div>
          </div>
          <ArrowRight size={18} color="var(--text-muted)" />
          <div style={{ textAlign: "center" }}>
            <FlowNode icon={ShieldCheck} tone="ok" />
            <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-secondary)", marginTop: 8 }}>ACCURACY</div>
          </div>
        </div>
      </div>

      <div className="module-grid">
        <div className="module-card" style={{ "--tone": "var(--accent)", "--tone-soft": "var(--accent-soft)", "--tone-border": "var(--accent-border)" }}>
          <div className="module-card-icon">
            <GitCompareArrows size={20} />
          </div>
          <div>
            <div className="module-card-title">Stock Oracle vs Barcode</div>
            <div className="module-card-desc">
              Validasi keselarasan data stok antara Oracle dengan hasil aktual scanning barcode per tanggal transaksi.
            </div>
          </div>
          <Link to="/oracle-vs-barcode" className="module-card-link">
            Akses Modul <ArrowRight size={14} />
          </Link>
        </div>

        <div className="module-card" style={{ "--tone": "var(--warn)", "--tone-soft": "var(--warn-soft)", "--tone-border": "rgba(245,166,35,0.35)" }}>
          <div className="module-card-icon">
            <Boxes size={20} />
          </div>
          <div>
            <div className="module-card-title">Stock Oracle vs Aktual Fisik</div>
            <div className="module-card-desc">
              Analisa selisih data Oracle terhadap jumlah stok fisik di rak: master size, tag stock, APPKSO, hingga progres SO.
            </div>
          </div>
          <Link to="/oracle-vs-fisik/dashboard" className="module-card-link">
            Akses Modul <ArrowRight size={14} />
          </Link>
        </div>
      </div>

      <div style={{ marginTop: 18 }}>
        <SectionCard icon={History} title="Riwayat Tanggal Transaksi Aktif">
          <p style={{ fontSize: 12.5, color: "var(--text-muted)", margin: 0 }}>
            Kalender & histori tanggal transaksi Oracle / Barcode akan tampil di sini setelah modul disambungkan ke data —
            tampilan ini masih tahap frontend.
          </p>
        </SectionCard>
      </div>
    </div>
  );
}

export default DashboardPage;
