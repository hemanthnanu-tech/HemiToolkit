import './index.css';
import { ToolCategory, ToolDefinition, ApplicationState } from './types';
import { htmlToPdfTool } from './tools/htmlToPdf';
import { pdfProcessorTools } from './tools/pdfProcessor';
import { imageProcessorTools } from './tools/imageProcessor';
import { utilityTools } from './tools/utilities';

// Combine all tools map
const toolsUIAndHandlers: { [key: string]: { ui: () => string; init: () => void; render?: () => void } } = {
  'html-to-pdf': {
    ui: htmlToPdfTool.renderUI,
    init: htmlToPdfTool.init
  },
  ...pdfProcessorTools,
  ...imageProcessorTools,
  ...utilityTools
};

const appState: ApplicationState = {
  activeTool: null,
  files: [],
  downloadBlob: null,
  downloadName: ''
};

const categories: ToolCategory[] = [
  { id: 'all', label: 'All Utilities' },
  { id: 'organize', label: 'Organize Files' },
  { id: 'convert', label: 'Convert Format' },
  { id: 'edit', label: 'Edit Content' },
  { id: 'security', label: 'Security & Crypto' },
  { id: 'util', label: 'Developer Tools' }
];

const tools: ToolDefinition[] = [
  { id: 'html-to-pdf', cat: 'convert', title: 'HTML to PDF', desc: 'Saves clean HTML sheets directly to high quality Vector PDF files.', icon: 'fa-brands fa-html5', color: 'bg-orange-600' },
  { id: 'pdf-merge', cat: 'organize', title: 'Merge PDFs', desc: 'Combine multiple PDF files into a single structured document.', icon: 'fa-solid fa-layer-group', color: 'bg-rose-500' },
  { id: 'pdf-split', cat: 'organize', title: 'Split PDF', desc: 'Separate customized page ranges as independent documents.', icon: 'fa-solid fa-scissors', color: 'bg-orange-500' },
  { id: 'compress-pdf', cat: 'organize', title: 'Compress PDF', desc: 'Optimize image structures to drastically reduce file sizes.', icon: 'fa-solid fa-file-zipper', color: 'bg-green-600' },
  { id: 'compress-img', cat: 'organize', title: 'Compress Image', desc: 'Reduce weight of PNG, JPG, or WEBP photos in real-time.', icon: 'fa-solid fa-image', color: 'bg-teal-600' },
  { id: 'remove-pages', cat: 'organize', title: 'Remove Pages', desc: 'Delete unwanted sheets and compile updated documents.', icon: 'fa-solid fa-trash-can', color: 'bg-red-500' },
  { id: 'extract-pages', cat: 'organize', title: 'Extract Pages', desc: 'Isolate specified sheets as a separate download.', icon: 'fa-solid fa-file-export', color: 'bg-purple-500' },
  { id: 'scan-to-pdf', cat: 'convert', title: 'Scan to PDF', desc: 'Capture or snap physical sheets with direct device camera.', icon: 'fa-solid fa-camera', color: 'bg-indigo-500' },
  { id: 'img-to-pdf', cat: 'convert', title: 'Images to PDF', desc: 'Convert and rank multi-image grids into single PDF sheets.', icon: 'fa-solid fa-images', color: 'bg-blue-500' },
  { id: 'pdf-to-img', cat: 'convert', title: 'PDF to JPG', desc: 'Extract all standalone sheets into a clean zipped image bundle.', icon: 'fa-solid fa-file-image', color: 'bg-sky-500' },
  { id: 'img-convert', cat: 'convert', title: 'Image Converter', desc: 'Swap image format mappings on PNG, JPEGs or WEBPs.', icon: 'fa-solid fa-camera-rotate', color: 'bg-teal-500' },
  { id: 'sign-pdf', cat: 'edit', title: 'Sign Documents', desc: 'Embed handwritten digital signatures onto first page vectors.', icon: 'fa-solid fa-signature', color: 'bg-emerald-600' },
  { id: 'pdf-rotate', cat: 'edit', title: 'Rotate Sheets', desc: 'Fix page orientation rotations in multi-angled segments.', icon: 'fa-solid fa-rotate-right', color: 'bg-indigo-600' },
  { id: 'pdf-numbers', cat: 'edit', title: 'Page Numbers', desc: 'Add clean pagination text footers to matching pages.', icon: 'fa-solid fa-list-ol', color: 'bg-violet-600' },
  { id: 'pdf-watermark', cat: 'edit', title: 'Watermark', desc: 'Apply oblique overlays with customizable text settings.', icon: 'fa-solid fa-stamp', color: 'bg-cyan-600' },
  { id: 'pdf-meta', cat: 'edit', title: 'PDF Metadata', desc: 'Configure document title, authors and reference keywords.', icon: 'fa-solid fa-tag', color: 'bg-pink-600' },
  { id: 'protect-pdf', cat: 'security', title: 'Protect PDF', desc: 'Apply 128-bit AES password encryption permissions key.', icon: 'fa-solid fa-lock', color: 'bg-slate-600' },
  { id: 'unlock-pdf', cat: 'security', title: 'Unlock PDF', desc: 'Remove password protection locks to access layers.', icon: 'fa-solid fa-lock-open', color: 'bg-green-600' },
  { id: 'pass-gen', cat: 'security', title: 'Password Gen', desc: 'Generate highly custom cryptographic keys.', icon: 'fa-solid fa-key', color: 'bg-red-600' },
  { id: 'json-fmt', cat: 'util', title: 'JSON Tools', desc: 'Format, beautify or compress raw JSON payload strings.', icon: 'fa-solid fa-code', color: 'bg-yellow-500' },
  { id: 'qr-gen', cat: 'util', title: 'QR Generator', desc: 'Create standard High corrective density 2D code blocks.', icon: 'fa-solid fa-qrcode', color: 'bg-gray-500' },
  { id: 'color-tool', cat: 'util', title: 'Color Picker', desc: 'Direct access palette values across HEX, RGB formats.', icon: 'fa-solid fa-eye-dropper', color: 'bg-lime-600' },
  { id: 'base64-tool', cat: 'util', title: 'Base64 Engine', desc: 'Encode or decode plain text strings into Base64 format.', icon: 'fa-solid fa-shield-halved', color: 'bg-indigo-500' },
  { id: 'regex-tester', cat: 'util', title: 'Regex Tester', desc: 'Live regular expression testing with matching highlighting.', icon: 'fa-solid fa-asterisk', color: 'bg-fuchsia-600' },
  { id: 'lorem-gen', cat: 'util', title: 'Lorem Ipsum', desc: 'Generate customized dummy placeholder text paragraphs.', icon: 'fa-solid fa-paragraph', color: 'bg-amber-600' },
  { id: 'markdown-view', cat: 'edit', title: 'MD Preview', desc: 'Real-time Markdown editor with styled HTML rendering.', icon: 'fa-brands fa-markdown', color: 'bg-sky-600' },
  { id: 'text-diff', cat: 'edit', title: 'Text Diff', desc: 'Compare text blocks to highlight added or removed strings.', icon: 'fa-solid fa-code-compare', color: 'bg-rose-500' }
];

