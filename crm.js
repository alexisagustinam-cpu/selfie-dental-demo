const STORAGE_KEY = 'selfieDentalCRMData';
const stageMap = {
  new: 'Nuevo',
  contacted: 'Contactado',
  scheduled: 'Cita agendada',
  attended: 'Atendido',
  followup: 'Seguimiento',
  closed: 'Cerrado'
};
const stages = Object.keys(stageMap);

const seedData = {
  leads: [
    { id: 'LD-1001', name: 'María José P.', phone: '0992459649', intent: 'Diseño de sonrisa', stage: 'contacted', notes: 'Quiere valoración estética y consulta de costos.', createdAt: '2026-09-20' },
    { id: 'LD-1002', name: 'Carlos A.', phone: '0981112233', intent: 'Ortodoncia', stage: 'scheduled', notes: 'Preguntó por opciones de pago.', createdAt: '2026-09-21' },
    { id: 'LD-1003', name: 'Daniela R.', phone: '0979981122', intent: 'Limpieza dental', stage: 'new', notes: 'Primera visita.', createdAt: '2026-09-22' },
    { id: 'LD-1004', name: 'Pamela S.', phone: '0952223344', intent: 'Restauración dental', stage: 'followup', notes: 'Está esperando confirmación de horario.', createdAt: '2026-09-22' },
  ],
  appointments: [
    { id: 'AP-2001', patient: 'Carlos A.', service: 'Valoración de ortodoncia', date: '2026-09-24', time: '10:30', status: 'Confirmada', channel: 'Registro demo' },
    { id: 'AP-2002', patient: 'María José P.', service: 'Diseño de sonrisa', date: '2026-09-25', time: '16:00', status: 'Pendiente', channel: 'Web' }
  ],
  tasks: [
    { id: 'TK-3001', title: 'Confirmar cita de Carlos', owner: 'Recepción', due: '2026-09-23', priority: 'Alta', detail: 'Preparar el recordatorio para enviar por el canal elegido.' },
    { id: 'TK-3002', title: 'Seguimiento a Pamela', owner: 'Asistente', due: '2026-09-24', priority: 'Media', detail: 'Consultar disponibilidad para restauración.' }
  ]
};

function getData() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(seedData));
    return structuredClone(seedData);
  }
  try { return JSON.parse(raw); }
  catch { localStorage.setItem(STORAGE_KEY, JSON.stringify(seedData)); return structuredClone(seedData); }
}
function setData(data) { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); }
let state = getData();
let selectedLeadId = state.leads[0]?.id || null;

function showToast(message) {
  const toast = document.getElementById('toast');
  toast.textContent = message;
  toast.classList.add('show');
  clearTimeout(showToast._t);
  showToast._t = setTimeout(() => toast.classList.remove('show'), 2600);
}
function $(id) { return document.getElementById(id); }
function formatDate(date) {
  try { return new Date(date + 'T00:00:00').toLocaleDateString('es-EC', { day:'2-digit', month:'short', year:'numeric' }); }
  catch { return date; }
}
function openDialog(id) { $(id)?.showModal(); }
function closeDialog(id) { $(id)?.close(); }

document.querySelectorAll('[data-close-dialog]').forEach(btn => btn.addEventListener('click', () => closeDialog(btn.dataset.closeDialog)));

function renderMetrics() {
  const newLeads = state.leads.filter(l => l.stage === 'new').length;
  const awaitingResponse = state.leads.filter(l => l.stage === 'contacted').length;
  const scheduled = state.leads.filter(l => l.stage === 'scheduled').length;
  const followups = state.leads.filter(l => l.stage === 'followup').length + state.tasks.length;
  $('metricsRow').innerHTML = [
    ['Nuevos', newLeads, 'Solicitudes que revisar primero'],
    ['Esperando respuesta', awaitingResponse, 'Conversaciones por retomar'],
    ['Citas', scheduled, 'Por confirmar o atender'],
    ['Seguimientos', followups, 'Acciones pendientes del equipo'],
  ].map(([label,val,sub]) => `<article><small>${label}</small><strong>${val}</strong><span>${sub}</span></article>`).join('');
}

function renderRecentLeads() {
  const wrap = $('recentLeads');
  wrap.innerHTML = `
    <div class="lead-row table-head"><span>Paciente</span><span>Necesidad</span><span>Etapa</span><span>Fecha</span></div>
    ${state.leads.map(lead => `
      <div class="lead-row" data-lead-id="${lead.id}">
        <div><strong>${lead.name}</strong><span>${lead.phone}</span></div>
        <span>${lead.intent}</span>
        <span class="status-pill">${stageMap[lead.stage]}</span>
        <span>${formatDate(lead.createdAt)}</span>
      </div>`).join('')}
  `;
  wrap.querySelectorAll('[data-lead-id]').forEach(row => row.addEventListener('click', () => {
    selectedLeadId = row.dataset.leadId;
    renderLeadDetail();
  }));
}

