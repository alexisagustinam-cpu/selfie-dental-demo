const sampleLeads = [
  {id:'demo-1',name:'María P. (demo)',phone:'099 000 0101',intent:'Diseño de sonrisa',time:'Tarde',status:'Nuevo',source:'Instagram',createdAt:'2026-09-22T17:20:00',notes:'Solicita información inicial.'},
  {id:'demo-2',name:'Carlos R. (demo)',phone:'099 000 0102',intent:'Ortodoncia',time:'Mañana',status:'Contactado',source:'Facebook',createdAt:'2026-09-22T15:10:00',notes:'Prefiere horario por la mañana.'},
  {id:'demo-3',name:'Andrea V. (demo)',phone:'099 000 0103',intent:'Limpieza y prevención',time:'Tarde',status:'Cita solicitada',source:'Google',createdAt:'2026-09-21T18:40:00',notes:'Primera visita.'},
  {id:'demo-4',name:'José L. (demo)',phone:'099 000 0104',intent:'Restauración dental',time:'Tarde',status:'Confirmado',source:'Recomendación',createdAt:'2026-09-21T13:05:00',notes:'Cita pendiente de atención.'},
  {id:'demo-5',name:'Paola C. (demo)',phone:'099 000 0105',intent:'Odontopediatría',time:'Mañana',status:'Seguimiento',source:'Instagram',createdAt:'2026-09-20T11:30:00',notes:'Seguimiento posterior.'}
];

const statusOrder = ['Nuevo','Contactado','Cita solicitada','Confirmado','Seguimiento'];
const pipeline = document.getElementById('pipeline');
const table = document.getElementById('leadTable');
const detail = document.getElementById('leadDetail');
const metricNew = document.getElementById('metricNew');

function getLeads(){ return [...JSON.parse(localStorage.getItem('selfieDentalLeads') || '[]'), ...sampleLeads]; }
function esc(v=''){ return String(v).replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c])); }
function shortDate(v){ try { return new Intl.DateTimeFormat('es-EC',{day:'2-digit',month:'short'}).format(new Date(v)); } catch { return '—'; } }

function render(){
  const leads=getLeads();
  metricNew.textContent = leads.filter(l=>l.status==='Nuevo').length;
  pipeline.innerHTML = statusOrder.map(status => {
    const cards=leads.filter(l=>l.status===status);
    return `<div class="pipeline-col"><div class="pipeline-title"><span>${status}</span><span class="count-badge">${cards.length}</span></div>${cards.map(l=>`<div class="lead-card" data-id="${esc(l.id)}"><strong>${esc(l.name)}</strong><p>${esc(l.intent)}</p><div class="lead-meta"><span>${esc(l.source)}</span><span>${shortDate(l.createdAt)}</span></div></div>`).join('') || '<div style="padding:18px 8px;color:#9a939b;font-size:.72rem">Sin registros</div>'}</div>`;
  }).join('');
  table.innerHTML = leads.slice(0,8).map(l=>`<div class="lead-row" data-id="${esc(l.id)}"><strong>${esc(l.name)}</strong><span>${esc(l.intent)}</span><span>${esc(l.source)}</span><span class="status-pill">${esc(l.status)}</span></div>`).join('');
  document.querySelectorAll('[data-id]').forEach(el => el.addEventListener('click', () => showDetail(el.dataset.id)));
}

function showDetail(id){
  const lead=getLeads().find(l=>String(l.id)===String(id)); if(!lead) return;
  detail.innerHTML = `<p class="kicker">Ficha rápida</p><div class="detail-card"><h3>${esc(lead.name)}</h3><span>${esc(lead.intent)}</span><div class="detail-list"><div class="detail-row"><span>Estado</span><strong>${esc(lead.status)}</strong></div><div class="detail-row"><span>Origen</span><strong>${esc(lead.source)}</strong></div><div class="detail-row"><span>WhatsApp</span><strong>${esc(lead.phone)}</strong></div><div class="detail-row"><span>Horario</span><strong>${esc(lead.time||'—')}</strong></div><div class="detail-row"><span>Notas</span><strong>${esc(lead.notes||'Sin notas')}</strong></div></div><div class="detail-actions"><button onclick="advanceLead('${String(lead.id).replace(/'/g,'')}')">Avanzar estado</button><button onclick="alert('Demo: aquí abriríamos WhatsApp con el contexto del lead.')">Abrir WhatsApp</button></div></div>`;
}

window.advanceLead = function(id){
  const local=JSON.parse(localStorage.getItem('selfieDentalLeads')||'[]');
  const i=local.findIndex(l=>String(l.id)===String(id));
  if(i===-1){ alert('Los leads simulados son de solo lectura. Crea una solicitud desde la web para probar el cambio de estado.'); return; }
  const current=statusOrder.indexOf(local[i].status); local[i].status=statusOrder[Math.min(current+1,statusOrder.length-1)]; localStorage.setItem('selfieDentalLeads',JSON.stringify(local)); render(); showDetail(id);
}

document.getElementById('resetDemo').addEventListener('click',()=>{ localStorage.removeItem('selfieDentalLeads'); render(); detail.innerHTML='<p class="kicker">Ficha rápida</p><div class="empty-detail"><strong>Demo restablecida</strong><span>Crea una solicitud desde la web para verla aquí.</span></div>'; });
render();
