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
const bookingFormStep = document.getElementById('bookingFormStep');
const bookingSuccess = document.getElementById('bookingSuccess');
const bookingStatus = document.getElementById('bookingStatus');

function resetBookingDialog() {
  bookingFormStep.hidden = false;
  bookingSuccess.hidden = true;
  bookingForm.hidden = false;
  bookingForm?.reset();
  bookingForm?.querySelector('[data-form-error]').replaceChildren();
  bookingForm?.querySelector('[data-form-status]').replaceChildren();
  bookingForm?.querySelectorAll('[data-whatsapp-link]').forEach((link) => link.removeAttribute('href'));
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

function buildWhatsAppLink(payload) {
  const request = `Hola, soy ${payload.name}. Solicité una valoración por ${payload.intent}. Mi fecha de preferencia es ${payload.preferredDate} y mi horario de preferencia es ${payload.time}. Entiendo que la disponibilidad debe confirmarse.`;
  return `https://wa.me/593992459649?text=${encodeURIComponent(request)}`;
}

function setFormPending(form, isPending) {
  const button = form.querySelector('button[type="submit"]');
  if (!button) return;
  button.disabled = isPending;
  button.textContent = isPending ? 'Guardando solicitud…' : 'Guardar solicitud';
  button.setAttribute('aria-busy', String(isPending));
}

async function submitRequest(form) {
  const error = form.querySelector('[data-form-error]');
  const status = form.querySelector('[data-form-status]');
  error.replaceChildren();
  status.replaceChildren();

  if (!form.checkValidity()) {
    error.textContent = 'Revisa los campos obligatorios y confirma la información de la demo.';
    form.reportValidity();
    return;
  }

  const payload = Object.fromEntries(new FormData(form).entries());
  setFormPending(form, true);
  status.textContent = 'Guardando solicitud…';

  try {
    await new Promise((resolve) => window.setTimeout(resolve, 280));
    const data = getCRMData();
    data.leads.unshift({
      id: `LD-${Date.now().toString().slice(-6)}`,
      name: payload.name.trim(),
      phone: payload.phone.trim(),
      intent: payload.intent,
      stage: 'new',
      notes: `${payload.notes || 'Sin notas'} · Fecha de preferencia: ${payload.preferredDate} · Horario de preferencia: ${payload.time} · Solicitud demo; disponibilidad pendiente de confirmar.`,
      createdAt: new Date().toISOString().slice(0, 10)
    });
    setCRMData(data);
    const success = document.getElementById(form.dataset.successTarget);
    success?.querySelectorAll('[data-whatsapp-link]').forEach((link) => { link.href = buildWhatsAppLink(payload); });
    form.hidden = true;
    if (form === bookingForm) bookingFormStep.hidden = true;
    if (success) {
      success.hidden = false;
      success.focus();
    }
    const message = 'Solicitud guardada solo en esta demo local. La disponibilidad debe confirmarse con el equipo.';
    status.textContent = message;
    bookingStatus.textContent = message;
    showToast('Solicitud guardada en la demo local.');
  } catch (submissionError) {
    error.textContent = 'No se pudo guardar la solicitud en este navegador. Revisa el almacenamiento local e inténtalo de nuevo.';
  } finally {
    setFormPending(form, false);
  }
}

document.querySelectorAll('[data-request-form]').forEach((form) => {
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    submitRequest(form);
  });
});

const revealObserver = 'IntersectionObserver' in window ? new IntersectionObserver((entries, observer) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) { entry.target.classList.add('is-visible'); observer.unobserve(entry.target); }
  });
}, { threshold: 0.12 }) : null;
document.querySelectorAll('.reveal-section').forEach(section => revealObserver ? revealObserver.observe(section) : section.classList.add('is-visible'));

getCRMData();
