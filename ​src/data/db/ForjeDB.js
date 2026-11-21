import { EXERCISES_SEED, PARTNER_BENEFITS_SEED } from '../seed/exercisesSeed.js';

const DB_NAME = "ForjeFitDB";
const DB_VERSION = 1;

const STORES = {
  PROFILE: 'user_profile',
  EXERCISES: 'exercises',
  PLANS: 'workout_plans',
  SESSIONS: 'workout_sessions',
  CARDIO: 'cardio_logs',
  MEASUREMENTS: 'body_measurements',
  BENEFITS: 'partner_benefits'
};

class ForjeDatabase {
  constructor() {
    this.db = null;
  }

  async open() {
    if (this.db) return this.db;
    this.db = await new Promise((resolve, reject) => {
      const req = indexedDB.open(DB_NAME, DB_VERSION);
      req.onupgradeneeded = (e) => {
        const db = e.target.result;
        if (!db.objectStoreNames.contains(STORES.PROFILE)) {
          db.createObjectStore(STORES.PROFILE, { keyPath: 'uid' });
        }
        if (!db.objectStoreNames.contains(STORES.EXERCISES)) {
          const exStore = db.createObjectStore(STORES.EXERCISES, { keyPath: 'id' });
          exStore.createIndex('primaryMuscle', 'primaryMuscle', { unique: false });
          exStore.createIndex('movementPattern', 'movementPattern', { unique: false });
        }
        if (!db.objectStoreNames.contains(STORES.PLANS)) {
          db.createObjectStore(STORES.PLANS, { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains(STORES.SESSIONS)) {
          const sStore = db.createObjectStore(STORES.SESSIONS, { keyPath: 'sessionId' });
          sStore.createIndex('startedAt', 'startedAt', { unique: false });
        }
        if (!db.objectStoreNames.contains(STORES.CARDIO)) {
          const cStore = db.createObjectStore(STORES.CARDIO, { keyPath: 'id' });
          cStore.createIndex('timestamp', 'timestamp', { unique: false });
        }
        if (!db.objectStoreNames.contains(STORES.MEASUREMENTS)) {
          const mStore = db.createObjectStore(STORES.MEASUREMENTS, { keyPath: 'id' });
          mStore.createIndex('date', 'date', { unique: false });
        }
        if (!db.objectStoreNames.contains(STORES.BENEFITS)) {
          db.createObjectStore(STORES.BENEFITS, { keyPath: 'id' });
        }
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });

    await this.seedIfEmpty();
    return this.db;
  }

  async _tx(storeName, mode, operation) {
    const db = await this.open();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, mode);
      const store = tx.objectStore(storeName);
      const req = operation(store);
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }

  async getAll(storeName) {
    return this._tx(storeName, 'readonly', (s) => s.getAll());
  }

  async getById(storeName, id) {
    return this._tx(storeName, 'readonly', (s) => s.get(id));
  }

  async put(storeName, value) {
    return this._tx(storeName, 'readwrite', (s) => s.put(value));
  }

  async remove(storeName, id) {
    return this._tx(storeName, 'readwrite', (s) => s.delete(id));
  }

  async seedIfEmpty() {
    const existingEx = await this.getAll(STORES.EXERCISES);
    if (existingEx.length === 0) {
      for (const ex of EXERCISES_SEED) {
        await this.put(STORES.EXERCISES, ex);
      }
    }
    const existingBenefits = await this.getAll(STORES.BENEFITS);
    if (existingBenefits.length === 0) {
      for (const b of PARTNER_BENEFITS_SEED) {
        await this.put(STORES.BENEFITS, b);
      }
    }
  }

  /* Helpers de Domínio */
  async getActiveProfile() {
    const profiles = await this.getAll(STORES.PROFILE);
    return profiles[0] || null;
  }

  async saveProfile(profile) {
    return this.put(STORES.PROFILE, { ...profile, updatedAt: Date.now() });
  }

  async getActivePlan() {
    const plans = await this.getAll(STORES.PLANS);
    return plans.find((p) => p.isActive) || plans[0] || null;
  }

  async savePlan(plan) {
    return this.put(STORES.PLANS, plan);
  }

  async getSessions() {
    const list = await this.getAll(STORES.SESSIONS);
    return list.sort((a, b) => b.startedAt - a.startedAt);
  }

  async saveSession(session) {
    return this.put(STORES.SESSIONS, session);
  }

  async getCardioLogs() {
    const list = await this.getAll(STORES.CARDIO);
    return list.sort((a, b) => b.timestamp - a.timestamp);
  }

  async saveCardio(log) {
    return this.put(STORES.CARDIO, log);
  }

  async getMeasurements() {
    const list = await this.getAll(STORES.MEASUREMENTS);
    return list.sort((a, b) => b.date - a.date);
  }

  async saveMeasurement(entry) {
    return this.put(STORES.MEASUREMENTS, entry);
  }

  /* Portabilidade LGPD (JSON e CSV) */
  async exportAllJSON() {
    const [profile, plans, sessions, cardio, measurements, exercises] = await Promise.all([
      this.getActiveProfile(),
      this.getAll(STORES.PLANS),
      this.getSessions(),
      this.getCardioLogs(),
      this.getMeasurements(),
      this.getAll(STORES.EXERCISES)
    ]);
    return JSON.stringify({
      app: 'ForjeFit',
      exportedAt: new Date().toISOString(),
      profile,
      plans,
      sessions,
      cardio,
      measurements,
      customExercises: exercises.filter((e) => e.isCustom)
    }, null, 2);
  }

  async exportSessionsCSV() {
    const sessions = await this.getSessions();
    const header = 'Data,Treino,Exercicio,Serie,Tipo,Peso_kg,Reps,Duracao_s,RIR,1RM_Est\n';
    const rows = [];
    for (const s of sessions) {
      const dt = new Date(s.startedAt).toISOString().slice(0, 10);
      for (const ex of s.exercises || []) {
        for (const set of ex.sets || []) {
          if (!set.isCompleted) continue;
          rows.push([
            dt,
            `"${s.dayTitle || 'Treino'}"`,
            `"${ex.namePt}"`,
            set.setNumber,
            set.setType,
            set.weightKg || 0,
            set.reps || 0,
            set.durationSec || 0,
            set.rir ?? '',
            set.estimated1RM || 0
          ].join(','));
        }
      }
    }
    return header + rows.join('\n');
  }

  /* Compliance Google Play — Exclusão Definitiva de Conta */
  async wipeAccountCompletely() {
    localStorage.clear();
    if (this.db) {
      this.db.close();
      this.db = null;
    }
    await new Promise((resolve, reject) => {
      const req = indexedDB.deleteDatabase(DB_NAME);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
      req.onblocked = () => resolve();
    });
  }
}

export const db = new ForjeDatabase();
export { STORES };
