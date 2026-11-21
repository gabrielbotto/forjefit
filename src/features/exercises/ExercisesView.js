import { ICONS, render1RMChartSVG, renderAnatomySVG } from '../../core/ui/visuals.js';
import { normalizeText } from '../../core/utils/formatters.js';
import { Haptics } from '../../core/utils/haptics.js';
import { db, STORES } from '../../data/db/ForjeDB.js';
import { EQUIPMENT_LIST, MUSCLE_GROUPS } from '../../data/seed/exercisesSeed.js';
import { calibrateInitialLoadKg } from '../../domain/BiomechanicsEngine.js';

const ui = {
  query: '',
  tab: 'MUSCLE', // MUSCLE | EQUIPMENT | FAVORITES
  activeMuscle: null,
  activeEquipment: null
};

const muscleLookup = Object.fromEntries(MUSCLE_GROUPS.map((m) => [m.id, m]));
const equipLookup = Object.fromEntries(EQUIPMENT_LIST.map((e) => [e.id, e.name]));

const LENS_GUIDES = [
  { id: 'machine', name: 'Máquina Guiada / Leg Press / Peck Deck', setup: 'Alinhe o eixo articulado da máquina com a articulação principal (joelho ou ombro) e ajuste o banco para amplitude sem perder a curvatura lombar.', muscles: ['peito', 'quadriceps', 'costas'] },
  { id: 'cable', name: 'Polia / Crossover / Puxador', setup: 'Posicione a polia na linha de tração do músculo alvo. Mantenha o tronco firme para evitar balanço de inércia.', muscles: ['costas', 'triceps', 'ombros', 'biceps'] },
  { id: 'barbell', name: 'Barra Olímpica / Banco de Supino / Rack', setup: 'Ajuste os pinos de segurança na altura do peito/quadril e confira o travamento das presilhas nas anilhas.', muscles: ['peito', 'quadriceps', 'posteriores', 'costas'] },
  { id: 'dumbbell', name: 'Estação de Halteres & Banco Regulável', setup: 'Trave o pino do encosto (0° reto, 30°-45° inclinado) e apoie bem os dois pés no chão antes de iniciar.', muscles: ['ombros', 'peito', 'biceps', 'costas'] }
];

