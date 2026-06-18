// js/estagios.js - Vagas de estágio com candidatura e cancelamento
console.log("[ESTAGIOS] Iniciando...");

// ====================== CONSTANTES E ELEMENTOS ======================
const STORAGE_KEY = 'estagios';
let currentUser = null;

// Elementos DOM
const listaEl = document.getElementById('estagioList');
const emptyStateEl = document.getElementById('emptyState');
const formContainer = document.getElementById('estagioFormContainer');
const btnOpenForm = document.getElementById('btnOpenForm');
const btnCancelForm = document.getElementById('btnCancelForm');
const estagioForm = document.getElementById('estagioForm');
const formTitle = document.getElementById('formTitle');

let vagas = [];
let editingId = null;

// ====================== FUNÇÕES AUXILIARES ======================
function loadCurrentUser() {
  const saved = localStorage.getItem('currentUser');
  if (saved) {
    currentUser = JSON.parse(saved);
  } else {
    currentUser = { id: 0, fullName: 'Visitante', isCAMember: false, isAdmin: false };
  }
  if (btnOpenForm) {
    btnOpenForm.style.display = (currentUser.isCAMember || currentUser.isAdmin) ? 'inline-block' : 'none';
  }
}

function hasPermissionToManage() {
  return currentUser && (currentUser.isCAMember === true || currentUser.isAdmin === true);
}

function loadVagas() {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored) {
    vagas = JSON.parse(stored);
  } else {
    vagas = [
      {
        id: Date.now() + 1,
        titulo: 'Desenvolvedor(a) React',
        empresa: 'TechStart',
        local: 'Remoto',
        tipo: 'Remoto',
        deadline: '2026-12-31',
        contato: 'https://link.com/vaga1',
        descricao: 'Estágio para desenvolvimento front-end com React. Bolsa R$ 1500 + benefícios.',
        criadoPor: 2,
        criadoEm: new Date().toISOString(),
        candidatos: []
      },
      {
        id: Date.now() + 2,
        titulo: 'Suporte de TI',
        empresa: 'InfoSolutions',
        local: 'Presencial - São Paulo',
        tipo: 'Presencial',
        deadline: '2025-12-01',
        contato: 'mailto:estagio@infosolutions.com',
        descricao: 'Atendimento a usuários, manutenção de hardware.',
        criadoPor: 2,
        criadoEm: new Date().toISOString(),
        candidatos: []
      }
    ];
    saveVagas();
  }
  renderVagas();
  updateDestaqueMiniList();
}

function saveVagas() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(vagas));
}

function isExpirada(vaga) {
  if (!vaga.deadline) return false;
  return new Date(vaga.deadline) < new Date();
}

function usuarioJaCandidatou(vaga) {
  return vaga.candidatos && vaga.candidatos.includes(currentUser.id);
}

// ====================== RENDERIZAÇÃO ======================
function renderVagas(filtro = 'all') {
  let filtered = [...vagas];
  if (filtro === 'ativas') {
    filtered = filtered.filter(v => !isExpirada(v));
  } else if (filtro === 'expiradas') {
    filtered = filtered.filter(v => isExpirada(v));
  }

  if (filtered.length === 0) {
    listaEl.innerHTML = '';
    emptyStateEl.style.display = 'block';
    return;
  }
  emptyStateEl.style.display = 'none';

  listaEl.innerHTML = filtered.map(vaga => {
    const expirada = isExpirada(vaga);
    const jaCandidatou = usuarioJaCandidatou(vaga);
    const cardClass = `event-card ${expirada ? 'expirada' : ''}`;
    const deadlineText = vaga.deadline ? `📅 Até ${formatDate(vaga.deadline)}` : '';
    return `
      <li class="${cardClass}" data-id="${vaga.id}">
        <div class="event-info" style="flex:1">
          <h3>${escapeHtml(vaga.titulo)} <span class="vaga-badge">${vaga.tipo}</span></h3>
          <div class="vaga-empresa">🏢 ${escapeHtml(vaga.empresa)}</div>
          <div class="vaga-meta">
            <span>📍 ${escapeHtml(vaga.local || 'Não informado')}</span>
            ${deadlineText ? `<span class="vaga-deadline">${deadlineText}</span>` : ''}
          </div>
          <div class="event-description">${escapeHtml(vaga.descricao.substring(0, 100))}${vaga.descricao.length > 100 ? '…' : ''}</div>
          <div class="event-actions">
            <button class="btn-details" data-action="details">🔍 Ver detalhes</button>
            ${!expirada && currentUser.id ? `
              ${!jaCandidatou ? 
                `<button class="btn-candidatar" data-action="apply">📝 Candidatar-se</button>` : 
                `<button class="btn-cancelar-candidatura" data-action="cancel">❌ Cancelar candidatura</button>`
              }
            ` : ''}
            ${expirada ? `<span class="vaga-badge" style="background:#3a1a1a;">⛔ Expirada</span>` : ''}
            ${hasPermissionToManage() ? `
              <button class="btn-edit" data-action="edit">✏️ Editar</button>
              <button class="btn-delete" data-action="delete">🗑️ Excluir</button>
            ` : ''}
          </div>
        </div>
      </li>
    `;
  }).join('');

  // Eventos dos botões
  document.querySelectorAll('.btn-details').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const card = btn.closest('.event-card');
      const id = parseInt(card.dataset.id);
      openModal(id);
    });
  });
  document.querySelectorAll('.btn-candidatar').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const card = btn.closest('.event-card');
      const id = parseInt(card.dataset.id);
      candidatarVaga(id);
    });
  });
  document.querySelectorAll('.btn-cancelar-candidatura').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const card = btn.closest('.event-card');
      const id = parseInt(card.dataset.id);
      cancelarCandidatura(id);
    });
  });
  if (hasPermissionToManage()) {
    document.querySelectorAll('.btn-edit').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const card = btn.closest('.event-card');
        const id = parseInt(card.dataset.id);
        openEditForm(id);
      });
    });
    document.querySelectorAll('.btn-delete').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const card = btn.closest('.event-card');
        const id = parseInt(card.dataset.id);
        if (confirm('Excluir esta vaga?')) deleteVaga(id);
      });
    });
  }
}

