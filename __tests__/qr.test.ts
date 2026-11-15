import {
  buildPayload,
  contrastAgainstWhite,
  escVcf,
  escWifi,
  fileName,
  normalizeUrl,
  slugify,
  vcardString,
  wifiString,
  type QrForm,
} from '../src/qr';

function emptyForm(): QrForm {
  return {
    url: '',
    text: '',
    wifi: { ssid: '', password: '', enc: 'WPA', hidden: false },
    contact: { name: '', tel: '', email: '', title: '' },
  };
}

describe('wifiString', () => {
  it('menulis WPA dengan password', () => {
    expect(
      wifiString({ ssid: 'Kelas 7A', password: 'rahasia', enc: 'WPA', hidden: false }),
    ).toBe('WIFI:T:WPA;S:Kelas 7A;P:rahasia;;');
  });

  it('tidak menulis P untuk nopass', () => {
    expect(
      wifiString({ ssid: 'Tamu', password: 'diabaikan', enc: 'nopass', hidden: false }),
    ).toBe('WIFI:T:nopass;S:Tamu;;');
  });

  it('menulis H:true untuk jaringan tersembunyi', () => {
    expect(
      wifiString({ ssid: 'Tamu', password: '', enc: 'WEP', hidden: true }),
    ).toBe('WIFI:T:WEP;S:Tamu;H:true;;');
  });

  it('escape karakter khusus di ssid dan password', () => {
    expect(escWifi('a;b,c:d"e\\f')).toBe('a\\;b\\,c\\:d\\"e\\\\f');
    expect(
      wifiString({ ssid: 'a;b', password: 'p:w', enc: 'WPA', hidden: false }),
    ).toBe('WIFI:T:WPA;S:a\\;b;P:p\\:w;;');
  });
});

describe('vcardString', () => {
  it('menulis vCard 3.0 lengkap', () => {
    const vcf = vcardString({
      name: 'Budi Santoso',
      tel: '08123456789',
      email: 'budi@sekolah.id',
      title: 'Guru',
    });
    expect(vcf).toBe(
      [
        'BEGIN:VCARD',
        'VERSION:3.0',
        'N:Budi Santoso',
        'FN:Budi Santoso',
        'TEL;TYPE=CELL:08123456789',
        'EMAIL:budi@sekolah.id',
        'TITLE:Guru',
        'END:VCARD',
      ].join('\n'),
    );
  });

  it('melewati field opsional yang kosong', () => {
    expect(vcardString({ name: 'Ani', tel: '', email: '', title: '' })).toBe(
      ['BEGIN:VCARD', 'VERSION:3.0', 'N:Ani', 'FN:Ani', 'END:VCARD'].join('\n'),
    );
  });

  it('escape backslash, koma, titik koma, dan newline', () => {
    expect(escVcf('a\\b,c;d\ne')).toBe('a\\\\b\\,c\\;d\\ne');
    expect(escVcf('baris1\r\nbaris2')).toBe('baris1\\nbaris2');
  });
});

describe('normalizeUrl', () => {
  it('menambah https:// kalau tidak ada skema', () => {
    expect(normalizeUrl('sekolah.id')).toBe('https://sekolah.id');
    expect(normalizeUrl('  sekolah.id/path  ')).toBe('https://sekolah.id/path');
  });

  it('membiarkan skema yang sudah ada', () => {
    expect(normalizeUrl('http://sekolah.id')).toBe('http://sekolah.id');
    expect(normalizeUrl('mailto:a@b.c')).toBe('mailto:a@b.c');
  });

  it('mengembalikan string kosong untuk input kosong', () => {
    expect(normalizeUrl('   ')).toBe('');
  });
});

describe('slugify dan fileName', () => {
  it('mengambil maksimal tiga kata', () => {
    expect(slugify('Budi Santoso, S.Pd.')).toBe('budi-santoso-s');
    expect(slugify('Satu Dua Tiga Empat')).toBe('satu-dua-tiga');
    expect(slugify('!!!')).toBe('qr');
    expect(slugify('')).toBe('qr');
  });

  it('menyusun nama file dengan tanggal', () => {
    expect(
      fileName({ type: 'wifi', label: 'Kelas 7A', ext: 'png', now: new Date('2026-11-15T10:00:00Z') }),
    ).toBe('qr-wifi-kelas-7a-2026-11-15.png');
  });
});

describe('contrastAgainstWhite', () => {
  it('hitam pekat bernilai 21', () => {
    expect(contrastAgainstWhite('#000000')).toBeCloseTo(21, 5);
  });

  it('putih bernilai 1', () => {
    expect(contrastAgainstWhite('#ffffff')).toBeCloseTo(1, 5);
  });

  it('hex tidak valid dianggap aman', () => {
    expect(contrastAgainstWhite('bukan-warna')).toBe(21);
  });
});

describe('buildPayload', () => {
  it('mengembalikan null kalau isi kosong', () => {
    const form = emptyForm();
    expect(buildPayload('url', form)).toBeNull();
    expect(buildPayload('text', form)).toBeNull();
    expect(buildPayload('wifi', form)).toBeNull();
    expect(buildPayload('contact', form)).toBeNull();
  });

  it('memakai teks asli untuk payload teks, label tiga kata pertama', () => {
    const form = { ...emptyForm(), text: '  halo dunia ini panjang  ' };
    expect(buildPayload('text', form)).toEqual({
      data: '  halo dunia ini panjang  ',
      label: 'halo dunia ini',
    });
  });

  it('membangun URL dan label tanpa skema', () => {
    const form = { ...emptyForm(), url: 'sekolah.id' };
    expect(buildPayload('url', form)).toEqual({
      data: 'https://sekolah.id',
      label: 'sekolah.id',
    });
  });

  it('memakai ssid yang sudah di-trim', () => {
    const form = emptyForm();
    form.wifi = { ssid: '  Kelas 7A  ', password: 'abc', enc: 'WPA', hidden: false };
    expect(buildPayload('wifi', form)).toEqual({
      data: 'WIFI:T:WPA;S:Kelas 7A;P:abc;;',
      label: 'Kelas 7A',
    });
  });

  it('memakai nama yang sudah di-trim untuk vCard', () => {
    const form = emptyForm();
    form.contact = { name: '  Ani  ', tel: '0812', email: '', title: '' };
    const payload = buildPayload('contact', form);
    expect(payload?.label).toBe('Ani');
    expect(payload?.data).toBe(
      ['BEGIN:VCARD', 'VERSION:3.0', 'N:Ani', 'FN:Ani', 'TEL;TYPE=CELL:0812', 'END:VCARD'].join('\n'),
    );
  });
});
