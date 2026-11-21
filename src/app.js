import { db, STORES } from './data/db/ForjeDB.js';
import { ICONS, playTimerBeep } from './core/ui/visuals.js';
import { Haptics } from './core/utils/haptics.js';
import { formatCurrencyBRL, formatDurationClock } from './core/utils/formatters.js';
import { OnboardingView } from './features/onboarding/OnboardingView.js';
import { PlanView } from './features/plan/PlanView.js';
import { ActiveWorkoutView, buildActiveWorkoutSession } from './features/workout_active/ActiveWorkoutView.js';
import { ExploreView } from './features/explore/ExploreView.js';
import { ProgressView } from './features/progress/ProgressView.js';
import { ExercisesView, openExerciseDetailModal } from './features/exercises/ExercisesView.js';
import { ProfileView } from './features/profile/ProfileView.js';

const appRoot = document.getElementById('app-root');
const modalRoot = document.getElementById('modal-root');
const toastRoot = document.getElementById('toast-root');

const state = {
  ready: false,
  profile: null,
  plan: null,
  catalog: [],
  sessions: [],
  cardioLogs: [],
  measurements: [],
  benefits: [],
  currentTab: 'plan',
  selectedDayIndex: 0,
  navCollapsed: false,
  activeWorkout: null,
  restTimer: { active: false, remainingSec: 0 }
};

let tickerInterval = null;

function toast(message, type = 'info') {
  const el = document.createElement('div');
  el.className = `toast ${type === 'success' ? 'toast--success' : type === 'danger' ? 'toast--danger' : ''}`;
  el.textContent = message;
  toastRoot.appendChild(el);
  setTimeout(() => el.remove(), 3200);
}

function closeModal() {
  modalRoot.innerHTML = '';
}

function openModal(html, onBind) {
  modalRoot.innerHTML = `
    <div class="modal-backdrop" data-modal-bg>
      <div class="bottom-sheet" role="dialog" aria-modal="true">
        <div class="sheet-handle"></div>
        ${html}
      </div>
    </div>`;
  const bg = modalRoot.querySelector('[data-modal-bg]');
  bg.addEventListener('click', (e) => { if (e.target === bg) closeModal(); });
  if (onBind) onBind(modalRoot.querySelector('.bottom-sheet'));
}

function startLiveTicker() {
  if (tickerInterval) return;
  tickerInterval = setInterval(() => {
    if (state.activeWorkout) {
      const clockEl = document.querySelector('[data-aw-clock]');
      if (clockEl) {
        const sec = Math.floor((Date.now() - state.activeWorkout.startedAt) / 1000);
        clockEl.textContent = formatDurationClock(sec);
      }
    }
    if (state.restTimer.active) {
      state.restTimer.remainingSec--;
      const restEl = document.querySelector('[data-rest-clock]');
      if (restEl) restEl.textContent = formatDurationClock(state.restTimer.remainingSec);
      if (state.restTimer.remainingSec <= 0) {
        state.restTimer.active = false;
        if (state.profile?.soundEnabled !== false) {
          playTimerBeep();
          Haptics.success();
        }
        toast('Descanso encerrado! Bora para a próxima série.', 'success');
        render();
      }
    }
    if (!state.activeWorkout && !state.restTimer.active) {
      clearInterval(tickerInterval);
      tickerInterval = null;
    }
  }, 1000);
}

function openCardioModal() {
  openModal(`
    <h3 class="display-title" style="font-size:20px">Registrar Cardio</h3>
    <div style="display:flex;flex-direction:column;gap:10px">
      <select class="input-field" data-c-mod>
        <option value="Caminhada Inclinada">Caminhada Inclinada</option>
        <option value="Corrida">Corrida / Esteira</option>
        <option value="Bicicleta Ergométrica">Bicicleta Ergométrica</option>
        <option value="Elíptico / Remo">Elíptico / Remo</option>
        <option value="Escada">Simulador de Escada</option>
      </select>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">
        <div><label class="label-overline">Duração (min)</label><input class="input-field tnum" type="number" value="25" data-c-min /></div>
        <div><label class="label-overline">Distância (km)</label><input class="input-field tnum" type="number" step="0.1" value="2.5" data-c-dist /></div>
      </div>
      <button class="btn btn-primary btn-full" data-c-save>SALVAR CARDIO</button>
    </div>`,
  (modal) => {
    modal.querySelector('[data-c-save]').addEventListener('click', async () => {
      const modality = modal.querySelector('[data-c-mod]').value;
      const mins = Math.max(1, Number(modal.querySelector('[data-c-min]').value) || 20);
      const distanceKm = Math.max(0, Number(modal.querySelector('[data-c-dist]').value) || 0);
      await db.saveCardio({
        id: `cardio_${Date.now()}`,
        modality,
        durationSec: mins * 60,
        distanceKm,
        calories: Math.round(mins * 8.2),
        source: 'MANUAL',
        timestamp: Date.now()
      });
      closeModal();
      Haptics.success();
      toast(`${modality} (${mins} min) registrado!`, 'success');
      await refreshData();
    });
  });
}