function updateDestaqueMiniList() {
  const destaqueContainer = document.getElementById('destaqueMiniList');
  if (!destaqueContainer) return;
  const ativas = vagas.filter(v => !isExpirada(v)).slice(0, 3);
  if (ativas.length === 0) {
    destaqueContainer.innerHTML = '<p class="empty-mini">Nenhuma vaga ativa no momento.</p>';
    return;
  }
  destaqueContainer.innerHTML = ativas.map(v => `
    <div class="mini-event-item">
      <strong>${escapeHtml(v.titulo)}</strong><br>
      <small>${escapeHtml(v.empresa)} • ${v.tipo}</small>
    </div>
  `).join('');
}

function candidatarVaga(id) {
  if (!currentUser.id) {
    if (confirm("É necessário estar logado para se candidatar. Deseja fazer login?")) {
      window.location.href = "login.html";
    }
    return;
  }
  const vaga = vagas.find(v => v.id === id);
  if (!vaga) return;
  if (isExpirada(vaga)) {
    alert('Esta vaga já está expirada.');
    return;
  }
  if (usuarioJaCandidatou(vaga)) {
    alert('Você já se candidatou a esta vaga.');
    return;
  }
  if (!vaga.candidatos) vaga.candidatos = [];
  vaga.candidatos.push(currentUser.id);
  saveVagas();
  alert('Candidatura realizada com sucesso! Boa sorte :)');
  renderVagas(document.querySelector('.filter-btn.active')?.dataset.filter || 'all');
  updateDestaqueMiniList();
}

function cancelarCandidatura(id) {
  if (!currentUser.id) return;
  const vaga = vagas.find(v => v.id === id);
  if (!vaga) return;
  if (!vaga.candidatos || !vaga.candidatos.includes(currentUser.id)) {
    alert('Você não está candidatado a esta vaga.');
    return;
  }
  vaga.candidatos = vaga.candidatos.filter(cid => cid !== currentUser.id);
  saveVagas();
  alert('Candidatura cancelada com sucesso.');
  renderVagas(document.querySelector('.filter-btn.active')?.dataset.filter || 'all');
  updateDestaqueMiniList();
}

// ====================== MODAL ======================
function openModal(id) {
  const vaga = vagas.find(v => v.id === id);
  if (!vaga) return;
  document.getElementById('modalTitulo').innerText = vaga.titulo;
  document.getElementById('modalEmpresa').innerHTML = `🏢 ${escapeHtml(vaga.empresa)}`;
  document.getElementById('modalLocalTipo').innerHTML = `📍 ${escapeHtml(vaga.local || 'Não informado')} • ${vaga.tipo}`;
  const deadline = vaga.deadline ? `⏳ Candidatura até ${formatDate(vaga.deadline)}` : '⏳ Sem data limite';
  document.getElementById('modalDeadline').innerHTML = deadline;
  document.getElementById('modalDescricao').innerHTML = escapeHtml(vaga.descricao).replace(/\n/g, '<br>');
  const contatoLink = document.getElementById('modalContatoLink');
  if (vaga.contato) {
    contatoLink.href = vaga.contato;
    contatoLink.style.display = 'inline-block';
    contatoLink.innerText = 'Candidatar-se via link';
  } else {
    contatoLink.style.display = 'none';
  }
  document.getElementById('estagioModal').style.display = 'flex';
  document.getElementById('closeModal').onclick = () => {
    document.getElementById('estagioModal').style.display = 'none';
  };
  window.onclick = (e) => {
    if (e.target === document.getElementById('estagioModal')) {
      document.getElementById('estagioModal').style.display = 'none';
    }
  };
}

