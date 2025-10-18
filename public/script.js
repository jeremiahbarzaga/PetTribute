// State management
let tributes = [];
let currentImageBase64 = '';

// DOM elements
const form = document.getElementById('tribute-form');
const petNameInput = document.getElementById('petName');
const petPhotoInput = document.getElementById('petPhoto');
const petDescriptionInput = document.getElementById('petDescription');
const imagePreview = document.getElementById('imagePreview');
const charCount = document.getElementById('charCount');
const galleryContent = document.getElementById('gallery-content');
const toastContainer = document.getElementById('toast-container');

// Google Apps Script URL (replace with your deployed web app URL)
const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbz_2SSz7-7rXkBHkHB9I10VCVA40GqOg8p2t343N1Ai8TKq9jIwKxifzIRqsUwoQFL_/exec';

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    setupEventListeners();
    loadTributes(); // Load tributes from Google Sheet
});

// Event listeners
function setupEventListeners() {
    form.addEventListener('submit', handleSubmit);
    petPhotoInput.addEventListener('change', handleImageUpload);
    petDescriptionInput.addEventListener('input', updateCharCount);
}

// Handle form submission
function handleSubmit(e) {
    e.preventDefault();

    const name = petNameInput.value.trim();
    const description = petDescriptionInput.value.trim();

    if (!name || !description || !currentImageBase64) {
        showToast('Missing information', 'Please fill in all fields and upload a photo', 'destructive');
        return;
    }

    const newTribute = {
        id: generateId(),
        name,
        description,
        imageBase64: currentImageBase64,
        createdAt: new Date().toISOString()
    };

    // Save to Google Sheet
    saveTributeToSheet(newTribute)
        .then(() => {
            tributes.unshift(newTribute);
            renderGallery();
            resetForm();
            showToast('Tribute created', `${name}'s memory has been lovingly preserved.`);
        })
        .catch(err => {
            console.error(err);
            showToast('Error', 'Failed to save tribute. Please try again.', 'destructive');
        });
}

// Handle image upload
function handleImageUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
        showToast('File too large', 'Please select an image smaller than 5MB', 'destructive');
        petPhotoInput.value = '';
        return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
        currentImageBase64 = reader.result;
        showImagePreview(currentImageBase64);
    };
    reader.readAsDataURL(file);
}

// Show image preview
function showImagePreview(base64) {
    imagePreview.innerHTML = `<img src="${base64}" alt="Preview">`;
    imagePreview.classList.remove('hidden');
}

// Update character count
function updateCharCount() {
    charCount.textContent = petDescriptionInput.value.length;
}

// Reset form
function resetForm() {
    form.reset();
    currentImageBase64 = '';
    imagePreview.innerHTML = '';
    imagePreview.classList.add('hidden');
    charCount.textContent = '0';
}

// Render gallery
function renderGallery() {
    if (tributes.length === 0) {
        galleryContent.innerHTML = `<div class="empty-gallery">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
            </svg>
            <h3>No tributes yet</h3>
            <p>Be the first to honor a beloved companion</p>
        </div>`;
        return;
    }

    const galleryHTML = `
        <div class="gallery-header">
            <h2>Memorial Gallery</h2>
            <p>Celebrating the lives of our cherished companions</p>
        </div>
        <div class="gallery-grid">
            ${tributes.map(tribute => createTributeCard(tribute)).join('')}
        </div>
    `;
    galleryContent.innerHTML = galleryHTML;
}

// Create tribute card HTML
function createTributeCard(tribute) {
    const dateStr = formatDate(tribute.createdAt);
    return `
        <div class="card tribute-card">
            <div class="tribute-image-wrapper">
                <img src="${tribute.imageBase64}" alt="${tribute.name}" class="tribute-image">
                <div class="tribute-image-overlay"></div>
                <h3 class="tribute-name">${escapeHtml(tribute.name)}</h3>
            </div>
            <div class="tribute-body">
                <div class="tribute-header">
                    <svg class="icon" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                    </svg>
                    <h4>Forever in Our Hearts</h4>
                </div>
                <p class="tribute-date">${dateStr}</p>
                <p class="tribute-description">${escapeHtml(tribute.description)}</p>
            </div>
        </div>
    `;
}

// Load tributes from Google Sheet
function loadTributes() {
    fetch(SCRIPT_URL + '?action=get')
        .then(res => res.json())
        .then(data => {
            tributes = data.map(item => ({
                id: generateId(),
                name: item.name,
                description: item.description,
                imageBase64: item.imageBase64,
                createdAt: item.createdAt
            }));
            renderGallery();
        })
        .catch(err => console.error('Failed to load tributes:', err));
}

// Save tribute to Google Sheet
function saveTributeToSheet(tribute) {
    return fetch(SCRIPT_URL, {
        method: 'POST',
        body: JSON.stringify(tribute),
        headers: { 'Content-Type': 'application/json' }
    }).then(res => res.json());
}

// Toast notification
function showToast(title, description, variant = '') {
    const toast = document.createElement('div');
    toast.className = `toast ${variant}`;
    toast.innerHTML = `<div class="toast-title">${escapeHtml(title)}</div>
                       <div class="toast-description">${escapeHtml(description)}</div>`;
    toastContainer.appendChild(toast);
    setTimeout(() => {
        toast.style.animation = 'fadeOut 0.3s ease-out';
        setTimeout(() => toastContainer.removeChild(toast), 300);
    }, 5000);
}

// Utility
function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

function formatDate(date) {
    const d = new Date(date);
    return d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}
