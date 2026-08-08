// app.js - Genel arayüz, layout ve ortak fonksiyonlar

document.addEventListener('DOMContentLoaded', async function() {
    await renderHeader();
    await renderFooter();
    document.dispatchEvent(new Event('appReady'));
});

async function renderHeader() {
    const siteBaslik = await DB.getAyar('site_baslik') || 'Dış Birim Mesai Takip Sistemi';
    const isAdmin = await DB.isAdmin();
    const kullaniciAdi = await DB.getKullaniciAdi();
    const urlParams = new URLSearchParams(window.location.search);
    const secili_birim = parseInt(urlParams.get('birim_id')) || 0;

    const navHtml = `
    <nav class="navbar navbar-expand-lg navbar-dark bg-primary shadow-sm">
      <div class="container-fluid">
        <a class="navbar-brand" href="index.html"><i class="fa-solid fa-clock"></i> ${siteBaslik}</a>
        
        <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav" 
                aria-controls="navbarNav" aria-expanded="false" aria-label="Toggle navigation">
          <span class="navbar-toggler-icon"></span>
        </button>
        
        <div class="collapse navbar-collapse" id="navbarNav">
          <ul class="navbar-nav me-auto mb-2 mb-lg-0">
            <li class="nav-item">
              <a class="nav-link" aria-current="page" href="index.html" id="nav-index"><i class="fa-solid fa-home"></i> Ana Sayfa</a>
            </li>
            <li class="nav-item">
              <a class="nav-link" href="mesai.html" id="nav-mesai"><i class="fa-solid fa-users"></i> Personel ve Mesailer</a>
            </li>
            ${isAdmin ? `
            <li class="nav-item">
              <a class="nav-link" href="raporlar.html" id="nav-raporlar"><i class="fa-solid fa-file-excel"></i> Raporlar</a>
            </li>
            <li class="nav-item">
              <a class="nav-link" href="birimler.html" id="nav-birimler"><i class="fa-solid fa-building"></i> Birim Yönetimi</a>
            </li>
            <li class="nav-item">
              <a class="nav-link" href="personeller.html" id="nav-personeller"><i class="fa-solid fa-user-tie"></i> Personel Yönetimi</a>
            </li>
            <li class="nav-item">
              <a class="nav-link" href="duyurular.html" id="nav-duyurular"><i class="fa-solid fa-bullhorn"></i> Duyurular</a>
            </li>
            <li class="nav-item">
              <a class="nav-link" href="ayarlar.html" id="nav-ayarlar"><i class="fa-solid fa-cog"></i> Ayarlar</a>
            </li>
            ` : ''}
          </ul>
          
          <div class="d-flex align-items-center text-white">
            ${isAdmin ? `
                <span class="me-3"><i class="fa-solid fa-user-circle"></i> ${kullaniciAdi || 'Admin'}</span>
                <a href="#" onclick="toggleAdmin(false)" class="btn btn-sm btn-outline-light"><i class="fa-solid fa-sign-out-alt"></i> Çıkış Yap</a>
            ` : `
                <a href="login.html" class="btn btn-sm btn-light"><i class="fa-solid fa-sign-in-alt"></i> Giriş Yap</a>
            `}
          </div>
        </div>
      </div>
    </nav>
    <div class="container content-wrapper" id="main-content">
        <!-- Duyurular Buraya Gelecek -->
        <div id="duyurular-alani"></div>
        <!-- Sayfa İçeriği -->
    </div>
    `;

    // Sayfanın başına ekle
    document.body.insertAdjacentHTML('afterbegin', navHtml);

    // Aktif sayfayı işaretle
    const path = window.location.pathname;
    const page = path.split("/").pop();
    if(page) {
        const activeLink = document.getElementById('nav-' + page.replace('.html', ''));
        if(activeLink) activeLink.classList.add('active');
    } else {
        const navIndex = document.getElementById('nav-index');
        if (navIndex) navIndex.classList.add('active');
    }

    await renderDuyurular(secili_birim);
}

