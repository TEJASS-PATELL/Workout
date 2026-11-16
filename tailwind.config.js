export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: { extend: {
    colors: { bg: 'var(--bg)', card: 'var(--card)', line: 'var(--line)', fg: 'var(--fg)', mute: 'var(--mute)', acc: 'var(--acc)', onacc: 'var(--onacc)' },
    fontFamily: { sans: ['Inter', 'system-ui', 'sans-serif'], head: ['"Barlow Condensed"', 'Inter', 'sans-serif'] },
  } },
}
