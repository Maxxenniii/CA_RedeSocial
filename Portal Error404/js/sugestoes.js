// js/sugestoes.js - Sugestões de usuários reais para seguir
(function() {
  let currentUser = null;
  let container = null;

  function loadCurrentUser() {
    const saved = localStorage.getItem('currentUser');
    currentUser = saved ? JSON.parse(saved) : null;
  }

  function getSuggestions() {
    if (!window.usersData || !currentUser) return [];
    // Retorna todos os usuários exceto o próprio e os que já segue
    return window.usersData.filter(u => 
      u.id !== currentUser.id && 
      !(currentUser.following || []).includes(u.id)
    );
  }

  function renderSuggestions() {
    if (!container) {
      container = document.getElementById('suggestionsList');
      if (!container) {
        console.warn('Aguardando container #suggestionsList...');
        setTimeout(renderSuggestions, 200);
        return;
      }
    }

    loadCurrentUser();
    const suggestions = getSuggestions();

    if (!window.usersData || window.usersData.length === 0) {
      container.innerHTML = '<div class="suggestion-empty">Nenhum usuário cadastrado.</div>';
      return;
    }

    if (suggestions.length === 0) {
      container.innerHTML = '<div class="suggestion-empty">Nenhuma sugestão no momento.</div>';
      return;
    }

    let html = '';
    for (let s of suggestions) {
      html += `
        <div class="suggestion-item" data-id="${s.id}">
          ${s.avatarUrl 
            ? `<img src="${s.avatarUrl}" class="suggestion-avatar-img" style="width:40px;height:40px;border-radius:50%;object-fit:cover;">` 
            : `<div class="suggestion-avatar">${escapeHtml(s.fullName.charAt(0))}</div>`
          }
          <div class="suggestion-info">
            <strong>${escapeHtml(s.fullName)}</strong>
            <small>${s.isCAMember ? 'Membro CA' : 'Aluno'}</small>
          </div>
          <button class="follow-btn">Seguir</button>
        </div>
      `;
    }
    container.innerHTML = html;

    // Eventos dos botões
    document.querySelectorAll('.suggestion-item .follow-btn').forEach(btn => {
      btn.removeEventListener('click', handleFollow);
      btn.addEventListener('click', handleFollow);
    });
  }

  function handleFollow(e) {
    const btn = e.currentTarget;
    const item = btn.closest('.suggestion-item');
    const userId = parseInt(item.dataset.id);
    if (!currentUser) return;
    if (!currentUser.following) currentUser.following = [];
    
    // Verifica se já segue
    if (currentUser.following.includes(userId)) {
      // Deixar de seguir
      currentUser.following = currentUser.following.filter(id => id !== userId);
      // Remove dos seguidores do alvo
      const target = window.usersData.find(u => u.id === userId);
      if (target && target.followers) {
        target.followers = target.followers.filter(id => id !== currentUser.id);
        localStorage.setItem('usersData', JSON.stringify(window.usersData));
      }
    } else {
      // Seguir
      currentUser.following.push(userId);
      // Adiciona aos seguidores do alvo
      const target = window.usersData.find(u => u.id === userId);
      if (target) {
        if (!target.followers) target.followers = [];
        if (!target.followers.includes(currentUser.id)) target.followers.push(currentUser.id);
        localStorage.setItem('usersData', JSON.stringify(window.usersData));
      }
    }
    localStorage.setItem('currentUser', JSON.stringify(currentUser));
    notifyFollowChanged();
    renderSuggestions(); // recarrega a lista
  }

  function init() {
    loadCurrentUser();
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => {
        container = document.getElementById('suggestionsList');
        renderSuggestions();
      });
    } else {
      container = document.getElementById('suggestionsList');
      renderSuggestions();
    }
    window.addEventListener('followChanged', () => {
      loadCurrentUser();
      renderSuggestions();
    });
    window.addEventListener('storage', (e) => {
      if (e.key === 'usersData' || e.key === 'currentUser') {
        loadCurrentUser();
        renderSuggestions();
      }
    });
  }

  init();
})();