import { ICONS } from '../../core/ui/visuals.js';
import { Haptics } from '../../core/utils/haptics.js';
import { MUSCLE_GROUPS } from '../../data/seed/exercisesSeed.js';
import { generateQuickWorkout } from '../../domain/BiomechanicsEngine.js';

const quickState = {
  durationMin: 35,
  difficulty: 'INTERMEDIATE',
  equipmentProfile: 'FULL_GYM',
  includeCardio: false,
  selectedMuscles: ['peito', 'ombros', 'triceps']
};

const CURATED_TEMPLATES = [
  { id: 'tpl_upper', title: 'Superior Pump 30m', durationMin: 30, muscles: ['peito', 'costas', 'ombros', 'biceps', 'triceps'], cardio: false },
  { id: 'tpl_legs', title: 'Inferior Pesado 45m', durationMin: 45, muscles: ['quadriceps', 'posteriores', 'gluteos', 'panturrilhas'], cardio: false },
  { id: 'tpl_core', title: 'Core de Aço + Cardio', durationMin: 25, muscles: ['abdomen', 'obliquos', 'lombar'], cardio: true },
  { id: 'tpl_home', title: 'Expresso Peso Corporal', durationMin: 25, muscles: ['peito', 'costas', 'quadriceps', 'abdomen'], cardio: false, equip: 'BODYWEIGHT' }
];

