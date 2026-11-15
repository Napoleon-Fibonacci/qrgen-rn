import { isOpenable, linkSafety, safetyLabel } from '../src/safety';

describe('linkSafety', () => {
  it('mengembalikan null untuk teks biasa', () => {
    expect(linkSafety('halo dunia')).toBeNull();
    expect(linkSafety('')).toBeNull();
  });

  it('menandai HTTPS wajar sebagai aman', () => {
    expect(linkSafety('https://sekolah.id/absensi')?.level).toBe('ok');
  });

  it('menandai HTTP tanpa enkripsi sebagai waspada', () => {
    const safety = linkSafety('http://sekolah.id');
    expect(safety?.level).toBe('warn');
    expect(safety?.why).toContain('Tanpa enkripsi (HTTP)');
  });

  it('menandai skrip langsung sebagai bahaya', () => {
    // eslint-disable-next-line no-script-url
    expect(linkSafety('javascript:alert(1)')?.level).toBe('bad');
    expect(linkSafety('data:text/html,halo')?.level).toBe('bad');
  });

  it('menganggap mailto dan tel aman', () => {
    expect(linkSafety('mailto:budi@sekolah.id')?.level).toBe('ok');
    expect(linkSafety('tel:+628123456789')?.level).toBe('ok');
  });

  it('mendeteksi pemendek link', () => {
    const safety = linkSafety('https://bit.ly/abc');
    expect(safety?.level).toBe('warn');
    expect(safety?.why).toContain('Pemendek link, tujuan asli disembunyikan');
  });

  it('mendeteksi alamat IP', () => {
    const safety = linkSafety('https://192.168.1.1/admin');
    expect(safety?.level).toBe('warn');
    expect(safety?.why).toContain('Pakai alamat IP, bukan nama domain');
  });

  it('domain tanpa titik dianggap waspada', () => {
    const safety = linkSafety('https://localhost:3000');
    expect(safety?.level).toBe('warn');
    expect(safety?.why).toContain('Tanpa domain (.id dll)');
  });
});

describe('safetyLabel', () => {
  it('memetakan level ke label Indonesia', () => {
    expect(safetyLabel(null)).toBe('Aman');
    expect(safetyLabel({ level: 'ok', why: [] })).toBe('Aman');
    expect(safetyLabel({ level: 'warn', why: [] })).toBe('Waspada');
    expect(safetyLabel({ level: 'bad', why: [] })).toBe('Bahaya');
  });
});

describe('isOpenable', () => {
  it('hanya http dan https', () => {
    expect(isOpenable('https://sekolah.id')).toBe(true);
    expect(isOpenable('http://sekolah.id')).toBe(true);
    // eslint-disable-next-line no-script-url
    expect(isOpenable('javascript:alert(1)')).toBe(false);
    expect(isOpenable('WIFI:T:WPA;S:Kelas;;')).toBe(false);
  });
});
