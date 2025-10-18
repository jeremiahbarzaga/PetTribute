const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbyTGrMVr2E8v7M6T7_XkuH40lbeRl8xb7qDn35hn1jXriPilzHW93CBGlWLnKCw_FZW/exec';
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

async function handleSubmit(e) {
  e.preventDefault();

  const name = document.getElementById('petName').value.trim();
  const description = document.getElementById('petDescription').value.trim();

  if (!name || !description || !currentImageBase64) {
    alert('Please fill in all fields and upload a photo.');
    return;
  }

  const tributeData = { name, description, imageBase64: currentImageBase64 };

  try {
    const response = await fetch(SCRIPT_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(tributeData)
    });

    const result = await response.json();
    if (result.status === 'success') {
      fetchTributes(); // Refresh gallery
      resetForm();
    } else {
      alert('Error saving tribute: ' + result.message);
    }
  } catch (err) {
    console.error(err);
    alert('Error saving tribute. See console for details.');
  }
}

function handleImageUpload(e) {
  const file = e.target.files[0];
  if (!file) return;

  if (file.size > 5 * 1024 * 1024) {
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

async function fetchTributes() {
  try {
    const res = await fetch(SCRIPT_URL);
    const data = await res.json();
    tributes = data.reverse(); // latest first
    renderGallery();
  } catch (err) {
    console.error(err);
    document.getElementById('gallery-content').innerHTML = '<p>Error loading tributes.</p>';
  }
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
