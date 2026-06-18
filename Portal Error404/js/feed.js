// js/feed.js - Feed completo com usuário logado e denúncias
console.log('[FEED] Iniciando...');

const loggedUserStr = localStorage.getItem('currentUser');
if (!loggedUserStr) {
  window.location.href = 'fedd_nao_logado.html';
  throw new Error('Redirecionado');
}
let currentUser = JSON.parse(loggedUserStr);
if (typeof initGlobalData === 'function') initGlobalData();

let nextPostId = window.postsData.length + 1;
let isCAMember = currentUser.isCAMember || false;

const urlParams = new URLSearchParams(window.location.search);
let currentSearch = urlParams.get('q') || '';
let currentFilter = urlParams.get('filter') === 'ca' ? 'ca' : 'all';

function updateURLParams() {
  const params = new URLSearchParams();
  if (currentSearch) params.set('q', currentSearch);
  if (currentFilter === 'ca') params.set('filter', 'ca');
  const newUrl = window.location.pathname + (params.toString() ? '?' + params.toString() : '');
  window.history.pushState({}, '', newUrl);
}

function generateCommentId() { return Date.now() + '-' + Math.random().toString(36).substr(2, 8); }
function fileToBase64(file) {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.readAsDataURL(file);
  });
}

function renderCommentTree(comments, postId, level = 0) {
  if (!comments || comments.length === 0) return '';
  let html = '';
  for (let comment of comments) {
    const isOwner = (comment.userId === currentUser.id);
    const marginLeft = Math.min(level * 32, 96);
    const replyToHtml = comment.parentUser ? `<div style="font-size:0.7rem; color:var(--violet-light); margin-bottom:2px;">↳ Respondendo a <strong>${escapeHtml(comment.parentUser)}</strong></div>` : '';
    html += `
      <div class="comment-item" data-comment-id="${comment.id}" data-post-id="${postId}" style="margin-left: ${marginLeft}px; margin-top: 8px;">
        <div style="display:flex; gap:8px; background:var(--gray-mid); padding:8px; border-radius:6px; border-left: 2px solid ${level > 0 ? 'var(--violet)' : 'transparent'};">
          <div style="flex-shrink:0;">${renderAvatar(comment.avatarUrl, comment.user, "28px")}</div>
          <div style="flex:1;">
            <div><strong>${escapeHtml(comment.user)}</strong> <span style="font-size:0.7rem; color:gray;">${comment.time}</span></div>
            ${replyToHtml}
            <div class="comment-text">${escapeHtml(comment.text)}</div>
            ${comment.imageUrl ? `<img src="${comment.imageUrl}" style="max-width:120px; border-radius:4px; margin-top:4px;">` : ''}
            <div class="comment-actions" style="margin-top:6px;">
              <button class="reply-comment-btn" type="button" style="background:none; border:none; color:var(--lime); cursor:pointer; font-size:0.7rem;">↩️ Responder</button>
              ${isOwner ? `<button class="edit-comment-btn" type="button" style="background:none; border:none; color:var(--lime); cursor:pointer; font-size:0.7rem;">✏️ Editar</button>
                           <button class="delete-comment-btn" type="button" style="background:none; border:none; color:var(--lime); cursor:pointer; font-size:0.7rem;">🗑️ Excluir</button>` : ''}
              <button class="report-comment-btn" data-post-id="${postId}" data-comment-id="${comment.id}" type="button" style="background:none; border:none; color:var(--warning); cursor:pointer; font-size:0.7rem;">🚩 Denunciar</button>
            </div>
            <div class="reply-form-container" style="display:none; margin-top:8px;"></div>
          </div>
        </div>
      </div>
    `;
    if (comment.replies && comment.replies.length) {
      html += renderCommentTree(comment.replies, postId, level + 1);
    }
  }
  return html;
}

