const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbxQmYWsBcQZsZ0fZCeBln3fINLvrz9y2riExKCMollP_Ap7yVAst8uXkYxxLtyFx1Go/exec'; // Replace with your Apps Script URL
let tributes = [];
let currentImageBase64 = '';

document.addEventListener('DOMContentLoaded', () => {
  setupEventListeners();
  fetchTributes();
});

function setupEventListeners() {
  document.getElementById('tribute-form').addEventListener('submit', handleSubmit);
  document.getElementById('petPhoto').addEventListener('change', handleImageUpload);
  document.getElementById('petDescription').addEventListener('input', updateCharCount);
}

function handleSubmit(e) {
  e.preventDefault();

  const name = document.getElementById('petName').value.trim();
  const description = document.getElementById('petDescription').value.trim();

  if (!name || !description || !currentImageBase64) {
    alert('Please fill in all fields and upload a photo.');
    return;
  }

  // Encode data for GET request
  const url = `${SCRIPT_URL}?name=${encodeURIComponent(name)}&description=${encodeURIComponent(description)}&image=${encodeURIComponent(currentImageBase64)}`;

  fetch(url)
    .then(res => res.text())
    .then(() => {
      fetchTributes(); // Refresh gallery
      resetForm();
    })
    .catch(err => console.error(err));
}

function handleImageUpload(e) {
  const file = e.target.files[0];
  if (!file) return;

  if (file.size > 5 * 1024 * 1024) { // 5MB limit
    alert('File too large. Max 5MB.');
    return;
  }

  const reader = new FileReader();
  reader.onloadend = () => {
    currentImageBase64 = reader.result;
    document.getElementById('imagePreview').innerHTML = `<img src="${currentImageBase64}" alt="Preview">`;
  };
  reader.readAsDataURL(file);
}

function updateCharCount() {
  document.getElementById('charCount').textContent = document.getElementById('petDescription').value.length;
}

function resetForm() {
  document.getElementById('tribute-form').reset();
  document.getElementById('imagePreview').innerHTML = '';
  currentImageBase64 = '';
  document.getElementById('charCount').textContent = '0';
}

function fetchTributes() {
  fetch(SCRIPT_URL)
    .then(res => res.json())
    .then(data => {
      tributes = data.reverse(); // latest first
      renderGallery();
    })
    .catch(err => console.error(err));
}

function renderGallery() {
  const gallery = document.getElementById('gallery-content');
  if (!tributes.length) {
    gallery.innerHTML = '<p>No tributes yet.</p>';
    return;
  }

  gallery.innerHTML = tributes.map(t => `
    <div class="tribute-card">
      <img src="${t.imageBase64}" alt="${t.name}">
      <h3>${t.name}</h3>
      <p>${t.description}</p>
      <small>${new Date(t.createdAt).toLocaleString()}</small>
    </div>
  `).join('');
}
