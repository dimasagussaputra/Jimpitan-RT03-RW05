import React, { useState, useEffect } from 'react';
import { useZxing } from 'react-zxing';
import { 
  Camera, CameraOff, CheckCircle, XCircle, 
  Home, Keyboard
} from 'lucide-react';
import { getAllWarga, addTransaksi } from '../database/db';

const Scan = () => {
  const [scanning, setScanning] = useState(false);
  const [lastScanned, setLastScanned] = useState(null);
  const [wargaList, setWargaList] = useState([]);
  const [manualInput, setManualInput] = useState('');
  const [showManual, setShowManual] = useState(false);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    loadWarga();
  }, []);

  const loadWarga = async () => {
    const warga = await getAllWarga();
    warga.sort((a, b) => {
      const numA = a.noRumah || '';
      const numB = b.noRumah || '';
      return numA.toString().localeCompare(numB.toString(), undefined, { numeric: true, sensitivity: 'base' });
    });
    setWargaList(warga);
  };

  const { ref } = useZxing({
    paused: !scanning,
    onDecodeResult: (result) => {
      handleScan(result.getText(), false);
    },
    onError: (error) => {
      // Ignore errors saat scanning
    }
  });

  const handleScan = async (barcode, isManual = false) => {
    const warga = wargaList.find(w => w.barcode === barcode);
    
    if (warga) {
      const now = new Date();
      
      // Aturan khusus: Hari Kamis (malam Jumat) = Rp 1.000
      const isKamis = now.getDay() === 4;
      const nominalBayar = isKamis ? 1000 : (warga.jumlahDefault || 500);

      // Simpan transaksi lunas
      await addTransaksi({
        wargaId: warga.id,
        namaWarga: warga.nama,
        barcode: warga.barcode,
        jumlah: nominalBayar,
        status: 'lunas'
      });

      setLastScanned({
        ...warga,
        status: 'lunas',
        waktu: new Date().toLocaleTimeString('id-ID')
      });

      // Vibrate jika support
      if (navigator.vibrate) navigator.vibrate(200);
    } else {
      setLastScanned({
        nama: 'Tidak Ditemukan',
        status: 'error',
        waktu: new Date().toLocaleTimeString('id-ID')
      });
    }

    if (!isManual) {
      // Pause scanning sebentar
      setScanning(false);
      setTimeout(() => setScanning(true), 2000);
    }
  };

  const handleManualSubmit = async (e) => {
    e.preventDefault();
    if (manualInput) {
      await handleScan(manualInput, true);
      setManualInput('');
    }
  };

  const handleKosong = async (wargaId) => {
    const warga = wargaList.find(w => w.id === wargaId);
    if (warga) {
      await addTransaksi({
        wargaId: warga.id,
        namaWarga: warga.nama,
        barcode: warga.barcode,
        jumlah: 0,
        status: 'kosong'
      });

      setLastScanned({
        ...warga,
        status: 'kosong',
        waktu: new Date().toLocaleTimeString('id-ID')
      });
    }
  };

  return (
    <div className="scan-container">
      <div className="scan-header">
        <h1>Scan Barcode</h1>
        <p>Arahkan kamera ke barcode rumah</p>
      </div>

      {/* Camera View */}
      <div className="camera-container">
        {scanning ? (
          <div className="camera-wrapper">
            <video ref={ref} className="camera-video" />
            <div className="scan-overlay">
              <div className="scan-frame">
                <div className="corner top-left"></div>
                <div className="corner top-right"></div>
                <div className="corner bottom-left"></div>
                <div className="corner bottom-right"></div>
              </div>
              <p className="scan-text">Arahkan barcode ke dalam kotak</p>
            </div>
          </div>
        ) : (
          <div className="camera-off">
            <CameraOff size={64} />
            <p>Kamera dimatikan</p>
          </div>
        )}

        <div className="camera-controls">
          <button 
            className={`btn-camera ${scanning ? 'active' : ''}`}
            onClick={() => setScanning(!scanning)}
          >
            {scanning ? <CameraOff size={20} /> : <Camera size={20} />}
            {scanning ? 'Matikan' : 'Nyalakan'} Kamera
          </button>
          
          <button 
            className="btn-manual"
            onClick={() => setShowManual(!showManual)}
          >
            <Keyboard size={20} />
            Input Manual
          </button>
        </div>
      </div>

      {/* Manual Input */}
      {showManual && (
        <form onSubmit={handleManualSubmit} className="manual-form">
          <select
            value={manualInput}
            onChange={(e) => setManualInput(e.target.value)}
            className="manual-input"
            required
          >
            <option value="">-- Pilih Nama Warga --</option>
            {wargaList.map(w => (
              <option key={w.id} value={w.barcode}>{w.nama}</option>
            ))}
          </select>
          <button type="submit" className="btn-submit" style={{ padding: '0 1.5rem', background: 'var(--primary)', color: 'white', border: 'none', borderRadius: 'var(--radius)', cursor: 'pointer', fontWeight: '600' }}>Bayar</button>
        </form>
      )}

      {/* Last Scanned Result */}
      {lastScanned && (
        <div className={`scan-result ${lastScanned.status}`}>
          <div className="result-icon">
            {lastScanned.status === 'lunas' ? <CheckCircle size={32} /> : 
             lastScanned.status === 'kosong' ? <XCircle size={32} /> : 
             <CameraOff size={32} />}
          </div>
          <div className="result-info">
            <h3>{lastScanned.nama}</h3>
            <p>{lastScanned.alamat || lastScanned.barcode}</p>
            <span className="result-time">{lastScanned.waktu}</span>
          </div>
          <div className="result-status">
            {lastScanned.status === 'lunas' ? '✓ Lunas' : 
             lastScanned.status === 'kosong' ? '✗ Kosong' : 'Error'}
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="quick-actions">
        <h3>Tandai Kosong (Manual)</h3>
        <div className="warga-grid">
          {wargaList.map(w => (
            <button 
              key={w.id} 
              className="warga-chip"
              onClick={() => handleKosong(w.id)}
            >
              <Home size={14} />
              {w.nama}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Scan;