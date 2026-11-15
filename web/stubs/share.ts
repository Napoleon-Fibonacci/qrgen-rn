/**
 * Stub share untuk pratinjau web: pakai Web Share API kalau ada, kalau tidak
 * buka data URI di tab baru supaya PNG tetap bisa dilihat.
 */
interface ShareOptions {
  url?: string;
  type?: string;
  filename?: string;
  title?: string;
  failOnCancel?: boolean;
}

async function open(url: string, filename?: string) {
  if (typeof navigator !== 'undefined' && 'share' in navigator) {
    try {
      await (navigator as Navigator & { share: (data: unknown) => Promise<void> }).share({
        title: filename,
        url,
      });
      return { success: true };
    } catch {
      // Jatuh ke cara kedua: buka tab baru.
    }
  }
  const link = document.createElement('a');
  link.href = url;
  link.target = '_blank';
  link.rel = 'noopener';
  if (filename) {
    link.download = filename;
  }
  link.click();
  return { success: true };
}

const Share = {
  open: (options: ShareOptions) => open(options.url ?? '', options.filename),
};

export default Share;
export { Share };
