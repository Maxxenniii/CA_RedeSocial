// js/aparencia.js
(function() {
  const root = document.documentElement;

  function hexToRgb(hex) {
    let value = String(hex).trim().replace('#', '');
    if (value.length === 3) value = value.split('').map(ch => ch + ch).join('');
    if (!/^([0-9a-fA-F]{6})$/.test(value)) return null;
    const num = parseInt(value, 16);
    return { r: (num >> 16) & 255, g: (num >> 8) & 255, b: num & 255 };
  }

  function rgbToHex(r, g, b) {
    return '#' + [r, g, b].map(v => Math.max(0, Math.min(255, v)).toString(16).padStart(2, '0')).join('');
  }

  function mix(hex1, hex2, amount) {
    const a = hexToRgb(hex1);
    const b = hexToRgb(hex2);
    if (!a || !b) return String(hex1).toUpperCase();
    return rgbToHex(
      Math.round(a.r + (b.r - a.r) * amount),
      Math.round(a.g + (b.g - a.g) * amount),
      Math.round(a.b + (b.b - a.b) * amount)
    );
  }

  function applyTheme(baseHex) {
    const hex = String(baseHex).toUpperCase();
    const rgb = hexToRgb(hex);
    if (!rgb) return;

    const dark1 = mix(hex, '#000000', 0.35);
    const dark2 = mix(hex, '#000000', 0.55);
    const dark3 = mix(hex, '#000000', 0.75);
    const light1 = mix(hex, '#FFFFFF', 0.30);
    const light2 = mix(hex, '#FFFFFF', 0.55);
    const light3 = mix(hex, '#FFFFFF', 0.78);

    root.style.setProperty('--violet', hex);
    root.style.setProperty('--violet-dark', dark1);
    root.style.setProperty('--violet-light', light1);
    root.style.setProperty('--lime', light2);
    root.style.setProperty('--lime-dark', dark2);
    root.style.setProperty('--lime-glow', light3);
    root.style.setProperty('--gray-dark', dark3);
    root.style.setProperty('--gray-mid', mix(hex, '#000000', 0.86));
    root.style.setProperty('--bg-primary', mix(hex, '#000000', 0.92));
    root.style.setProperty('--bg-secondary', mix(hex, '#000000', 0.82));
    root.style.setProperty('--bg-body', mix(hex, '#000000', 0.96));
    root.style.setProperty('--border-color', dark2);
    root.style.setProperty('--text-primary', light3);
    root.style.setProperty('--text-secondary', light1);
    root.style.setProperty('--text-muted', mix(hex, '#FFFFFF', 0.86));
    root.style.setProperty('--accent', hex);
    root.style.setProperty('--accent-rgb', `${rgb.r}, ${rgb.g}, ${rgb.b}`);
    root.style.setProperty('--lime-rgb', `${hexToRgb(light2).r}, ${hexToRgb(light2).g}, ${hexToRgb(light2).b}`);
    root.style.setProperty('--neon-glow', `0 0 5px ${hex}, 0 0 10px ${dark1}`);
    root.style.setProperty('--violet-glow', `0 0 5px ${hex}, 0 0 10px ${dark1}`);
    root.style.setProperty('--success', light2);
    root.style.setProperty('--warning', mix(hex, '#FFB347', 0.65));
    root.style.setProperty('--error', mix(hex, '#FF3A3A', 0.60));

    localStorage.setItem('portalThemeColor', hex);
    const colorPicker = document.getElementById('themeColor');
    const hexInput = document.getElementById('hexInput');
    if (colorPicker) colorPicker.value = hex;
    if (hexInput) hexInput.value = hex;
  }

  function applyFont() {
    const savedFont = localStorage.getItem('portalFont') || 'VT323';
    root.style.setProperty('--font-family', `${savedFont}, monospace`);
  }

  const savedTheme = localStorage.getItem('portalThemeColor') || '#7D39EB';
  applyTheme(savedTheme);
  applyFont();

  // Configurar listeners se existirem os elementos
  const colorPicker = document.getElementById('themeColor');
  const hexInput = document.getElementById('hexInput');
  if (colorPicker && hexInput) {
    colorPicker.addEventListener('input', () => {
      hexInput.value = colorPicker.value.toUpperCase();
      applyTheme(colorPicker.value);
    });
    hexInput.addEventListener('input', () => {
      let value = hexInput.value.trim();
      if (!value.startsWith('#')) value = `#${value}`;
      if (/^#([0-9A-F]{3}){1,2}$/i.test(value)) {
        colorPicker.value = value;
        applyTheme(value);
      }
    });
  }

  window.applyTheme = applyTheme;
  window.applyFont = applyFont;
})();