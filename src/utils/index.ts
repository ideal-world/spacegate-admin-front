import basic from './basic'
export {
  basic,
}


export function hashColor(str: string, mode?: 'light' | 'dark' | 'full'): string {
  const hash = str.split('').reduce((acc, char) => char.charCodeAt(0) + ((acc << 5) - acc), 0)
  const cHex = (hash & 0x00FFFFFF).toString(16).toUpperCase()
  const color = '#' + '00000'.substring(0, 6 - cHex.length) + cHex
  if (mode === 'light') {
    return mapLightness(color, [0.7, 1])
  } else if (mode === 'dark') {
    return mapLightness(color, [0, 0.3])
  } else if (mode === undefined || mode === 'full') {
    return color;
  } else {
    throw new Error('Invalid mode');
  }
}

function truncate(n: number, min: number, max: number): number {
  return Math.min(Math.max(n, min), max);
}


function mapLightness(color: string, range: [number, number]): string {
  let from = truncate(range[0], 0, 1);
  let to = truncate(range[1], from, 1);
  let d = to - from;
  if (d === 0) {
    throw new Error('Invalid range');
  }
  const mapPhase = (p: number) => {
    return Math.floor(255 * from + p * d);
  }
  const r = mapPhase(parseInt(color.substring(1, 3), 16));
  const g = mapPhase(parseInt(color.substring(3, 5), 16));
  const b = mapPhase(parseInt(color.substring(5, 7), 16));
  return '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
}