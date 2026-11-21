import { formatDurationClock, formatVolume, formatWeight } from '../utils/formatters.js';
import { MUSCLE_GROUPS } from '../../data/seed/exercisesSeed.js';

export const ICONS = {
  plan: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2"/><rect x="9" y="3" width="6" height="4" rx="1"/><path d="m9 14 2 2 4-4"/></svg>`,
  explore: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/></svg>`,
  progress: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 3v18h18"/><path d="M7 16v-4"/><path d="M12 16V8"/><path d="M17 16v-6"/></svg>`,
  exercises: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6.5 6.5 17.5 17.5"/><path d="M21 21l-1-1"/><path d="M3 3l1 1"/><path d="m18 22 4-4"/><path d="m2 6 4-4"/><path d="m3 10 7-7"/><path d="m14 21 7-7"/></svg>`,
  profile: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="4"/><path d="M20 21a8 8 0 0 0-16 0"/></svg>`,
  play: `<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><polygon points="6 4 20 12 6 20 6 4"/></svg>`,
  plus: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>`,
  check: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>`,
  more: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><circle cx="12" cy="5" r="1.3"/><circle cx="12" cy="12" r="1.3"/><circle cx="12" cy="19" r="1.3"/></svg>`,
  settings: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9c.26.6.85 1 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>`,
  flame: `<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2c.5 4.2-3 6.2-3 10a4 4 0 0 0 8 0c0-2.6-1.4-4.7-2.8-6.4.4 2.1-.6 3.5-1.7 3.9C13.6 7.4 13.7 4.4 12 2z"/></svg>`,
  clock: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>`,
  trophy: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 9H4a2 2 0 0 1 0-4h2"/><path d="M18 9h2a2 2 0 0 0 0-4h-2"/><path d="M6 4h12v6a6 6 0 0 1-12 0V4z"/><path d="M12 16v4M8 20h8"/></svg>`,
  camera: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>`,
  swap: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m16 3 4 4-4 4"/><path d="M20 7H4"/><path d="m8 21-4-4 4-4"/><path d="M4 17h16"/></svg>`,
  share: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="m8.6 13.5 6.8 4M15.4 6.5l-6.8 4"/></svg>`,
  menu: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M4 7h16M4 12h16M4 17h16"/></svg>`,
  x: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M18 6 6 18M6 6l12 12"/></svg>`,
  bolt: `<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>`,
  heart: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8z"/></svg>`,
  copy: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>`,
  edit: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>`
};

function fillFor(colorMap, id) {
  return colorMap[id] || '#242A35';
}

