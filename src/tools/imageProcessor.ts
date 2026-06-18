import { loadPdfJs, loadJsPdf, formatBytes } from '../utils';

function requestDownload(blob: Blob, defaultName: string) {
  const modal = document.getElementById('modal-overlay');
  if (!modal) return;
  const nameInput = document.getElementById('modal-filename') as HTMLInputElement;
  const sizeText = document.getElementById('modal-filesize') as HTMLElement;
  const extension = defaultName.split('.').pop() || 'png';
  
  if (nameInput) {
    nameInput.value = defaultName.replace('.' + extension, '');
  }
  if (sizeText) {
    sizeText.innerText = formatBytes(blob.size);
  }
  
  (window as any)._pendingBlob = blob;
  (window as any)._pendingName = defaultName;
  
  modal.classList.remove('hidden');
  void modal.offsetWidth;
  modal.classList.add('opacity-100');
  const inner = document.getElementById('download-modal');
  if (inner) {
    inner.classList.remove('scale-95');
    inner.classList.add('scale-100');
  }
}

function startLoading(text: string) {
  (window as any).Swal.fire({
    title: text,
    allowOutsideClick: false,
    didOpen: () => {
      (window as any).Swal.showLoading();
    }
  });
}

function stopLoading() {
  (window as any).Swal.close();
}

function notifyError(title: string, desc: string) {
  (window as any).Swal.fire({
    icon: 'error',
    title: title,
    text: desc
  });
}