function renderLeadDetail() {
  const lead = state.leads.find(l => l.id === selectedLeadId);
  const box = $('leadDetail');
  if (!lead) {
    box.innerHTML = `<div class="empty-detail"><strong>Sin lead seleccionado</strong></div>`;
    return;
  }
  box.className = 'detail-card';
  const action = lead.stage === 'new' ? ['contacted', 'Registrar primer contacto'] :
    lead.stage === 'contacted' ? ['scheduled', 'Proponer cita'] :
    lead.stage === 'scheduled' ? ['attended', 'Registrar atención'] :
    lead.stage === 'attended' ? ['followup', 'Crear seguimiento'] :
    lead.stage === 'followup' ? ['closed', 'Cerrar seguimiento'] : ['closed', 'Caso cerrado'];
  box.innerHTML = `
    <span>${lead.id}</span>
    <h3>${lead.name}</h3>
    <p class="next-action-label">Prioridad: ${action[1]}</p>
    <div class="detail-list">
      <div class="detail-row"><span>WhatsApp</span><strong>${lead.phone}</strong></div>
      <div class="detail-row"><span>Necesidad</span><strong>${lead.intent}</strong></div>
      <div class="detail-row"><span>Etapa</span><strong>${stageMap[lead.stage]}</strong></div>
      <div class="detail-row"><span>Fecha de ingreso</span><strong>${formatDate(lead.createdAt)}</strong></div>
      <div class="detail-row"><span>Notas</span><strong>${lead.notes || 'Sin notas'}</strong></div>
    </div>
    <div class="detail-actions">
      <button class="primary-action" data-move="${action[0]}">${action[1]}</button>
      <button data-move="followup">Crear seguimiento</button>
      <button data-move="closed">Cerrar caso</button>
    </div>`;
  box.querySelectorAll('[data-move]').forEach(btn => btn.addEventListener('click', () => updateLeadStage(lead.id, btn.dataset.move)));
}

function updateLeadStage(id, stage) {
  state.leads = state.leads.map(l => l.id === id ? { ...l, stage } : l);
  setData(state);
  renderAll();
  showToast('Estado actualizado en la demo local.');
}

function renderPipeline() {
  $('pipelineBoard').innerHTML = stages.map(stage => {
    const leads = state.leads.filter(l => l.stage === stage);
    return `<div class="pipeline-col">
      <div class="pipeline-title"><span>${stageMap[stage]}</span><span class="count-badge">${leads.length}</span></div>
      ${leads.map(lead => `
        <div class="lead-card">
          <strong>${lead.name}</strong>
          <p>${lead.intent}</p>
          <div class="lead-meta"><span>${lead.phone}</span><span>${formatDate(lead.createdAt)}</span></div>
          <div class="card-actions">
            <button class="mini-button" data-open="${lead.id}">Ver</button>
            <button class="mini-button" data-next="${lead.id}">Avanzar</button>
          </div>
        </div>`).join('') || `<div class="lead-card"><p>Sin pacientes en esta etapa.</p></div>`}
    </div>`;
  }).join('');

  document.querySelectorAll('[data-open]').forEach(btn => btn.addEventListener('click', () => {
    selectedLeadId = btn.dataset.open;
    switchView('dashboard');
    renderLeadDetail();
  }));
  document.querySelectorAll('[data-next]').forEach(btn => btn.addEventListener('click', () => {
    const lead = state.leads.find(l => l.id === btn.dataset.next);
    const idx = stages.indexOf(lead.stage);
    const next = stages[Math.min(idx + 1, stages.length - 1)];
    updateLeadStage(lead.id, next);
  }));
}

function renderAppointments() {
  const table = $('appointmentsTable');
  table.innerHTML = `
    <div class="table-grid table-head">
      <span>Paciente</span><span>Servicio</span><span class="appointment-cell-extra">Fecha</span><span class="appointment-cell-extra">Hora</span><span class="appointment-cell-extra">Estado</span><span class="appointment-cell-extra">Canal</span>
    </div>
    ${state.appointments.map(ap => `
      <div class="table-grid lead-row">
        <div><strong>${ap.patient}</strong></div>
        <span>${ap.service}</span>
        <span class="appointment-cell-extra">${formatDate(ap.date)}</span>
        <span class="appointment-cell-extra">${ap.time}</span>
        <span class="appointment-cell-extra status-pill">${ap.status}</span>
        <span class="appointment-cell-extra">${ap.channel}</span>
      </div>`).join('')}
  `;
}