function renderComments(post) {
  if (!post.comments || post.comments.length === 0) {
    return '<div class="empty-comments" style="color:gray; text-align:center;">Nenhum comentário ainda.</div>';
  }
  return `<div class="comments-list">${renderCommentTree(post.comments, post.id, 0)}</div>`;
}

function countAllComments(comments) {
  let total = comments.length;
  for (let c of comments) {
    if (c.replies && c.replies.length) total += countAllComments(c.replies);
  }
  return total;
}

async function renderFeed() {
  const container = document.getElementById('feedContainer');
  if (!container) {
    console.error('Container #feedContainer não encontrado');
    return;
  }
  container.innerHTML = '';

  let postsToRender = [...window.postsData];
  if (currentFilter === 'ca') postsToRender = postsToRender.filter(p => p.fromCA === true);
  if (currentSearch.trim() !== '') {
    const lowerQuery = currentSearch.toLowerCase();
    postsToRender = postsToRender.filter(post => 
      (post.content && post.content.toLowerCase().includes(lowerQuery)) ||
      (post.author && post.author.toLowerCase().includes(lowerQuery)) ||
      (post.role && post.role.toLowerCase().includes(lowerQuery))
    );
  }

  // Formulário novo post
  const newPostDiv = document.createElement('div');
  newPostDiv.className = 'post-box';
  newPostDiv.innerHTML = `
    <div class="post-header">
      <div class="post-avatar">${renderAvatar(currentUser.avatarUrl, currentUser.fullName, "45px")}</div>
      <div style="flex:1;">
        <span class="post-username"><a href="perfil.html" style="color:inherit;">${escapeHtml(currentUser.fullName)}</a></span>
        <button id="changeAvatarBtn" style="background:none; border:none; cursor:pointer;">🖼️</button>
        <span class="post-time">- agora</span>
        <span class="ca-badge" id="caBadge" style="display:${isCAMember ? 'inline-block' : 'none'};">🔹 Membro CA</span>
      </div>
    </div>
    <div class="post-content">
      <textarea id="newPostContent" style="width:100%; background:var(--gray-mid); border:1px solid var(--border-color); color:white; padding:10px;" placeholder="No que está pensando?"></textarea>
      <div id="newPostImagePreview" style="margin-top:5px;"></div>
      <div style="margin-top:5px;">
        <label for="newPostImageInput" style="background:var(--violet-dark); padding:4px 12px; border-radius:4px; cursor:pointer;">📷 Adicionar imagem</label>
        <input type="file" id="newPostImageInput" accept="image/*" style="display:none;">
      </div>
      <button id="publishBtn" class="btn-primary" style="margin-top:10px;">Publicar</button>
    </div>
  `;
  container.appendChild(newPostDiv);

  const newContent = newPostDiv.querySelector('#newPostContent');
  const newImageInput = newPostDiv.querySelector('#newPostImageInput');
  const newPreview = newPostDiv.querySelector('#newPostImagePreview');
  let newImageData = null;
  newImageInput.onchange = async (e) => {
    if (e.target.files[0]) {
      newImageData = await fileToBase64(e.target.files[0]);
      newPreview.innerHTML = `<img src="${newImageData}" style="max-width:200px; border-radius:6px;">`;
    } else {
      newImageData = null;
      newPreview.innerHTML = '';
    }
  };
  newPostDiv.querySelector('#changeAvatarBtn').onclick = () => {
    const url = prompt("Digite a URL da sua foto de perfil:", currentUser.avatarUrl);
    if (url !== null) {
      currentUser.avatarUrl = url;
      localStorage.setItem('currentUser', JSON.stringify(currentUser));
      window.dispatchEvent(new Event('avatarChanged'));
      renderFeed();
    }
  };
  newPostDiv.querySelector('#publishBtn').onclick = async () => {
    const content = newContent.value.trim();
    if (!content && !newImageData) return;
    const newPost = {
      id: nextPostId++,
      authorId: currentUser.id,
      author: currentUser.fullName,
      avatarUrl: currentUser.avatarUrl,
      role: isCAMember ? (currentUser.cargoCA || "Membro CA") : "",
      time: "agora",
      content: content,
      imageUrl: newImageData || "",
      likes: 0,
      likedByUser: false,
      fromCA: isCAMember,
      comments: []
    };
    window.postsData.unshift(newPost);
    savePosts();
    renderFeed();
  };

  // Lista de posts
  for (let post of postsToRender) {
    const postDiv = document.createElement('div');
    postDiv.className = 'post-box';
    postDiv.dataset.id = post.id;

    const commentsHtml = renderComments(post);
    const totalComments = countAllComments(post.comments);

    postDiv.innerHTML = `
      <div class="post-header">
        <div class="post-avatar">${renderAvatar(post.avatarUrl, post.author, "45px")}</div>
        <div style="flex:1;">
          <span class="post-username"><a href="perfil.html?id=${post.authorId}" style="color:inherit;">${escapeHtml(post.author)}</a></span>
          ${post.role ? `<span class="post-role">${escapeHtml(post.role)}</span>` : ''}
          <span class="post-time">- ${post.time}</span>
        </div>
      </div>
      <div class="post-content">${escapeHtml(post.content)}</div>
      ${post.imageUrl ? `<div><img src="${post.imageUrl}" style="max-width:100%; max-height:300px; border-radius:8px; margin:10px 0;"></div>` : ''}
      <div class="post-actions">
        <button class="like-btn" data-id="${post.id}">❤️ <span class="like-count">${post.likes}</span></button>
        <button class="comment-toggle-btn" data-id="${post.id}">💬 Comentar (${totalComments})</button>
        <button class="share-btn" data-id="${post.id}">🔗 Compartilhar</button>
        <button class="report-btn" data-id="${post.id}" data-type="post">🚩 Denunciar</button>
      </div>
      <div class="comments-area" id="comments-area-${post.id}" style="display:none; margin-top:12px;">
        ${commentsHtml}
        <div class="add-comment" style="margin-top:10px;">
          <input type="text" placeholder="Escreva um comentário..." class="comment-input" id="comment-input-${post.id}" style="width:70%; background:var(--gray-dark); border:1px solid var(--border-color); color:white; padding:6px;">
          <div style="margin-top:5px;">
            <label for="commentImage-${post.id}" style="background:var(--violet-dark); padding:2px 8px; border-radius:4px; cursor:pointer;">📷</label>
            <input type="file" id="commentImage-${post.id}" accept="image/*" style="display:none;">
            <div id="commentPreview-${post.id}" style="display:inline-block;"></div>
          </div>
          <button class="comment-submit" data-id="${post.id}" style="margin-top:5px;">Enviar</button>
        </div>
      </div>
    `;
    container.appendChild(postDiv);
  }

  attachEvents();
  addToggleButton();
}