export const imageProcessorTools = {
  // --- IMAGE COMPRESSION ENGINE ---
  'compress-img': {
    ui(): string {
      return `
        <div class="max-w-2xl mx-auto space-y-8 animate-fade-in-up">
          <div id="drop-zone" class="glass-panel p-12 rounded-3xl text-center cursor-pointer border-2 border-transparent hover:border-teal-500 transition-all group">
            <i class="fa-solid fa-image text-5xl text-teal-500 mb-4 group-hover:scale-110 transition-transform"></i>
            <div id="file-name" class="font-bold text-xl text-[var(--text-primary)]">Select Image to Compress</div>
            <p class="text-sm text-[var(--text-secondary)] mt-1">Supports PNG, JPG, and WEBP formats.</p>
            <input type="file" id="file-input" class="hidden" accept="image/png, image/jpeg, image/webp">
          </div>
          <div id="options" class="hidden space-y-6">
            <div class="glass-panel p-6 rounded-2xl bg-black/10 space-y-4">
              <div>
                <label class="flex justify-between text-sm font-bold text-[var(--text-secondary)] mb-2">
                  <span>Compression Quality</span>
                  <span id="qual-val" class="text-teal-500 font-bold">80%</span>
                </label>
                <input type="range" id="quality" min="10" max="100" value="80" class="w-full accent-teal-500 h-2 bg-gray-700/50 rounded-lg appearance-none cursor-pointer">
              </div>
              <div class="flex justify-between text-sm pt-2 border-t border-[var(--glass-border)]">
                <span class="text-[var(--text-secondary)]">Original Size: <span id="orig-size" class="text-[var(--text-primary)] font-mono font-bold">0 KB</span></span>
                <span class="text-[var(--text-secondary)]">Estimated Output: <span id="est-size" class="text-teal-400 font-mono font-bold">0 KB</span></span>
              </div>
            </div>
            <button id="action-btn" class="w-full py-4 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold shadow-lg shadow-teal-600/10 hover:scale-[1.01] transition-transform">Run Compression</button>
          </div>
        </div>`;
    },
    init() {
      const dropZone = document.getElementById('drop-zone') as HTMLElement;
      const fileInput = document.getElementById('file-input') as HTMLInputElement;
      const actionBtn = document.getElementById('action-btn') as HTMLButtonElement;
      const options = document.getElementById('options') as HTMLElement;
      const nameLabel = document.getElementById('file-name') as HTMLElement;
      const qualVal = document.getElementById('qual-val') as HTMLElement;
      const qualSlider = document.getElementById('quality') as HTMLInputElement;
      const origSize = document.getElementById('orig-size') as HTMLElement;
      const estSize = document.getElementById('est-size') as HTMLElement;

      let currentFile: File | null = null;

      dropZone.onclick = () => fileInput.click();
      fileInput.onchange = () => {
        if (fileInput.files && fileInput.files[0]) {
          currentFile = fileInput.files[0];
          nameLabel.innerText = currentFile.name;
          origSize.innerText = formatBytes(currentFile.size);
          options.classList.remove('hidden');
          qualSlider.dispatchEvent(new Event('input'));
        }
      };

      qualSlider.oninput = () => {
        if (!currentFile) return;
        const q = parseInt(qualSlider.value);
        qualVal.innerText = q + '%';
        const reductionRatio = q / 100;
        // Estimated compression sizing model
        const estimate = currentFile.size * Math.max(reductionRatio * 0.75, 0.45);
        estSize.innerText = '~' + formatBytes(estimate);
      };

      actionBtn.onclick = () => {
        if (!currentFile) return;
        startLoading('Optimizing image canvas elements...');
        const qVal = parseInt(qualSlider.value) / 100;
        const img = new Image();
        img.onerror = () => {
          stopLoading();
          notifyError('Render Failure', 'This asset could not be converted to a modern canvas standard.');
        };
        img.onload = () => {
          const canvas = document.createElement('canvas');
          canvas.width = img.width;
          canvas.height = img.height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0);
            canvas.toBlob((blob) => {
              stopLoading();
              if (blob) {
                requestDownload(blob, 'optimized_' + currentFile!.name);
              }
            }, 'image/jpeg', qVal);
          } else {
            stopLoading();
          }
        };
        img.src = URL.createObjectURL(currentFile);
      };
    }
  },

  // --- DYNAMIC FORMAT CONVERTER ---
  'img-convert': {
    ui(): string {
      return `
        <div class="max-w-2xl mx-auto space-y-8 animate-fade-in-up">
          <div id="drop-zone" class="border-2 border-dashed border-[var(--text-secondary)]/30 rounded-3xl p-12 text-center hover:border-teal-500 hover:bg-teal-500/5 transition-all cursor-pointer group select-none">
            <i class="fa-solid fa-camera-rotate text-5xl text-teal-500 mb-6 group-hover:scale-110 transition-transform"></i>
            <h3 class="text-2xl font-bold mb-2 text-[var(--text-primary)]">Drop Photo Here</h3>
            <div id="file-name" class="text-sm text-[var(--text-secondary)]">PNG, JPG, SVG, JFIF, or WEBP.</div>
            <input type="file" id="file-input" class="hidden" accept="image/*">
          </div>
          <div id="options" class="hidden space-y-6">
            <div class="glass-panel p-6 rounded-2xl bg-black/10 flex flex-col md:flex-row gap-4 items-center">
              <span class="text-sm font-bold text-[var(--text-secondary)] uppercase tracking-wider">Target Format:</span>
              <select id="format-select" class="glass-input flex-1 p-3.5 rounded-xl text-[var(--text-primary)] bg-[var(--card-bg)] font-sans font-bold">
                <option value="image/png">PNG (.png)</option>
                <option value="image/jpeg">JPEG (.jpg)</option>
                <option value="image/webp">WEBP (.webp)</option>
              </select>
            </div>
            <button id="action-btn" class="w-full py-4 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold shadow-lg transition-transform hover:scale-[1.01]">Convert & Export Format</button>
          </div>
        </div>`;
    },
    init() {
      const dropZone = document.getElementById('drop-zone') as HTMLElement;
      const fileInput = document.getElementById('file-input') as HTMLInputElement;
      const options = document.getElementById('options') as HTMLElement;
      const nameLabel = document.getElementById('file-name') as HTMLElement;
      const select = document.getElementById('format-select') as HTMLSelectElement;
      const actionBtn = document.getElementById('action-btn') as HTMLButtonElement;

      let importedFile: File | null = null;

      dropZone.onclick = () => fileInput.click();
      fileInput.onchange = () => {
        if (fileInput.files && fileInput.files[0]) {
          importedFile = fileInput.files[0];
          nameLabel.innerText = importedFile.name;
          options.classList.remove('hidden');
        }
      };

      actionBtn.onclick = () => {
        if (!importedFile) return;
        startLoading('Updating matrix layers...');
        const selectedMime = select.value;
        const ext = selectedMime.split('/')[1] === 'jpeg' ? 'jpg' : selectedMime.split('/')[1];
        
        const img = new Image();
        img.onerror = () => {
          stopLoading();
          notifyError('Rasterization Failed', 'Standard properties fail validation.');
        };
        img.onload = () => {
          const canvas = document.createElement('canvas');
          canvas.width = img.width;
          canvas.height = img.height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0);
            canvas.toBlob((blob) => {
              stopLoading();
              if (blob) {
                // Remove existing extension and append new
                const base = importedFile!.name.substring(0, importedFile!.name.lastIndexOf('.')) || importedFile!.name;
                requestDownload(blob, base + '.' + ext);
              }
            }, selectedMime, 0.9);
          } else {
            stopLoading();
          }
        };
        img.src = URL.createObjectURL(importedFile);
      };
    }
  },

  // --- PDF COMPRESSION BY RASTERIZING IMAGES ---
  'compress-pdf': {
    ui(): string {
      return `
        <div class="max-w-2xl mx-auto space-y-8 animate-fade-in-up">
          <div id="drop-zone" class="glass-panel p-12 rounded-3xl text-center cursor-pointer border-2 border-transparent hover:border-green-500 transition-all group">
            <i class="fa-solid fa-file-zipper text-5xl text-green-500 mb-4 group-hover:scale-110 transition-transform"></i>
            <div id="file-name" class="font-bold text-xl text-[var(--text-primary)]">Select PDF to Compress</div>
            <p class="text-sm text-[var(--text-secondary)] mt-1">Saves weight by rasterizing vector layouts securely.</p>
            <input type="file" id="file-input" class="hidden" accept=".pdf">
          </div>
          <div id="options" class="hidden space-y-4">
            <div class="glass-panel p-6 rounded-2xl bg-black/10">
              <label class="flex justify-between text-sm font-bold text-[var(--text-secondary)] mb-2" for="comp-level">
                <span>Compression Density</span>
                <span id="comp-val" class="text-green-500 font-bold">Standard</span>
              </label>
              <input type="range" id="comp-level" min="1" max="3" step="1" value="2" class="w-full accent-green-500 h-2 bg-gray-700/50 rounded-lg appearance-none cursor-pointer">
              <div class="flex justify-between text-[10px] text-[var(--text-secondary)] mt-2 uppercase font-extrabold tracking-wider">
                <span>High Quality</span>
                <span>Small Sizing</span>
              </div>
            </div>
            <button id="action-btn" class="w-full py-4 rounded-xl bg-green-600 hover:bg-green-500 text-white font-bold shadow-lg transition-transform hover:scale-[1.01]">Compress Document</button>
          </div>
        </div>`;
    },
    async init() {
      startLoading('Loading compression engine...');
      await Promise.all([loadPdfJs(), loadJsPdf()]);
      stopLoading();

      const dropZone = document.getElementById('drop-zone') as HTMLElement;
      const fileInput = document.getElementById('file-input') as HTMLInputElement;
      const label = document.getElementById('file-name') as HTMLElement;
      const options = document.getElementById('options') as HTMLElement;
      const levelSlider = document.getElementById('comp-level') as HTMLInputElement;
      const compVal = document.getElementById('comp-val') as HTMLElement;
      const actionBtn = document.getElementById('action-btn') as HTMLButtonElement;

      let targetedFile: File | null = null;
      const levelTextMap: { [key: number]: string } = {
        1: 'Low (Higher Quality)',
        2: 'Standard',
        3: 'High (Smallest Size)'
      };

      dropZone.onclick = () => fileInput.click();
      fileInput.onchange = () => {
        if (fileInput.files && fileInput.files[0]) {
          targetedFile = fileInput.files[0];
          label.innerText = targetedFile.name;
          options.classList.remove('hidden');
        }
      };

      levelSlider.oninput = () => {
        const val = parseInt(levelSlider.value);
        compVal.innerText = levelTextMap[val];
      };

      actionBtn.onclick = async () => {
        if (!targetedFile) return;
        startLoading('Rasterizing page formats...');
        
        const val = parseInt(levelSlider.value);
        const qualityMap: { [key: number]: number } = { 1: 0.8, 2: 0.5, 3: 0.25 };
        const scaleMap: { [key: number]: number } = { 1: 1.45, 2: 1.0, 3: 0.75 };
        
        try {
          const arrayBuffer = await targetedFile.arrayBuffer();
          const pdfjs = window.pdfjsLib;
          const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise;
          const { jsPDF } = window.jspdf;
          const processedPDF = new jsPDF('p', 'mm', 'a4');

          for (let k = 1; k <= pdf.numPages; k++) {
            if (k > 1) {
              processedPDF.addPage();
            }
            const page = await pdf.getPage(k);
            const viewport = page.getViewport({ scale: scaleMap[val] });
            const canvas = document.createElement('canvas');
            canvas.width = viewport.width;
            canvas.height = viewport.height;
            
            const ctx = canvas.getContext('2d');
            if (ctx) {
              await page.render({ canvasContext: ctx, viewport }).promise;
            }

            const imgData = canvas.toDataURL('image/jpeg', qualityMap[val]);
            const properties = processedPDF.getImageProperties(imgData);
            const pWidth = processedPDF.internal.pageSize.getWidth();
            const pHeight = (properties.height * pWidth) / properties.width;
            
            processedPDF.addImage(imgData, 'JPEG', 0, 0, pWidth, pHeight);
          }

          stopLoading();
          requestDownload(processedPDF.output('blob'), 'compressed_' + targetedFile.name);
        } catch (e) {
          stopLoading();
          notifyError('Rasterizer Failed', 'This PDF is protected or heavily encrypted.');
        }
      };
    }
  }
};
