// js/perfil.js - Completo
let profileUserId = null;
let isOwnProfile = false;
let profileData = null;
let currentUser = null;

function loadCurrentUser() {
  const saved = localStorage.getItem('currentUser');
  if (saved) currentUser = JSON.parse(saved);
  else window.location.href = 'login.html';
}

function loadProfile() {
  loadCurrentUser();
  const urlParams = new URLSearchParams(window.location.search);
  const userIdParam = urlParams.get('id');
  
  if (userIdParam) {
    profileUserId = parseInt(userIdParam);
    profileData = window.usersData ? window.usersData.find(u => u.id === profileUserId) : null;
    if (!profileData) profileData = currentUser;
    isOwnProfile = (profileUserId === currentUser.id);
  } else {
    profileData = currentUser;
    profileUserId = currentUser.id;
    isOwnProfile = true;
  }
  renderProfile();
  renderUserPostsAndComments();
}

function renderProfile() {
  const container = document.querySelector('.profile-page');
  if (!container) return;
  const avatarHtml = profileData.avatarUrl 
    ? `<img src="${profileData.avatarUrl}" class="profile-avatar-large-img">` 
    : `<div class="profile-avatar-large">${profileData.fullName.charAt(0)}</div>`;
  const bannerHtml = profileData.bannerUrl 
    ? `<div class="profile-banner" style="background-image: url('${profileData.bannerUrl}');"></div>` 
    : `<div class="profile-banner"></div>`;
  const editButtonsHtml = isOwnProfile ? `
    <div class="profile-edit-buttons">
      <button id="editProfileBtn" class="btn-primary">✏️ Editar Perfil</button>
      <button id="reportProfileBtn" class="btn-primary" style="margin-left:10px; background:var(--error);">🚩 Denunciar Perfil</button>
    </div>
  ` : `<div><button id="followBtn" class="btn-primary">${isFollowing(profileUserId) ? 'Seguindo' : 'Seguir'}</button>
        <button id="reportProfileBtn" class="btn-primary" style="margin-left:10px; background:var(--error);">🚩 Denunciar Perfil</button></div>`;
  
  const caBadgeHtml = profileData.isCAMember ? `<span class="badge-ca">🔹 Membro do CA - ${profileData.cargoCA || 'Membro'}</span>` : '';
  
  container.innerHTML = `
    ${bannerHtml}
    <div class="profile-header">
      <div class="profile-avatar-container">${avatarHtml}</div>
      <div class="profile-info">
        <h2>${escapeHtml(profileData.fullName)}</h2>
        <div class="profile-username">@${escapeHtml(profileData.username || profileData.fullName.toLowerCase().replace(/\s/g,''))}</div>
        ${caBadgeHtml}
        <div class="profile-pronouns">${escapeHtml(profileData.pronouns || '')}</div>
        <div class="profile-periodo"><span class="label">Período:</span> ${escapeHtml(profileData.periodo || 'Não informado')}</div>
        <div class="profile-stats">
          <div class="stat-item"><span class="stat-number">${profileData.followers?.length || 0}</span><span class="stat-label">Seguidores</span></div>
          <div class="stat-item"><span class="stat-number">${profileData.following?.length || 0}</span><span class="stat-label">Seguindo</span></div>
          <div class="stat-item"><span class="stat-number">${getUserPosts().length + getUserComments().length}</span><span class="stat-label">Atividades</span></div>
        </div>
        ${editButtonsHtml}
      </div>
    </div>
    <div class="bio-box">
      <h3>Sobre</h3>
      <div class="bio-content">${escapeHtml(profileData.bio || 'Sem biografia ainda.')}</div>
    </div>
    <div class="personal-posts">
      <div class="section-title">Atividades de ${escapeHtml(profileData.fullName)}</div>
      <div id="userPostsContainer"></div>
    </div>
  `;
  if (isOwnProfile) {
    document.getElementById('editProfileBtn')?.addEventListener('click', openEditModal);
  } else {
    document.getElementById('followBtn')?.addEventListener('click', () => toggleFollow(profileUserId));
  }
  document.getElementById('reportProfileBtn')?.addEventListener('click', () => {
    const motivo = prompt("Informe o motivo da denúncia deste perfil:");
    if (motivo && motivo.trim()) {
      criarDenuncia(profileUserId, 'profile', motivo.trim());
      alert("Denúncia enviada. O CA irá analisar.");
    }
  });
}

