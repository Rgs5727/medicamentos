document.addEventListener('DOMContentLoaded', function() {
    const sidebar = document.getElementById('adminSidebar');
    const btnClose = document.getElementById('closeAdminSidebar');
    const btnOpen = document.getElementById('adminToggleBtn');

    // Fecha a sidebar ao clicar no "X"
    btnClose.addEventListener('click', function() {
        sidebar.classList.add('hidden');
    });

    // Abre a sidebar ao clicar no botão "Gerenciar Admin"
    btnOpen.addEventListener('click', function() {
        sidebar.classList.remove('hidden');
    });
});