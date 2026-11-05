/**
 * Teklif formu.
 * - VITE_FORM_ENDPOINT tanımlıysa: veriler JSON olarak bu adrese gönderilir ve YALNIZCA
 *   sunucu başarılı yanıt verirse "iletildi" mesajı gösterilir.
 * - Tanımlı değilse (önizleme modu): hiçbir veri gönderilmez; talep hazır bir WhatsApp
 *   mesajına dönüştürülür, yedek olarak e-posta bağlantısı sunulur.
 */
const WHATSAPP_NUMBER = '905458953918';
const EMAIL = 'info@mekharita.com.tr';
const ENDPOINT = (import.meta.env.VITE_FORM_ENDPOINT || '').trim();

const MESSAGES = {
  name: 'Lütfen adınızı veya firma adını girin.',
  phone: 'Lütfen geçerli bir telefon numarası girin (en az 10 rakam).',
  email: 'Lütfen geçerli bir e-posta adresi girin veya alanı boş bırakın.',
  service: 'Lütfen bir hizmet türü seçin.',
  message: 'Lütfen projenizi kısaca açıklayın.',
  consent: 'Devam etmek için kişisel veri onayını işaretleyin.',
};

const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

function buildText(d) {
  const lines = ['Merhaba, web sitesi üzerinden teklif talebinde bulunmak istiyorum.', '', `Ad Soyad / Firma: ${d.name}`, `Telefon: ${d.phone}`];
  if (d.email) lines.push(`E-posta: ${d.email}`);
  lines.push(`Hizmet Türü: ${d.service}`);
  if (d.city) lines.push(`İl / İlçe: ${d.city}`);
  if (d.parcel) lines.push(`Ada / Parsel: ${d.parcel}`);
  lines.push('', `Proje Açıklaması: ${d.message}`);
  return lines.join('\n');
}

export function initForm() {
  const form = document.getElementById('quoteForm');
  if (!form) return;
  const errorEl = document.getElementById('formError');
  const resultEl = document.getElementById('formResult');
  const submitBtn = form.querySelector('[type=submit]');

  if (ENDPOINT) {
    form.querySelector('[data-form-mode-note]').textContent = 'Formu gönderdiğinizde talebiniz doğrudan bize iletilir. En kısa sürede size dönüş yapacağız.';
    submitBtn.textContent = 'Gönder';
  }

  function validate() {
    let first = null;
    for (const el of form.elements) {
      if (!el.name || !(el.name in MESSAGES)) continue;
      if (el.type !== 'checkbox' && el.value) el.value = el.value.trim();
      let ok = el.checkValidity();
      if (el.name === 'phone' && el.value.replace(/\D/g, '').length < 10) ok = false;
      el.setAttribute('aria-invalid', String(!ok));
      if (!ok && !first) first = el;
    }
    return first;
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    resultEl.classList.add('hidden');
    const invalid = validate();
    if (invalid) {
      errorEl.textContent = MESSAGES[invalid.name];
      errorEl.classList.remove('hidden');
      invalid.focus();
      return;
    }
    errorEl.classList.add('hidden');
    const data = Object.fromEntries(new FormData(form));
    delete data.consent;
    const text = buildText(data);
    const waUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(text)}`;
    const mailUrl = `mailto:${EMAIL}?subject=${encodeURIComponent(`Teklif Talebi - ${data.service}`)}&body=${encodeURIComponent(text)}`;
    const fallbackLinks = `<a href="${esc(waUrl)}" target="_blank" rel="noopener noreferrer" class="text-primary font-semibold underline">WhatsApp ile gönderin</a> veya <a href="${esc(mailUrl)}" class="text-primary font-semibold underline">e-posta ile gönderin</a>`;

    if (ENDPOINT) {
      submitBtn.disabled = true;
      submitBtn.textContent = 'Gönderiliyor…';
      try {
        const res = await fetch(ENDPOINT, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
          body: JSON.stringify({ ...data, consent: true, source: 'mekharita.com.tr' }),
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        resultEl.innerHTML = '<p class="font-semibold text-primary">Talebiniz bize iletildi. Teşekkür ederiz; en kısa sürede size dönüş yapacağız.</p>';
        form.reset();
      } catch {
        resultEl.innerHTML = `<p class="font-semibold text-red-700">Talebiniz şu anda gönderilemedi.</p><p class="mt-2">Lütfen tekrar deneyin ya da talebinizi ${fallbackLinks}.</p>`;
      } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Gönder';
      }
    } else {
      resultEl.innerHTML = `<p class="font-semibold text-primary">Talebiniz WhatsApp mesajı olarak hazırlandı.</p><p class="mt-2">Mesajın bize ulaşması için açılan WhatsApp penceresinde <strong>Gönder</strong>’e dokunun. WhatsApp açılmadıysa ${fallbackLinks}.</p>`;
      window.open(waUrl, '_blank', 'noopener');
    }
    resultEl.classList.remove('hidden');
    resultEl.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  });

  // Hizmet kartlarındaki "Teklif iste" düğmeleri
  document.addEventListener('click', (e) => {
    const b = e.target.closest('[data-quote]');
    if (!b) return;
    const select = form.querySelector('#qService');
    select.value = b.dataset.quote;
    document.getElementById('iletisim').scrollIntoView({ behavior: 'smooth' });
    setTimeout(() => form.querySelector('#qName').focus({ preventScroll: true }), 600);
  });
}