// Theme Switcher manager module
const themeManager = {
  modes: ['light', 'dark', 'oled'],
  icons: { light: 'fa-sun', dark: 'fa-moon', oled: 'fa-circle' },

  init() {
    this.set(localStorage.getItem('hemi_theme') || 'light');
  },

  set(mode: string) {
    const html = document.documentElement;
    html.classList.remove('light', 'dark', 'oled');
    html.classList.add(mode);
    localStorage.setItem('hemi_theme', mode);

    const btn = document.getElementById('theme-btn');
    if (btn) {
      btn.innerHTML = `<i class="fa-solid ${this.icons[mode as 'dark' | 'light' | 'oled'] || 'fa-moon'}"></i>`;
      btn.className = btn.className.replace(/text-\w+-\d+/g, '');
      if (mode === 'light') {
        btn.classList.add('text-amber-500');
      } else if (mode === 'dark') {
        btn.classList.add('text-blue-400');
      } else {
        btn.classList.add('text-white');
      }
    }

    // Notify tools that listen to theme switches (e.g., QR rendering refreshes)
    if (appState.activeTool && toolsUIAndHandlers[appState.activeTool]?.render) {
      toolsUIAndHandlers[appState.activeTool].render!();
    }
  },

  toggle() {
    const current = localStorage.getItem('hemi_theme') || 'light';
    const index = this.modes.indexOf(current);
    const next = this.modes[(index + 1) % this.modes.length];
    this.set(next);
  }
};

