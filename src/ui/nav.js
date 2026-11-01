/** Üst menü: mobil menü, aktif bölüm göstergesi */
export function initNav() {
  const btn = document.getElementById('menuBtn');
  const menu = document.getElementById('mobileMenu');
  const setMenu = (open) => {
    menu.classList.toggle('hidden', !open);
    btn.querySelector('[data-menu-open]')?.classList.toggle('hidden', open);
    btn.querySelector('[data-menu-close]')?.classList.toggle('hidden', !open);
    btn.setAttribute('aria-expanded', String(open));
    btn.setAttribute('aria-label', open ? 'Menüyü kapat' : 'Menüyü aç');
  };
  btn.addEventListener('click', () => setMenu(menu.classList.contains('hidden')));
  menu.addEventListener('click', (e) => e.target.closest('a') && setMenu(false));
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !menu.classList.contains('hidden')) {
      setMenu(false);
      btn.focus();
    }
  });

  // Aktif bölüm: ekranın üst-orta bandındaki bölüm vurgulanır
  const links = [...document.querySelectorAll('[data-nav] a')];
  const ids = [...new Set(links.map((a) => a.getAttribute('href').slice(1)))];
  const alias = { surec: 'anasayfa', 'kubaj-demo': 'hizmetler', 'gnss-demo': 'arazi-3d', 'arsa-demo': 'arazi-3d', 'drone-demo': 'arazi-3d', projeler: 'calisma-alanlari' };
  const sections = [...document.querySelectorAll('main section[id]')];
  const setActive = (id) => {
    const target = ids.includes(id) ? id : alias[id];
    links.forEach((a) => {
      const own = a.getAttribute('href').slice(1);
      // mobil menüde 3D alt bölümleri kendi adlarıyla da işaretlenir
      const active = own === target || own === id;
      if (active) a.setAttribute('aria-current', 'true');
      else a.removeAttribute('aria-current');
    });
  };
  const io = new IntersectionObserver(
    (entries) => entries.forEach((en) => en.isIntersecting && setActive(en.target.id)),
    { rootMargin: '-40% 0px -55% 0px' },
  );
  sections.forEach((s) => io.observe(s));
}
