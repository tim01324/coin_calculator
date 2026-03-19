// ============================================
// Photo Handling, Merging, Clipboard & Download
// ============================================

function initializePhotoHandlers() {
  const sections = ['store', 'bank', 'payout', 'env'];

  // Modal Close Logic
  const modal = document.getElementById('imageModal');
  const span = document.getElementById('modalClose');
  if (span && modal) {
    span.onclick = function () {
      modal.style.display = "none";
    }
    modal.onclick = function (event) {
      if (event.target === modal) {
        modal.style.display = "none";
      }
    }
  }

  // Modal Save Button
  const modalSaveBtn = document.getElementById('modal-save-btn');
  if (modalSaveBtn) {
    modalSaveBtn.addEventListener('click', () => {
      const modalImg = document.getElementById('modalImg');
      if (modalImg && modalImg.src) {
        downloadImage(modalImg.src, 'merged-image.png');
      }
    });
  }

  // Store image blobs for merging later
  const imageStore = {
    bank: [],
    payout: []
  };

  sections.forEach(section => {
    const input = document.getElementById(`input-${section}`);
    const previewContainer = document.getElementById(`preview-${section}`);

    if (input && previewContainer) {
      input.addEventListener('change', function (e) {
        handleFileSelect(e, previewContainer, section, imageStore);
      });
    }

    // Add copy listener for single copy buttons
    const copyBtn = document.getElementById(`copy-${section}`);
    if (copyBtn) {
      copyBtn.addEventListener('click', () => {
        const images = Array.from(previewContainer.querySelectorAll('img'));
        if (images.length > 0) {
          mergeAndCopyImages(images, false, `Result for ${section}`);
        }
      });
    }

    // Add save listener for single save buttons
    const saveBtn = document.getElementById(`save-${section}`);
    if (saveBtn) {
      saveBtn.addEventListener('click', () => {
        const images = Array.from(previewContainer.querySelectorAll('img'));
        if (images.length > 0) {
          mergeAndSaveImages(images, `${section}-photos.png`);
        }
      });
    }
  });

  // Special Combined Copy Button (Bank + Payout)
  const combinedCopyBtn = document.getElementById('copy-combined-bank-payout');
  if (combinedCopyBtn) {
    combinedCopyBtn.addEventListener('click', () => {
      const bankImages = Array.from(document.querySelectorAll('#preview-bank img'));
      const payoutImages = Array.from(document.querySelectorAll('#preview-payout img'));
      const allImages = [...bankImages, ...payoutImages];

      if (allImages.length > 0) {
        mergeAndCopyImages(allImages, true, 'Combined Result (Bank + Payout)');
      }
    });
  }
}

function handleFileSelect(event, container, section, imageStore) {
  const files = event.target.files;
  if (!files.length) return;

  if (!event.target.multiple) {
    container.innerHTML = '';
    if (section === 'bank') imageStore.bank = [];
    if (section === 'payout') imageStore.payout = [];
  }

  Array.from(files).forEach(file => {
    if (!file.type.match('image.*')) return;

    const reader = new FileReader();

    reader.onload = function (e) {
      const wrapper = document.createElement('div');
      wrapper.className = 'preview-image-wrapper';

      const img = document.createElement('img');
      img.src = e.target.result;
      img.title = file.name;

      const removeBtn = document.createElement('button');
      removeBtn.className = 'preview-remove';
      removeBtn.textContent = 'X';
      removeBtn.onclick = function () {
        wrapper.remove();
        updateButtonState(section);
        validatePayoutCount();
      };

      wrapper.appendChild(img);
      wrapper.appendChild(removeBtn);
      container.appendChild(wrapper);

      updateButtonState(section);
      validatePayoutCount();
    };

    reader.readAsDataURL(file);
  });

  event.target.value = '';
}

function updateButtonState(section) {
  const container = document.getElementById(`preview-${section}`);
  const count = container.querySelectorAll('img').length;

  const btn = document.getElementById(`copy-${section}`);
  if (btn) btn.disabled = count === 0;

  const saveBtn = document.getElementById(`save-${section}`);
  if (saveBtn) saveBtn.disabled = count === 0;

  const bankCount = document.querySelectorAll('#preview-bank img').length;
  const payoutCount = document.querySelectorAll('#preview-payout img').length;
  const combinedBtn = document.getElementById('copy-combined-bank-payout');
  if (combinedBtn) {
    combinedBtn.disabled = (bankCount + payoutCount) === 0;
  }
}

function validatePayoutCount() {
  const declaredCount = parseInt(document.getElementById('payout_count').value) || 0;
  const uploadedCount = document.querySelectorAll('#preview-payout img').length;

  const warning = document.getElementById('payout-warning');
  if (uploadedCount < declaredCount && declaredCount > 0) {
    warning.style.display = 'block';
    document.getElementById('payout-uploaded-count').textContent = uploadedCount;
    document.getElementById('payout-expected-count').textContent = declaredCount;
    document.getElementById('section-payout').classList.add('highlight-warning');
  } else {
    warning.style.display = 'none';
    document.getElementById('section-payout').classList.remove('highlight-warning');
  }
}

