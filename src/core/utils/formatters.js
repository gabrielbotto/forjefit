const brNumber = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 1 });
const brInt = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 0 });
const brCurrency = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });

export const KG_TO_LB = 2.20462;
export const CM_TO_IN = 0.393701;

export function formatWeight(kg, unitSystem = 'METRIC', withUnit = true) {
  const safeKg = Number.isFinite(kg) ? kg : 0;
  if (unitSystem === 'IMPERIAL') {
    const lb = Math.round(safeKg * KG_TO_LB * 2) / 2;
    return withUnit ? `${brNumber.format(lb)} lb` : brNumber.format(lb);
  }
  const rounded = Math.round(safeKg * 2) / 2;
  return withUnit ? `${brNumber.format(rounded)} kg` : brNumber.format(rounded);
}

export function displayToKg(displayValue, unitSystem = 'METRIC') {
  const num = parseFloat(String(displayValue).replace(',', '.'));
  if (!Number.isFinite(num) || num < 0) return 0;
  return unitSystem === 'IMPERIAL' ? +(num / KG_TO_LB).toFixed(2) : +num.toFixed(2);
}

export function formatHeight(cm, unitSystem = 'METRIC') {
  if (unitSystem === 'IMPERIAL') {
    const totalInches = Math.round(cm * CM_TO_IN);
    const feet = Math.floor(totalInches / 12);
    const inches = totalInches % 12;
    return `${feet}'${inches}"`;
  }
  return `${Math.round(cm)} cm`;
}

export function formatVolume(kg, unitSystem = 'METRIC') {
  const val = unitSystem === 'IMPERIAL' ? kg * KG_TO_LB : kg;
  const unit = unitSystem === 'IMPERIAL' ? 'lb' : 'kg';
  return `${brInt.format(Math.round(val))} ${unit}`;
}

export function formatCurrencyBRL(value) {
  return brCurrency.format(value);
}

export function formatDurationClock(totalSeconds) {
  const s = Math.max(0, Math.floor(totalSeconds));
  const hrs = Math.floor(s / 3600);
  const mins = Math.floor((s % 3600) / 60);
  const secs = s % 60;
  const pad = (n) => String(n).padStart(2, '0');
  return hrs > 0 ? `${pad(hrs)}:${pad(mins)}:${pad(secs)}` : `${pad(mins)}:${pad(secs)}`;
}

export function calcEpley1RM(weightKg, reps) {
  if (!weightKg || weightKg <= 0 || !reps || reps <= 0) return 0;
  if (reps === 1) return +weightKg.toFixed(1);
  return +(weightKg * (1 + reps / 30)).toFixed(1);
}

export function normalizeText(str) {
  return String(str || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

export function generateSupportId() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let out = 'FF-';
  for (let i = 0; i < 10; i++) {
    out += chars[Math.floor(Math.random() * chars.length)];
  }
  return out;
}