function getUserPosts() {
  if (!window.postsData) return [];
  return window.postsData.filter(post => post.authorId === profileUserId);
}

function getUserComments() {
  if (!window.postsData) return [];
  let comments = [];
  function extractComments(commentList, postId) {
    for (let c of commentList) {
      if (c.userId === profileUserId) {
        comments.push({ ...c, postId, isComment: true });
      }
      if (c.replies) extractComments(c.replies, postId);
    }
  }
  for (let post of window.postsData) {
    if (post.comments) extractComments(post.comments, post.id);
  }
  return comments;
}

function renderUserPostsAndComments() {
  const container = document.getElementById('userPostsContainer');
  if (!container) return;
  const posts = getUserPosts();
  const comments = getUserComments();
  const allActivities = [...posts.map(p => ({ ...p, isComment: false })), ...comments];
  allActivities.sort((a,b) => new Date(b.time || 0) - new Date(a.time || 0));
  
  if (allActivities.length === 0) {
    container.innerHTML = '<div class="empty-message">Nenhuma atividade ainda.</div>';
    return;
  }
  container.innerHTML = '';
  for (let act of allActivities) {
    const div = document.createElement('div');
    div.className = 'post-box';
    if (act.isComment) {
      div.innerHTML = `
        <div class="post-header">
          <div class="post-avatar">${renderAvatar(act.avatarUrl, act.user, "45px")}</div>
          <div><span class="post-username">${escapeHtml(act.user)}</span> <span class="post-role">comentou</span> <span class="post-time">- ${act.time}</span></div>
        </div>
        <div class="post-content">💬 ${escapeHtml(act.text)}</div>
        ${act.imageUrl ? `<img src="${act.imageUrl}" style="max-width:100%; max-height:200px; border-radius:8px;">` : ''}
        <div class="post-actions"><button>🔗 Ver post original</button></div>
      `;
      div.querySelector('button')?.addEventListener('click', () => {
        window.location.href = `feed.html?highlight=post-${act.postId}`;
      });
    } else {
      div.innerHTML = `
        <div class="post-header">
          <div class="post-avatar">${renderAvatar(act.avatarUrl, act.author, "45px")}</div>
          <div><span class="post-username">${escapeHtml(act.author)}</span> ${act.role ? `<span class="post-role">${escapeHtml(act.role)}</span>` : ''}<span class="post-time">- ${act.time}</span></div>
        </div>
        <div class="post-content">${escapeHtml(act.content)}</div>
        ${act.imageUrl ? `<img src="${act.imageUrl}" style="max-width:100%; border-radius:8px;">` : ''}
        <div class="post-actions">
          <button class="like-btn-static">❤️ ${act.likes}</button>
          <button class="comment-btn-static" data-post-id="${act.id}">💬 ${countComments(act.comments)}</button>
          <button class="report-post-btn" data-post-id="${act.id}" style="background:none; border:none; color:red; cursor:pointer;">🚩 Denunciar</button>
        </div>
      `;
      const commentBtn = div.querySelector('.comment-btn-static');
      if (commentBtn) {
        commentBtn.addEventListener('click', () => {
          window.location.href = `feed.html?highlight=post-${act.id}`;
        });
      }
      const reportBtn = div.querySelector('.report-post-btn');
      if (reportBtn) {
        reportBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          const motivo = prompt("Informe o motivo da denúncia deste post:");
          if (motivo && motivo.trim()) {
            criarDenuncia(act.id, 'post', motivo.trim());
            alert("Denúncia enviada.");
          }
        });
      }
    }
    container.appendChild(div);
  }
}

