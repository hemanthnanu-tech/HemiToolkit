import { loadQRious } from '../utils';

function notifySuccess(title: string, desc: string) {
  (window as any).Swal.fire({
    icon: 'success',
    title: title,
    text: desc,
    timer: 1500,
    showConfirmButton: false
  });
}

export const utilityTools = {
  // --- SECURE PASSWORD / KEY GENERATOR ---
  'pass-gen': {
    ui(): string {
      return `
        <div class="max-w-2xl mx-auto space-y-8 py-4 animate-fade-in-up select-none">
          <div class="relative group">
            <input type="text" id="pass-out" readonly class="glass-input w-full p-6 text-3xl font-mono text-center rounded-2xl text-blue-500 focus:ring-0 select-all border border-[var(--glass-border)] bg-black/10 dark:bg-black/25" value="">
            <button id="btn-copy" class="absolute right-6 top-1/2 -translate-y-1/2 p-2 text-[var(--text-secondary)] hover:text-blue-500 transition-colors cursor-pointer" title="Copy password">
              <i class="fa-solid fa-copy text-2xl"></i>
            </button>
          </div>
          <div class="glass-panel p-8 rounded-3xl space-y-8 bg-black/15">
            <div>
              <div class="flex justify-between mb-4">
                <label class="font-bold text-[var(--text-secondary)] uppercase text-xs tracking-wider">Password Length</label>
                <span id="len-val" class="text-blue-500 font-mono text-xl font-bold">16</span>
              </div>
              <input type="range" id="pass-len" min="8" max="64" value="16" class="w-full accent-blue-500 h-2 bg-gray-700/50 rounded-lg appearance-none cursor-pointer">
            </div>
            
            <div class="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4 border-t border-[var(--glass-border)]">
              <label class="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" id="inc-upper" checked class="w-5 h-5 accent-blue-500 rounded border-gray-700 bg-gray-800 text-blue-500">
                <span class="text-sm font-semibold text-[var(--text-primary)]">Capital Letters</span>
              </label>
              <label class="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" id="inc-num" checked class="w-5 h-5 accent-blue-500 rounded border-gray-700 bg-gray-800 text-blue-500">
                <span class="text-sm font-semibold text-[var(--text-primary)]">Numbers (0-9)</span>
              </label>
              <label class="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" id="inc-sym" checked class="w-5 h-5 accent-blue-500 rounded border-gray-700 bg-gray-800 text-blue-500">
                <span class="text-sm font-semibold text-[var(--text-primary)]">Special Symbols</span>
              </label>
            </div>

            <button id="btn-gen" class="w-full py-5 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xl hover:scale-[1.02] transition-all shadow-xl shadow-blue-500/10 cursor-pointer">Generate Key</button>
          </div>
        </div>`;
    },
    init() {
      const lenSlider = document.getElementById('pass-len') as HTMLInputElement;
      const lenVal = document.getElementById('len-val') as HTMLElement;
      const incUpper = document.getElementById('inc-upper') as HTMLInputElement;
      const incNum = document.getElementById('inc-num') as HTMLInputElement;
      const incSym = document.getElementById('inc-sym') as HTMLInputElement;
      const passOutput = document.getElementById('pass-out') as HTMLInputElement;
      const generateBtn = document.getElementById('btn-gen') as HTMLButtonElement;
      const copyBtn = document.getElementById('btn-copy') as HTMLButtonElement;

      const triggerGenerate = () => {
        const length = parseInt(lenSlider.value);
        lenVal.innerText = length.toString();
        
        let chars = 'abcdefghijklmnopqrstuvwxyz';
        if (incUpper && incUpper.checked) {
          chars += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        }
        if (incNum && incNum.checked) {
          chars += '0123456789';
        }
        if (incSym && incSym.checked) {
          chars += '!@#$%^&*()_+-=[]{}|;:,.<>?';
        }

        let password = '';
        for (let k = 0; k < length; k++) {
          password += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        if (passOutput) {
          passOutput.value = password;
        }
      };

      if (lenSlider) {
        lenSlider.oninput = triggerGenerate;
      }
      [incUpper, incNum, incSym].forEach(chk => {
        if (chk) chk.onchange = triggerGenerate;
      });

      if (generateBtn) {
        generateBtn.onclick = triggerGenerate;
      }

      if (copyBtn) {
        copyBtn.onclick = () => {
          if (passOutput && passOutput.value) {
            navigator.clipboard.writeText(passOutput.value).then(() => {
              notifySuccess('Copied to Clipboard', 'Your secure password has been saved.');
            });
          }
        };
      }

      // Generate starting value
      triggerGenerate();
    }
  },

  // --- QR CODE GENERATION ENGINE ---
  'qr-gen': {
    ui(): string {
      return `
        <div class="flex flex-col lg:flex-row gap-10 animate-fade-in-up">
          <div class="w-full lg:w-1/3 space-y-8 glass-panel p-8 rounded-3xl bg-black/10 dark:bg-black/25 flex flex-col justify-between">
            <div class="space-y-6">
              <div>
                <label class="block text-sm font-bold text-[var(--text-secondary)] mb-3" for="qr-text">QR Content / link</label>
                <input type="text" id="qr-text" value="https://hemanthnanu-tech.github.io/HemiToolkit/" class="glass-input w-full p-4 rounded-xl text-[var(--text-primary)]">
              </div>
              <div class="grid grid-cols-2 gap-6">
                <div>
                  <label class="block text-sm font-bold text-[var(--text-secondary)] mb-2" for="qr-fg">Fill Color</label>
                  <input type="color" id="qr-fg" value="#3b82f6" class="w-full h-12 rounded-xl cursor-pointer bg-transparent border-0">
                </div>
                <div>
                  <label class="block text-sm font-bold text-[var(--text-secondary)] mb-2" for="qr-bg">Bg Color</label>
                  <input type="color" id="qr-bg" value="#ffffff" class="w-full h-12 rounded-xl cursor-pointer bg-transparent border-0">
                </div>
              </div>
            </div>
            <button id="btn-dl" class="w-full py-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold shadow-lg shadow-blue-500/15 cursor-pointer mt-8">Download PNG</button>
          </div>
          <div class="flex-1 bg-white/80 dark:bg-white rounded-3xl flex items-center justify-center p-12 shadow-inner border border-slate-200 min-h-[400px]">
            <canvas id="qr-canvas" class="relative z-10 transition-transform duration-300 hover:scale-105"></canvas>
          </div>
        </div>`;
    },
    async init() {
      await loadQRious();
      const txtInput = document.getElementById('qr-text') as HTMLInputElement;
      const fgInput = document.getElementById('qr-fg') as HTMLInputElement;
      const bgInput = document.getElementById('qr-bg') as HTMLInputElement;
      const canvas = document.getElementById('qr-canvas') as HTMLCanvasElement;
      const dlBtn = document.getElementById('btn-dl') as HTMLButtonElement;

      let qrInstance: any = null;

      const renderQR = () => {
        if (!canvas) return;
        qrInstance = new window.QRious({
          element: canvas,
          value: txtInput.value || 'https://hemanthnanu-tech.github.io/HemiToolkit/',
          size: 280,
          background: bgInput.value,
          foreground: fgInput.value,
          level: 'H' // High corrective recovery density
        });
      };

      [txtInput, fgInput, bgInput].forEach(inp => {
        if (inp) inp.oninput = renderQR;
      });

      // Render starting value
      renderQR();

      if (dlBtn) {
        dlBtn.onclick = () => {
          if (!canvas) return;
          const anchor = document.createElement('a');
          anchor.href = canvas.toDataURL('image/png');
          anchor.download = 'hemi_toolkit_qr.png';
          anchor.click();
        };
      }
    },
    render() {
      // Refresh event emitter if color theme toggles
      const txt = document.getElementById('qr-text');
      if (txt) {
        txt.dispatchEvent(new Event('input'));
      }
    }
  },

  // --- COELOR PALETTE PICKER ---
  'color-tool': {
    ui(): string {
      return `
        <div class="max-w-4xl mx-auto grid md:grid-cols-2 gap-8 animate-fade-in-up">
          <div class="glass-panel p-8 rounded-3xl space-y-6 bg-black/10 dark:bg-black/25">
            <label class="block text-sm font-bold text-[var(--text-secondary)] uppercase tracking-wider" for="color-input">Select Spectrum</label>
            <input type="color" id="color-input" value="#0ea5e9" class="w-full h-40 rounded-2xl cursor-pointer bg-transparent border-0">
            <div id="color-preview" class="h-16 w-full rounded-2xl shadow-inner border border-white/10 transition-colors duration-200"></div>
          </div>
          <div class="space-y-6 flex flex-col justify-center">
            <div>
              <label class="block text-xs font-bold text-[var(--text-secondary)] uppercase mb-2" for="val-hex">HEX String</label>
              <div class="relative">
                <input id="val-hex" class="glass-input w-full p-4 rounded-xl text-[var(--text-primary)] font-mono font-bold" readonly value="#0ea5e9">
                <button onclick="navigator.clipboard.writeText(document.getElementById('val-hex').value); Swal.fire({title: 'Copied Hex', icon: 'success', timer: 1000, showConfirmButton: false})" class="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-blue-500 hover:text-blue-400 font-semibold cursor-pointer">Copy</button>
              </div>
            </div>
            <div>
              <label class="block text-xs font-bold text-[var(--text-secondary)] uppercase mb-2" for="val-rgb">RGB Values</label>
              <div class="relative">
                <input id="val-rgb" class="glass-input w-full p-4 rounded-xl text-[var(--text-primary)] font-mono font-bold" readonly value="rgb(14, 165, 233)">
                <button onclick="navigator.clipboard.writeText(document.getElementById('val-rgb').value); Swal.fire({title: 'Copied RGB', icon: 'success', timer: 1000, showConfirmButton: false})" class="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-blue-500 hover:text-blue-400 font-semibold cursor-pointer">Copy</button>
              </div>
            </div>
          </div>
        </div>`;
    },
    init() {
      const picker = document.getElementById('color-input') as HTMLInputElement;
      const preview = document.getElementById('color-preview') as HTMLElement;
      const hexText = document.getElementById('val-hex') as HTMLInputElement;
      const rgbText = document.getElementById('val-rgb') as HTMLInputElement;

      if (!picker) return;

      const runUpdate = () => {
        const val = picker.value;
        if (preview) {
          preview.style.backgroundColor = val;
        }
        if (hexText) {
          hexText.value = val;
        }
        
        const r = parseInt(val.substring(1, 3), 16);
        const g = parseInt(val.substring(3, 5), 16);
        const b = parseInt(val.substring(5, 7), 16);
        if (rgbText) {
          rgbText.value = `rgb(${r}, ${g}, ${b})`;
        }
      };

      picker.oninput = runUpdate;
      // Trigger starting values
      runUpdate();
    }
  },

  // --- JSON FORMATTER AND COMPRESSOR ---
  'json-fmt': {
    ui(): string {
      return `
        <div class="flex flex-col md:flex-row gap-6 h-[550px] animate-fade-in-up">
          <div class="flex-1 flex flex-col">
            <div class="flex justify-between items-center mb-2">
              <label class="text-sm font-bold text-[var(--text-secondary)] uppercase tracking-wider" for="json-in">Raw JSON Input</label>
              <button id="clear-json" class="text-xs text-red-400 hover:text-red-300 transition-colors font-semibold select-none">Clear</button>
            </div>
            <textarea id="json-in" class="glass-input flex-1 w-full p-4 rounded-xl font-mono text-sm resize-none text-[var(--text-primary)] border-transparent focus:border-blue-500" placeholder="Paste unformatted JSON structure here..."></textarea>
          </div>
          
          <div class="flex flex-row md:flex-col justify-center gap-4">
            <button id="btn-format" class="p-4 rounded-xl bg-blue-600 text-white hover:scale-110 active:scale-95 transition-all shadow-lg hover:bg-blue-500 font-bold block cursor-pointer" title="Beautify JSON"><i class="fa-solid fa-indent text-lg"></i></button>
            <button id="btn-minify" class="p-4 rounded-xl glass-panel text-[var(--text-primary)] hover:bg-white/10 hover:scale-110 active:scale-95 transition-all font-bold block cursor-pointer" title="Minify JSON"><i class="fa-solid fa-compress text-lg"></i></button>
          </div>

          <div class="flex-1 flex flex-col">
            <div class="flex justify-between items-center mb-2">
              <label class="text-sm font-bold text-[var(--text-secondary)] uppercase tracking-wider" for="json-out">Formatted Output</label>
              <button id="copy-json" class="text-xs text-blue-400 hover:text-blue-300 transition-colors font-semibold select-none">Copy Output</button>
            </div>
            <textarea id="json-out" class="glass-input flex-1 w-full p-4 rounded-xl font-mono text-sm resize-none bg-black/10 dark:bg-black/25 text-[var(--text-primary)] border-transparent" readonly placeholder="Output compiles here..."></textarea>
          </div>
        </div>`;
    },
    init() {
      const input = document.getElementById('json-in') as HTMLTextAreaElement;
      const output = document.getElementById('json-out') as HTMLTextAreaElement;
      const beautifyBtn = document.getElementById('btn-format') as HTMLButtonElement;
      const minifyBtn = document.getElementById('btn-minify') as HTMLButtonElement;
      const clearBtn = document.getElementById('clear-json') as HTMLButtonElement;
      const copyBtn = document.getElementById('copy-json') as HTMLButtonElement;

      beautifyBtn.onclick = () => {
        try {
          if (!input.value.trim()) return;
          const parsed = JSON.parse(input.value);
          output.value = JSON.stringify(parsed, null, 4);
        } catch (e: any) {
          output.value = 'Parser Exception: ' + e.message;
        }
      };

      minifyBtn.onclick = () => {
        try {
          if (!input.value.trim()) return;
          const parsed = JSON.parse(input.value);
          output.value = JSON.stringify(parsed);
        } catch (e: any) {
          output.value = 'Parser Exception: ' + e.message;
        }
      };

      if (clearBtn) {
        clearBtn.onclick = () => {
          input.value = '';
          output.value = '';
        };
      }

      if (copyBtn) {
        copyBtn.onclick = () => {
          if (output.value && !output.value.startsWith('Parser Exception:')) {
            navigator.clipboard.writeText(output.value).then(() => {
              notifySuccess('Copied to Clipboard', 'JSON data saved.');
            });
          }
        };
      }
    }
  }
};
