import { ICONS, render1RMChartSVG, renderAnatomySVG, renderBarChartSVG, renderRadarSVG } from '../../core/ui/visuals.js';
import { formatDurationClock, formatVolume, formatWeight } from '../../core/utils/formatters.js';
import { Haptics } from '../../core/utils/haptics.js';
import { db } from '../../data/db/ForjeDB.js';
import { computeMuscleRecovery, computeWeeklyFractionalVolume } from '../../domain/BiomechanicsEngine.js';

const ui = {
  weekOffset: 0,
  barMetric: 'VOLUME',
  analyticsRange: 'WEEK',
  selectedExerciseId: ''
};

function getWeekBounds(offsetWeeks = 0) {
  const now = new Date();
  const day = now.getDay(); // 0 = DOM
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - day + offsetWeeks * 7, 0, 0, 0, 0);
  const end = new Date(start.getTime() + 7 * 86400000 - 1);
  return { start, end };
}

function calcStreakDays(sessions, daysPerWeekTarget = 4) {
  if (!sessions.length) return 0;
  // Conta semanas consecutivas batendo ao menos 1 treino ou dias ativos com folga programada
  const dayKeys = new Set(sessions.map((s) => new Date(s.startedAt).toISOString().slice(0, 10)));
  const sorted = [...dayKeys].sort().reverse();
  let streak = 0;
  const maxGapDays = daysPerWeekTarget <= 3 ? 3 : 2; // Descanso programado não quebra o streak
  let ref = new Date();
  ref.setHours(0, 0, 0, 0);

  for (const iso of sorted) {
    const dt = new Date(`${iso}T00:00:00`);
    const diff = Math.round((ref - dt) / 86400000);
    if (diff <= maxGapDays) {
      streak++;
      ref = dt;
    } else {
      break;
    }
  }
  return streak;
}

