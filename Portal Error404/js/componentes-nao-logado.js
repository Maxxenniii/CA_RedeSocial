// js/componentes-nao-logado.js
document.addEventListener('DOMContentLoaded', function() {
  // Carrega navbar sem notificações (versão simplificada)
  function loadNav() {
    const navContainer = document.getElementById('nav-container');
    if (navContainer) {
      fetch('componentes/nav-nao-logado.html')
        .then(res => res.text())
        .then(html => {
          navContainer.innerHTML = html;
        })
        .catch(() => {
          // fallback caso o arquivo não exista
          navContainer.innerHTML = `
            <div class="nav-left">
              <a href="feed.html"><img src="img/Logo_CA_Branco.png" alt="Logo" class="logo"></a>
              <div class="search-bar"><input type="text" placeholder="Buscar..."><button>Buscar</button></div>
            </div>
            <ul class="nav-links">
              <li><a href="fedd_nao_logado.html">Feed</a></li>
              <li><a href="login.html">Entrar</a></li>
              <li><a href="cadastro.html">Cadastrar</a></li>
            </ul>
          `;
        });
    }
  }

  // Carrega sidebar com call to action para login
  function loadSidebar() {
    const sidebarContainer = document.getElementById('sidebar-container');
    if (sidebarContainer) {
      fetch('componentes/sidebar-nao-logado.html')
        .then(res => res.text())
        .then(html => {
          sidebarContainer.innerHTML = html;
        })
        .catch(() => {
          sidebarContainer.innerHTML = `
            <div class="profile-sidebar" style="text-align:center;">
              <div class="avatar-large">?</div>
              <strong>Visitante</strong>
              <a href="login.html" class="btn-profile">Fazer login</a>
              <a href="cadastro.html" class="btn-profile" style="margin-top:5px;">Cadastrar</a>
            </div>
            <ul class="sidebar-menu">
              <li><a href="fedd_nao_logado.html">Feed</a></li>
              <li><a href="login.html">Login</a></li>
              <li><a href="cadastro.html">Cadastro</a></li>
            </ul>
          `;
        });
    }
  }

  loadNav();
  loadSidebar();
});