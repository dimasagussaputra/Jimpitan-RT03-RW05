// Database Jimpitan - IndexedDB
const DB_NAME = 'JimpitanDB';
const DB_VERSION = 1;

export const initDB = () => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;

      // Store: Warga (Data Rumah)
      if (!db.objectStoreNames.contains('warga')) {
        const wargaStore = db.createObjectStore('warga', { keyPath: 'id', autoIncrement: true });
        wargaStore.createIndex('barcode', 'barcode', { unique: true });
        wargaStore.createIndex('nama', 'nama', { unique: false });
      }

      // Store: Transaksi Jimpitan Harian
      if (!db.objectStoreNames.contains('transaksi')) {
        const transStore = db.createObjectStore('transaksi', { keyPath: 'id', autoIncrement: true });
        transStore.createIndex('tanggal', 'tanggal', { unique: false });
        transStore.createIndex('wargaId', 'wargaId', { unique: false });
        transStore.createIndex('bulan', 'bulan', { unique: false }); // Format: 2024-05
      }

      // Store: Admin (1 user saja)
      if (!db.objectStoreNames.contains('admin')) {
        db.createObjectStore('admin', { keyPath: 'id' });
      }
    };
  });
};

// Helper functions
export const addWarga = async (warga) => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('warga', 'readwrite');
    const store = tx.objectStore('warga');
    const request = store.add({
      ...warga,
      barcode: `JMP-${Date.now()}`,
      createdAt: new Date().toISOString()
    });
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

export const getAllWarga = async () => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('warga', 'readonly');
    const store = tx.objectStore('warga');
    const request = store.getAll();
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

export const updateWarga = async (id, data) => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('warga', 'readwrite');
    const store = tx.objectStore('warga');
    const request = store.put({ ...data, id });
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

export const deleteWarga = async (id) => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('warga', 'readwrite');
    const store = tx.objectStore('warga');
    const request = store.delete(id);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
};

export const addTransaksi = async (transaksi) => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('transaksi', 'readwrite');
    const store = tx.objectStore('transaksi');
    const now = new Date();
    const request = store.add({
      ...transaksi,
      tanggal: now.toISOString().split('T')[0], // YYYY-MM-DD
      bulan: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`,
      waktu: now.toISOString(),
      status: transaksi.status || 'lunas' // lunas atau kosong
    });
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

export const getTransaksiByTanggal = async (tanggal) => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('transaksi', 'readonly');
    const store = tx.objectStore('transaksi');
    const index = store.index('tanggal');
    const request = index.getAll(tanggal);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

export const deleteTransaksiHariIni = async (tanggal) => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('transaksi', 'readwrite');
    const store = tx.objectStore('transaksi');
    const index = store.index('tanggal');
    const request = index.getAllKeys(tanggal);
    
    request.onsuccess = () => {
      const keys = request.result;
      keys.forEach(key => store.delete(key));
      // Need to wait for transaction to complete, but for simple apps this is okay.
      // A better way is tx.oncomplete = resolve;
    };
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
};

export const getTransaksiByBulan = async (bulan) => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('transaksi', 'readonly');
    const store = tx.objectStore('transaksi');
    const index = store.index('bulan');
    const request = index.getAll(bulan);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

export const deleteTransaksiBulanIni = async (bulan) => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('transaksi', 'readwrite');
    const store = tx.objectStore('transaksi');
    const index = store.index('bulan');
    const request = index.getAllKeys(bulan);
    
    request.onsuccess = () => {
      const keys = request.result;
      keys.forEach(key => store.delete(key));
    };
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
};

export const initAdmin = async () => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('admin', 'readwrite');
    const store = tx.objectStore('admin');
    // Default admin: admin / admin123
    const request = store.put({
      id: 1,
      username: 'admin',
      password: 'admin123', // Di production pakai hash!
      nama: 'Admin Jimpitan'
    });
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
};

export const verifyAdmin = async (username, password) => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('admin', 'readonly');
    const store = tx.objectStore('admin');
    const request = store.get(1);
    request.onsuccess = () => {
      const admin = request.result;
      if (admin && admin.username === username && admin.password === password) {
        resolve(admin);
      } else {
        resolve(null);
      }
    };
    request.onerror = () => reject(request.error);
  });
};