export const ExercisesView = {
  render(ctx) {
    const { catalog } = ctx.state;
    const normQ = normalizeText(ui.query.trim());

    let content = '';
    if (normQ) {
      const matches = catalog.filter((e) =>
        normalizeText(e.namePt).includes(normQ) ||
        normalizeText(muscleLookup[e.primaryMuscle]?.name).includes(normQ)
      );
      content = renderExerciseRows(matches);
    } else if (ui.tab === 'FAVORITES') {
      const favs = catalog.filter((e) => e.isFavorite);
      content = favs.length ? renderExerciseRows(favs) : `<div class="card" style="text-align:center;color:var(--text-secondary)">Toque no coração dentro de qualquer exercício para salvar seus favoritos aqui.</div>`;
    } else if (ui.tab === 'EQUIPMENT') {
      if (ui.activeEquipment) {
        const list = catalog.filter((e) => e.equipmentType === ui.activeEquipment);
        content = `
          <button class="chip" data-clear-filter>← Todos os Equipamentos</button>
          <h3 class="display-title" style="font-size:18px">${equipLookup[ui.activeEquipment] || ui.activeEquipment} (${list.length})</h3>
          ${renderExerciseRows(list)}`;
      } else {
        content = EQUIPMENT_LIST.map((eq) => {
          const count = catalog.filter((e) => e.equipmentType === eq.id).length;
          return `
            <div class="card card-interactive" style="display:flex;justify-content:space-between;align-items:center" data-pick-eq="${eq.id}">
              <strong>${eq.name}</strong>
              <span class="badge" style="background:var(--bg-base);color:var(--accent-primary)">${count}</span>
            </div>`;
        }).join('');
      }
    } else {
      if (ui.activeMuscle) {
        const list = catalog.filter((e) => e.primaryMuscle === ui.activeMuscle);
        content = `
          <button class="chip" data-clear-filter>← Todas as Categorias</button>
          <h3 class="display-title" style="font-size:18px">${muscleLookup[ui.activeMuscle]?.name} (${list.length})</h3>
          ${renderExerciseRows(list)}`;
      } else {
        content = MUSCLE_GROUPS.map((mg) => {
          const count = catalog.filter((e) => e.primaryMuscle === mg.id).length;
          return `
            <div class="card card-interactive" style="display:flex;align-items:center;gap:12px;padding:12px 14px" data-pick-mg="${mg.id}">
              <div style="width:32px;flex-shrink:0">
                ${renderAnatomySVG({ colorMap: { [mg.id]: '#FF5F00' }, side: mg.view, width: 32 })}
              </div>
              <div style="flex:1">
                <strong>${mg.name}</strong>
                <div style="font-size:12px;color:var(--text-secondary)">${count} exercícios mapeados</div>
              </div>
              <span style="color:var(--text-secondary)">›</span>
            </div>`;
        }).join('');
      }
    }

    return `
      <header class="top-app-bar">
        <h1 class="display-title" style="font-size:21px">Exercícios</h1>
        <button class="chip is-active" data-create-ex>${ICONS.plus} Criar</button>
      </header>

      <main class="screen-scroll">
        <input class="input-field" type="search" value="${ui.query}" placeholder="Buscar exercício ou músculo (ex.: supino, ombro)..." data-ex-search />

        <!-- ForjeFit Lens (Scanner de Aparelhos IA) -->
        <div class="card-elevated card-interactive" data-open-lens style="display:flex;align-items:center;justify-content:space-between;gap:12px;border-color:rgba(255,95,0,0.45)">
          <div>
            <span class="badge badge-pro">${ICONS.camera} ForjeFit Lens</span>
            <div style="font-weight:700;font-size:16px;margin-top:6px">Scanner de Aparelhos</div>
            <div style="font-size:12px;color:var(--text-secondary)">Fotografe qualquer máquina para ver regulagem e exercícios compatíveis.</div>
          </div>
          <div class="btn-icon" style="background:var(--accent-soft);color:var(--accent-primary)">${ICONS.camera}</div>
        </div>

        <div class="chip-group">
          <button class="chip ${ui.tab === 'MUSCLE' ? 'is-active' : ''}" data-ex-tab="MUSCLE">Por Músculo</button>
          <button class="chip ${ui.tab === 'EQUIPMENT' ? 'is-active' : ''}" data-ex-tab="EQUIPMENT">Equipamentos</button>
          <button class="chip ${ui.tab === 'FAVORITES' ? 'is-active' : ''}" data-ex-tab="FAVORITES">Favoritos</button>
        </div>

        <div style="display:flex;flex-direction:column;gap:8px">${content}</div>
      </main>`;
  },

  bind(root, ctx) {
    root.querySelector('[data-ex-search]')?.addEventListener('input', (e) => {
      ui.query = e.target.value;
      ctx.actions.render();
      const input = document.querySelector('[data-ex-search]');
      if (input) { input.focus(); input.setSelectionRange(input.value.length, input.value.length); }
    });

    root.querySelectorAll('[data-ex-tab]').forEach((b) => {
      b.addEventListener('click', () => {
        Haptics.light();
        ui.tab = b.dataset.exTab;
        ui.activeMuscle = null;
        ui.activeEquipment = null;
        ctx.actions.render();
      });
    });

    root.querySelectorAll('[data-pick-mg]').forEach((el) => {
      el.addEventListener('click', () => {
        Haptics.light();
        ui.activeMuscle = el.dataset.pickMg;
        ctx.actions.render();
      });
    });

    root.querySelectorAll('[data-pick-eq]').forEach((el) => {
      el.addEventListener('click', () => {
        Haptics.light();
        ui.activeEquipment = el.dataset.pickEq;
        ctx.actions.render();
      });
    });

    root.querySelector('[data-clear-filter]')?.addEventListener('click', () => {
      ui.activeMuscle = null;
      ui.activeEquipment = null;
      ctx.actions.render();
    });

    root.querySelectorAll('[data-open-ex]').forEach((el) => {
      el.addEventListener('click', () => openExerciseDetailModal(el.dataset.openEx, ctx));
    });

    root.querySelector('[data-open-lens]')?.addEventListener('click', () => openLensModal(ctx));
    root.querySelector('[data-create-ex]')?.addEventListener('click', () => openCreateExerciseModal(ctx));
  }
};

