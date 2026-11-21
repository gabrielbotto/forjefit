import { MUSCLE_GROUPS } from '../data/seed/exercisesSeed.js';
import { calcEpley1RM } from '../core/utils/formatters.js';

const EXP_MULTIPLIER = {
  BEGINNER: 0.65,
  INTERMEDIATE: 1.0,
  ADVANCED: 1.32,
  EXPERT: 1.55
};

const GENDER_MULTIPLIER = {
  MALE: 1.0,
  FEMALE: 0.68,
  OTHER: 0.85
};

/* =========================================================
 * 1. CALIBRAÇÃO REALISTA DE CARGAS INICIAIS
 * ========================================================= */
export function calibrateInitialLoadKg(exercise, profile) {
  if (exercise.trackingType !== 'WEIGHT_REPS' && exercise.trackingType !== 'WEIGHT_DURATION') {
    return 0;
  }
  const bodyWeight = profile?.currentWeightKg || 75;
  const expMult = EXP_MULTIPLIER[profile?.experienceLevel] || 1.0;
  const genMult = GENDER_MULTIPLIER[profile?.gender] || 1.0;
  const ratio = exercise.loadRatio || 0.25;

  let raw = bodyWeight * ratio * expMult * genMult;
  const step = exercise.equipmentType === 'dumbbell' ? 2 : 2.5;
  const rounded = Math.max(step, Math.round(raw / step) * step);
  return +rounded.toFixed(1);
}

/* =========================================================
 * 2. GERADOR INTELIGENTE DE DIVISÕES (SPLIT ENGINE)
 * ========================================================= */
const SPLIT_TEMPLATES = {
  1: [{ title: 'Corpo Inteiro A', muscles: ['peito', 'costas', 'quadriceps', 'ombros', 'posteriores', 'abdomen'] }],
  2: [
    { title: 'Corpo Inteiro A', muscles: ['quadriceps', 'peito', 'costas', 'ombros', 'biceps', 'abdomen'] },
    { title: 'Corpo Inteiro B', muscles: ['posteriores', 'costas', 'peito', 'gluteos', 'triceps', 'panturrilhas'] }
  ],
  3: [
    { title: 'Empurrar (Push)', muscles: ['peito', 'ombros', 'triceps'] },
    { title: 'Puxar (Pull)', muscles: ['costas', 'biceps', 'trapezio', 'antebracos'] },
    { title: 'Pernas & Core (Legs)', muscles: ['quadriceps', 'posteriores', 'gluteos', 'panturrilhas', 'abdomen'] }
  ],
  4: [
    { title: 'Superior A (Força)', muscles: ['peito', 'costas', 'ombros', 'biceps', 'triceps'] },
    { title: 'Inferior A (Quadríceps)', muscles: ['quadriceps', 'posteriores', 'gluteos', 'panturrilhas', 'abdomen'] },
    { title: 'Superior B (Hipertrofia)', muscles: ['costas', 'peito', 'ombros', 'triceps', 'biceps'] },
    { title: 'Inferior B (Posterior & Glúteo)', muscles: ['posteriores', 'gluteos', 'quadriceps', 'abdutores', 'obliquos'] }
  ],
  5: [
    { title: 'Empurrar (Push)', muscles: ['peito', 'ombros', 'triceps'] },
    { title: 'Puxar (Pull)', muscles: ['costas', 'trapezio', 'biceps', 'antebracos'] },
    { title: 'Pernas (Legs)', muscles: ['quadriceps', 'posteriores', 'gluteos', 'panturrilhas'] },
    { title: 'Superior Completo (Upper)', muscles: ['peito', 'costas', 'ombros', 'biceps', 'triceps'] },
    { title: 'Inferior & Core (Lower)', muscles: ['posteriores', 'gluteos', 'quadriceps', 'abdomen', 'obliquos'] }
  ],
  6: [
    { title: 'Empurrar A', muscles: ['peito', 'ombros', 'triceps'] },
    { title: 'Puxar A', muscles: ['costas', 'trapezio', 'biceps'] },
    { title: 'Pernas A', muscles: ['quadriceps', 'posteriores', 'panturrilhas', 'abdomen'] },
    { title: 'Empurrar B', muscles: ['ombros', 'peito', 'triceps'] },
    { title: 'Puxar B', muscles: ['costas', 'biceps', 'antebracos', 'lombar'] },
    { title: 'Pernas B', muscles: ['posteriores', 'gluteos', 'quadriceps', 'obliquos'] }
  ]
};