function buildFrontFigure(colorMap, interactive) {
  const attr = (id) => (interactive ? `data-muscle-tap="${id}" style="cursor:pointer"` : '');
  return `
  <svg viewBox="0 0 160 320" style="width:100%;height:auto;display:block" aria-label="Anatomia Frente">
    <circle cx="80" cy="24" r="15" fill="#1E242E" stroke="#343C4A" stroke-width="1.5"/>
    <rect x="73" y="39" width="14" height="10" rx="4" fill="#1E242E"/>
    <ellipse cx="44" cy="64" rx="13" ry="12" fill="${fillFor(colorMap, 'ombros')}" ${attr('ombros')}/>
    <ellipse cx="116" cy="64" rx="13" ry="12" fill="${fillFor(colorMap, 'ombros')}" ${attr('ombros')}/>
    <path d="M54 55 Q80 62 106 55 L104 86 Q80 92 56 86 Z" fill="${fillFor(colorMap, 'peito')}" ${attr('peito')}/>
    <rect x="30" y="76" width="15" height="36" rx="7" fill="${fillFor(colorMap, 'biceps')}" ${attr('biceps')}/>
    <rect x="115" y="76" width="15" height="36" rx="7" fill="${fillFor(colorMap, 'biceps')}" ${attr('biceps')}/>
    <rect x="26" y="114" width="13" height="38" rx="6" fill="${fillFor(colorMap, 'antebracos')}" ${attr('antebracos')}/>
    <rect x="121" y="114" width="13" height="38" rx="6" fill="${fillFor(colorMap, 'antebracos')}" ${attr('antebracos')}/>
    <path d="M55 90 L66 92 L65 144 L54 138 Z" fill="${fillFor(colorMap, 'obliquos')}" ${attr('obliquos')}/>
    <path d="M105 90 L94 92 L95 144 L106 138 Z" fill="${fillFor(colorMap, 'obliquos')}" ${attr('obliquos')}/>
    <rect x="68" y="92" width="24" height="54" rx="6" fill="${fillFor(colorMap, 'abdomen')}" ${attr('abdomen')}/>
    <path d="M72 154 L80 162 L78 210 L69 205 Z" fill="${fillFor(colorMap, 'adutores')}" ${attr('adutores')}/>
    <path d="M88 154 L80 162 L82 210 L91 205 Z" fill="${fillFor(colorMap, 'adutores')}" ${attr('adutores')}/>
    <path d="M53 152 L71 156 L69 224 L54 222 Z" fill="${fillFor(colorMap, 'quadriceps')}" ${attr('quadriceps')}/>
    <path d="M107 152 L89 156 L91 224 L106 222 Z" fill="${fillFor(colorMap, 'quadriceps')}" ${attr('quadriceps')}/>
    <rect x="55" y="230" width="15" height="68" rx="7" fill="${fillFor(colorMap, 'panturrilhas')}" ${attr('panturrilhas')}/>
    <rect x="90" y="230" width="15" height="68" rx="7" fill="${fillFor(colorMap, 'panturrilhas')}" ${attr('panturrilhas')}/>
  </svg>`;
}

function buildBackFigure(colorMap, interactive) {
  const attr = (id) => (interactive ? `data-muscle-tap="${id}" style="cursor:pointer"` : '');
  return `
  <svg viewBox="0 0 160 320" style="width:100%;height:auto;display:block" aria-label="Anatomia Costas">
    <circle cx="80" cy="24" r="15" fill="#1E242E" stroke="#343C4A" stroke-width="1.5"/>
    <path d="M62 46 L98 46 L108 66 L80 82 L52 66 Z" fill="${fillFor(colorMap, 'trapezio')}" ${attr('trapezio')}/>
    <ellipse cx="44" cy="65" rx="12" ry="11" fill="${fillFor(colorMap, 'ombros')}" ${attr('ombros')}/>
    <ellipse cx="116" cy="65" rx="12" ry="11" fill="${fillFor(colorMap, 'ombros')}" ${attr('ombros')}/>
    <path d="M53 68 L80 84 L107 68 L102 122 L58 122 Z" fill="${fillFor(colorMap, 'costas')}" ${attr('costas')}/>
    <rect x="64" y="124" width="32" height="24" rx="6" fill="${fillFor(colorMap, 'lombar')}" ${attr('lombar')}/>
    <rect x="30" y="77" width="15" height="36" rx="7" fill="${fillFor(colorMap, 'triceps')}" ${attr('triceps')}/>
    <rect x="115" y="77" width="15" height="36" rx="7" fill="${fillFor(colorMap, 'triceps')}" ${attr('triceps')}/>
    <rect x="26" y="115" width="13" height="36" rx="6" fill="${fillFor(colorMap, 'antebracos')}" ${attr('antebracos')}/>
    <rect x="121" y="115" width="13" height="36" rx="6" fill="${fillFor(colorMap, 'antebracos')}" ${attr('antebracos')}/>
    <rect x="49" y="152" width="9" height="34" rx="4" fill="${fillFor(colorMap, 'abdutores')}" ${attr('abdutores')}/>
    <rect x="102" y="152" width="9" height="34" rx="4" fill="${fillFor(colorMap, 'abdutores')}" ${attr('abdutores')}/>
    <ellipse cx="69" cy="168" rx="13" ry="17" fill="${fillFor(colorMap, 'gluteos')}" ${attr('gluteos')}/>
    <ellipse cx="91" cy="168" rx="13" ry="17" fill="${fillFor(colorMap, 'gluteos')}" ${attr('gluteos')}/>
    <rect x="56" y="187" width="18" height="44" rx="8" fill="${fillFor(colorMap, 'posteriores')}" ${attr('posteriores')}/>
    <rect x="86" y="187" width="18" height="44" rx="8" fill="${fillFor(colorMap, 'posteriores')}" ${attr('posteriores')}/>
    <ellipse cx="64" cy="256" rx="10" ry="24" fill="${fillFor(colorMap, 'panturrilhas')}" ${attr('panturrilhas')}/>
    <ellipse cx="96" cy="256" rx="10" ry="24" fill="${fillFor(colorMap, 'panturrilhas')}" ${attr('panturrilhas')}/>
  </svg>`;
}

