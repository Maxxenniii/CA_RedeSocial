// js/eventos.js - Eventos do CA com permissões, participantes únicos e persistência
console.log("[EVENTOS] Iniciando...");

// ====================== DADOS GLOBAIS ======================
const STORAGE_KEY = 'eventosData';
let eventsData = [];
let currentUser = null;

// Elementos DOM
const eventList = document.getElementById('eventList');
const emptyState = document.getElementById('emptyState');
const filterBtns = document.querySelectorAll('.filter-btn');
const btnOpenForm = document.getElementById('btnOpenForm');
const btnCancelForm = document.getElementById('btnCancelForm');
const eventFormContainer = document.getElementById('eventFormContainer');
const eventForm = document.getElementById('eventForm');
const upcomingMiniList = document.getElementById('upcomingMiniList');
const eventModal = document.getElementById('eventModal');
const closeModal = document.getElementById('closeModal');
const eventLimitCheck = document.getElementById('eventLimitCheck');
const maxParticipantsGroup = document.getElementById('maxParticipantsGroup');
const eventMaxParticipantsInput = document.getElementById('eventMaxParticipants');

let currentFilter = 'all';

// ====================== FUNÇÕES AUXILIARES ======================
function loadCurrentUser() {
  const saved = localStorage.getItem('currentUser');
  if (saved) {
    currentUser = JSON.parse(saved);
  } else {
    currentUser = { id: 0, fullName: 'Visitante', isCAMember: false, isAdmin: false };
  }
  // Mostrar botão "Novo Evento" apenas para CA ou Admin
  if (btnOpenForm) {
    btnOpenForm.style.display = (currentUser.isCAMember || currentUser.isAdmin) ? 'inline-block' : 'none';
  }
}

function hasPermissionToManage() {
  return currentUser && (currentUser.isCAMember === true || currentUser.isAdmin === true);
}

function loadEvents() {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored) {
    eventsData = JSON.parse(stored);
    // Atualizar isPast para eventos antigos
    const today = new Date().toISOString().split('T')[0];
    eventsData.forEach(ev => {
      ev.isPast = ev.date < today;
    });
  } else {
    // Dados iniciais de exemplo
    eventsData = [
      {
        id: 1,
        title: 'Workshop de React',
        date: '2026-06-15',
        time: '14:00',
        location: 'Laboratório 5',
        description: 'Introdução prática ao React e hooks. Traga seu notebook!',
        participants: [],
        maxParticipants: 30,
        isPast: false
      },
      {
        id: 2,
        title: 'Assembleia Geral do CA',
        date: '2026-05-20',
        time: '18:30',
        location: 'Auditório Central',
        description: 'Pauta: eleição de novos representantes e planejamento semestral.',
        participants: [],
        maxParticipants: 0,
        isPast: true
      },
      {
        id: 3,
        title: 'Palestra: Carreira em Dados',
        date: '2026-07-10',
        time: '19:00',
        location: 'Online (Zoom)',
        description: 'Profissional convidado do Mercado Livre fala sobre oportunidades na área.',
        participants: [],
        maxParticipants: 0,
        isPast: false
      }
    ];
    saveEvents();
  }
  renderEvents();
  renderUpcomingMini();
}

function saveEvents() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(eventsData));
}

function formatDate(dateStr) {
  const [year, month, day] = dateStr.split('-');
  const date = new Date(year, month - 1, day);
  const monthNames = ['JAN', 'FEV', 'MAR', 'ABR', 'MAI', 'JUN', 'JUL', 'AGO', 'SET', 'OUT', 'NOV', 'DEZ'];
  return {
    day: day,
    month: monthNames[date.getMonth()],
    full: `${day}/${month}/${year}`
  };
}

function usuarioJaParticipa(evento) {
  return evento.participants && evento.participants.includes(currentUser.id);
}

