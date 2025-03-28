// script.js

document.addEventListener('DOMContentLoaded', function () {
  const dropArea = document.getElementById('drop-area');
  const fileInput = document.getElementById('fileInput');
  const progressBar = document.getElementById('progress-bar');
  const progressContainer = document.querySelector('.progress');
  const upsizingOptions = document.getElementById('upsizing-options');
  const thumbnail = document.getElementById('thumbnail');
  const upsizingForm = document.getElementById('upsizing-form');
  const finalPrice = document.getElementById('final-price');

  dropArea.addEventListener('click', () => fileInput.click());
  fileInput.addEventListener('change', handleFileSelect);
  dropArea.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropArea.classList.add('dragover');
  });
  dropArea.addEventListener('dragleave', () => dropArea.classList.remove('dragover'));
  dropArea.addEventListener('drop', handleDrop);

  function handleFileSelect(event) {
    const file = event.target.files[0];
    validateFile(file);
  }

  function handleDrop(event) {
    event.preventDefault();
    dropArea.classList.remove('dragover');
    const file = event.dataTransfer.files[0];
    validateFile(file);
  }

  function validateFile(file) {
    if (!file) return;
    const validTypes = ['image/jpeg', 'image/png', 'image/heic', 'image/tiff'];
    if (!validTypes.includes(file.type)) {
      alert('Unsupported file format!');
      return;
    }
    if (file.size > 3 * 1024 * 1024 * 1024) {
      alert('File exceeds 3GB limit.');
      return;
    }
    uploadFile(file);
  }

  function uploadFile(file) {
    const formData = new FormData();
    formData.append("file", file);

    progressContainer.style.display = "block";
    progressBar.style.width = "0%";

    fetch("upload.php", {
      method: "POST",
      body: formData,
    })
      .then((response) => response.json())
      .then((data) => {
        progressBar.style.width = "100%";
        if (data.success && data.thumbnailUrl) {
          showUpsizingOptions(
            data.thumbnailUrl,
            data.fileName,
            data.fileSizeMB,
            data.imageWidth,
            data.imageHeight
          );
        } else {
          alert("Upload failed: " + (data.error || "Unknown error"));
        }
      })
      .catch((error) => {
        console.error("Upload failed", error);
        alert("An error occurred during upload.");
      });
  }

  function showUpsizingOptions(thumbnailUrl, fileName, fileSizeMB, width, height) {
    upsizingOptions.style.display = 'block';
    thumbnail.src = thumbnailUrl;
    thumbnail.style.display = 'block';

    const metaBox = document.getElementById('file-meta');
    const widthInches = Math.round(width / 300);
    const heightInches = Math.round(height / 300);
    const aspectRatio = widthInches / heightInches;

    metaBox.innerText = `File: ${fileName} | ${fileSizeMB} MB | Current Print Size: ${widthInches}" x ${heightInches}"`;

    // Clear previous form content and initialize new options as needed
    upsizingForm.innerHTML = '<p>Ready to process the uploaded file.</p>';
  }
});
