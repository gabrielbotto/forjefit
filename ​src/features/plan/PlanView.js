import { ICONS, renderAnatomySVG } from '../../core/ui/visuals.js';
import { formatWeight } from '../../core/utils/formatters.js';
import { Haptics } from '../../core/utils/haptics.js';
import { db, STORES } from '../../data/db/ForjeDB.js';
import { MUSCLE_GROUPS } from '../../data/seed/exercisesSeed.js';
import { calibrateInitialLoadKg, generateWorkoutPlan } from '../../domain/BiomechanicsEngine.js';

const muscleMap = Object.fromEntries(MUSCLE_GROUPS.map((m) => [m.id, m]));

export const PlanView = {
  render(ctx) {
    const { profile, plan, sessions, selectedDayIndex, catalog } = ctx.state;
    if (!plan || !plan.days?.length) {
      return `<main class="screen-scroll"><div class="card">Nenhum plano ativo. <button class="btn btn-primary" data-regen-plan>Gerar Plano</button></div></main>`;
    }

    const dayIdx = Math.min(selectedDayIndex, plan.days.length - 1);
    const currentDay = plan.days[dayIdx];
    const weekAgo = Date.now() - 7 * 86400000;
    const completedDayIds = new Set(sessions.filter((s) => s.startedAt >= weekAgo).map((s) => s.planDayId));
    const catalogById = Object.fromEntries(catalog.map((c) => [c.id, c]));

    return `
      <header class="top-app-bar">
        <div style="display:flex;align-items:center;gap:10px;min-width:0">
          <div style="min-width:0">
            <div class="label-overline" style="color:var(--accent-primary)">ForjeFit</div>
            <h1 class="display-title" style="font-size:19px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${plan.name}</h1>
          </div>
        </div>
        <div style="display:flex;align-items:center;gap:8px">
          <button class="badge badge-pro" data-open-paywall style="cursor:pointer">${profile.planTier === 'PRO' ? 'PRO ATIVO' : 'UPGRADE PRO'}</button>
          <button class="btn-icon" data-plan-settings aria-label="Ajustes do Plano">${ICONS.settings}</button>
        </div>
      </header>

      <main class="screen-scroll" style="padding-bottom:calc(168px + var(--safe-bottom))">
        <!-- Seletor de Dias -->
        <div style="display:flex;gap:8px;overflow-x:auto;padding-bottom:4px;scrollbar-width:none">
          ${plan.days.map((d, idx) => {
            const done = completedDayIds.has(d.dayId);
            const active = idx === dayIdx;
            return `
              <button class="chip ${active ? 'is-active' : ''}" data-select-day="${idx}" style="flex-shrink:0;display:flex;align-items:center;gap:6px">
                <span>DIA ${d.dayNumber}</span>
                ${done ? `<span style="color:var(--semantic-success)">✓</span>` : ''}
              </button>`;
          }).join('')}
        </div>

        <!-- Cabeçalho do Dia -->
        <div class="card-elevated" style="display:flex;align-items:center;justify-content:space-between;gap:12px">
          <div>
            <div class="label-overline">Treino do Dia • Semana ${plan.currentWeek || 1}</div>
            <h2 class="display-title" style="font-size:22px;margin-top:2px">${currentDay.title}</h2>
            <div style="font-size:12px;color:var(--text-secondary);margin-top:4px">
              ${currentDay.items.length} exercícios • ~${plan.sessionDurationMin} min
            </div>
          </div>
          <div style="width:44px;flex-shrink:0">
            ${renderAnatomySVG({
              colorMap: Object.fromEntries(currentDay.targetMuscles.map((m) => [m, '#FF5F00'])),
              side: muscleMap[currentDay.targetMuscles[0]]?.view || 'front',
              width: 44
            })}
          </div>
        </div>

        <!-- Lista de Exercícios -->
        <div style="display:flex;flex-direction:column;gap:10px">
          ${currentDay.items.map((item, idx) => {
            const cat = catalogById[item.exerciseId];
            const mInfo = muscleMap[item.primaryMuscle] || { name: item.primaryMuscle, view: 'front' };
            const loadTxt = item.trackingType === 'WEIGHT_REPS'
              ? ` • Alvo: <strong class="tnum" style="color:var(--text-primary)">${formatWeight(item.suggestedLoadKg, profile.unitSystem)}</strong>`
              : item.trackingType === 'DURATION_SECONDS' ? ' • Isometria' : ' • Peso Corporal';
            return `
              <div class="card" style="display:flex;align-items:center;gap:12px;padding:12px 14px">
                <div style="width:36px;flex-shrink:0;cursor:pointer" data-ex-detail="${item.exerciseId}">
                  ${renderAnatomySVG({ colorMap: { [item.primaryMuscle]: '#FF5F00' }, side: mInfo.view, width: 36 })}
                </div>
                <div style="flex:1;min-width:0;cursor:pointer" data-ex-detail="${item.exerciseId}">
                  <div style="font-weight:700;font-size:15px">${item.namePt}</div>
                  <div style="font-size:12px;color:var(--text-secondary);margin-top:3px">
                    <span class="tnum">${item.targetSets}×${item.targetRepRange}</span>${loadTxt}
                  </div>
                  <div style="display:flex;flex-wrap:wrap;gap:6px;margin-top:6px">
                    <span class="badge" style="background:var(--bg-base);color:var(--text-secondary)">${mInfo.name}</span>
                    ${item.hasWarmupSets ? `<span class="badge badge-warmup">C/ Aquecimento</span>` : ''}
                    ${item.isOptional ? `<span class="badge badge-optional">Opcional</span>` : ''}
                  </div>
                  ${cat?.userTechnicalNote ? `<div style="font-size:11px;color:var(--semantic-info);margin-top:5px">Nota: ${cat.userTechnicalNote}</div>` : ''}
                </div>
                <button class="btn-icon" data-item-menu="${idx}" aria-label="Opções">${ICONS.more}</button>
              </div>`;
          }).join('')}
        </div>

        <!-- Ações de Rodapé da Lista -->
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">
          <button class="btn btn-secondary" style="min-height:44px;font-size:13px" data-add-exercise>${ICONS.plus} Exercício</button>
          <button class="btn btn-secondary" style="min-height:44px;font-size:13px" data-open-cardio>Registrar Cardio</button>
        </div>
        <button class="btn btn-secondary btn-full" style="min-height:44px;font-size:13px" data-retroactive-log>
          Registrar Treino Retroativo (Já Fiz Hoje)
        </button>
      </main>`;
  },

  bind(root, ctx) {
    const { plan, profile, catalog, selectedDayIndex } = ctx.state;
    const currentDay = plan?.days?.[Math.min(selectedDayIndex, (plan?.days?.length || 1) - 1)];

    root.querySelectorAll('[data-select-day]').forEach((btn) => {
      btn.addEventListener('click', () => {
        Haptics.light();
        ctx.state.selectedDayIndex = Number(btn.dataset.selectDay);
        ctx.actions.render();
      });
    });

    root.querySelector('[data-open-paywall]')?.addEventListener('click', () => ctx.actions.openPaywallModal());
    root.querySelector('[data-open-cardio]')?.addEventListener('click', () => ctx.actions.openCardioModal());

    root.querySelectorAll('[data-ex-detail]').forEach((el) => {
      el.addEventListener('click', () => ctx.actions.openExerciseDetail(el.dataset.exDetail));
    });

    // Ajustes do Plano (Regenerar split / alterar dias)
    root.querySelector('[data-plan-settings]')?.addEventListener('click', () => {
      ctx.actions.openModal(`
        <h3 class="display-title" style="font-size:20px">Ajustes do Plano</h3>
        <div style="display:flex;flex-direction:column;gap:10px">
          <label class="label-overline">Frequência Semanal</label>
          <div style="display:grid;grid-template-columns:repeat(6,1fr);gap:6px">
            ${[1, 2, 3, 4, 5, 6].map((d) => `<button class="chip ${profile.daysPerWeek === d ? 'is-active' : ''}" data-set-days="${d}">${d}x</button>`).join('')}
          </div>
          <button class="btn btn-primary btn-full" data-do-regen style="margin-top:8px">Regenerar Divisão Inteligente</button>
        </div>`, (modal) => {
        let chosenDays = profile.daysPerWeek || 4;
        modal.querySelectorAll('[data-set-days]').forEach((b) => {
          b.addEventListener('click', () => {
            chosenDays = Number(b.dataset.setDays);
            modal.querySelectorAll('[data-set-days]').forEach((x) => x.classList.toggle('is-active', x === b));
          });
        });
        modal.querySelector('[data-do-regen]').addEventListener('click', async () => {
          Haptics.medium();
          const updatedProfile = { ...profile, daysPerWeek: chosenDays };
          const newPlan = generateWorkoutPlan(updatedProfile, catalog);
          await db.saveProfile(updatedProfile);
          await db.savePlan({ ...newPlan, id: plan.id });
          ctx.state.selectedDayIndex = 0;
          ctx.actions.closeModal();
          ctx.actions.toast('Plano regenerado conforme seu perfil!', 'success');
          await ctx.actions.refreshData();
        });
      });
    });

    // Menu de Opções de Exercício (Substituir, Nota, Mover, Remover)
    root.querySelectorAll('[data-item-menu]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const idx = Number(btn.dataset.itemMenu);
        const item = currentDay.items[idx];
        const cat = catalog.find((c) => c.id === item.exerciseId);
        const equivalents = catalog.filter((c) => c.primaryMuscle === item.primaryMuscle && c.id !== item.exerciseId);

        ctx.actions.openModal(`
          <h3 class="display-title" style="font-size:19px">${item.namePt}</h3>
          <div style="display:flex;flex-direction:column;gap:8px">
            <label class="label-overline">Nota Técnica Pessoal (ex.: banco furo 4)</label>
            <div style="display:flex;gap:8px">
              <input class="input-field" data-tech-note value="${cat?.userTechnicalNote || ''}" placeholder="Ajuste do aparelho ou dica..."/>
              <button class="btn btn-primary" style="min-height:44px;padding:0 16px" data-save-note>OK</button>
            </div>
          </div>
          ${equivalents.length ? `
            <div style="display:flex;flex-direction:column;gap:6px">
              <span class="label-overline">Substituir por Equivalente Biomecânico</span>
              <div style="display:flex;flex-direction:column;gap:6px;max-height:170px;overflow-y:auto">
                ${equivalents.map((eq) => `<button class="btn btn-secondary btn-full" style="min-height:42px;justify-content:flex-start;font-size:13px" data-swap-to="${eq.id}">${ICONS.swap} ${eq.namePt}</button>`).join('')}
              </div>
            </div>` : ''}
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">
            <button class="btn btn-secondary" style="min-height:42px;font-size:13px" data-move="-1" ${idx === 0 ? 'disabled' : ''}>↑ Subir</button>
            <button class="btn btn-secondary" style="min-height:42px;font-size:13px" data-move="1" ${idx === currentDay.items.length - 1 ? 'disabled' : ''}>↓ Descer</button>
          </div>
          <button class="btn btn-danger btn-full" style="min-height:44px" data-remove-item>Remover do Dia</button>`,
        (modal) => {
          modal.querySelector('[data-save-note]').addEventListener('click', async () => {
            const val = modal.querySelector('[data-tech-note]').value.trim();
            if (cat) await db.put(STORES.EXERCISES, { ...cat, userTechnicalNote: val });
            ctx.actions.closeModal();
            ctx.actions.toast('Nota técnica salva!', 'success');
            await ctx.actions.refreshData();
          });

          modal.querySelectorAll('[data-swap-to]').forEach((b) => {
            b.addEventListener('click', async () => {
              const target = catalog.find((c) => c.id === b.dataset.swapTo);
              if (!target) return;
              currentDay.items[idx] = {
                ...item,
                exerciseId: target.id,
                namePt: target.namePt,
                secondaryMuscles: target.secondaryMuscles,
                trackingType: target.trackingType,
                suggestedLoadKg: calibrateInitialLoadKg(target, profile)
              };
              await db.savePlan(plan);
              ctx.actions.closeModal();
              ctx.actions.toast(`Substituído por ${target.namePt}`, 'success');
              await ctx.actions.refreshData();
            });
          });

          modal.querySelectorAll('[data-move]').forEach((b) => {
            b.addEventListener('click', async () => {
              const dir = Number(b.dataset.move);
              const swapIdx = idx + dir;
              if (swapIdx < 0 || swapIdx >= currentDay.items.length) return;
              [currentDay.items[idx], currentDay.items[swapIdx]] = [currentDay.items[swapIdx], currentDay.items[idx]];
              await db.savePlan(plan);
              ctx.actions.closeModal();
              await ctx.actions.refreshData();
            });
          });

          modal.querySelector('[data-remove-item]').addEventListener('click', async () => {
            currentDay.items.splice(idx, 1);
            await db.savePlan(plan);
            ctx.actions.closeModal();
            ctx.actions.toast('Exercício removido do dia.');
            await ctx.actions.refreshData();
          });
        });
      });
    });

    // Adicionar exercício ao dia
    root.querySelector('[data-add-exercise]')?.addEventListener('click', () => {
      ctx.actions.openModal(`
        <h3 class="display-title" style="font-size:20px">Adicionar ao ${currentDay.title}</h3>
        <input class="input-field" data-add-search placeholder="Buscar exercício..." />
        <div data-add-list style="display:flex;flex-direction:column;gap:6px;max-height:320px;overflow-y:auto"></div>`,
      (modal) => {
        const listEl = modal.querySelector('[data-add-list]');
        const renderList = (q = '') => {
          const filtered = catalog.filter((e) => e.namePt.toLowerCase().includes(q.toLowerCase())).slice(0, 25);
          listEl.innerHTML = filtered.map((e) => `
            <button class="card card-interactive" style="text-align:left;padding:12px" data-pick-ex="${e.id}">
              <strong>${e.namePt}</strong>
              <div style="font-size:12px;color:var(--text-secondary)">${muscleMap[e.primaryMuscle]?.name || e.primaryMuscle}</div>
            </button>`).join('');
          listEl.querySelectorAll('[data-pick-ex]').forEach((b) => {
            b.addEventListener('click', async () => {
              const chosen = catalog.find((c) => c.id === b.dataset.pickEx);
              if (!chosen) return;
              currentDay.items.push({
                itemId: `item_${Date.now()}`,
                exerciseId: chosen.id,
                namePt: chosen.namePt,
                primaryMuscle: chosen.primaryMuscle,
                secondaryMuscles: chosen.secondaryMuscles,
                movementPattern: chosen.movementPattern,
                trackingType: chosen.trackingType,
                isCompound: chosen.isCompound,
                hasWarmupSets: false,
                isOptional: false,
                targetSets: 3,
                targetRepRange: chosen.trackingType === 'DURATION_SECONDS' ? '45s' : '10-12',
                restSeconds: 75,
                suggestedLoadKg: calibrateInitialLoadKg(chosen, profile),
                orderIndex: currentDay.items.length
              });
              await db.savePlan(plan);
              ctx.actions.closeModal();
              ctx.actions.toast(`${chosen.namePt} adicionado!`, 'success');
              await ctx.actions.refreshData();
            });
          });
        };
        renderList();
        modal.querySelector('[data-add-search]').addEventListener('input', (e) => renderList(e.target.value));
      });
    });

    // Registro Retroativo Rápido
    root.querySelector('[data-retroactive-log]')?.addEventListener('click', async () => {
      Haptics.success();
      const now = Date.now();
      let totalVol = 0;
      let totalSets = 0;
      const loggedExercises = currentDay.items.map((item) => {
        const sets = [];
        for (let i = 1; i <= item.targetSets; i++) {
          const reps = item.trackingType === 'DURATION_SECONDS' ? 0 : 10;
          const dur = item.trackingType === 'DURATION_SECONDS' ? 45 : 0;
          const wt = item.suggestedLoadKg || 0;
          totalVol += wt * reps;
          totalSets++;
          sets.push({ setNumber: i, setType: 'WORKING', weightKg: wt, reps, durationSec: dur, rir: 2, isCompleted: true });
        }
        return { ...item, sets };
      });
      await db.saveSession({
        sessionId: `sess_${now}`,
        planDayId: currentDay.dayId,
        dayTitle: currentDay.title,
        startedAt: now - (plan.sessionDurationMin || 45) * 60000,
        finishedAt: now,
        durationSec: (plan.sessionDurationMin || 45) * 60,
        totalVolumeKg: Math.round(totalVol),
        totalSets,
        estimatedKcal: Math.round((plan.sessionDurationMin || 45) * 6.5),
        prCount: 0,
        isRetroactive: true,
        exercises: loggedExercises
      });
      ctx.actions.toast('Treino retroativo registrado no seu Progresso!', 'success');
      await ctx.actions.refreshData();
    });
  }
};
