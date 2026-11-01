import './style.css';
import {
  createIcons,
  Briefcase,
  Building2,
  Calculator,
  ChevronDown,
  Cpu,
  Crosshair,
  FileSpreadsheet,
  FileText,
  HardHat,
  Headset,
  Info,
  LayoutGrid,
  Mail,
  Map,
  MapPin,
  Menu,
  MessageCircle,
  MonitorPlay,
  Phone,
  Satellite,
  ShieldCheck,
  X,
} from 'lucide';

const WHATSAPP_NUMBER = '905458953918';
const EMAIL = 'info@mekharita.com.tr';

// Yalnızca kullanılan ikonlar paketlenir (CDN'den "latest" yüklemek yerine).
createIcons({
  icons: {
    Briefcase, Building2, Calculator, ChevronDown, Cpu, Crosshair, FileSpreadsheet, FileText,
    HardHat, Headset, Info, LayoutGrid, Mail, Map, MapPin, Menu, MessageCircle, MonitorPlay,
    Phone, Satellite, ShieldCheck, X,
  },
});

const $ = (id) => document.getElementById(id);

/* ---------- Logo: public/logo.png yoksa yazılı logoya geç ---------- */
const logo = $('siteLogo');
const logoText = $('siteLogoText');
const showTextLogo = () => {
  logo.classList.add('hidden');
  logoText.classList.remove('hidden');
};
if (logo) {
  logo.addEventListener('error', showTextLogo);
  if (logo.complete && logo.naturalWidth === 0) showTextLogo();
}

$('year').textContent = String(new Date().getFullYear());

/* ---------- Modal: #hash ile açılan bölüm panelleri ---------- */
const overlay = $('modalOverlay');
const modalTitle = $('modal-title');
const panels = [...document.querySelectorAll('[data-panel]')];
const pageRegions = [document.querySelector('header'), $('main'), document.querySelector('footer')];
let lastFocused = null;

function openPanel(name) {
  const panel = panels.find((p) => p.dataset.panel === name);
  if (!panel) return false;

  if (overlay.hidden) lastFocused = document.activeElement;
  panels.forEach((p) => (p.hidden = p !== panel));
  modalTitle.textContent = panel.dataset.title;
  overlay.hidden = false;
  overlay.firstElementChild.scrollTop = 0;
  document.body.style.overflow = 'hidden';
  // Arka plandaki sayfa odak ve ekran okuyucu için devre dışı
  pageRegions.forEach((el) => el && (el.inert = true));
  $('modalClose').focus();
  return true;
}

function closePanel({ updateHash = true } = {}) {
  if (overlay.hidden) return;
  overlay.hidden = true;
  document.body.style.overflow = '';
  pageRegions.forEach((el) => el && (el.inert = false));
  if (updateHash && location.hash) {
    history.replaceState(null, '', location.pathname + location.search);
  }
  if (lastFocused && document.contains(lastFocused)) lastFocused.focus();
}

function syncWithHash() {
  const name = decodeURIComponent(location.hash.slice(1));
  if (!name || !openPanel(name)) {
    closePanel({ updateHash: false });
    if (!name) window.scrollTo({ top: 0 });
  }
}

window.addEventListener('hashchange', syncWithHash);
syncWithHash();

$('modalClose').addEventListener('click', () => closePanel());
overlay.addEventListener('click', (e) => {
  if (e.target === overlay) closePanel();
});

/* ---------- Mobil menü ---------- */
const menuBtn = $('mobileMenuBtn');
const menu = $('mobileMenu');

function setMenu(open) {
  menu.classList.toggle('hidden', !open);
  $('menuIcon').classList.toggle('hidden', open);
  $('closeIcon').classList.toggle('hidden', !open);
  menuBtn.setAttribute('aria-expanded', String(open));
  menuBtn.setAttribute('aria-label', open ? 'Menüyü kapat' : 'Menüyü aç');
}

menuBtn.addEventListener('click', () => setMenu(menu.classList.contains('hidden')));
menu.addEventListener('click', (e) => {
  if (e.target.closest('a')) setMenu(false);
});

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    closePanel();
    setMenu(false);
  }
});

/* ---------- SSS: aynı anda tek soru açık ---------- */
const faqItems = document.querySelectorAll('#faqList details');
faqItems.forEach((item) =>
  item.addEventListener('toggle', () => {
    if (item.open) faqItems.forEach((other) => other !== item && (other.open = false));
  }),
);

/* ---------- Teklif formu ----------
 * Sitenin bir form sunucusu yoktur. Bu yüzden form "gönderildi" demez; talebi
 * hazır bir WhatsApp mesajına dönüştürür (yedek olarak e-posta bağlantısı sunar).
 * Mesaj, kullanıcı WhatsApp'ta "Gönder"e bastığında iletilir. */
const form = $('quoteForm');
const formError = $('formError');
const formResult = $('formResult');

const FIELD_MESSAGES = {
  name: 'Lütfen adınızı veya firma adını girin.',
  phone: 'Lütfen geçerli bir telefon numarası girin (en az 10 rakam).',
  service: 'Lütfen bir hizmet türü seçin.',
  message: 'Lütfen kısa bir mesaj yazın.',
  consent: 'Devam etmek için kişisel veri onayını işaretleyin.',
};

function buildMessage(data) {
  const lines = [
    'Merhaba, web sitesi üzerinden teklif talebinde bulunmak istiyorum.',
    '',
    `Ad Soyad / Firma: ${data.name}`,
    `Telefon: ${data.phone}`,
    `Hizmet Türü: ${data.service}`,
  ];
  if (data.city) lines.push(`İl / İlçe: ${data.city}`);
  if (data.parcel) lines.push(`Ada / Parsel: ${data.parcel}`);
  lines.push('', `Mesaj: ${data.message}`);
  return lines.join('\n');
}

form.addEventListener('submit', (e) => {
  e.preventDefault();
  formResult.classList.add('hidden');

  let firstInvalid = null;
  for (const el of form.elements) {
    if (!el.name || !(el.name in FIELD_MESSAGES)) continue;
    if (el.value && el.type !== 'checkbox') el.value = el.value.trim();
    let valid = el.checkValidity();
    if (el.name === 'phone' && el.value.replace(/\D/g, '').length < 10) valid = false;
    el.setAttribute('aria-invalid', String(!valid));
    if (!valid && !firstInvalid) firstInvalid = el;
  }

  if (firstInvalid) {
    formError.textContent = FIELD_MESSAGES[firstInvalid.name];
    formError.classList.remove('hidden');
    firstInvalid.focus();
    return;
  }
  formError.classList.add('hidden');

  const data = Object.fromEntries(new FormData(form));
  const text = buildMessage(data);
  const waUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(text)}`;
  const mailUrl = `mailto:${EMAIL}?subject=${encodeURIComponent(`Teklif Talebi - ${data.service}`)}&body=${encodeURIComponent(text)}`;

  $('formWaLink').href = waUrl;
  $('formMailLink').href = mailUrl;
  formResult.classList.remove('hidden');
  formResult.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  window.open(waUrl, '_blank', 'noopener');
});
