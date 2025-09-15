let originalFile = null;
let compressedBlob = null;
let currentFormat = 'jpeg';

// Elements
const uploadArea = document.getElementById('uploadArea');
const fileInput = document.getElementById('fileInput');
const controls = document.getElementById('controls');
const qualitySlider = document.getElementById('qualitySlider');
const qualityValue = document.getElementById('qualityValue');
const formatOptions = document.querySelectorAll('.format-option');
const previewContainer = document.getElementById('previewContainer');
const originalPreview = document.getElementById('originalPreview');
const compressedPreview = document.getElementById('compressedPreview');
const originalInfo = document.getElementById('originalInfo');
const compressedInfo = document.getElementById('compressedInfo');
const downloadBtn = document.getElementById('downloadBtn');
const processing = document.getElementById('processing');
const stats = document.getElementById('stats');
const savings = document.getElementById('savings');
const compressionNote = document.getElementById('compressionNote');
const themeToggle = document.getElementById('themeToggle');
const progressContainer = document.getElementById('progressContainer');
const progressFill = document.getElementById('progressFill');
const progressText = document.getElementById('progressText');

// Navigation Functions
function showSection(sectionName) {
    // Hide all sections
    const sections = document.querySelectorAll('.section');
    sections.forEach(section => {
        section.classList.remove('active');
    });

    // Remove active class from all nav links
    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(link => {
        link.classList.remove('active');
    });

    // Show selected section
    const targetSection = document.getElementById(sectionName);
    if (targetSection) {
        targetSection.classList.add('active');
    }

    // Add active class to clicked nav link
    const activeNavLink = document.querySelector(`[onclick="showSection('${sectionName}')"]`);
    if (activeNavLink) {
        activeNavLink.classList.add('active');
    }

    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Dark Mode Toggle Function
function toggleDarkMode() {
    const body = document.body;
    const themeIcon = document.getElementById('themeToggle');
    
    body.classList.toggle('dark-mode');
    
    if (body.classList.contains('dark-mode')) {
        themeIcon.textContent = '☀️';
    } else {
        themeIcon.textContent = '🌙';
    }
}

// Contact Form Handler
document.addEventListener('DOMContentLoaded', function() {
    const contactForm = document.getElementById('contactForm');
    if (contactForm) {
        contactForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            // Get form data
            const name = document.getElementById('name').value;
            const email = document.getElementById('email').value;
            const subject = document.getElementById('subject').value;
            const message = document.getElementById('message').value;
            
            // Show success message (in a real app, you'd send this to a server)
            alert('Thank you for your message! We\'ll get back to you within 24 hours.');
            
            // Reset form
            this.reset();
        });
    }
});

// Event Listeners
uploadArea.addEventListener('click', () => fileInput.click());
uploadArea.addEventListener('dragover', handleDragOver);
uploadArea.addEventListener('dragleave', handleDragLeave);
uploadArea.addEventListener('drop', handleDrop);
fileInput.addEventListener('change', handleFileSelect);
qualitySlider.addEventListener('input', updateQuality);
formatOptions.forEach(option => {
    option.addEventListener('click', () => selectFormat(option.dataset.format));
});
downloadBtn.addEventListener('click', downloadImage);
themeToggle.addEventListener('click', toggleDarkMode);

function handleDragOver(e) {
    e.preventDefault();
    uploadArea.classList.add('dragover');
}

function handleDragLeave(e) {
    e.preventDefault();
    uploadArea.classList.remove('dragover');
}

function handleDrop(e) {
    e.preventDefault();
    uploadArea.classList.remove('dragover');
    const files = e.dataTransfer.files;
    if (files.length > 0) {
        handleFile(files[0]);
    }
}

function handleFileSelect(e) {
    const file = e.target.files[0];
    if (file) {
        handleFile(file);
    }
}

function handleFile(file) {
    if (!file.type.startsWith('image/')) {
        alert('Please select a valid image file!');
        return;
    }

    // Check for SVG files
    if (file.type === 'image/svg+xml') {
        handleSVGFile(file);
        return;
    }

    originalFile = file;
    controls.style.display = 'block';
    
    // Show original image
    const reader = new FileReader();
    reader.onload = (e) => {
        originalPreview.src = e.target.result;
        originalInfo.textContent = `${formatFileSize(file.size)} • ${file.type}`;
        processImage();
    };
    reader.readAsDataURL(file);
}

function handleSVGFile(file) {
    // SVG files don't need compression, just display them
    const reader = new FileReader();
    reader.onload = (e) => {
        originalPreview.src = e.target.result;
        originalInfo.textContent = `${formatFileSize(file.size)} • ${file.type}`;
        
        // For SVG, just copy the original as compressed
        compressedPreview.src = e.target.result;
        compressedInfo.textContent = `${formatFileSize(file.size)} • ${file.type} (No compression needed)`;
        
        // Show compression note for SVG
        compressionNote.textContent = '📝 SVG is a vector format and doesn\'t need compression';
        compressionNote.style.display = 'block';
        
        // Set savings to 0%
        savings.textContent = '0% (Vector format)';
        savings.style.color = '#ff9800';
        
        // Create blob for download
        compressedBlob = file;
        
        // Show results
        previewContainer.style.display = 'block';
        downloadBtn.style.display = 'block';
        controls.style.display = 'none';
    };
    reader.readAsDataURL(file);
}