async function renderFooter() {
    const footerHtml = `
    </div> <!-- content-wrapper sonu -->
    <!-- Alt Bilgi (Footer) -->
    <footer class="bg-white text-center py-3 mt-auto border-top text-muted">
        <div class="container">
            <small>&copy; ${new Date().getFullYear()} Dış Birim Mesai Takip Sistemi. Created by İlhan Akdeniz. Tüm hakları saklıdır.</small>
        </div>
    </footer>

    <!-- PWA Kurulum Banner'ı -->
    <div id="pwa-install-banner" class="fixed-bottom bg-white shadow-lg p-3 d-none align-items-center justify-content-between border-top" style="z-index: 1050;">
        <div class="d-flex align-items-center">
            <i class="fa-solid fa-download text-primary fs-3 me-3"></i>
            <div>
                <h6 class="mb-0 fw-bold">Uygulamayı İndir</h6>
                <small class="text-muted" id="pwa-install-text">Ana ekrana kısayol ekleyerek kolayca erişin.</small>
            </div>
        </div>
        <div>
            <button id="pwa-install-btn" class="btn btn-primary btn-sm rounded-pill px-3 me-2" style="display:none;">İndir</button>
            <button id="pwa-close-btn" class="btn btn-light btn-sm rounded-circle"><i class="fa-solid fa-xmark"></i></button>
        </div>
    </div>
    `;
    document.body.insertAdjacentHTML('beforeend', footerHtml);

    // Navbar brand fit script
    (function () {
        const brand = document.querySelector('.navbar-brand');
        if (!brand) return;
        const minSize = 11, origSize = 20;
        function fitBrand() {
            brand.style.whiteSpace = 'nowrap';
            brand.style.fontSize = origSize + 'px';
            if (brand.scrollWidth <= brand.clientWidth + 2) return;
            let fitSize = origSize;
            for (let fs = origSize; fs >= minSize; fs--) {
                brand.style.fontSize = fs + 'px';
                if (brand.scrollWidth <= brand.clientWidth + 2) { fitSize = fs; break; }
            }
            brand.style.fontSize = fitSize + 'px';
            if (brand.scrollWidth > brand.clientWidth + 2) {
                brand.style.fontSize = minSize + 'px';
                brand.style.whiteSpace = 'normal';
            }
        }
        window.addEventListener('load', fitBrand);
        window.addEventListener('resize', fitBrand);
        setTimeout(fitBrand, 200);
    })();

    // PWA Mantığı
    const installBanner = document.getElementById('pwa-install-banner');
    const installBtn = document.getElementById('pwa-install-btn');
    const closeBtn = document.getElementById('pwa-close-btn');
    const installText = document.getElementById('pwa-install-text');
    const pwaDismissed = localStorage.getItem('pwa_dismissed');
    const isIos = () => /iphone|ipad|ipod/.test(window.navigator.userAgent.toLowerCase());
    const isAndroid = () => /android/.test(window.navigator.userAgent.toLowerCase());
    const isStandalone = () => ('standalone' in window.navigator && window.navigator.standalone) || window.matchMedia('(display-mode: standalone)').matches;

    if (!isStandalone() && !pwaDismissed) {
        if (isIos()) {
            installText.innerText = 'Paylaş ikonuna basıp "Ana Ekrana Ekle"yi seçin.';
            installBanner.classList.remove('d-none'); installBanner.classList.add('d-flex');
        } else if (isAndroid()) {
            installText.innerHTML = 'Ana ekrana eklemek için <strong>İndir</strong> butonuna veya tarayıcı menüsünden <strong>Ana Ekrana Ekle</strong> seçeneğine tıklayın.';
            installBanner.classList.remove('d-none'); installBanner.classList.add('d-flex');
            installBtn.style.display = 'inline-block';
        }
    }

    let deferredPrompt;
    window.addEventListener('beforeinstallprompt', (e) => { e.preventDefault(); deferredPrompt = e; });
    installBtn.addEventListener('click', async () => {
        if (deferredPrompt) {
            deferredPrompt.prompt();
            const { outcome } = await deferredPrompt.userChoice;
            if (outcome === 'accepted') { installBanner.classList.remove('d-flex'); installBanner.classList.add('d-none'); }
            deferredPrompt = null;
        } else {
            alert('Lütfen tarayıcınızın sağ üst köşesindeki menüye (üç nokta) tıklayarak "Ana Ekrana Ekle" seçeneğini kullanın.');
        }
    });
    closeBtn.addEventListener('click', () => {
        installBanner.classList.remove('d-flex'); installBanner.classList.add('d-none');
        localStorage.setItem('pwa_dismissed', '1');
    });

    // ServiceWorker
    if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
            navigator.serviceWorker.register('sw.js').catch((e) => console.log('SW Registration Failed:', e));
        });
    }
}

