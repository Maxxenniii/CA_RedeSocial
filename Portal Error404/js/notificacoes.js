document.addEventListener('DOMContentLoaded', function() {
  const listElement = document.getElementById('notificationsList');
  const emptyState = document.getElementById('emptyState');
  const btnMarkAllRead = document.querySelector('.btn-mark-all-read');
  const btnClearRead = document.querySelector('.btn-clear-read');
  const filterButtons = document.querySelectorAll('.filter-btn');

  if (!listElement) return;
  if (!window.notificationsData) {
    console.error('Dados de notificações não encontrados.');
    return;
  }

  let currentFilter = 'all';

  function renderNotifications() {
    const data = window.notificationsData;
    let filtered = data.filter(notif => {
      if (currentFilter === 'unread') return !notif.read;
      if (currentFilter === 'read') return notif.read;
      return true;
    });

    listElement.innerHTML = '';

    if (filtered.length === 0) {
      emptyState.style.display = 'block';
    } else {
      emptyState.style.display = 'none';
      filtered.forEach(notif => {
        const card = document.createElement('li');
        card.className = `notification-card ${notif.read ? 'read' : 'unread'}`;
        card.dataset.id = notif.id;
        const iconHtml = `<img src="${notif.icon}" alt="ícone" class="notif-img">`;
        card.innerHTML = `
          <div class="notif-icon-wrapper">${iconHtml}</div>
          <div class="notif-body">
            <p>${notif.text}</p>
            <span class="notif-time">${notif.time}</span>
            <div class="notif-actions">
              ${!notif.read ? '<button class="mark-read-btn">Marcar como lida</button>' : ''}
              <button class="delete-btn">Excluir</button>
            </div>
          </div>
        `;

        if (!notif.read) {
          card.querySelector('.mark-read-btn').addEventListener('click', function(e) {
            e.stopPropagation();
            window.markNotifAsRead(notif.id);
            renderNotifications();
          });
        }

        card.querySelector('.delete-btn').addEventListener('click', function(e) {
          e.stopPropagation();
          window.deleteNotif(notif.id);
          renderNotifications();
        });

        listElement.appendChild(card);
      });
    }
  }

  btnMarkAllRead.addEventListener('click', function() {
    window.markAllNotifsAsRead();
    renderNotifications();
  });

  btnClearRead.addEventListener('click', function() {
    window.clearReadNotifs();
    renderNotifications();
  });

  filterButtons.forEach(btn => {
    btn.addEventListener('click', function() {
      filterButtons.forEach(b => b.classList.remove('active'));
      this.classList.add('active');
      currentFilter = this.dataset.filter;
      renderNotifications();
    });
  });

  renderNotifications();
});