// ====================== RENDERIZAÇÃO ======================
function renderEvents() {
  let filtered = eventsData.filter(ev => {
    if (currentFilter === 'upcoming') return !ev.isPast;
    if (currentFilter === 'past') return ev.isPast;
    return true;
  });

  eventList.innerHTML = '';

  if (filtered.length === 0) {
    emptyState.style.display = 'block';
  } else {
    emptyState.style.display = 'none';
    filtered.forEach(ev => {
      const { day, month } = formatDate(ev.date);
      const limited = ev.maxParticipants > 0;
      const currentParticipants = ev.participants?.length || 0;
      const full = limited && currentParticipants >= ev.maxParticipants;
      const jaParticipa = usuarioJaParticipa(ev);
      
      const card = document.createElement('li');
      card.className = `event-card ${ev.isPast ? 'past' : 'upcoming'}`;
      card.innerHTML = `
        <div class="event-date-badge">
          <span class="day">${day}</span>
          <span class="month">${month}</span>
        </div>
        <div class="event-info">
          <h3>${escapeHtml(ev.title)}</h3>
          <div class="event-meta">
            <span>⏰ ${ev.time}</span>
            <span>📍 ${escapeHtml(ev.location)}</span>
            <span>👥 ${currentParticipants}${limited ? `/${ev.maxParticipants}` : ''} ${full ? '🔴 Lotado' : ''}</span>
          </div>
          <div class="event-actions">
            ${!ev.isPast && !full && !jaParticipa && currentUser.id ? 
              `<button class="btn-participate" data-id="${ev.id}">✅ Participar</button>` : ''}
            ${jaParticipa && !ev.isPast && !full ? 
              `<button class="btn-cancelar" data-id="${ev.id}">❌ Cancelar participação</button>` : ''}
            ${!ev.isPast && full ? 
              `<span class="lotado-tag">Evento lotado</span>` : ''}
            <button class="btn-details" data-id="${ev.id}">🔍 Detalhes</button>
            ${hasPermissionToManage() ? `
              <button class="btn-edit" data-id="${ev.id}">✏️ Editar</button>
              <button class="btn-delete" data-id="${ev.id}">🗑️ Excluir</button>
            ` : ''}
          </div>
        </div>
      `;

      // Eventos dos botões
      const participateBtn = card.querySelector('.btn-participate');
      if (participateBtn) participateBtn.addEventListener('click', () => participateEvent(ev.id));
      
      const cancelarBtn = card.querySelector('.btn-cancelar');
      if (cancelarBtn) cancelarBtn.addEventListener('click', () => cancelarParticipacao(ev.id));
      
      card.querySelector('.btn-details').addEventListener('click', () => openEventModal(ev));
      
      if (hasPermissionToManage()) {
        card.querySelector('.btn-edit')?.addEventListener('click', () => openEditForm(ev.id));
        card.querySelector('.btn-delete')?.addEventListener('click', () => {
          if (confirm('Excluir este evento?')) deleteEvent(ev.id);
        });
      }
      
      eventList.appendChild(card);
    });
  }
}

function renderUpcomingMini() {
  const upcoming = eventsData.filter(ev => !ev.isPast).slice(0, 3);
  upcomingMiniList.innerHTML = upcoming.map(ev => {
    const limited = ev.maxParticipants > 0;
    const currentParticipants = ev.participants?.length || 0;
    const vagas = limited ? ` (${currentParticipants}/${ev.maxParticipants})` : '';
    return `
      <div class="mini-event-item">
        <strong>${escapeHtml(ev.title)}</strong>
        <small>${formatDate(ev.date).full} às ${ev.time}${vagas}</small>
      </div>`;
  }).join('');
}

// ====================== PARTICIPAÇÃO ======================
function participateEvent(id) {
  if (!currentUser.id) {
    if (confirm("É necessário estar logado para participar. Deseja fazer login?")) {
      window.location.href = "login.html";
    }
    return;
  }
  const event = eventsData.find(ev => ev.id === id);
  if (!event) return;
  if (event.isPast) {
    alert("Evento já passou.");
    return;
  }
  if (event.maxParticipants > 0 && (event.participants?.length || 0) >= event.maxParticipants) {
    alert(`"${event.title}" já está lotado!`);
    return;
  }
  if (usuarioJaParticipa(event)) {
    alert("Você já está participando deste evento.");
    return;
  }
  if (!event.participants) event.participants = [];
  event.participants.push(currentUser.id);
  saveEvents();
  renderEvents();
  renderUpcomingMini();
  alert(`✅ Você está participando de "${event.title}"!`);
}

function cancelarParticipacao(id) {
  if (!currentUser.id) return;
  const event = eventsData.find(ev => ev.id === id);
  if (!event) return;
  if (!event.participants || !event.participants.includes(currentUser.id)) {
    alert("Você não está participando deste evento.");
    return;
  }
  event.participants = event.participants.filter(pid => pid !== currentUser.id);
  saveEvents();
  renderEvents();
  renderUpcomingMini();
  alert(`❌ Participação cancelada em "${event.title}".`);
}

// ====================== MODAL DE DETALHES ======================
function openEventModal(event) {
  const { full } = formatDate(event.date);
  document.getElementById('modalTitle').textContent = event.title;
  document.getElementById('modalDateTime').innerHTML = `📅 ${full} às ${event.time}`;
  document.getElementById('modalLocation').innerHTML = `📍 ${event.location}`;
  const currentParticipants = event.participants?.length || 0;
  let capacityText = '';
  if (event.maxParticipants > 0) {
    const remaining = event.maxParticipants - currentParticipants;
    capacityText = `👥 ${currentParticipants}/${event.maxParticipants} (${remaining} vagas restantes)`;
  } else {
    capacityText = `👥 ${currentParticipants} participantes (vagas ilimitadas)`;
  }
  document.getElementById('modalCapacity').innerHTML = capacityText;
  document.getElementById('modalDescription').innerHTML = escapeHtml(event.description);
  eventModal.style.display = 'flex';
}

