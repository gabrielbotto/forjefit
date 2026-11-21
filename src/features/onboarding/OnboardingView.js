import { ICONS, renderAnatomySVG } from '../../core/ui/visuals.js';
import { formatHeight, formatWeight, generateSupportId } from '../../core/utils/formatters.js';
import { Haptics } from '../../core/utils/haptics.js';
import { db } from '../../data/db/ForjeDB.js';
import { EQUIPMENT_LIST, INJURY_ZONES, MUSCLE_GROUPS } from '../../data/seed/exercisesSeed.js';
import { calculateNutritionAndProjection, computeReadinessScore, generateWorkoutPlan } from '../../domain/BiomechanicsEngine.js';

const DRAFT_KEY = 'forjefit_onboarding_draft';

function loadDraft() {
  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    if (raw) return JSON.parse(raw);
  } catch (_) {}
  return {
    step: 0,
    quickMode: false,
    acceptedTerms: true,
    name: '',
    gender: 'MALE',
    age: 28,
    heightCm: 172,
    currentWeightKg: 78,
    targetWeightKg: 75,
    unitSystem: 'METRIC',
    primaryGoal: 'HYPERTROPHY',
    experienceLevel: 'INTERMEDIATE',
    consistencyStatus: 'REGULAR',
    equipmentProfile: 'FULL_GYM',
    ownedEquipmentIds: ['barbell', 'dumbbell', 'bench', 'cable', 'machine', 'pullup_bar', 'bodyweight'],
    activeInjuries: [],
    priorityMuscleGroups: ['peito', 'costas', 'ombros'],
    daysPerWeek: 4,
    sessionDurationMin: 50,
    periodizationMode: 'HYPERTROPHY_8W_DELOAD',
    reminderTime: '18:30',
    anatomySide: 'front'
  };
}

let draft = loadDraft();
const saveDraft = () => localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));

function getFlowSteps() {
  return draft.quickMode ? [1, 2, 5, 6, 7] : [1, 2, 3, 4, 5, 6, 7];
}

