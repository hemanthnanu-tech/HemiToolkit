import { debounce } from '../utils';

// Shared internal styles for a4 prints
export const printStyles = `
  @page { size: A4; margin: 0; }
  body { 
    font-family: 'Inter', system-ui, -apple-system, sans-serif !important; 
    margin: 20mm; 
    color: #111;
    line-height: 1.5;
  }
  table { width: 100%; border-collapse: collapse; margin-top: 15px; margin-bottom: 15px; }
  th, td { border: 1px solid #e2e8f0; padding: 10px; text-align: left; }
  th { background-color: #f8fafc; font-weight: 600; }
  h1 { font-size: 28px; font-weight: 700; margin-bottom: 10px; color: #0f172a; }
  h2 { font-size: 20px; font-weight: 600; margin-bottom: 8px; color: #1e293b; }
  p { margin-bottom: 10px; color: #475569; }
  .text-right { text-align: right; }
  .badge { display: inline-block; padding: 4px 10px; border-radius: 9999px; font-size: 11px; font-weight: 600; text-transform: uppercase; }
  .badge-success { background-color: #dcfce7; color: #15803d; }
`;

const sampleEnglishTemplate = `<!-- Modern Professional Invoice Template -->
<div class="space-y-6">
  <div style="display: flex; justify-content: space-between; align-items: start; border-bottom: 2px solid #e2e8f0; padding-bottom: 20px;">
    <div>
      <h1>HemiTech Solutions</h1>
      <p style="margin: 0;">100 Innovation Way, Suite 400</p>
      <p style="margin: 0;">San Francisco, CA 94105</p>
    </div>
    <div style="text-align: right;">
      <h2 style="color: #2563eb; font-size: 24px; margin-top: 0;">INVOICE</h2>
      <p style="margin: 0;"><strong>Invoice #:</strong> INV-2026-0042</p>
      <p style="margin: 0;"><strong>Date:</strong> June 18, 2026</p>
      <span class="badge badge-success">Paid</span>
    </div>
  </div>

  <div style="display: flex; gap: 40px; margin-top: 20px;">
    <div style="flex: 1;">
      <h3 style="font-size: 14px; text-transform: uppercase; color: #64748b; margin-bottom: 8px;">Billed To</h3>
      <p><strong>Acme Corporation</strong><br>
      Attn: Accounts Payable<br>
      500 Enterprise Blvd<br>
      New York, NY 10001</p>
    </div>
    <div style="flex: 1;">
      <h3 style="font-size: 14px; text-transform: uppercase; color: #64748b; margin-bottom: 8px;">Payment Details</h3>
      <p>Method: Credit Card (Ending in 4242)<br>
      Transaction ID: tx_98127391238<br>
      Processor: Stripe Checkout</p>
    </div>
  </div>

  <table>
    <thead>
      <tr>
        <th>Description</th>
        <th class="text-right" style="width: 100px;">Qty</th>
        <th class="text-right" style="width: 120px;">Unit Price</th>
        <th class="text-right" style="width: 120px;">Total</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>
          <strong>Enterprise Cloud Subscription (Annual)</strong><br>
          <span style="font-size: 12px; color: #64748b;">Unlimited team members, advanced workspace collaboration elements, 500GB storage.</span>
        </td>
        <td class="text-right">1</td>
        <td class="text-right">$1,200.00</td>
        <td class="text-right">$1,200.00</td>
      </tr>
      <tr>
        <td>
          <strong>Priority VIP Support Hook</strong><br>
          <span style="font-size: 12px; color: #64748b;">24/7 designated engineer phone support line, 1-hour SLA guarantees.</span>
        </td>
        <td class="text-right">1</td>
        <td class="text-right">$350.00</td>
        <td class="text-right">$350.00</td>
      </tr>
    </tbody>
  </table>

  <div style="display: flex; justify-content: flex-end; margin-top: 30px;">
    <div style="width: 300px;">
      <div style="display: flex; justify-content: space-between; padding: 6px 0; border-bottom: 1px dashed #e2e8f0;">
        <span>Subtotal:</span>
        <span>$1,550.00</span>
      </div>
      <div style="display: flex; justify-content: space-between; padding: 6px 0; border-bottom: 1px dashed #e2e8f0;">
        <span>Tax (0%):</span>
        <span>$0.00</span>
      </div>
      <div style="display: flex; justify-content: space-between; padding: 10px 0; font-size: 18px; font-weight: 700; color: #0f172a;">
        <span>Grand Total:</span>
        <span style="color: #2563eb;">$1,550.00</span>
      </div>
    </div>
  </div>

  <div style="margin-top: 60px; border-top: 1px solid #e2e8f0; padding-top: 15px; text-align: center; font-size: 12px; color: #64748b;">
    <p>Thank you for choosing HemiTech Solutions. For billing inquiries, email billing@hemitech.com</p>
  </div>
</div>`;