function attachEvents() {
  // Like
  document.querySelectorAll('.like-btn').forEach(btn => {
    btn.onclick = () => {
      const id = parseInt(btn.dataset.id);
      const post = window.postsData.find(p => p.id === id);
      if (post) {
        post.likedByUser = !post.likedByUser;
        post.likes += post.likedByUser ? 1 : -1;
        savePosts();
        renderFeed();
      }
    };
  });
  // Alternar comentários
  document.querySelectorAll('.comment-toggle-btn').forEach(btn => {
    btn.onclick = () => {
      const id = parseInt(btn.dataset.id);
      const area = document.getElementById(`comments-area-${id}`);
      if (area) area.style.display = area.style.display === 'none' ? 'block' : 'none';
    };
  });
  // Enviar comentário
  document.querySelectorAll('.comment-submit').forEach(btn => {
    btn.onclick = async () => {
      const postId = parseInt(btn.dataset.id);
      const post = window.postsData.find(p => p.id === postId);
      if (!post) return;
      const input = document.getElementById(`comment-input-${postId}`);
      const text = input.value.trim();
      const previewDiv = document.getElementById(`commentPreview-${postId}`);
      let imageData = previewDiv?.dataset.image;
      if (!text && !imageData) return;
      const newComment = {
        id: generateCommentId(),
        user: currentUser.fullName,
        avatarUrl: currentUser.avatarUrl,
        text: text,
        imageUrl: imageData || "",
        time: "agora",
        userId: currentUser.id,
        parentUser: null,
        replies: []
      };
      post.comments.push(newComment);
      savePosts();
      input.value = '';
      if (previewDiv) { previewDiv.innerHTML = ''; delete previewDiv.dataset.image; }
      renderFeed();
    };
  });
  // Upload imagem comentário
  document.querySelectorAll('[id^="commentImage-"]').forEach(input => {
    input.onchange = async (e) => {
      if (e.target.files[0]) {
        const base64 = await fileToBase64(e.target.files[0]);
        const previewId = input.id.replace('commentImage-', 'commentPreview-');
        const preview = document.getElementById(previewId);
        if (preview) {
          preview.innerHTML = `<img src="${base64}" style="max-width:50px; border-radius:4px;">`;
          preview.dataset.image = base64;
        }
      }
    };
  });
  // Compartilhar
  document.querySelectorAll('.share-btn').forEach(btn => {
    btn.onclick = () => alert('Compartilhamento simulado!');
  });

  // Denunciar POST
  document.querySelectorAll('.report-btn').forEach(btn => {
    btn.onclick = (e) => {
      e.stopPropagation();
      const id = parseInt(btn.dataset.id);
      const motivo = prompt("Informe o motivo da denúncia (ex: spam, ofensivo, etc.):");
      if (motivo && motivo.trim()) {
        const post = window.postsData.find(p => p.id === id);
        criarDenuncia('post', id, motivo, { conteudo: post?.content, autor: post?.author });
        alert("Denúncia enviada. O Centro Acadêmico irá analisar.");
      }
    };
  });

  // Denunciar COMENTÁRIO
  document.querySelectorAll('.report-comment-btn').forEach(btn => {
    btn.onclick = (e) => {
      e.stopPropagation();
      const postId = parseInt(btn.dataset.postId);
      const commentId = btn.dataset.commentId;
      const motivo = prompt("Informe o motivo da denúncia do comentário:");
      if (motivo && motivo.trim()) {
        criarDenuncia('comentario', commentId, motivo, { postId: postId });
        alert("Denúncia enviada.");
      }
    };
  });

  // Denunciar PERFIL - isso será adicionado nas páginas de perfil (ver perfil.js)
  // Já trataremos lá.

  // Responder, editar, excluir comentários (resumido)
  document.querySelectorAll('.reply-comment-btn').forEach(btn => {
    btn.onclick = (e) => {
      const commentItem = btn.closest('.comment-item');
      const commentId = commentItem.dataset.commentId;
      const postId = parseInt(commentItem.dataset.postId);
      const post = window.postsData.find(p => p.id === postId);
      if (!post) return;
      function findComment(comments, id) {
        for (let c of comments) {
          if (c.id === id) return c;
          if (c.replies && c.replies.length) { const found = findComment(c.replies, id); if (found) return found; }
        }
        return null;
      }
      const parentComment = findComment(post.comments, commentId);
      if (!parentComment) return;
      const replyContainer = commentItem.querySelector('.reply-form-container');
      if (replyContainer.style.display === 'block') {
        replyContainer.style.display = 'none';
        replyContainer.innerHTML = '';
        return;
      }
      replyContainer.style.display = 'block';
      replyContainer.innerHTML = `
        <div style="background: var(--gray-dark); padding: 6px; border-radius: 4px; margin-bottom: 4px;">
          <small>Respondendo a <strong>${escapeHtml(parentComment.user)}</strong>:</small>
        </div>
        <div style="display:flex; gap:5px; align-items:center; flex-wrap:wrap;">
          <input type="text" class="reply-input" placeholder="Escreva uma resposta..." style="flex:1; background:var(--gray-dark); border:1px solid var(--border-color); color:white; padding:6px;">
          <label style="background:var(--violet-dark); padding:2px 6px; border-radius:4px; cursor:pointer;">📷</label>
          <input type="file" class="reply-image-input" accept="image/*" style="display:none;">
          <button class="reply-submit" style="background:var(--violet-dark); border:none; padding:4px 8px; border-radius:4px;">Responder</button>
          <button class="reply-cancel" style="background:gray; border:none; padding:4px 8px; border-radius:4px;">Cancelar</button>
        </div>
        <div class="reply-preview" style="margin-top:4px;"></div>
      `;
      const replyInput = replyContainer.querySelector('.reply-input');
      const replyImageInput = replyContainer.querySelector('.reply-image-input');
      const replyPreview = replyContainer.querySelector('.reply-preview');
      const replySubmit = replyContainer.querySelector('.reply-submit');
      const replyCancel = replyContainer.querySelector('.reply-cancel');
      let replyImageData = null;
      replyImageInput.onchange = async (e) => {
        if (e.target.files[0]) {
          replyImageData = await fileToBase64(e.target.files[0]);
          replyPreview.innerHTML = `<img src="${replyImageData}" style="max-width:80px; border-radius:4px;">`;
        } else {
          replyImageData = null;
          replyPreview.innerHTML = '';
        }
      };
      replySubmit.onclick = async () => {
        const replyText = replyInput.value.trim();
        if (!replyText && !replyImageData) return;
        const newReply = {
          id: generateCommentId(),
          user: currentUser.fullName,
          avatarUrl: currentUser.avatarUrl,
          text: replyText,
          imageUrl: replyImageData || "",
          time: "agora",
          userId: currentUser.id,
          parentUser: parentComment.user,
          replies: []
        };
        if (!parentComment.replies) parentComment.replies = [];
        parentComment.replies.push(newReply);
        savePosts();
        renderFeed();
      };
      replyCancel.onclick = () => {
        replyContainer.style.display = 'none';
        replyContainer.innerHTML = '';
      };
      replyInput.focus();
    };
  });
  // Editar comentário (simplificado)
  document.querySelectorAll('.edit-comment-btn').forEach(btn => {
    btn.onclick = (e) => {
      const commentItem = btn.closest('.comment-item');
      const commentId = commentItem.dataset.commentId;
      const postId = parseInt(commentItem.dataset.postId);
      const post = window.postsData.find(p => p.id === postId);
      if (!post) return;
      function findAndEdit(comments, id, callback) {
        for (let i = 0; i < comments.length; i++) {
          if (comments[i].id === id) { callback(comments[i]); return true; }
          if (comments[i].replies && comments[i].replies.length) {
            if (findAndEdit(comments[i].replies, id, callback)) return true;
          }
        }
        return false;
      }
      findAndEdit(post.comments, commentId, (comment) => {
        const textSpan = commentItem.querySelector('.comment-text');
        const originalText = comment.text;
        const input = document.createElement('input');
        input.type = 'text';
        input.value = originalText;
        input.style.background = 'var(--gray-dark)';
        input.style.border = '1px solid var(--lime)';
        input.style.color = 'white';
        input.style.padding = '4px';
        input.style.width = '100%';
        textSpan.replaceWith(input);
        input.focus();
        const saveEdit = () => {
          const newText = input.value.trim();
          if (newText && newText !== originalText) comment.text = newText;
          savePosts();
          renderFeed();
        };
        input.addEventListener('blur', saveEdit);
        input.addEventListener('keypress', (e) => { if (e.key === 'Enter') saveEdit(); });
      });
    };
  });
  // Excluir comentário
  document.querySelectorAll('.delete-comment-btn').forEach(btn => {
    btn.onclick = () => {
      const commentItem = btn.closest('.comment-item');
      const commentId = commentItem.dataset.commentId;
      const postId = parseInt(commentItem.dataset.postId);
      const post = window.postsData.find(p => p.id === postId);
      if (!post) return;
      function findAndDelete(comments, id) {
        for (let i = 0; i < comments.length; i++) {
          if (comments[i].id === id) { comments.splice(i, 1); return true; }
          if (comments[i].replies && comments[i].replies.length) {
            if (findAndDelete(comments[i].replies, id)) return true;
          }
        }
        return false;
      }
      findAndDelete(post.comments, commentId);
      savePosts();
      renderFeed();
    };
  });
}