function renderExerciseRows(list) {
  if (!list.length) return `<div class="card" style="text-align:center;color:var(--text-secondary)">Nenhum exercício encontrado.</div>`;
  return list.map((ex) => `
    <div class="card card-interactive" style="display:flex;align-items:center;justify-content:space-between;gap:10px;padding:12px 14px" data-open-ex="${ex.id}">
      <div style="min-width:0">
        <div style="font-weight:700;font-size:14.5px">${ex.namePt}</div>
        <div style="font-size:12px;color:var(--text-secondary)">${muscleLookup[ex.primaryMuscle]?.name || ex.primaryMuscle} • ${equipLookup[ex.equipmentType] || ex.equipmentType}</div>
      </div>
      <span style="color:${ex.isFavorite ? 'var(--accent-primary)' : 'var(--text-secondary)'}">${ex.isFavorite ? '♥' : '›'}</span>
    </div>`).join('');
}

export function openExerciseDetailModal(exerciseId, ctx) {
  const ex = ctx.state.catalog.find((c) => c.id === exerciseId);
  if (!ex) return;

  const colorMap = { [ex.primaryMuscle]: '#FF5F00' };
  (ex.secondaryMuscles || []).forEach((s) => { colorMap[s] = '#F59E0B'; });

  const rmPoints = [];
  for (const s of [...ctx.state.sessions].reverse()) {
    const found = (s.exercises || []).find((e) => e.exerciseId === ex.id);
    if (!found) continue;
    const best = Math.max(0, ...(found.sets || []).filter((st) => st.isCompleted).map((st) => st.estimated1RM || 0));
    if (best > 0) rmPoints.push({ label: new Date(s.startedAt).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }), value: best });
  }

  ctx.actions.openModal(`
    <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:10px">
      <div>
        <span class="badge badge-pro">${muscleLookup[ex.primaryMuscle]?.name || ex.primaryMuscle}</span>
        <h3 class="display-title" style="font-size:20px;margin-top:6px">${ex.namePt}</h3>
      </div>
      <button class="btn-icon" data-fav-toggle style="color:${ex.isFavorite ? 'var(--accent-primary)' : 'var(--text-secondary)'}">${ICONS.heart}</button>
    </div>

    <div class="card" style="padding:12px">
      ${renderAnatomySVG({ colorMap, side: 'both' })}
      <div style="text-align:center;font-size:11px;color:var(--text-secondary);margin-top:6px">
        <span style="color:#FF5F00">●</span> Primário &nbsp; <span style="color:#F59E0B">●</span> Sinergista (0.5x)
      </div>
    </div>

    <div class="card" style="padding:12px">
      <span class="label-overline">Execução Técnica</span>
      <ol style="margin:8px 0 0;padding-left:18px;font-size:13px;color:var(--text-secondary);display:flex;flex-direction:column;gap:4px">
        ${(ex.instructions || ['Execute com amplitude controlada e estabilidade articular.']).map((i) => `<li>${i}</li>`).join('')}
      </ol>
    </div>

    <div style="display:flex;flex-direction:column;gap:6px">
      <span class="label-overline">Sua Nota Técnica (Ex.: ajuste de banco/polia)</span>
      <div style="display:flex;gap:8px">
        <input class="input-field" data-detail-note value="${ex.userTechnicalNote || ''}" placeholder="Anote seu ajuste ideal..."/>
        <button class="btn btn-primary" style="min-height:44px;padding:0 16px" data-save-detail-note>Salvar</button>
      </div>
    </div>

    ${ex.trackingType === 'WEIGHT_REPS' ? `
      <div class="card" style="padding:12px">
        <span class="label-overline">Seu Histórico de 1RM</span>
        ${render1RMChartSVG(rmPoints.slice(-6), ctx.state.profile.unitSystem)}
      </div>` : ''}

    ${ctx.state.plan ? `<button class="btn btn-secondary btn-full" style="min-height:44px" data-add-to-current-day>${ICONS.plus} Adicionar ao Dia Atual do Plano</button>` : ''}`,
  (modal) => {
    modal.querySelector('[data-fav-toggle]').addEventListener('click', async () => {
      Haptics.light();
      await db.put(STORES.EXERCISES, { ...ex, isFavorite: !ex.isFavorite });
      ctx.actions.closeModal();
      await ctx.actions.refreshData();
      openExerciseDetailModal(ex.id, ctx);
    });

    modal.querySelector('[data-save-detail-note]').addEventListener('click', async () => {
      const note = modal.querySelector('[data-detail-note]').value.trim();
      await db.put(STORES.EXERCISES, { ...ex, userTechnicalNote: note });
      ctx.actions.toast('Nota técnica atualizada!', 'success');
      await ctx.actions.refreshData();
    });

    modal.querySelector('[data-add-to-current-day]')?.addEventListener('click', async () => {
      const plan = ctx.state.plan;
      const day = plan.days[ctx.state.selectedDayIndex] || plan.days[0];
      day.items.push({
        itemId: `item_${Date.now()}`,
        exerciseId: ex.id,
        namePt: ex.namePt,
        primaryMuscle: ex.primaryMuscle,
        secondaryMuscles: ex.secondaryMuscles,
        movementPattern: ex.movementPattern,
        trackingType: ex.trackingType,
        isCompound: ex.isCompound,
        hasWarmupSets: false,
        isOptional: false,
        targetSets: 3,
        targetRepRange: ex.trackingType === 'DURATION_SECONDS' ? '45s' : '10-12',
        restSeconds: 75,
        suggestedLoadKg: calibrateInitialLoadKg(ex, ctx.state.profile),
        orderIndex: day.items.length
      });
      await db.savePlan(plan);
      ctx.actions.closeModal();
      ctx.actions.toast(`Adicionado ao Dia ${day.dayNumber}!`, 'success');
      await ctx.actions.refreshData();
    });
  });
}

