// db.js - LocalStorage tabanlı veritabanı simülatörü

const DB_KEY = 'CalismaProgramiDB';

// Veritabanını başlat
function initDB() {
    let data = localStorage.getItem(DB_KEY);
    if (!data) {
        data = {
            birimler: [],
            personeller: [],
            mesailer: [],
            duyurular: [],
            ayarlar: [
                { ayar_anahtar: 'site_baslik', ayar_deger: 'Dış Birim Mesai Takip Sistemi' },
                { ayar_anahtar: 'izin_gosterge_goster', ayar_deger: '1' }
            ],
            resmi_tatiller: [
                { id: 1, gun_ay: '01-01', aciklama: 'Yılbaşı' },
                { id: 2, gun_ay: '04-23', aciklama: 'Ulusal Egemenlik ve Çocuk Bayramı' },
                { id: 3, gun_ay: '05-01', aciklama: 'Emek ve Dayanışma Günü' },
                { id: 4, gun_ay: '05-19', aciklama: 'Atatürk\\'ü Anma, Gençlik ve Spor Bayramı' },
                { id: 5, gun_ay: '07-15', aciklama: 'Demokrasi ve Milli Birlik Günü' },
                { id: 6, gun_ay: '08-30', aciklama: 'Zafer Bayramı' },
                { id: 7, gun_ay: '10-29', aciklama: 'Cumhuriyet Bayramı' }
            ],
            gorev_tamamlayanlar: [],
            oturum: {
                is_admin: true, // Yerel kullanım olduğu için varsayılan olarak admin
                kullanici_adi: 'Admin'
            }
        };
        saveDB(data);
    }
    return getDB();
}

function getDB() {
    const data = localStorage.getItem(DB_KEY);
    return data ? JSON.parse(data) : null;
}

function saveDB(data) {
    localStorage.setItem(DB_KEY, JSON.stringify(data));
}

// Genel ID oluşturucu (Auto Increment mantığı)
function generateId(tableArray) {
    if (!tableArray || tableArray.length === 0) return 1;
    return Math.max(...tableArray.map(item => item.id)) + 1;
}

const DB = {
    // --- BİRİMLER ---
    getBirimler: function() {
        return getDB().birimler;
    },
    getBirim: function(id) {
        return getDB().birimler.find(b => b.id == id);
    },
    addBirim: function(birim_adi) {
        let db = getDB();
        let newBirim = { id: generateId(db.birimler), birim_adi: birim_adi };
        db.birimler.push(newBirim);
        saveDB(db);
        return newBirim;
    },
    updateBirim: function(id, birim_adi) {
        let db = getDB();
        let index = db.birimler.findIndex(b => b.id == id);
        if (index !== -1) {
            db.birimler[index].birim_adi = birim_adi;
            saveDB(db);
            return true;
        }
        return false;
    },
    deleteBirim: function(id) {
        let db = getDB();
        db.birimler = db.birimler.filter(b => b.id != id);
        db.personeller.forEach(p => { if (p.birim_id == id) p.birim_id = 0; });
        db.mesailer = db.mesailer.filter(m => m.birim_id != id);
        saveDB(db);
    },
    getBirimPersonelSayisi: function(birim_id) {
        let db = getDB();
        return db.personeller.filter(p => p.birim_id == birim_id && (!p.cikis_tarihi || new Date(p.cikis_tarihi) >= new Date())).length;
    },

    // --- PERSONELLER ---
    getPersoneller: function(birim_id = null) {
        let db = getDB();
        let list = db.personeller;
        if (birim_id !== null) {
            list = list.filter(p => p.birim_id == birim_id);
        }
        return list;
    },
    getAktifPersoneller: function(birim_id = null, tarih = new Date().toISOString().split('T')[0]) {
        return this.getPersoneller(birim_id).filter(p => !p.cikis_tarihi || p.cikis_tarihi >= tarih);
    },
    getPersonel: function(id) {
        return getDB().personeller.find(p => p.id == id);
    },
    addPersonel: function(data) {
        let db = getDB();
        let newP = { 
            id: generateId(db.personeller),
            ...data
        };
        db.personeller.push(newP);
        saveDB(db);
        return newP;
    },
    updatePersonel: function(id, data) {
        let db = getDB();
        let index = db.personeller.findIndex(p => p.id == id);
        if (index !== -1) {
            db.personeller[index] = { ...db.personeller[index], ...data };
            saveDB(db);
            return true;
        }
        return false;
    },
    deletePersonel: function(id) {
        let db = getDB();
        db.personeller = db.personeller.filter(p => p.id != id);
        db.mesailer = db.mesailer.filter(m => m.personel_id != id);
        saveDB(db);
    },

    // --- MESAİLER ---
    getMesailer: function(birim_id, baslangicTarihi, bitisTarihi) {
        let db = getDB();
        return db.mesailer.filter(m => {
            let matchBirim = (m.birim_id == birim_id);
            let matchTarih = m.tarih >= baslangicTarihi && m.tarih <= bitisTarihi;
            return matchBirim && matchTarih;
        }).map(m => {
            let p = db.personeller.find(pers => pers.id == m.personel_id);
            return {
                ...m,
                ad_soyad: p ? p.ad_soyad : 'Bilinmeyen Personel',
                sabit_birim_id: p ? p.birim_id : 0
            };
        });
    },
    addMesai: function(data) {
        let db = getDB();
        let newM = { id: generateId(db.mesailer), ...data };
        db.mesailer.push(newM);
        saveDB(db);
        return newM;
    },
    updateMesai: function(id, data) {
        let db = getDB();
        let index = db.mesailer.findIndex(m => m.id == id);
        if (index !== -1) {
            db.mesailer[index] = { ...db.mesailer[index], ...data };
            saveDB(db);
            return true;
        }
        return false;
    },
    deleteMesai: function(id) {
        let db = getDB();
        db.mesailer = db.mesailer.filter(m => m.id != id);
        saveDB(db);
    },
    
    // --- DUYURULAR / GÖREVLER ---
    getAktifDuyurular: function(birim_id = 0) {
        let db = getDB();
        let simdi = new Date().toISOString();
        return db.duyurular.filter(d => {
            let aktifMi = d.aktif == 1;
            let zamanUygun = (!d.baslangic_tarihi || d.baslangic_tarihi <= simdi) && (!d.bitis_tarihi || d.bitis_tarihi >= simdi);
            let birimUygun = (d.birim_id == 0 || d.birim_id == birim_id || birim_id == 0);
            return aktifMi && zamanUygun && birimUygun;
        }).sort((a,b) => new Date(b.olusturulma_tarihi) - new Date(a.olusturulma_tarihi));
    },
    getDuyurularAdmin: function() {
        return getDB().duyurular.sort((a,b) => new Date(b.olusturulma_tarihi) - new Date(a.olusturulma_tarihi));
    },
    addDuyuru: function(data) {
        let db = getDB();
        let newD = { id: generateId(db.duyurular), olusturulma_tarihi: new Date().toISOString(), ...data };
        db.duyurular.push(newD);
        saveDB(db);
        return newD;
    },
    updateDuyuru: function(id, data) {
        let db = getDB();
        let index = db.duyurular.findIndex(d => d.id == id);
        if (index !== -1) {
            db.duyurular[index] = { ...db.duyurular[index], ...data };
            saveDB(db);
            return true;
        }
        return false;
    },
    deleteDuyuru: function(id) {
        let db = getDB();
        db.duyurular = db.duyurular.filter(d => d.id != id);
        db.gorev_tamamlayanlar = db.gorev_tamamlayanlar.filter(g => g.gorev_id != id);
        saveDB(db);
    },
    tamamlaGorev: function(gorev_id, isim) {
        let db = getDB();
        db.gorev_tamamlayanlar.push({
            id: generateId(db.gorev_tamamlayanlar),
            gorev_id: gorev_id,
            isim: isim,
            tamamlanma_tarihi: new Date().toISOString()
        });
        saveDB(db);
    },
    getGorevTamamlayanlar: function(gorev_id) {
        return getDB().gorev_tamamlayanlar.filter(g => g.gorev_id == gorev_id);
    },

    // --- AYARLAR ---
    getAyar: function(anahtar) {
        let db = getDB();
        let a = db.ayarlar.find(ay => ay.ayar_anahtar === anahtar);
        return a ? a.ayar_deger : null;
    },
    setAyar: function(anahtar, deger) {
        let db = getDB();
        let index = db.ayarlar.findIndex(ay => ay.ayar_anahtar === anahtar);
        if (index !== -1) {
            db.ayarlar[index].ayar_deger = deger;
        } else {
            db.ayarlar.push({ ayar_anahtar: anahtar, ayar_deger: deger });
        }
        saveDB(db);
    },
    getAyarlar: function() {
        return getDB().ayarlar;
    },
    
    // --- RESMİ TATİLLER ---
    getResmiTatiller: function() {
        let db = getDB();
        if(!db.resmi_tatiller) {
            db.resmi_tatiller = [];
            saveDB(db);
        }
        return db.resmi_tatiller.sort((a,b) => a.gun_ay.localeCompare(b.gun_ay));
    },
    addResmiTatil: function(gun_ay, aciklama) {
        let db = getDB();
        let newT = { id: generateId(db.resmi_tatiller), gun_ay: gun_ay, aciklama: aciklama };
        db.resmi_tatiller.push(newT);
        saveDB(db);
        return newT;
    },
    deleteResmiTatil: function(id) {
        let db = getDB();
        db.resmi_tatiller = db.resmi_tatiller.filter(t => t.id != id);
        saveDB(db);
    },

    // --- OTURUM ---
    isAdmin: function() {
        return getDB().oturum.is_admin;
    }
};

initDB();
