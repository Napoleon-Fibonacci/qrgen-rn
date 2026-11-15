/** Stub clipboard untuk pratinjau web: pakai Clipboard API browser. */
async function setString(text: string) {
  if (typeof navigator !== 'undefined' && navigator.clipboard) {
    await navigator.clipboard.writeText(text);
    return;
  }
  throw new Error('Clipboard tidak tersedia di browser ini');
}

async function getString() {
  if (typeof navigator !== 'undefined' && navigator.clipboard) {
    return navigator.clipboard.readText();
  }
  return '';
}

const Clipboard = { setString, getString };

export default Clipboard;
export { Clipboard };