function openLensModal(ctx) {
  let selectedType = 'machine';
  let previewUrl = '';

  const drawGuide = (modal) => {
    const g = LENS_GUIDES.find((l) => l.id === selectedType) || LENS_GUIDES[0];
    const compat = ctx.state.catalog.filter((c) => c.equipmentType === selectedType).slice(0, 5);
    modal.querySelector('[data-lens-out]').innerHTML = `
      <div class="card" style="padding:12px;display:flex;flex-direction:column;gap:8px">
        <div style="font-weight:700;color:var(--accent-primary)">${g.name}</div>
        <div style="font-size:13px;color:var(--text-secondary)">${g.setup}</div>
        <span class="label-overline" style="margin-top:4px">Exercícios Compatíveis</span>
        ${compat.map((c) => `<button class="btn btn-secondary btn-full" style="min-height:40px;font-size:13px;justify-content:flex-start" data-lens-ex="${c.id}">${c.namePt}</button>`).join('')}
      </div>`;
    modal.querySelectorAll('[data-lens-ex]').forEach((b) => {
      b.addEventListener('click', () => {
        ctx.actions.closeModal();
        openExerciseDetailModal(b.dataset.lensEx, ctx);
      });
    });
  };

  ctx.actions.openModal(`
    <span class="badge badge-pro">${ICONS.camera} ForjeFit Lens</span>
    <h3 class="display-title" style="font-size:20px">Guia Rápido de Aparelho</h3>
    <label class="btn btn-primary btn-full" style="min-height:46px;cursor:pointer">
      ${ICONS.camera} Fotografar Aparelho na Academia
      <input type="file" accept="image/*" capture="environment" style="display:none" data-lens-file />
    </label>
    <img data-lens-preview style="display:none;width:100%;max-height:180px;object-fit:cover;border-radius:12px" alt="Preview do Aparelho" />
    <div>
      <span class="label-overline">Categoria Detectada / Selecionada</span>
      <div class="chip-group" style="margin-top:6px">
        ${LENS_GUIDES.map((g) => `<button class="chip ${g.id === selectedType ? 'is-active' : ''}" data-lens-type="${g.id}">${g.id === 'machine' ? 'Máquina' : g.id === 'cable' ? 'Polia' : g.id === 'barbell' ? 'Barra' : 'Halteres'}</button>`).join('')}
      </div>
    </div>
    <div data-lens-out></div>`,
  (modal) => {
    drawGuide(modal);
    modal.querySelector('[data-lens-file]').addEventListener('change', (e) => {
      const f = e.target.files?.[0];
      if (!f) return;
      previewUrl = URL.createObjectURL(f);
      const img = modal.querySelector('[data-lens-preview]');
      img.src = previewUrl;
      img.style.display = 'block';
      ctx.actions.toast('Foto capturada! Confira o guia de regulagem abaixo.', 'success');
    });
    modal.querySelectorAll('[data-lens-type]').forEach((b) => {
      b.addEventListener('click', () => {
        selectedType = b.dataset.lensType;
        modal.querySelectorAll('[data-lens-type]').forEach((x) => x.classList.toggle('is-active', x === b));
        drawGuide(modal);
      });
    });
  });
}