function getAvailableEquipment(profile) {
  if (profile.ownedEquipmentIds && profile.ownedEquipmentIds.length > 0) {
    return new Set([...profile.ownedEquipmentIds, 'bodyweight']);
  }
  const map = {
    FULL_GYM: ['barbell', 'dumbbell', 'bench', 'cable', 'machine', 'pullup_bar', 'band', 'bodyweight'],
    SMALL_GYM: ['barbell', 'dumbbell', 'bench', 'cable', 'pullup_bar', 'band', 'bodyweight'],
    HOME_GYM: ['dumbbell', 'bench', 'pullup_bar', 'band', 'bodyweight'],
    BODYWEIGHT: ['bodyweight', 'band']
  };
  return new Set(map[profile.equipmentProfile] || map.FULL_GYM);
}

function getRepAndRestConfig(exercise, goal) {
  if (exercise.trackingType === 'DURATION_SECONDS') {
    return { targetRepRange: '45s', restSeconds: 45, targetSets: 3 };
  }
  if (exercise.trackingType === 'DISTANCE_TIME') {
    return { targetRepRange: '15 min', restSeconds: 0, targetSets: 1 };
  }
  if (goal === 'STRENGTH') {
    return exercise.isCompound
      ? { targetRepRange: '5-7', restSeconds: 150, targetSets: 4 }
      : { targetRepRange: '8-10', restSeconds: 90, targetSets: 3 };
  }
  if (goal === 'CONDITIONING') {
    return { targetRepRange: '12-15', restSeconds: 60, targetSets: 3 };
  }
  // HYPERTROPHY / DEFINITION
  return exercise.isCompound
    ? { targetRepRange: '8-10', restSeconds: 120, targetSets: 4 }
    : { targetRepRange: '10-14', restSeconds: 75, targetSets: 3 };
}