function isFollowing(userId) {
  return currentUser.following && currentUser.following.includes(userId);
}

function toggleFollow(userId) {
  if (!currentUser.following) currentUser.following = [];
  const index = currentUser.following.indexOf(userId);
  if (index === -1) {
    currentUser.following.push(userId);
    if (!profileData.followers) profileData.followers = [];
    if (!profileData.followers.includes(currentUser.id)) profileData.followers.push(currentUser.id);
  } else {
    currentUser.following.splice(index, 1);
    if (profileData.followers) {
      const idx = profileData.followers.indexOf(currentUser.id);
      if (idx !== -1) profileData.followers.splice(idx, 1);
    }
  }
  localStorage.setItem('currentUser', JSON.stringify(currentUser));
  const userIndex = window.usersData.findIndex(u => u.id === profileUserId);
  if (userIndex !== -1) window.usersData[userIndex] = profileData;
  localStorage.setItem('usersData', JSON.stringify(window.usersData));
  notifyFollowChanged();
  renderProfile();
  renderUserPostsAndComments();
}

function openEditModal() {
  const modalHtml = `
    <div id="editModal" class="modal">
      <div class="modal-content">
        <span class="close">&times;</span>
        <h3>Editar Perfil</h3>
        <label>Nome completo:</label><input id="editFullName" value="${escapeHtml(currentUser.fullName)}">
        <label>Username:</label><input id="editUsername" value="${escapeHtml(currentUser.username || '')}">
        <label>Foto de perfil (URL):</label><input id="editAvatarUrl" value="${currentUser.avatarUrl || ''}">
        <label>Foto de banner (URL):</label><input id="editBannerUrl" value="${currentUser.bannerUrl || ''}">
        <label>Biografia:</label><textarea id="editBio">${escapeHtml(currentUser.bio || '')}</textarea>
        <label>Pronomes:</label><input id="editPronouns" value="${escapeHtml(currentUser.pronouns || '')}">
        <label>Período acadêmico:</label><input id="editPeriodo" value="${escapeHtml(currentUser.periodo || '')}">
        <button id="saveProfileBtn" class="btn-primary">Salvar</button>
      </div>
    </div>
  `;
  document.body.insertAdjacentHTML('beforeend', modalHtml);
  const modal = document.getElementById('editModal');
  modal.style.display = 'block';
  document.querySelector('.close').onclick = () => modal.remove();
  document.getElementById('saveProfileBtn').onclick = () => {
    currentUser.fullName = document.getElementById('editFullName').value;
    currentUser.username = document.getElementById('editUsername').value;
    currentUser.avatarUrl = document.getElementById('editAvatarUrl').value;
    currentUser.bannerUrl = document.getElementById('editBannerUrl').value;
    currentUser.bio = document.getElementById('editBio').value;
    currentUser.pronouns = document.getElementById('editPronouns').value;
    currentUser.periodo = document.getElementById('editPeriodo').value;
    localStorage.setItem('currentUser', JSON.stringify(currentUser));
    const idx = window.usersData.findIndex(u => u.id === currentUser.id);
    if (idx !== -1) window.usersData[idx] = currentUser;
    localStorage.setItem('usersData', JSON.stringify(window.usersData));
    notifyAvatarChanged();
    modal.remove();
    renderProfile();
    renderUserPostsAndComments();
  };
}

// Função global de criar denúncia (também deve estar no common.js ou aqui)
function criarDenuncia(itemId, tipo, motivo, postId = null) {
  const denuncias = JSON.parse(localStorage.getItem('denuncias') || '[]');
  const novaDenuncia = {
    id: Date.now(),
    itemId: itemId,
    tipo: tipo,
    motivo: motivo,
    status: "pendente",
    data: new Date().toISOString(),
    denuncianteId: currentUser.id,
    postId: postId
  };
  denuncias.push(novaDenuncia);
  localStorage.setItem('denuncias', JSON.stringify(denuncias));
}

document.addEventListener('DOMContentLoaded', () => {
  loadProfile();
});