function openCreateExerciseModal(ctx) {
  ctx.actions.openModal(`
    <h3 class="display-title" style="font-size:20px">Criar Exercício Próprio</h3>
    <div style="display:flex;flex-direction:column;gap:10px">
      <input class="input-field" data-ce-name placeholder="Nome do exercício (ex.: Supino Declinado Smith)" />
      <select class="input-field" data-ce-muscle>
        ${MUSCLE_GROUPS.map((m) => `<option value="${m.id}">${m.name}</option>`).join('')}
      </select>
      <select class="input-field" data-ce-equip>
        ${EQUIPMENT_LIST.map((e) => `<option value="${e.id}">${e.name}</option>`).join('')}
      </select>
      <select class="input-field" data-ce-track>
        <option value="WEIGHT_REPS">Carga + Repetições</option>
        <option value="BODYWEIGHT_REPS">Peso Corporal + Reps</option>
        <option value="DURATION_SECONDS">Isometria (Segundos)</option>
      </select>
      <button class="btn btn-primary btn-full" data-ce-save>SALVAR EXERCÍCIO</button>
    </div>`,
  (modal) => {
    modal.querySelector('[data-ce-save]').addEventListener('click', async () => {
      const namePt = modal.querySelector('[data-ce-name]').value.trim();
      if (!namePt) { ctx.actions.toast('Digite o nome do exercício.', 'danger'); return; }
      const primaryMuscle = modal.querySelector('[data-ce-muscle]').value;
      const equipmentType = modal.querySelector('[data-ce-equip]').value;
      const trackingType = modal.querySelector('[data-ce-track]').value;
      const mg = muscleLookup[primaryMuscle] || { pattern: 'PUSH' };

      await db.put(STORES.EXERCISES, {
        id: `custom_${Date.now()}`,
        namePt,
        primaryMuscle,
        secondaryMuscles: [],
        movementPattern: mg.pattern,
        equipmentType,
        trackingType,
        isCompound: false,
        loadRatio: 0.3,
        contraindicatedInjuries: [],
        instructions: ['Exercício personalizado criado pelo atleta.'],
        userTechnicalNote: '',
        isFavorite: true,
        isCustom: true
      });
      ctx.actions.closeModal();
      ctx.actions.toast('Exercício salvo na sua biblioteca!', 'success');
      await ctx.actions.refreshData();
    });
  });
}
