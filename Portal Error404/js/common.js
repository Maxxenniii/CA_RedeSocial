// js/common.js - Funções e dados globais

function escapeHtml(str) {
  if (!str) return '';
  return str.replace(/[&<>]/g, function(m) {
    if (m === '&') return '&amp;';
    if (m === '<') return '&lt;';
    if (m === '>') return '&gt;';
    return m;
  });
}

function renderAvatar(avatarUrl, name, size = "32px") {
  if (avatarUrl && avatarUrl.trim()) {
    return `<img src="${escapeHtml(avatarUrl)}" style="width:${size}; height:${size}; object-fit:cover; border-radius:50%;">`;
  } else {
    const displayText = name ? name.substring(0,2).toUpperCase() : "?";
    return `<div style="width:${size}; height:${size}; background:var(--gray-dark); border-radius:50%; display:flex; align-items:center; justify-content:center; border:1px solid var(--violet); color:var(--lime); font-weight:bold;">${escapeHtml(displayText)}</div>`;
  }
}

function countComments(comments) {
  if (!comments) return 0;
  let total = comments.length;
  for (let c of comments) if (c.replies) total += countComments(c.replies);
  return total;
}

// Inicialização dos dados globais
function initGlobalData() {
  // Posts
  const savedPosts = localStorage.getItem('postsData');
  if (savedPosts) {
    window.postsData = JSON.parse(savedPosts);
  } else {
    window.postsData = [
      { id: 1, authorId: 1, author: "Marina Souza", avatarUrl: "", role: "Coordenadora de Eventos", time: "há 2 horas", content: "Acabamos de atualizar o mural de vagas...", imageUrl: "", likes: 24, likedByUser: false, fromCA: true, comments: [] },
      { id: 2, authorId: 2, author: "Rafael Lima", avatarUrl: "", role: "Secretário Acadêmico", time: "há 5 horas", content: "Atenção, alunos! O período de trancamento foi prorrogado.", imageUrl: "", likes: 18, likedByUser: false, fromCA: true, comments: [] }
    ];
    localStorage.setItem('postsData', JSON.stringify(window.postsData));
  }

  // Usuários
  const savedUsers = localStorage.getItem('usersData');
  if (savedUsers) {
    window.usersData = JSON.parse(savedUsers);
  } else {
    window.usersData = [
      { id: 1, fullName: "Marina Souza", username: "marinasouza", avatarUrl: "", bannerUrl: "", bio: "Coordenadora de Eventos", pronouns: "ela/dela", periodo: "7º período", isCAMember: true, cargoCA: "Coordenadora de Eventos", followers: [], following: [] },
      { id: 2, fullName: "Rafael Lima", username: "rafaellima", avatarUrl: "", bannerUrl: "", bio: "Secretário Acadêmico", pronouns: "ele/dele", periodo: "5º período", isCAMember: true, cargoCA: "Secretário Acadêmico", followers: [], following: [] }
    ];
    localStorage.setItem('usersData', JSON.stringify(window.usersData));
  }

  // Adiciona o usuário logado se não existir
  const currentUserStr = localStorage.getItem('currentUser');
  if (currentUserStr) {
    const currentUser = JSON.parse(currentUserStr);
    if (!window.usersData.find(u => u.id === currentUser.id)) {
      window.usersData.push(currentUser);
      localStorage.setItem('usersData', JSON.stringify(window.usersData));
    }
  }

  // Inicializa denúncias
  if (!localStorage.getItem('denuncias')) {
    localStorage.setItem('denuncias', JSON.stringify([]));
  }
}

function savePosts() {
  localStorage.setItem('postsData', JSON.stringify(window.postsData));
}

function saveUsers() {
  localStorage.setItem('usersData', JSON.stringify(window.usersData));
}

function notifyAvatarChanged() {
  window.dispatchEvent(new Event('avatarChanged'));
}

function notifyFollowChanged() {
  window.dispatchEvent(new Event('followChanged'));
}

// ========== Funções de Denúncia ==========
function criarDenuncia(tipo, idReferencia, motivo, detalhes = {}) {
  const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
  const denuncias = JSON.parse(localStorage.getItem('denuncias') || '[]');
  const novaDenuncia = {
    id: Date.now(),
    tipo: tipo,        // 'post', 'comentario', 'perfil'
    idReferencia: idReferencia,
    motivo: motivo,
    status: 'pendente',
    data: new Date().toISOString(),
    denuncianteId: currentUser.id || 0,
    detalhes: detalhes   // pode conter texto do post, nome do perfil, etc.
  };
  denuncias.push(novaDenuncia);
  localStorage.setItem('denuncias', JSON.stringify(denuncias));
}

function getDenuncias() {
  return JSON.parse(localStorage.getItem('denuncias') || '[]');
}

function resolverDenuncia(id) {
  let denuncias = getDenuncias();
  const index = denuncias.findIndex(d => d.id === id);
  if (index !== -1) {
    denuncias[index].status = 'resolvida';
    localStorage.setItem('denuncias', JSON.stringify(denuncias));
    return true;
  }
  return false;
}

function getPostById(id) {
  return window.postsData?.find(p => p.id === id);
}

function getComentarioById(postId, commentId) {
  const post = getPostById(postId);
  if (!post) return null;
  function findComment(comments, id) {
    for (let c of comments) {
      if (c.id === id) return c;
      if (c.replies) {
        const found = findComment(c.replies, id);
        if (found) return found;
      }
    }
    return null;
  }
  return findComment(post.comments, commentId);
}

function getUserById(id) {
  return window.usersData?.find(u => u.id === id);
}

// Inicializa
initGlobalData();