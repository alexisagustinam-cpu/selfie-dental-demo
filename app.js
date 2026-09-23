const STORAGE_KEY = 'selfieDentalCRMData';

const seedData = {
  leads: [
    { id: 'LD-1001', name: 'María José P.', phone: '0992459649', intent: 'Diseño de sonrisa', stage: 'contacted', notes: 'Quiere valoración estética.', createdAt: '2026-09-20' },
    { id: 'LD-1002', name: 'Carlos A.', phone: '0981112233', intent: 'Ortodoncia', stage: 'scheduled', notes: 'Preguntó por opciones de pago.', createdAt: '2026-09-21' },
    { id: 'LD-1003', name: 'Daniela R.', phone: '0979981122', intent: 'Limpieza dental', stage: 'new', notes: 'Primera visita.', createdAt: '2026-09-22' }
  ],
  appointments: [
    { id: 'AP-2001', patient: 'Carlos A.', service: 'Valoración de ortodoncia', date: '2026-09-24', time: '10:30', status: 'Confirmada', channel: 'WhatsApp' }
  ],
  tasks: [
    { id: 'TK-3001', title: 'Confirmar cita de Carlos', owner: 'Recepción', due: '2026-09-23', priority: 'Alta', detail: 'Enviar recordatorio por WhatsApp.' }
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

document.querySelectorAll('[data-open-booking]').forEach(btn => btn.addEventListener('click', () => openDialog(bookingDialog)));
document.getElementById('closeBookingDialog')?.addEventListener('click', () => closeDialog(bookingDialog));
bookingDialog?.addEventListener('click', (e) => {
  const rect = bookingDialog.getBoundingClientRect();
  const inside = e.clientX >= rect.left && e.clientX <= rect.right && e.clientY >= rect.top && e.clientY <= rect.bottom;
  if (!inside) closeDialog(bookingDialog);
});

document.querySelectorAll('[data-intent]').forEach(btn => {
  btn.addEventListener('click', () => {
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
  closeDialog(bookingDialog);
  bookingForm.reset();
  showToast('Solicitud guardada en la demo del CRM.');
});

continueWhatsAppBtn?.addEventListener('click', () => {
  const name = bookingForm?.elements?.name?.value || '';
  const intent = bookingForm?.elements?.intent?.value || 'una valoración';
  const msg = encodeURIComponent(`Hola, soy ${name || 'un paciente'}. Quiero información sobre ${intent}.`);
  window.open(`https://wa.me/593992459649?text=${msg}`, '_blank');
});

getCRMData();
