import '@fontsource-variable/manrope';
import './style.css';
import {
  createIcons, ArrowRight, Box, Calculator, ChevronDown, ChevronsDown, Crosshair, FileSpreadsheet, FileText,
  Hand, HardHat, Headset, Info, Mail, Map, MapPin, Menu, MessageCircle, Minus, MonitorPlay, Pause, Phone, Play, Plus,
  RotateCcw, Satellite, Send, ShieldCheck, SkipForward, X,
} from 'lucide';
import { initNav } from './ui/nav.js';
import { initForm } from './ui/form.js';
import { initProjects } from './ui/projects.js';
import { initCubature } from './ui/cubature-ui.js';
import { illustrations } from './ui/illustrations.js';
import { hasWebGL, detectQuality, prefersReducedMotion } from './lib/quality.js';

document.documentElement.classList.add('js');

const ICONS = {
  ArrowRight, Box, Calculator, ChevronDown, ChevronsDown, Crosshair, FileSpreadsheet, FileText, Hand, HardHat,
  Headset, Info, Mail, Map, MapPin, Menu, MessageCircle, Minus, MonitorPlay, Pause, Phone, Play, Plus, RotateCcw,
  Satellite, Send, ShieldCheck, SkipForward, X,
};
const refreshIcons = () => createIcons({ icons: ICONS });

/* ---------- Statik içerik geliştirmeleri ---------- */
document.querySelectorAll('[data-illustration]').forEach((el) => (el.innerHTML = illustrations[el.dataset.illustration] ?? ''));
document.querySelectorAll('[data-year]').forEach((el) => (el.textContent = String(new Date().getFullYear())));

// Logo: public/logo.png yoksa yazılı logoya geç
const logo = document.querySelector('[data-logo]');
const showTextLogo = () => {
  logo.classList.add('hidden');
  document.querySelector('[data-logo-text]').classList.remove('hidden');
};
logo.addEventListener('error', showTextLogo);
if (logo.complete && logo.naturalWidth === 0) showTextLogo();
const heroLogo = document.querySelector('[data-hero-logo-img]');
const showHeroLogo = () => heroLogo.naturalWidth > 0 && (document.querySelector('[data-hero-logo]').hidden = false);
heroLogo.addEventListener('load', showHeroLogo);
if (heroLogo.complete) showHeroLogo();

initNav();
initForm();
initProjects(refreshIcons);
initCubature(document.querySelector('[data-cubature]'));
refreshIcons();

// SSS: aynı anda tek soru açık
const faqs = document.querySelectorAll('[data-faq] details');
faqs.forEach((d) => d.addEventListener('toggle', () => d.open && faqs.forEach((o) => o !== d && (o.open = false))));

// Görünür olunca beliren içerik
const revealIO = new IntersectionObserver(
  (entries) => entries.forEach((en) => {
    if (en.isIntersecting) {
      en.target.classList.add('is-visible');
      revealIO.unobserve(en.target);
    }
  }),
  { rootMargin: '0px 0px -8% 0px' },
);
document.querySelectorAll('[data-reveal]').forEach((el) => revealIO.observe(el));