function updateQuality() {
    qualityValue.textContent = qualitySlider.value + '%';
    if (originalFile) {
        processImage();
    }
}

function selectFormat(format) {
    formatOptions.forEach(option => {
        option.classList.toggle('active', option.dataset.format === format);
    });
    currentFormat = format;
    if (originalFile) {
        processImage();
    }
}

function updateProgress(percentage, text) {
    progressFill.style.width = percentage + '%';
    progressText.textContent = text;
}

function processImage() {
    // Hide previous results and show progress
    processing.style.display = 'none';
    previewContainer.style.display = 'none';
    downloadBtn.style.display = 'none';
    compressionNote.style.display = 'none';
    progressContainer.style.display = 'block';
    
    // Reset progress
    updateProgress(0, 'Starting compression...');

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    img.onload = () => {
        updateProgress(25, 'Analyzing image...');
        
        setTimeout(() => {
            let canvasWidth = img.width;
            let canvasHeight = img.height;
            
            updateProgress(50, 'Resizing image...');
            
            // For PNG compression, we'll reduce dimensions based on quality
            if (currentFormat === 'png') {
                const scaleFactor = Math.sqrt(qualitySlider.value / 100);
                canvasWidth = Math.round(img.width * scaleFactor);
                canvasHeight = Math.round(img.height * scaleFactor);
            }
            
            canvas.width = canvasWidth;
            canvas.height = canvasHeight;
            
            // Use better image smoothing
            ctx.imageSmoothingEnabled = true;
            ctx.imageSmoothingQuality = 'high';
            
            ctx.drawImage(img, 0, 0, canvasWidth, canvasHeight);

            updateProgress(75, 'Applying compression...');

            setTimeout(() => {
                const quality = qualitySlider.value / 100;
                let mimeType = `image/${currentFormat}`;
                
                // Handle different formats
                let compressionQuality = quality;
                if (currentFormat === 'png') {
                    // PNG doesn't support quality in toBlob, so we've already handled it with scaling
                    compressionQuality = undefined;
                } else if (currentFormat === 'webp') {
                    // WebP supports quality parameter
                    compressionQuality = quality;
                } else if (currentFormat === 'avif') {
                    // AVIF supports quality parameter
                    compressionQuality = quality;
                }

                // Check if browser supports AVIF
                if (currentFormat === 'avif' && !canvasSupportsFormat('image/avif')) {
                    alert('Your browser doesn\'t support AVIF format. Falling back to WebP.');
                    currentFormat = 'webp';
                    mimeType = 'image/webp';
                    compressionQuality = quality;
                    
                    // Update UI to show WebP is selected
                    formatOptions.forEach(option => {
                        option.classList.toggle('active', option.dataset.format === 'webp');
                    });
                }

                canvas.toBlob((blob) => {
                    updateProgress(100, 'Finalizing...');
                    
                    setTimeout(() => {
                        compressedBlob = blob;
                        
                        // Show compressed image
                        const url = URL.createObjectURL(blob);
                        compressedPreview.src = url;
                        compressedInfo.textContent = `${formatFileSize(blob.size)} • ${mimeType}`;

                        // Show compression note for different formats
                        if (currentFormat === 'png') {
                            compressionNote.textContent = '📝 PNG compressed by resizing (PNG is lossless format)';
                            compressionNote.style.display = 'block';
                        } else if (currentFormat === 'webp') {
                            compressionNote.textContent = '✨ WebP format provides better compression than JPEG';
                            compressionNote.style.display = 'block';
                        } else if (currentFormat === 'avif') {
                            compressionNote.textContent = '🚀 AVIF format provides the best compression (50% better than JPEG)';
                            compressionNote.style.display = 'block';
                        }

                        // Calculate savings
                        const savedBytes = originalFile.size - blob.size;
                        const savedPercent = Math.round((savedBytes / originalFile.size) * 100);
                        savings.textContent = `${savedPercent}%`;
                        
                        if (savedPercent > 0) {
                            savings.style.color = '#4CAF50';
                        } else if (savedPercent === 0) {
                            savings.style.color = '#ff9800';
                            savings.textContent = '0% (Same size)';
                        } else {
                            savings.style.color = '#ff6b6b';
                            savings.textContent = `${Math.abs(savedPercent)}% (Larger)`;
                        }

                        progressContainer.style.display = 'none';
                        previewContainer.style.display = 'block';
                        downloadBtn.style.display = 'block';
                    }, 500);
                }, mimeType, compressionQuality);
            }, 500);
        }, 500);
    };

    img.src = URL.createObjectURL(originalFile);
}

function downloadImage() {
    if (compressedBlob) {
        const url = URL.createObjectURL(compressedBlob);
        const a = document.createElement('a');
        let extension = currentFormat;
        
        // Handle different extensions
        if (currentFormat === 'jpeg') {
            extension = 'jpg';
        } else if (compressedBlob.type === 'image/svg+xml') {
            extension = 'svg';
        }
        
        a.href = url;
        a.download = `compressed_image.${extension}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }
}

// Helper function to check if browser supports a format
function canvasSupportsFormat(format) {
    const canvas = document.createElement('canvas');
    canvas.width = 1;
    canvas.height = 1;
    return canvas.toDataURL(format).indexOf('data:' + format) === 0;
}

function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}