// Routing and Page controller
const router = {
  goHome() {
    appState.activeTool = null;
    appState.files = [];
    const dashboard = document.getElementById('view-dashboard');
    const toolView = document.getElementById('view-tool');
    const workspace = document.getElementById('tool-workspace');

    if (!dashboard || !toolView || !workspace) return;

    if (typeof window.gsap !== 'undefined') {
      window.gsap.to(toolView, {
        opacity: 0,
        y: 10,
        duration: 0.25,
        ease: "power2.in",
        onComplete: () => {
          toolView.classList.add('hidden');
          workspace.innerHTML = '';
          dashboard.classList.remove('hidden');
          window.gsap.fromTo(dashboard, { opacity: 0, y: -10 }, { opacity: 1, y: 0, duration: 0.3, ease: "power2.out" });
          
          window.gsap.fromTo(".tool-card", 
            { opacity: 0, scale: 0.95, y: 15 }, 
            { opacity: 1, scale: 1, y: 0, duration: 0.4, stagger: 0.015, ease: "back.out(1.2)" }
          );
        }
      });
    } else {
      toolView.classList.add('hidden');
      workspace.innerHTML = '';
      dashboard.classList.remove('hidden');
      dashboard.style.opacity = '1';
    }
  },

  openTool(id: string) {
    const tool = tools.find(t => t.id === id);
    if (!tool) return;

    appState.activeTool = id;
    appState.files = [];
    
    const dashboard = document.getElementById('view-dashboard');
    const toolView = document.getElementById('view-tool');
    const workspace = document.getElementById('tool-workspace');

    if (!dashboard || !toolView || !workspace) return;

    const titleEl = document.getElementById('tool-title');
    const descEl = document.getElementById('tool-desc');
    const iconWrapper = document.getElementById('tool-icon-wrapper');

    if (titleEl) titleEl.innerText = tool.title;
    if (descEl) descEl.innerText = tool.desc;
    if (iconWrapper) {
      iconWrapper.className = `w-16 h-16 rounded-2xl flex items-center justify-center text-3xl shadow-lg transition-transform hover:scale-105 text-white ${tool.color}`;
      iconWrapper.innerHTML = `<i class="${tool.icon}"></i>`;
    }

    const handler = toolsUIAndHandlers[id];
    if (handler) {
      workspace.innerHTML = handler.ui();
    } else {
      workspace.innerHTML = `<div class="text-center py-20 text-[var(--text-secondary)]">Interface build state pending...</div>`;
    }

    if (typeof window.gsap !== 'undefined') {
      window.gsap.to(dashboard, {
        opacity: 0,
        y: -10,
        duration: 0.25,
        ease: "power2.in",
        onComplete: () => {
          dashboard.classList.add('hidden');
          toolView.classList.remove('hidden');
          window.gsap.fromTo(toolView, { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: 0.3, ease: "power2.out" });
          
          if (handler) {
            handler.init();
            setupDropZoneListeners();
          }
        }
      });
    } else {
      dashboard.classList.add('hidden');
      toolView.classList.remove('hidden');
      toolView.style.opacity = '1';
      if (handler) {
        handler.init();
        setupDropZoneListeners();
      }
    }
  }
};

// Global Drag & Drop Handler for all workspace tools
function setupDropZoneListeners() {
  const dropZone = document.getElementById('drop-zone');
  const fileInput = document.getElementById('file-input') as HTMLInputElement;

  if (!dropZone || !fileInput) return;

  dropZone.ondragover = (ev: DragEvent) => {
    ev.preventDefault();
    dropZone.classList.add('drag-over-active');
  };

  dropZone.ondragleave = (ev: DragEvent) => {
    ev.preventDefault();
    dropZone.classList.remove('drag-over-active');
  };

  dropZone.ondrop = (ev: DragEvent) => {
    ev.preventDefault();
    dropZone.classList.remove('drag-over-active');

    if (ev.dataTransfer && ev.dataTransfer.files && ev.dataTransfer.files.length > 0) {
      try {
        const dt = new DataTransfer();
        for (let i = 0; i < ev.dataTransfer.files.length; i++) {
          dt.items.add(ev.dataTransfer.files[i]);
        }
        fileInput.files = dt.files;
        fileInput.dispatchEvent(new Event('change', { bubbles: true }));
      } catch (err) {
        console.error('Failed to translate dropped files securely: ', err);
      }
    }
  };
}

