// app.js - Genel arayüz, layout ve ortak fonksiyonlar

document.addEventListener('DOMContentLoaded', function() {
    renderHeader();
    renderFooter();
});

function renderHeader() {
    const siteBaslik = DB.getAyar('site_baslik') || 'Dış Birim Mesai Takip Sistemi';
    const isAdmin = DB.isAdmin();
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
                <span class="me-3"><i class="fa-solid fa-user-circle"></i> Admin</span>
                <a href="#" onclick="toggleAdmin(false)" class="btn btn-sm btn-outline-light"><i class="fa-solid fa-sign-out-alt"></i> Çıkış Yap</a>
            ` : `
                <a href="#" onclick="toggleAdmin(true)" class="btn btn-sm btn-light"><i class="fa-solid fa-sign-in-alt"></i> Yönetici Girişi Yap</a>
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
        document.getElementById('nav-index').classList.add('active');
    }

    renderDuyurular(secili_birim);
}

function renderFooter() {
    const footerHtml = `
    </div> <!-- content-wrapper sonu -->
    <footer class="bg-dark text-light py-4 mt-auto">
        <div class="container">
            <div class="row">
                <div class="col-md-6 mb-3 mb-md-0 text-center text-md-start">
                    <h5 class="text-uppercase mb-3"><i class="fa-solid fa-shield-halved text-primary"></i> ${DB.getAyar('site_baslik')}</h5>
                    <p class="text-muted small mb-0">Bu sistem, personellerin mesai takibini kolaylaştırmak amacıyla tasarlanmıştır.</p>
                </div>
            </div>
            <hr class="border-secondary my-3">
            <div class="row align-items-center">
                <div class="col-md-6 text-center text-md-start">
                    <span class="text-muted small">&copy; ${new Date().getFullYear()} Dış Birim Mesai Sistemi.</span>
                </div>
            </div>
        </div>
    </footer>
    `;
    document.body.insertAdjacentHTML('beforeend', footerHtml);
}

function renderDuyurular(secili_birim) {
    const aktifler = DB.getAktifDuyurular(secili_birim);
    const container = document.getElementById('duyurular-alani');
    if (!container || aktifler.length === 0) return;

    let html = '';
    const gorevler = aktifler.filter(d => d.tur === 'gorev');
    const duyurular = aktifler.filter(d => d.tur !== 'gorev');

    if (gorevler.length > 0) {
        html += '<div class="mb-4">';
        gorevler.forEach(g => {
            const tamamlayanlar = DB.getGorevTamamlayanlar(g.id);
            let birimAd = g.birim_id == 0 ? 'Tüm Birimler' : (DB.getBirim(g.birim_id)?.birim_adi || 'Bilinmiyor');
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
                    <div class="text-dark">${g.icerik.replace(/\\n/g, '<br>')}</div>
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
                    <button type="button" class="btn btn-sm btn-success" onclick="gorevTamamlaPrompt(${g.id})">
                        <i class="fa-solid fa-circle-check me-1"></i> Tamamlandı İşaretle
                    </button>
                </div>
            </div>`;
        });
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
                    <div class="text-dark" style="font-size: 0.95rem;">${d.icerik.replace(/\\n/g, '<br>')}</div>
                    ${d.olusturan ? `<div class="small text-muted mt-2 fst-italic"><i class="fa-solid fa-user-pen me-1"></i> ${d.olusturan}</div>` : ''}
                    <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close" onclick="kapatDuyuru(${d.id})"></button>
                </div>`;
            }
        });
        html += '</div>';
    }

    container.innerHTML = html;
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

function gorevTamamlaPrompt(id) {
    let isim = prompt("Bu görevi tamamladığınızı onaylamak için adınızı giriniz:");
    if (isim && isim.trim() !== '') {
        DB.tamamlaGorev(id, isim.trim());
        location.reload();
    }
}

function toggleAdmin(durum) {
    DB.toggleAdmin(durum);
    location.reload();
}
