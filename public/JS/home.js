// DOM Elements
const sections = document.querySelectorAll('.form-section');
const navLinks = document.querySelectorAll('.navigation a');

// Show the default section on page load
sections[0].style.display = 'block';

// Event Listeners
navLinks.forEach(link => {
  link.addEventListener('click', e => {
    e.preventDefault();
    const target = document.querySelector(link.getAttribute('href'));
    showSection(target);
  });
});

// Functions
function showSection(section) {
  sections.forEach(section => section.style.display = 'none');
  section.style.display = 'block';
}

// Function to preview the selected image
function previewImage(event) {
    const input = event.target;
    const preview = document.getElementById('preview-image');
    
    if (input.files && input.files[0]) {
      const reader = new FileReader();
      
      reader.onload = function (e) {
        preview.src = e.target.result;
      }
      
      reader.readAsDataURL(input.files[0]);
    }
  }
  function validateForm() {
    var password = document.getElementById("rpassword").value;
    var confirmPassword = document.getElementById("confirm_password").value;
    if (password !== confirmPassword) {
      alert("Password and confirm password do not match");
      return false; // Prevent form submission
    }

    return true; // Allow form submission
  }
  