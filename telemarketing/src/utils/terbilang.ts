/**
 * Utility to convert numbers into Indonesian words (Terbilang)
 */
export function terbilang(n: number): string {
  if (isNaN(n) || n === null || n === undefined) return '';
  const num = Math.floor(Math.abs(n));
  if (num === 0) return 'nol';

  const angka = [
    '', 'satu', 'dua', 'tiga', 'empat', 'lima',
    'enam', 'tujuh', 'delapan', 'sembilan', 'sepuluh', 'sebelas'
  ];

  function convert(val: number): string {
    if (val < 12) {
      return angka[val];
    } else if (val < 20) {
      return convert(val - 10) + ' belas';
    } else if (val < 100) {
      return convert(Math.floor(val / 10)) + ' puluh' + (val % 10 !== 0 ? ' ' + convert(val % 10) : '');
    } else if (val < 200) {
      return 'seratus' + (val - 100 !== 0 ? ' ' + convert(val - 100) : '');
    } else if (val < 1000) {
      return convert(Math.floor(val / 100)) + ' ratus' + (val % 100 !== 0 ? ' ' + convert(val % 100) : '');
    } else if (val < 2000) {
      return 'seribu' + (val - 1000 !== 0 ? ' ' + convert(val - 1000) : '');
    } else if (val < 1000000) {
      return convert(Math.floor(val / 1000)) + ' ribu' + (val % 1000 !== 0 ? ' ' + convert(val % 1000) : '');
    } else if (val < 1000000000) {
      return convert(Math.floor(val / 1000000)) + ' juta' + (val % 1000000 !== 0 ? ' ' + convert(val % 1000000) : '');
    } else if (val < 1000000000000) {
      return convert(Math.floor(val / 1000000000)) + ' miliar' + (val % 1000000000 !== 0 ? ' ' + convert(val % 1000000000) : '');
    } else {
      return convert(Math.floor(val / 1000000000000)) + ' triliun' + (val % 1000000000000 !== 0 ? ' ' + convert(val % 1000000000000) : '');
    }
  }

  const result = convert(num).trim();
  // Capitalize first letter of each word or sentence case
  return result.charAt(0).toUpperCase() + result.slice(1);
}

export function terbilangRupiah(n: number): string {
  const words = terbilang(n);
  if (!words) return '-';
  return `${words} rupiah.`;
}

export function numberToIndonesianWord(n: number): string {
  const words = ['nol', 'satu', 'dua', 'tiga', 'empat', 'lima', 'enam', 'tujuh', 'delapan', 'sembilan', 'sepuluh'];
  if (n >= 0 && n <= 10) return words[n];
  return n.toString();
}

export function getRomanMonth(date: Date = new Date()): string {
  const roman = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII'];
  return roman[date.getMonth()] || 'I';
}
