// Extend Window interface for third-party scripts loaded at runtime via CDN
declare global {
  interface Window {
    PDFLib: any;
    jspdf: any;
    pdfjsLib: any;
    JSZip: any;
    QRious: any;
    SignaturePad: any;
    saveAs: (blob: Blob, name: string) => void;
    confetti: any;
    gsap: any;
  }
}

export function formatBytes(bytes: number, decimals = 2): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

export function loadScript(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) {
      resolve();
      return;
    }
    const script = document.createElement('script');
    script.src = src;
    script.crossOrigin = 'anonymous';
    script.onload = () => resolve();
    script.onerror = () => reject(new Error(`Failed to load script: ${src}`));
    document.head.appendChild(script);
  });
}

// Lazy Load helper hooks
export async function loadPdfLib(): Promise<any> {
  await loadScript('https://unpkg.com/pdf-lib@1.17.1/dist/pdf-lib.min.js');
  return window.PDFLib;
}

export async function loadJsPdf(): Promise<any> {
  await loadScript('https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js');
  return window.jspdf;
}

export async function loadPdfJs(): Promise<any> {
  await loadScript('https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js');
  if (window.pdfjsLib) {
    window.pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
  }
  return window.pdfjsLib;
}

export async function loadJSZip(): Promise<any> {
  await loadScript('https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js');
  return window.JSZip;
}

export async function loadQRious(): Promise<any> {
  await loadScript('https://cdnjs.cloudflare.com/ajax/libs/qrious/4.0.2/qrious.min.js');
  return window.QRious;
}

export async function loadSignaturePad(): Promise<any> {
  await loadScript('https://cdn.jsdelivr.net/npm/signature_pad@4.1.7/dist/signature_pad.umd.min.js');
  return window.SignaturePad;
}

// Debounce helper for input handlers
export function debounce<T extends (...args: any[]) => any>(func: T, wait: number): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout> | null = null;
  return function(this: any, ...args: Parameters<T>) {
    const context = this;
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => {
      func.apply(context, args);
    }, wait);
  };
}