async function renderDuyurular(secili_birim) {
    const aktifler = await DB.getAktifDuyurular(secili_birim);
    const container = document.getElementById('duyurular-alani');
    if (!container || aktifler.length === 0) return;

    let html = '';
    const gorevler = aktifler.filter(d => d.tur === 'gorev');
    const duyurular = aktifler.filter(d => d.tur !== 'gorev');

    if (gorevler.length > 0) {
        html += '<div class="mb-4">';
        for (let g of gorevler) {
            const tamamlayanlar = await DB.getGorevTamamlayanlar(g.id);
            let birimAd = 'Tüm Birimler';
            if (g.birim_id != 0) {
                const b = await DB.getBirim(g.birim_id);
                if (b) birimAd = b.birim_adi;
            }
            html += `
            <div class="card border-danger border-2 shadow-sm gorev-item mb-2">
                <div class="card-header bg-danger bg-opacity-10 py-2 d-flex justify-content-between align-items-center" style="cursor: pointer;" onclick="toggleGorev(${g.id})">
                    <div class="d-flex align-items-center min-width-0">
                        <i class="fa-solid fa-list-check text-danger me-2 flex-shrink-0"></i>
                        <span class="fw-bold text-dark text-truncate">Görev: ${g.baslik}</span>
                    </div>
                    <div class="d-flex align-items-center flex-shrink-0 ms-2">
                        <span class="badge bg-success me-2" id="gorevCount-${g.id}">${tamamlayanlar.length} tamamlandı</span>
                        <i class="fa-solid fa-chevron-down transition" id="gorevChevron-${g.id}"></i>
                    </div>
                </div>
                <div class="card-body d-none" id="gorevBody-${g.id}">
                    <div class="text-dark">${g.icerik.replace(/\n/g, '<br>')}</div>
                    <div class="small text-muted mt-2">
                        <i class="fa-solid fa-bullseye me-1"></i> Hedef: ${birimAd}
                        ${g.olusturan ? `<span class="ms-3"><i class="fa-solid fa-user-pen me-1"></i>${g.olusturan}</span>` : ''}
                    </div>
                    <hr>
                    <h6 class="fw-bold mb-2"><i class="fa-solid fa-circle-check text-success me-1"></i> Tamamlayanlar</h6>
                    <ul class="list-unstyled mb-3" id="gorevCompletions-${g.id}">
                        ${tamamlayanlar.map(t => `<li class="small mb-1"><i class="fa-solid fa-check-circle text-success me-1"></i><strong>${t.isim}</strong> <span class="text-muted">(${new Date(t.tamamlanma_tarihi).toLocaleString('tr-TR')})</span></li>`).join('')}
                        ${tamamlayanlar.length === 0 ? '<li class="small text-muted">Henüz kimse tamamlamadı.</li>' : ''}
                    </ul>
                    <button type="button" class="btn btn-sm btn-success" onclick="gorevTamamlaModalAc(${g.id})">
                        <i class="fa-solid fa-circle-check me-1"></i> Tamamlandı
                    </button>
                </div>
            </div>`;
        }
        html += '</div>';
    }

    if (duyurular.length > 0) {
        html += '<div id="duyuru-container" class="mb-4">';
        duyurular.forEach(d => {
            if (!localStorage.getItem('kapatilan_duyuru_' + d.id)) {
                html += `
                <div class="alert alert-info alert-dismissible fade show shadow-sm border-info border-2" role="alert">
                    <h5 class="alert-heading fw-bold mb-2 text-info-emphasis">
                        <i class="fa-solid fa-bell text-warning me-2"></i> ${d.baslik}
                    </h5>
                    <div class="text-dark" style="font-size: 0.95rem;">${d.icerik.replace(/\n/g, '<br>')}</div>
                    ${d.olusturan ? `<div class="small text-muted mt-2 fst-italic"><i class="fa-solid fa-user-pen me-1"></i> ${d.olusturan}</div>` : ''}
                    <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close" onclick="kapatDuyuru(${d.id})"></button>
                </div>`;
            }
        });
        html += '</div>';
    }

    // Görev tamamla modalı
    html += `
    <div class="modal fade" id="gorevTamamlaModal" tabindex="-1" aria-hidden="true">
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header bg-success text-white border-0">
            <h5 class="modal-title"><i class="fa-solid fa-circle-check"></i> Görev Tamamlandı</h5>
            <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Close"></button>
          </div>
          <div class="modal-body">
            <p class="mb-2">Bu görevi tamamladığınızı onaylamak için adınızı giriniz.</p>
            <input type="text" class="form-control" id="gorevTamamlaIsim" placeholder="Adınız Soyadınız" maxlength="255" autocomplete="off">
            <div class="form-text">Adınız, görevi tamamlayanlar listesine eklenecektir.</div>
          </div>
          <div class="modal-footer border-0">
            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">İptal</button>
            <button type="button" class="btn btn-success" onclick="gorevTamamlaSubmit()"><i class="fa-solid fa-check me-1"></i>Onayla</button>
          </div>
        </div>
      </div>
    </div>`;

    container.innerHTML = html;

    // Enter tuşu desteği
    const isimInput = document.getElementById('gorevTamamlaIsim');
    if (isimInput) {
        isimInput.addEventListener('keydown', function(e) {
            if (e.key === 'Enter') { e.preventDefault(); gorevTamamlaSubmit(); }
        });
    }
}

