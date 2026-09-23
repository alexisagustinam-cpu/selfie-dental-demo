document.documentElement.classList.add('js');

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
  const notes = payload.notes.trim() ? ` Mis notas: ${payload.notes.trim()}.` : '';
  const request = `Hola, soy ${payload.name.trim()}. Me gustaría solicitar una valoración por ${payload.intent}. Mi fecha de preferencia es ${payload.preferredDate} y mi horario de preferencia es ${payload.time}.${notes} Entiendo que la disponibilidad debe confirmarse con el equipo.`;
  return `https://wa.me/593992459649?text=${encodeURIComponent(request)}`;
}

function setFormPending(form, isPending) {
  const button = form.querySelector('button[type="submit"]');
  if (!button) return;
  button.disabled = isPending;
  button.textContent = isPending ? 'Preparando mensaje…' : 'Preparar mensaje de WhatsApp';
  button.setAttribute('aria-busy', String(isPending));
}

async function submitRequest(form) {
  const error = form.querySelector('[data-form-error]');
  const status = form.querySelector('[data-form-status]');
  error.replaceChildren();
  status.replaceChildren();

  if (!form.checkValidity()) {
    error.textContent = 'Revisa los campos obligatorios y confirma que entiendes cómo se prepara el mensaje.';
    form.reportValidity();
    return;
  }

  const payload = Object.fromEntries(new FormData(form).entries());
  setFormPending(form, true);
  status.textContent = 'Preparando tu mensaje de WhatsApp…';

  try {
    await new Promise((resolve) => window.setTimeout(resolve, 180));
    const success = document.getElementById(form.dataset.successTarget);
    success?.querySelectorAll('[data-whatsapp-link]').forEach((link) => { link.href = buildWhatsAppLink(payload); });
    form.hidden = true;
    if (form === bookingForm) bookingFormStep.hidden = true;
    if (success) {
      success.hidden = false;
      success.focus();
    }
    const message = 'Tu mensaje está listo para enviar por WhatsApp. Este sitio no guardó tus datos.';
    status.textContent = message;
    bookingStatus.textContent = message;
    showToast('Tu mensaje está listo para enviar por WhatsApp.');
  } catch (submissionError) {
    error.textContent = 'No se pudo preparar el mensaje de WhatsApp. Revisa los datos e inténtalo de nuevo.';
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