export function generateWorkoutPlan(profile, catalog) {
  const daysCount = Math.min(6, Math.max(1, Number(profile.daysPerWeek) || 4));
  const durationMin = Number(profile.sessionDurationMin) || 50;
  const maxExercisesPerDay = durationMin <= 25 ? 4 : durationMin <= 40 ? 5 : durationMin <= 60 ? 6 : 7;

  const allowedEquip = getAvailableEquipment(profile);
  const injuries = new Set(profile.activeInjuries || []);
  const priorities = new Set(profile.priorityMuscleGroups || []);

  const safeCatalog = catalog.filter((ex) => {
    if (ex.movementPattern === 'CARDIO') return false;
    if (!allowedEquip.has(ex.equipmentType)) return false;
    const hasConflict = (ex.contraindicatedInjuries || []).some((inj) => injuries.has(inj));
    return !hasConflict;
  });

  const template = SPLIT_TEMPLATES[daysCount] || SPLIT_TEMPLATES[4];
  const usedAcrossWeek = new Set();

  const days = template.map((tpl, dayIndex) => {
    const picked = [];
    const warmedGroups = new Set();
    const dayUsedIds = new Set();

    // Prioriza músculos selecionados no mapa corporal
    const sortedMuscles = [...tpl.muscles].sort((a, b) => (priorities.has(b) ? 1 : 0) - (priorities.has(a) ? 1 : 0));

    // Garante variedade sem misturar padrão de empurrar/puxar em dias exclusivos
    const isPurePush = tpl.title.startsWith('Empurrar');
    const isPurePull = tpl.title.startsWith('Puxar');

    for (const muscle of sortedMuscles) {
      if (picked.length >= maxExercisesPerDay) break;
      const candidates = safeCatalog
        .filter((e) => e.primaryMuscle === muscle)
        .filter((e) => !(isPurePush && e.movementPattern === 'PULL'))
        .filter((e) => !(isPurePull && e.movementPattern === 'PUSH'))
        .filter((e) => !dayUsedIds.has(e.id))
        .sort((a, b) => {
          // Compostos primeiro, depois não repetidos na semana
          if (a.isCompound !== b.isCompound) return b.isCompound ? 1 : -1;
          const aUsed = usedAcrossWeek.has(a.id) ? 1 : 0;
          const bUsed = usedAcrossWeek.has(b.id) ? 1 : 0;
          return aUsed - bUsed;
        });

      const quota = priorities.has(muscle) && picked.length + 2 <= maxExercisesPerDay ? 2 : 1;
      for (let i = 0; i < Math.min(quota, candidates.length); i++) {
        if (picked.length >= maxExercisesPerDay) break;
        const chosen = candidates[i];
        dayUsedIds.add(chosen.id);
        usedAcrossWeek.add(chosen.id);
        picked.push(chosen);
      }
    }

    // Ordenação Biomecânica Estrita: Compostos multiarticulares sempre antes de isoladores e Core no final
    picked.sort((a, b) => {
      if (a.movementPattern === 'CORE' && b.movementPattern !== 'CORE') return 1;
      if (b.movementPattern === 'CORE' && a.movementPattern !== 'CORE') return -1;
      if (a.isCompound !== b.isCompound) return b.isCompound ? 1 : -1;
      return 0;
    });

    const items = picked.map((exercise, idx) => {
      const cfg = getRepAndRestConfig(exercise, profile.primaryGoal);
      const needsWarmup = exercise.isCompound && !warmedGroups.has(exercise.primaryMuscle) && exercise.trackingType === 'WEIGHT_REPS';
      if (needsWarmup) warmedGroups.add(exercise.primaryMuscle);

      return {
        itemId: `item_${dayIndex + 1}_${idx + 1}_${exercise.id}`,
        exerciseId: exercise.id,
        namePt: exercise.namePt,
        primaryMuscle: exercise.primaryMuscle,
        secondaryMuscles: exercise.secondaryMuscles,
        movementPattern: exercise.movementPattern,
        trackingType: exercise.trackingType,
        isCompound: exercise.isCompound,
        isAnchorExercise: exercise.isCompound && idx < 2,
        hasWarmupSets: needsWarmup,
        isOptional: idx === picked.length - 1 && picked.length >= 6,
        targetSets: cfg.targetSets,
        targetRepRange: cfg.targetRepRange,
        restSeconds: cfg.restSeconds,
        suggestedLoadKg: calibrateInitialLoadKg(exercise, profile),
        orderIndex: idx
      };
    });

    return {
      dayId: `day_${dayIndex + 1}`,
      dayNumber: dayIndex + 1,
      title: tpl.title,
      targetMuscles: [...new Set(items.map((i) => i.primaryMuscle))],
      items
    };
  });

  return {
    id: `plan_${Date.now()}`,
    name: `Plano ${daysCount}x — ${profile.primaryGoal === 'STRENGTH' ? 'Força' : profile.primaryGoal === 'DEFINITION' ? 'Definição' : 'Hipertrofia'}`,
    isActive: true,
    mode: profile.planMode || 'AI_HYBRID',
    daysPerWeek: daysCount,
    sessionDurationMin: durationMin,
    periodizationMode: profile.periodizationMode || 'BALANCED_6W',
    cycleStartDate: Date.now(),
    currentWeek: 1,
    days
  };
}

/* =========================================================
 * 3. GERADOR DE TREINO RÁPIDO AVULSO (ON-DEMAND)
 * ========================================================= */
