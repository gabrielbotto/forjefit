import { ICONS, renderSocialCardCanvas } from '../../core/ui/visuals.js';
import { displayToKg, formatDurationClock, formatVolume, formatWeight } from '../../core/utils/formatters.js';
import { Haptics } from '../../core/utils/haptics.js';
import { db, STORES } from '../../data/db/ForjeDB.js';
import { calculatePlatesPerSide, evaluateProgressiveOverload } from '../../domain/BiomechanicsEngine.js';

const SET_TYPES = ['WORKING', 'WARMUP', 'DROPSET', 'FAILURE'];
const SET_BADGE = { WORKING: 'N', WARMUP: 'AQ', DROPSET: 'DS', FAILURE: 'F' };

export function buildActiveWorkoutSession(dayObj, previousSessions, catalog) {
  const catalogById = Object.fromEntries(catalog.map((c) => [c.id, c]));

  const findLastSets = (exerciseId) => {
    for (const s of previousSessions) {
      const found = (s.exercises || []).find((e) => e.exerciseId === exerciseId);
      if (found && found.sets?.length) return found.sets.filter((st) => st.isCompleted && st.setType !== 'WARMUP');
    }
    return [];
  };

  const exercises = dayObj.items.map((item) => {
    const lastSets = findLastSets(item.exerciseId);
    const sets = [];

    if (item.hasWarmupSets && item.trackingType === 'WEIGHT_REPS' && item.suggestedLoadKg > 0) {
      sets.push({
        setNumber: 0, setType: 'WARMUP',
        weightKg: Math.max(2, Math.round((item.suggestedLoadKg * 0.5) / 2) * 2),
        reps: 10, durationSec: 0, rir: 4, isCompleted: false, prevLabel: '50%'
      });
      sets.push({
        setNumber: 0, setType: 'WARMUP',
        weightKg: Math.max(2, Math.round((item.suggestedLoadKg * 0.75) / 2) * 2),
        reps: 5, durationSec: 0, rir: 3, isCompleted: false, prevLabel: '75%'
      });
    }

    const defaultReps = parseInt(String(item.targetRepRange || '10').split('-')[0], 10) || 10;
    for (let i = 1; i <= (item.targetSets || 3); i++) {
      const prev = lastSets[i - 1];
      const prevLabel = prev
        ? (item.trackingType === 'DURATION_SECONDS' ? `${prev.durationSec}s` : `${prev.weightKg}×${prev.reps}`)
        : '—';
      sets.push({
        setNumber: i,
        setType: 'WORKING',
        weightKg: prev?.weightKg ?? item.suggestedLoadKg ?? 0,
        reps: item.trackingType === 'DURATION_SECONDS' ? 0 : (prev?.reps ?? defaultReps),
        durationSec: item.trackingType === 'DURATION_SECONDS' ? (parseInt(item.targetRepRange, 10) || 45) : 0,
        rir: 2,
        isCompleted: false,
        prevLabel
      });
    }

    return {
      ...item,
      userTechnicalNote: catalogById[item.exerciseId]?.userTechnicalNote || '',
      sets
    };
  });

  return {
    sessionId: `sess_${Date.now()}`,
    planDayId: dayObj.dayId,
    dayTitle: dayObj.title,
    isTransient: !!dayObj.isTransient,
    startedAt: Date.now(),
    exercises
  };
}

function calcLiveMetrics(aw) {
  let volume = 0;
  let completedSets = 0;
  for (const ex of aw.exercises) {
    for (const s of ex.sets) {
      if (!s.isCompleted) continue;
      if (s.setType !== 'WARMUP') completedSets++;
      volume += (Number(s.weightKg) || 0) * (Number(s.reps) || 0);
    }
  }
  const elapsedSec = Math.floor((Date.now() - aw.startedAt) / 1000);
  const kcal = Math.round((elapsedSec / 60) * 5.8 + completedSets * 4);
  return { volume: Math.round(volume), completedSets, elapsedSec, kcal };
}

