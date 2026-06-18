import { debounce } from '../utils';
import { printStyles } from './htmlToPdf';

const sampleLatex = `
\section*{Mathematical Equations}
This is a simple LaTeX to PDF converter. You can use standard inline math like \( E=mc^2 \) or display math:
$$
\int_{0}^{\infty} e^{-x^2} dx = \frac{\sqrt{\pi}}{2}
$$

\subsection*{Matrices}
$$
\begin{bmatrix}
1 & 2 & 3 \\
4 & 5 & 6 \\
7 & 8 & 9
\end{bmatrix}
$$
`;

export const latexToPdfTool = {
  renderUI(): string {
    return `
      <div class="flex flex-col lg:flex-row gap-8 min-h-[700px] h-auto animate-fade-in-up">
        <div class="flex-1 flex flex-col h-[400px] lg:h-auto glass-panel p-4 rounded-2xl relative bg-black/10 dark:bg-black/25">
          <div class="flex justify-between items-center mb-4">
            <label class="text-sm font-bold text-[var(--text-secondary)] uppercase tracking-wider">LaTeX Input</label>
            <div class="flex gap-2">
              <button id="clear-latex-btn" class="text-xs text-red-400 hover:text-red-300 px-2 py-1 select-none font-medium transition-colors">Clear</button>
            </div>
          </div>
          <textarea id="latex-in" class="glass-input flex-1 w-full p-4 rounded-xl font-mono text-sm resize-none text-[var(--text-primary)] border-transparent focus:border-blue-500 transition-colors" 
          placeholder="Type LaTeX code here..."></textarea>
        </div>
        
        <div class="flex flex-col justify-center items-center gap-3 py-4 lg:py-0">
          <button id="latex-print-btn" class="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 text-white font-bold shadow-2xl shadow-indigo-500/20 transition-all hover:scale-105 active:scale-95 flex items-center justify-center cursor-pointer">
            <i class="fa-solid fa-file-pdf text-2xl"></i>
          </button>
          <span class="text-[10px] text-center text-[var(--text-secondary)] uppercase font-extrabold tracking-widest select-none">Send to PDF</span>
        </div>

        <div class="flex-1 flex flex-col h-auto glass-panel p-4 rounded-2xl overflow-hidden bg-black/10 dark:bg-black/25">
          <label class="text-sm font-bold text-[var(--text-secondary)] mb-4 uppercase tracking-wider block">
            <span>A4 Preview</span>
          </label>
          <div id="latex-preview-container" class="flex-1 bg-gray-200/50 dark:bg-gray-900/40 rounded-xl overflow-hidden border border-[var(--glass-border)] relative p-4 flex justify-center backdrop-blur-sm min-h-[500px]">
            <div id="latex-preview-area" class="a4-preview shadow-2xl bg-white text-black transition-transform duration-200"></div>
          </div>
        </div>
      </div>`;
  },

  init(): void {
    const txt = document.getElementById('latex-in') as HTMLTextAreaElement;
    const prev = document.getElementById('latex-preview-area') as HTMLElement;
    const container = document.getElementById('latex-preview-container') as HTMLElement;
    const printBtn = document.getElementById('latex-print-btn') as HTMLButtonElement;
    const clearBtn = document.getElementById('clear-latex-btn') as HTMLButtonElement;

    if (!txt || !prev || !container) return;

    // Load MathJax for live preview
    const loadMathJax = () => {
      if ((window as any).MathJax) return Promise.resolve();
      return new Promise<void>((resolve) => {
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-mml-chtml.js';
        script.onload = () => resolve();
        document.head.appendChild(script);
      });
    };

    const fitPreview = () => {
      const targetWidth = 794;
      const availableWidth = container.offsetWidth - 32;
      if (availableWidth < targetWidth) {
        const scale = availableWidth / targetWidth;
        prev.style.transform = `scale(\${scale})`;
        prev.style.height = '1123px';
        container.style.height = `\${(1123 * scale) + 40}px`;
      } else {
        prev.style.transform = 'none';
        container.style.height = 'auto';
        prev.style.height = 'min-content';
      }
    };

    const updatePreview = debounce(() => {
      // Basic formatting to support paragraphs
      let html = txt.value.replace(/\n\n/g, '<br><br>');
      prev.innerHTML = `<style>\${printStyles}</style><div id="math-content">\${html}</div>`;
      fitPreview();
      
      if ((window as any).MathJax) {
        (window as any).MathJax.typesetPromise([document.getElementById('math-content')]);
      }
    }, 300);

    window.addEventListener('resize', fitPreview);

    txt.oninput = updatePreview;

    if (clearBtn) {
      clearBtn.onclick = () => {
        txt.value = '';
        updatePreview();
      };
    }

    loadMathJax().then(() => {
      txt.value = sampleLatex;
      updatePreview();
    });

    if (printBtn) {
      printBtn.onclick = () => {
        const iframe = document.createElement('iframe');
        Object.assign(iframe.style, {
          position: 'fixed', right: '0', bottom: '0', width: '0', height: '0', border: '0'
        });
        document.body.appendChild(iframe);
        
        const doc = iframe.contentWindow?.document;
        if (!doc) return;
        
        let htmlContent = txt.value.replace(/\n\n/g, '<br><br>');
        doc.open();
        doc.write(`
          <!DOCTYPE html>
          <html lang="en">
          <head>
              <meta charset="UTF-8">
              <title>Print Document</title>
              <style>\${printStyles}</style>
              <script src="https://polyfill.io/v3/polyfill.min.js?features=es6"><\/script>
              <script id="MathJax-script" async src="https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-mml-chtml.js"><\/script>
          </head>
          <body>
              <div id="print-content">\${htmlContent}</div>
              <script>
                window.onload = function() {
                  MathJax.typesetPromise().then(function() {
                    window.focus();
                    window.print();
                    setTimeout(() => {
                      window.parent.document.body.removeChild(window.frameElement);
                    }, 2000);
                  });
                };
              <\/script>
          </body>
          </html>
        `);
        doc.close();
      };
    }
  }
};