export const ExploreView = {
  render() {
    const selectable = MUSCLE_GROUPS.filter((m) => m.id !== 'cardio');
    const allSelected = quickState.selectedMuscles.length === selectable.length;

    return `
      <header class="top-app-bar">
        <h1 class="display-title" style="font-size:21px">Treinos & Explorar</h1>
        <button class="chip is-active" data-open-cardio>${ICONS.flame} + Cardio</button>
      </header>

      <main class="screen-scroll">
        <!-- Prateleira de Treinos Prontos -->
        <section style="display:flex;flex-direction:column;gap:8px">
          <span class="label-overline">Sessões Prontas (Não alteram seu plano)</span>
          <div style="display:flex;gap:10px;overflow-x:auto;padding-bottom:4px;scrollbar-width:none">
            ${CURATED_TEMPLATES.map((t) => `
              <div class="card card-interactive" style="min-width:210px;flex-shrink:0;display:flex;flex-direction:column;justify-content:space-between;gap:10px" data-run-tpl="${t.id}">
                <div>
                  <span class="badge badge-pro">${t.durationMin} min</span>
                  <div style="font-weight:700;font-size:16px;margin-top:8px">${t.title}</div>
                </div>
                <div style="font-size:12px;color:var(--accent-primary);font-weight:600">Iniciar sessão →</div>
              </div>`).join('')}
          </div>
        </section>

        <!-- Construtor de Treino Rápido (On-Demand) -->
        <section class="card-elevated" style="display:flex;flex-direction:column;gap:14px">
          <div>
            <span class="label-overline" style="color:var(--accent-primary)">On-Demand</span>
            <h2 class="display-title" style="font-size:21px;margin-top:2px">Construtor de Treino Rápido</h2>
          </div>

          <div>
            <span class="label-overline">Duração</span>
            <div class="chip-group" style="margin-top:6px">
              ${[20, 35, 45, 60].map((m) => `<button class="chip ${quickState.durationMin === m ? 'is-active' : ''}" data-q-set="durationMin:${m}">${m} min</button>`).join('')}
            </div>
          </div>

          <div>
            <span class="label-overline">Ambiente</span>
            <div class="chip-group" style="margin-top:6px">
              ${[
                { id: 'FULL_GYM', l: 'Academia' },
                { id: 'HOME_GYM', l: 'Casa' },
                { id: 'BODYWEIGHT', l: 'Sem Equip.' }
              ].map((e) => `<button class="chip ${quickState.equipmentProfile === e.id ? 'is-active' : ''}" data-q-set="equipmentProfile:${e.id}">${e.l}</button>`).join('')}
            </div>
          </div>

          <label style="display:flex;align-items:center;justify-content:space-between;background:var(--bg-base);padding:12px;border-radius:12px">
            <span style="font-weight:600;font-size:14px">Adicionar Cardio no Final</span>
            <input type="checkbox" ${quickState.includeCardio ? 'checked' : ''} data-q-cardio style="accent-color:var(--accent-primary);width:18px;height:18px" />
          </label>

          <div>
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
              <span class="label-overline">Grupos Musculares</span>
              <button class="chip ${allSelected ? 'is-active' : ''}" style="padding:5px 10px;font-size:11px" data-q-fullbody>Corpo Todo</button>
            </div>
            <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:6px">
              ${selectable.map((m) => {
                const active = quickState.selectedMuscles.includes(m.id);
                return `<button class="chip ${active ? 'is-active' : ''}" style="padding:9px 4px;font-size:11.5px;text-align:center" data-q-muscle="${m.id}">${m.name}</button>`;
              }).join('')}
            </div>
          </div>

          <button class="btn btn-primary btn-full" data-q-launch>${ICONS.play} GERAR E INICIAR TREINO</button>
        </section>
      </main>`;
  },

  bind(root, ctx) {
    root.querySelector('[data-open-cardio]')?.addEventListener('click', () => ctx.actions.openCardioModal());

    root.querySelectorAll('[data-run-tpl]').forEach((card) => {
      card.addEventListener('click', () => {
        Haptics.medium();
        const tpl = CURATED_TEMPLATES.find((t) => t.id === card.dataset.runTpl);
        const quickDay = generateQuickWorkout({
          durationMin: tpl.durationMin,
          difficulty: ctx.state.profile.experienceLevel,
          equipmentProfile: tpl.equip || ctx.state.profile.equipmentProfile,
          targetMuscles: tpl.muscles,
          includeCardio: tpl.cardio
        }, ctx.state.profile, ctx.state.catalog);
        quickDay.title = tpl.title;
        ctx.actions.startWorkout(quickDay);
      });
    });

    root.querySelectorAll('[data-q-set]').forEach((b) => {
      b.addEventListener('click', () => {
        Haptics.light();
        const [k, v] = b.dataset.qSet.split(':');
        quickState[k] = isNaN(Number(v)) ? v : Number(v);
        ctx.actions.render();
      });
    });

    root.querySelector('[data-q-cardio]')?.addEventListener('change', (e) => {
      quickState.includeCardio = e.target.checked;
    });

    root.querySelector('[data-q-fullbody]')?.addEventListener('click', () => {
      Haptics.light();
      const all = MUSCLE_GROUPS.filter((m) => m.id !== 'cardio').map((m) => m.id);
      quickState.selectedMuscles = quickState.selectedMuscles.length === all.length ? ['peito', 'costas', 'quadriceps'] : all;
      ctx.actions.render();
    });

    root.querySelectorAll('[data-q-muscle]').forEach((b) => {
      b.addEventListener('click', () => {
        Haptics.light();
        const id = b.dataset.qMuscle;
        const set = new Set(quickState.selectedMuscles);
        if (set.has(id)) set.delete(id); else set.add(id);
        quickState.selectedMuscles = [...set];
        ctx.actions.render();
      });
    });

    root.querySelector('[data-q-launch]')?.addEventListener('click', () => {
      if (quickState.selectedMuscles.length === 0) {
        ctx.actions.toast('Selecione ao menos 1 grupo muscular.', 'danger');
        return;
      }
      Haptics.medium();
      const quickDay = generateQuickWorkout({
        durationMin: quickState.durationMin,
        difficulty: ctx.state.profile.experienceLevel,
        equipmentProfile: quickState.equipmentProfile,
        targetMuscles: quickState.selectedMuscles,
        includeCardio: quickState.includeCardio
      }, ctx.state.profile, ctx.state.catalog);

      if (!quickDay.items.length) {
        ctx.actions.toast('Nenhum exercício encontrado para esse filtro. Tente ampliar o ambiente.', 'danger');
        return;
      }
      ctx.actions.startWorkout(quickDay);
    });
  }
};