// Create the cards grid based on filters
function renderDashboard(filter = 'all') {
  const container = document.getElementById('tools-grid');
  const catPills = document.getElementById('category-pills');
  
  if (!container || !catPills) return;

  // Render Category filter pills
  catPills.innerHTML = categories.map(c => `
    <button data-cat="${c.id}" class="cat-pill px-5 py-2.5 rounded-full text-xs font-bold uppercase tracking-wider transition-all select-none cursor-pointer ${
      filter === c.id 
        ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/25 scale-105' 
        : 'glass-panel text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-white/5'
    }">
      ${c.label}
    </button>
  `).join('');

  // Attach triggers to newly injected Category Pills
  document.querySelectorAll('.cat-pill').forEach(btn => {
    (btn as HTMLButtonElement).onclick = () => {
      const selected = (btn as HTMLButtonElement).dataset.cat || 'all';
      renderDashboard(selected);
    };
  });

  const filtered = filter === 'all' ? tools : tools.filter(t => t.cat === filter);

  container.innerHTML = filtered.map(t => `
    <div data-tool-id="${t.id}" class="tool-card p-6 rounded-3xl cursor-pointer flex flex-col h-full group min-h-[220px] relative overflow-hidden">
      <!-- Ambient Glow Spot -->
      <div class="absolute -right-4 -top-4 w-24 h-24 bg-sky-500/5 dark:bg-sky-500/10 blur-3xl rounded-full group-hover:scale-150 transition-transform duration-700 pointer-events-none"></div>
      
      <div class="card-glare"></div>
      <div class="flex items-start justify-between mb-5 relative z-10">
        <div class="w-12 h-12 rounded-2xl ${t.color} flex items-center justify-center text-white text-xl shadow-xl">
          <i class="${t.icon}"></i>
        </div>
        <div class="w-8 h-8 rounded-full bg-black/10 dark:bg-white/5 flex items-center justify-center text-[var(--text-secondary)] group-hover:bg-blue-500/10 group-hover:text-blue-500 group-hover:scale-110 transition-all duration-300">
          <i class="fa-solid fa-arrow-right -rotate-45 group-hover:rotate-0 transition-transform"></i>
        </div>
      </div>
      <div class="mt-auto relative z-10">
        <h3 class="text-lg font-bold mb-1.5 text-[var(--text-primary)] tracking-tight">${t.title}</h3>
        <p class="text-xs text-[var(--text-secondary)] leading-relaxed font-sans">${t.desc}</p>
      </div>
    </div>
  `).join('');

  // Re-attach core card navigation triggers
  document.querySelectorAll('[data-tool-id]').forEach(card => {
    (card as HTMLElement).onclick = () => {
      const tid = card.getAttribute('data-tool-id') || '';
      router.openTool(tid);
    };
  });

  if (typeof window.gsap !== 'undefined') {
    window.gsap.fromTo(".tool-card", 
      { opacity: 0, y: 30 }, 
      { opacity: 1, y: 0, duration: 0.5, stagger: 0.02, ease: "power3.out" }
    );
  }
}

// Interactive glare effect on grid mouse actions (without 3D tilt/bending)
function attachTiltMechanisms() {
  const container = document.getElementById('tools-grid');
  if (!container) return;

  container.onmousemove = (e: MouseEvent) => {
    const cards = document.querySelectorAll('.tool-card');
    cards.forEach(card => {
      const element = card as HTMLElement;
      const rect = element.getBoundingClientRect();
      const x = e.clientX - (rect.left + rect.width / 2);
      const y = e.clientY - (rect.top + rect.height / 2);
      const distance = Math.sqrt(x*x + y*y);
      const maxDistance = 250;

      const glare = element.querySelector('.card-glare') as HTMLElement;
      if (glare) {
        if (distance < maxDistance) {
          const factor = (maxDistance - distance) / maxDistance;
          glare.style.opacity = (0.25 * factor).toString();
          glare.style.transform = `translate(${x * -0.1}px, ${y * -0.1}px)`;
        } else {
          glare.style.opacity = '0';
        }
      }
    });
  };

  container.onmouseleave = () => {
    document.querySelectorAll('.tool-card').forEach(card => {
      const glare = card.querySelector('.card-glare') as HTMLElement;
      if (glare) {
        glare.style.opacity = '0';
      }
    });
  };
}