function addToggleButton() {
  let existing = document.getElementById('toggleCA');
  if (existing) existing.remove();
  const btn = document.createElement('button');
  btn.id = 'toggleCA';
  btn.innerHTML = isCAMember ? '🔹 Sou Membro CA (clique para remover - teste)' : '🔸 Tornar-se Membro CA (teste)';
  btn.style.position = 'fixed';
  btn.style.bottom = '20px';
  btn.style.right = '20px';
  btn.style.zIndex = '9999';
  btn.style.background = 'var(--violet-dark)';
  btn.style.border = '2px solid var(--violet)';
  btn.style.color = 'white';
  btn.style.padding = '10px 18px';
  btn.style.borderRadius = '30px';
  btn.style.cursor = 'pointer';
  btn.style.fontFamily = 'inherit';
  btn.style.fontSize = '0.9rem';
  btn.style.fontWeight = 'bold';
  btn.style.boxShadow = '0 0 12px rgba(125,57,235,0.6)';
  btn.onclick = () => {
    isCAMember = !isCAMember;
    currentUser.isCAMember = isCAMember;
    localStorage.setItem('currentUser', JSON.stringify(currentUser));
    btn.innerHTML = isCAMember ? '🔹 Sou Membro CA (clique para remover - teste)' : '🔸 Tornar-se Membro CA (teste)';
    renderFeed();
  };
  document.body.appendChild(btn);
}

