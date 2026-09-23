const dialog = document.getElementById('bookingDialog');
const form = document.getElementById('bookingForm');
const toast = document.getElementById('toast');

function openBooking(intent='') {
  if (intent) form.elements.intent.value = intent;
  dialog.showModal();
  setTimeout(() => form.elements.name.focus(), 50);
}
function closeBooking(){ dialog.close(); }

document.querySelectorAll('[data-open-booking]').forEach(btn => btn.addEventListener('click', () => openBooking()));
document.querySelectorAll('[data-close-booking]').forEach(btn => btn.addEventListener('click', closeBooking));
document.querySelectorAll('[data-intent]').forEach(btn => btn.addEventListener('click', () => openBooking(btn.dataset.intent)));

dialog.addEventListener('click', (event) => {
  const rect = dialog.getBoundingClientRect();
  const isInDialog = event.clientX >= rect.left && event.clientX <= rect.right && event.clientY >= rect.top && event.clientY <= rect.bottom;
  if (!isInDialog) closeBooking();
});

form.addEventListener('submit', (event) => {
  event.preventDefault();
  const fd = new FormData(form);
  const lead = {
    id: Date.now(),
    name: fd.get('name'),
    phone: fd.get('phone'),
    intent: fd.get('intent'),
    time: fd.get('time'),
    firstVisit: fd.get('firstVisit'),
    notes: fd.get('notes'),
    status: 'Nuevo',
    source: 'Web demo',
    createdAt: new Date().toISOString()
  };
  const leads = JSON.parse(localStorage.getItem('selfieDentalLeads') || '[]');
  leads.unshift(lead);
  localStorage.setItem('selfieDentalLeads', JSON.stringify(leads));
  dialog.close();
  form.reset();
  toast.innerHTML = `Solicitud guardada en la demo. <a href="crm.html" style="color:#e6cfe8;text-decoration:underline">Ver en CRM</a>`;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 5200);
});
