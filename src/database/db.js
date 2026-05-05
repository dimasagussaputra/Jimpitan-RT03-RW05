import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Helper functions (Dummy untuk kompatibilitas dengan App.jsx)
export const initDB = async () => {
  console.log("Supabase Connection Initialized");
  return true;
};

// --- WARGA ---
export const addWarga = async (warga) => {
  const { data, error } = await supabase
    .from('warga')
    .insert([{
      nama: warga.nama,
      alamat: warga.alamat,
      rt: warga.rt,
      rw: warga.rw,
      noRumah: warga.noRumah,
      jumlahDefault: warga.jumlahDefault,
      telepon: warga.telepon,
      barcode: `JMP-${Date.now()}`
    }])
    .select();
  
  if (error) throw error;
  return data[0];
};

export const getAllWarga = async () => {
  const { data, error } = await supabase
    .from('warga')
    .select('*');
  
  if (error) throw error;
  return data || [];
};

export const updateWarga = async (id, updatedData) => {
  const { data, error } = await supabase
    .from('warga')
    .update({
      nama: updatedData.nama,
      alamat: updatedData.alamat,
      rt: updatedData.rt,
      rw: updatedData.rw,
      noRumah: updatedData.noRumah,
      jumlahDefault: updatedData.jumlahDefault,
      telepon: updatedData.telepon
    })
    .eq('id', id)
    .select();
  
  if (error) throw error;
  return data[0];
};

export const deleteWarga = async (id) => {
  const { error } = await supabase
    .from('warga')
    .delete()
    .eq('id', id);
  
  if (error) throw error;
};

// --- TRANSAKSI ---
export const addTransaksi = async (transaksi) => {
  const now = new Date();
  const { data, error } = await supabase
    .from('transaksi')
    .insert([{
      wargaId: transaksi.wargaId,
      namaWarga: transaksi.namaWarga,
      barcode: transaksi.barcode,
      jumlah: transaksi.jumlah,
      status: transaksi.status || 'lunas',
      tanggal: now.toISOString().split('T')[0],
      bulan: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
    }])
    .select();
  
  if (error) throw error;
  return data[0];
};

export const getTransaksiByTanggal = async (tanggal) => {
  const { data, error } = await supabase
    .from('transaksi')
    .select('*')
    .eq('tanggal', tanggal);
  
  if (error) throw error;
  return data || [];
};

export const getTransaksiByBulan = async (bulan) => {
  const { data, error } = await supabase
    .from('transaksi')
    .select('*')
    .eq('bulan', bulan);
  
  if (error) throw error;
  return data || [];
};

export const deleteTransaksiHariIni = async (tanggal) => {
  const { error } = await supabase
    .from('transaksi')
    .delete()
    .eq('tanggal', tanggal);
  
  if (error) throw error;
};

export const deleteTransaksiBulanIni = async (bulan) => {
  const { error } = await supabase
    .from('transaksi')
    .delete()
    .eq('bulan', bulan);
  
  if (error) throw error;
};

// --- ADMIN ---
export const verifyAdmin = async (username, password) => {
  const { data, error } = await supabase
    .from('admin')
    .select('*')
    .eq('username', username)
    .eq('password', password)
    .single();
  
  if (error && error.code !== 'PGRST116') { // PGRST116 means no rows found
    throw error;
  }
  return data || null;
};

// Dummy initAdmin karena sudah di-insert via SQL
export const initAdmin = async () => {
  return true;
};