// ====================== FORMULÁRIO (CRIAR/EDITAR) ======================
function openEditForm(id) {
  if (!hasPermissionToManage()) {
    alert('Apenas membros do CA ou administradores podem editar vagas.');
    return;
  }
  const vaga = vagas.find(v => v.id === id);
  if (!vaga) return;
  editingId = id;
  formTitle.innerText = 'Editar Vaga';
  document.getElementById('estagioTitulo').value = vaga.titulo;
  document.getElementById('estagioEmpresa').value = vaga.empresa;
  document.getElementById('estagioLocal').value = vaga.local || '';
  document.getElementById('estagioTipo').value = vaga.tipo;
  document.getElementById('estagioDeadline').value = vaga.deadline || '';
  document.getElementById('estagioContato').value = vaga.contato || '';
  document.getElementById('estagioDescricao').value = vaga.descricao;
  formContainer.style.display = 'block';
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function resetForm() {
  editingId = null;
  formTitle.innerText = 'Nova Vaga de Estágio';
  estagioForm.reset();
  formContainer.style.display = 'none';
}

function deleteVaga(id) {
  if (!hasPermissionToManage()) {
    alert('Apenas membros do CA ou administradores podem excluir vagas.');
    return;
  }
  vagas = vagas.filter(v => v.id !== id);
  saveVagas();
  renderVagas(document.querySelector('.filter-btn.active')?.dataset.filter || 'all');
  updateDestaqueMiniList();
}

// Eventos do formulário
estagioForm.addEventListener('submit', (e) => {
  e.preventDefault();
  if (!hasPermissionToManage()) {
    alert('Você não tem permissão para criar/editar vagas.');
    return;
  }
  const titulo = document.getElementById('estagioTitulo').value.trim();
  const empresa = document.getElementById('estagioEmpresa').value.trim();
  const local = document.getElementById('estagioLocal').value.trim();
  const tipo = document.getElementById('estagioTipo').value;
  const deadline = document.getElementById('estagioDeadline').value;
  const contato = document.getElementById('estagioContato').value.trim();
  const descricao = document.getElementById('estagioDescricao').value.trim();

  if (!titulo || !empresa) {
    alert('Título e empresa são obrigatórios.');
    return;
  }

  if (editingId) {
    const index = vagas.findIndex(v => v.id === editingId);
    if (index !== -1) {
      vagas[index] = {
        ...vagas[index],
        titulo, empresa, local, tipo, deadline, contato, descricao
      };
      saveVagas();
      alert('Vaga atualizada com sucesso!');
    }
  } else {
    const newVaga = {
      id: Date.now(),
      titulo, empresa, local, tipo, deadline, contato, descricao,
      criadoPor: currentUser.id,
      criadoEm: new Date().toISOString(),
      candidatos: []
    };
    vagas.push(newVaga);
    saveVagas();
    alert('Vaga criada com sucesso!');
  }
  resetForm();
  renderVagas(document.querySelector('.filter-btn.active')?.dataset.filter || 'all');
  updateDestaqueMiniList();
});

btnOpenForm.addEventListener('click', () => {
  if (!hasPermissionToManage()) {
    alert('Apenas membros do CA ou administradores podem criar vagas de estágio.');
    return;
  }
  resetForm();
  formContainer.style.display = 'block';
});

btnCancelForm.addEventListener('click', resetForm);

// Filtros
document.querySelectorAll('.filter-btn').forEach(btn => {
  btn.addEventListener('click', (e) => {
    document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    renderVagas(btn.dataset.filter);
  });
});

// Helper
function formatDate(dateStr) {
  if (!dateStr) return '';
  const [year, month, day] = dateStr.split('-');
  return `${day}/${month}/${year}`;
}

function escapeHtml(str) {
  if (!str) return '';
  return str.replace(/[&<>]/g, function(m) {
    if (m === '&') return '&amp;';
    if (m === '<') return '&lt;';
    if (m === '>') return '&gt;';
    return m;
  });
}

// Inicialização
loadCurrentUser();
loadVagas();

window.addEventListener('storage', (e) => {
  if (e.key === 'currentUser') {
    loadCurrentUser();
    loadVagas();
  }
});