// js/painel-ca.js
(function() {
  const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
  if (!currentUser.isCAMember && !currentUser.isAdmin) {
    alert("Acesso negado. Esta área é restrita a membros do CA.");
    window.location.href = 'feed.html';
    return;
  }

  function carregarDenuncias() {
    const denuncias = JSON.parse(localStorage.getItem('denuncias') || '[]');
    const pendentes = denuncias.filter(d => d.status === 'pendente');
    const resolvidas = denuncias.filter(d => d.status === 'resolvida');
    document.getElementById('pendentesCount').innerText = pendentes.length;
    document.getElementById('resolvidasCount').innerText = resolvidas.length;
    
    // Aba Pendentes
    const listaPendentes = document.getElementById('denunciasPendentesList');
    if (pendentes.length === 0) {
      listaPendentes.innerHTML = '<div class="empty-state">Nenhuma denúncia pendente.</div>';
    } else {
      listaPendentes.innerHTML = '';
      pendentes.forEach(denuncia => {
        const div = criarCardDenuncia(denuncia, false);
        listaPendentes.appendChild(div);
      });
    }
    
    // Aba Resolvidas
    const listaResolvidas = document.getElementById('denunciasResolvidasList');
    if (resolvidas.length === 0) {
      listaResolvidas.innerHTML = '<div class="empty-state">Nenhuma denúncia resolvida.</div>';
    } else {
      listaResolvidas.innerHTML = '';
      resolvidas.forEach(denuncia => {
        const div = criarCardDenuncia(denuncia, true);
        listaResolvidas.appendChild(div);
      });
    }
  }
  
  function criarCardDenuncia(denuncia, isResolvida) {
    const div = document.createElement('div');
    div.className = 'denuncia-item';
    div.dataset.id = denuncia.id;
    div.innerHTML = `
      <div class="denuncia-info">
        <strong>ID: ${denuncia.id}</strong><br>
        Tipo: ${denuncia.tipo} (ID: ${denuncia.itemId})<br>
        Motivo: ${denuncia.motivo}<br>
        Data: ${new Date(denuncia.data).toLocaleString()}
        ${isResolvida ? `<br><strong>Descrição da resolução:</strong> ${denuncia.descricaoResolucao || '—'}` : ''}
      </div>
      <div class="denuncia-actions">
        <button class="visualizar-btn">👁️ Visualizar</button>
        ${!isResolvida ? `<button class="resolver-btn">✅ Resolver</button>` : ''}
      </div>
    `;
    div.querySelector('.visualizar-btn').onclick = () => visualizarDenuncia(denuncia);
    if (!isResolvida) {
      div.querySelector('.resolver-btn').onclick = () => resolverDenuncia(denuncia.id);
    }
    return div;
  }
  
  function visualizarDenuncia(denuncia) {
    if (denuncia.tipo === 'post') {
      window.open(`feed.html?highlight=post-${denuncia.itemId}`, '_blank');
    } else if (denuncia.tipo === 'profile') {
      window.open(`perfil.html?id=${denuncia.itemId}`, '_blank');
    } else if (denuncia.tipo === 'comment') {
      window.open(`feed.html`, '_blank');
      alert("Visualização de comentário: vá até o post ID " + denuncia.postId);
    }
  }
  
  function resolverDenuncia(id) {
    let denuncias = JSON.parse(localStorage.getItem('denuncias') || '[]');
    const index = denuncias.findIndex(d => d.id === id);
    if (index !== -1) {
      const descricao = prompt("Descreva a ação tomada para resolver esta denúncia:");
      if (descricao && descricao.trim()) {
        denuncias[index].status = 'resolvida';
        denuncias[index].descricaoResolucao = descricao.trim();
        localStorage.setItem('denuncias', JSON.stringify(denuncias));
        carregarDenuncias();
        alert("Denúncia resolvida com sucesso!");
      } else {
        alert("É necessário fornecer uma descrição da resolução.");
      }
    }
  }
  
  // Abas no painel CA
  function initTabs() {
    const tabPendentes = document.getElementById('tabPendentes');
    const tabResolvidas = document.getElementById('tabResolvidas');
    const divPendentes = document.getElementById('divPendentes');
    const divResolvidas = document.getElementById('divResolvidas');
    if (tabPendentes && tabResolvidas) {
      tabPendentes.addEventListener('click', () => {
        tabPendentes.classList.add('active');
        tabResolvidas.classList.remove('active');
        divPendentes.style.display = 'block';
        divResolvidas.style.display = 'none';
      });
      tabResolvidas.addEventListener('click', () => {
        tabResolvidas.classList.add('active');
        tabPendentes.classList.remove('active');
        divResolvidas.style.display = 'block';
        divPendentes.style.display = 'none';
      });
    }
  }
  
  document.getElementById('refreshBtn')?.addEventListener('click', carregarDenuncias);
  document.addEventListener('DOMContentLoaded', () => {
    initTabs();
    carregarDenuncias();
  });
})();