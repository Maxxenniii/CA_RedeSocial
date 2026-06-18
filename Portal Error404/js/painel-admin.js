// js/painel-admin.js
(function() {
  const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
  // Verifica se é admin (pode definir um usuário admin manualmente no login)
  if (!currentUser.isAdmin) {
    alert("Acesso negado. Esta área é restrita a administradores.");
    window.location.href = 'feed.html';
    return;
  }

  let usuarios = [];
  let denuncias = [];
  let currentDenunciaFilter = 'pendentes';

  // Carregar dados do localStorage
  function carregarDados() {
    usuarios = JSON.parse(localStorage.getItem('usersData') || '[]');
    denuncias = JSON.parse(localStorage.getItem('denuncias') || '[]');
    window.postsData = JSON.parse(localStorage.getItem('postsData') || '[]');
  }

  // ========== ABA USUÁRIOS ==========
  function renderizarUsuarios(filtro = '') {
    const tbody = document.getElementById('usuariosTableBody');
    if (!tbody) return;
    let lista = [...usuarios];
    if (filtro) {
      const lower = filtro.toLowerCase();
      lista = lista.filter(u => u.fullName.toLowerCase().includes(lower) || (u.username && u.username.toLowerCase().includes(lower)));
    }
    tbody.innerHTML = '';
    lista.forEach(user => {
      const row = tbody.insertRow();
      row.insertCell(0).innerText = user.id;
      row.insertCell(1).innerText = user.fullName;
      row.insertCell(2).innerText = user.username || '-';
      row.insertCell(3).innerText = user.email || '-';
      row.insertCell(4).innerHTML = user.isCAMember ? '✅ Sim' : '❌ Não';
      row.insertCell(5).innerHTML = user.isBanned ? '🚫 Banido' : '✅ Ativo';
      const acoes = row.insertCell(6);
      
      // Botão promover/rebaixar CA
      const btnCA = document.createElement('button');
      btnCA.innerText = user.isCAMember ? 'Rebaixar CA' : 'Promover a CA';
      btnCA.className = user.isCAMember ? '' : 'promover';
      btnCA.onclick = () => toggleCAMember(user.id);
      acoes.appendChild(btnCA);
      
      // Botão banir/desbanir
      const btnBan = document.createElement('button');
      btnBan.innerText = user.isBanned ? 'Desbanir' : 'Banir';
      btnBan.className = user.isBanned ? 'restaurar' : 'banir';
      btnBan.onclick = () => toggleBan(user.id);
      acoes.appendChild(btnBan);
    });
  }

  function toggleCAMember(userId) {
    const user = usuarios.find(u => u.id === userId);
    if (user) {
      user.isCAMember = !user.isCAMember;
      if (user.isCAMember && !user.cargoCA) user.cargoCA = 'Membro CA';
      else if (!user.isCAMember) user.cargoCA = '';
      localStorage.setItem('usersData', JSON.stringify(usuarios));
      if (currentUser.id === userId) {
        currentUser.isCAMember = user.isCAMember;
        localStorage.setItem('currentUser', JSON.stringify(currentUser));
      }
      renderizarUsuarios(document.getElementById('searchUser')?.value || '');
      alert(`Usuário ${user.fullName} agora ${user.isCAMember ? 'é membro do CA' : 'não é mais membro do CA'}.`);
    }
  }

  function toggleBan(userId) {
    const user = usuarios.find(u => u.id === userId);
    if (user) {
      user.isBanned = !user.isBanned;
      localStorage.setItem('usersData', JSON.stringify(usuarios));
      if (currentUser.id === userId) {
        currentUser.isBanned = user.isBanned;
        localStorage.setItem('currentUser', JSON.stringify(currentUser));
        if (user.isBanned) {
          alert("Você foi banido! Será redirecionado.");
          window.location.href = 'fedd_nao_logado.html';
        }
      }
      renderizarUsuarios(document.getElementById('searchUser')?.value || '');
      alert(`Usuário ${user.fullName} ${user.isBanned ? 'banido' : 'desbanido'}.`);
    }
  }

  // ========== ABA DENÚNCIAS ==========
  function renderizarDenunciasAdmin() {
    const container = document.getElementById('denunciasAdminList');
    if (!container) return;
    let lista = denuncias.filter(d => currentDenunciaFilter === 'pendentes' ? d.status === 'pendente' : d.status === 'resolvida');
    if (lista.length === 0) {
      container.innerHTML = '<div class="empty-state">Nenhuma denúncia encontrada.</div>';
      return;
    }
    container.innerHTML = '';
    lista.forEach(denuncia => {
      const div = document.createElement('div');
      div.className = `denuncia-item-admin ${denuncia.status === 'resolvida' ? 'resolvida' : ''}`;
      div.innerHTML = `
        <div><strong>ID:</strong> ${denuncia.id}</div>
        <div><strong>Tipo:</strong> ${denuncia.tipo} (ID ${denuncia.itemId})</div>
        <div><strong>Motivo:</strong> ${denuncia.motivo}</div>
        <div><strong>Data:</strong> ${new Date(denuncia.data).toLocaleString()}</div>
        ${denuncia.status === 'resolvida' ? `<div><strong>Resolução:</strong> ${denuncia.descricaoResolucao || '—'}</div>` : ''}
        <div class="denuncia-actions">
          <button class="visualizar-denuncia" data-id="${denuncia.id}">👁️ Visualizar</button>
          ${denuncia.status === 'pendente' ? `<button class="resolver-denuncia" data-id="${denuncia.id}">✅ Resolver (admin)</button>` : ''}
        </div>
      `;
      container.appendChild(div);
    });
    document.querySelectorAll('.visualizar-denuncia').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = parseInt(btn.dataset.id);
        const den = denuncias.find(d => d.id === id);
        if (den) visualizarDenuncia(den);
      });
    });
    document.querySelectorAll('.resolver-denuncia').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = parseInt(btn.dataset.id);
        resolverDenunciaAdmin(id);
      });
    });
  }

  function visualizarDenuncia(denuncia) {
    if (denuncia.tipo === 'post') {
      window.open(`feed.html?highlight=post-${denuncia.itemId}`, '_blank');
    } else if (denuncia.tipo === 'profile') {
      window.open(`perfil.html?id=${denuncia.itemId}`, '_blank');
    } else {
      alert("Visualização de comentário: abra o feed manualmente.");
    }
  }

  function resolverDenunciaAdmin(id) {
    const descricao = prompt("Descreva a ação tomada para resolver esta denúncia:");
    if (descricao && descricao.trim()) {
      const index = denuncias.findIndex(d => d.id === id);
      if (index !== -1) {
        denuncias[index].status = 'resolvida';
        denuncias[index].descricaoResolucao = descricao.trim();
        localStorage.setItem('denuncias', JSON.stringify(denuncias));
        renderizarDenunciasAdmin();
        alert("Denúncia resolvida!");
        atualizarAlertas();
      }
    }
  }

  // ========== RELATÓRIOS E MÉTRICAS ==========
  function atualizarMetricas() {
    const totalUsers = usuarios.length;
    const totalPosts = window.postsData.length;
    let totalComments = 0;
    window.postsData.forEach(post => {
      totalComments += (post.comments?.length || 0);
    });
    const denunciasPendentes = denuncias.filter(d => d.status === 'pendente').length;
    document.getElementById('totalUsers').innerText = totalUsers;
    document.getElementById('totalPosts').innerText = totalPosts;
    document.getElementById('totalComments').innerText = totalComments;
    document.getElementById('totalDenuncias').innerText = denunciasPendentes;
  }

  function gerarRelatorio() {
    const div = document.getElementById('relatorioDetalhado');
    const relatorio = {
      data: new Date().toISOString(),
      usuarios: usuarios.map(u => ({ id: u.id, nome: u.fullName, email: u.email, isCAMember: u.isCAMember, isBanned: u.isBanned })),
      totalPosts: window.postsData.length,
      denuncias: denuncias
    };
    div.innerHTML = `<pre>${JSON.stringify(relatorio, null, 2)}</pre>`;
    div.style.display = 'block';
  }

  // ========== CONFIGURAÇÕES GLOBAIS ==========
  function toggleManutencao() {
    let manutencao = localStorage.getItem('manutencaoSite') === 'true';
    manutencao = !manutencao;
    localStorage.setItem('manutencaoSite', manutencao);
    document.getElementById('manutencaoStatus').innerText = `Status: ${manutencao ? 'ATIVADO' : 'Desativado'}`;
    alert(`Modo manutenção ${manutencao ? 'ativado' : 'desativado'}.`);
  }

  function limparCache() {
    if (confirm("ATENÇÃO: Isso apagará todos os dados do sistema (posts, usuários, denúncias). Deseja continuar?")) {
      localStorage.clear();
      alert("Cache limpo. A página será recarregada.");
      window.location.reload();
    }
  }

  function exportarDados() {
    const dados = {
      usersData: usuarios,
      postsData: window.postsData,
      denuncias: denuncias,
      exportadoEm: new Date().toISOString()
    };
    const blob = new Blob([JSON.stringify(dados, null, 2)], {type: 'application/json'});
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `portal404_backup_${Date.now()}.json`;
    link.click();
    URL.revokeObjectURL(link.href);
  }

  // ========== ALERTAS LATERAL ==========
  function atualizarAlertas() {
    const pendentes = denuncias.filter(d => d.status === 'pendente').length;
    const container = document.getElementById('adminAlertas');
    if (pendentes > 0) {
      container.innerHTML = `<p class="alert-item" style="color:var(--error);">🚨 ${pendentes} denúncia(s) pendente(s) aguardando ação!</p>`;
    } else {
      container.innerHTML = `<p class="alert-item">✅ Nenhuma denúncia pendente.</p>`;
    }
  }

  // ========== INICIALIZAÇÃO DAS ABAS ==========
  function initTabs() {
    const tabs = document.querySelectorAll('.admin-tab');
    const panels = document.querySelectorAll('.admin-panel');
    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        const target = tab.dataset.tab;
        tabs.forEach(t => t.classList.remove('active'));
        panels.forEach(p => p.classList.remove('active'));
        tab.classList.add('active');
        document.getElementById(`tab${target.charAt(0).toUpperCase() + target.slice(1)}`).classList.add('active');
        if (target === 'relatorios') atualizarMetricas();
      });
    });
  }

  document.addEventListener('DOMContentLoaded', () => {
    carregarDados();
    initTabs();
    renderizarUsuarios();
    renderizarDenunciasAdmin();
    atualizarMetricas();
    atualizarAlertas();

    // Eventos da aba usuários
    document.getElementById('searchUserBtn')?.addEventListener('click', () => {
      renderizarUsuarios(document.getElementById('searchUser').value);
    });
    document.getElementById('searchUser')?.addEventListener('keyup', (e) => {
      if (e.key === 'Enter') renderizarUsuarios(e.target.value);
    });

    // Filtros de denúncias
    document.getElementById('filterDenunciasPendentes')?.addEventListener('click', () => {
      currentDenunciaFilter = 'pendentes';
      document.getElementById('filterDenunciasPendentes').classList.add('active');
      document.getElementById('filterDenunciasResolvidas').classList.remove('active');
      renderizarDenunciasAdmin();
    });
    document.getElementById('filterDenunciasResolvidas')?.addEventListener('click', () => {
      currentDenunciaFilter = 'resolvidas';
      document.getElementById('filterDenunciasResolvidas').classList.add('active');
      document.getElementById('filterDenunciasPendentes').classList.remove('active');
      renderizarDenunciasAdmin();
    });

    // Relatórios
    document.getElementById('gerarRelatorioBtn')?.addEventListener('click', gerarRelatorio);

    // Configurações
    const manutencaoStatus = localStorage.getItem('manutencaoSite') === 'true';
    document.getElementById('manutencaoStatus').innerText = `Status: ${manutencaoStatus ? 'ATIVADO' : 'Desativado'}`;
    document.getElementById('toggleManutencaoBtn')?.addEventListener('click', toggleManutencao);
    document.getElementById('limparCacheBtn')?.addEventListener('click', limparCache);
    document.getElementById('exportarDadosBtn')?.addEventListener('click', exportarDados);
  });
})();