closeModal.addEventListener('click', () => { eventModal.style.display = 'none'; });
eventModal.addEventListener('click', (e) => { if (e.target === eventModal) eventModal.style.display = 'none'; });

// ====================== FORMULÁRIO (CRIAR/EDITAR) ======================
let editingEventId = null;

function openEditForm(id) {
  if (!hasPermissionToManage()) {
    alert("Apenas membros do CA ou administradores podem editar eventos.");
    return;
  }
  const event = eventsData.find(ev => ev.id === id);
  if (!event) return;
  editingEventId = id;
  document.querySelector('#eventFormContainer h3').innerText = 'Editar Evento';
  document.getElementById('eventTitle').value = event.title;
  document.getElementById('eventDate').value = event.date;
  document.getElementById('eventTime').value = event.time;
  document.getElementById('eventLocation').value = event.location;
  document.getElementById('eventDescription').value = event.description;
  const hasLimit = event.maxParticipants > 0;
  eventLimitCheck.checked = hasLimit;
  maxParticipantsGroup.style.display = hasLimit ? 'block' : 'none';
  if (hasLimit) document.getElementById('eventMaxParticipants').value = event.maxParticipants;
  eventFormContainer.style.display = 'block';
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function resetForm() {
  editingEventId = null;
  document.querySelector('#eventFormContainer h3').innerText = 'Novo Evento';
  eventForm.reset();
  eventLimitCheck.checked = false;
  maxParticipantsGroup.style.display = 'none';
  eventFormContainer.style.display = 'none';
}

function deleteEvent(id) {
  if (!hasPermissionToManage()) {
    alert("Apenas membros do CA ou administradores podem excluir eventos.");
    return;
  }
  eventsData = eventsData.filter(ev => ev.id !== id);
  saveEvents();
  renderEvents();
  renderUpcomingMini();
}

// Eventos do formulário
eventLimitCheck.addEventListener('change', function() {
  maxParticipantsGroup.style.display = this.checked ? 'block' : 'none';
  if (!this.checked) eventMaxParticipantsInput.value = '';
});

eventForm.addEventListener('submit', (e) => {
  e.preventDefault();
  if (!hasPermissionToManage()) {
    alert("Você não tem permissão para criar/editar eventos.");
    return;
  }
  const title = document.getElementById('eventTitle').value.trim();
  const date = document.getElementById('eventDate').value;
  const time = document.getElementById('eventTime').value;
  const location = document.getElementById('eventLocation').value.trim();
  const description = document.getElementById('eventDescription').value.trim();
  let maxParticipants = 0;
  if (eventLimitCheck.checked) {
    maxParticipants = parseInt(eventMaxParticipantsInput.value, 10);
    if (isNaN(maxParticipants) || maxParticipants < 1) {
      alert('Informe um número válido de vagas.');
      return;
    }
  }
  if (!title || !date || !time) {
    alert('Preencha título, data e hora!');
    return;
  }
  const today = new Date().toISOString().split('T')[0];
  const isPast = date < today;

  if (editingEventId) {
    const index = eventsData.findIndex(ev => ev.id === editingEventId);
    if (index !== -1) {
      eventsData[index] = {
        ...eventsData[index],
        title, date, time, location: location || 'A definir',
        description: description || 'Sem descrição',
        maxParticipants,
        isPast
      };
      saveEvents();
      alert('Evento atualizado com sucesso!');
    }
  } else {
    const newEvent = {
      id: Date.now(),
      title, date, time,
      location: location || 'A definir',
      description: description || 'Sem descrição',
      participants: [],
      maxParticipants,
      isPast
    };
    eventsData.push(newEvent);
    saveEvents();
    alert('Evento criado com sucesso!');
  }
  resetForm();
  renderEvents();
  renderUpcomingMini();
});

btnOpenForm.addEventListener('click', () => {
  if (!hasPermissionToManage()) {
    alert("Apenas membros do CA ou administradores podem criar eventos.");
    return;
  }
  resetForm();
  eventFormContainer.style.display = 'block';
});
btnCancelForm.addEventListener('click', resetForm);

// Filtros
filterBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    filterBtns.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    currentFilter = btn.dataset.filter;
    renderEvents();
  });
});

function escapeHtml(str) {
  if (!str) return '';
  return str.replace(/[&<>]/g, (m) => {
    if (m === '&') return '&amp;';
    if (m === '<') return '&lt;';
    if (m === '>') return '&gt;';
    return m;
  });
}

// Inicialização
loadCurrentUser();
loadEvents();

// Observar mudanças no usuário (login/logout)
window.addEventListener('storage', (e) => {
  if (e.key === 'currentUser') {
    loadCurrentUser();
    loadEvents();
  }
});