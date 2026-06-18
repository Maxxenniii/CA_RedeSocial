// js/feed-nao-logado.js - Feed para visitantes (sem login) - visualmente igual ao feed logado
console.log("[FEED-NAO-LOGADO] Iniciando...");

// ==================== CARREGAR DADOS REAIS (mesmos do feed logado) ====================
// Tenta carregar os posts reais do localStorage ou usa mock inicial
let postsReais = [];
try {
  const savedPosts = localStorage.getItem('postsData');
  if (savedPosts) {
    postsReais = JSON.parse(savedPosts);
  } else {
    // Dados iniciais (compatíveis com o feed logado)
    postsReais = [
      { id: 1, authorId: 1, author: "Marina Souza", avatarUrl: "", role: "Coordenadora de Eventos", time: "há 2 horas", content: "Acabamos de atualizar o mural de vagas do Centro Acadêmico! Confiram as novas oportunidades de estágio.", imageUrl: "", likes: 24, likedByUser: false, fromCA: true, comments: [] },
      { id: 2, authorId: 2, author: "Rafael Lima", avatarUrl: "", role: "Secretário Acadêmico", time: "há 5 horas", content: "Atenção, alunos! O período de trancamento foi prorrogado.", imageUrl: "", likes: 18, likedByUser: false, fromCA: true, comments: [] }
    ];
  }
} catch(e) {
  console.warn("Erro ao carregar posts", e);
}

// ==================== UTILITÁRIOS ====================
function escapeHtml(str) {
  if (!str) return '';
  return str.replace(/[&<>]/g, function(m) {
    if (m === '&') return '&amp;';
    if (m === '<') return '&lt;';
    if (m === '>') return '&gt;';
    return m;
  });
}

function renderAvatar(avatarUrl, name, size = "45px") {
  if (avatarUrl && avatarUrl.trim()) {
    return `<img src="${escapeHtml(avatarUrl)}" style="width:${size}; height:${size}; object-fit:cover; border-radius:50%;">`;
  } else {
    const displayText = name ? name.substring(0,2).toUpperCase() : "?";
    return `<div style="width:${size}; height:${size}; background:var(--gray-dark); border-radius:50%; display:flex; align-items:center; justify-content:center; border:2px solid var(--violet); color:var(--lime); font-weight:bold;">${escapeHtml(displayText)}</div>`;
  }
}

function countAllComments(comments) {
  if (!comments) return 0;
  let total = comments.length;
  for (let c of comments) {
    if (c.replies && c.replies.length) total += countAllComments(c.replies);
  }
  return total;
}

// ==================== REDIRECIONAMENTO PARA LOGIN ====================
function redirectToLogin() {
  if (confirm("Esta ação requer login. Deseja fazer login agora?")) {
    window.location.href = "login.html";
  }
}

