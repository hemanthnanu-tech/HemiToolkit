import { loadQRious, loadMarked } from '../utils';

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
        <div class="flex flex-col md:flex-row gap-6 md:h-[550px] min-h-[500px] animate-fade-in-up">
          <div class="flex-1 flex flex-col min-h-[250px] md:min-h-0">
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
  },

  // --- BASE64 ENCODER / DECODER ---
  'base64-tool': {
    ui(): string {
      return `
        <div class="flex flex-col md:flex-row gap-6 md:h-[500px] min-h-[500px] animate-fade-in-up">
          <div class="flex-1 flex flex-col min-h-[200px] md:min-h-0">
            <div class="flex justify-between items-center mb-2">
              <label class="text-sm font-bold text-[var(--text-secondary)] uppercase tracking-wider">Plain Text</label>
              <button id="b64-clear1" class="text-xs text-red-400 hover:text-red-300 font-semibold transition-colors">Clear</button>
            </div>
            <textarea id="b64-text" class="glass-input flex-1 w-full p-4 rounded-xl font-mono text-sm resize-none" placeholder="Type plain text here..."></textarea>
          </div>
          <div class="flex flex-row md:flex-col justify-center gap-4">
            <button id="b64-enc" class="p-4 rounded-xl bg-indigo-600 text-white hover:bg-indigo-500 hover:scale-110 active:scale-95 transition-all shadow-lg font-bold" title="Encode to Base64"><i class="fa-solid fa-arrow-right md:rotate-0 rotate-90"></i></button>
            <button id="b64-dec" class="p-4 rounded-xl glass-panel hover:bg-white/10 hover:scale-110 active:scale-95 transition-all font-bold" title="Decode from Base64"><i class="fa-solid fa-arrow-left md:rotate-0 rotate-90"></i></button>
          </div>
          <div class="flex-1 flex flex-col">
            <div class="flex justify-between items-center mb-2">
              <label class="text-sm font-bold text-[var(--text-secondary)] uppercase tracking-wider">Base64 String</label>
              <button id="b64-clear2" class="text-xs text-red-400 hover:text-red-300 font-semibold transition-colors">Clear</button>
            </div>
            <textarea id="b64-hash" class="glass-input flex-1 w-full p-4 rounded-xl font-mono text-sm resize-none bg-black/10 dark:bg-black/25" placeholder="Base64 encoded string..."></textarea>
          </div>
        </div>
      `;
    },
    init() {
      const textIn = document.getElementById('b64-text') as HTMLTextAreaElement;
      const hashIn = document.getElementById('b64-hash') as HTMLTextAreaElement;
      const btnEnc = document.getElementById('b64-enc') as HTMLButtonElement;
      const btnDec = document.getElementById('b64-dec') as HTMLButtonElement;

      btnEnc.onclick = () => {
        try { hashIn.value = btoa(textIn.value); } 
        catch (e) { (window as any).Swal.fire({icon:'error', title: 'Encoding Failed', text: 'Invalid characters detected'}); }
      };
      btnDec.onclick = () => {
        try { textIn.value = atob(hashIn.value); } 
        catch (e) { (window as any).Swal.fire({icon:'error', title: 'Decoding Failed', text: 'Invalid Base64 string'}); }
      };
      document.getElementById('b64-clear1')!.onclick = () => textIn.value = '';
      document.getElementById('b64-clear2')!.onclick = () => hashIn.value = '';
    }
  },

  // --- REGEX TESTER ---
  'regex-tester': {
    ui(): string {
      return `
        <div class="max-w-4xl mx-auto space-y-6 animate-fade-in-up">
          <div class="glass-panel p-6 rounded-3xl space-y-4">
            <label class="block text-sm font-bold text-[var(--text-secondary)] uppercase tracking-wider">Regular Expression</label>
            <div class="flex items-center gap-3">
              <span class="text-2xl text-[var(--text-secondary)] font-mono">/</span>
              <input type="text" id="re-pattern" class="glass-input flex-1 p-4 rounded-xl font-mono text-lg text-blue-400" placeholder="[A-Z0-9._%+-]+@[A-Z0-9.-]+\\.[A-Z]{2,}" value="[A-Z0-9._%+-]+@[A-Z0-9.-]+\\.[A-Z]{2,}">
              <span class="text-2xl text-[var(--text-secondary)] font-mono">/</span>
              <input type="text" id="re-flags" class="glass-input w-24 p-4 rounded-xl font-mono text-lg text-fuchsia-400 text-center" placeholder="gi" value="gi">
            </div>
          </div>
          <div class="flex flex-col md:flex-row gap-6">
            <div class="flex-1 space-y-4">
              <label class="block text-sm font-bold text-[var(--text-secondary)] uppercase tracking-wider">Test String</label>
              <textarea id="re-test" class="glass-input w-full h-64 p-4 rounded-xl font-mono text-sm resize-none" placeholder="Enter text to test against the regex..."></textarea>
            </div>
            <div class="flex-1 space-y-4">
              <label class="block text-sm font-bold text-[var(--text-secondary)] uppercase tracking-wider flex justify-between">
                <span>Match Results</span>
                <span id="re-count" class="text-fuchsia-400">0 matches</span>
              </label>
              <div id="re-result" class="glass-panel w-full h-64 p-4 rounded-xl font-mono text-sm overflow-y-auto whitespace-pre-wrap leading-relaxed text-[var(--text-primary)]"></div>
            </div>
          </div>
        </div>
      `;
    },
    init() {
      const pattern = document.getElementById('re-pattern') as HTMLInputElement;
      const flags = document.getElementById('re-flags') as HTMLInputElement;
      const testText = document.getElementById('re-test') as HTMLTextAreaElement;
      const result = document.getElementById('re-result') as HTMLElement;
      const count = document.getElementById('re-count') as HTMLElement;

      const updateMatch = () => {
        if (!pattern.value) {
          result.innerHTML = testText.value;
          count.innerText = '0 matches';
          return;
        }
        try {
          const re = new RegExp(pattern.value, flags.value);
          const txt = testText.value;
          
          if (!re.global) {
             const m = txt.match(re);
             const matchCount = m ? 1 : 0;
             result.innerHTML = txt.replace(re, (match) => `<span class="bg-fuchsia-500/30 text-fuchsia-300 rounded px-1">\${match}</span>`);
             count.innerText = `\${matchCount} matches`;
          } else {
             const matches = txt.match(re);
             const matchCount = matches ? matches.length : 0;
             result.innerHTML = txt.replace(re, (match) => `<span class="bg-fuchsia-500/30 text-fuchsia-300 rounded px-1">\${match}</span>`);
             count.innerText = `\${matchCount} matches`;
          }
        } catch(e: any) {
          result.innerHTML = `<span class="text-red-400">Error: \${e.message}</span>`;
          count.innerText = 'Error';
        }
      };

      [pattern, flags, testText].forEach(el => el.addEventListener('input', updateMatch));
      testText.value = "Test your email addresses:\nhello@world.com\ninvalid-email\ntest.user123@domain.org";
      updateMatch();
    }
  },

  // --- LOREM IPSUM GENERATOR ---
  'lorem-gen': {
    ui(): string {
      return `
        <div class="max-w-4xl mx-auto space-y-6 animate-fade-in-up">
          <div class="glass-panel p-6 rounded-3xl flex flex-wrap gap-6 items-center bg-black/10">
            <div class="flex items-center gap-4">
               <label class="font-bold text-[var(--text-secondary)] uppercase text-xs tracking-wider">Paragraphs</label>
               <input type="number" id="lorem-count" value="3" min="1" max="50" class="glass-input w-24 p-3 rounded-xl font-bold text-center">
            </div>
            <button id="lorem-btn" class="px-6 py-3 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold shadow-lg transition-transform active:scale-95">Generate</button>
            <button id="lorem-copy" class="px-6 py-3 rounded-xl glass-panel hover:bg-white/10 font-bold transition-transform active:scale-95 ml-auto">Copy Text</button>
          </div>
          <textarea id="lorem-out" readonly class="glass-input w-full h-80 p-6 rounded-3xl text-lg leading-relaxed bg-black/5 dark:bg-black/20 resize-none font-serif text-[var(--text-primary)]"></textarea>
        </div>
      `;
    },
    init() {
      const countEl = document.getElementById('lorem-count') as HTMLInputElement;
      const outEl = document.getElementById('lorem-out') as HTMLTextAreaElement;
      
      const words = ["lorem", "ipsum", "dolor", "sit", "amet", "consectetur", "adipiscing", "elit", "sed", "do", "eiusmod", "tempor", "incididunt", "ut", "labore", "et", "dolore", "magna", "aliqua", "enim", "ad", "minim", "veniam", "quis", "nostrud", "exercitation", "ullamco", "laboris", "nisi", "ut", "aliquip", "ex", "ea", "commodo", "consequat", "duis", "aute", "irure", "dolor", "in", "reprehenderit", "in", "voluptate", "velit", "esse", "cillum", "dolore", "eu", "fugiat", "nulla", "pariatur", "excepteur", "sint", "occaecat", "cupidatat", "non", "proident", "sunt", "in", "culpa", "qui", "officia", "deserunt", "mollit", "anim", "id", "est", "laborum"];
      
      const genParagraph = () => {
        let p = "";
        const length = 20 + Math.random() * 30;
        for (let i = 0; i < length; i++) {
          let word = words[Math.floor(Math.random() * words.length)];
          if (i === 0) word = word.charAt(0).toUpperCase() + word.slice(1);
          p += word + (i === length - 1 ? "." : " ");
        }
        return p;
      };

      const generate = () => {
        const pCount = parseInt(countEl.value) || 1;
        let text = "";
        for (let i = 0; i < pCount; i++) text += genParagraph() + (i < pCount - 1 ? "\n\n" : "");
        outEl.value = text;
      };

      document.getElementById('lorem-btn')!.onclick = generate;
      document.getElementById('lorem-copy')!.onclick = () => {
        navigator.clipboard.writeText(outEl.value).then(() => {
          (window as any).Swal.fire({icon:'success', title: 'Copied', text: 'Lorem Ipsum copied to clipboard', timer: 1500, showConfirmButton: false});
        });
      };
      
      generate();
    }
  },

  // --- MARKDOWN PREVIEW ---
  'markdown-view': {
    ui(): string {
      return `
        <div class="flex flex-col md:flex-row gap-6 md:h-[600px] min-h-[600px] animate-fade-in-up">
          <div class="flex-1 flex flex-col space-y-2 min-h-[250px] md:min-h-0">
             <label class="text-sm font-bold text-[var(--text-secondary)] uppercase tracking-wider">Markdown Editor</label>
             <textarea id="md-in" class="glass-input flex-1 p-6 rounded-2xl font-mono text-sm resize-none border-transparent focus:border-sky-500" placeholder="# Hello World\n\nWrite your **markdown** here..."></textarea>
          </div>
          <div class="flex-1 flex flex-col space-y-2">
             <label class="text-sm font-bold text-[var(--text-secondary)] uppercase tracking-wider">Live Preview</label>
             <div id="md-out" class="glass-panel flex-1 p-8 rounded-2xl overflow-y-auto bg-white dark:bg-zinc-900 text-black dark:text-white prose prose-blue max-w-none shadow-inner border border-zinc-200 dark:border-zinc-800"></div>
          </div>
        </div>
      `;
    },
    init() {
      loadMarked().then(() => {
        const mdIn = document.getElementById('md-in') as HTMLTextAreaElement;
        const mdOut = document.getElementById('md-out') as HTMLElement;
        
        const renderMD = () => {
          if (window.marked) {
            mdOut.innerHTML = window.marked.parse(mdIn.value || '# Title\n\nStart typing...');
          }
        };
        
        mdIn.addEventListener('input', renderMD);
        mdIn.value = "# Welcome to Markdown\n\n- Write **bold** text\n- Create [links](https://hemanthnanu-tech.github.io/HemiToolkit)\n- Add code blocks:\n\n```js\nconsole.log('Hello World');\n```";
        renderMD();
      });
    }
  },

  // --- TEXT DIFF CHECKER ---
  'text-diff': {
    ui(): string {
      return `
        <div class="max-w-6xl mx-auto flex flex-col md:h-[600px] min-h-[600px] animate-fade-in-up space-y-6">
          <div class="flex gap-6 h-1/2 flex-col md:flex-row">
            <textarea id="diff-1" class="glass-input flex-1 p-4 rounded-xl resize-none text-sm font-mono min-h-[150px] md:min-h-0" placeholder="Original Text..."></textarea>
            <textarea id="diff-2" class="glass-input flex-1 p-4 rounded-xl resize-none text-sm font-mono min-h-[150px] md:min-h-0" placeholder="Modified Text..."></textarea>
          </div>
          <div class="flex justify-center">
             <button id="btn-diff" class="px-8 py-3 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold shadow-lg shadow-rose-500/20 active:scale-95 transition-all cursor-pointer">Compare Texts</button>
          </div>
          <div class="glass-panel flex-1 p-6 rounded-xl overflow-y-auto font-mono text-sm whitespace-pre-wrap flex gap-6" id="diff-out"></div>
        </div>
      `;
    },
    init() {
      const t1 = document.getElementById('diff-1') as HTMLTextAreaElement;
      const t2 = document.getElementById('diff-2') as HTMLTextAreaElement;
      const btn = document.getElementById('btn-diff') as HTMLButtonElement;
      const out = document.getElementById('diff-out') as HTMLElement;

      btn.onclick = () => {
        // Very simple diff side-by-side rendering
        if (t1.value === t2.value) {
           out.innerHTML = '<div class="w-full text-center text-green-500 font-bold p-10 text-xl">Files are identical.</div>';
           return;
        }

        out.innerHTML = `
            <div class="flex-1 p-4 rounded bg-red-500/5 border border-red-500/20 text-[var(--text-primary)] relative">
                <div class="absolute top-0 right-0 bg-red-500 text-white text-xs px-2 py-1 rounded-bl">Original</div>
                \${t1.value.replace(/</g, '&lt;')}
            </div>
            <div class="flex-1 p-4 rounded bg-green-500/5 border border-green-500/20 text-[var(--text-primary)] relative">
                <div class="absolute top-0 right-0 bg-green-500 text-white text-xs px-2 py-1 rounded-bl">Modified</div>
                \${t2.value.replace(/</g, '&lt;')}
            </div>`;
      };
      
      t1.value = "function hello() {\n  console.log('world');\n}";
      t2.value = "function hello() {\n  console.log('Hemi Toolkit');\n}";
    }
  }
};


