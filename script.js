const modals = {
  corporate: {
    title: 'Kurumsal',
    content: `
      <div class="text-gray-800 space-y-8 leading-relaxed text-base md:text-lg">
        <section>
          <h3 class="text-xl font-bold text-primary mb-3 border-b border-gray-200 pb-2">Hakkımızda</h3>
          <p><strong class="text-primary font-semibold">MEK Harita & Mühendislik</strong>; mühendislik hassasiyeti, doğru ölçüm, güvenilir veri üretimi ve sahadan ofise bütüncül teknik hizmet anlayışıyla çalışan bir harita mühendisliği firmasıdır. Yalova ve çevresinde aplikasyon, arazi ölçümü, parsel sınır tespiti, halihazır harita, kot-kübaj hesapları, vaziyet planı ve teknik danışmanlık alanlarında çözüm sunar.</p>
        </section>
        <section>
          <h3 class="text-xl font-bold text-primary mb-3 border-b border-gray-200 pb-2">Misyon & Vizyon</h3>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div class="bg-gray-50 border border-gray-200 p-5 rounded-sm">
              <h4 class="font-bold text-accent mb-2">Misyonumuz</h4>
              <p class="text-base text-gray-700">Yalova ve çevresinde harita mühendisliği hizmetlerini; doğru ölçüm, güvenilir veri üretimi ve resmi süreçlere uygun teknik dokümantasyon anlayışıyla sunmak.</p>
            </div>
            <div class="bg-gray-50 border border-gray-200 p-5 rounded-sm">
              <h4 class="font-bold text-accent mb-2">Vizyonumuz</h4>
              <p class="text-base text-gray-700">Yalova ve çevresinde güvenilir, ulaşılabilir ve mühendislik disiplininden taviz vermeyen; doğru ölçüm ve teknik hizmet anlayışıyla tercih edilen bir harita mühendisliği firması olmak.</p>
            </div>
          </div>
        </section>
        <section>
          <h3 class="text-xl font-bold text-primary mb-4 border-b border-gray-200 pb-2">Değerlerimiz</h3>
          <div class="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div class="flex items-center gap-2 border border-gray-200 p-3 rounded-sm bg-white shadow-sm"><div class="w-2 h-2 bg-primary rounded-full flex-shrink-0"></div><span class="font-medium text-gray-800 text-sm md:text-base">Hassasiyet</span></div>
            <div class="flex items-center gap-2 border border-gray-200 p-3 rounded-sm bg-white shadow-sm"><div class="w-2 h-2 bg-primary rounded-full flex-shrink-0"></div><span class="font-medium text-gray-800 text-sm md:text-base">Güvenilirlik</span></div>
            <div class="flex items-center gap-2 border border-gray-200 p-3 rounded-sm bg-white shadow-sm"><div class="w-2 h-2 bg-primary rounded-full flex-shrink-0"></div><span class="font-medium text-gray-800 text-sm md:text-base">Şeffaf iletişim</span></div>
            <div class="flex items-center gap-2 border border-gray-200 p-3 rounded-sm bg-white shadow-sm"><div class="w-2 h-2 bg-primary rounded-full flex-shrink-0"></div><span class="font-medium text-gray-800 text-sm md:text-base">Teknik doğruluk</span></div>
            <div class="flex items-center gap-2 border border-gray-200 p-3 rounded-sm bg-white shadow-sm"><div class="w-2 h-2 bg-primary rounded-full flex-shrink-0"></div><span class="font-medium text-gray-800 text-sm md:text-base">Zamanında teslim</span></div>
            <div class="flex items-center gap-2 border border-gray-200 p-3 rounded-sm bg-white shadow-sm"><div class="w-2 h-2 bg-primary rounded-full flex-shrink-0"></div><span class="font-medium text-gray-800 text-sm md:text-base">Resmi süreçlere uygunluk</span></div>
          </div>
        </section>
      </div>`
  },
  services: {
    title: 'Hizmetler',
    content: `
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div class="border border-gray-200 p-6 rounded-sm bg-gray-50 flex flex-col h-full hover:border-primary transition-colors">
          <div class="flex items-center gap-3 mb-4 border-b border-gray-200 pb-3">
            <i data-lucide="crosshair" class="text-primary text-opacity-90 w-[28px] h-[28px]"></i>
            <h3 class="font-bold text-gray-900 leading-tight">Aplikasyon Hizmetleri</h3>
          </div>
          <p class="text-gray-700 text-sm leading-relaxed">Projede yer alan yapı, sınır veya teknik bilgilerin sahaya doğru şekilde aktarılması için uygulanır. İnşaat öncesi konum doğruluğu ve resmi sürece uygunluk açısından önemlidir.</p>
        </div>
        <div class="border border-gray-200 p-6 rounded-sm bg-gray-50 flex flex-col h-full hover:border-primary transition-colors">
          <div class="flex items-center gap-3 mb-4 border-b border-gray-200 pb-3">
            <i data-lucide="map" class="text-primary text-opacity-90 w-[28px] h-[28px]"></i>
            <h3 class="font-bold text-gray-900 leading-tight">Sayısal Halihazır Harita Ölçümleri</h3>
          </div>
          <p class="text-gray-700 text-sm leading-relaxed">Arazinin mevcut durumunu, yapılaşma bilgilerini, kotları ve detayları teknik çizim ortamına aktarmak için yapılır.</p>
        </div>
        <div class="border border-gray-200 p-6 rounded-sm bg-gray-50 flex flex-col h-full hover:border-primary transition-colors">
          <div class="flex items-center gap-3 mb-4 border-b border-gray-200 pb-3">
            <i data-lucide="map-pin" class="text-primary text-opacity-90 w-[28px] h-[28px]"></i>
            <h3 class="font-bold text-gray-900 leading-tight">Arazi Ölçümü ve Parsel Sınır Tespiti</h3>
          </div>
          <p class="text-gray-700 text-sm leading-relaxed">Mülkiyet sınırlarının, tapu ve kadastro verilerine göre sahada hassas şekilde belirlenmesi işlemidir.</p>
        </div>
        <div class="border border-gray-200 p-6 rounded-sm bg-gray-50 flex flex-col h-full hover:border-primary transition-colors">
          <div class="flex items-center gap-3 mb-4 border-b border-gray-200 pb-3">
            <i data-lucide="calculator" class="text-primary text-opacity-90 w-[28px] h-[28px]"></i>
            <h3 class="font-bold text-gray-900 leading-tight">Kot, Kübaj ve Hafriyat Hesapları</h3>
          </div>
          <p class="text-gray-700 text-sm leading-relaxed">Kazı, dolgu, hafriyat ve arazi kot farklarının teknik olarak hesaplanması için kullanılır.</p>
        </div>
        <div class="border border-gray-200 p-6 rounded-sm bg-gray-50 flex flex-col h-full hover:border-primary transition-colors">
          <div class="flex items-center gap-3 mb-4 border-b border-gray-200 pb-3">
            <i data-lucide="hard-hat" class="text-primary text-opacity-90 w-[28px] h-[28px]"></i>
            <h3 class="font-bold text-gray-900 leading-tight">İnşaat Aks, Kot ve Kontrol Ölçümleri</h3>
          </div>
          <p class="text-gray-700 text-sm leading-relaxed">İnşaat sürecinde konum, kot, aks ve uygulama kontrollerinin teknik doğrulukla yapılmasını sağlar.</p>
        </div>
        <div class="border border-gray-200 p-6 rounded-sm bg-gray-50 flex flex-col h-full hover:border-primary transition-colors">
          <div class="flex items-center gap-3 mb-4 border-b border-gray-200 pb-3">
            <i data-lucide="satellite" class="text-primary text-opacity-90 w-[28px] h-[28px]"></i>
            <h3 class="font-bold text-gray-900 leading-tight">GNSS / GPS Ölçümleri</h3>
          </div>
          <p class="text-gray-700 text-sm leading-relaxed">Konum verilerinin hassas ve güvenilir şekilde elde edilmesi için modern ölçüm ekipmanlarıyla yapılan saha çalışmalarını kapsar.</p>
        </div>
        <div class="border border-gray-200 p-6 rounded-sm bg-gray-50 flex flex-col h-full hover:border-primary transition-colors">
          <div class="flex items-center gap-3 mb-4 border-b border-gray-200 pb-3">
            <i data-lucide="file-spreadsheet" class="text-primary text-opacity-90 w-[28px] h-[28px]"></i>
            <h3 class="font-bold text-gray-900 leading-tight">Vaziyet Planı ve Teknik Raporlama</h3>
          </div>
          <p class="text-gray-700 text-sm leading-relaxed">Proje ve resmi süreçlerde kullanılabilecek teknik çizim, rapor ve saha verilerinin düzenlenmesini kapsar.</p>
        </div>
        <div class="border border-gray-200 p-6 rounded-sm bg-gray-50 flex flex-col h-full hover:border-primary transition-colors">
          <div class="flex items-center gap-3 mb-4 border-b border-gray-200 pb-3">
            <i data-lucide="file-text" class="text-primary text-opacity-90 w-[28px] h-[28px]"></i>
            <h3 class="font-bold text-gray-900 leading-tight">İmar ve Ruhsat Süreçlerine Teknik Destek</h3>
          </div>
          <p class="text-gray-700 text-sm leading-relaxed">İmar, ruhsat ve belediye süreçlerinde ihtiyaç duyulan teknik çizim, ölçüm ve belge hazırlıklarına destek sağlar.</p>
        </div>
        <div class="border border-gray-200 p-6 rounded-sm bg-gray-50 flex flex-col h-full hover:border-primary transition-colors">
          <div class="flex items-center gap-3 mb-4 border-b border-gray-200 pb-3">
            <i data-lucide="headset" class="text-primary text-opacity-90 w-[28px] h-[28px]"></i>
            <h3 class="font-bold text-gray-900 leading-tight">Teknik Danışmanlık ve Süreç Takibi</h3>
          </div>
          <p class="text-gray-700 text-sm leading-relaxed">Harita mühendisliği süreçlerinde teknik yönlendirme, belge takibi ve saha-ofis koordinasyonu sağlar.</p>
        </div>
      </div>`
  },
  tech: {
    title: 'Teknik Altyapı',
    content: `
      <div class="space-y-8">
        <p class="text-lg text-gray-800 leading-relaxed border-b border-gray-200 pb-6">MEK Harita & Mühendislik, saha ölçümü ve ofis süreçlerinde güncel ölçüm yöntemleri, GNSS/GPS ölçüm altyapısı ve teknik çizim-hesaplama yazılımlarından yararlanarak güvenilir veri üretimi sağlar.</p>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div class="flex items-center gap-4 bg-gray-50 border border-gray-200 p-5 rounded-sm hover:border-primary transition-colors">
            <div class="bg-white p-3 border border-gray-200 rounded-sm flex-shrink-0 shadow-sm"><i data-lucide="satellite" class="text-primary opacity-90 w-[28px] h-[28px]"></i></div>
            <span class="font-bold text-gray-800 text-lg">GNSS / GPS Ölçüm Altyapısı</span>
          </div>
          <div class="flex items-center gap-4 bg-gray-50 border border-gray-200 p-5 rounded-sm hover:border-primary transition-colors">
            <div class="bg-white p-3 border border-gray-200 rounded-sm flex-shrink-0 shadow-sm"><i data-lucide="shield-check" class="text-primary opacity-90 w-[28px] h-[28px]"></i></div>
            <span class="font-bold text-gray-800 text-lg">Saha Ölçüm ve Kontrol Süreçleri</span>
          </div>
          <div class="flex items-center gap-4 bg-gray-50 border border-gray-200 p-5 rounded-sm hover:border-primary transition-colors">
            <div class="bg-white p-3 border border-gray-200 rounded-sm flex-shrink-0 shadow-sm"><i data-lucide="monitor-play" class="text-primary opacity-90 w-[28px] h-[28px]"></i></div>
            <span class="font-bold text-gray-800 text-lg">Teknik Çizim ve Hesaplama Yazılımları</span>
          </div>
          <div class="flex items-center gap-4 bg-gray-50 border border-gray-200 p-5 rounded-sm hover:border-primary transition-colors">
            <div class="bg-white p-3 border border-gray-200 rounded-sm flex-shrink-0 shadow-sm"><i data-lucide="file-text" class="text-primary opacity-90 w-[28px] h-[28px]"></i></div>
            <span class="font-bold text-gray-800 text-lg">Raporlama ve Veri Düzenleme</span>
          </div>
        </div>
      </div>`
  },
  areas: {
    title: 'Çalışma Alanları',
    content: `
      <div class="space-y-6">
        <p class="text-gray-800 text-lg mb-6 border-b border-gray-200 pb-4">Yalova ve çevresinde yürüttüğümüz başlıca çalışma alanları ve hizmet verdiğimiz sektörel uygulamalar:</p>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div class="flex items-center gap-3 p-5 border border-gray-200 rounded-sm bg-gray-50"><div class="w-2 h-2 bg-primary flex-shrink-0"></div><span class="font-medium text-gray-800">Konut ve villa projeleri</span></div>
          <div class="flex items-center gap-3 p-5 border border-gray-200 rounded-sm bg-gray-50"><div class="w-2 h-2 bg-primary flex-shrink-0"></div><span class="font-medium text-gray-800">Arsa ve parsel çalışmaları</span></div>
          <div class="flex items-center gap-3 p-5 border border-gray-200 rounded-sm bg-gray-50"><div class="w-2 h-2 bg-primary flex-shrink-0"></div><span class="font-medium text-gray-800">İnşaat ölçüm kontrolleri</span></div>
          <div class="flex items-center gap-3 p-5 border border-gray-200 rounded-sm bg-gray-50"><div class="w-2 h-2 bg-primary flex-shrink-0"></div><span class="font-medium text-gray-800">İmar ve ruhsat süreçleri</span></div>
          <div class="flex items-center gap-3 p-5 border border-gray-200 rounded-sm bg-gray-50"><div class="w-2 h-2 bg-primary flex-shrink-0"></div><span class="font-medium text-gray-800">Hafriyat, kot ve kübaj hesapları</span></div>
          <div class="flex items-center gap-3 p-5 border border-gray-200 rounded-sm bg-gray-50"><div class="w-2 h-2 bg-primary flex-shrink-0"></div><span class="font-medium text-gray-800">Vaziyet planı ve teknik raporlama</span></div>
        </div>
      </div>`
  },
  faq: {
    title: 'Sıkça Sorulan Sorular',
    content: `
      <div class="space-y-4">
        <div class="border border-gray-200 rounded bg-white">
          <button class="w-full px-6 py-4 text-left font-bold text-gray-900 hover:text-primary transition-colors focus:outline-none flex justify-between items-center" onclick="toggleFaq(this)">
            Aplikasyon nedir ve neden yapılır?
            <i data-lucide="chevron-down" class="text-gray-400"></i>
          </button>
          <div class="px-6 pb-4 text-gray-700 hidden text-sm md:text-base leading-relaxed border-t border-gray-100 pt-3">
            Aplikasyon, projede veya tapuda belirtilen koordinatların ve sınırların sahaya doğru bir şekilde uygulanması işlemidir. İnşaata başlamadan önce hataları önlemek ve yasal sınırlara uymak için zorunludur.
          </div>
        </div>
        <div class="border border-gray-200 rounded bg-white">
          <button class="w-full px-6 py-4 text-left font-bold text-gray-900 hover:text-primary transition-colors focus:outline-none flex justify-between items-center" onclick="toggleFaq(this)">
            Hizmet süresi ne kadardır?
            <i data-lucide="chevron-down" class="text-gray-400"></i>
          </button>
          <div class="px-6 pb-4 text-gray-700 hidden text-sm md:text-base leading-relaxed border-t border-gray-100 pt-3">
            Uygulanacak işin kapsamına göre değişmekle birlikte, saha ölçümleri genellikle aynı gün veya planlanan takvime göre en kısa sürede tamamlanır ve teknik raporlama süreci başlar.
          </div>
        </div>
        <div class="border border-gray-200 rounded bg-white">
          <button class="w-full px-6 py-4 text-left font-bold text-gray-900 hover:text-primary transition-colors focus:outline-none flex justify-between items-center" onclick="toggleFaq(this)">
            Sadece Yalova içine mi hizmet veriyorsunuz?
            <i data-lucide="chevron-down" class="text-gray-400"></i>
          </button>
          <div class="px-6 pb-4 text-gray-700 hidden text-sm md:text-base leading-relaxed border-t border-gray-100 pt-3">
            Merkezimiz Yalova'da olmakla birlikte, projenin büyüklüğüne ve kapsamına bağlı olarak çevre illere de teknik hizmet sağlamaktayız.
          </div>
        </div>
        <div class="border border-gray-200 rounded bg-white">
          <button class="w-full px-6 py-4 text-left font-bold text-gray-900 hover:text-primary transition-colors focus:outline-none flex justify-between items-center" onclick="toggleFaq(this)">
            Kot ve ekskavatör (kübaj) hesabı nasıl yapılır?
            <i data-lucide="chevron-down" class="text-gray-400"></i>
          </button>
          <div class="px-6 pb-4 text-gray-700 hidden text-sm md:text-base leading-relaxed border-t border-gray-100 pt-3">
            Arazi kazı öncesi ve sonrası gelişmiş GNSS ekipmanları ile hassas şekilde ölçülür. Alınan veriler ofis yazılımları ile 3 boyutlu modellenerek kazı ve dolgu hacimleri (kübaj) hesaplanır.
          </div>
        </div>
      </div>`
  },
  contact: {
    title: 'İletişim ve Teklif',
    content: `
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-10">
        <div>
          <h3 class="text-xl font-bold text-primary mb-6 border-b border-gray-200 pb-2">İletişim Bilgileri</h3>
          <div class="space-y-4">
            <div class="flex items-center gap-4 text-gray-800 bg-gray-50 p-4 border border-gray-200 rounded-sm">
              <i data-lucide="phone" class="text-primary w-[24px] h-[24px]"></i>
              <span class="font-medium">+90 545 895 3918</span>
            </div>
            <div class="flex items-center gap-4 text-gray-800 bg-gray-50 p-4 border border-gray-200 rounded-sm">
              <i data-lucide="mail" class="text-primary w-[24px] h-[24px]"></i>
              <span class="font-medium">mekharitaofis@gmail.com</span>
            </div>
            <div class="flex items-center gap-4 text-gray-800 bg-gray-50 p-4 border border-gray-200 rounded-sm">
              <i data-lucide="map-pin" class="text-primary w-[24px] h-[24px]"></i>
              <div><p class="font-medium">Merkez Ofis</p><p class="text-sm text-gray-600">Yalova, Türkiye</p></div>
            </div>
          </div>
          <div class="mt-8 bg-gray-50 p-5 border border-gray-200 rounded-sm">
            <h4 class="font-bold text-gray-900 mb-2">Çalışma Saatleri</h4>
            <div class="text-sm text-gray-700 space-y-1">
              <div class="flex justify-between border-b border-gray-200 pb-1"><span>Pazartesi - Cuma:</span> <span class="font-medium">09:00 - 18:00</span></div>
              <div class="flex justify-between border-b border-gray-200 pb-1 pt-1"><span>Cumartesi:</span> <span class="font-medium">09:00 - 13:00</span></div>
              <div class="flex justify-between pt-1"><span>Pazar:</span> <span class="font-medium text-gray-500">Kapalı</span></div>
            </div>
          </div>
        </div>
        <div>
          <h3 class="text-xl font-bold text-primary mb-6 border-b border-gray-200 pb-2">Teklif Formu</h3>
          <form class="space-y-4" onsubmit="event.preventDefault(); document.getElementById('successMsg').classList.remove('hidden'); this.reset();">
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div><label class="block text-sm font-semibold text-gray-700 mb-1">Ad Soyad / Firma *</label><input required class="w-full border border-gray-300 rounded-sm p-2.5 focus:outline-none focus:border-primary focus:ring-1 bg-gray-50 focus:bg-white" /></div>
              <div><label class="block text-sm font-semibold text-gray-700 mb-1">Telefon *</label><input type="tel" required class="w-full border border-gray-300 rounded-sm p-2.5 focus:outline-none focus:border-primary focus:ring-1 bg-gray-50 focus:bg-white" /></div>
            </div>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-5">
               <div><label class="block text-sm font-semibold text-gray-700 mb-1">Hizmet Türü *</label>
               <select required class="w-full border border-gray-300 rounded-sm p-2.5 focus:outline-none focus:border-primary focus:ring-1 bg-gray-50 focus:bg-white">
                 <option value="">Seçiniz...</option>
                 <option value="Aplikasyon">Aplikasyon</option>
                 <option value="Arazi Ölçümü">Arazi Ölçümü</option>
                 <option value="Parsel Sınır Tespiti">Parsel Sınır Tespiti</option>
                 <option value="Kot / Kübaj">Kot / Kübaj</option>
                 <option value="Halihazır Harita">Halihazır Harita</option>
                 <option value="İnşaat Ölçüm Kontrolü">İnşaat Ölçüm Kontrolü</option>
                 <option value="Vaziyet Planı">Vaziyet Planı</option>
                 <option value="Diğer">Diğer</option>
               </select></div>
               <div><label class="block text-sm font-semibold text-gray-700 mb-1">İl / İlçe</label><input class="w-full border border-gray-300 rounded-sm p-2.5 focus:outline-none focus:border-primary focus:ring-1 bg-gray-50 focus:bg-white" /></div>
            </div>
            <div><label class="block text-sm font-semibold text-gray-700 mb-1">Ada / Parsel Bilgisi, varsa</label><input class="w-full border border-gray-300 rounded-sm p-2.5 focus:outline-none focus:border-primary focus:ring-1 bg-gray-50 focus:bg-white" /></div>
            <div><label class="block text-sm font-semibold text-gray-700 mb-1">Mesaj *</label><textarea rows="4" required class="w-full border border-gray-300 rounded-sm p-2.5 focus:outline-none focus:border-primary focus:ring-1 bg-gray-50 focus:bg-white"></textarea></div>
            <div class="flex items-start gap-3 mt-4"><input type="checkbox" required class="mt-1 w-4 h-4 text-primary accent-primary border-gray-300 rounded" /><label class="text-sm text-gray-600 leading-tight">Kişisel verilerimin iletişim talebimin yanıtlanması amacıyla işlenmesini kabul ediyorum.</label></div>
            <button type="submit" class="w-full bg-primary text-white font-bold py-3 mt-2 rounded-sm hover:bg-primary-dark transition-colors border-2 border-transparent">Gönder</button>
            <div id="successMsg" class="hidden mt-4 p-4 bg-green-50 text-green-800 border border-green-200 rounded flex items-center justify-center gap-2"><i data-lucide="check-circle" class="w-[20px] h-[20px]"></i> Mesajınız başarıyla iletildi.</div>
          </form>
        </div>
      </div>`
  }
};

