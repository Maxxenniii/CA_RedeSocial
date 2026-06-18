// js/config-page.js - Configurações funcionais do usuário
(function() {
  let currentUser = null;

  function loadCurrentUser() {
    const saved = localStorage.getItem('currentUser');
    if (saved) currentUser = JSON.parse(saved);
    else window.location.href = 'login.html';
    return currentUser;
  }

  function saveCurrentUser(updatedUser) {
    currentUser = updatedUser;
    localStorage.setItem('currentUser', JSON.stringify(currentUser));
    if (window.usersData) {
      const idx = window.usersData.findIndex(u => u.id === currentUser.id);
      if (idx !== -1) window.usersData[idx] = currentUser;
      else window.usersData.push(currentUser);
      localStorage.setItem('usersData', JSON.stringify(window.usersData));
    }
    window.dispatchEvent(new Event('avatarChanged'));
    window.dispatchEvent(new Event('followChanged'));
  }

  // ========== PERFIL ==========
  function loadProfileForm() {
    const user = loadCurrentUser();
    document.getElementById('editFullName').value = user.fullName || '';
    document.getElementById('editUsername').value = user.username || '';
    document.getElementById('editEmail').value = user.email || '';
    document.getElementById('editAvatarUrl').value = user.avatarUrl || '';
    document.getElementById('editBannerUrl').value = user.bannerUrl || '';
    document.getElementById('editBio').value = user.bio || '';
    document.getElementById('editPronouns').value = user.pronouns || '';
    document.getElementById('editPeriodo').value = user.periodo || '';
  }

  function saveProfileForm() {
    const updated = { ...currentUser };
    updated.fullName = document.getElementById('editFullName').value.trim();
    updated.username = document.getElementById('editUsername').value.trim();
    updated.email = document.getElementById('editEmail').value.trim();
    updated.avatarUrl = document.getElementById('editAvatarUrl').value.trim();
    updated.bannerUrl = document.getElementById('editBannerUrl').value.trim();
    updated.bio = document.getElementById('editBio').value.trim();
    updated.pronouns = document.getElementById('editPronouns').value.trim();
    updated.periodo = document.getElementById('editPeriodo').value.trim();
    saveCurrentUser(updated);
    alert('Perfil atualizado com sucesso!');
  }

  // ========== PRIVACIDADE ==========
  function loadPrivacyForm() {
    const privacy = JSON.parse(localStorage.getItem('userPrivacy_' + currentUser.id) || '{}');
    document.getElementById('privacyProfileView').value = privacy.profileView || 'todos';
    document.getElementById('privacyFollow').value = privacy.follow || 'todos';
    document.getElementById('privacyPosts').value = privacy.posts || 'todos';
  }

  function savePrivacyForm() {
    const privacy = {
      profileView: document.getElementById('privacyProfileView').value,
      follow: document.getElementById('privacyFollow').value,
      posts: document.getElementById('privacyPosts').value
    };
    localStorage.setItem('userPrivacy_' + currentUser.id, JSON.stringify(privacy));
    alert('Configurações de privacidade salvas!');
  }

  // ========== NOTIFICAÇÕES ==========
  function loadNotifForm() {
    const notif = JSON.parse(localStorage.getItem('userNotif_' + currentUser.id) || '{}');
    document.getElementById('notifEmail').checked = notif.email !== false;
    document.getElementById('notifPush').checked = notif.push === true;
    document.getElementById('notifNewFollowers').checked = notif.newFollowers !== false;
    document.getElementById('notifComments').checked = notif.comments !== false;
    document.getElementById('notifCAPosts').checked = notif.caPosts === true;
  }

  function saveNotifForm() {
    const notif = {
      email: document.getElementById('notifEmail').checked,
      push: document.getElementById('notifPush').checked,
      newFollowers: document.getElementById('notifNewFollowers').checked,
      comments: document.getElementById('notifComments').checked,
      caPosts: document.getElementById('notifCAPosts').checked
    };
    localStorage.setItem('userNotif_' + currentUser.id, JSON.stringify(notif));
    alert('Preferências de notificações salvas!');
  }

  // ========== APARÊNCIA ==========
  function loadAppearanceForm() {
    const savedColor = localStorage.getItem('portalThemeColor') || '#7D39EB';
    const colorPicker = document.getElementById('themeColor');
    const hexInput = document.getElementById('hexInput');
    if (colorPicker) colorPicker.value = savedColor;
    if (hexInput) hexInput.value = savedColor;
    const savedFont = localStorage.getItem('portalFont') || 'VT323';
    const fontSelect = document.getElementById('fontSelect');
    if (fontSelect) fontSelect.value = savedFont;
  }

  function saveAppearanceForm() {
    const color = document.getElementById('themeColor').value;
    const hexInput = document.getElementById('hexInput');
    if (hexInput) hexInput.value = color;
    localStorage.setItem('portalThemeColor', color);
    if (typeof applyTheme === 'function') applyTheme(color);
    else if (window.applyTheme) window.applyTheme(color);
    
    const font = document.getElementById('fontSelect').value;
    localStorage.setItem('portalFont', font);
    if (typeof applyFont === 'function') applyFont();
    else if (window.applyFont) window.applyFont();
    alert('Aparência salva!');
  }

  function resetTheme() {
    const defaultColor = '#7D39EB';
    document.getElementById('themeColor').value = defaultColor;
    document.getElementById('hexInput').value = defaultColor;
    localStorage.setItem('portalThemeColor', defaultColor);
    if (typeof applyTheme === 'function') applyTheme(defaultColor);
    else if (window.applyTheme) window.applyTheme(defaultColor);
    alert('Tema restaurado para o padrão roxo.');
  }

  function initTabs() {
    const tabs = document.querySelectorAll('.config-tab');
    const panels = document.querySelectorAll('.config-panel');
    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        const target = tab.getAttribute('data-tab');
        tabs.forEach(t => t.classList.remove('active'));
        panels.forEach(p => p.classList.remove('active'));
        tab.classList.add('active');
        document.getElementById(target).classList.add('active');
      });
    });
  }

  // ========== DENÚNCIAS (com busca por nickname) ==========
  function buscarUsuarioPorNickname(nickname) {
    if (!window.usersData) return null;
    return window.usersData.find(u => 
      u.username?.toLowerCase() === nickname.toLowerCase() || 
      u.fullName?.toLowerCase() === nickname.toLowerCase()
    );
  }

  function novaDenuncia() {
    const tipo = prompt("Denunciar o quê? (post, comentario, perfil)");
    if (!tipo) return;
    
    let itemId = null;
    let postId = null;
    
    if (tipo === 'perfil') {
      const nickname = prompt("Digite o nickname ou nome do usuário a ser denunciado:");
      if (!nickname) return;
      const usuario = buscarUsuarioPorNickname(nickname);
      if (!usuario) {
        alert("Usuário não encontrado!");
        return;
      }
      itemId = usuario.id;
    } else if (tipo === 'post') {
      itemId = parseInt(prompt("ID do post:"));
      if (isNaN(itemId)) return;
    } else if (tipo === 'comentario') {
      itemId = parseInt(prompt("ID do comentário:"));
      postId = parseInt(prompt("ID do post onde está o comentário:"));
      if (isNaN(itemId) || isNaN(postId)) return;
    } else {
      alert("Tipo inválido");
      return;
    }
    
    const motivo = prompt("Motivo da denúncia:");
    if (!motivo) return;
    
    const denuncias = JSON.parse(localStorage.getItem('denuncias') || '[]');
    denuncias.push({
      id: Date.now(),
      itemId: itemId,
      tipo: tipo,
      motivo: motivo,
      status: 'pendente',
      descricaoResolucao: null,
      data: new Date().toISOString(),
      denuncianteId: currentUser.id,
      postId: postId
    });
    localStorage.setItem('denuncias', JSON.stringify(denuncias));
    alert("Denúncia registrada.");
    carregarDenunciasTabela();
  }

  function carregarDenunciasTabela() {
    const tbody = document.getElementById('denunciasTableBody');
    if (!tbody) return;
    const denuncias = JSON.parse(localStorage.getItem('denuncias') || '[]');
    tbody.innerHTML = '';
    denuncias.forEach(d => {
      const row = tbody.insertRow();
      row.insertCell(0).innerText = d.id;
      row.insertCell(1).innerText = d.tipo + ' (ID ' + d.itemId + ')';
      row.insertCell(2).innerText = d.motivo;
      row.insertCell(3).innerHTML = `<span class="${d.status === 'pendente' ? 'status-pendente' : 'status-resolvida'}">${d.status}</span>`;
      const descricaoCell = row.insertCell(4);
      descricaoCell.innerText = d.descricaoResolucao || '—';
      const acaoCell = row.insertCell(5);
      if (d.status === 'pendente') {
        const btn = document.createElement('button');
        btn.innerText = 'Resolver';
        btn.className = 'btn-resolver';
        btn.onclick = () => {
          const descricao = prompt("Descreva a ação tomada para resolver esta denúncia:");
          if (descricao && descricao.trim()) {
            d.status = 'resolvida';
            d.descricaoResolucao = descricao.trim();
            localStorage.setItem('denuncias', JSON.stringify(denuncias));
            carregarDenunciasTabela();
            alert("Denúncia resolvida!");
          } else {
            alert("É necessário fornecer uma descrição da resolução.");
          }
        };
        acaoCell.appendChild(btn);
      } else {
        acaoCell.innerText = 'Resolvida';
      }
    });
  }

  document.addEventListener('DOMContentLoaded', () => {
    loadCurrentUser();
    initTabs();
    loadProfileForm();
    loadPrivacyForm();
    loadNotifForm();
    loadAppearanceForm();

    document.getElementById('saveProfileConfig').addEventListener('click', saveProfileForm);
    document.getElementById('savePrivacyConfig').addEventListener('click', savePrivacyForm);
    document.getElementById('saveNotifConfig').addEventListener('click', saveNotifForm);
    document.getElementById('saveAppearanceConfig').addEventListener('click', saveAppearanceForm);
    const resetBtn = document.getElementById('resetThemeBtn');
    if (resetBtn) resetBtn.addEventListener('click', resetTheme);
    
    const colorPicker = document.getElementById('themeColor');
    const hexInput = document.getElementById('hexInput');
    if (colorPicker && hexInput) {
      colorPicker.addEventListener('input', () => { hexInput.value = colorPicker.value; });
      hexInput.addEventListener('input', () => { if (/^#([0-9A-F]{3}){1,2}$/i.test(hexInput.value)) colorPicker.value = hexInput.value; });
    }
    
    const newDenunciaBtn = document.getElementById('newDenunciaBtn');
    if (newDenunciaBtn) newDenunciaBtn.addEventListener('click', novaDenuncia);
    carregarDenunciasTabela();
  });
})();