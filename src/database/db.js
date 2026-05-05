import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// --- HELPER MAPPING ---
// Memetakan hasil dari Supabase (lowercase) kembali ke CamelCase agar UI tidak rusak
const mapWarga = (w) => ({
  ...w,
  noRumah: w.norumah,
  jumlahDefault: w.jumlahdefault
});

const mapTransaksi = (t) => ({
  ...t,
  wargaId: t.wargaid,
  namaWarga: t.namawarga
});

export const initDB = async () => {
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
      norumah: warga.noRumah,
      jumlahdefault: warga.jumlahDefault,
      telepon: warga.telepon,
      barcode: `JMP-${Date.now()}`
    }])
    .select();
  
  if (error) throw error;
  return mapWarga(data[0]);
};

export const getAllWarga = async () => {
  const { data, error } = await supabase
    .from('warga')
    .select('*');
  
  if (error) throw error;
  return (data || []).map(mapWarga);
};

export const updateWarga = async (id, updatedData) => {
  const { data, error } = await supabase
    .from('warga')
    .update({
      nama: updatedData.nama,
      alamat: updatedData.alamat,
      rt: updatedData.rt,
      rw: updatedData.rw,
      norumah: updatedData.noRumah,
      jumlahdefault: updatedData.jumlahDefault,
      telepon: updatedData.telepon
    })
    .eq('id', id)
    .select();
  
  if (error) throw error;
  return mapWarga(data[0]);
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
      wargaid: transaksi.wargaId,
      namawarga: transaksi.namaWarga,
      barcode: transaksi.barcode,
      jumlah: transaksi.jumlah,
      status: transaksi.status || 'lunas',
      tanggal: now.toISOString().split('T')[0],
      bulan: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
    }])
    .select();
  
  if (error) throw error;
  return mapTransaksi(data[0]);
};

export const getTransaksiByTanggal = async (tanggal) => {
  const { data, error } = await supabase
    .from('transaksi')
    .select('*')
    .eq('tanggal', tanggal);
  
  if (error) throw error;
  return (data || []).map(mapTransaksi);
};

export const getTransaksiByBulan = async (bulan) => {
  const { data, error } = await supabase
    .from('transaksi')
    .select('*')
    .eq('bulan', bulan);
  
  if (error) throw error;
  return (data || []).map(mapTransaksi);
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
    .maybeSingle();
  
  if (error) {
    console.error("Login error:", error);
    return null;
  }
  return data;
};

export const initAdmin = async () => {
  return true;
};