export function renderAnatomySVG({ colorMap = {}, side = 'both', interactive = false, width = null } = {}) {
  if (side === 'front') {
    return `<div style="${width ? `width:${width}px` : 'max-width:150px;margin:0 auto'}">${buildFrontFigure(colorMap, interactive)}</div>`;
  }
  if (side === 'back') {
    return `<div style="${width ? `width:${width}px` : 'max-width:150px;margin:0 auto'}">${buildBackFigure(colorMap, interactive)}</div>`;
  }
  return `
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;align-items:center">
      <div>
        <div class="label-overline" style="text-align:center;margin-bottom:4px">Frente</div>
        ${buildFrontFigure(colorMap, interactive)}
      </div>
      <div>
        <div class="label-overline" style="text-align:center;margin-bottom:4px">Costas</div>
        ${buildBackFigure(colorMap, interactive)}
      </div>
    </div>`;
}

export function renderRadarSVG(radarData, idealSets = 12) {
  const axes = [
    { key: 'PEITORAL', label: 'Peitoral' },
    { key: 'OMBROS', label: 'Ombros' },
    { key: 'BRACOS', label: 'Braços' },
    { key: 'PERNAS', label: 'Pernas' },
    { key: 'COSTAS', label: 'Costas' },
    { key: 'CORE', label: 'Core' }
  ];
  const cx = 140;
  const cy = 118;
  const maxR = 76;
  const maxVal = Math.max(idealSets * 1.25, ...axes.map((a) => radarData[a.key] || 0), 10);

  const pt = (index, ratio) => {
    const angle = (Math.PI * 2 * index) / axes.length - Math.PI / 2;
    return [cx + Math.cos(angle) * maxR * ratio, cy + Math.sin(angle) * maxR * ratio];
  };

  const rings = [0.33, 0.66, 1].map((r) => {
    const points = axes.map((_, i) => pt(i, r).join(',')).join(' ');
    return `<polygon points="${points}" fill="none" stroke="#222730" stroke-width="1"/>`;
  }).join('');

  const idealRatio = Math.min(1, idealSets / maxVal);
  const idealPoly = axes.map((_, i) => pt(i, idealRatio).join(',')).join(' ');
  const actualPoly = axes.map((a, i) => pt(i, Math.min(1, (radarData[a.key] || 0) / maxVal)).join(',')).join(' ');

  const labels = axes.map((a, i) => {
    const [x, y] = pt(i, 1.22);
    return `<text x="${x.toFixed(1)}" y="${(y + 4).toFixed(1)}" text-anchor="middle" fill="#94A3B8" font-size="11" font-weight="600" font-family="Inter,sans-serif">${a.label}</text>`;
  }).join('');

  return `
  <svg viewBox="0 0 280 236" style="width:100%;max-width:300px;margin:0 auto;display:block">
    ${rings}
    <polygon points="${idealPoly}" fill="rgba(56,189,248,0.10)" stroke="#38BDF8" stroke-dasharray="4 3" stroke-width="1.5"/>
    <polygon points="${actualPoly}" fill="rgba(255,95,0,0.28)" stroke="#FF5F00" stroke-width="2.2"/>
    ${labels}
  </svg>`;
}

