import React, { useState, useEffect } from 'react';
import { 
  Download,
  ChevronLeft, ChevronRight, FileText, RefreshCcw
} from 'lucide-react';
import { getAllWarga, getTransaksiByBulan, getTransaksiByTanggal, deleteTransaksiHariIni, deleteTransaksiBulanIni } from '../database/db';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, subMonths, addMonths } from 'date-fns';
import { id } from 'date-fns/locale';

const Laporan = () => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [warga, setWarga] = useState([]);
  const [transaksi, setTransaksi] = useState([]);
  const [selectedDate, setSelectedDate] = useState(null);
  const [detailTransaksi, setDetailTransaksi] = useState([]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/exhaustive-deps
    loadData();
  }, [currentMonth]);

  const loadData = async () => {
    const wargaData = await getAllWarga();
    const bulan = format(currentMonth, 'yyyy-MM');
    const transaksiData = await getTransaksiByBulan(bulan);
    
    setWarga(wargaData);
    setTransaksi(transaksiData);
  };

  const getDaysInMonth = () => {
    const start = startOfMonth(currentMonth);
    const end = endOfMonth(currentMonth);
    return eachDayOfInterval({ start, end });
  };



  const getStats = (wargaId) => {
    let wargaTrans = transaksi.filter(t => t.wargaId === wargaId);
    let targetDays = getDaysInMonth().length;

    if (selectedDate) {
      const dateStr = format(selectedDate, 'yyyy-MM-dd');
      wargaTrans = wargaTrans.filter(t => t.tanggal === dateStr);
      targetDays = 1;
    }

    const lunas = wargaTrans.filter(t => t.status === 'lunas').length;
    const kosong = wargaTrans.filter(t => t.status === 'kosong').length;
    const totalBayar = wargaTrans
      .filter(t => t.status === 'lunas')
      .reduce((sum, t) => sum + (t.jumlah || 0), 0);
    
    return { lunas, kosong, totalBayar, targetDays };
  };

  const handleDateClick = async (date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    const detail = await getTransaksiByTanggal(dateStr);
    setDetailTransaksi(detail);
    setSelectedDate(date);
  };

  const exportToCSV = () => {
    const headers = ['Nama', 'Alamat', 'Total Lunas', 'Total Kosong', 'Total Bayar'];
    const rows = warga.map(w => {
      const stats = getStats(w.id);
      return [
        w.nama,
        w.alamat || '-',
        stats.lunas,
        stats.kosong,
        stats.totalBayar
      ];
    });

    const csv = [headers, ...rows]
      .map(row => row.join(','))
      .join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `laporan-jimpitan-${format(currentMonth, 'MMMM-yyyy', { locale: id })}.csv`;
    a.click();
  };

  const [resetConfig, setResetConfig] = useState(null); // { type: 'bulan' | 'tanggal' }

  const handleResetBulan = () => {
    setResetConfig({ type: 'bulan' });
  };

  const handleResetTanggal = () => {
    setResetConfig({ type: 'tanggal' });
  };

  const confirmReset = async () => {
    if (resetConfig.type === 'bulan') {
      const bulanStr = format(currentMonth, 'yyyy-MM');
      await deleteTransaksiBulanIni(bulanStr);
      loadData();
      if (selectedDate && format(selectedDate, 'yyyy-MM') === bulanStr) {
        setSelectedDate(null);
        setDetailTransaksi([]);
      }
    } else if (resetConfig.type === 'tanggal') {
      const dateStr = format(selectedDate, 'yyyy-MM-dd');
      await deleteTransaksiHariIni(dateStr);
      const detail = await getTransaksiByTanggal(dateStr);
      setDetailTransaksi(detail);
      loadData();
    }
    setResetConfig(null);
  };

  const days = getDaysInMonth();
  const monthTotal = warga.reduce((sum, w) => {
    const wargaTrans = transaksi.filter(t => t.wargaId === w.id && t.status === 'lunas');
    return sum + wargaTrans.reduce((s, t) => s + (t.jumlah || 0), 0);
  }, 0);

  return (
    <div className="laporan-container">
      {resetConfig && (
        <div className="modal-overlay" onClick={() => setResetConfig(null)} style={{ zIndex: 1000 }}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header" style={{ borderBottom: 'none', paddingBottom: 0 }}>
              <h3 style={{ color: 'var(--danger)' }}>Peringatan Reset</h3>
            </div>
            <div style={{ marginBottom: '2rem', marginTop: '1rem', lineHeight: '1.5' }}>
              <p style={{ textAlign: 'center', fontSize: '1.1rem', margin: '0 0 1rem 0' }}>
                Apakah Anda yakin ingin menghapus <strong>SEMUA</strong> aktivitas pada {resetConfig.type === 'bulan' ? `bulan ${format(currentMonth, 'MMMM yyyy', { locale: id })}` : `tanggal ${format(selectedDate, 'dd MMMM yyyy', { locale: id })}`}?
              </p>
              <p style={{ textAlign: 'center', color: 'var(--text-light)', fontSize: '0.9rem', margin: 0 }}>
                Data akan terhapus secara permanen dan tidak dapat dikembalikan.
              </p>
            </div>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <button onClick={() => setResetConfig(null)} className="btn-secondary" style={{ flex: 1, padding: '0.75rem', margin: 0 }}>Batal</button>
              <button onClick={confirmReset} className="btn-submit-form" style={{ flex: 1, margin: 0, padding: '0.75rem', background: 'var(--danger)', boxShadow: 'none' }}>Ya, Reset Data</button>
            </div>
          </div>
        </div>
      )}
      <div className="laporan-header">
        <h1>Laporan Bulanan</h1>
        <button onClick={exportToCSV} className="btn-export">
          <Download size={18} />
          Export CSV
        </button>
      </div>

      {/* Month Navigation */}
      <div className="month-nav">
        <button onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}>
          <ChevronLeft size={20} />
        </button>
        <h2>{format(currentMonth, 'MMMM yyyy', { locale: id })}</h2>
        <button onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}>
          <ChevronRight size={20} />
        </button>
      </div>

      {/* Summary Cards */}
      <div className="summary-cards">
        <div className="summary-card">
          <h3>Rp {monthTotal.toLocaleString()}</h3>
          <p>Total Terkumpul</p>
        </div>
        <div className="summary-card">
          <h3>{transaksi.filter(t => t.status === 'lunas').length}</h3>
          <p>Total Lunas</p>
        </div>
        <div className="summary-card warning">
          <h3>{transaksi.filter(t => t.status === 'kosong').length}</h3>
          <p>Total Kosong</p>
        </div>
      </div>

      {/* Calendar View */}
      <div className="calendar-section">
        <h3>Kalender Jimpitan</h3>
        <div className="calendar-grid">
          {['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'].map(d => (
            <div key={d} className="calendar-header">{d}</div>
          ))}
          {Array.from({ length: startOfMonth(currentMonth).getDay() }).map((_, i) => (
            <div key={`empty-${i}`} className="calendar-day empty" style={{ border: 'none', background: 'transparent', cursor: 'default' }}></div>
          ))}
          {days.map((day, index) => {
            const dayTrans = transaksi.filter(t => t.tanggal === format(day, 'yyyy-MM-dd'));
            const lunasCount = dayTrans.filter(t => t.status === 'lunas').length;
            const isToday = format(day, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd');
            
            return (
              <div 
                key={index} 
                className={`calendar-day ${isToday ? 'today' : ''} ${selectedDate && format(day, 'yyyy-MM-dd') === format(selectedDate, 'yyyy-MM-dd') ? 'selected' : ''}`}
                onClick={() => handleDateClick(day)}
              >
                <span className="day-number">{format(day, 'd')}</span>
                {lunasCount > 0 && (
                  <span className="day-badge success">{lunasCount}</span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Detail Table */}
      <div className="detail-section">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
          <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <FileText size={20} />
            Detail Per Warga {selectedDate ? `(${format(selectedDate, 'dd MMM yyyy', { locale: id })})` : `(Bulanan)`}
          </h3>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            {selectedDate && (
              <button onClick={() => { setSelectedDate(null); setDetailTransaksi([]); }} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', background: '#e0e7ff', color: 'var(--primary)', border: 'none', borderRadius: 'var(--radius)', cursor: 'pointer', fontSize: '0.875rem', fontWeight: '600' }}>
                Tampilkan Bulanan
              </button>
            )}
            <button onClick={handleResetBulan} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', background: '#fed7d7', color: 'var(--danger)', border: 'none', borderRadius: 'var(--radius)', cursor: 'pointer', fontSize: '0.875rem', fontWeight: '600' }}>
              <RefreshCcw size={14} />
              Reset Bulan Ini
            </button>
          </div>
        </div>
        <div className="table-container">
          <table className="warga-table">
            <thead>
              <tr>
                <th>Nama</th>
                <th>Lunas</th>
                <th>Kosong</th>
                <th>Total Bayar</th>
                <th>Status Akhir</th>
              </tr>
            </thead>
            <tbody>
              {warga.map(w => {
                const stats = getStats(w.id);
                const isComplete = stats.lunas + stats.kosong >= stats.targetDays * 0.8;
                
                return (
                  <tr key={w.id}>
                    <td>
                      <strong>{w.nama}</strong>
                      <br />
                      <small>{w.barcode}</small>
                    </td>
                    <td className="text-success">{stats.lunas}x</td>
                    <td className="text-danger">{stats.kosong}x</td>
                    <td>Rp {stats.totalBayar.toLocaleString()}</td>
                    <td>
                      <span className={`badge ${isComplete ? 'badge-success' : 'badge-warning'}`}>
                        {isComplete ? 'Lengkap' : 'Kurang'}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Selected Date Detail */}
      {selectedDate && (
        <div className="date-detail">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
            <h4 style={{ margin: 0 }}>Detail: {format(selectedDate, 'dd MMMM yyyy', { locale: id })}</h4>
            <button onClick={handleResetTanggal} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.4rem 0.75rem', background: '#fee2e2', color: '#b91c1c', border: 'none', borderRadius: 'var(--radius)', cursor: 'pointer', fontSize: '0.75rem', fontWeight: '600' }}>
              <RefreshCcw size={12} />
              Reset Tanggal
            </button>
          </div>
          {detailTransaksi.length === 0 ? (
            <p className="empty">Belum ada transaksi</p>
          ) : (
            <div className="detail-list">
              {detailTransaksi.map((t, i) => (
                <div key={i} className={`detail-item ${t.status}`}>
                  <span>{t.namaWarga}</span>
                  <span>{t.status === 'lunas' ? `Rp ${t.jumlah?.toLocaleString()}` : 'Kosong'}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Laporan;