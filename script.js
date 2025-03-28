document.addEventListener('DOMContentLoaded', function () {
  const dropArea = document.getElementById('drop-area');
  const fileInput = document.getElementById('fileInput');
  const progressBar = document.getElementById('progress-bar');
  const progressContainer = document.querySelector('.progress');
  const upsizingOptions = document.getElementById('upsizing-options');
  const thumbnail = document.getElementById('thumbnail');
  const upsizingForm = document.getElementById('upsizing-form');
  const finalPrice = document.getElementById('final-price');

  const addToCartBtn = document.getElementById('add-to-cart');
  if (addToCartBtn) {
    addToCartBtn.addEventListener('click', () => {
      alert('Your image service has been added to the cart!');
    });
  }

  function updatePrice(basePrice) {
    const summary = document.getElementById('summary');
    const selectedSize = document.querySelector('input[name="upsizing"]:checked');
    const selectedAddons = Array.from(document.querySelectorAll('.addon:checked'));
    const sizeLabel = selectedSize ? selectedSize.parentElement.textContent.trim() : '';
    const addonsList = selectedAddons.map(cb => cb.parentElement.textContent.trim());
    let summaryText = `<strong>Selected:</strong><br>Size: ${sizeLabel}<br>`;
    if (addonsList.length) {
      summaryText += `Add-ons:<ul style='margin: 5px 0;'>` + addonsList.map(add => `<li>${add}</li>`).join('') + `</ul>`;
    } else {
      summaryText += `Add-ons: None`;
    }
    summary.innerHTML = summaryText;
    let total = basePrice;
    document.querySelectorAll('.addon:checked').forEach(cb => {
      total += parseInt(cb.getAttribute('data-price')) || 0;
    });
    document.getElementById('sticky-price-bar').innerText = `Price: $${total}.00`;
  }

  dropArea.addEventListener('click', () => fileInput.click());
  fileInput.addEventListener('change', handleFileSelect);
  dropArea.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropArea.style.borderColor = '#4caf50';
  });
  dropArea.addEventListener('dragleave', () => dropArea.style.borderColor = '#ccc');
  dropArea.addEventListener('drop', handleDrop);

  function handleFileSelect(event) {
    const file = event.target.files[0];
    validateFile(file);
  }

  function handleDrop(event) {
    event.preventDefault();
    dropArea.style.borderColor = '#ccc';
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
    progressContainer.style.display = 'block';
    progressBar.style.width = '0%';
    let progress = 0;
    const interval = setInterval(() => {
      progress += 10;
      progressBar.style.width = progress + '%';
      if (progress >= 100) {
        clearInterval(interval);
        showUpsizingOptions(file);
      }
    }, 300);
  }

  function showUpsizingOptions(file) {
    upsizingOptions.style.display = 'block';
    thumbnail.src = URL.createObjectURL(file);
    thumbnail.style.display = 'block';
    const fileName = file.name;
    const fileSize = (file.size / 1024 / 1024).toFixed(2);
    const metaBox = document.getElementById('file-meta');

    const img = new Image();
    img.src = URL.createObjectURL(file);
    img.onload = function () {
      const widthInches = Math.round(img.width / 300);
      const heightInches = Math.round(img.height / 300);
      const aspectRatio = widthInches / heightInches;
      metaBox.innerText = `File: ${fileName} | ${fileSize} MB | Current Print Size: ${widthInches}" x ${heightInches}"`;

      let formHtml = '';
      [1, 2, 3, 4, 5, 6].forEach(multiplier => {
        const upWidth = Math.round(widthInches * multiplier);
        const upHeight = Math.round(heightInches * multiplier);
        const price = upWidth + upHeight;
        formHtml += `<label><input type="radio" name="upsizing" value="${price}" data-price="${price}" ${multiplier === 4 ? 'checked' : ''}> x${multiplier} (${upWidth}" x ${upHeight}")${multiplier === 1 ? ' Clean My File Only' : ''} <span class="tooltip-icon"  title="${multiplier === 1 ? 'This option only cleans your original image without upsizing.' : multiplier === 2 ? 'Double the print size of your image.' : multiplier === 3 ? 'Triple your image size for larger prints.' : multiplier === 4 ? 'Ideal enlargement with quality and size balance.' : multiplier === 5 ? 'Very large enlargement â€“ quality may vary.' : multiplier === 6 ? 'Maximum enlargement â€“ best for very large prints.' : ''}" style="cursor: help; font-size: 0.9em; color: #888;"><i class="fas fa-info-circle"></i></span>${multiplier === 4 ? ' <span style="color: green; font-weight: bold;">Recommended!</span>' : ''}</label><br>`;
      });

      formHtml += `<label><input type="radio" name="upsizing" value="custom" id="custom-size-radio"> Custom Size <span class="tooltip-icon" title="Enter your own dimensions." style="cursor: help; font-size: 0.9em; color: #888;"><i class="fas fa-info-circle"></i></span></label><br>
        <div id="custom-size-fields" style="display: none;">
          <input type="number" id="custom-width" placeholder="Width (inches)">
          <input type="number" id="custom-height" placeholder="Height (inches)">
          <label><input type="checkbox" id="lock-aspect" checked> Lock Aspect Ratio</label>
        </div>`;

      upsizingForm.innerHTML = formHtml;

      const defaultRadio = document.querySelector('input[name="upsizing"]:checked');
      if (defaultRadio && defaultRadio.value !== 'custom') {
        const base = parseInt(defaultRadio.getAttribute('data-price')) || 0;
        updatePrice(base);
      }

      function updateCustomPrice() {
        const width = parseInt(document.getElementById('custom-width').value) || 0;
        const height = parseInt(document.getElementById('custom-height').value) || 0;
        let base = 0;
        if (width > 0 && height > 0) base = width + height;
        updatePrice(base);
      }

      document.getElementById('custom-width').addEventListener('input', function () {
        if (document.getElementById('lock-aspect').checked) {
          document.getElementById('custom-height').value = Math.round(this.value / aspectRatio);
        }
        updateCustomPrice();
      });

      document.getElementById('custom-height').addEventListener('input', function () {
        if (document.getElementById('lock-aspect').checked) {
          document.getElementById('custom-width').value = Math.round(this.value * aspectRatio);
        }
        updateCustomPrice();
      });

      document.getElementById('custom-size-radio').addEventListener('change', function () {
        const customSizeFields = document.getElementById('custom-size-fields');
        if (this.checked) {
          customSizeFields.style.display = 'block';
          updateCustomPrice();
        } else {
          customSizeFields.style.display = 'none';
        }
      });

      document.querySelectorAll('input[name="upsizing"]').forEach(radio => {
        radio.addEventListener('change', function () {
          if (this.value !== 'custom') {
            document.getElementById('custom-size-fields').style.display = 'none';
            const price = parseInt(this.getAttribute('data-price')) || 0;
            updatePrice(price);
          }
        });
      });

      document.querySelectorAll('.addon').forEach(cb => {
        cb.addEventListener('change', function () {
          const selected = document.querySelector('input[name="upsizing"]:checked');
          let base = 0;
          if (selected && selected.value !== 'custom') {
            base = parseInt(selected.getAttribute('data-price')) || 0;
          } else if (selected && selected.value === 'custom') {
            const width = parseInt(document.getElementById('custom-width').value) || 0;
            const height = parseInt(document.getElementById('custom-height').value) || 0;
            base = width + height;
          }
          updatePrice(base);
        });
      });

      const selectAllCheckbox = document.getElementById('select-all-addons');
      if (selectAllCheckbox) {
        selectAllCheckbox.addEventListener('change', function () {
          const addons = document.querySelectorAll('.addon');
          addons.forEach(cb => cb.checked = this.checked);
          const selected = document.querySelector('input[name="upsizing"]:checked');
          let base = 0;
          if (selected && selected.value !== 'custom') {
            base = parseInt(selected.getAttribute('data-price')) || 0;
          } else if (selected && selected.value === 'custom') {
            const width = parseInt(document.getElementById('custom-width')?.value) || 0;
            const height = parseInt(document.getElementById('custom-height')?.value) || 0;
            base = width + height;
          }
          updatePrice(base);
        });
      }
    };
  }
});
