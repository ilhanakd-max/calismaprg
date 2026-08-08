// db.js - Supabase entegrasyonu (Asenkron)

const SUPABASE_URL = 'https://ziwxpbyvbqhqaxesxfyh.supabase.co';
const SUPABASE_KEY = 'sb_publishable_4XuviyAoFDiasa7CI9Ikmw_sstERSlb';

// Supabase kutuphanesi HTML dosyalarinda CDN uzerinden yuklenmelidir.
const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

const DB = {
    // --- BIRIMLER ---
    getBirimler: async function() {
        const { data, error } = await supabaseClient.from('birimler').select('*').order('id', { ascending: true });
        if (error) { console.error('getBirimler Hatasi:', error); return []; }
        return data || [];
    },
    getBirim: async function(id) {
        const { data, error } = await supabaseClient.from('birimler').select('*').eq('id', id).single();
        if (error) return null;
        return data;
    },
    addBirim: async function(birim_adi) {
        const { data, error } = await supabaseClient.from('birimler').insert([{ birim_adi }]).select();
        if (error) { console.error(error); return null; }
        return data[0];
    },
    updateBirim: async function(id, birim_adi) {
        const { error } = await supabaseClient.from('birimler').update({ birim_adi }).eq('id', id);
        return !error;
    },
    deleteBirim: async function(id) {
        const { error } = await supabaseClient.from('birimler').delete().eq('id', id);
        if(!error) {
            await supabaseClient.from('personeller').update({ birim_id: 0 }).eq('birim_id', id);
            await supabaseClient.from('mesailer').delete().eq('birim_id', id);
        }
        return !error;
    },
    getBirimPersonelSayisi: async function(birim_id) {
        const simdi = new Date().toISOString().split('T')[0];
        const { count, error } = await supabaseClient
            .from('personeller')
            .select('*', { count: 'exact', head: true })
            .eq('birim_id', birim_id)
            .or(`cikis_tarihi.is.null,cikis_tarihi.gte.${simdi}`);
        return error ? 0 : (count || 0);
    },

    // --- PERSONELLER ---
    getPersoneller: async function(birim_id = null) {
        let query = supabaseClient.from('personeller').select('*').order('ad_soyad', { ascending: true });
        if (birim_id !== null && birim_id !== 0) {
            query = query.eq('birim_id', birim_id);
        }
        const { data, error } = await query;
        if (error) { console.error(error); return []; }
        return data || [];
    },
    getAktifPersoneller: async function(birim_id = null, tarih = new Date().toISOString().split('T')[0]) {
        let query = supabaseClient.from('personeller')
            .select('*')
            .or(`cikis_tarihi.is.null,cikis_tarihi.gte.${tarih}`)
            .order('ad_soyad', { ascending: true });
        if (birim_id !== null && birim_id !== 0) {
            query = query.eq('birim_id', birim_id);
        }
        const { data, error } = await query;
        return error ? [] : (data || []);
    },
    getPersonel: async function(id) {
        const { data, error } = await supabaseClient.from('personeller').select('*').eq('id', id).single();
        return error ? null : data;
    },
    addPersonel: async function(personelData) {
        const { data, error } = await supabaseClient.from('personeller').insert([personelData]).select();
        if (error) { console.error(error); return null; }
        return data[0];
    },
    updatePersonel: async function(id, personelData) {
        const { error } = await supabaseClient.from('personeller').update(personelData).eq('id', id);
        return !error;
    },
    deletePersonel: async function(id) {
        const { error } = await supabaseClient.from('personeller').delete().eq('id', id);
        if(!error) {
            await supabaseClient.from('mesailer').delete().eq('personel_id', id);
        }
        return !error;
    },
    getUygunPersoneller: async function(birim_id, bas_tarih, bit_tarih) {
        // Joker (izin_degistirici=1) olan personelleri getir
        const { data: jokerler, error } = await supabaseClient
            .from('personeller').select('*').eq('izin_degistirici', 1)
            .order('ad_soyad', { ascending: true });
        if (error || !jokerler) return [];
        const uygunlar = [];
        for (const p of jokerler) {
            const { data: mesgul } = await supabaseClient.from('mesailer').select('id')
                .eq('personel_id', p.id).gte('tarih', bas_tarih).lte('tarih', bit_tarih).limit(1);
            if (!mesgul || mesgul.length === 0) uygunlar.push(p);
        }
        return uygunlar;
    },

    // --- MESAILER ---
    getMesailer: async function(birim_id, baslangicTarihi, bitisTarihi) {
        const { data: mesailer, error } = await supabaseClient
            .from('mesailer')
            .select('*, personeller (ad_soyad, birim_id)')
            .eq('birim_id', birim_id)
            .gte('tarih', baslangicTarihi)
            .lte('tarih', bitisTarihi);

        if (error) { console.error(error); return []; }
        return (mesailer || []).map(m => ({
            ...m,
            ad_soyad: m.personeller ? m.personeller.ad_soyad : 'Bilinmeyen Personel',
            sabit_birim_id: m.personeller ? m.personeller.birim_id : 0
        }));
    },
    getMesailerAll: async function(baslangicTarihi, bitisTarihi, birim_id = null, personel_id = null, durum = null) {
        let query = supabaseClient
            .from('mesailer')
            .select('*, personeller (ad_soyad, birim_id), birimler (birim_adi)')
            .gte('tarih', baslangicTarihi)
            .lte('tarih', bitisTarihi)
            .order('tarih', { ascending: true });
        if (birim_id && birim_id > 0) query = query.eq('birim_id', birim_id);
        if (personel_id && personel_id > 0) query = query.eq('personel_id', personel_id);
        if (durum && durum !== '') query = query.eq('durum', durum);
        const { data, error } = await query;
        if (error) { console.error(error); return []; }
        return (data || []).map(m => ({
            ...m,
            ad_soyad: m.personeller ? m.personeller.ad_soyad : '',
            birim_adi: m.birimler ? m.birimler.birim_adi : ''
        }));
    },
    addMesai: async function(mesaiData) {
        const { data, error } = await supabaseClient.from('mesailer').insert([mesaiData]).select();
        if (error) { console.error(error); return null; }
        return data[0];
    },
    updateMesai: async function(id, mesaiData) {
        const { error } = await supabaseClient.from('mesailer').update(mesaiData).eq('id', id);
        return !error;
    },
    deleteMesai: async function(id) {
        const { error } = await supabaseClient.from('mesailer').delete().eq('id', id);
        return !error;
    },
    
    // --- DUYURULAR / GOREVLER ---
    getAktifDuyurular: async function(birim_id = 0) {
        const simdi = new Date().toISOString();
        let query = supabaseClient.from('duyurular')
            .select('*').eq('aktif', 1)
            .or(`baslangic_tarihi.is.null,baslangic_tarihi.lte.${simdi}`)
            .or(`bitis_tarihi.is.null,bitis_tarihi.gte.${simdi}`)
            .order('olusturulma_tarihi', { ascending: false });

        const { data, error } = await query;
        if (error) return [];
        return (data || []).filter(d => d.birim_id == 0 || d.birim_id == birim_id || birim_id == 0);
    },
    getDuyurularAdmin: async function() {
        const { data, error } = await supabaseClient.from('duyurular').select('*').order('olusturulma_tarihi', { ascending: false });
        return error ? [] : (data || []);
    },
    addDuyuru: async function(duyuruData) {
        const { data, error } = await supabaseClient.from('duyurular').insert([duyuruData]).select();
        if (error) { console.error(error); return null; }
        return data[0];
    },
    updateDuyuru: async function(id, duyuruData) {
        const { error } = await supabaseClient.from('duyurular').update(duyuruData).eq('id', id);
        return !error;
    },
    deleteDuyuru: async function(id) {
        const { error } = await supabaseClient.from('duyurular').delete().eq('id', id);
        if(!error) {
            await supabaseClient.from('gorev_tamamlayanlar').delete().eq('gorev_id', id);
        }
        return !error;
    },
    tamamlaGorev: async function(gorev_id, isim) {
        await supabaseClient.from('gorev_tamamlayanlar').insert([{ gorev_id, isim }]);
    },
    getGorevTamamlayanlar: async function(gorev_id) {
        const { data, error } = await supabaseClient.from('gorev_tamamlayanlar').select('*').eq('gorev_id', gorev_id).order('tamamlanma_tarihi', { ascending: true });
        return error ? [] : (data || []);
    },

    // --- AYARLAR ---
    getAyar: async function(anahtar) {
        const { data, error } = await supabaseClient.from('ayarlar').select('ayar_deger').eq('ayar_anahtar', anahtar).single();
        return (error || !data) ? null : data.ayar_deger;
    },
    setAyar: async function(anahtar, deger) {
        const { data } = await supabaseClient.from('ayarlar').select('id').eq('ayar_anahtar', anahtar).single();
        if (data) {
            await supabaseClient.from('ayarlar').update({ ayar_deger: deger }).eq('ayar_anahtar', anahtar);
        } else {
            await supabaseClient.from('ayarlar').insert([{ ayar_anahtar: anahtar, ayar_deger: deger }]);
        }
    },
    getAyarlar: async function() {
        const { data, error } = await supabaseClient.from('ayarlar').select('*');
        return error ? [] : (data || []);
    },
    
    // --- RESMI TATILLER ---
    getResmiTatiller: async function() {
        const { data, error } = await supabaseClient.from('resmi_tatiller').select('*').order('gun_ay', { ascending: true });
        return error ? [] : (data || []);
    },
    addResmiTatil: async function(gun_ay, aciklama) {
        const { data, error } = await supabaseClient.from('resmi_tatiller').insert([{ gun_ay, aciklama }]).select();
        return error ? null : data[0];
    },
    deleteResmiTatil: async function(id) {
        const { error } = await supabaseClient.from('resmi_tatiller').delete().eq('id', id);
        return !error;
    },

    // --- OTURUM (AUTH) ---
    isAdmin: async function() {
        const { data } = await supabaseClient.auth.getSession();
        return !!data.session;
    },
    getKullaniciAdi: async function() {
        const { data } = await supabaseClient.auth.getSession();
        if (!data.session) return null;
        const email = data.session.user?.email || '';
        return email.split('@')[0] || 'Admin';
    },
    login: async function(email, password) {
        const { data, error } = await supabaseClient.auth.signInWithPassword({
            email: email,
            password: password
        });
        return { success: !error, error: error ? error.message : null };
    },
    logout: async function() {
        await supabaseClient.auth.signOut();
    },
    toggleAdmin: async function(durum) {
        if(!durum) {
            await supabaseClient.auth.signOut();
        }
    }
};