export function renderBarChartSVG(bars) {
  const maxVal = Math.max(1, ...bars.map((b) => b.value));
  const avg = bars.reduce((a, b) => a + b.value, 0) / Math.max(1, bars.length);
  const chartH = 112;
  const topPad = 18;
  const avgY = topPad + chartH - (avg / maxVal) * chartH;

  const cols = bars.map((b, i) => {
    const x = 16 + i * 42;
    const h = Math.max(3, (b.value / maxVal) * chartH);
    const y = topPad + chartH - h;
    const fill = b.value > 0 ? '#FF5F00' : '#222730';
    return `
      <rect x="${x}" y="${y.toFixed(1)}" width="22" height="${h.toFixed(1)}" rx="6" fill="${fill}"/>
      <text x="${x + 11}" y="150" text-anchor="middle" fill="#94A3B8" font-size="10" font-weight="600">${b.label}</text>`;
  }).join('');

  return `
  <svg viewBox="0 0 310 160" style="width:100%;display:block">
    <line x1="8" y1="${avgY.toFixed(1)}" x2="302" y2="${avgY.toFixed(1)}" stroke="#38BDF8" stroke-dasharray="4 4" stroke-width="1.2"/>
    ${cols}
  </svg>`;
}

export function render1RMChartSVG(points, unitSystem = 'METRIC') {
  if (!points || points.length === 0) {
    return `<div style="padding:24px;text-align:center;color:var(--text-secondary);font-size:13px">Registre séries concluídas neste exercício para gerar a curva de 1RM estimado.</div>`;
  }
  const vals = points.map((p) => p.value);
  const minV = Math.min(...vals) * 0.9;
  const maxV = Math.max(...vals) * 1.08 + 1;
  const w = 300;
  const h = 130;

  const coords = points.map((p, idx) => {
    const x = points.length === 1 ? w / 2 : 24 + (idx / (points.length - 1)) * (w - 48);
    const y = 18 + (1 - (p.value - minV) / (maxV - minV)) * (h - 42);
    return { x, y, ...p };
  });

  const linePath = coords.map((c, i) => `${i === 0 ? 'M' : 'L'}${c.x.toFixed(1)},${c.y.toFixed(1)}`).join(' ');
  const dots = coords.map((c) => `
    <circle cx="${c.x.toFixed(1)}" cy="${c.y.toFixed(1)}" r="4.5" fill="#FF5F00" stroke="#0B0D10" stroke-width="2"/>
    <text x="${c.x.toFixed(1)}" y="${(c.y - 9).toFixed(1)}" text-anchor="middle" fill="#F8FAFC" font-size="9.5" font-weight="700">${formatWeight(c.value, unitSystem, false)}</text>
    <text x="${c.x.toFixed(1)}" y="${h - 4}" text-anchor="middle" fill="#94A3B8" font-size="9">${c.label}</text>
  `).join('');

  return `
  <svg viewBox="0 0 ${w} ${h}" style="width:100%;display:block">
    <path d="${linePath}" fill="none" stroke="#FF5F00" stroke-width="2.5" stroke-linecap="round"/>
    ${dots}
  </svg>`;
}

export function playTimerBeep() {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    [0, 0.18].forEach((offset, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = idx === 0 ? 740 : 987;
      gain.gain.setValueAtTime(0.18, ctx.currentTime + offset);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + offset + 0.14);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(ctx.currentTime + offset);
      osc.stop(ctx.currentTime + offset + 0.15);
    });
  } catch (_) {}
}

function drawRoundedPanel(ctx, x, y, w, h, r) {
  ctx.beginPath();
  if (typeof ctx.roundRect === 'function') {
    ctx.roundRect(x, y, w, h, r);
  } else {
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }
}