export const OnboardingView = {
  render(ctx) {
    if (draft.step === 0) return renderWelcome();
    const steps = getFlowSteps();
    const pos = Math.max(0, steps.indexOf(draft.step));
    const progressBars = steps.map((_, idx) =>
      `<div class="segmented-progress__step ${idx <= pos ? 'is-done' : ''}"></div>`
    ).join('');

    let body = '';
    if (draft.step === 1) body = renderStepIdentity();
    if (draft.step === 2) body = renderStepGoalLevel();
    if (draft.step === 3) body = renderStepEquipInjuries();
    if (draft.step === 4) body = renderStepAnatomy();
    if (draft.step === 5) body = renderStepBiometrics();
    if (draft.step === 6) body = renderStepSchedule();
    if (draft.step === 7) body = renderStepDiagnosis(ctx);

    return `
      <header class="top-app-bar" style="flex-direction:column;align-items:stretch;gap:10px">
        <div style="display:flex;align-items:center;justify-content:space-between">
          <button class="btn-icon" data-ob-back aria-label="Voltar">←</button>
          <span class="label-overline">Passo ${pos + 1} de ${steps.length}</span>
          <button class="chip" data-ob-unit>${draft.unitSystem === 'METRIC' ? 'kg / cm' : 'lb / ft'}</button>
        </div>
        <div class="segmented-progress">${progressBars}</div>
      </header>
      <main class="screen-scroll screen-scroll--no-nav">
        ${body}
      </main>`;
  },

  bind(root, ctx) {
    root.querySelectorAll('[data-ob-start]').forEach((btn) => {
      btn.addEventListener('click', () => {
        Haptics.light();
        draft.quickMode = btn.dataset.obStart === 'quick';
        draft.step = 1;
        saveDraft();
        ctx.actions.render();
      });
    });

    root.querySelector('[data-ob-back]')?.addEventListener('click', () => {
      Haptics.light();
      const steps = getFlowSteps();
      const idx = steps.indexOf(draft.step);
      draft.step = idx <= 0 ? 0 : steps[idx - 1];
      saveDraft();
      ctx.actions.render();
    });

    root.querySelector('[data-ob-unit]')?.addEventListener('click', () => {
      Haptics.light();
      draft.unitSystem = draft.unitSystem === 'METRIC' ? 'IMPERIAL' : 'METRIC';
      saveDraft();
      ctx.actions.render();
    });

    root.querySelector('[data-ob-next]')?.addEventListener('click', () => {
      if (draft.step === 1 && !draft.acceptedTerms) {
        ctx.actions.toast('Aceite os Termos e Política de Privacidade para continuar.', 'danger');
        return;
      }
      Haptics.light();
      const steps = getFlowSteps();
      const idx = steps.indexOf(draft.step);
      if (idx >= 0 && idx < steps.length - 1) {
        draft.step = steps[idx + 1];
        saveDraft();
        ctx.actions.render();
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    });

    // Inputs simples
    root.querySelector('[data-ob-name]')?.addEventListener('input', (e) => {
      draft.name = e.target.value;
      saveDraft();
    });
    root.querySelector('[data-ob-terms]')?.addEventListener('change', (e) => {
      draft.acceptedTerms = e.target.checked;
      saveDraft();
    });

    // Seletores de opção única
    root.querySelectorAll('[data-ob-set]').forEach((el) => {
      el.addEventListener('click', () => {
        Haptics.light();
        const [field, val] = el.dataset.obSet.split(':');
        draft[field] = isNaN(Number(val)) ? val : Number(val);
        if (field === 'equipmentProfile') {
          draft.ownedEquipmentIds = EQUIPMENT_LIST.filter((eq) => eq.tiers.includes(val)).map((eq) => eq.id);
        }
        saveDraft();
        ctx.actions.render();
      });
    });

    // Checklists múltiplos (equipamentos e lesões)
    root.querySelectorAll('[data-ob-toggle]').forEach((el) => {
      el.addEventListener('click', () => {
        Haptics.light();
        const [field, id] = el.dataset.obToggle.split(':');
        const set = new Set(draft[field] || []);
        if (set.has(id)) set.delete(id); else set.add(id);
        draft[field] = [...set];
        saveDraft();
        ctx.actions.render();
      });
    });

    // Mapa anatômico clicável
    root.querySelectorAll('[data-muscle-tap]').forEach((el) => {
      el.addEventListener('click', () => {
        Haptics.light();
        const id = el.dataset.muscleTap;
        const set = new Set(draft.priorityMuscleGroups || []);
        if (set.has(id)) set.delete(id); else set.add(id);
        draft.priorityMuscleGroups = [...set];
        saveDraft();
        ctx.actions.render();
      });
    });

    // Sliders biométricos
    root.querySelectorAll('[data-ob-range]').forEach((inp) => {
      inp.addEventListener('input', (e) => {
        draft[inp.dataset.obRange] = Number(e.target.value);
        saveDraft();
        ctx.actions.render();
      });
    });

    root.querySelector('[data-ob-time]')?.addEventListener('change', (e) => {
      draft.reminderTime = e.target.value;
      saveDraft();
    });

    // Finalizar Onboarding e gerar plano real
    root.querySelectorAll('[data-ob-finish]').forEach((btn) => {
      btn.addEventListener('click', async () => {
        Haptics.success();
        const tier = btn.dataset.obFinish;
        const profile = {
          uid: `usr_${Date.now()}`,
          isGuest: true,
          name: draft.name.trim() || 'Atleta ForjeFit',
          email: '',
          photoUrl: '',
          gender: draft.gender,
          age: draft.age,
          heightCm: draft.heightCm,
          currentWeightKg: draft.currentWeightKg,
          targetWeightKg: draft.targetWeightKg,
          unitSystem: draft.unitSystem,
          language: 'pt-BR',
          primaryGoal: draft.primaryGoal,
          experienceLevel: draft.experienceLevel,
          consistencyStatus: draft.consistencyStatus,
          equipmentProfile: draft.equipmentProfile,
          ownedEquipmentIds: draft.ownedEquipmentIds,
          activeInjuries: draft.activeInjuries,
          priorityMuscleGroups: draft.priorityMuscleGroups,
          daysPerWeek: draft.daysPerWeek,
          sessionDurationMin: draft.sessionDurationMin,
          periodizationMode: draft.periodizationMode,
          reminderTime: draft.reminderTime,
          soundEnabled: true,
          planTier: tier,
          supportId: generateSupportId(),
          createdAt: Date.now()
        };

        const plan = generateWorkoutPlan(profile, ctx.state.catalog);
        await db.saveProfile(profile);
        await db.savePlan(plan);
        await db.saveMeasurement({
          id: `meas_${Date.now()}`,
          date: Date.now(),
          weightKg: profile.currentWeightKg,
          waistCm: null,
          armCm: null,
          chestCm: null,
          thighCm: null
        });
        localStorage.removeItem(DRAFT_KEY);
        ctx.actions.toast(tier === 'PRO' ? 'Teste PRO de 7 dias ativado!' : 'Plano ForjeFit criado com sucesso!', 'success');
        await ctx.actions.refreshData();
      });
    });
  }
};

function renderWelcome() {
  return `
    <main class="screen-scroll screen-scroll--no-nav" style="justify-content:space-between;min-height:100dvh;padding-top:calc(var(--safe-top) + 28px)">
      <div>
        <div class="badge badge-pro" style="margin-bottom:14px">${ICONS.bolt} Biomecânica & Performance</div>
        <h1 class="display-title" style="font-size:36px;line-height:1.08;margin-bottom:12px">Forje sua melhor versão com <span style="color:var(--accent-primary)">ForjeFit</span>.</h1>
        <p style="color:var(--text-secondary);margin:0 0 22px">Sobrecarga progressiva real por RIR, recuperação muscular ponderada e 100% funcional offline na academia.</p>

        <div class="card-elevated" style="display:flex;flex-direction:column;gap:14px">
          <div style="display:flex;align-items:center;justify-content:space-between">
            <span class="label-overline">Preview do Motor Biomecânico</span>
            <span class="badge badge-pr">1RM Epley + RIR</span>
          </div>
          <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;text-align:center">
            <div class="card" style="padding:10px">
              <div class="tnum" style="font-size:20px;font-weight:700;color:var(--accent-primary)">16</div>
              <div style="font-size:11px;color:var(--text-secondary)">Grupos Mapeados</div>
            </div>
            <div class="card" style="padding:10px">
              <div class="tnum" style="font-size:20px;font-weight:700;color:var(--semantic-success)">0%</div>
              <div style="font-size:11px;color:var(--text-secondary)">Anúncios no Treino</div>
            </div>
            <div class="card" style="padding:10px">
              <div class="tnum" style="font-size:20px;font-weight:700;color:var(--semantic-info)">100%</div>
              <div style="font-size:11px;color:var(--text-secondary)">Offline-First</div>
            </div>
          </div>
        </div>
      </div>

      <div style="display:flex;flex-direction:column;gap:10px;margin-top:24px">
        <button class="btn btn-primary btn-full" data-ob-start="full">PLANO CIENTÍFICO COMPLETO</button>
        <button class="btn btn-secondary btn-full" data-ob-start="quick">SETUP RÁPIDO (3 PASSOS)</button>
      </div>
    </main>`;
}

function renderStepIdentity() {
  const genders = [
    { id: 'MALE', label: 'Masculino' },
    { id: 'FEMALE', label: 'Feminino' },
    { id: 'OTHER', label: 'Prefiro não informar' }
  ];
  return `
    <h2 class="display-title" style="font-size:26px">Quem está treinando?</h2>
    <p style="color:var(--text-secondary);margin:0">Usamos seu perfil para calibrar cargas iniciais realistas e metas metabólicas.</p>
    <div class="card" style="display:flex;flex-direction:column;gap:10px">
      <label class="label-overline">Seu Nome ou Apelido</label>
      <input class="input-field" data-ob-name value="${draft.name}" placeholder="Ex.: Gabriel" maxlength="40" />
    </div>
    <div style="display:flex;flex-direction:column;gap:10px">
      <span class="label-overline">Gênero Biológico (para cálculo de TMB e cargas)</span>
      ${genders.map((g) => `
        <div class="card card-interactive ${draft.gender === g.id ? 'is-selected' : ''}" data-ob-set="gender:${g.id}">
          <strong>${g.label}</strong>
        </div>`).join('')}
    </div>
    <label style="display:flex;align-items:flex-start;gap:10px;font-size:13px;color:var(--text-secondary);margin-top:4px">
      <input type="checkbox" data-ob-terms ${draft.acceptedTerms ? 'checked' : ''} style="margin-top:3px;accent-color:var(--accent-primary)" />
      <span>Concordo com os Termos de Uso e Política de Privacidade (dados salvos localmente no dispositivo).</span>
    </label>
    <button class="btn btn-primary btn-full" data-ob-next>CONTINUAR</button>`;
}

function renderStepGoalLevel() {
  const goals = [
    { id: 'HYPERTROPHY', title: 'Hipertrofia Máxima', desc: 'Ganho de massa muscular com volume otimizado (8–14 reps)' },
    { id: 'STRENGTH', title: 'Força Pura', desc: 'Progressão pesada em compostos multiarticulares (5–7 reps)' },
    { id: 'DEFINITION', title: 'Definição Muscular', desc: 'Preservação de massa magra com déficit calórico seguro' },
    { id: 'CONDITIONING', title: 'Condicionamento & Resistência', desc: 'Mais densidade de treino e menor tempo de descanso' }
  ];
  const levels = [
    { id: 'BEGINNER', label: 'Iniciante' },
    { id: 'INTERMEDIATE', label: 'Intermediário' },
    { id: 'ADVANCED', label: 'Avançado' },
    { id: 'EXPERT', label: 'Atleta' }
  ];
  return `
    <h2 class="display-title" style="font-size:26px">Objetivo e Experiência</h2>
    <div style="display:flex;flex-direction:column;gap:10px">
      ${goals.map((g) => `
        <div class="card card-interactive ${draft.primaryGoal === g.id ? 'is-selected' : ''}" data-ob-set="primaryGoal:${g.id}">
          <div style="font-weight:700;font-size:16px">${g.title}</div>
          <div style="font-size:13px;color:var(--text-secondary);margin-top:2px">${g.desc}</div>
        </div>`).join('')}
    </div>
    <span class="label-overline" style="margin-top:6px">Nível na Musculação</span>
    <div class="chip-group">
      ${levels.map((l) => `<button class="chip ${draft.experienceLevel === l.id ? 'is-active' : ''}" data-ob-set="experienceLevel:${l.id}">${l.label}</button>`).join('')}
    </div>
    <button class="btn btn-primary btn-full" data-ob-next>CONTINUAR</button>`;
}

function renderStepEquipInjuries() {
  const envs = [
    { id: 'FULL_GYM', label: 'Academia Completa' },
    { id: 'SMALL_GYM', label: 'Academia de Condomínio' },
    { id: 'HOME_GYM', label: 'Em Casa (Halteres/Banco)' },
    { id: 'BODYWEIGHT', label: 'Peso Corporal' }
  ];
  return `
    <h2 class="display-title" style="font-size:26px">Ambiente e Proteção Articular</h2>
    <div class="chip-group">
      ${envs.map((e) => `<button class="chip ${draft.equipmentProfile === e.id ? 'is-active' : ''}" data-ob-set="equipmentProfile:${e.id}">${e.label}</button>`).join('')}
    </div>
    <div class="card" style="display:flex;flex-direction:column;gap:10px">
      <span class="label-overline">Equipamentos Disponíveis (toque para ajustar)</span>
      <div class="chip-group">
        ${EQUIPMENT_LIST.map((eq) => {
          const active = (draft.ownedEquipmentIds || []).includes(eq.id);
          return `<button class="chip ${active ? 'is-active' : ''}" data-ob-toggle="ownedEquipmentIds:${eq.id}">${eq.name}</button>`;
        }).join('')}
      </div>
    </div>
    <div class="card" style="display:flex;flex-direction:column;gap:10px">
      <span class="label-overline">Possui alguma lesão ou sensibilidade ativa?</span>
      <p style="margin:0;font-size:12px;color:var(--text-secondary)">O motor exclui automaticamente exercícios contraindicados para essas articulações.</p>
      <div class="chip-group">
        ${INJURY_ZONES.map((inj) => {
          const active = (draft.activeInjuries || []).includes(inj.id);
          return `<button class="chip ${active ? 'is-active' : ''}" data-ob-toggle="activeInjuries:${inj.id}">${inj.name}</button>`;
        }).join('')}
      </div>
    </div>
    <button class="btn btn-primary btn-full" data-ob-next>CONTINUAR</button>`;
}

function renderStepAnatomy() {
  const colorMap = {};
  (draft.priorityMuscleGroups || []).forEach((id) => { colorMap[id] = '#FF5F00'; });
  const selectable = MUSCLE_GROUPS.filter((m) => m.id !== 'cardio');
  return `
    <h2 class="display-title" style="font-size:26px">Prioridades Musculares</h2>
    <p style="color:var(--text-secondary);margin:0">Toque diretamente na silhueta ou nos botões abaixo para dar volume extra aos grupos foco.</p>
    <div class="card">
      ${renderAnatomySVG({ colorMap, side: 'both', interactive: true })}
    </div>
    <div class="chip-group">
      ${selectable.map((m) => {
        const active = (draft.priorityMuscleGroups || []).includes(m.id);
        return `<button class="chip ${active ? 'is-active' : ''}" data-ob-toggle="priorityMuscleGroups:${m.id}">${m.name}</button>`;
      }).join('')}
    </div>
    <button class="btn btn-primary btn-full" data-ob-next>CONTINUAR</button>`;
}

function renderStepBiometrics() {
  const nut = calculateNutritionAndProjection(draft);
  return `
    <h2 class="display-title" style="font-size:26px">Biometria & Meta Realista</h2>
    <div class="card" style="display:flex;flex-direction:column;gap:14px">
      <div>
        <div style="display:flex;justify-content:space-between"><span class="label-overline">Idade</span><strong class="tnum">${draft.age} anos</strong></div>
        <input type="range" min="15" max="75" value="${draft.age}" data-ob-range="age" style="width:100%;accent-color:var(--accent-primary)"/>
      </div>
      <div>
        <div style="display:flex;justify-content:space-between"><span class="label-overline">Altura</span><strong class="tnum">${formatHeight(draft.heightCm, draft.unitSystem)}</strong></div>
        <input type="range" min="140" max="215" value="${draft.heightCm}" data-ob-range="heightCm" style="width:100%;accent-color:var(--accent-primary)"/>
      </div>
      <div>
        <div style="display:flex;justify-content:space-between"><span class="label-overline">Peso Atual</span><strong class="tnum">${formatWeight(draft.currentWeightKg, draft.unitSystem)}</strong></div>
        <input type="range" min="40" max="160" step="0.5" value="${draft.currentWeightKg}" data-ob-range="currentWeightKg" style="width:100%;accent-color:var(--accent-primary)"/>
      </div>
      <div>
        <div style="display:flex;justify-content:space-between"><span class="label-overline">Meta de Peso</span><strong class="tnum" style="color:var(--accent-primary)">${formatWeight(draft.targetWeightKg, draft.unitSystem)}</strong></div>
        <input type="range" min="40" max="160" step="0.5" value="${draft.targetWeightKg}" data-ob-range="targetWeightKg" style="width:100%;accent-color:var(--accent-primary)"/>
      </div>
    </div>

    <div class="card-elevated" style="display:grid;grid-template-columns:repeat(2,1fr);gap:10px">
      <div>
        <div class="label-overline">Meta Calórica</div>
        <div class="tnum" style="font-size:20px;font-weight:700;color:var(--accent-primary)">${nut.targetCalories} kcal</div>
        <div style="font-size:11px;color:var(--text-secondary)">TDEE est.: ${nut.tdee} kcal</div>
      </div>
      <div>
        <div class="label-overline">Proteína & Água</div>
        <div class="tnum" style="font-size:20px;font-weight:700;color:var(--semantic-success)">${nut.proteinGrams}g / dia</div>
        <div style="font-size:11px;color:var(--text-secondary)">Hidratação: ${(nut.waterMl / 1000).toFixed(1)} L</div>
      </div>
      <div style="grid-column:1 / -1;border-top:1px solid var(--border-subtle);padding-top:8px;font-size:12px;color:var(--text-secondary)">
        Ritmo fisiológico seguro: <strong style="color:var(--text-primary)">${nut.weeksToGoal} semanas</strong> (previsão ${nut.projectedDate.toLocaleDateString('pt-BR')}).
      </div>
    </div>
    <button class="btn btn-primary btn-full" data-ob-next>CONTINUAR</button>`;
}

function renderStepSchedule() {
  const durations = [20, 35, 50, 70];
  const periods = [
    { id: 'HYPERTROPHY_8W_DELOAD', label: '8 Semanas + Deload' },
    { id: 'BALANCED_6W', label: 'Ciclo 6 Semanas' },
    { id: 'FIXED', label: 'Ficha Fixa (PRs)' }
  ];
  return `
    <h2 class="display-title" style="font-size:26px">Rotina e Periodização</h2>
    <div class="card" style="display:flex;flex-direction:column;gap:12px">
      <div style="display:flex;justify-content:space-between;align-items:center">
        <span class="label-overline">Dias por Semana</span>
        <strong class="tnum" style="font-size:22px;color:var(--accent-primary)">${draft.daysPerWeek}x</strong>
      </div>
      <div style="display:grid;grid-template-columns:repeat(6,1fr);gap:6px">
        ${[1, 2, 3, 4, 5, 6].map((d) => `
          <button class="chip ${draft.daysPerWeek === d ? 'is-active' : ''}" style="padding:10px 0;text-align:center" data-ob-set="daysPerWeek:${d}">${d}</button>
        `).join('')}
      </div>
    </div>

    <div class="card" style="display:flex;flex-direction:column;gap:10px">
      <span class="label-overline">Duração por Sessão</span>
      <div class="chip-group">
        ${durations.map((m) => `<button class="chip ${draft.sessionDurationMin === m ? 'is-active' : ''}" data-ob-set="sessionDurationMin:${m}">${m <= 20 ? '≤ 20 min' : m === 70 ? '60+ min' : `${m} min`}</button>`).join('')}
      </div>
    </div>

    <div class="card" style="display:flex;flex-direction:column;gap:10px">
      <span class="label-overline">Modelo de Periodização</span>
      <div class="chip-group">
        ${periods.map((p) => `<button class="chip ${draft.periodizationMode === p.id ? 'is-active' : ''}" data-ob-set="periodizationMode:${p.id}">${p.label}</button>`).join('')}
      </div>
    </div>

    <div class="card" style="display:flex;align-items:center;justify-content:space-between">
      <div>
        <div class="label-overline">Horário Preferido (Lembrete)</div>
        <div style="font-size:12px;color:var(--text-secondary)">Usado para alertas locais de treino</div>
      </div>
      <input type="time" class="input-field" style="width:auto" value="${draft.reminderTime}" data-ob-time />
    </div>
    <button class="btn btn-primary btn-full" data-ob-next>GERAR DIAGNÓSTICO</button>`;
}

function renderStepDiagnosis(ctx) {
  const score = computeReadinessScore(draft, []);
  const previewPlan = generateWorkoutPlan(draft, ctx.state.catalog);
  return `
    <div class="badge badge-pr">${ICONS.check} Plano Biomecânico Pronto</div>
    <h2 class="display-title" style="font-size:26px">Diagnóstico do Atleta</h2>
    <div class="card-elevated" style="display:flex;align-items:center;gap:16px">
      <div style="width:76px;height:76px;border-radius:50%;border:5px solid var(--accent-primary);display:flex;flex-direction:column;align-items:center;justify-content:center;flex-shrink:0">
        <span class="tnum" style="font-size:24px;font-weight:700">${score.overall}</span>
        <span style="font-size:9px;color:var(--text-secondary)">SCORE</span>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;flex:1;font-size:12px">
        <div>Força: <strong class="tnum">${score.strength}</strong></div>
        <div>Constância: <strong class="tnum">${score.consistency}</strong></div>
        <div>Recuperação: <strong class="tnum">${score.recovery}</strong></div>
        <div>Aderência: <strong class="tnum">${score.adherence}</strong></div>
      </div>
    </div>

    <div class="card" style="display:flex;flex-direction:column;gap:8px">
      <span class="label-overline">Divisão Gerada (${previewPlan.daysPerWeek}x/semana)</span>
      ${previewPlan.days.map((d) => `
        <details style="background:var(--bg-base);border:1px solid var(--border-subtle);border-radius:10px;padding:10px 12px">
          <summary style="cursor:pointer;font-weight:600;display:flex;justify-content:space-between">
            <span>Dia ${d.dayNumber} — ${d.title}</span>
            <span style="color:var(--accent-primary);font-size:12px">${d.items.length} exerc.</span>
          </summary>
          <ul style="margin:8px 0 0;padding-left:18px;color:var(--text-secondary);font-size:13px">
            ${d.items.map((i) => `<li>${i.namePt} (${i.targetSets}×${i.targetRepRange})</li>`).join('')}
          </ul>
        </details>`).join('')}
    </div>

    <div style="display:flex;flex-direction:column;gap:10px">
      <button class="btn btn-primary btn-full" data-ob-finish="PRO">INICIAR 7 DIAS PRO GRÁTIS</button>
      <button class="btn btn-secondary btn-full" data-ob-finish="FREE">CONTINUAR NO MODO GRATUITO LIMPO</button>
    </div>`;
}
