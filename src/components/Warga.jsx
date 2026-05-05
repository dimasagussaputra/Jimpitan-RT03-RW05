import React, { useState, useEffect } from 'react';
import { 
  Plus, Search, Edit2, Trash2, QrCode, 
  Download, UserPlus, X, CheckCircle, Eye
} from 'lucide-react';
import { getAllWarga, addWarga, updateWarga, deleteWarga } from '../database/db';
import QRCode from 'react-qr-code';

const Warga = () => {
  const [warga, setWarga] = useState([]);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [formData, setFormData] = useState({
    nama: '',
    alamat: '',
    rt: '',
    rw: '',
    noRumah: '',
    jumlahDefault: 500,
    telepon: ''
  });
  const [showQrModal, setShowQrModal] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [notification, setNotification] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(null);

  useEffect(() => {
    loadWarga();
  }, []);

  const loadWarga = async () => {
    const data = await getAllWarga();
    data.sort((a, b) => {
      const numA = a.noRumah || '';
      const numB = b.noRumah || '';
      return numA.toString().localeCompare(numB.toString(), undefined, { numeric: true, sensitivity: 'base' });
    });
    setWarga(data);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (editing) {
      await updateWarga(editing.id, { ...formData, barcode: editing.barcode });
      setNotification(`Perubahan data warga ${formData.nama} berhasil disimpan.`);
    } else {
      await addWarga(formData);
      setNotification(`Berhasil menambahkan warga ${formData.nama}.`);
    }

    setTimeout(() => setNotification(null), 3000);

    setShowForm(false);
    setEditing(null);
    setFormData({
      nama: '', alamat: '', rt: '', rw: '', noRumah: '', jumlahDefault: 500, telepon: ''
    });
    loadWarga();
  };

  const handleEdit = (w) => {
    setEditing(w);
    setFormData({
      nama: w.nama,
      alamat: w.alamat || '',
      rt: w.rt || '',
      rw: w.rw || '',
      noRumah: w.noRumah || '',
      jumlahDefault: w.jumlahDefault || 500,
      telepon: w.telepon || ''
    });
    setShowForm(true);
  };

  const handleDeleteClick = (w) => {
    setDeleteConfirm(w);
  };

  const confirmDelete = async () => {
    if (deleteConfirm) {
      const namaDeleted = deleteConfirm.nama;
      await deleteWarga(deleteConfirm.id);
      loadWarga();
      setDeleteConfirm(null);
      setNotification(`Warga ${namaDeleted} berhasil dihapus.`);
      setTimeout(() => setNotification(null), 3000);
    }
  };

  const filteredWarga = warga.filter(w => 
    w.nama.toLowerCase().includes(search.toLowerCase()) ||
    w.barcode?.toLowerCase().includes(search.toLowerCase()) ||
    w.alamat?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="warga-container">
      <div className="warga-header">
        <h1>Data Warga</h1>
        <p>Kelola data rumah & barcode</p>
      </div>

      {/* Toast Notification */}
      {notification && (
        <div className="toast-notification">
          <CheckCircle size={20} />
          <span>{notification}</span>
        </div>
      )}

      {/* Search & Add */}
      <div className="toolbar">
        <div className="search-box">
          <Search size={18} />
          <input
            type="text"
            placeholder="Cari nama, barcode, atau alamat..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <button className="btn-add" onClick={() => setShowForm(true)}>
          <UserPlus size={18} />
          Tambah
        </button>
      </div>

      {/* Stats */}
      <div className="warga-stats">
        <span>Total Terdaftar: <strong>{warga.length}</strong> rumah/KK</span>
      </div>

      {/* Warga List */}
      <div className="warga-list">
        {filteredWarga.map((w) => (
          <div key={w.id} className="warga-card">
            <div className="warga-info">
              <div className="warga-avatar">
                {w.nama.charAt(0).toUpperCase()}
              </div>
              <div className="warga-detail">
                <h4>{w.nama}</h4>
                <p>{w.alamat || 'Alamat belum diisi'}</p>
                <div className="warga-meta">
                  <span className="badge-barcode">
                    <QrCode size={12} />
                    {w.barcode}
                  </span>
                  <span className="badge-rumah">No. {w.noRumah || '-'}</span>
                </div>
              </div>
            </div>
            <div className="warga-actions">
              <button onClick={() => setShowDetailModal(w)} className="btn-icon info" title="Detail Warga">
                <Eye size={16} />
              </button>
              <button onClick={() => setShowQrModal(w)} className="btn-icon" title="Lihat QR Code">
                <QrCode size={16} color="var(--primary)" />
              </button>
              <button onClick={() => handleEdit(w)} className="btn-icon edit" title="Edit">
                <Edit2 size={16} />
              </button>
              <button onClick={() => handleDeleteClick(w)} className="btn-icon delete" title="Hapus">
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="modal-overlay" onClick={() => setDeleteConfirm(null)} style={{ zIndex: 500 }}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header" style={{ borderBottom: 'none', paddingBottom: 0 }}>
              <h3 style={{ color: 'var(--danger)' }}>Hapus Data Warga</h3>
            </div>
            <div style={{ marginBottom: '2rem', marginTop: '1rem', lineHeight: '1.5' }}>
              <p style={{ textAlign: 'center', fontSize: '1.1rem', margin: '0 0 1rem 0' }}>
                Apakah Anda yakin ingin menghapus data warga <strong>{deleteConfirm.nama}</strong>?
              </p>
              <p style={{ textAlign: 'center', color: 'var(--text-light)', fontSize: '0.9rem', margin: 0 }}>
                Data yang dihapus tidak dapat dikembalikan lagi.
              </p>
            </div>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <button onClick={() => setDeleteConfirm(null)} className="btn-secondary" style={{ flex: 1, padding: '0.75rem', margin: 0 }}>Batal</button>
              <button onClick={confirmDelete} className="btn-submit-form" style={{ flex: 1, margin: 0, padding: '0.75rem', background: 'var(--danger)', boxShadow: 'none' }}>Ya, Hapus</button>
            </div>
          </div>
        </div>
      )}

      {/* Detail Warga Modal */}
      {showDetailModal && (
        <div className="modal-overlay" onClick={() => setShowDetailModal(null)} style={{ zIndex: 500 }}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Detail Warga</h2>
              <button onClick={() => setShowDetailModal(null)}>
                <X size={20} />
              </button>
            </div>
            
            <div className="detail-warga-content" style={{ lineHeight: '1.8' }}>
              <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem', marginBottom: '0.5rem' }}>
                <strong style={{ width: '140px', color: 'var(--text-light)' }}>Nama:</strong>
                <span>{showDetailModal.nama}</span>
              </div>
              <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem', marginBottom: '0.5rem' }}>
                <strong style={{ width: '140px', color: 'var(--text-light)' }}>Barcode:</strong>
                <span style={{ fontFamily: 'monospace', background: '#f3f4f6', padding: '2px 6px', borderRadius: '4px' }}>{showDetailModal.barcode}</span>
              </div>
              <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem', marginBottom: '0.5rem' }}>
                <strong style={{ width: '140px', color: 'var(--text-light)' }}>No Rumah:</strong>
                <span>{showDetailModal.noRumah || '-'}</span>
              </div>
              <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem', marginBottom: '0.5rem' }}>
                <strong style={{ width: '140px', color: 'var(--text-light)' }}>RT/RW:</strong>
                <span>{showDetailModal.rt || '-'} / {showDetailModal.rw || '-'}</span>
              </div>
              <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem', marginBottom: '0.5rem' }}>
                <strong style={{ width: '140px', color: 'var(--text-light)' }}>Alamat:</strong>
                <span>{showDetailModal.alamat || '-'}</span>
              </div>
              <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem', marginBottom: '0.5rem' }}>
                <strong style={{ width: '140px', color: 'var(--text-light)' }}>No Telepon:</strong>
                <span>{showDetailModal.telepon || '-'}</span>
              </div>
              <div style={{ display: 'flex', paddingBottom: '0.5rem', marginBottom: '0.5rem' }}>
                <strong style={{ width: '140px', color: 'var(--text-light)' }}>Tarif Jimpitan:</strong>
                <span>Rp {showDetailModal.jumlahDefault?.toLocaleString() || '0'}</span>
              </div>
            </div>
            
            <button onClick={() => setShowDetailModal(null)} className="btn-submit-form" style={{ marginTop: '1rem' }}>
              Tutup
            </button>
          </div>
        </div>
      )}

      {/* Form Modal */}
      {showForm && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h2>{editing ? 'Edit Warga' : 'Tambah Warga'}</h2>
              <button onClick={() => { setShowForm(false); setEditing(null); }}>
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="form-warga">
              <div className="form-group">
                <label>Nama Kepala Keluarga *</label>
                <input
                  type="text"
                  value={formData.nama}
                  onChange={(e) => setFormData({...formData, nama: e.target.value})}
                  required
                  placeholder="Masukkan nama lengkap"
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>No Rumah</label>
                  <input
                    type="text"
                    value={formData.noRumah}
                    onChange={(e) => setFormData({...formData, noRumah: e.target.value})}
                    placeholder="Contoh: 12A"
                  />
                </div>
                <div className="form-group">
                  <label>Jumlah Jimpitan (Rp)</label>
                  <input
                    type="number"
                    value={formData.jumlahDefault}
                    onChange={(e) => setFormData({...formData, jumlahDefault: Number(e.target.value)})}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Alamat Lengkap</label>
                <textarea
                  value={formData.alamat}
                  onChange={(e) => setFormData({...formData, alamat: e.target.value})}
                  placeholder="RT/RW, Dusun, Desa"
                  rows="2"
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>RT</label>
                  <input
                    type="text"
                    value={formData.rt}
                    onChange={(e) => setFormData({...formData, rt: e.target.value})}
                    placeholder="01"
                  />
                </div>
                <div className="form-group">
                  <label>RW</label>
                  <input
                    type="text"
                    value={formData.rw}
                    onChange={(e) => setFormData({...formData, rw: e.target.value})}
                    placeholder="01"
                  />
                </div>
              </div>

              <div className="form-group">
                <label>No Telepon</label>
                <input
                  type="tel"
                  value={formData.telepon}
                  onChange={(e) => setFormData({...formData, telepon: e.target.value})}
                  placeholder="0812xxxxxxx"
                />
              </div>

              {editing && (
                <div className="barcode-display">
                  <label>Barcode (Tidak bisa diubah)</label>
                  <div className="barcode-value">{editing.barcode}</div>
                </div>
              )}

              <button type="submit" className="btn-submit-form">
                {editing ? 'Simpan Perubahan' : 'Tambah Warga'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* QR Code Modal */}
      {showQrModal && (
        <div className="modal-overlay">
          <div className="modal" style={{ maxWidth: '300px', textAlign: 'center' }}>
            <div className="modal-header">
              <h2>QR Code Warga</h2>
              <button onClick={() => setShowQrModal(null)}>
                <X size={20} />
              </button>
            </div>
            <div style={{ background: 'white', padding: '16px', borderRadius: '8px', display: 'inline-block', marginBottom: '16px' }}>
              <QRCode value={showQrModal.barcode} size={200} />
            </div>
            <h3 style={{ marginBottom: '8px' }}>{showQrModal.nama}</h3>
            <p style={{ color: 'var(--text-light)', marginBottom: '16px' }}>{showQrModal.barcode}</p>
            <button 
              onClick={() => window.print()} 
              style={{ width: '100%', padding: '10px', background: 'var(--primary)', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>
              Cetak QR Code
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Warga;