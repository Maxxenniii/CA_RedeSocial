// js/sidebar.js
(function() {
  function updateSidebar() {
    const userStr = localStorage.getItem('currentUser');
    const avatarDiv = document.getElementById('sidebarAvatar');
    const userNameSpan = document.getElementById('sidebarUserName');
    
    if (userStr && avatarDiv && userNameSpan) {
      const user = JSON.parse(userStr);
      userNameSpan.textContent = user.fullName;
      
      if (user.avatarUrl && user.avatarUrl.trim() !== "") {
        avatarDiv.innerHTML = `<img src="${user.avatarUrl}" style="width:100%; height:100%; object-fit:cover; border-radius:50%;">`;
      } else {
        avatarDiv.innerHTML = user.fullName.charAt(0);
      }

      // Controlar visibilidade dos links do painel CA e Admin
      const linkCA = document.querySelector('#sidebar-container .sidebar-menu li a[href="painel-ca.html"]')?.parentElement;
      const linkAdmin = document.querySelector('#sidebar-container .sidebar-menu li a[href="painel-admin.html"]')?.parentElement;

      if (linkCA) {
        linkCA.style.display = user.isCAMember ? 'block' : 'none';
      }
      if (linkAdmin) {
        linkAdmin.style.display = user.isAdmin ? 'block' : 'none';
      }
    }
  }

  function setupLogout() {
    const logoutBtn = document.getElementById('logoutBtnSidebar');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', (e) => {
        e.preventDefault();
        localStorage.removeItem('loggedUser');
        localStorage.removeItem('currentUser');
        localStorage.removeItem('currentUserAvatar');
        localStorage.removeItem('isCAMember');
        window.location.href = 'fedd_nao_logado.html';
      });
    }
  }

  updateSidebar();
  setupLogout();

  window.addEventListener('avatarChanged', updateSidebar);
  window.addEventListener('storage', function(e) {
    if (e.key === 'currentUser') updateSidebar();
  });
})();