// js/componentes.js
document.addEventListener('DOMContentLoaded', function() {
  // Carrega script de dados primeiro
  const dataScript = document.createElement('script');
  dataScript.src = 'js/dados-notificacoes.js';
  document.head.appendChild(dataScript);

  function getLoggedUser() {
    const saved = localStorage.getItem('loggedUser');
    if (saved) {
      try { return JSON.parse(saved); } catch(e) {}
    }
    return null;
  }

  function getCurrentUserAvatar() {
    const saved = localStorage.getItem("currentUserAvatar");
    if (saved) {
      try { return JSON.parse(saved); } catch(e) {}
    }
    return { text: "EU", url: "" };
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

  function renderAvatar(avatarText, avatarUrl, size = "70px") {
    if (avatarUrl && avatarUrl.trim() !== "") {
      return `<img src="${escapeHtml(avatarUrl)}" alt="avatar" style="width:${size}; height:${size}; object-fit:cover; border-radius:50%; border:3px solid var(--violet);">`;
    } else {
      const displayText = avatarText ? avatarText.substring(0,2).toUpperCase() : "EU";
      return `<div style="width:${size}; height:${size}; background:var(--gray-mid); border-radius:50%; display:flex; align-items:center; justify-content:center; border:3px solid var(--violet); color:var(--lime); font-size:2rem; font-weight:bold;">${escapeHtml(displayText)}</div>`;
    }
  }

  function loadSidebar() {
    const sidebarContainer = document.getElementById('sidebar-container');
    if (sidebarContainer) {
      fetch('componentes/sidebar.html')
        .then(res => res.text())
        .then(html => {
          sidebarContainer.innerHTML = html;
          // Carrega o script da sidebar que vai atualizar os dados e o logout
          const script = document.createElement('script');
          script.src = 'js/sidebar.js';
          document.body.appendChild(script);
        });
    }
  }

  function loadNav() {
    const navContainer = document.getElementById('nav-container');
    if (navContainer) {
      fetch('componentes/nav.html')
        .then(res => res.text())
        .then(html => {
          navContainer.innerHTML = html;
          const script = document.createElement('script');
          script.src = 'js/nav.js';
          document.body.appendChild(script);
        });
    }
  }

  window.addEventListener('avatarChanged', function() {
    loadSidebar(); // recarrega sidebar para refletir novo avatar
  });

  dataScript.onload = function() {
    loadNav();
    loadSidebar();
  };

  setTimeout(() => {
    if (window.notificationsData) {
      loadNav();
      loadSidebar();
    }
  }, 100);
});