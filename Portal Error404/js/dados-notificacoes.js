// Dados globais simulados de notificações
window.notificationsData = [
  { id: 1, icon: 'img/megafone_icon.png', text: '<strong>Novo post</strong> no Fórum CA', time: 'há 5 min', read: false },
  { id: 2, icon: 'img/chat_icon.png', text: '<strong>Maria</strong> comentou no seu post', time: 'há 30 min', read: false },
  { id: 3, icon: 'img/like_icon.png', text: '<strong>João</strong> curtiu sua resposta', time: 'há 1 h', read: false },
  { id: 4, icon: 'img/agenda_icon.png', text: 'Evento <strong>CA</strong> amanhã às 14h', time: 'há 3 h', read: true },
  { id: 5, icon: 'img/notificacao_icon.png', text: '<strong>Lembrete:</strong> Inscrições para o workshop encerram hoje', time: 'há 5 h', read: true },
  { id: 6, icon: 'img/fixa_icon.png', text: '<strong>Pedro</strong> fixou um post no grupo', time: 'há 1 dia', read: true },
];

// Funções auxiliares globais
window.markNotifAsRead = function(id) {
  const notif = window.notificationsData.find(n => n.id === id);
  if (notif) notif.read = true;
};

window.markAllNotifsAsRead = function() {
  window.notificationsData.forEach(n => n.read = true);
};

window.deleteNotif = function(id) {
  const index = window.notificationsData.findIndex(n => n.id === id);
  if (index !== -1) window.notificationsData.splice(index, 1);
};

window.clearReadNotifs = function() {
  window.notificationsData = window.notificationsData.filter(n => !n.read);
};

window.getUnreadCount = function() {
  return window.notificationsData.filter(n => !n.read).length;
};