// ==================== RENDERIZAÇÃO DO FEED (IGUAL AO FEED LOGADO, MAS SEM POSTAR E COM BOTÕES BLOQUEADOS) ====================
function renderFeedNaoLogado() {
  const container = document.getElementById('feedContainer');
  if (!container) {
    console.error("Container #feedContainer não encontrado");
    return;
  }

  // Parâmetros de URL
  const urlParams = new URLSearchParams(window.location.search);
  let currentSearch = urlParams.get('q') || '';
  let currentFilter = urlParams.get('filter') === 'ca' ? 'ca' : 'all';

  let postsToRender = [...postsReais];
  if (currentFilter === 'ca') {
    postsToRender = postsToRender.filter(p => p.fromCA === true);
  }
  if (currentSearch.trim() !== '') {
    const lowerQuery = currentSearch.toLowerCase();
    postsToRender = postsToRender.filter(post =>
      (post.content && post.content.toLowerCase().includes(lowerQuery)) ||
      (post.author && post.author.toLowerCase().includes(lowerQuery)) ||
      (post.role && post.role.toLowerCase().includes(lowerQuery))
    );
  }

  if (postsToRender.length === 0) {
    container.innerHTML = '<div class="empty-feed">Nenhum post encontrado.</div>';
    return;
  }

  container.innerHTML = '';
  for (let post of postsToRender) {
    const postDiv = document.createElement('div');
    postDiv.className = 'post-box';
    postDiv.dataset.id = post.id;

    const totalComments = countAllComments(post.comments);
    const avatarHtml = renderAvatar(post.avatarUrl, post.author, "45px");

    postDiv.innerHTML = `
      <div class="post-header">
        <div class="post-avatar">${avatarHtml}</div>
        <div style="flex:1;">
          <span class="post-username"><a href="login.html" style="color:inherit; text-decoration:none;" onclick="redirectToLogin(); return false;">${escapeHtml(post.author)}</a></span>
          ${post.role ? `<span class="post-role">${escapeHtml(post.role)}</span>` : ''}
          <span class="post-time">- ${post.time}</span>
        </div>
      </div>
      <div class="post-content">${escapeHtml(post.content)}</div>
      ${post.imageUrl ? `<div><img src="${post.imageUrl}" style="max-width:100%; max-height:300px; border-radius:8px; margin:10px 0;"></div>` : ''}
      <div class="post-actions">
        <button class="like-btn-nao-logado">❤️ ${post.likes}</button>
        <button class="comment-btn-nao-logado">💬 Comentar (${totalComments})</button>
        <button class="share-btn-nao-logado">🔗 Compartilhar</button>
        <button class="report-btn-nao-logado">🚩 Denunciar</button>
      </div>
      <div class="comments-area" style="display:none; margin-top:12px;">
        <div class="add-comment">
          <input type="text" placeholder="Faça login para comentar" disabled style="width:70%; background:var(--gray-dark); border:1px solid var(--border-color); color:white; padding:6px;">
          <button class="comment-submit-nao-logado" style="margin-top:5px;" disabled>Enviar</button>
        </div>
      </div>
    `;
    container.appendChild(postDiv);
  }

  // Adiciona eventos de redirecionamento para todos os botões de ação
  document.querySelectorAll('.like-btn-nao-logado, .comment-btn-nao-logado, .share-btn-nao-logado, .report-btn-nao-logado').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      redirectToLogin();
    });
  });
}

// ==================== FILTROS ====================
function initFilter() {
  const filterAll = document.querySelector('.filter-option[data-filter="all"]');
  const filterCA = document.querySelector('.filter-option[data-filter="ca"]');
  if (filterAll) {
    filterAll.onclick = () => {
      const url = new URL(window.location.href);
      url.searchParams.delete('filter');
      const q = url.searchParams.get('q');
      if (q) url.searchParams.set('q', q);
      window.location.href = url.toString();
    };
  }
  if (filterCA) {
    filterCA.onclick = () => {
      const url = new URL(window.location.href);
      url.searchParams.set('filter', 'ca');
      const q = url.searchParams.get('q');
      if (q) url.searchParams.set('q', q);
      window.location.href = url.toString();
    };
  }
  // Marcar o filtro ativo visualmente
  const currentFilter = new URLSearchParams(window.location.search).get('filter');
  if (currentFilter === 'ca' && filterCA) {
    filterCA.classList.add('active');
    if (filterAll) filterAll.classList.remove('active');
  } else if (filterAll) {
    filterAll.classList.add('active');
    if (filterCA) filterCA.classList.remove('active');
  }
}

// ==================== SUGESTÕES PARA VISITANTES ====================
function loadSuggestions() {
  const container = document.getElementById('suggestions-container');
  if (container) {
    fetch('componentes/sugestoes.html')
      .then(res => res.text())
      .then(html => {
        container.innerHTML = html;
        const listContainer = document.getElementById('suggestionsList');
        if (listContainer) {
          listContainer.innerHTML = '<div class="suggestion-empty">🔒 Faça <a href="login.html">login</a> para ver sugestões de pessoas para seguir.</div>';
        }
      })
      .catch(() => {
        container.innerHTML = '<div class="suggestions-panel"><h3>Sugestões</h3><div class="suggestion-empty">Faça <a href="login.html">login</a> para ver sugestões.</div></div>';
      });
  }
}

// ==================== INICIALIZAÇÃO ====================
document.addEventListener('DOMContentLoaded', () => {
  initFilter();
  renderFeedNaoLogado();
  loadSuggestions();
});