function initFilter() {
  const filterAll = document.querySelector('.filter-option[data-filter="all"]');
  const filterCA = document.querySelector('.filter-option[data-filter="ca"]');
  if (filterAll) {
    filterAll.onclick = () => {
      currentFilter = 'all';
      updateURLParams();
      renderFeed();
      filterAll.classList.add('active');
      if (filterCA) filterCA.classList.remove('active');
    };
  }
  if (filterCA) {
    filterCA.onclick = () => {
      currentFilter = 'ca';
      updateURLParams();
      renderFeed();
      filterCA.classList.add('active');
      if (filterAll) filterAll.classList.remove('active');
    };
  }
  if (currentFilter === 'ca' && filterCA) {
    filterCA.classList.add('active');
    if (filterAll) filterAll.classList.remove('active');
  } else if (filterAll) {
    filterAll.classList.add('active');
    if (filterCA) filterCA.classList.remove('active');
  }
}

document.addEventListener('DOMContentLoaded', () => {
  console.log('DOM carregado - feed logado');
  const mainArea = document.querySelector('.content-area');
  if (mainArea && !document.getElementById('feedContainer')) {
    const feedDiv = document.createElement('div');
    feedDiv.id = 'feedContainer';
    mainArea.appendChild(feedDiv);
  }
  initFilter();
  renderFeed();
  const highlight = new URLSearchParams(window.location.search).get('highlight');
  if (highlight && highlight.startsWith('post-')) {
    const postId = highlight.replace('post-', '');
    setTimeout(() => {
      const postElement = document.querySelector(`.post-box[data-id="${postId}"]`);
      if (postElement) {
        postElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        const commentBtn = postElement.querySelector('.comment-toggle-btn');
        if (commentBtn) commentBtn.click();
        postElement.style.transition = 'box-shadow 0.3s';
        postElement.style.boxShadow = '0 0 0 3px var(--lime)';
        setTimeout(() => postElement.style.boxShadow = '', 1500);
      }
    }, 500);
  }
});