function openPaywallModal() {
  const annualTotal = 179.90;
  const monthlyEq = annualTotal / 12;
  openModal(`
    <span class="badge badge-pro">${ICONS.bolt} ForjeFit PRO</span>
    <h3 class="display-title" style="font-size:24px;line-height:1.15">Evolua sem limites e sem distrações.</h3>
    <ul style="margin:0;padding-left:18px;font-size:13px;color:var(--text-secondary);display:flex;flex-direction:column;gap:5px">
      <li>Auto-regulação inteligente de carga (RIR + Epley 1RM)</li>
      <li>Análises completas (Mês / Ano) e Mapa de Recuperação Avançado</li>
      <li>ForjeFit Lens ilimitado + Clube de Benefícios exclusivo</li>
    </ul>

    <div class="card-elevated is-selected" style="display:flex;justify-content:space-between;align-items:center">
      <div>
        <span class="badge badge-pr">7 DIAS GRÁTIS</span>
        <div style="font-weight:700;font-size:16px;margin-top:4px">Plano Anual PRO</div>
        <div style="font-size:12px;color:var(--text-secondary)">Cobrado ${formatCurrencyBRL(annualTotal)}/ano</div>
      </div>
      <div style="text-align:right">
        <div class="tnum" style="font-size:20px;font-weight:700;color:var(--accent-primary)">${formatCurrencyBRL(monthlyEq)}</div>
        <div style="font-size:11px;color:var(--text-secondary)">por mês</div>
      </div>
    </div>

    <div style="display:flex;gap:8px">
      <input class="input-field" data-pw-promo placeholder="Código promocional (ex.: FORJEPRO)" />
      <button class="btn btn-secondary" style="min-height:44px;padding:0 14px;font-size:12px" data-pw-apply>Aplicar</button>
    </div>

    <button class="btn btn-primary btn-full" data-pw-sub>TESTAR 7 DIAS GRÁTIS</button>
    <p style="font-size:11px;color:var(--text-secondary);text-align:center;margin:0">
      Cancelamento livre antes do fim dos 7 dias. Renovação automática via Google Play na versão publicada na loja.
    </p>`,
  (modal) => {
    const activatePro = async (msg) => {
      await db.saveProfile({ ...state.profile, planTier: 'PRO' });
      closeModal();
      Haptics.success();
      toast(msg, 'success');
      await refreshData();
    };
    modal.querySelector('[data-pw-sub]').addEventListener('click', () => activatePro('Período de teste PRO ativado!'));
    modal.querySelector('[data-pw-apply]').addEventListener('click', () => {
      const code = modal.querySelector('[data-pw-promo]').value.trim().toUpperCase();
      if (code === 'FORJEPRO' || code === 'FORJE15') activatePro(`Cupom ${code} aplicado! PRO liberado.`);
      else toast('Código não reconhecido. Tente FORJEPRO para teste.', 'danger');
    });
  });
}

const actions = {
  render,
  refreshData,
  toast,
  openModal,
  closeModal,
  openCardioModal,
  openPaywallModal,
  openExerciseDetail(id) {
    openExerciseDetailModal(id, { state, actions });
  },
  startWorkout(dayObj) {
    state.activeWorkout = buildActiveWorkoutSession(dayObj, state.sessions, state.catalog);
    startLiveTicker();
    render();
    window.scrollTo({ top: 0 });
  },
  startRestTimer(seconds) {
    state.restTimer = { active: true, remainingSec: Math.max(5, seconds) };
    startLiveTicker();
    render();
  },
  adjustRestTimer(delta) {
    state.restTimer.remainingSec = Math.max(5, state.restTimer.remainingSec + delta);
    render();
  },
  stopRestTimer() {
    state.restTimer = { active: false, remainingSec: 0 };
    render();
  }
};

