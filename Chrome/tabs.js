document.querySelectorAll('.tab-button').forEach(button => {
    button.addEventListener('click', function () {
      // Remove active class from all tab buttons
      document.querySelectorAll('.tab-button').forEach(btn => {
        btn.classList.remove('active');
      });
      // Hide all tab contents
      document.querySelectorAll('.tab-content').forEach(content => {
        content.style.display = 'none';
      });
      // Set the clicked tab button as active
      this.classList.add('active');
      // Display the corresponding tab content
      document.getElementById(this.dataset.tab).style.display = 'block';
    });
  });