export function generateQuickWorkout({ durationMin, difficulty, equipmentProfile, targetMuscles, includeCardio }, profile, catalog) {
  const tempProfile = {
    ...profile,
    experienceLevel: difficulty || profile.experienceLevel,
    equipmentProfile: equipmentProfile || profile.equipmentProfile,
    ownedEquipmentIds: []
  };
  const allowedEquip = getAvailableEquipment(tempProfile);
  const injuries = new Set(profile.activeInjuries || []);
  const maxEx = durationMin <= 30 ? 4 : durationMin <= 45 ? 5 : 7;

  const pool = catalog.filter((e) => {
    if (e.movementPattern === 'CARDIO') return false;
    if (!allowedEquip.has(e.equipmentType)) return false;
    if ((e.contraindicatedInjuries || []).some((i) => injuries.has(i))) return false;
    return targetMuscles.includes(e.primaryMuscle);
  });

  pool.sort((a, b) => (b.isCompound ? 1 : 0) - (a.isCompound ? 1 : 0));
  const selected = pool.slice(0, maxEx);

  const items = selected.map((exercise, idx) => {
    const cfg = getRepAndRestConfig(exercise, profile.primaryGoal);
    return {
      itemId: `quick_${idx}_${exercise.id}`,
      exerciseId: exercise.id,
      namePt: exercise.namePt,
      primaryMuscle: exercise.primaryMuscle,
      secondaryMuscles: exercise.secondaryMuscles,
      movementPattern: exercise.movementPattern,
      trackingType: exercise.trackingType,
      isCompound: exercise.isCompound,
      hasWarmupSets: idx === 0 && exercise.isCompound && exercise.trackingType === 'WEIGHT_REPS',
      isOptional: false,
      targetSets: cfg.targetSets,
      targetRepRange: cfg.targetRepRange,
      restSeconds: cfg.restSeconds,
      suggestedLoadKg: calibrateInitialLoadKg(exercise, tempProfile),
      orderIndex: idx
    };
  });

  if (includeCardio) {
    const cardioEx = catalog.find((e) => e.movementPattern === 'CARDIO' && allowedEquip.has(e.equipmentType))
      || catalog.find((e) => e.id === 'ex_corrida_rua');
    if (cardioEx) {
      items.push({
        itemId: `quick_cardio_${cardioEx.id}`,
        exerciseId: cardioEx.id,
        namePt: cardioEx.namePt,
        primaryMuscle: 'cardio',
        secondaryMuscles: [],
        movementPattern: 'CARDIO',
        trackingType: 'DISTANCE_TIME',
        isCompound: false,
        hasWarmupSets: false,
        isOptional: false,
        targetSets: 1,
        targetRepRange: '15 min',
        restSeconds: 0,
        suggestedLoadKg: 0,
        orderIndex: items.length
      });
    }
  }

  return {
    dayId: `quick_${Date.now()}`,
    dayNumber: 0,
    title: `Treino Rápido (${durationMin} min)`,
    isTransient: true,
    targetMuscles,
    items
  };
}

/* =========================================================
 * 4. AUTO-REGULAÇÃO E SOBRECARGA PROGRESSIVA (RIR + 1RM)
 * ========================================================= */
export function evaluateProgressiveOverload(exerciseItem, completedSets, historicalBest1RM = 0) {
  const workingSets = completedSets.filter((s) => s.isCompleted && s.setType !== 'WARMUP');
  if (workingSets.length === 0) return { nextSuggestedLoadKg: exerciseItem.suggestedLoadKg, prCount: 0, advice: null };

  let bestSession1RM = 0;
  let prCount = 0;
  for (const s of workingSets) {
    const e1rm = calcEpley1RM(s.weightKg, s.reps);
    s.estimated1RM = e1rm;
    if (e1rm > bestSession1RM) bestSession1RM = e1rm;
    if (e1rm > historicalBest1RM && historicalBest1RM > 0) {
      s.isPrAchieved = true;
      prCount++;
    }
  }

  const rangeParts = String(exerciseItem.targetRepRange || '8-12').split('-').map((n) => parseInt(n, 10));
  const topRep = rangeParts[1] || rangeParts[0] || 10;
  const hitTopAll = workingSets.every((s) => (s.reps || 0) >= topRep);
  const avgRir = workingSets.reduce((acc, s) => acc + (s.rir ?? 2), 0) / workingSets.length;
  const maxLoad = Math.max(...workingSets.map((s) => s.weightKg || 0));

  let nextLoad = maxLoad || exerciseItem.suggestedLoadKg;
  let advice = 'Mantenha a carga e busque 1 repetição extra na próxima sessão.';

  if (hitTopAll && avgRir >= 2 && maxLoad > 0) {
    const inc = maxLoad >= 40 ? 2.5 : 2;
    nextLoad = +(maxLoad + inc).toFixed(1);
    advice = `Sobrecarga liberada! Suba para ${nextLoad} kg na próxima sessão.`;
  } else if (avgRir === 0 && !hitTopAll && maxLoad > 4) {
    advice = 'Alta fadiga (RIR 0). Consolide esta carga com técnica limpa antes de subir.';
  }

  return { nextSuggestedLoadKg: nextLoad, bestSession1RM, prCount, advice };
}

/* =========================================================
 * 5. MOTOR DE RECUPERAÇÃO MUSCULAR PONDERADO (16 GRUPOS)
 * ========================================================= */