function renderBottomDock() {
  const tabs = [
    { id: 'plan', label: 'Plano', icon: ICONS.plan },
    { id: 'explore', label: 'Treinos', icon: ICONS.explore },
    { id: 'progress', label: 'Progresso', icon: ICONS.progress },
    { id: 'exercises', label: 'Exercícios', icon: ICONS.exercises },
    { id: 'profile', label: 'Perfil', icon: ICONS.profile }
  ];

  const showStartCta = state.currentTab === 'plan' && state.plan?.days?.length;

  if (state.navCollapsed && showStartCta) {
    return `
      <div class="bottom-dock">
        <div class="dock-row-compact">
          <button class="nav-compact-trigger" data-expand-nav aria-label="Abrir Menu">${ICONS.menu}</button>
          <button class="btn btn-primary" style="flex:1" data-launch-day>${ICONS.play} INICIAR TREINO</button>
        </div>
      </div>`;
  }

  return `
    <div class="bottom-dock">
      ${showStartCta ? `<button class="btn btn-primary btn-full" data-launch-day>${ICONS.play} INICIAR TREINO</button>` : ''}
      <nav class="floating-nav" aria-label="Navegação Principal">
        ${tabs.map((t) => `
          <button class="floating-nav-item ${state.currentTab === t.id ? 'is-active' : ''}" data-nav-tab="${t.id}">
            ${t.icon}<span>${t.label}</span>
          </button>`).join('')}
      </nav>
    </div>`;
}

function render() {
  const ctx = { state, actions };

  if (!state.profile) {
    appRoot.innerHTML = OnboardingView.render(ctx);
    OnboardingView.bind(appRoot, ctx);
    return;
  }

  if (state.activeWorkout) {
    appRoot.innerHTML = ActiveWorkoutView.render(ctx);
    ActiveWorkoutView.bind(appRoot, ctx);
    return;
  }

  const views = {
    plan: PlanView,
    explore: ExploreView,
    progress: ProgressView,
    exercises: ExercisesView,
    profile: ProfileView
  };

  const activeView = views[state.currentTab] || PlanView;
  appRoot.innerHTML = activeView.render(ctx) + renderBottomDock();
  activeView.bind(appRoot, ctx);

  // Bind da Navegação Inferior Flutuante
  appRoot.querySelectorAll('[data-nav-tab]').forEach((b) => {
    b.addEventListener('click', () => {
      Haptics.light();
      state.currentTab = b.dataset.navTab;
      state.navCollapsed = false;
      render();
      window.scrollTo({ top: 0 });
    });
  });

  appRoot.querySelector('[data-expand-nav]')?.addEventListener('click', () => {
    Haptics.light();
    state.navCollapsed = false;
    render();
  });

  appRoot.querySelector('[data-launch-day]')?.addEventListener('click', () => {
    Haptics.medium();
    const day = state.plan.days[Math.min(state.selectedDayIndex, state.plan.days.length - 1)];
    if (!day?.items?.length) {
      toast('Adicione ao menos 1 exercício antes de iniciar.', 'danger');
      return;
    }
    actions.startWorkout(day);
  });
}

// Recolhimento inteligente da barra ao rolar na aba Meu Plano
let lastScrollY = 0;
window.addEventListener('scroll', () => {
  if (!state.profile || state.activeWorkout || state.currentTab !== 'plan') return;
  const y = window.scrollY;
  const shouldCollapse = y > 130 && y > lastScrollY;
  const shouldExpand = y < 60;
  lastScrollY = y;
  if (shouldCollapse && !state.navCollapsed) {
    state.navCollapsed = true;
    render();
  } else if (shouldExpand && state.navCollapsed) {
    state.navCollapsed = false;
    render();
  }
}, { passive: true });

async function refreshData() {
  const [profile, plan, catalog, sessions, cardioLogs, measurements, benefits] = await Promise.all([
    db.getActiveProfile(),
    db.getActivePlan(),
    db.getAll(STORES.EXERCISES),
    db.getSessions(),
    db.getCardioLogs(),
    db.getMeasurements(),
    db.getAll(STORES.BENEFITS)
  ]);
  state.profile = profile;
  state.plan = plan;
  state.catalog = catalog;
  state.sessions = sessions;
  state.cardioLogs = cardioLogs;
  state.measurements = measurements;
  state.benefits = benefits;
  state.ready = true;
  render();
}

async function boot() {
  await db.open();
  await refreshData();
}

boot();