export function renderSocialCardCanvas(canvas, { session, photoImg = null, unitSystem = 'METRIC', mode = 'card' }) {
  const ctx = canvas.getContext('2d');
  const W = 900;
  const H = 1200;
  canvas.width = W;
  canvas.height = H;
  ctx.clearRect(0, 0, W, H);

  if (mode !== 'sticker') {
    if (photoImg) {
      const scale = Math.max(W / photoImg.width, H / photoImg.height);
      const dw = photoImg.width * scale;
      const dh = photoImg.height * scale;
      ctx.drawImage(photoImg, (W - dw) / 2, (H - dh) / 2, dw, dh);
      const grad = ctx.createLinearGradient(0, 0, 0, H);
      grad.addColorStop(0, 'rgba(11,13,16,0.35)');
      grad.addColorStop(0.55, 'rgba(11,13,16,0.55)');
      grad.addColorStop(1, 'rgba(11,13,16,0.95)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, W, H);
    } else {
      const bg = ctx.createLinearGradient(0, 0, W, H);
      bg.addColorStop(0, '#0B0D10');
      bg.addColorStop(0.6, '#14171C');
      bg.addColorStop(1, '#1F140E');
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, W, H);
    }
  }

  const panelY = mode === 'sticker' ? 320 : 620;
  const panelH = 490;
  ctx.fillStyle = mode === 'sticker' ? 'rgba(11,13,16,0.82)' : 'rgba(20,23,28,0.86)';
  ctx.strokeStyle = 'rgba(255,95,0,0.65)';
  ctx.lineWidth = 3;
  drawRoundedPanel(ctx, 56, panelY, W - 112, panelH, 34);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = '#FF5F00';
  ctx.font = '700 32px "Space Grotesk", sans-serif';
  ctx.fillText('FORJEFIT', 100, panelY + 66);

  ctx.fillStyle = '#94A3B8';
  ctx.font = '600 22px Inter, sans-serif';
  ctx.fillText(new Date(session.finishedAt || Date.now()).toLocaleDateString('pt-BR'), W - 245, panelY + 66);

  ctx.fillStyle = '#F8FAFC';
  ctx.font = '700 44px "Space Grotesk", sans-serif';
  ctx.fillText((session.dayTitle || 'Treino Concluído').slice(0, 26), 100, panelY + 132);

  const metrics = [
    { label: 'TEMPO', value: formatDurationClock(session.durationSec || 0) },
    { label: 'VOLUME', value: formatVolume(session.totalVolumeKg || 0, unitSystem) },
    { label: 'RECORDES', value: `${session.prCount || 0} PR` }
  ];

  metrics.forEach((m, i) => {
    const x = 100 + i * 245;
    ctx.fillStyle = '#94A3B8';
    ctx.font = '700 20px Inter, sans-serif';
    ctx.fillText(m.label, x, panelY + 215);
    ctx.fillStyle = i === 1 ? '#FF5F00' : '#F8FAFC';
    ctx.font = '700 40px "Space Grotesk", sans-serif';
    ctx.fillText(m.value, x, panelY + 265);
  });

  const workedIds = [...new Set((session.exercises || []).map((e) => e.primaryMuscle))];
  const lookup = Object.fromEntries(MUSCLE_GROUPS.map((m) => [m.id, m.name]));
  const names = workedIds.map((id) => lookup[id] || id).slice(0, 5).join('  •  ');

  ctx.fillStyle = '#94A3B8';
  ctx.font = '700 20px Inter, sans-serif';
  ctx.fillText('GRUPOS TRABALHADOS', 100, panelY + 345);
  ctx.fillStyle = '#10B981';
  ctx.font = '600 26px Inter, sans-serif';
  ctx.fillText(names || 'Treino Completo', 100, panelY + 388);

  ctx.fillStyle = '#94A3B8';
  ctx.font = '500 22px Inter, sans-serif';
  ctx.fillText(`${session.totalSets || 0} séries válidas  •  ~${session.estimatedKcal || 0} kcal`, 100, panelY + 444);
}
