import { loadPdfLib, loadPdfJs, loadJsPdf, loadJSZip, loadSignaturePad, formatBytes } from '../utils';

// Helper to open the download dialog
function requestDownload(blob: Blob, defaultName: string) {
  const modal = document.getElementById('modal-overlay');
  if (!modal) return;
  const nameInput = document.getElementById('modal-filename') as HTMLInputElement;
  const sizeText = document.getElementById('modal-filesize') as HTMLElement;
  const extension = defaultName.split('.').pop() || 'pdf';
  
  if (nameInput) {
    nameInput.value = defaultName.replace('.' + extension, '');
  }
  if (sizeText) {
    sizeText.innerText = formatBytes(blob.size);
  }
  
  // Store reference to download properties globally or on dynamic state triggers
  (window as any)._pendingBlob = blob;
  (window as any)._pendingName = defaultName;
  
  modal.classList.remove('hidden');
  void modal.offsetWidth; // Force reflow
  modal.classList.add('opacity-100');
  const inner = document.getElementById('download-modal');
  if (inner) {
    inner.classList.remove('scale-95');
    inner.classList.add('scale-100');
  }
}

// Trigger loading bar alert
function startLoading(text: string) {
  (window as any).Swal.fire({
    title: text,
    text: 'Processing your file securely on your browser.',
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

export const pdfProcessorTools = {
  // --- MULTI PDF MERGING ---
  'pdf-merge': {
    ui(): string {
      return `
        <div class="max-w-4xl mx-auto space-y-8 animate-fade-in-up">
          <div id="drop-zone" class="border-2 border-dashed border-[var(--text-secondary)]/30 rounded-3xl p-12 text-center hover:border-blue-500 hover:bg-blue-500/5 transition-all cursor-pointer group">
            <i class="fa-solid fa-layer-group text-5xl text-blue-500 mb-6 group-hover:scale-110 transition-transform"></i>
            <h3 class="text-2xl font-bold mb-2 text-[var(--text-primary)]">Drop PDFs Here or Click</h3>
            <p class="text-sm text-[var(--text-secondary)]">Supports multiple PDF files. Rearrange or remove files as needed.</p>
            <input type="file" id="file-input" class="hidden" accept=".pdf" multiple>
          </div>
          <div id="file-list" class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4"></div>
          <button id="action-btn" class="w-full py-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold shadow-lg hidden transition-all select-none">Combine & Merge PDFs</button>
        </div>`;
    },
    async init() {
      startLoading('Loading PDF Engine');
      await Promise.all([loadPdfLib(), loadPdfJs()]);
      stopLoading();

      const dropZone = document.getElementById('drop-zone') as HTMLElement;
      const fileInput = document.getElementById('file-input') as HTMLInputElement;
      const listContainer = document.getElementById('file-list') as HTMLElement;
      const actionBtn = document.getElementById('action-btn') as HTMLButtonElement;

      let importedFiles: File[] = [];

      const renderList = async () => {
        listContainer.innerHTML = '';
        if (importedFiles.length > 0) {
          actionBtn.classList.remove('hidden');
        } else {
          actionBtn.classList.add('hidden');
        }

        for (let idx = 0; idx < importedFiles.length; idx++) {
          const file = importedFiles[idx];
          const div = document.createElement('div');
          div.className = 'glass-panel p-3 rounded-2xl relative flex flex-col items-center bg-black/10 dark:bg-black/25 select-none';
          
          try {
            const arrayBuffer = await file.arrayBuffer();
            const pdfjs = window.pdfjsLib;
            const pdfDoc = await pdfjs.getDocument({ data: arrayBuffer }).promise;
            const page = await pdfDoc.getPage(1);
            const viewport = page.getViewport({ scale: 0.25 });
            
            const canvas = document.createElement('canvas');
            canvas.className = 'w-full h-32 object-contain bg-white rounded-xl mb-2 border border-slate-200';
            canvas.width = viewport.width;
            canvas.height = viewport.height;
            
            const ctx = canvas.getContext('2d');
            if (ctx) {
              await page.render({ canvasContext: ctx, viewport: viewport }).promise;
            }
            
            div.appendChild(canvas);
          } catch (e) {
            // Fallback if rendering page fail (e.g. password protect)
            const fallback = document.createElement('div');
            fallback.className = 'w-full h-32 bg-gray-800 rounded-xl mb-2 flex items-center justify-center text-red-400';
            fallback.innerHTML = `<i class="fa-solid fa-lock text-3xl"></i>`;
            div.appendChild(fallback);
          }

          const label = document.createElement('div');
          label.className = 'text-xs text-center truncate w-full px-1 text-[var(--text-secondary)] font-medium';
          label.innerText = file.name;
          div.appendChild(label);

          const rmBtn = document.createElement('button');
          rmBtn.className = 'absolute -top-2 -right-2 w-6 h-6 bg-red-600 hover:bg-red-500 rounded-full text-white text-xs z-10 font-bold flex items-center justify-center transition-all scale-100 hover:scale-110';
          rmBtn.innerText = '×';
          rmBtn.onclick = (ev) => {
            ev.stopPropagation();
            importedFiles.splice(idx, 1);
            renderList();
          };
          div.appendChild(rmBtn);
          listContainer.appendChild(div);
        }
      };

      dropZone.onclick = () => fileInput.click();
      fileInput.onchange = () => {
        if (fileInput.files) {
          importedFiles = [...importedFiles, ...Array.from(fileInput.files)];
          renderList();
        }
      };

      actionBtn.onclick = async () => {
        if (importedFiles.length < 2) return;
        startLoading('Merging PDFs...');
        try {
          const PDFLib = window.PDFLib;
          const mergedPdf = await PDFLib.PDFDocument.create();
          for (const file of importedFiles) {
            const loaded = await PDFLib.PDFDocument.load(await file.arrayBuffer());
            const indices = loaded.getPageIndices();
            const copied = await mergedPdf.copyPages(loaded, indices);
            copied.forEach((p: any) => mergedPdf.addPage(p));
          }
          const savedBytes = await mergedPdf.save();
          stopLoading();
          requestDownload(new Blob([savedBytes], { type: 'application/pdf' }), 'merged_document.pdf');
        } catch (e) {
          stopLoading();
          notifyError('Merge Failed', 'One or more of the PDF files might be encrypted or corrupted.');
        }
      };
    }
  },

  // --- SPLIT PDF ---
  'pdf-split': {
    ui(): string {
      return `
        <div class="max-w-2xl mx-auto space-y-8 animate-fade-in-up">
          <div id="drop-zone" class="glass-panel p-10 rounded-3xl text-center cursor-pointer border-2 border-transparent hover:border-orange-500 transition-all">
            <i class="fa-solid fa-scissors text-5xl text-orange-500 mb-4"></i>
            <div id="file-name" class="font-bold text-xl text-[var(--text-primary)]">Select PDF to Split</div>
            <p class="text-sm text-[var(--text-secondary)] mt-1">Combine range selection inside separate blocks.</p>
            <input type="file" id="file-input" class="hidden" accept=".pdf">
          </div>
          <div id="options" class="opacity-50 pointer-events-none transition-opacity space-y-6">
            <div class="glass-panel p-6 rounded-2xl bg-black/10">
              <label class="block text-sm font-bold text-[var(--text-secondary)] mb-2" for="split-range">Page ranges to extract</label>
              <input type="text" id="split-range" class="glass-input w-full p-4 rounded-xl text-[var(--text-primary)]" placeholder="e.g. 1-3, 5, 8-10">
            </div>
            <button id="action-btn" class="w-full py-4 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-bold shadow-lg transition-transform hover:scale-[1.01] active:scale-[0.99]">Split Document</button>
          </div>
        </div>`;
    },
    async init() {
      await loadPdfLib();
      const dropZone = document.getElementById('drop-zone') as HTMLElement;
      const fileInput = document.getElementById('file-input') as HTMLInputElement;
      const nameLabel = document.getElementById('file-name') as HTMLElement;
      const options = document.getElementById('options') as HTMLElement;
      const actionBtn = document.getElementById('action-btn') as HTMLButtonElement;
      
      let pendingFile: File | null = null;
      
      dropZone.onclick = () => fileInput.click();
      fileInput.onchange = () => {
        if (fileInput.files && fileInput.files[0]) {
          pendingFile = fileInput.files[0];
          nameLabel.innerText = pendingFile.name;
          options.classList.remove('opacity-50', 'pointer-events-none');
        }
      };

      actionBtn.onclick = async () => {
        if (!pendingFile) return;
        const rangeStr = (document.getElementById('split-range') as HTMLInputElement).value;
        if (!rangeStr) {
          notifyError('Range Required', 'Please input at least one target page range.');
          return;
        }

        startLoading('Extracting pages...');
        try {
          const PDFLib = window.PDFLib;
          const original = await PDFLib.PDFDocument.load(await pendingFile.arrayBuffer());
          const splitDocument = await PDFLib.PDFDocument.create();
          const count = original.getPageCount();
          
          const targetIndices: number[] = [];
          rangeStr.split(',').forEach(part => {
            const trim = part.trim();
            if (trim.includes('-')) {
              const [s, e] = trim.split('-').map(x => parseInt(x));
              if (!isNaN(s) && !isNaN(e)) {
                for (let k = s; k <= e; k++) targetIndices.push(k - 1);
              }
            } else {
              const single = parseInt(trim);
              if (!isNaN(single)) targetIndices.push(single - 1);
            }
          });

          // Filter indices within bounds
          const safeIndices = targetIndices.filter(idx => idx >= 0 && idx < count);
          if (safeIndices.length === 0) {
            stopLoading();
            notifyError('Inbound Limits exceeded', `Please specify ranges matching total pages (1 to ${count})`);
            return;
          }

          const copied = await splitDocument.copyPages(original, safeIndices);
          copied.forEach((p: any) => splitDocument.addPage(p));
          const savedBytes = await splitDocument.save();
          stopLoading();
          
          requestDownload(new Blob([savedBytes], { type: 'application/pdf' }), 'split_output.pdf');
        } catch (e) {
          stopLoading();
          notifyError('Split Error', 'Unable to parse requested ranges for this PDF.');
        }
      };
    }
  },

  // --- SIGN PDF ---
  'sign-pdf': {
    ui(): string {
      return `
        <div class="max-w-4xl mx-auto space-y-6 animate-fade-in-up">
          <div id="drop-zone" class="glass-panel p-10 rounded-3xl text-center cursor-pointer border-2 border-transparent hover:border-emerald-500 transition-all">
            <i class="fa-solid fa-signature text-5xl text-emerald-500 mb-4"></i>
            <div id="file-name" class="font-bold text-xl text-[var(--text-primary)]">Select PDF to Sign</div>
            <input type="file" id="file-input" class="hidden" accept=".pdf">
          </div>
          <div id="sign-area" class="hidden flex flex-col gap-4">
            <div class="glass-panel p-4 rounded-2xl bg-white overflow-hidden relative">
              <canvas id="signature-pad" class="w-full h-48 cursor-crosshair border border-gray-200 rounded-xl bg-transparent"></canvas>
              <div class="absolute top-3 right-3 text-xs bg-slate-900/10 text-slate-800 font-semibold px-2.5 py-1 rounded-md pointer-events-none">Design Signature</div>
            </div>
            <div class="flex gap-4">
              <button id="clear-sig" class="px-5 py-3 rounded-xl border border-[var(--glass-border)] text-[var(--text-secondary)] hover:bg-red-500 hover:text-white transition-colors font-bold">Clear Pad</button>
              <button id="save-sig" class="flex-1 px-5 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold shadow-lg transition-transform hover:scale-[1.01]">Apply & Download</button>
            </div>
          </div>
        </div>`;
    },
    async init() {
      startLoading('Loading signature assets...');
      await Promise.all([loadPdfLib(), loadSignaturePad()]);
      stopLoading();

      const dropZone = document.getElementById('drop-zone') as HTMLElement;
      const fileInput = document.getElementById('file-input') as HTMLInputElement;
      const area = document.getElementById('sign-area') as HTMLElement;
      const nameLabel = document.getElementById('file-name') as HTMLElement;
      
      let pdfBytes: ArrayBuffer | null = null;
      const canvas = document.getElementById('signature-pad') as HTMLCanvasElement;
      
      if (!canvas) return;
      const ratio = Math.max(window.devicePixelRatio || 1, 1);
      canvas.width = canvas.offsetWidth * ratio;
      canvas.height = canvas.offsetHeight * ratio;
      canvas.getContext("2d")?.scale(ratio, ratio);
      
      const sigPad = new window.SignaturePad(canvas, {
        minWidth: 1.25,
        maxWidth: 3,
        penColor: 'rgb(15, 23, 42)'
      });

      dropZone.onclick = () => fileInput.click();
      fileInput.onchange = async () => {
        if (fileInput.files && fileInput.files[0]) {
          pdfBytes = await fileInput.files[0].arrayBuffer();
          nameLabel.innerText = fileInput.files[0].name;
          area.classList.remove('hidden');
          dropZone.classList.add('hidden');
          
          // Re-trigger layout resize calculations
          setTimeout(() => {
            canvas.width = canvas.offsetWidth * ratio;
            canvas.height = canvas.offsetHeight * ratio;
            canvas.getContext("2d")?.scale(ratio, ratio);
            sigPad.clear();
          }, 100);
        }
      };

      document.getElementById('clear-sig')!.onclick = () => sigPad.clear();
      document.getElementById('save-sig')!.onclick = async () => {
        if (sigPad.isEmpty() || !pdfBytes) {
          notifyError('Sign Pad is Empty', 'Please draw a signature inside the canvas first.');
          return;
        }

        startLoading('Signing Document...');
        try {
          const PDFLib = window.PDFLib;
          const pdfDoc = await PDFLib.PDFDocument.load(pdfBytes);
          const pages = pdfDoc.getPages();
          const targetPage = pages[0]; // Apply signature to page 1
          
          const pngImg = await pdfDoc.embedPng(sigPad.toDataURL());
          const size = targetPage.getSize();
          
          // Place inside standard bottom left corner anchor
          targetPage.drawImage(pngImg, {
            x: 50,
            y: 50,
            width: 180,
            height: 90
          });

          const savedBytes = await pdfDoc.save();
          stopLoading();
          requestDownload(new Blob([savedBytes], { type: 'application/pdf' }), 'signed_document.pdf');
        } catch (e) {
          stopLoading();
          notifyError('Signing Failed', 'Could not apply PNG layer to this structure.');
        }
      };
    }
  },

  // --- ROTATE PDF ---
  'pdf-rotate': {
    ui(): string {
      return `
        <div class="max-w-2xl mx-auto space-y-8 animate-fade-in-up">
          <div id="drop-zone" class="glass-panel p-10 rounded-3xl text-center cursor-pointer border-2 border-transparent hover:border-indigo-500 transition-all">
            <i class="fa-solid fa-rotate-right text-5xl text-indigo-500 mb-4"></i>
            <div id="file-name" class="font-bold text-xl text-[var(--text-primary)]">Select PDF to Rotate</div>
            <input type="file" id="file-input" class="hidden" accept=".pdf">
          </div>
          <div id="options" class="hidden space-y-6">
            <div class="grid grid-cols-3 gap-4">
              <button class="rot-opt p-4 rounded-xl glass-panel hover:bg-indigo-600/10 hover:border-indigo-500/50 text-center text-[var(--text-primary)] font-bold cursor-pointer" data-deg="90">90° CW</button>
              <button class="rot-opt p-4 rounded-xl glass-panel hover:bg-indigo-600/10 hover:border-indigo-500/50 text-center text-[var(--text-primary)] font-bold cursor-pointer" data-deg="180">180°</button>
              <button class="rot-opt p-4 rounded-xl glass-panel hover:bg-indigo-600/10 hover:border-indigo-500/50 text-center text-[var(--text-primary)] font-bold cursor-pointer" data-deg="270">90° CCW</button>
            </div>
            <button id="action-btn" class="w-full py-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold shadow-lg transition-all">Apply Rotation</button>
          </div>
        </div>`;
    },
    async init() {
      await loadPdfLib();
      const dropZone = document.getElementById('drop-zone') as HTMLElement;
      const fileInput = document.getElementById('file-input') as HTMLInputElement;
      const options = document.getElementById('options') as HTMLElement;
      const label = document.getElementById('file-name') as HTMLElement;
      const actionBtn = document.getElementById('action-btn') as HTMLButtonElement;

      let pendingBytes: ArrayBuffer | null = null;
      let rotationDegree = 0;

      dropZone.onclick = () => fileInput.click();
      fileInput.onchange = async () => {
        if (fileInput.files && fileInput.files[0]) {
          pendingBytes = await fileInput.files[0].arrayBuffer();
          label.innerText = fileInput.files[0].name;
          options.classList.remove('hidden');
        }
      };

      const optionButtons = document.querySelectorAll('.rot-opt');
      optionButtons.forEach(btn => {
        (btn as HTMLButtonElement).onclick = () => {
          rotationDegree = parseInt((btn as HTMLButtonElement).dataset.deg || '0');
          optionButtons.forEach(x => x.classList.remove('bg-indigo-600', 'text-white', 'border-indigo-500'));
          btn.classList.add('bg-indigo-600', 'text-white', 'border-indigo-500');
        };
      });

      // Default selection 90
      if (optionButtons[0]) (optionButtons[0] as HTMLButtonElement).click();

      actionBtn.onclick = async () => {
        if (!pendingBytes) return;
        startLoading('Updating rotation metadata...');
        try {
          const PDFLib = window.PDFLib;
          const pdfDoc = await PDFLib.PDFDocument.load(pendingBytes);
          const pages = pdfDoc.getPages();
          
          pages.forEach((page: any) => {
            const currentRotation = page.getRotation().angle;
            page.setRotation(PDFLib.degrees(currentRotation + rotationDegree));
          });

          const savedBytes = await pdfDoc.save();
          stopLoading();
          requestDownload(new Blob([savedBytes], { type: 'application/pdf' }), 'rotated_document.pdf');
        } catch (e) {
          stopLoading();
          notifyError('Rotation Failure', 'Failed to update orientations. Core PDF is heavily nested.');
        }
      };
    }
  },

  // --- WATERMARK PDF ---
  'pdf-watermark': {
    ui(): string {
      return `
        <div class="max-w-2xl mx-auto space-y-6 animate-fade-in-up">
          <div id="drop-zone" class="glass-panel p-10 rounded-3xl text-center cursor-pointer border-2 border-transparent hover:border-cyan-500 transition-all">
            <i class="fa-solid fa-stamp text-5xl text-cyan-500 mb-4"></i>
            <div id="file-name" class="font-bold text-xl text-[var(--text-primary)]">Select PDF to Watermark</div>
            <input type="file" id="file-input" class="hidden" accept=".pdf">
          </div>
          <div id="options" class="hidden space-y-6">
            <div class="glass-panel p-6 rounded-2xl bg-black/10 space-y-4">
              <div>
                <label class="block text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-2" for="wm-text">Watermark Text</label>
                <input type="text" id="wm-text" class="glass-input w-full p-4 rounded-xl text-[var(--text-primary)]" value="CONFIDENTIAL">
              </div>
              <div class="grid grid-cols-2 gap-4">
                <div>
                  <label class="block text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-2" for="wm-op">Opacity</label>
                  <input type="range" id="wm-op" min="0.1" max="1" step="0.05" value="0.3" class="w-full accent-cyan-500">
                </div>
                <div>
                  <label class="block text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-2" for="wm-size">Font Size</label>
                  <input type="number" id="wm-size" value="48" class="glass-input w-full p-3 rounded-lg text-[var(--text-primary)]">
                </div>
              </div>
            </div>
            <button id="action-btn" class="w-full py-4 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold shadow-lg transition-transform hover:scale-[1.01]">Apply Overlay</button>
          </div>
        </div>`;
    },
    async init() {
      await loadPdfLib();
      const dropZone = document.getElementById('drop-zone') as HTMLElement;
      const fileInput = document.getElementById('file-input') as HTMLInputElement;
      const options = document.getElementById('options') as HTMLElement;
      const label = document.getElementById('file-name') as HTMLElement;
      const actionBtn = document.getElementById('action-btn') as HTMLButtonElement;

      let pendingBytes: ArrayBuffer | null = null;

      dropZone.onclick = () => fileInput.click();
      fileInput.onchange = async () => {
        if (fileInput.files && fileInput.files[0]) {
          pendingBytes = await fileInput.files[0].arrayBuffer();
          label.innerText = fileInput.files[0].name;
          options.classList.remove('hidden');
        }
      };

      actionBtn.onclick = async () => {
        if (!pendingBytes) return;
        const text = (document.getElementById('wm-text') as HTMLInputElement).value || 'CONFIDENTIAL';
        const opacity = parseFloat((document.getElementById('wm-op') as HTMLInputElement).value || '0.3');
        const size = parseFloat((document.getElementById('wm-size') as HTMLInputElement).value || '48');

        startLoading('Embedding watermark...');
        try {
          const PDFLib = window.PDFLib;
          const pdfDoc = await PDFLib.PDFDocument.load(pendingBytes);
          const font = await pdfDoc.embedFont(PDFLib.StandardFonts.HelveticaBold);
          const pages = pdfDoc.getPages();

          pages.forEach((page: any) => {
            const { width, height } = page.getSize();
            // Center positioned overlay at 45 degree angle
            page.drawText(text, {
              x: width / 4,
              y: height / 2,
              size: size,
              font: font,
              opacity: opacity,
              rotate: PDFLib.degrees(45),
              color: PDFLib.rgb(0.7, 0.7, 0.7)
            });
          });

          const savedBytes = await pdfDoc.save();
          stopLoading();
          requestDownload(new Blob([savedBytes], { type: 'application/pdf' }), 'watermarked_document.pdf');
        } catch (e) {
          stopLoading();
          notifyError('Watermark Error', 'Failed to embed text layers in document.');
        }
      };
    }
  },

  // --- ADD PAGE NUMBERS ---
  'pdf-numbers': {
    ui(): string {
      return `
        <div class="max-w-2xl mx-auto space-y-8 animate-fade-in-up">
          <div id="drop-zone" class="glass-panel p-10 rounded-3xl text-center cursor-pointer border-2 border-transparent hover:border-violet-500 transition-all">
            <i class="fa-solid fa-list-ol text-5xl text-violet-500 mb-4"></i>
            <div id="file-name" class="font-bold text-xl text-[var(--text-primary)]">Select PDF to Add Page Numbers</div>
            <input type="file" id="file-input" class="hidden" accept=".pdf">
          </div>
          <button id="action-btn" class="w-full py-4 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-bold hidden shadow-lg animate-pulse-slow">Add Pagination</button>
        </div>`;
    },
    async init() {
      await loadPdfLib();
      const dropZone = document.getElementById('drop-zone') as HTMLElement;
      const fileInput = document.getElementById('file-input') as HTMLInputElement;
      const label = document.getElementById('file-name') as HTMLElement;
      const actionBtn = document.getElementById('action-btn') as HTMLButtonElement;

      let fileBytes: ArrayBuffer | null = null;

      dropZone.onclick = () => fileInput.click();
      fileInput.onchange = async () => {
        if (fileInput.files && fileInput.files[0]) {
          fileBytes = await fileInput.files[0].arrayBuffer();
          label.innerText = fileInput.files[0].name;
          actionBtn.classList.remove('hidden');
        }
      };

      actionBtn.onclick = async () => {
        if (!fileBytes) return;
        startLoading('Rendering page numbers...');
        try {
          const PDFLib = window.PDFLib;
          const pdfDoc = await PDFLib.PDFDocument.load(fileBytes);
          const font = await pdfDoc.embedFont(PDFLib.StandardFonts.Helvetica);
          const pages = pdfDoc.getPages();

          pages.forEach((page: any, idx: number) => {
            const { width } = page.getSize();
            // Centered bottom page footer
            page.drawText(`Page ${idx + 1} of ${pages.length}`, {
              x: width / 2 - 35,
              y: 25,
              size: 10,
              font: font,
              color: PDFLib.rgb(0.4, 0.4, 0.4)
            });
          });

          const savedBytes = await pdfDoc.save();
          stopLoading();
          requestDownload(new Blob([savedBytes], { type: 'application/pdf' }), 'numbered_document.pdf');
        } catch (e) {
          stopLoading();
          notifyError('Numbers Injection Failed', 'Encryption settings block layout upgrades.');
        }
      };
    }
  },

  // --- PDF METADATA EDITOR ---
  'pdf-meta': {
    ui(): string {
      return `
        <div class="max-w-2xl mx-auto space-y-6 animate-fade-in-up">
          <div id="drop-zone" class="glass-panel p-10 rounded-3xl text-center cursor-pointer border-2 border-transparent hover:border-pink-500 transition-all">
            <i class="fa-solid fa-tag text-5xl text-pink-500 mb-4"></i>
            <div id="file-name" class="font-bold text-lg text-[var(--text-primary)]">Select PDF to Edit Metadata</div>
            <input type="file" id="file-input" class="hidden" accept=".pdf">
          </div>
          <div id="meta-form" class="space-y-4 opacity-50 pointer-events-none transition-all">
            <div class="glass-panel p-6 rounded-2xl bg-black/10 space-y-4">
              <div>
                <label class="block text-xs font-bold text-[var(--text-secondary)] uppercase mb-2" for="meta-title">Document Title</label>
                <input id="meta-title" class="glass-input w-full p-3.5 rounded-xl text-[var(--text-primary)]">
              </div>
              <div>
                <label class="block text-xs font-bold text-[var(--text-secondary)] uppercase mb-2" for="meta-author">Author / Developer</label>
                <input id="meta-author" class="glass-input w-full p-3.5 rounded-xl text-[var(--text-primary)]">
              </div>
            </div>
            <button id="action-btn" class="w-full py-4 rounded-xl bg-pink-600 hover:bg-pink-500 text-white font-bold shadow-lg">Save Metadata Properties</button>
          </div>
        </div>`;
    },
    async init() {
      await loadPdfLib();
      const dropZone = document.getElementById('drop-zone') as HTMLElement;
      const fileInput = document.getElementById('file-input') as HTMLInputElement;
      const label = document.getElementById('file-name') as HTMLElement;
      const form = document.getElementById('meta-form') as HTMLElement;
      const titleInput = document.getElementById('meta-title') as HTMLInputElement;
      const authorInput = document.getElementById('meta-author') as HTMLInputElement;
      const actionBtn = document.getElementById('action-btn') as HTMLButtonElement;

      let pendingBytes: ArrayBuffer | null = null;

      dropZone.onclick = () => fileInput.click();
      fileInput.onchange = async () => {
        if (fileInput.files && fileInput.files[0]) {
          pendingBytes = await fileInput.files[0].arrayBuffer();
          label.innerText = fileInput.files[0].name;
          
          try {
            const PDFLib = window.PDFLib;
            const pdfDoc = await PDFLib.PDFDocument.load(pendingBytes);
            titleInput.value = pdfDoc.getTitle() || '';
            authorInput.value = pdfDoc.getAuthor() || '';
            
            form.classList.remove('opacity-50', 'pointer-events-none');
          } catch(e) {
            notifyError('PDF Protected', 'Document metadata blocks editing permissions.');
          }
        }
      };

      actionBtn.onclick = async () => {
        if (!pendingBytes) return;
        startLoading('Updating properties...');
        try {
          const PDFLib = window.PDFLib;
          const pdfDoc = await PDFLib.PDFDocument.load(pendingBytes);
          pdfDoc.setTitle(titleInput.value);
          pdfDoc.setAuthor(authorInput.value);

          const savedBytes = await pdfDoc.save();
          stopLoading();
          requestDownload(new Blob([savedBytes], { type: 'application/pdf' }), 'edited_meta.pdf');
        } catch (e) {
          stopLoading();
          notifyError('Save Failure', 'Failed to output modified values.');
        }
      };
    }
  },

  // --- CRYPTO OR SECURE PDF PROTECT / UNLOCK ---
  'protect-pdf': {
    ui(): string {
      return `
        <div class="max-w-2xl mx-auto space-y-8 animate-fade-in-up">
          <div id="drop-zone" class="glass-panel p-10 rounded-3xl text-center cursor-pointer border-2 border-transparent hover:border-slate-500 transition-all">
            <i class="fa-solid fa-lock text-5xl text-slate-500 mb-4"></i>
            <div id="file-name" class="font-bold text-xl text-[var(--text-primary)]">Select PDF to Encrypt</div>
            <input type="file" id="file-input" class="hidden" accept=".pdf">
          </div>
          <div id="options" class="hidden space-y-4">
            <div class="glass-panel p-6 rounded-2xl bg-black/10">
              <label class="block text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-2" for="pdf-pass">Encryption Password</label>
              <input type="password" id="pdf-pass" class="glass-input w-full p-4 rounded-xl text-[var(--text-primary)]" placeholder="Set user/owner key">
            </div>
            <button id="action-btn" class="w-full py-4 rounded-xl bg-slate-600 hover:bg-slate-500 text-white font-bold shadow-lg font-sans">Lock & Encrypt File</button>
          </div>
        </div>`;
    },
    async init() {
      await loadPdfLib();
      const dropZone = document.getElementById('drop-zone') as HTMLElement;
      const fileInput = document.getElementById('file-input') as HTMLInputElement;
      const nameLabel = document.getElementById('file-name') as HTMLElement;
      const options = document.getElementById('options') as HTMLElement;
      const actionBtn = document.getElementById('action-btn') as HTMLButtonElement;

      let fileBytes: ArrayBuffer | null = null;

      dropZone.onclick = () => fileInput.click();
      fileInput.onchange = async () => {
        if (fileInput.files && fileInput.files[0]) {
          fileBytes = await fileInput.files[0].arrayBuffer();
          nameLabel.innerText = fileInput.files[0].name;
          options.classList.remove('hidden');
        }
      };

      actionBtn.onclick = async () => {
        if (!fileBytes) return;
        const pass = (document.getElementById('pdf-pass') as HTMLInputElement).value;
        if (!pass) {
          notifyError('Password required', 'Please configure an encryption key first.');
          return;
        }

        startLoading('Applying 128-bit AES Encryption...');
        try {
          const PDFLib = window.PDFLib;
          const pdfDoc = await PDFLib.PDFDocument.load(fileBytes);
          pdfDoc.encrypt({
            userPassword: pass,
            ownerPassword: pass,
            permissions: {
              modifying: false,
              copying: false,
              printing: 'highResolution'
            }
          });
          const savedBytes = await pdfDoc.save();
          stopLoading();
          requestDownload(new Blob([savedBytes], { type: 'application/pdf' }), 'secured_document.pdf');
        } catch (e) {
          stopLoading();
          notifyError('Encryption failed', 'Document structure is highly restricted.');
        }
      };
    }
  },

  // --- UNLOCK PASSPORST/PDF ---
  'unlock-pdf': {
    ui(): string {
      return `
        <div class="max-w-2xl mx-auto space-y-8 animate-fade-in-up">
          <div id="drop-zone" class="glass-panel p-10 rounded-3xl text-center cursor-pointer border-2 border-transparent hover:border-green-500 transition-all">
            <i class="fa-solid fa-lock-open text-5xl text-green-500 mb-4"></i>
            <div id="file-name" class="font-bold text-xl text-[var(--text-primary)]">Select Locked PDF</div>
            <input type="file" id="file-input" class="hidden" accept=".pdf">
          </div>
          <div id="options" class="hidden space-y-4">
            <div class="glass-panel p-6 rounded-2xl bg-black/10">
              <label class="block text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-2" for="pdf-pass">Current Password</label>
              <input type="password" id="pdf-pass" class="glass-input w-full p-4 rounded-xl text-[var(--text-primary)]">
            </div>
            <button id="action-btn" class="w-full py-4 rounded-xl bg-green-600 hover:bg-green-500 text-white font-bold shadow-lg">Decrypt & Unlock PDF</button>
          </div>
        </div>`;
    },
    async init() {
      await loadPdfLib();
      const dropZone = document.getElementById('drop-zone') as HTMLElement;
      const fileInput = document.getElementById('file-input') as HTMLInputElement;
      const nameLabel = document.getElementById('file-name') as HTMLElement;
      const options = document.getElementById('options') as HTMLElement;
      const actionBtn = document.getElementById('action-btn') as HTMLButtonElement;

      let fileBytes: ArrayBuffer | null = null;

      dropZone.onclick = () => fileInput.click();
      fileInput.onchange = async () => {
        if (fileInput.files && fileInput.files[0]) {
          fileBytes = await fileInput.files[0].arrayBuffer();
          nameLabel.innerText = fileInput.files[0].name;
          options.classList.remove('hidden');
        }
      };

      actionBtn.onclick = async () => {
        if (!fileBytes) return;
        const pass = (document.getElementById('pdf-pass') as HTMLInputElement).value;
        startLoading('Decrypting package...');
        try {
          const PDFLib = window.PDFLib;
          const pdfDoc = await PDFLib.PDFDocument.load(fileBytes, { password: pass });
          const savedBytes = await pdfDoc.save();
          stopLoading();
          requestDownload(new Blob([savedBytes], { type: 'application/pdf' }), 'unlocked_document.pdf');
        } catch (e) {
          stopLoading();
          notifyError('Decryption Failed', 'Invalid password. Please match correct values.');
        }
      };
    }
  },

  // --- REMOVE COMPONENT PAGES ---
  'remove-pages': {
    ui(): string {
      return `
        <div class="max-w-2xl mx-auto space-y-8 animate-fade-in-up">
          <div id="drop-zone" class="glass-panel p-10 rounded-3xl text-center cursor-pointer border-2 border-transparent hover:border-red-500 transition-all">
            <i class="fa-solid fa-trash-can text-5xl text-red-500 mb-4"></i>
            <div id="file-name" class="font-bold text-xl text-[var(--text-primary)]">Select PDF</div>
            <input type="file" id="file-input" class="hidden" accept=".pdf">
          </div>
          <div id="options" class="opacity-50 pointer-events-none transition-all space-y-4">
            <div class="glass-panel p-6 rounded-2xl bg-black/10">
              <label class="block text-sm font-bold text-[var(--text-secondary)] mb-2" for="rem-range">Pages to delete (1-indexed)</label>
              <input type="text" id="rem-range" placeholder="e.g. 2, 4, 6-8" class="glass-input w-full p-4 rounded-xl text-[var(--text-primary)]">
            </div>
            <button id="action-btn" class="w-full py-4 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold shadow-lg">Remove Pages</button>
          </div>
        </div>`;
    },
    async init() {
      await loadPdfLib();
      const dropZone = document.getElementById('drop-zone') as HTMLElement;
      const fileInput = document.getElementById('file-input') as HTMLInputElement;
      const nameLabel = document.getElementById('file-name') as HTMLElement;
      const options = document.getElementById('options') as HTMLElement;
      const actionBtn = document.getElementById('action-btn') as HTMLButtonElement;

      let fileBytes: ArrayBuffer | null = null;

      dropZone.onclick = () => fileInput.click();
      fileInput.onchange = async () => {
        if (fileInput.files && fileInput.files[0]) {
          fileBytes = await fileInput.files[0].arrayBuffer();
          nameLabel.innerText = fileInput.files[0].name;
          options.classList.remove('opacity-50', 'pointer-events-none');
        }
      };

      actionBtn.onclick = async () => {
        if (!fileBytes) return;
        const pRange = (document.getElementById('rem-range') as HTMLInputElement).value;
        if (!pRange) {
          notifyError('Input Required', 'Please input indices to delete.');
          return;
        }

        startLoading('Re-rendering layout minus selected sheets...');
        try {
          const PDFLib = window.PDFLib;
          const original = await PDFLib.PDFDocument.load(fileBytes);
          const splitDocument = await PDFLib.PDFDocument.create();
          const totalCount = original.getPageCount();
          const skipSet = new Set<number>();

          pRange.split(',').forEach(p => {
            const trim = p.trim();
            if (trim.includes('-')) {
              const [s, e] = trim.split('-').map(x => parseInt(x));
              if (!isNaN(s) && !isNaN(e)) {
                for (let k = s; k <= e; k++) skipSet.add(k - 1);
              }
            } else {
              const single = parseInt(trim);
              if (!isNaN(single)) skipSet.add(single - 1);
            }
          });

          const indexesToKeep: number[] = [];
          for (let k = 0; k < totalCount; k++) {
            if (!skipSet.has(k)) indexesToKeep.push(k);
          }

          if (indexesToKeep.length === 0) {
            stopLoading();
            notifyError('Cannot delete entire file', 'At least 1 page must be retained inside PDF outputs.');
            return;
          }

          const copied = await splitDocument.copyPages(original, indexesToKeep);
          copied.forEach((page: any) => splitDocument.addPage(page));
          const savedBytes = await splitDocument.save();
          stopLoading();
          
          requestDownload(new Blob([savedBytes], { type: 'application/pdf' }), 'pages_removed.pdf');
        } catch (e) {
          stopLoading();
          notifyError('Task Error', 'Review delete indexes in reference to total count.');
        }
      };
    }
  },

  // --- EXTRACT SPEIFIC PAGES ---
  'extract-pages': {
    ui(): string {
      return `
        <div class="max-w-2xl mx-auto space-y-8 animate-fade-in-up">
          <div id="drop-zone" class="glass-panel p-10 rounded-3xl text-center cursor-pointer border-2 border-transparent hover:border-purple-500 transition-all">
            <i class="fa-solid fa-file-export text-5xl text-purple-500 mb-4"></i>
            <div id="file-name" class="font-bold text-xl text-[var(--text-primary)]">Select PDF</div>
            <input type="file" id="file-input" class="hidden" accept=".pdf">
          </div>
          <div id="options" class="opacity-50 pointer-events-none transition-all space-y-4">
            <div class="glass-panel p-6 rounded-2xl bg-black/10">
              <label class="block text-sm font-bold text-[var(--text-secondary)] mb-2" for="ext-range">Pages to separate (e.g. 1, 3, 5-7)</label>
              <input type="text" id="ext-range" placeholder="e.g. 1" class="glass-input w-full p-4 rounded-xl text-[var(--text-primary)]">
            </div>
            <button id="action-btn" class="w-full py-4 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold shadow-lg">Extract Pages</button>
          </div>
        </div>`;
    },
    async init() {
      await loadPdfLib();
      const dropZone = document.getElementById('drop-zone') as HTMLElement;
      const fileInput = document.getElementById('file-input') as HTMLInputElement;
      const nameLabel = document.getElementById('file-name') as HTMLElement;
      const options = document.getElementById('options') as HTMLElement;
      const actionBtn = document.getElementById('action-btn') as HTMLButtonElement;

      let fileBytes: ArrayBuffer | null = null;

      dropZone.onclick = () => fileInput.click();
      fileInput.onchange = async () => {
        if (fileInput.files && fileInput.files[0]) {
          fileBytes = await fileInput.files[0].arrayBuffer();
          nameLabel.innerText = fileInput.files[0].name;
          options.classList.remove('opacity-50', 'pointer-events-none');
        }
      };

      actionBtn.onclick = async () => {
        if (!fileBytes) return;
        const eRange = (document.getElementById('ext-range') as HTMLInputElement).value;
        if (!eRange) {
          notifyError('Input Required', 'Please identify index pages to extract.');
          return;
        }

        startLoading('Extracting requested pages...');
        try {
          const PDFLib = window.PDFLib;
          const original = await PDFLib.PDFDocument.load(fileBytes);
          const splitDocument = await PDFLib.PDFDocument.create();
          const targetIndices: number[] = [];

          eRange.split(',').forEach(p => {
            const trim = p.trim();
            if (trim.includes('-')) {
              const [s, e] = trim.split('-').map(x => parseInt(x));
              if (!isNaN(s) && !isNaN(e)) {
                for (let k = s; k <= e; k++) targetIndices.push(k - 1);
              }
            } else {
              const single = parseInt(trim);
              if (!isNaN(single)) targetIndices.push(single - 1);
            }
          });

          const total = original.getPageCount();
          const safeIndices = targetIndices.filter(x => x >= 0 && x < total);
          if (safeIndices.length === 0) {
            stopLoading();
            notifyError('Inbound Limits exceeded', `Request falls completely out of page bounds (1 to ${total})`);
            return;
          }

          const copied = await splitDocument.copyPages(original, safeIndices);
          copied.forEach((page: any) => splitDocument.addPage(page));
          const savedBytes = await splitDocument.save();
          stopLoading();
          
          requestDownload(new Blob([savedBytes], { type: 'application/pdf' }), 'extracted_pages.pdf');
        } catch (e) {
          stopLoading();
          notifyError('Task Error', 'Details bounds failure on PDF extraction.');
        }
      };
    }
  },

  // --- IMAGE TO VECTOR PDF ---
  'img-to-pdf': {
    ui(): string {
      return `
        <div class="max-w-4xl mx-auto space-y-8 animate-fade-in-up">
          <div id="drop-zone" class="border-2 border-dashed border-[var(--text-secondary)]/30 rounded-3xl p-12 text-center hover:border-blue-500 hover:bg-blue-500/5 transition-all cursor-pointer group select-none">
            <i class="fa-solid fa-images text-5xl text-blue-500 mb-6 group-hover:scale-110 transition-transform"></i>
            <h3 class="text-2xl font-bold mb-2 text-[var(--text-primary)]">Drop Images Here or Click</h3>
            <p class="text-sm text-[var(--text-secondary)]">PNG, JPG, or WEBP. Converts each block to direct PDF pages.</p>
            <input type="file" id="file-input" class="hidden" accept="image/*" multiple>
          </div>
          <div id="file-list" class="grid grid-cols-2 md:grid-cols-4 gap-4"></div>
          <button id="action-btn" class="w-full py-4 rounded-xl bg-blue-600 hover:bg-blue-500 hover:scale-[1.01] text-white font-bold shadow-lg hidden transition-all">Assemble & Download PDF</button>
        </div>`;
    },
    async init() {
      await loadJsPdf();
      const dropZone = document.getElementById('drop-zone') as HTMLElement;
      const fileInput = document.getElementById('file-input') as HTMLInputElement;
      const lContainer = document.getElementById('file-list') as HTMLElement;
      const actionBtn = document.getElementById('action-btn') as HTMLButtonElement;

      let fileArray: File[] = [];

      const renderGrid = () => {
        lContainer.innerHTML = '';
        if (fileArray.length > 0) {
          actionBtn.classList.remove('hidden');
        } else {
          actionBtn.classList.add('hidden');
        }

        fileArray.forEach((file, idx) => {
          const div = document.createElement('div');
          div.className = 'glass-panel p-2 rounded-xl relative overflow-hidden bg-black/10';
          
          const img = document.createElement('img');
          img.className = 'w-full h-24 object-cover rounded-lg border border-slate-700/20';
          img.src = URL.createObjectURL(file);
          div.appendChild(img);

          const rm = document.createElement('button');
          rm.className = 'absolute -top-1 -right-1 w-5 h-5 bg-red-600 hover:bg-red-500 text-white font-bold rounded-full text-[10px] flex items-center justify-center z-10 transition-transform scale-100 hover:scale-110';
          rm.innerText = '×';
          rm.onclick = (e) => {
            e.stopPropagation();
            fileArray.splice(idx, 1);
            renderGrid();
          };
          div.appendChild(rm);
          lContainer.appendChild(div);
        });
      };

      dropZone.onclick = () => fileInput.click();
      fileInput.onchange = () => {
        if (fileInput.files) {
          fileArray = [...fileArray, ...Array.from(fileInput.files)];
          renderGrid();
        }
      };

      actionBtn.onclick = async () => {
        if (fileArray.length === 0) return;
        startLoading('Assembling PDF document...');
        try {
          const { jsPDF } = window.jspdf;
          const pdf = new jsPDF('p', 'mm', 'a4');
          
          for (let k = 0; k < fileArray.length; k++) {
            if (k > 0) pdf.addPage();
            
            const file = fileArray[k];
            const dataUrl = await new Promise<string>((resolve) => {
              const r = new FileReader();
              r.onload = ev => resolve(ev.target?.result as string);
              r.readAsDataURL(file);
            });

            const properties = pdf.getImageProperties(dataUrl);
            const pWidth = pdf.internal.pageSize.getWidth();
            const pHeight = (properties.height * pWidth) / properties.width;
            
            pdf.addImage(dataUrl, 'JPEG', 0, 0, pWidth, pHeight);
          }

          const outBlob = pdf.output('blob');
          stopLoading();
          requestDownload(outBlob, 'converted_images.pdf');
        } catch (e) {
          stopLoading();
          notifyError('Assemble Error', 'Ensure files are valid JP/PNG vectors.');
        }
      };
    }
  },

  // --- PDF TO IMAGE EXTRACTOR ZIP ---
  'pdf-to-img': {
    ui(): string {
      return `
        <div class="max-w-2xl mx-auto space-y-8 animate-fade-in-up">
          <div id="drop-zone" class="glass-panel p-12 rounded-3xl text-center cursor-pointer hover:border-sky-500 border-2 border-transparent transition-all">
            <i class="fa-solid fa-file-image text-5xl text-sky-500 mb-4"></i>
            <div id="file-name" class="font-bold text-xl text-[var(--text-primary)]">Select PDF</div>
            <p class="text-sm text-[var(--text-secondary)] mt-1">Converts all sheets to high resolution full JPEG assets inside a clean ZIP folder.</p>
            <input type="file" id="file-input" class="hidden" accept=".pdf">
          </div>
          <button id="action-btn" class="w-full py-4 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold hidden shadow-lg">Save pages as ZIP</button>
        </div>`;
    },
    async init() {
      startLoading('Bootstrapping zipper utilities...');
      await Promise.all([loadPdfJs(), loadJSZip()]);
      stopLoading();

      const dropZone = document.getElementById('drop-zone') as HTMLElement;
      const fileInput = document.getElementById('file-input') as HTMLInputElement;
      const label = document.getElementById('file-name') as HTMLElement;
      const actionBtn = document.getElementById('action-btn') as HTMLButtonElement;

      let targetedFile: File | null = null;

      dropZone.onclick = () => fileInput.click();
      fileInput.onchange = () => {
        if (fileInput.files && fileInput.files[0]) {
          targetedFile = fileInput.files[0];
          label.innerText = targetedFile.name;
          actionBtn.classList.remove('hidden');
        }
      };

      actionBtn.onclick = async () => {
        if (!targetedFile) return;
        startLoading('Rendering pages to direct PNG images...');
        try {
          const pdfjs = window.pdfjsLib;
          const JSZip = window.JSZip;
          const pdf = await pdfjs.getDocument(await targetedFile.arrayBuffer()).promise;
          const zip = new JSZip();

          for (let k = 1; k <= pdf.numPages; k++) {
            const page = await pdf.getPage(k);
            const viewport = page.getViewport({ scale: 2 }); // Double density scaling output
            const canvas = document.createElement('canvas');
            canvas.width = viewport.width;
            canvas.height = viewport.height;
            
            const ctx = canvas.getContext('2d');
            if (ctx) {
              await page.render({ canvasContext: ctx, viewport: viewport }).promise;
            }
            
            const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
            const b64Data = dataUrl.split(',')[1];
            zip.file(`page_sheet_${k}.jpg`, b64Data, { base64: true });
          }

          const zipBlob = await zip.generateAsync({ type: 'blob' });
          stopLoading();
          requestDownload(zipBlob, 'extracted_sheets.zip');
        } catch (e) {
          stopLoading();
          notifyError('Rasterization failure', 'Security settings blocks parsing inside sandboxed instances.');
        }
      };
    }
  },

  // --- SCAN DOCUMENT DEVICE CAMERA ---
  'scan-to-pdf': {
    ui(): string {
      return `
        <div class="max-w-2xl mx-auto animate-fade-in-up text-center space-y-4">
          <div id="drop-zone" class="border-2 border-dashed border-[var(--text-secondary)]/30 rounded-3xl p-16 hover:border-indigo-500 hover:bg-indigo-500/5 transition-all cursor-pointer group">
            <i class="fa-solid fa-camera text-6xl text-indigo-500 mb-6 group-hover:scale-110 transition-transform"></i>
            <h3 class="text-2xl font-bold mb-2 text-[var(--text-primary)]">Take Photo or Upload Page</h3>
            <p class="text-[var(--text-secondary)]">Supports mobile devices built-in document camera scanner.</p>
            <input type="file" id="file-input" class="hidden" accept="image/*" capture="environment">
          </div>
        </div>`;
    },
    async init() {
      await loadJsPdf();
      const dropZone = document.getElementById('drop-zone') as HTMLElement;
      const fileInput = document.getElementById('file-input') as HTMLInputElement;

      dropZone.onclick = () => fileInput.click();
      fileInput.onchange = async () => {
        if (fileInput.files && fileInput.files[0]) {
          const file = fileInput.files[0];
          startLoading('Compiling scan package...');
          try {
            const { jsPDF } = window.jspdf;
            const pdf = new jsPDF();
            
            const imgData = await new Promise<string>((resolve) => {
              const r = new FileReader();
              r.onload = ev => resolve(ev.target?.result as string);
              r.readAsDataURL(file);
            });

            const props = pdf.getImageProperties(imgData);
            const pWidth = pdf.internal.pageSize.getWidth();
            const pHeight = (props.height * pWidth) / props.width;
            
            pdf.addImage(imgData, 'JPEG', 0, 0, pWidth, pHeight);
            const blob = pdf.output('blob');
            stopLoading();
            requestDownload(blob, 'scanned_doc.pdf');
          } catch(e) {
            stopLoading();
            notifyError('Scan Error', 'Ensure captured photo contains standard image properties.');
          }
        }
      };
    }
  }
};