export function computeMuscleRecovery(sessions, nowMs = Date.now()) {
  const statusMap = {};
  for (const mg of MUSCLE_GROUPS) {
    if (mg.id === 'cardio') continue;
    statusMap[mg.id] = {
      ...mg,
      fatiguePercent: 0,
      status: 'READY', // READY | RECOVERING | FATIGUED
      lastTrainedAt: null
    };
  }

  const recentSessions = sessions.filter((s) => nowMs - s.startedAt <= 96 * 3600 * 1000);

  for (const session of recentSessions) {
    const hoursAgo = Math.max(0.5, (nowMs - (session.finishedAt || session.startedAt)) / 3600000);
    for (const ex of session.exercises || []) {
      const validSets = (ex.sets || []).filter((s) => s.isCompleted && s.setType !== 'WARMUP');
      if (validSets.length === 0) continue;

      const avgRir = validSets.reduce((acc, s) => acc + (s.rir ?? 2), 0) / validSets.length;
      const intensityFactor = 1.25 - Math.min(4, avgRir) * 0.1; // RIR 0 -> 1.25x fadiga

      const applyFatigue = (muscleId, weight) => {
        const entry = statusMap[muscleId];
        if (!entry) return;
        const recoveryWindow = entry.recoveryHours;
        const decay = Math.max(0, 1 - hoursAgo / recoveryWindow);
        const added = validSets.length * 14 * weight * intensityFactor * decay;
        entry.fatiguePercent = Math.min(100, Math.round(entry.fatiguePercent + added));
        if (!entry.lastTrainedAt || session.startedAt > entry.lastTrainedAt) {
          entry.lastTrainedAt = session.startedAt;
        }
      };

      applyFatigue(ex.primaryMuscle, 1.0);
      for (const sec of ex.secondaryMuscles || []) {
        applyFatigue(sec, 0.5);
      }
    }
  }

  let readyCount = 0;
  let recoveringCount = 0;
  let fatiguedCount = 0;

  for (const key of Object.keys(statusMap)) {
    const m = statusMap[key];
    if (m.fatiguePercent >= 60) {
      m.status = 'FATIGUED';
      fatiguedCount++;
    } else if (m.fatiguePercent >= 25) {
      m.status = 'RECOVERING';
      recoveringCount++;
    } else {
      m.status = 'READY';
      readyCount++;
    }
  }

  return { muscles: statusMap, readyCount, recoveringCount, fatiguedCount };
}

/* =========================================================
 * 6. CONTAGEM FRACIONADA DE VOLUME SEMANAL (MEV / MAV / MRV)
 * ========================================================= */
export function computeWeeklyFractionalVolume(sessionsInPeriod) {
  const byMuscle = {};
  const byPattern = {
    PUSH: { label: 'Empurrar', sets: 0, mev: 8, mav: 16, mrv: 22, muscles: {} },
    PULL: { label: 'Puxar', sets: 0, mev: 8, mav: 16, mrv: 22, muscles: {} },
    LEGS: { label: 'Pernas', sets: 0, mev: 8, mav: 14, mrv: 20, muscles: {} },
    CORE: { label: 'Core', sets: 0, mev: 4, mav: 10, mrv: 16, muscles: {} }
  };
  const radar = { PERNAS: 0, BRACOS: 0, PEITORAL: 0, OMBROS: 0, COSTAS: 0, CORE: 0 };

  const muscleLookup = Object.fromEntries(MUSCLE_GROUPS.map((m) => [m.id, m]));

  for (const s of sessionsInPeriod) {
    for (const ex of s.exercises || []) {
      const count = (ex.sets || []).filter((st) => st.isCompleted && st.setType !== 'WARMUP').length;
      if (!count) continue;

      const add = (muscleId, factor) => {
        const meta = muscleLookup[muscleId];
        if (!meta || meta.pattern === 'CARDIO') return;
        const credit = count * factor;
        byMuscle[muscleId] = +( (byMuscle[muscleId] || 0) + credit ).toFixed(1);
        if (radar[meta.macro] !== undefined) {
          radar[meta.macro] = +(radar[meta.macro] + credit).toFixed(1);
        }
        const bucket = byPattern[meta.pattern];
        if (bucket) {
          bucket.sets = +(bucket.sets + credit).toFixed(1);
          bucket.muscles[meta.name] = +((bucket.muscles[meta.name] || 0) + credit).toFixed(1);
        }
      };

      add(ex.primaryMuscle, 1.0);
      for (const sec of ex.secondaryMuscles || []) {
        add(sec, 0.5);
      }
    }
  }

  return { byMuscle, byPattern, radar };
}