// Hizmet kartından parsel demosunun belirli moduna geçiş
document.addEventListener('click', (e) => {
  const a = e.target.closest('[data-parcel-link]');
  if (!a) return;
  const root = document.getElementById('arsa-demo');
  root.dataset.initialMode = a.dataset.parcelLink;
  root.dispatchEvent(new CustomEvent('parcel:mode', { detail: a.dataset.parcelLink }));
  root.querySelectorAll('[data-parcel-mode]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.parcelMode === a.dataset.parcelLink)));
});

/* ---------- 3D sahneler: görünür alana yaklaşınca yükle, uzaklaşınca bellekten sil ---------- */
const LOADERS = {
  hero: () => import('./three/scenes/hero.js'),
  story: () => import('./three/scenes/story.js'),
  explorer: () => import('./three/scenes/explorer.js'),
  gnss: () => import('./three/scenes/gnss.js'),
  parcel: () => import('./three/scenes/parcel.js'),
  drone: () => import('./three/scenes/drone.js'),
  cubature: () => import('./three/scenes/cubature.js'),
};
const webgl = hasWebGL();
const quality = detectQuality();
const reduced = prefersReducedMotion();
const store = {
  get: (k) => { try { return sessionStorage.getItem(k); } catch { return null; } },
  set: (k, v) => { try { sessionStorage.setItem(k, v); } catch { /* yok say */ } },
};

// Hero girişi: oturum başına bir kez, hareket azaltma tercihi yoksa ve WebGL varsa
const hero = document.getElementById('anasayfa');
let playIntro = webgl && !reduced && !store.get('mek-intro-seen');
let heroApi = null;
const replayBtn = hero.querySelector('[data-hero-replay]');
function endIntro() {
  hero.classList.remove('is-intro');
  store.set('mek-intro-seen', '1');
  playIntro = false;
  if (webgl) replayBtn.hidden = false;
}
if (playIntro) hero.classList.add('is-intro');
// 3D 5 saniye içinde başlayamazsa içerik beklemeden gösterilir
const introGuard = setTimeout(() => !heroApi && endIntro(), 5000);
hero.querySelector('[data-hero-skip]').addEventListener('click', () => {
  heroApi?.skip();
  endIntro();
});
replayBtn.addEventListener('click', () => {
  if (!heroApi) return;
  hero.classList.add('is-intro');
  replayBtn.hidden = true;
  heroApi.replay();
});

if (!webgl) document.getElementById('surec').classList.add('no-webgl');

// Mobil iletişim çubuğu hero görünürken gizlenir (hero'nun kendi düğmeleri var, giriş kontrollerini örtmesin)
const mobileBar = document.querySelector('[data-mobile-bar]');
new IntersectionObserver(([en]) => mobileBar.classList.toggle('is-hidden', en.isIntersecting), { threshold: 0.3 }).observe(hero);

function contextFor(name) {
  if (name === 'hero') {
    return {
      quality,
      playIntro,
      onIntroEnd: endIntro,
    };
  }
  return { quality };
}

document.querySelectorAll('[data-scene-root]').forEach((root) => {
  const name = root.dataset.sceneRoot;
  const container = root.querySelector('[data-scene]');
  const fallback = container.querySelector('[data-fallback]');
  if (!webgl) {
    fallback.textContent = 'Bu tarayıcıda 3D görünüm (WebGL) kullanılamıyor. Bölümün içeriği metin olarak yer alıyor.';
    return;
  }
  let api = null;
  let loading = false;
  let inRange = false;

  async function mount() {
    loading = true;
    fallback.textContent = '3D görünüm yükleniyor…';
    try {
      const mod = await LOADERS[name]();
      const created = await mod.create(root, contextFor(name));
      if (!inRange) {
        created.dispose();
      } else {
        api = created;
        if (name === 'hero') {
          heroApi = api;
          clearTimeout(introGuard);
        }
        container.classList.add('is-ready');
      }
    } catch (err) {
      console.error(`[3D] ${name}:`, err);
      fallback.textContent = '3D görünüm bu cihazda yüklenemedi. Bölümün içeriği metin olarak yer alıyor.';
      if (name === 'hero') endIntro();
    } finally {
      loading = false;
    }
  }

  new IntersectionObserver(([en]) => {
    if (en.isIntersecting && !api && !loading) mount();
  }, { rootMargin: '300px 0px' }).observe(root);

  new IntersectionObserver(([en]) => {
    inRange = en.isIntersecting;
    if (!inRange && api) {
      api.dispose();
      api = null;
      if (name === 'hero') heroApi = null;
      container.classList.remove('is-ready');
    }
  }, { rootMargin: '1600px 0px' }).observe(root);
});