export const htmlToPdfTool = {
  renderUI(): string {
    return `
      <div class="flex flex-col lg:flex-row gap-8 min-h-[700px] h-auto animate-fade-in-up">
        <div class="flex-1 flex flex-col h-[400px] lg:h-auto glass-panel p-4 rounded-2xl relative bg-black/10 dark:bg-black/25">
          <div class="flex justify-between items-center mb-4">
            <label class="text-sm font-bold text-[var(--text-secondary)] uppercase tracking-wider">HTML Input code</label>
            <div class="flex gap-2">
              <div id="render-status" class="hidden items-center gap-2 text-xs text-blue-400 font-medium bg-blue-500/10 px-2.5 py-1 rounded-lg">
                <div class="loader !w-3 !h-3 !border-2"></div> Rendering...
              </div>
              <button id="clear-html-btn" class="text-xs text-red-400 hover:text-red-300 px-2 py-1 select-none font-medium transition-colors">Clear</button>
              <button id="insert-sample" class="text-xs bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 px-2.5 py-1 rounded font-semibold transition-colors">Load Template</button>
            </div>
          </div>
          <textarea id="html-in" class="glass-input flex-1 w-full p-4 rounded-xl font-mono text-sm resize-none text-[var(--text-primary)] border-transparent focus:border-blue-500 transition-colors" 
          placeholder="Type or paste custom markup here..."></textarea>
        </div>
        
        <div class="flex flex-col justify-center items-center gap-3 py-4 lg:py-0">
          <button id="print-action-btn" class="w-16 h-16 rounded-2xl bg-gradient-to-br from-orange-500 to-red-600 hover:from-orange-400 hover:to-red-500 text-white font-bold shadow-2xl shadow-orange-500/20 transition-all hover:scale-105 active:scale-95 flex items-center justify-center cursor-pointer">
            <i class="fa-solid fa-print text-2xl"></i>
          </button>
          <span class="text-[10px] text-center text-[var(--text-secondary)] uppercase font-extrabold tracking-widest select-none">Send to PDF</span>
        </div>

        <div class="flex-1 flex flex-col h-auto glass-panel p-4 rounded-2xl overflow-hidden bg-black/10 dark:bg-black/25">
          <label class="text-sm font-bold text-[var(--text-secondary)] mb-4 uppercase tracking-wider block">
            <span>A4 Print Simulation</span>
          </label>
          <div id="preview-container" class="flex-1 bg-gray-200/50 dark:bg-gray-900/40 rounded-xl overflow-hidden border border-[var(--glass-border)] relative p-4 flex justify-center backdrop-blur-sm min-h-[500px]">
            <div id="preview-area" class="a4-preview shadow-2xl bg-white text-black transition-transform duration-200"></div>
          </div>
        </div>
      </div>`;
  },

  init(): void {
    const txt = document.getElementById('html-in') as HTMLTextAreaElement;
    const prev = document.getElementById('preview-area') as HTMLElement;
    const status = document.getElementById('render-status') as HTMLElement;
    const container = document.getElementById('preview-container') as HTMLElement;
    const printBtn = document.getElementById('print-action-btn') as HTMLButtonElement;
    const clearBtn = document.getElementById('clear-html-btn') as HTMLButtonElement;
    const loadSampleBtn = document.getElementById('insert-sample') as HTMLButtonElement;

    if (!txt || !prev || !status || !container) return;

    const fitPreview = () => {
      const targetWidth = 794; // Standard A4 pixel width at 96 PPI
      const availableWidth = container.offsetWidth - 32;
      if (availableWidth < targetWidth) {
        const scale = availableWidth / targetWidth;
        prev.style.transform = `scale(${scale})`;
        prev.style.height = '1123px'; // Fix page ratio
        container.style.height = `${(1123 * scale) + 40}px`;
      } else {
        prev.style.transform = 'none';
        container.style.height = 'auto';
        prev.style.height = 'min-content';
      }
    };

    const updatePreview = debounce(() => {
      prev.innerHTML = `<style>${printStyles}</style>${txt.value}`;
      status.classList.add('hidden');
      status.classList.remove('flex');
      fitPreview();
    }, 300);

    window.addEventListener('resize', fitPreview);

    txt.oninput = () => {
      status.classList.remove('hidden');
      status.classList.add('flex');
      updatePreview();
    };

    if (clearBtn) {
      clearBtn.onclick = () => {
        txt.value = '';
        txt.dispatchEvent(new Event('input'));
      };
    }

    if (loadSampleBtn) {
      loadSampleBtn.onclick = () => {
        txt.value = sampleEnglishTemplate;
        txt.dispatchEvent(new Event('input'));
      };
    }

    // Trigger initial state
    txt.value = sampleEnglishTemplate;
    txt.dispatchEvent(new Event('input'));

    if (printBtn) {
      printBtn.onclick = () => {
        const iframe = document.createElement('iframe');
        Object.assign(iframe.style, {
          position: 'fixed',
          right: '0',
          bottom: '0',
          width: '0',
          height: '0',
          border: '0'
        });
        document.body.appendChild(iframe);
        
        const doc = iframe.contentWindow?.document;
        if (!doc) return;
        
        doc.open();
        doc.write(`
          <!DOCTYPE html>
          <html lang="en">
          <head>
              <meta charset="UTF-8">
              <title>Print Document</title>
              <link rel="preconnect" href="https://fonts.googleapis.com">
              <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
              <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;700&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" crossorigin="anonymous">
              <script src="https://cdn.tailwindcss.com"><\/script>
              <style>${printStyles}</style>
          </head>
          <body>
              ${txt.value}
          </body>
          </html>
        `);
        doc.close();

        iframe.onload = () => {
          const win = iframe.contentWindow;
          if (!win) return;
          
          win.document.fonts.ready.then(() => {
            setTimeout(() => {
              win.focus();
              win.print();
              setTimeout(() => {
                document.body.removeChild(iframe);
              }, 2000);
            }, 150);
          });
        };
      };
    }
  }
};