/* =========================================================
 * 7. NUTRIÇÃO BASE (MIFFLIN-ST JEOR) & PROJEÇÃO REALISTA
 * ========================================================= */
export function calculateNutritionAndProjection(profile) {
  const weight = profile.currentWeightKg || 75;
  const target = profile.targetWeightKg || weight;
  const height = profile.heightCm || 172;
  const age = profile.age || 28;
  const days = profile.daysPerWeek || 4;

  // Taxa Metabólica Basal (Mifflin-St Jeor)
  const genderOffset = profile.gender === 'FEMALE' ? -161 : 5;
  const tmb = Math.round(10 * weight + 6.25 * height - 5 * age + genderOffset);

  const activityFactor = days <= 2 ? 1.375 : days <= 4 ? 1.55 : 1.725;
  const tdee = Math.round(tmb * activityFactor);

  const diffKg = +(target - weight).toFixed(1);
  let targetCalories = tdee;
  let weeklyRateKg = 0;

  if (diffKg < -0.5) {
    // Déficit seguro: 0.6% do peso corporal por semana
    weeklyRateKg = -Math.max(0.35, Math.min(0.85, +(weight * 0.006).toFixed(2)));
    targetCalories = Math.max(tmb, tdee - Math.round(Math.abs(weeklyRateKg) * 1100));
  } else if (diffKg > 0.5) {
    // Superávit limpo para hipertrofia: ~0.25 a 0.35 kg/semana
    weeklyRateKg = 0.25;
    targetCalories = tdee + 280;
  }

  const weeksToGoal = weeklyRateKg !== 0 ? Math.max(2, Math.ceil(Math.abs(diffKg / weeklyRateKg))) : 8;
  const projectedDate = new Date(Date.now() + weeksToGoal * 7 * 86400000);

  return {
    tmb,
    tdee,
    targetCalories,
    proteinGrams: Math.round(weight * (profile.primaryGoal === 'DEFINITION' ? 2.1 : 1.85)),
    waterMl: Math.round(weight * 40),
    weeklyRateKg,
    weeksToGoal,
    projectedDate
  };
}

/* =========================================================
 * 8. CALCULADORA DE ANILHAS (POR LADO DA BARRA)
 * ========================================================= */
export function calculatePlatesPerSide(totalKg, barWeightKg = 20) {
  const available = [25, 20, 15, 10, 5, 2.5, 1.25];
  if (totalKg <= barWeightKg) return { barWeightKg, perSide: [], remainder: 0 };

  let remainingPerSide = (totalKg - barWeightKg) / 2;
  const perSide = [];

  for (const plate of available) {
    while (remainingPerSide >= plate - 0.01) {
      perSide.push(plate);
      remainingPerSide = +(remainingPerSide - plate).toFixed(2);
    }
  }
  return { barWeightKg, perSide, remainder: remainingPerSide };
}

/* =========================================================
 * 9. SCORE DE PRONTIDÃO DINÂMICO (0-100)
 * ========================================================= */
export function computeReadinessScore(profile, sessions = []) {
  const baseStrength = { BEGINNER: 48, INTERMEDIATE: 68, ADVANCED: 82, EXPERT: 92 }[profile.experienceLevel] || 65;
  const recent30d = sessions.filter((s) => Date.now() - s.startedAt <= 30 * 86400000).length;
  const expected30d = (profile.daysPerWeek || 4) * 4;
  const consistency = sessions.length === 0
    ? ({ REGULAR: 76, INCONSISTENT: 54, NEVER: 35 }[profile.consistencyStatus] || 60)
    : Math.min(98, Math.round((recent30d / Math.max(1, expected30d)) * 100));

  const recovery = computeMuscleRecovery(sessions);
  const recoveryScore = Math.round((recovery.readyCount / 16) * 100);
  const adherence = Math.min(98, Math.round((consistency * 0.6) + (baseStrength * 0.4)));
  const overall = Math.round((baseStrength + consistency + recoveryScore + adherence) / 4);

  return { overall, strength: baseStrength, consistency, recovery: recoveryScore, adherence };
}