function openModal(id) {
  const modal = modals[id];
  if (!modal) return;
  
  document.getElementById('modal-title').textContent = modal.title;
  document.getElementById('modal-content').innerHTML = modal.content;
  document.getElementById('modalOverlay').classList.remove('hidden');
  document.body.style.overflow = 'hidden';
  lucide.createIcons();
}

function closeModals() {
  document.getElementById('modalOverlay').classList.add('hidden');
  document.body.style.overflow = '';
}

function handleBackdropClick(event) {
  if (event.target === event.currentTarget) {
    closeModals();
  }
}

document.addEventListener('keydown', function(e) {
  if (e.key === 'Escape') {
    closeModals();
    document.getElementById('mobileMenu').classList.add('hidden');
    document.getElementById('menuIcon').classList.remove('hidden');
    document.getElementById('closeIcon').classList.add('hidden');
  }
});

let mobileMenuOpen = false;
const btn = document.getElementById('mobileMenuBtn');
if (btn) {
  btn.addEventListener('click', toggleMobileMenu);
}

function toggleMobileMenu() {
  const menu = document.getElementById('mobileMenu');
  const menuIcon = document.getElementById('menuIcon');
  const closeIcon = document.getElementById('closeIcon');
  mobileMenuOpen = !mobileMenuOpen;
  if(mobileMenuOpen) {
    menu.classList.remove('hidden');
    menuIcon.classList.add('hidden');
    closeIcon.classList.remove('hidden');
  } else {
    menu.classList.add('hidden');
    menuIcon.classList.remove('hidden');
    closeIcon.classList.add('hidden');
  }
}

function toggleFaq(btn) {
  const content = btn.nextElementSibling;
  const isHidden = content.classList.contains('hidden');
  
  // İsteğe bağlı olarak diğerlerini kapat:
  document.querySelectorAll('#modal-content .border .px-6.pb-4').forEach(el => {
    el.classList.add('hidden');
    el.previousElementSibling.querySelector('i').classList.remove('transform', 'rotate-180');
  });

  if (isHidden) {
    content.classList.remove('hidden');
    btn.querySelector('i').classList.add('transform', 'rotate-180');
  }
}

// Iconları renderla
lucide.createIcons();