function renderTasks() {
  $('tasksList').innerHTML = state.tasks.map(task => `
    <div class="task-item">
      <div>
        <strong>${task.title}</strong>
        <span>${task.detail}</span>
      </div>
      <div class="task-pills">
        <span class="tiny-pill">${task.owner}</span>
        <span class="tiny-pill">${task.priority}</span>
        <span class="tiny-pill">${formatDate(task.due)}</span>
      </div>
    </div>
  `).join('');
}

function renderAnalytics() {
  const counts = stages.map(stage => ({ stage, count: state.leads.filter(l => l.stage === stage).length }));
  const max = Math.max(...counts.map(c => c.count), 1);
  $('analyticsBars').innerHTML = counts.map(item => `
    <div class="bar-item">
      <div class="bar-label"><span>${stageMap[item.stage]}</span><strong>${item.count}</strong></div>
      <div class="bar-track"><div class="bar-fill" style="width:${(item.count/max)*100}%"></div></div>
    </div>
  `).join('');
  const firstResponse = state.leads.filter(l => ['contacted','scheduled','attended','followup','closed'].includes(l.stage)).length;
  $('analyticsSummary').innerHTML = `
    <div class="detail-row"><span>Leads nuevos</span><strong>${counts.find(x=>x.stage==='new')?.count || 0}</strong></div>
    <div class="detail-row"><span>Leads contactados</span><strong>${firstResponse}</strong></div>
    <div class="detail-row"><span>Citas creadas</span><strong>${state.appointments.length}</strong></div>
    <div class="detail-row"><span>Tareas activas</span><strong>${state.tasks.length}</strong></div>
  `;
}

function renderAll() {
  renderMetrics();
  renderRecentLeads();
  renderLeadDetail();
  renderPipeline();
  renderAppointments();
  renderTasks();
  renderAnalytics();
}

function switchView(view) {
  document.querySelectorAll('.view-section').forEach(sec => sec.classList.add('hidden'));
  $(`${view}View`).classList.remove('hidden');
  $('viewTitle').textContent = {
    dashboard:'Prioridades de hoy', pipeline:'Pipeline', appointments:'Citas', tasks:'Seguimientos', analytics:'Analítica', settings:'Ajustes'
  }[view] || 'Prioridades de hoy';
  document.querySelectorAll('.side-item').forEach(btn => btn.classList.toggle('active', btn.dataset.view === view));
}

document.querySelectorAll('.side-item').forEach(btn => btn.addEventListener('click', () => switchView(btn.dataset.view)));
$('newLeadBtn').addEventListener('click', () => openDialog('leadDialog'));
$('newAppointmentBtn').addEventListener('click', () => openDialog('appointmentDialog'));
$('newTaskBtn').addEventListener('click', () => openDialog('taskDialog'));
$('seedDemoBtn').addEventListener('click', () => { state = structuredClone(seedData); setData(state); selectedLeadId = state.leads[0]?.id || null; renderAll(); showToast('Demo restaurada.'); });
$('clearStorageBtn').addEventListener('click', () => { localStorage.removeItem(STORAGE_KEY); state = structuredClone(seedData); setData(state); selectedLeadId = state.leads[0]?.id || null; renderAll(); showToast('LocalStorage reiniciado.'); });
$('exportDataBtn').addEventListener('click', () => {
  const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = 'selfie-dental-crm-demo.json'; a.click();
  URL.revokeObjectURL(url);
});

$('leadForm').addEventListener('submit', (e) => {
  e.preventDefault();
  const fd = new FormData(e.target);
  state.leads.unshift({
    id: `LD-${Date.now().toString().slice(-6)}`,
    name: fd.get('name'), phone: fd.get('phone'), intent: fd.get('intent'), stage: fd.get('stage'), notes: fd.get('notes'), createdAt: new Date().toISOString().slice(0,10)
  });
  setData(state); e.target.reset(); closeDialog('leadDialog'); renderAll(); showToast('Lead guardado.');
});
$('appointmentForm').addEventListener('submit', (e) => {
  e.preventDefault();
  const fd = new FormData(e.target);
  state.appointments.unshift({
    id:`AP-${Date.now().toString().slice(-6)}`,
    patient:fd.get('patient'), service:fd.get('service'), date:fd.get('date'), time:fd.get('time'), status:fd.get('status'), channel:fd.get('channel')
  });
  setData(state); e.target.reset(); closeDialog('appointmentDialog'); renderAll(); showToast('Cita guardada.');
});
$('taskForm').addEventListener('submit', (e) => {
  e.preventDefault();
  const fd = new FormData(e.target);
  state.tasks.unshift({
    id:`TK-${Date.now().toString().slice(-6)}`,
    title:fd.get('title'), owner:fd.get('owner'), due:fd.get('due'), priority:fd.get('priority'), detail:fd.get('detail')
  });
  setData(state); e.target.reset(); closeDialog('taskDialog'); renderAll(); showToast('Tarea guardada.');
});

renderAll();
switchView('dashboard');
