    // Base de usuários cadastrados (simulando um banco de dados)
  // Em produção, viria do backend.
  const registeredUsers = [
    { id: 1, fullName: "Marina Souza", email: "marina@email.com", password: "123", username: "marinasouza", avatarUrl: "", bannerUrl: "", bio: "Coordenadora de Eventos", pronouns: "ela/dela", periodo: "7º período", isCAMember: true, cargoCA: "Coordenadora de Eventos" },
    { id: 2, fullName: "Rafael Lima", email: "rafael@email.com", password: "123", username: "rafaellima", avatarUrl: "", bannerUrl: "", bio: "Secretário Acadêmico", pronouns: "ele/dele", periodo: "5º período", isCAMember: true, cargoCA: "Secretário Acadêmico" },
    { id: 999, fullName: "Administrador", email: "admin@admin.com", password: "admin", username: "admin", avatarUrl: "", bannerUrl: "", bio: "Administrador do sistema", pronouns: "ele/dele", periodo: "Admin", isCAMember: true, cargoCA: "Administrador", isAdmin: true, followers: [], following: [] }
  ];

  document.getElementById('loginForm').addEventListener('submit', function(e) {
    e.preventDefault();
    const nome = document.getElementById('nome').value.trim();
    const email = document.getElementById('email').value.trim();
    const senha = document.getElementById('senha').value;

    // Verifica se o usuário existe (simulação)
    let user = registeredUsers.find(u => u.email === email && u.password === senha);
    if (!user) {
      // Se não existir, cria um novo (cadastro automático para demonstração)
      user = {
        id: Date.now(),
        fullName: nome,
        email: email,
        username: nome.toLowerCase().replace(/\s/g, ''),
        avatarUrl: "",
        bannerUrl: "",
        bio: "Estudante de BSI.",
        pronouns: "",
        periodo: "Período não informado",
        isCAMember: false,
        cargoCA: "",
        followers: [],
        following: []
      };
    }

    // Salva o usuário completo no localStorage
    localStorage.setItem('currentUser', JSON.stringify(user));
    localStorage.setItem('loggedUser', JSON.stringify({ name: user.fullName, email: user.email }));

    // Redireciona para o feed
    window.location.href = 'feed.html';
  });
