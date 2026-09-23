const STORAGE_KEY = 'selfieDentalCRMData';
document.documentElement.classList.add('js');

const seedData = {
  leads: [
    { id: 'LD-1001', name: 'María José P.', phone: '0992459649', intent: 'Diseño de sonrisa', stage: 'contacted', notes: 'Quiere valoración estética.', createdAt: '2026-09-20' },
    { id: 'LD-1002', name: 'Carlos A.', phone: '0981112233', intent: 'Ortodoncia', stage: 'scheduled', notes: 'Preguntó por opciones de pago.', createdAt: '2026-09-21' },
    { id: 'LD-1003', name: 'Daniela R.', phone: '0979981122', intent: 'Limpieza dental', stage: 'new', notes: 'Primera visita.', createdAt: '2026-09-22' }
  ],
  appointments: [
    { id: 'AP-2001', patient: 'Carlos A.', service: 'Valoración de ortodoncia', date: '2026-09-24', time: '10:30', status: 'Confirmada', channel: 'Registro demo' }
  ],
  tasks: [
    { id: 'TK-3001', title: 'Confirmar cita de Carlos', owner: 'Recepción', due: '2026-09-23', priority: 'Alta', detail: 'Preparar el recordatorio para enviar por el canal elegido.' }
  ]
};

function getCRMData() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(seedData));
    return structuredClone(seedData);
  }
  try { return JSON.parse(raw); }
  catch { localStorage.setItem(STORAGE_KEY, JSON.stringify(seedData)); return structuredClone(seedData); }
}

function setCRMData(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function showToast(message) {
  const toast = document.getElementById('toast');
  if (!toast) return;
  toast.textContent = message;
  toast.classList.add('show');
  clearTimeout(showToast._t);
  showToast._t = setTimeout(() => toast.classList.remove('show'), 2600);
}

function openDialog(dialog) { if (dialog && !dialog.open) dialog.showModal(); }
function closeDialog(dialog) { if (dialog && dialog.open) dialog.close(); }

const bookingDialog = document.getElementById('bookingDialog');
const bookingForm = document.getElementById('bookingForm');
const continueWhatsAppBtn = document.getElementById('continueWhatsApp');
const bookingFormStep = document.getElementById('bookingFormStep');
const bookingSuccess = document.getElementById('bookingSuccess');
const bookingStatus = document.getElementById('bookingStatus');

function resetBookingDialog() {
  bookingFormStep.hidden = false;
  bookingSuccess.hidden = true;
  continueWhatsAppBtn?.removeAttribute('href');
}

document.querySelectorAll('[data-open-booking]').forEach(btn => btn.addEventListener('click', () => { resetBookingDialog(); openDialog(bookingDialog); }));
document.getElementById('closeBookingDialog')?.addEventListener('click', () => { closeDialog(bookingDialog); resetBookingDialog(); });
document.getElementById('closeSuccess')?.addEventListener('click', () => { closeDialog(bookingDialog); resetBookingDialog(); });
bookingDialog?.addEventListener('click', (e) => {
  const rect = bookingDialog.getBoundingClientRect();
  const inside = e.clientX >= rect.left && e.clientX <= rect.right && e.clientY >= rect.top && e.clientY <= rect.bottom;
  if (!inside) { closeDialog(bookingDialog); resetBookingDialog(); }
});
bookingDialog?.addEventListener('close', resetBookingDialog);

document.querySelectorAll('[data-intent]').forEach(btn => {
  btn.addEventListener('click', () => {
    resetBookingDialog();
    openDialog(bookingDialog);
    const select = bookingForm?.querySelector('select[name="intent"]');
    if (select) select.value = btn.dataset.intent || 'No estoy seguro/a';
  });
});

bookingForm?.addEventListener('submit', (e) => {
  e.preventDefault();
  const formData = new FormData(bookingForm);
  const payload = Object.fromEntries(formData.entries());
  const data = getCRMData();
  data.leads.unshift({
    id: `LD-${Date.now().toString().slice(-6)}`,
    name: payload.name,
    phone: payload.phone,
    intent: payload.intent,
    stage: 'new',
    notes: `${payload.notes || ''} · Fecha tentativa: ${payload.preferredDate || 'No definida'} · Horario: ${payload.time || 'No definido'} · Primera visita: ${payload.firstVisit || 'Sí'}`,
    createdAt: new Date().toISOString().slice(0, 10)
  });
  setCRMData(data);
  const message = encodeURIComponent(`Hola, soy ${payload.name}. Acabo de solicitar una valoración por ${payload.intent}${payload.preferredDate ? ` para el ${payload.preferredDate}` : ''}.`);
  continueWhatsAppBtn.href = `https://wa.me/593992459649?text=${message}`;
  bookingForm.reset();
  bookingFormStep.hidden = true;
  bookingSuccess.hidden = false;
  bookingStatus.textContent = 'Solicitud guardada en la demo local. Puedes continuar a WhatsApp con un mensaje preparado.';
  continueWhatsAppBtn?.focus();
  showToast('Solicitud guardada en la demo local.');
});

const revealObserver = 'IntersectionObserver' in window ? new IntersectionObserver((entries, observer) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) { entry.target.classList.add('is-visible'); observer.unobserve(entry.target); }
  });
}, { threshold: 0.12 }) : null;
document.querySelectorAll('.reveal-section').forEach(section => revealObserver ? revealObserver.observe(section) : section.classList.add('is-visible'));

getCRMData();