// Global search bar filters
function configureSearch() {
  const searchBar = document.getElementById('global-search') as HTMLInputElement;
  if (!searchBar) return;

  searchBar.addEventListener('input', (e) => {
    const term = (e.target as HTMLInputElement).value.toLowerCase();
    const container = document.getElementById('tools-grid');
    if (!container) return;

    if (!term) {
      renderDashboard('all');
      return;
    }

    const filtered = tools.filter(t => 
      t.title.toLowerCase().includes(term) || 
      t.desc.toLowerCase().includes(term)
    );

    if (filtered.length > 0) {
      container.innerHTML = filtered.map(t => `
        <div data-tool-id="${t.id}" class="tool-card p-6 rounded-3xl cursor-pointer flex flex-col h-full group min-h-[220px] relative overflow-hidden">
          <!-- Ambient Glow Spot -->
          <div class="absolute -right-4 -top-4 w-24 h-24 bg-sky-500/5 dark:bg-sky-500/10 blur-3xl rounded-full group-hover:scale-150 transition-transform duration-700 pointer-events-none"></div>

          <div class="card-glare"></div>
          <div class="flex items-start justify-between mb-5 relative z-10">
            <div class="w-12 h-12 rounded-2xl ${t.color} flex items-center justify-center text-white text-xl shadow-xl">
              <i class="${t.icon}"></i>
            </div>
            <div class="w-8 h-8 rounded-full bg-black/10 dark:bg-white/5 flex items-center justify-center text-[var(--text-secondary)] group-hover:bg-blue-500/10 group-hover:text-blue-500 group-hover:scale-110 transition-all duration-300">
              <i class="fa-solid fa-arrow-right -rotate-45 group-hover:rotate-0 transition-transform"></i>
            </div>
          </div>
          <div class="mt-auto relative z-10">
            <h3 class="text-lg font-bold mb-1.5 text-[var(--text-primary)] tracking-tight">${t.title}</h3>
            <p class="text-xs text-[var(--text-secondary)] leading-relaxed font-sans">${t.desc}</p>
          </div>
        </div>
      `).join('');

      document.querySelectorAll('[data-tool-id]').forEach(card => {
        (card as HTMLElement).onclick = () => {
          const tid = card.getAttribute('data-tool-id') || '';
          router.openTool(tid);
        };
      });
    } else {
      container.innerHTML = `
        <div class="col-span-full text-center py-24 select-none">
          <div class="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4 text-[var(--text-secondary)] border border-[var(--glass-border)]">
            <i class="fa-solid fa-magnifying-glass text-xl"></i>
          </div>
          <h3 class="text-lg font-bold text-[var(--text-primary)] mb-1">No tools matched</h3>
          <p class="text-xs text-[var(--text-secondary)]">Try searching for other keywords like "pdf" or "image".</p>
        </div>`;
    }
  });

  document.addEventListener('keydown', (e) => {
    // Focus search on '/' trigger unless focused inside inputs
    if (e.key === '/' && document.activeElement?.tagName !== 'TEXTAREA' && document.activeElement?.tagName !== 'INPUT') {
      e.preventDefault();
      searchBar.focus();
    }
    // Return home on Escape
    if (e.key === 'Escape') {
      router.goHome();
    }
  });
}

function bootstrapModalHooks() {
  const modal = document.getElementById('modal-overlay');
  const inner = document.getElementById('download-modal');
  const cancelBtn = document.getElementById('modal-cancel');
  const confirmBtn = document.getElementById('modal-confirm');
  const nameInput = document.getElementById('modal-filename') as HTMLInputElement;

  const hideModal = () => {
    if (!modal || !inner) return;
    modal.classList.remove('opacity-100');
    inner.classList.remove('scale-100');
    inner.classList.add('scale-95');
    setTimeout(() => {
      modal.classList.add('hidden');
      (window as any)._pendingBlob = null;
      (window as any)._pendingName = '';
    }, 250);
  };

  if (cancelBtn) {
    cancelBtn.onclick = hideModal;
  }

  if (confirmBtn) {
    confirmBtn.onclick = () => {
      const blob = (window as any)._pendingBlob;
      const originalName = (window as any)._pendingName || 'download';
      const ext = originalName.split('.').pop() || 'pdf';
      let requested = nameInput?.value?.trim() || 'completed_file';
      
      if (!requested.endsWith('.' + ext)) {
        requested += '.' + ext;
      }

      if (blob && typeof window.saveAs === 'function') {
        window.saveAs(blob, requested);
        if (typeof window.confetti === 'function') {
          window.confetti({
            particleCount: 140,
            spread: 80,
            origin: { y: 0.6 }
          });
        }
      }
      hideModal();
    };
  }
}

// Initial Bootstrapper
document.addEventListener('DOMContentLoaded', () => {
  themeManager.init();
  bootstrapModalHooks();
  renderDashboard('all');
  attachTiltMechanisms();
  configureSearch();

  // Header and branding hooks
  const branding = document.getElementById('logo-branding');
  if (branding) {
    branding.onclick = () => router.goHome();
  }

  const backHomeEl = document.getElementById('back-to-dashboard-btn');
  if (backHomeEl) {
    backHomeEl.onclick = () => router.goHome();
  }

  const themeBtn = document.getElementById('theme-btn');
  if (themeBtn) {
    themeBtn.onclick = () => themeManager.toggle();
  }
});
