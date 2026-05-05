import React, { useState, useEffect, useCallback } from 'react';
import { 
  Users, Calendar, DollarSign, 
  CheckCircle, XCircle, Clock, RefreshCcw 
} from 'lucide-react';
import { getAllWarga, getTransaksiByTanggal, deleteTransaksiHariIni } from '../database/db';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';

const Dashboard = () => {
  const [stats, setStats] = useState({
    totalWarga: 0,
    sudahBayar: 0,
    belumBayar: 0,
    totalHariIni: 0
  });
  const [todayTransaksi, setTodayTransaksi] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadDashboardData = useCallback(async () => {
    try {
      const warga = await getAllWarga();
      const today = new Date().toISOString().split('T')[0];
      const transaksi = await getTransaksiByTanggal(today);

      const sudahBayar = transaksi.filter(t => t.status === 'lunas').length;
      
      setStats({
        totalWarga: warga.length,
        sudahBayar: sudahBayar,
        belumBayar: warga.length - sudahBayar,
        totalHariIni: transaksi.filter(t => t.status === 'lunas').reduce((sum, t) => sum + (t.jumlah || 0), 0)
      });

      // Enrich transactions with correct noRumah from warga table
      const enrichedTransaksi = transaksi.map(t => {
        const detailWarga = warga.find(w => w.id === t.wargaId);
        return {
          ...t,
          noRumah: detailWarga ? detailWarga.noRumah : t.wargaId
        };
      });

      setTodayTransaksi(enrichedTransaksi);
      setLoading(false);
    } catch (error) {
      console.error("Error loading dashboard data:", error);
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  const [showResetConfirm, setShowResetConfirm] = useState(false);

  const handleReset = async () => {
    setShowResetConfirm(true);
  };

  const confirmReset = async () => {
    setShowResetConfirm(false);
    setLoading(true);
    const today = new Date().toISOString().split('T')[0];
    try {
      await deleteTransaksiHariIni(today);
      await loadDashboardData();
    } catch (error) {
      console.error('Error reset data:', error);
      setLoading(false);
    }
  };

  if (loading) return <div className="loading">Memuat data...</div>;

  return (
    <div className="dashboard-container">
      {showResetConfirm && (
        <div className="modal-overlay" onClick={() => setShowResetConfirm(false)} style={{ zIndex: 1000 }}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header" style={{ borderBottom: 'none', paddingBottom: 0 }}>
              <h3 style={{ color: 'var(--danger)' }}>Peringatan Reset</h3>
            </div>
            <div style={{ marginBottom: '2rem', marginTop: '1rem', lineHeight: '1.5' }}>
              <p style={{ textAlign: 'center', fontSize: '1.1rem', margin: '0 0 1rem 0' }}>
                Apakah Anda yakin ingin menghapus <strong>SEMUA</strong> aktivitas hari ini?
              </p>
              <p style={{ textAlign: 'center', color: 'var(--text-light)', fontSize: '0.9rem', margin: 0 }}>
                Data *scan* dan *input manual* hari ini akan terhapus secara permanen dan tidak dapat dikembalikan.
              </p>
            </div>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <button onClick={() => setShowResetConfirm(false)} className="btn-secondary" style={{ flex: 1, padding: '0.75rem', margin: 0 }}>Batal</button>
              <button onClick={confirmReset} className="btn-submit-form" style={{ flex: 1, margin: 0, padding: '0.75rem', background: 'var(--danger)', boxShadow: 'none' }}>Ya, Reset Data</button>
            </div>
          </div>
        </div>
      )}
      <div className="dashboard-header">
        <h1>Dashboard</h1>
        <p className="date-today">
          <Calendar size={16} />
          {format(new Date(), 'EEEE, dd MMMM yyyy', { locale: id })}
        </p>
      </div>

      {/* Stats Cards */}
      <div className="stats-grid">
        <div className="stat-card stat-total">
          <div className="stat-icon">
            <Users size={24} />
          </div>
          <div className="stat-info">
            <h3>{stats.totalWarga}</h3>
            <p>Total Warga</p>
          </div>
        </div>

        <div className="stat-card stat-success">
          <div className="stat-icon">
            <CheckCircle size={24} />
          </div>
          <div className="stat-info">
            <h3>{stats.sudahBayar}</h3>
            <p>Sudah Bayar</p>
          </div>
        </div>

        <div className="stat-card stat-warning">
          <div className="stat-icon">
            <XCircle size={24} />
          </div>
          <div className="stat-info">
            <h3>{stats.belumBayar}</h3>
            <p>Belum/Kosong</p>
          </div>
        </div>

        <div className="stat-card stat-money">
          <div className="stat-icon">
            <DollarSign size={24} />
          </div>
          <div className="stat-info">
            <h3>Rp {stats.totalHariIni.toLocaleString()}</h3>
            <p>Total Hari Ini</p>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="progress-section">
        <div className="progress-header">
          <span>Progress Hari Ini</span>
          <span>{stats.totalWarga > 0 ? Math.round((stats.sudahBayar / stats.totalWarga) * 100) : 0}%</span>
        </div>
        <div className="progress-bar-bg">
          <div 
            className="progress-bar-fill" 
            style={{ width: `${stats.totalWarga > 0 ? (stats.sudahBayar / stats.totalWarga) * 100 : 0}%` }}
          ></div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="recent-section">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '0.5rem' }}>
          <h2 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Clock size={20} />
            Aktivitas Hari Ini
          </h2>
          <button onClick={handleReset} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', background: '#fed7d7', color: 'var(--danger)', border: 'none', borderRadius: 'var(--radius)', cursor: 'pointer', fontSize: '0.875rem', fontWeight: '600' }}>
            <RefreshCcw size={14} />
            Reset Hari Ini
          </button>
        </div>
        {todayTransaksi.length === 0 ? (
          <div className="empty-state">
            <p>Belum ada transaksi hari ini</p>
          </div>
        ) : (
          <div className="activity-list">
            {todayTransaksi.map((t, index) => (
              <div key={index} className={`activity-item ${t.status}`}>
                <div className="activity-icon">
                  {t.status === 'lunas' ? <CheckCircle size={18} /> : <XCircle size={18} />}
                </div>
                <div className="activity-info">
                  <h4>{t.namaWarga}</h4>
                  <p>{t.alamat || 'Rumah No. ' + t.noRumah}</p>
                </div>
                <div className="activity-amount">
                  {t.status === 'lunas' ? `Rp ${t.jumlah?.toLocaleString()}` : 'Kosong'}
                </div>
              </div>
            ))}
          </div>
        )}

        {todayTransaksi.length > 0 && (
          <div style={{ marginTop: '2rem', padding: '1.25rem', background: '#f8fafc', borderRadius: 'var(--radius)', border: '1px solid #e2e8f0' }}>
            <h4 style={{ margin: '0 0 1rem 0', color: 'var(--text-dark)', fontSize: '1rem', borderBottom: '2px solid #e2e8f0', paddingBottom: '0.5rem' }}>Ringkasan Hari Ini</h4>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, fontSize: '0.95rem', color: 'var(--text-color)', lineHeight: '1.6' }}>
              <li>
                <strong style={{ color: 'var(--success)' }}>Total Membayar (Lunas):</strong> {todayTransaksi.filter(t => t.status === 'lunas').length} Warga
              </li>
              <li>
                <strong style={{ color: 'var(--danger)' }}>Total Kosong:</strong> {todayTransaksi.filter(t => t.status === 'kosong').length} Warga
              </li>
              {todayTransaksi.filter(t => t.status === 'kosong').length > 0 && (
                <li style={{ marginTop: '0.75rem', paddingTop: '0.75rem', borderTop: '1px dashed #cbd5e1' }}>
                  <strong>Daftar Warga Kosong:</strong> 
                  <span style={{ color: 'var(--danger)', marginLeft: '0.25rem' }}>
                    {todayTransaksi.filter(t => t.status === 'kosong').map(t => t.namaWarga).join(', ')}
                  </span>
                </li>
              )}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;