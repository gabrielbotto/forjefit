import { ICONS } from '../../core/ui/visuals.js';
import { formatHeight, formatWeight } from '../../core/utils/formatters.js';
import { Haptics } from '../../core/utils/haptics.js';
import { db } from '../../data/db/ForjeDB.js';
import { calculateNutritionAndProjection } from '../../domain/BiomechanicsEngine.js';

export const ProfileView = {
  render(ctx) {
    const { profile, benefits, measurements } = ctx.state;
    const nut = calculateNutritionAndProjection(profile);
    const initials = (profile.name || 'AF').split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase();
    const lastMeas = measurements[0];
    const refCode = `FORJE-${(profile.supportId || 'FF000').slice(-5)}`;

    return `
      <header class="top-app-bar">
        <h1 class="display-title" style="font-size:21px">Perfil</h1>
        <button class="btn-icon" data-edit-profile aria-label="Editar Perfil">${ICONS.edit}</button>
      </header>

      <main class="screen-scroll">
        <!-- Cabeçalho do Atleta -->
        <section class="card-elevated" style="display:flex;align-items:center;gap:14px">
          <div style="width:58px;height:58px;border-radius:50%;background:var(--accent-soft);border:2px solid var(--accent-primary);color:var(--accent-primary);display:flex;align-items:center;justify-content:center;font-family:var(--font-display);font-weight:700;font-size:20px;flex-shrink:0">
            ${initials}
          </div>
          <div style="flex:1;min-width:0">
            <h2 class="display-title" style="font-size:19px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${profile.name}</h2>
            <div style="display:flex;align-items:center;gap:6px;margin-top:4px">
              <span class="badge ${profile.planTier === 'PRO' ? 'badge-pro' : ''}" style="${profile.planTier !== 'PRO' ? 'background:var(--bg-base);color:var(--text-secondary)' : ''}">
                ${profile.planTier === 'PRO' ? 'CONTA PRO' : 'CONTA GRATUITA'}
              </span>
              ${profile.planTier !== 'PRO' ? `<button class="chip is-active" style="padding:3px 9px;font-size:11px" data-open-paywall>Assinar PRO</button>` : ''}
            </div>
          </div>
        </section>

        <!-- Hub Biométrico & Nutrição -->
        <section class="card" style="display:flex;flex-direction:column;gap:10px">
          <div style="display:flex;justify-content:space-between;align-items:center">
            <span class="label-overline">Biometria & Metas Diárias</span>
            <button class="chip" style="padding:4px 10px;font-size:11px" data-log-measurement>+ Registrar Peso/Medidas</button>
          </div>
          <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;text-align:center">
            <div style="background:var(--bg-base);padding:10px;border-radius:10px">
              <div class="label-overline">Peso</div>
              <strong class="tnum">${formatWeight(profile.currentWeightKg, profile.unitSystem)}</strong>
            </div>
            <div style="background:var(--bg-base);padding:10px;border-radius:10px">
              <div class="label-overline">Meta</div>
              <strong class="tnum" style="color:var(--accent-primary)">${formatWeight(profile.targetWeightKg, profile.unitSystem)}</strong>
            </div>
            <div style="background:var(--bg-base);padding:10px;border-radius:10px">
              <div class="label-overline">Altura</div>
              <strong class="tnum">${formatHeight(profile.heightCm, profile.unitSystem)}</strong>
            </div>
          </div>
          <div style="font-size:12px;color:var(--text-secondary);display:flex;justify-content:space-between;border-top:1px solid var(--border-subtle);padding-top:8px">
            <span>Calorias: <strong class="tnum" style="color:var(--text-primary)">${nut.targetCalories} kcal</strong></span>
            <span>Proteína: <strong class="tnum" style="color:var(--semantic-success)">${nut.proteinGrams}g</strong></span>
            <span>Água: <strong class="tnum" style="color:var(--semantic-info)">${(nut.waterMl / 1000).toFixed(1)}L</strong></span>
          </div>
          ${lastMeas?.waistCm ? `<div style="font-size:11px;color:var(--text-secondary)">Últimas medidas: Cintura ${lastMeas.waistCm}cm • Braço ${lastMeas.armCm || '—'}cm</div>` : ''}
        </section>

        <!-- Preferências -->
        <section style="display:flex;flex-direction:column;gap:6px">
          <span class="label-overline">Preferências</span>
          <div class="card" style="padding:0;overflow:hidden">
            <button class="profile-row" data-toggle-units style="width:100%;display:flex;justify-content:space-between;align-items:center;padding:14px 16px;background:transparent;border:none;border-bottom:1px solid var(--border-subtle);color:var(--text-primary);cursor:pointer">
              <span>Unidades de Medida</span>
              <span style="color:var(--accent-primary);font-weight:600">${profile.unitSystem === 'METRIC' ? 'kg / cm' : 'lb / ft'}</span>
            </button>
            <button class="profile-row" data-toggle-sound style="width:100%;display:flex;justify-content:space-between;align-items:center;padding:14px 16px;background:transparent;border:none;color:var(--text-primary);cursor:pointer">
              <span>Som e Vibração do Timer</span>
              <span style="color:${profile.soundEnabled !== false ? 'var(--semantic-success)' : 'var(--text-secondary)'};font-weight:600">${profile.soundEnabled !== false ? 'Ativado' : 'Mudo'}</span>
            </button>
          </div>
        </section>

        <!-- Conexões -->
        <section style="display:flex;flex-direction:column;gap:6px">
          <span class="label-overline">Conexões</span>
          <div class="card" style="padding:0;overflow:hidden">
            ${['Google Health Connect', 'Strava', 'Wear OS'].map((name, i) => `
              <div style="display:flex;justify-content:space-between;align-items:center;padding:14px 16px;${i < 2 ? 'border-bottom:1px solid var(--border-subtle)' : ''}">
                <span>${name}</span>
                <span class="badge" style="background:var(--bg-base);color:var(--text-secondary)">Via App Android</span>
              </div>`).join('')}
          </div>
        </section>

        <!-- Rotina & Sistema (Widgets separados de Notificações) -->
        <section style="display:flex;flex-direction:column;gap:6px">
          <span class="label-overline">Rotina e Sistema</span>
          <div class="card" style="padding:0;overflow:hidden">
            <div style="display:flex;justify-content:space-between;align-items:center;padding:12px 16px;border-bottom:1px solid var(--border-subtle)">
              <span>Lembrete de Treino</span>
              <input type="time" value="${profile.reminderTime || '18:30'}" data-prof-time class="input-field" style="width:auto;padding:6px 10px" />
            </div>
            <button data-install-hint style="width:100%;display:flex;justify-content:space-between;align-items:center;padding:14px 16px;background:transparent;border:none;color:var(--text-primary);cursor:pointer">
              <span>Atalho / Widget na Tela Inicial</span>
              <span style="color:var(--text-secondary)">Ver como ›</span>
            </button>
          </div>
        </section>

        <!-- Clube de Benefícios & Indique e Ganhe -->
        <section style="display:flex;flex-direction:column;gap:6px">
          <span class="label-overline">Clube de Benefícios & Comunidade</span>
          <div class="card" style="display:flex;flex-direction:column;gap:10px">
            <div style="display:flex;justify-content:space-between;align-items:center;gap:8px;padding-bottom:10px;border-bottom:1px solid var(--border-subtle)">
              <div>
                <strong>Indique e Ganhe PRO</strong>
                <div style="font-size:12px;color:var(--text-secondary)">Ganhe 1 mês PRO grátis por amigo ativo</div>
              </div>
              <button class="chip is-active" data-copy-text="${refCode}">${ICONS.copy} ${refCode}</button>
            </div>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">
              ${benefits.map((b) => `
                <button class="card-elevated card-interactive" style="padding:10px;text-align:left" data-copy-text="${b.couponCode}">
                  <span class="badge badge-pr" style="font-size:10px">${b.discountLabel}</span>
                  <div style="font-weight:700;font-size:13px;margin-top:6px">${b.brandName}</div>
                  <div style="font-size:11px;color:var(--accent-primary);margin-top:2px">Cupom: ${b.couponCode}</div>
                </button>`).join('')}
            </div>
          </div>
        </section>

        <!-- Geral, LGPD & Versão -->
        <section style="display:flex;flex-direction:column;gap:6px">
          <span class="label-overline">Geral & Dados (LGPD)</span>
          <div class="card" style="padding:0;overflow:hidden">
            <button data-export-json style="width:100%;display:flex;justify-content:space-between;padding:14px 16px;background:transparent;border:none;border-bottom:1px solid var(--border-subtle);color:var(--text-primary);cursor:pointer">
              <span>Exportar Backup Completo (JSON)</span><span style="color:var(--accent-primary)">Baixar</span>
            </button>
            <button data-open-legal style="width:100%;display:flex;justify-content:space-between;padding:14px 16px;background:transparent;border:none;border-bottom:1px solid var(--border-subtle);color:var(--text-primary);cursor:pointer">
              <span>Termos de Uso e Privacidade</span><span style="color:var(--text-secondary)">›</span>
            </button>
            <div style="display:flex;justify-content:space-between;padding:14px 16px;color:var(--text-secondary);font-size:13px">
              <span>Versão ForjeFit PWA</span><span class="tnum">1.0.0</span>
            </div>
          </div>
        </section>
      </main>`;
  },

  bind(root, ctx) {
    const { profile } = ctx.state;

    root.querySelector('[data-open-paywall]')?.addEventListener('click', () => ctx.actions.openPaywallModal());

    root.querySelector('[data-toggle-units]')?.addEventListener('click', async () => {
      Haptics.light();
      const next = profile.unitSystem === 'METRIC' ? 'IMPERIAL' : 'METRIC';
      await db.saveProfile({ ...profile, unitSystem: next });
      ctx.actions.toast(`Unidades alteradas para ${next === 'METRIC' ? 'kg / cm' : 'lb / ft'}.`, 'success');
      await ctx.actions.refreshData();
    });

    root.querySelector('[data-toggle-sound]')?.addEventListener('click', async () => {
      Haptics.light();
      await db.saveProfile({ ...profile, soundEnabled: profile.soundEnabled === false });
      await ctx.actions.refreshData();
    });

    root.querySelector('[data-prof-time]')?.addEventListener('change', async (e) => {
      await db.saveProfile({ ...profile, reminderTime: e.target.value });
      if ('Notification' in window && Notification.permission === 'default') {
        Notification.requestPermission().catch(() => {});
      }
      ctx.actions.toast(`Horário salvo: ${e.target.value}`, 'success');
      await ctx.actions.refreshData();
    });

    root.querySelectorAll('[data-copy-text]').forEach((b) => {
      b.addEventListener('click', () => {
        Haptics.light();
        navigator.clipboard?.writeText(b.dataset.copyText).catch(() => {});
        ctx.actions.toast(`Copiado: ${b.dataset.copyText}`, 'success');
      });
    });

    root.querySelector('[data-install-hint]')?.addEventListener('click', () => {
      ctx.actions.openModal(`
        <h3 class="display-title" style="font-size:20px">Instalar ForjeFit na Tela Inicial</h3>
        <p style="font-size:14px;color:var(--text-secondary);margin:0">
          Para usar o ForjeFit em tela cheia e 100% offline como aplicativo nativo:
        </p>
        <ol style="font-size:13px;color:var(--text-primary);padding-left:18px;margin:0;display:flex;flex-direction:column;gap:6px">
          <li>No <strong>Chrome (Android)</strong>: toque nos 3 pontinhos no topo → <strong>Adicionar à tela inicial</strong> → <strong>Instalar</strong>.</li>
          <li>No <strong>Safari (iPhone)</strong>: toque no ícone de compartilhar → <strong>Adicionar à Tela de Início</strong>.</li>
        </ol>`);
    });

    root.querySelector('[data-export-json]')?.addEventListener('click', async () => {
      const json = await db.exportAllJSON();
      const blob = new Blob([json], { type: 'application/json' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `forjefit-backup-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      ctx.actions.toast('Backup JSON salvo no dispositivo!', 'success');
    });

    root.querySelector('[data-open-legal]')?.addEventListener('click', () => {
      ctx.actions.openModal(`
        <h3 class="display-title" style="font-size:20px">Termos e Política de Privacidade</h3>
        <p style="font-size:13px;color:var(--text-secondary);margin:0">
          O <strong>ForjeFit</strong> adota arquitetura <em>Offline-First</em>: seus treinos, cargas e medidas ficam armazenados localmente no seu dispositivo via IndexedDB. Você tem controle total para exportar seus dados (LGPD) ou excluir sua conta definitivamente a qualquer momento na tela Editar Perfil.
        </p>`);
    });

    // Registrar Peso e Medidas
    root.querySelector('[data-log-measurement]')?.addEventListener('click', () => {
      ctx.actions.openModal(`
        <h3 class="display-title" style="font-size:20px">Atualizar Peso & Medidas</h3>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
          <div><label class="label-overline">Peso Atual (kg)</label><input class="input-field tnum" type="number" step="0.1" value="${profile.currentWeightKg}" data-m-weight /></div>
          <div><label class="label-overline">Meta (kg)</label><input class="input-field tnum" type="number" step="0.1" value="${profile.targetWeightKg}" data-m-target /></div>
          <div><label class="label-overline">Cintura (cm)</label><input class="input-field tnum" type="number" step="0.5" placeholder="Opcional" data-m-waist /></div>
          <div><label class="label-overline">Braço (cm)</label><input class="input-field tnum" type="number" step="0.5" placeholder="Opcional" data-m-arm /></div>
        </div>
        <button class="btn btn-primary btn-full" data-m-save>SALVAR EVOLUÇÃO</button>`,
      (modal) => {
        modal.querySelector('[data-m-save]').addEventListener('click', async () => {
          const w = Number(modal.querySelector('[data-m-weight]').value) || profile.currentWeightKg;
          const t = Number(modal.querySelector('[data-m-target]').value) || profile.targetWeightKg;
          const waist = Number(modal.querySelector('[data-m-waist]').value) || null;
          const arm = Number(modal.querySelector('[data-m-arm]').value) || null;
          await db.saveProfile({ ...profile, currentWeightKg: w, targetWeightKg: t });
          await db.saveMeasurement({ id: `meas_${Date.now()}`, date: Date.now(), weightKg: w, waistCm: waist, armCm: arm });
          ctx.actions.closeModal();
          ctx.actions.toast('Biometria atualizada!', 'success');
          await ctx.actions.refreshData();
        });
      });
    });

    // Editar Perfil + Compliance Google Play (Exclusão de Conta)
    root.querySelector('[data-edit-profile]')?.addEventListener('click', () => {
      ctx.actions.openModal(`
        <h3 class="display-title" style="font-size:20px">Editar Perfil</h3>
        <div style="display:flex;flex-direction:column;gap:10px">
          <div><label class="label-overline">Nome</label><input class="input-field" data-ep-name value="${profile.name}" /></div>
          <div><label class="label-overline">E-mail</label><input class="input-field" type="email" data-ep-email value="${profile.email || ''}" placeholder="seu@email.com" /></div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">
            <div><label class="label-overline">Idade</label><input class="input-field tnum" type="number" data-ep-age value="${profile.age}" /></div>
            <div><label class="label-overline">Gênero</label>
              <select class="input-field" data-ep-gender>
                <option value="MALE" ${profile.gender === 'MALE' ? 'selected' : ''}>Masculino</option>
                <option value="FEMALE" ${profile.gender === 'FEMALE' ? 'selected' : ''}>Feminino</option>
                <option value="OTHER" ${profile.gender === 'OTHER' ? 'selected' : ''}>Outro</option>
              </select>
            </div>
          </div>
          <div style="display:flex;justify-content:space-between;align-items:center;background:var(--bg-base);padding:10px 12px;border-radius:10px;font-size:12px">
            <span style="color:var(--text-secondary)">ID de suporte: <strong class="tnum" style="color:var(--text-primary)">${profile.supportId}</strong></span>
            <button class="chip" style="padding:4px 8px;font-size:11px" data-ep-copy>${ICONS.copy}</button>
          </div>
          <button class="btn btn-primary btn-full" data-ep-save>SALVAR ALTERAÇÕES</button>
          <button class="btn btn-danger btn-full" data-ep-delete>EXCLUIR MINHA CONTA</button>
        </div>`,
      (modal) => {
        modal.querySelector('[data-ep-copy]').addEventListener('click', () => {
          navigator.clipboard?.writeText(profile.supportId).catch(() => {});
          ctx.actions.toast('ID de suporte copiado!', 'success');
        });
        modal.querySelector('[data-ep-save]').addEventListener('click', async () => {
          await db.saveProfile({
            ...profile,
            name: modal.querySelector('[data-ep-name]').value.trim() || profile.name,
            email: modal.querySelector('[data-ep-email]').value.trim(),
            age: Number(modal.querySelector('[data-ep-age]').value) || profile.age,
            gender: modal.querySelector('[data-ep-gender]').value
          });
          ctx.actions.closeModal();
          ctx.actions.toast('Perfil atualizado!', 'success');
          await ctx.actions.refreshData();
        });
        modal.querySelector('[data-ep-delete]').addEventListener('click', async () => {
          const step1 = confirm('Tem certeza que deseja excluir permanentemente sua conta e todo o histórico de treinos?\n\nAviso: se você tiver uma assinatura ativa na Google Play Store, cancele-a na loja para evitar cobranças.');
          if (!step1) return;
          const step2 = confirm('Última confirmação: esta ação apaga todos os dados locais e não pode ser desfeita.');
          if (!step2) return;
          await db.wipeAccountCompletely();
          location.reload();
        });
      });
    });
  }
};
