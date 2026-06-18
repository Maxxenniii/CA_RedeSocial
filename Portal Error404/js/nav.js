// js/nav.js
(function() {
  // Função para inicializar o dropdown de notificações
  function initNav() {
    const bell = document.getElementById('notificationBell');
    const dropdown = document.getElementById('notificationDropdown');
    if (!bell || !dropdown || !window.notificationsData) {
      setTimeout(initNav, 100);
      return;
    }

    const badge = bell.querySelector('.badge');

    function renderDropdown() {
      const notifs = window.notificationsData;
      dropdown.innerHTML = `
        <div class="dropdown-header">
          <h4><img src="img/notificacao_icon.png" alt="icon" width="20px" class="icon"> Notificações</h4>
          <button class="mark-all-read">Marcar lidas</button>
        </div>
        <ul class="notification-list">
          ${notifs.map(n => `
            <li class="notification-item ${n.read ? 'read' : 'unread'}" data-id="${n.id}">
              <div class="notif-icon"><img src="${n.icon}" alt="ícone" class="notif-img"></div>
              <div class="notif-content">
                <p class="notif-text">${n.text}</p>
                <span class="notif-time">${n.time}</span>
              </div>
            </li>
          `).join('')}
        </ul>
        <div class="dropdown-footer">
          <a href="notificacoes.html">Ver todas as notificações →</a>
        </div>
      `;

      updateBadge();

      const markAllBtn = dropdown.querySelector('.mark-all-read');
      if (markAllBtn) {
        markAllBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          window.markAllNotifsAsRead();
          renderDropdown();
        });
      }

      dropdown.querySelectorAll('.notification-item').forEach(item => {
        item.addEventListener('click', () => {
          const id = parseInt(item.dataset.id);
          const notif = window.notificationsData.find(n => n.id === id);
          if (notif && !notif.read) {
            window.markNotifAsRead(id);
            renderDropdown();
          }
        });
      });
    }

    function updateBadge() {
      const count = window.getUnreadCount();
      if (badge) {
        badge.textContent = count;
        badge.style.display = count > 0 ? 'flex' : 'none';
      }
    }

    // Eventos do sino
    bell.addEventListener('click', (e) => {
      e.stopPropagation();
      dropdown.classList.toggle('active');
    });

    document.addEventListener('click', (e) => {
      if (!bell.contains(e.target) && !dropdown.contains(e.target)) {
        dropdown.classList.remove('active');
      }
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && dropdown.classList.contains('active')) {
        dropdown.classList.remove('active');
        bell.focus();
      }
    });

    renderDropdown();
  }

  // Função de logout
  function setupLogout() {
    const logoutLink = document.getElementById('logoutNavLink');
    if (logoutLink) {
      logoutLink.addEventListener('click', (e) => {
        e.preventDefault();
        localStorage.removeItem('loggedUser');
        localStorage.removeItem('currentUser');
        localStorage.removeItem('currentUserAvatar');
        localStorage.removeItem('isCAMember');
        window.location.href = 'fedd_nao_logado.html';
      });
    }
  }

  // Inicializa quando o DOM estiver pronto
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      initNav();
      setupLogout();
    });
  } else {
    initNav();
    setupLogout();
  }
})();