function toggleGorev(gorevId) {
    var body = document.getElementById('gorevBody-' + gorevId);
    var chevron = document.getElementById('gorevChevron-' + gorevId);
    if (!body) return;
    if (body.classList.contains('d-none')) {
        body.classList.remove('d-none');
        if (chevron) { chevron.classList.remove('fa-chevron-down'); chevron.classList.add('fa-chevron-up'); }
    } else {
        body.classList.add('d-none');
        if (chevron) { chevron.classList.remove('fa-chevron-up'); chevron.classList.add('fa-chevron-down'); }
    }
}

function kapatDuyuru(id) {
    localStorage.setItem('kapatilan_duyuru_' + id, '1');
}

var _gorevTamamlaId = null;
function gorevTamamlaModalAc(gorevId) {
    _gorevTamamlaId = gorevId;
    const isimInput = document.getElementById('gorevTamamlaIsim');
    if (isimInput) isimInput.value = '';
    const modalEl = document.getElementById('gorevTamamlaModal');
    const modal = bootstrap.Modal.getInstance(modalEl) || new bootstrap.Modal(modalEl);
    modal.show();
    setTimeout(function() { if (isimInput) isimInput.focus(); }, 300);
}

async function gorevTamamlaSubmit() {
    var isim = document.getElementById('gorevTamamlaIsim').value.trim();
    if (!isim) { alert('Lütfen adınızı giriniz.'); return; }
    if (!_gorevTamamlaId) return;
    await DB.tamamlaGorev(_gorevTamamlaId, isim);
    const modalEl = document.getElementById('gorevTamamlaModal');
    const modal = bootstrap.Modal.getInstance(modalEl);
    if (modal) modal.hide();
    const list = document.getElementById('gorevCompletions-' + _gorevTamamlaId);
    if (list) {
        const emptyLi = list.querySelector('li.text-muted');
        if (emptyLi) emptyLi.remove();
        const li = document.createElement('li');
        li.className = 'small mb-1';
        li.innerHTML = `<i class="fa-solid fa-check-circle text-success me-1"></i><strong>${isim}</strong> <span class="text-muted">(${new Date().toLocaleString('tr-TR')})</span>`;
        list.appendChild(li);
    }
    const count = document.getElementById('gorevCount-' + _gorevTamamlaId);
    if (count) {
        var mevcut = parseInt(count.textContent) || 0;
        count.textContent = (mevcut + 1) + ' tamamlandı';
    }
}

async function toggleAdmin(durum) {
    if(!durum) {
        await DB.logout();
        window.location.href = 'index.html';
    }
}
