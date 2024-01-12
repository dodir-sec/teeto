document.querySelectorAll('.tab-button').forEach(button => {
    button.addEventListener('click', function () {
      document.querySelectorAll('.tab-button').forEach(btn => {
        btn.classList.remove('active');
      });
      document.querySelectorAll('.tab-content').forEach(content => {
        content.style.display = 'none';
      });
      this.classList.add('active');
      document.getElementById(this.dataset.tab).style.display = 'block';
    });
  });