export const ActiveWorkoutView = {
  render(ctx) {
    const aw = ctx.state.activeWorkout;
    const unit = ctx.state.profile.unitSystem;
    const stats = calcLiveMetrics(aw);
    const timer = ctx.state.restTimer;

    return `
      <header class="top-app-bar" style="flex-direction:column;align-items:stretch;gap:8px">
        <div style="display:flex;align-items:center;justify-content:space-between;gap:8px">
          <button class="btn-icon" data-aw-cancel aria-label="Cancelar">${ICONS.x}</button>
          <div style="text-align:center;min-width:0;flex:1">
            <div class="label-overline" style="color:var(--accent-primary)">Treino Ativo</div>
            <div style="font-weight:700;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${aw.dayTitle}</div>
          </div>
          <button class="btn btn-primary" style="min-height:38px;padding:6px 14px;font-size:13px" data-aw-finish>FINALIZAR</button>
        </div>

        <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;text-align:center;background:var(--bg-surface);border-radius:12px;padding:8px">
          <div>
            <div class="label-overline">Tempo</div>
            <div class="tnum" data-aw-clock style="font-size:16px;font-weight:700">${formatDurationClock(stats.elapsedSec)}</div>
          </div>
          <div>
            <div class="label-overline">Volume</div>
            <div class="tnum" style="font-size:16px;font-weight:700;color:var(--accent-primary)">${formatVolume(stats.volume, unit)}</div>
          </div>
          <div>
            <div class="label-overline">Séries / Kcal</div>
            <div class="tnum" style="font-size:16px;font-weight:700">${stats.completedSets} • ${stats.kcal}</div>
          </div>
        </div>
      </header>

      <main class="screen-scroll screen-scroll--no-nav" style="padding-bottom:calc(120px + var(--safe-bottom))">
        ${aw.exercises.map((ex, exIdx) => {
          const isDuration = ex.trackingType === 'DURATION_SECONDS';
          const isWeight = ex.trackingType === 'WEIGHT_REPS';
          return `
            <section class="card" style="display:flex;flex-direction:column;gap:10px">
              <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:8px">
                <div>
                  <h3 class="display-title" style="font-size:17px">${ex.namePt}</h3>
                  <div style="font-size:12px;color:var(--text-secondary)">Alvo: ${ex.targetSets}×${ex.targetRepRange} • Descanso ${ex.restSeconds}s</div>
                  ${ex.userTechnicalNote ? `<div style="font-size:11px;color:var(--semantic-info);margin-top:3px">Nota: ${ex.userTechnicalNote}</div>` : ''}
                </div>
                <div style="display:flex;gap:6px">
                  ${isWeight ? `<button class="chip" style="padding:6px 10px;font-size:11px" data-plate-calc="${exIdx}">Anilhas</button>` : ''}
                  <button class="chip" style="padding:6px 10px;font-size:11px" data-aw-swap="${exIdx}">${ICONS.swap}</button>
                </div>
              </div>

              <div class="set-grid label-overline" style="font-size:10px;text-align:center;padding:0 2px">
                <span>SET</span><span>ANT.</span>
                <span>${isWeight ? (unit === 'IMPERIAL' ? 'LB' : 'KG') : 'TIPO'}</span>
                <span>${isDuration ? 'SEG' : 'REPS'}</span>
                <span>RIR</span><span>OK</span>
              </div>

              ${ex.sets.map((s, sIdx) => `
                <div class="set-grid" style="${s.isCompleted ? 'opacity:0.72' : ''}">
                  <button class="chip" style="padding:6px 0;font-size:11px;text-align:center;${s.setType === 'WARMUP' ? 'color:var(--semantic-warning);border-color:var(--semantic-warning)' : ''}" data-cycle-type="${exIdx}:${sIdx}">
                    ${s.setType === 'WORKING' ? s.setNumber : SET_BADGE[s.setType]}
                  </button>
                  <span class="tnum" style="font-size:11px;color:var(--text-secondary);text-align:center">${s.prevLabel || '—'}</span>
                  ${isWeight
                    ? `<input class="set-input tnum" type="number" step="0.5" inputmode="decimal" value="${formatWeight(s.weightKg, unit, false).replace(',', '.')}" data-set-field="${exIdx}:${sIdx}:weight" />`
                    : `<span style="font-size:11px;color:var(--text-secondary);text-align:center">${isDuration ? 'ISO' : 'CORP'}</span>`
                  }
                  <input class="set-input tnum" type="number" inputmode="numeric" value="${isDuration ? s.durationSec : s.reps}" data-set-field="${exIdx}:${sIdx}:${isDuration ? 'durationSec' : 'reps'}" />
                  <input class="set-input tnum" type="number" min="0" max="5" inputmode="numeric" value="${s.rir ?? 2}" data-set-field="${exIdx}:${sIdx}:rir" />
                  <button class="set-check ${s.isCompleted ? 'is-done' : ''}" data-toggle-set="${exIdx}:${sIdx}">${ICONS.check}</button>
                </div>
              `).join('')}

              <div style="display:flex;gap:8px;margin-top:4px">
                <button class="btn btn-secondary" style="flex:1;min-height:38px;font-size:12px" data-add-set="${exIdx}">${ICONS.plus} Série</button>
                ${isDuration ? `<button class="btn btn-secondary" style="flex:1;min-height:38px;font-size:12px" data-iso-timer="${exIdx}">${ICONS.clock} Iniciar Isometria</button>` : ''}
              </div>
            </section>`;
        }).join('')}
      </main>

      ${timer.active ? `
        <div class="rest-timer-bar">
          <div>
            <div class="label-overline" style="color:var(--accent-primary)">Descanso</div>
            <div class="tnum" data-rest-clock style="font-size:26px;font-weight:700">${formatDurationClock(timer.remainingSec)}</div>
          </div>
          <div style="display:flex;gap:6px">
            <button class="chip" data-rest-adj="-15">-15s</button>
            <button class="chip" data-rest-adj="15">+15s</button>
            <button class="btn btn-primary" style="min-height:38px;padding:0 14px;font-size:12px" data-rest-skip>PULAR</button>
          </div>
        </div>` : ''}`;
  },

  bind(root, ctx) {
    const aw = ctx.state.activeWorkout;
    const unit = ctx.state.profile.unitSystem;

    root.querySelectorAll('[data-set-field]').forEach((inp) => {
      inp.addEventListener('change', (e) => {
        const [exIdx, sIdx, field] = inp.dataset.setField.split(':');
        const set = aw.exercises[Number(exIdx)].sets[Number(sIdx)];
        if (field === 'weight') {
          set.weightKg = displayToKg(e.target.value, unit);
        } else {
          set[field] = Math.max(0, parseInt(e.target.value, 10) || 0);
        }
        ctx.actions.render();
      });
    });

    root.querySelectorAll('[data-cycle-type]').forEach((btn) => {
      btn.addEventListener('click', () => {
        Haptics.light();
        const [exIdx, sIdx] = btn.dataset.cycleType.split(':').map(Number);
        const set = aw.exercises[exIdx].sets[sIdx];
        const nextIdx = (SET_TYPES.indexOf(set.setType) + 1) % SET_TYPES.length;
        set.setType = SET_TYPES[nextIdx];
        ctx.actions.render();
      });
    });

    root.querySelectorAll('[data-toggle-set]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const [exIdx, sIdx] = btn.dataset.toggleSet.split(':').map(Number);
        const ex = aw.exercises[exIdx];
        const set = ex.sets[sIdx];
        set.isCompleted = !set.isCompleted;
        if (set.isCompleted) {
          Haptics.medium();
          if (ex.restSeconds > 0) ctx.actions.startRestTimer(ex.restSeconds);
        } else {
          Haptics.light();
        }
        ctx.actions.render();
      });
    });

    root.querySelectorAll('[data-add-set]').forEach((btn) => {
      btn.addEventListener('click', () => {
        Haptics.light();
        const ex = aw.exercises[Number(btn.dataset.addSet)];
        const last = ex.sets[ex.sets.length - 1] || { weightKg: ex.suggestedLoadKg, reps: 10, durationSec: 45, rir: 2 };
        const workingCount = ex.sets.filter((s) => s.setType !== 'WARMUP').length;
        ex.sets.push({ ...last, setNumber: workingCount + 1, setType: 'WORKING', isCompleted: false });
        ctx.actions.render();
      });
    });

    root.querySelectorAll('[data-iso-timer]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const ex = aw.exercises[Number(btn.dataset.isoTimer)];
        const pending = ex.sets.find((s) => !s.isCompleted) || ex.sets[0];
        ctx.actions.startRestTimer(pending?.durationSec || 45);
        ctx.actions.toast('Cronômetro de isometria iniciado!', 'info');
      });
    });

    // Calculadora de Anilhas
    root.querySelectorAll('[data-plate-calc]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const ex = aw.exercises[Number(btn.dataset.plateCalc)];
        const refSet = ex.sets.find((s) => s.setType === 'WORKING') || ex.sets[0];
        let totalKg = refSet?.weightKg || 40;
        let barKg = 20;

        const drawCalc = (modal) => {
          const res = calculatePlatesPerSide(totalKg, barKg);
          modal.querySelector('[data-plates-out]').innerHTML = `
            <div style="text-align:center;margin:8px 0">
              <div class="label-overline">Montar em CADA lado da barra (${barKg} kg)</div>
              <div style="display:flex;flex-wrap:wrap;justify-content:center;gap:8px;margin-top:12px">
                ${res.perSide.length
                  ? res.perSide.map((p) => `<span class="badge badge-pro tnum" style="font-size:15px;padding:8px 14px">${p} kg</span>`).join('')
                  : '<span style="color:var(--text-secondary)">Apenas a barra</span>'}
              </div>
              ${res.remainder > 0 ? `<div style="font-size:12px;color:var(--semantic-warning);margin-top:8px">Sobra não exata: ${res.remainder} kg/lado</div>` : ''}
            </div>`;
        };

        ctx.actions.openModal(`
          <h3 class="display-title" style="font-size:20px">Calculadora de Anilhas</h3>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
            <div>
              <label class="label-overline">Carga Total (kg)</label>
              <input class="input-field tnum" type="number" step="2.5" value="${totalKg}" data-pc-total />
            </div>
            <div>
              <label class="label-overline">Peso da Barra</label>
              <select class="input-field" data-pc-bar>
                <option value="20" ${barKg === 20 ? 'selected' : ''}>Olímpica (20 kg)</option>
                <option value="12" ${barKg === 12 ? 'selected' : ''}>Média (12 kg)</option>
                <option value="10" ${barKg === 10 ? 'selected' : ''}>Barra W (10 kg)</option>
              </select>
            </div>
          </div>
          <div data-plates-out></div>`, (modal) => {
          drawCalc(modal);
          modal.querySelector('[data-pc-total]').addEventListener('input', (e) => {
            totalKg = Number(e.target.value) || 0;
            drawCalc(modal);
          });
          modal.querySelector('[data-pc-bar]').addEventListener('change', (e) => {
            barKg = Number(e.target.value) || 20;
            drawCalc(modal);
          });
        });
      });
    });

    // Troca rápida de máquina ocupada
    root.querySelectorAll('[data-aw-swap]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const exIdx = Number(btn.dataset.awSwap);
        const current = aw.exercises[exIdx];
        const alts = ctx.state.catalog.filter((c) => c.primaryMuscle === current.primaryMuscle && c.id !== current.exerciseId);
        ctx.actions.openModal(`
          <h3 class="display-title" style="font-size:19px">Máquina ocupada? Troque rápido</h3>
          <div style="display:flex;flex-direction:column;gap:8px;max-height:300px;overflow-y:auto">
            ${alts.map((a) => `<button class="btn btn-secondary btn-full" style="min-height:44px;justify-content:flex-start" data-do-swap="${a.id}">${a.namePt}</button>`).join('')}
          </div>`, (modal) => {
          modal.querySelectorAll('[data-do-swap]').forEach((b) => {
            b.addEventListener('click', () => {
              const target = ctx.state.catalog.find((c) => c.id === b.dataset.doSwap);
              if (target) {
                aw.exercises[exIdx].exerciseId = target.id;
                aw.exercises[exIdx].namePt = target.namePt;
                aw.exercises[exIdx].trackingType = target.trackingType;
              }
              ctx.actions.closeModal();
              ctx.actions.render();
            });
          });
        });
      });
    });

    // Controles do Timer
    root.querySelectorAll('[data-rest-adj]').forEach((b) => b.addEventListener('click', () => ctx.actions.adjustRestTimer(Number(b.dataset.restAdj))));
    root.querySelector('[data-rest-skip]')?.addEventListener('click', () => ctx.actions.stopRestTimer());

    // Cancelar treino
    root.querySelector('[data-aw-cancel]')?.addEventListener('click', () => {
      if (confirm('Descartar o treino em andamento?')) {
        ctx.actions.stopRestTimer();
        ctx.state.activeWorkout = null;
        ctx.actions.render();
      }
    });

    // Finalizar e rodar Motor de Sobrecarga Progressiva
    root.querySelector('[data-aw-finish]')?.addEventListener('click', async () => {
      const stats = calcLiveMetrics(aw);
      if (stats.completedSets === 0) {
        ctx.actions.toast('Marque ao menos 1 série concluída antes de finalizar.', 'danger');
        return;
      }

      let totalPRs = 0;
      const overloadNotes = [];
      const plan = ctx.state.plan;

      for (const ex of aw.exercises) {
        // Melhor 1RM histórico
        let bestHist = 0;
        for (const s of ctx.state.sessions) {
          const prevEx = (s.exercises || []).find((pe) => pe.exerciseId === ex.exerciseId);
          for (const ps of prevEx?.sets || []) {
            if ((ps.estimated1RM || 0) > bestHist) bestHist = ps.estimated1RM;
          }
        }
        const evalRes = evaluateProgressiveOverload(ex, ex.sets, bestHist);
        totalPRs += evalRes.prCount;
        if (evalRes.advice) overloadNotes.push({ name: ex.namePt, advice: evalRes.advice, nextLoad: evalRes.nextSuggestedLoadKg });

        // Atualiza carga sugerida no plano semanal automaticamente
        if (!aw.isTransient && plan) {
          const day = plan.days.find((d) => d.dayId === aw.planDayId);
          const planItem = day?.items.find((i) => i.exerciseId === ex.exerciseId);
          if (planItem && evalRes.nextSuggestedLoadKg > 0) {
            planItem.suggestedLoadKg = evalRes.nextSuggestedLoadKg;
          }
        }
      }

      const finalSession = {
        ...aw,
        finishedAt: Date.now(),
        durationSec: Math.max(60, stats.elapsedSec),
        totalVolumeKg: stats.volume,
        totalSets: stats.completedSets,
        estimatedKcal: stats.kcal,
        prCount: totalPRs
      };

      await db.saveSession(finalSession);
      if (!aw.isTransient && plan) await db.savePlan(plan);
      ctx.actions.stopRestTimer();
      ctx.state.activeWorkout = null;
      Haptics.success();
      await ctx.actions.refreshData();
      ActiveWorkoutView.openPostWorkoutStudio(finalSession, overloadNotes, ctx);
    });
  },

  openPostWorkoutStudio(session, overloadNotes, ctx) {
    const unit = ctx.state.profile.unitSystem;
    let photoImg = null;
    let mode = 'card';

    ctx.actions.openModal(`
      <div style="text-align:center">
        <div class="badge badge-pr" style="margin-bottom:8px">${ICONS.trophy} Treino Concluído!</div>
        <h3 class="display-title" style="font-size:24px">${session.dayTitle}</h3>
        <p style="color:var(--text-secondary);font-size:13px;margin:4px 0 0">
          ${formatDurationClock(session.durationSec)} • ${formatVolume(session.totalVolumeKg, unit)} • ${session.prCount} PR(s)
        </p>
      </div>

      ${overloadNotes.length ? `
        <div class="card" style="padding:12px;display:flex;flex-direction:column;gap:6px;max-height:140px;overflow-y:auto">
          <span class="label-overline" style="color:var(--accent-primary)">Auto-Regulação (Próxima Sessão)</span>
          ${overloadNotes.slice(0, 4).map((n) => `<div style="font-size:12px"><strong>${n.name}:</strong> <span style="color:var(--text-secondary)">${n.advice}</span></div>`).join('')}
        </div>` : ''}

      <div style="display:flex;flex-direction:column;gap:8px">
        <div style="display:flex;justify-content:space-between;align-items:center">
          <span class="label-overline">Estúdio de Card Social</span>
          <div style="display:flex;gap:6px">
            <button class="chip is-active" data-sc-mode="card">Card</button>
            <button class="chip" data-sc-mode="sticker">Sticker PNG</button>
          </div>
        </div>
        <canvas data-sc-canvas style="width:100%;max-height:280px;object-fit:contain;border-radius:14px;background:repeating-conic-gradient(#181c24 0% 25%, #101318 0% 50%) 50% / 16px 16px"></canvas>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">
          <label class="btn btn-secondary" style="min-height:44px;font-size:13px;cursor:pointer">
            ${ICONS.camera} Foto
            <input type="file" accept="image/*" style="display:none" data-sc-photo />
          </label>
          <button class="btn btn-primary" style="min-height:44px;font-size:13px" data-sc-download>${ICONS.share} Baixar PNG</button>
        </div>
      </div>`, (modal) => {
      const canvas = modal.querySelector('[data-sc-canvas]');
      const redraw = () => renderSocialCardCanvas(canvas, { session, photoImg, unitSystem: unit, mode });
      redraw();

      modal.querySelectorAll('[data-sc-mode]').forEach((b) => {
        b.addEventListener('click', () => {
          mode = b.dataset.scMode;
          modal.querySelectorAll('[data-sc-mode]').forEach((x) => x.classList.toggle('is-active', x === b));
          redraw();
        });
      });

      modal.querySelector('[data-sc-photo]').addEventListener('change', (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const img = new Image();
        img.onload = () => { photoImg = img; mode = 'card'; redraw(); };
        img.src = URL.createObjectURL(file);
      });

      modal.querySelector('[data-sc-download]').addEventListener('click', () => {
        const link = document.createElement('a');
        link.download = `forjefit-${Date.now()}.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
        ctx.actions.toast('Card PNG salvo para compartilhar nos Stories!', 'success');
      });
    });
  }
};