// Helper: render images onto a canvas and return it as a blob (Promise)
function renderMergedCanvas(imageElements) {
  const TARGET_WIDTH = 800;
  const PADDING = 20;
  const BACKGROUND_COLOR = '#ffffff';

  return new Promise((resolve, reject) => {
    const loadPromises = imageElements.map(imgEl => {
      return new Promise((res) => {
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.onload = () => res(img);
        img.onerror = () => res(null);
        img.src = imgEl.src;
      });
    });

    Promise.all(loadPromises).then(images => {
      const validImages = images.filter(img => img !== null);
      if (validImages.length === 0) {
        reject(new Error('No images loaded'));
        return;
      }

      let totalHeight = PADDING;
      validImages.forEach(img => {
        const scale = TARGET_WIDTH / img.width;
        const scaledHeight = img.height * scale;
        totalHeight += scaledHeight + PADDING;
      });

      const canvas = document.createElement('canvas');
      canvas.width = TARGET_WIDTH;
      canvas.height = totalHeight;
      const ctx = canvas.getContext('2d');

      ctx.fillStyle = BACKGROUND_COLOR;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      let currentY = PADDING / 2;
      validImages.forEach(img => {
        const scale = TARGET_WIDTH / img.width;
        const scaledHeight = img.height * scale;
        ctx.drawImage(img, 0, currentY, TARGET_WIDTH, scaledHeight);
        currentY += scaledHeight + PADDING;
      });

      canvas.toBlob(blob => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error('Canvas toBlob failed'));
        }
      }, 'image/png');
    }).catch(reject);
  });
}

// Helper: trigger a file download from a blob URL or data URL
function downloadImage(src, filename) {
  const a = document.createElement('a');
  a.href = src;
  a.download = filename || 'image.png';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

// Merge images and save as download (no clipboard)
function mergeAndSaveImages(imageElements, filename) {
  renderMergedCanvas(imageElements).then(blob => {
    const blobUrl = URL.createObjectURL(blob);
    downloadImage(blobUrl, filename);
    setTimeout(() => URL.revokeObjectURL(blobUrl), 5000);
  }).catch(err => {
    console.error('Save failed:', err);
    alert('Error saving image. Please try again.');
  });
}

// Merge images vertically, copy to clipboard (Safari-compatible), and show preview
function mergeAndCopyImages(imageElements, isCombined = false, caption = 'Result') {
  if (!imageElements.length) return;

  const modal = document.getElementById('imageModal');
  const modalImg = document.getElementById('modalImg');
  const captionText = document.getElementById('caption');

  const supportsClipboard = navigator.clipboard && typeof ClipboardItem !== 'undefined';

  if (supportsClipboard) {
    const blobPromise = renderMergedCanvas(imageElements);

    try {
      // ClipboardItem MUST be created synchronously in the click handler
      const item = new ClipboardItem({
        'image/png': blobPromise
      });

      if (modal && modalImg) {
        modal.style.display = "block";
        if (captionText) captionText.innerHTML = `${caption}<br><span style="font-size:0.8em; color:#888;">Processing...</span>`;
      }

      navigator.clipboard.write([item]).then(() => {
        blobPromise.then(blob => {
          const blobUrl = URL.createObjectURL(blob);
          if (modalImg) modalImg.src = blobUrl;
          if (captionText) captionText.innerHTML = `✅ <strong>Copied!</strong><br><span style="font-size:0.8em; color:#888;">Ready to paste into Lark.</span>`;

          if (isCombined) {
            const previewWrapper = document.getElementById('merged-preview-container');
            const previewImg = document.getElementById('merged-result-img');
            if (previewImg && previewWrapper) {
              previewImg.src = blobUrl;
              previewWrapper.style.display = 'block';
            }
          }
        });
      }).catch(err => {
        console.warn('Clipboard write failed, falling back:', err);
        blobPromise.then(blob => {
          const blobUrl = URL.createObjectURL(blob);
          if (modalImg) modalImg.src = blobUrl;
          if (captionText) captionText.innerHTML = `⚠️ <strong>Auto-copy failed.</strong><br>Use the "Save Image" button below, or long-press the image to copy.`;

          if (isCombined) {
            const previewWrapper = document.getElementById('merged-preview-container');
            const previewImg = document.getElementById('merged-result-img');
            if (previewImg && previewWrapper) {
              previewImg.src = blobUrl;
              previewWrapper.style.display = 'block';
            }
          }
        });
      });
    } catch (e) {
      console.error('ClipboardItem creation failed:', e);
      fallbackShowAndSave(imageElements, isCombined, caption);
    }
  } else {
    fallbackShowAndSave(imageElements, isCombined, caption);
  }
}

// Fallback: render merged image, show in modal, offer download
function fallbackShowAndSave(imageElements, isCombined, caption) {
  const modal = document.getElementById('imageModal');
  const modalImg = document.getElementById('modalImg');
  const captionText = document.getElementById('caption');

  if (modal) modal.style.display = "block";
  if (captionText) captionText.innerHTML = `${caption}<br><span style="font-size:0.8em; color:#888;">Generating...</span>`;

  renderMergedCanvas(imageElements).then(blob => {
    const blobUrl = URL.createObjectURL(blob);
    if (modalImg) modalImg.src = blobUrl;
    if (captionText) captionText.innerHTML = `⚠️ <strong>Browser doesn't support auto-copy.</strong><br>Use the "Save Image" button below to download.`;

    if (isCombined) {
      const previewWrapper = document.getElementById('merged-preview-container');
      const previewImg = document.getElementById('merged-result-img');
      if (previewImg && previewWrapper) {
        previewImg.src = blobUrl;
        previewWrapper.style.display = 'block';
      }
    }
  }).catch(err => {
    console.error("Processing error:", err);
    if (captionText) captionText.innerHTML = `❌ <strong>Error processing image.</strong><br>Please try again.`;
  });
}

// Listen to payout count changes to update validation in real-time
document.addEventListener('DOMContentLoaded', () => {
  const payoutCountEl = document.getElementById('payout_count');
  if (payoutCountEl) {
    payoutCountEl.addEventListener('input', validatePayoutCount);
  }
});