export const ProgressView = {
  render(ctx) {
    const { profile, sessions, cardioLogs } = ctx.state;
    const unit = profile.unitSystem;
    const { start, end } = getWeekBounds(ui.weekOffset);
    const weekSessions = sessions.filter((s) => s.startedAt >= start.getTime() && s.startedAt <= end.getTime());

    const dayLabels = ['DOM', 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SÁB'];
    const bars = dayLabels.map((label, idx) => {
      const dayStart = start.getTime() + idx * 86400000;
      const dayEnd = dayStart + 86400000 - 1;
      const daySess = weekSessions.filter((s) => s.startedAt >= dayStart && s.startedAt <= dayEnd);
      let val = 0;
      for (const s of daySess) {
        if (ui.barMetric === 'TIME') val += Math.round((s.durationSec || 0) / 60);
        else if (ui.barMetric === 'KCAL') val += s.estimatedKcal || 0;
        else if (ui.barMetric === 'REPS') {
          for (const ex of s.exercises || []) {
            for (const st of ex.sets || []) if (st.isCompleted) val += st.reps || 0;
          }
        } else val += s.totalVolumeKg || 0;
      }
      return { label, value: val, trained: daySess.length > 0 };
    });

    const recovery = computeMuscleRecovery(sessions);
    const recColorMap = {};
    for (const [id, info] of Object.entries(recovery.muscles)) {
      recColorMap[id] = info.status === 'FATIGUED' ? '#EF4444' : info.status === 'RECOVERING' ? '#F59E0B' : '#10B981';
    }

    const lastSession = sessions[0];
    const daysSinceLast = lastSession ? Math.floor((Date.now() - lastSession.startedAt) / 86400000) : '—';
    const volData = computeWeeklyFractionalVolume(weekSessions);
    const streak = calcStreakDays(sessions, profile.daysPerWeek);

    const periodLabel = `${start.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })} — ${end.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}`;

    return `
      <header class="top-app-bar">
        <h1 class="display-title" style="font-size:21px">Progresso</h1>
        <button class="chip is-active" data-open-analytics>Análises Detalhadas →</button>
      </header>

      <main class="screen-scroll">
        <!-- Paginador Semanal + Régua de 7 Dias -->
        <section class="card" style="display:flex;flex-direction:column;gap:12px">
          <div style="display:flex;align-items:center;justify-content:space-between">
            <button class="btn-icon" style="width:34px;height:34px" data-wk-shift="-1">‹</button>
            <div style="text-align:center">
              <div class="label-overline">${ui.weekOffset === 0 ? 'Semana Atual' : 'Histórico Semanal'}</div>
              <strong style="font-size:14px">${periodLabel}</strong>
            </div>
            <button class="btn-icon" style="width:34px;height:34px" data-wk-shift="1" ${ui.weekOffset >= 0 ? 'disabled' : ''}>›</button>
          </div>

          <div style="display:grid;grid-template-columns:repeat(7,1fr);gap:4px;text-align:center">
            ${bars.map((b) => `
              <div style="padding:8px 2px;border-radius:10px;background:${b.trained ? 'var(--accent-soft)' : 'var(--bg-base)'};border:1px solid ${b.trained ? 'var(--accent-primary)' : 'var(--border-subtle)'}">
                <div style="font-size:10px;color:var(--text-secondary)">${b.label}</div>
                <div style="margin-top:4px;font-weight:700;color:${b.trained ? 'var(--accent-primary)' : 'var(--text-disabled)'}">${b.trained ? '✓' : '·'}</div>
              </div>`).join('')}
          </div>

          <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">
            <div class="card-elevated" style="padding:12px;text-align:center">
              <div class="label-overline">Treinos Totais</div>
              <div class="tnum" style="font-size:24px;font-weight:700;margin-top:2px">${sessions.length}</div>
              <div style="font-size:11px;color:var(--text-secondary)">${cardioLogs.length} cardios registrados</div>
            </div>
            <div class="card-elevated" style="padding:12px;text-align:center">
              <div class="label-overline">Ofensiva Ativa</div>
              <div class="tnum" style="font-size:24px;font-weight:700;color:var(--accent-primary);margin-top:2px">${streak}</div>
              <div style="font-size:11px;color:var(--text-secondary)">Descanso protegido</div>
            </div>
          </div>
        </section>

        <!-- Gráfico de Barras -->
        <section class="card" style="display:flex;flex-direction:column;gap:10px">
          <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:6px">
            <span class="label-overline">Análises da Semana</span>
            <div style="display:flex;gap:4px">
              ${[
                { id: 'VOLUME', l: 'Vol' },
                { id: 'TIME', l: 'Min' },
                { id: 'KCAL', l: 'Kcal' },
                { id: 'REPS', l: 'Reps' }
              ].map((m) => `<button class="chip ${ui.barMetric === m.id ? 'is-active' : ''}" style="padding:5px 9px;font-size:11px" data-bar-metric="${m.id}">${m.l}</button>`).join('')} </div> </div> ${renderBarChartSVG(bars)} </section>  <!-- Recuperação Muscular --> <section class="card" style="display:flex;flex-direction:column;gap:12px"> <div style="display:flex;justify-content:space-between;align-items:center"> <span class="label-overline">Recuperação Muscular (16 Grupos)</span> <span style="font-size:11px;color:var(--text-secondary)">Último: ${daysSinceLast === 0 ? 'Hoje' : daysSinceLast === '—' ? '—' : `${daysSinceLast}d atrás`}</span>
          </div>
          ${renderAnatomySVG({ colorMap: recColorMap, side: 'both' })}
          <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:6px;text-align:center">
            <div style="background:var(--semantic-success-soft);padding:8px;border-radius:10px">
              <div class="tnum" style="font-weight:700;color:var(--semantic-success)">${recovery.readyCount}</div>
              <div style="font-size:10px;color:var(--text-secondary)">Prontos</div>
            </div>
            <div style="background:var(--semantic-warning-soft);padding:8px;border-radius:10px">
              <div class="tnum" style="font-weight:700;color:var(--semantic-warning)">${recovery.recoveringCount}</div>
              <div style="font-size:10px;color:var(--text-secondary)">Recuperando</div>
            </div>
            <div style="background:var(--semantic-danger-soft);padding:8px;border-radius:10px">
              <div class="tnum" style="font-weight:700;color:var(--semantic-danger)">${recovery.fatiguedCount}</div>
              <div style="font-size:10px;color:var(--text-secondary)">Fadigados</div>
            </div>
          </div>
        </section>

        <!-- Distribuição Muscular (Radar Hexagonal) -->
        <section class="card" style="display:flex;flex-direction:column;gap:8px">
          <div style="display:flex;justify-content:space-between;align-items:center">
            <span class="label-overline">Distribuição Muscular</span>
            <span style="font-size:11px;color:var(--text-secondary)"><span style="color:#FF5F00">●</span> Atual &nbsp; <span style="color:#38BDF8">┄</span> Meta</span>
          </div>
          ${renderRadarSVG(volData.radar, 12)}
        </section>

        <!-- Músculo Alvo (Contagem Fracionada MEV / MAV / MRV) -->
        <section class="card" style="display:flex;flex-direction:column;gap:8px">
          <span class="label-overline">Volume Fracionado Semanal (Primário 1.0 • Sinergista 0.5)</span>
          ${Object.values(volData.byPattern).map((pat) => {
            const pct = Math.min(100, Math.round((pat.sets / pat.mrv) * 100));
            const zone = pat.sets < pat.mev ? 'Abaixo MEV' : pat.sets <= pat.mav ? 'Zona Ideal (MAV)' : pat.sets <= pat.mrv ? 'Alto (MRV)' : 'Acima MRV';
            const barColor = pat.sets < pat.mev ? 'var(--semantic-info)' : pat.sets <= pat.mav ? 'var(--semantic-success)' : 'var(--semantic-warning)';
            const entries = Object.entries(pat.muscles);
            return `
              <details style="background:var(--bg-base);border:1px solid var(--border-subtle);border-radius:12px;padding:10px 12px">
                <summary style="cursor:pointer;display:flex;justify-content:space-between;align-items:center;font-weight:600">
                  <span>${pat.label}</span>
                  <span class="tnum" style="font-size:12px;color:${barColor}">${pat.sets} séries • ${zone}</span>
                </summary>
                <div style="height:6px;background:var(--border-subtle);border-radius:6px;overflow:hidden;margin:8px 0">
                  <div style="height:100%;width:${pct}\%;background:${barColor}"></div>
                </div>
                <div style="font-size:11px;color:var(--text-secondary)">Faixas saudáveis: MEV ${pat.mev} • MAV ${pat.mav} • MRV ${pat.mrv}</div>${entries.length ? `<div style="margin-top:6px;font-size:12px;display:flex;flex-wrap:wrap;gap:6px">${entries.map(([n, v]) => `<span class="badge" style="background:var(--bg-surface);color:var(--text-primary)">${n}:${v}</span>`).join('')}</div>` : ''}
              </details>`;
          }).join('')}
        </section>
      </main>`;
  },

  bind(root, ctx) {
    root.querySelectorAll('[data-wk-shift]').forEach((b) => {
      b.addEventListener('click', () => {
        Haptics.light();
        ui.weekOffset = Math.min(0, ui.weekOffset + Number(b.dataset.wkShift));
        ctx.actions.render();
      });
    });

    root.querySelectorAll('[data-bar-metric]').forEach((b) => {
      b.addEventListener('click', () => {
        Haptics.light();
        ui.barMetric = b.dataset.barMetric;
        ctx.actions.render();
      });
    });

    root.querySelector('[data-open-analytics]')?.addEventListener('click', () => {
      ProgressView.openDetailedAnalytics(ctx);
    });
  },

  openDetailedAnalytics(ctx) {
    const { sessions, cardioLogs, catalog, profile } = ctx.state;
    const unit = profile.unitSystem;
    const trainedIds = [...new Set(sessions.flatMap((s) => (s.exercises || []).map((e) => e.exerciseId)))];
    if (!ui.selectedExerciseId && trainedIds.length) ui.selectedExerciseId = trainedIds[0];

    const renderBody = (modal) => {
      const days = ui.analyticsRange === 'WEEK' ? 7 : ui.analyticsRange === 'MONTH' ? 30 : 365;
      const cutoff = Date.now() - days * 86400000;
      const filtS = sessions.filter((s) => s.startedAt >= cutoff);
      const filtC = cardioLogs.filter((c) => c.timestamp >= cutoff);

      const totalSec = filtS.reduce((a, b) => a + (b.durationSec || 0), 0) + filtC.reduce((a, b) => a + (b.durationSec || 0), 0);
      const totalKcal = filtS.reduce((a, b) => a + (b.estimatedKcal || 0), 0) + filtC.reduce((a, b) => a + (b.calories || 0), 0);
      const totalVol = filtS.reduce((a, b) => a + (b.totalVolumeKg || 0), 0);
      const totalPR = filtS.reduce((a, b) => a + (b.prCount || 0), 0);

      // Pontos de 1RM para o exercício escolhido
      const rmPoints = [];
      for (const s of [...sessions].reverse()) {
        const ex = (s.exercises || []).find((e) => e.exerciseId === ui.selectedExerciseId);
        if (!ex) continue;
        let best = 0;
        for (const st of ex.sets || []) {
          if (st.isCompleted && (st.estimated1RM || 0) > best) best = st.estimated1RM;
        }
        if (best > 0) {
          rmPoints.push({
            label: new Date(s.startedAt).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
            value: best
          });
        }
      }

      modal.querySelector('[data-an-body]').innerHTML = `
        <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;text-align:center">
          <div class="card" style="padding:10px"><div class="label-overline">Treinos</div><strong class="tnum" style="font-size:18px">${filtS.length}</strong></div>
          <div class="card" style="padding:10px"><div class="label-overline">Cardios</div><strong class="tnum" style="font-size:18px">${filtC.length}</strong></div>
          <div class="card" style="padding:10px"><div class="label-overline">Tempo</div><strong class="tnum" style="font-size:16px">${formatDurationClock(totalSec)}</strong></div>
          <div class="card" style="padding:10px"><div class="label-overline">Calorias</div><strong class="tnum" style="font-size:17px">${totalKcal}</strong></div>
          <div class="card" style="padding:10px"><div class="label-overline">Volume</div><strong class="tnum" style="font-size:15px;color:var(--accent-primary)">${formatVolume(totalVol, unit)}</strong></div>
          <div class="card" style="padding:10px"><div class="label-overline">Recordes</div><strong class="tnum" style="font-size:18px;color:var(--semantic-success)">${totalPR}</strong></div>
        </div>

        <div class="card" style="display:flex;flex-direction:column;gap:8px;margin-top:10px">
          <span class="label-overline">Evolução de 1RM Estimado (Epley)</span>
          <select class="input-field" data-rm-select>
            ${catalog.filter((c) => c.trackingType === 'WEIGHT_REPS').map((c) =>
              `<option value="${c.id}" ${c.id === ui.selectedExerciseId ? 'selected' : ''}>${c.namePt}</option>`
            ).join('')}
          </select>
          ${render1RMChartSVG(rmPoints.slice(-8), unit)}
        </div>`;

      modal.querySelector('[data-rm-select]')?.addEventListener('change', (e) => {
        ui.selectedExerciseId = e.target.value;
        renderBody(modal);
      });
    };

    ctx.actions.openModal(`
      <h3 class="display-title" style="font-size:21px">Análises Avançadas</h3>
      <div class="chip-group">
        ${[
          { id: 'WEEK', l: 'Semana' },
          { id: 'MONTH', l: 'Mês' },
          { id: 'YEAR', l: 'Ano' }
        ].map((r) => `<button class="chip ${ui.analyticsRange === r.id ? 'is-active' : ''}" data-an-range="${r.id}">${r.l}</button>`).join('')}
      </div>
      <div data-an-body></div>
      <button class="btn btn-secondary btn-full" style="min-height:44px" data-export-csv>Exportar Relatório CSV</button>`,
    (modal) => {
      renderBody(modal);
      modal.querySelectorAll('[data-an-range]').forEach((b) => {
        b.addEventListener('click', () => {
          ui.analyticsRange = b.dataset.anRange;
          modal.querySelectorAll('[data-an-range]').forEach((x) => x.classList.toggle('is-active', x === b));
          renderBody(modal);
        });
      });
      modal.querySelector('[data-export-csv]').addEventListener('click', async () => {
        const csv = await db.exportSessionsCSV();
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = `forjefit-relatorio-${new Date().toISOString().slice(0, 10)}.csv`;
        a.click();
        ctx.actions.toast('Relatório CSV exportado!', 'success');
      });
    });
  }
};
