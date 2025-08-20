import { DEFAULT_EFFORT_TYPES } from '../data.js';

const DEFAULT_DATA = {
  meta: {
    version: 20,
    startDate: '2025-08-13',
    efficiency: 0.8,
    theme: 'Dark',
    rtl: false,
    defaultPxPerDay: 18,
    effortTypes: DEFAULT_EFFORT_TYPES.map(e => ({ ...e }))
  },
  projects: [
    { id: 'proj-sample', name: 'Sample Project', description: 'Generic project' }
  ],
  teams: [
    { id: 'team-base', name: 'Base Squad', sizes: Object.fromEntries(DEFAULT_EFFORT_TYPES.map(e => [e.key, { BE:3,iOS:2,Android:2,Online:2,QA:3 }[e.key] || 0])) },
    { id: 'team-scaled', name: 'Scaled Squad', sizes: Object.fromEntries(DEFAULT_EFFORT_TYPES.map(e => [e.key, { BE:3,iOS:4,Android:4,Online:4,QA:4 }[e.key] || 0])) }
  ],
  phases: [
    { id: 'P1', name: 'Phase 1', description: 'Entry points + Survey/Registration + Dashboard core', order: 1, color: '#0d6efd' },
    { id: 'P2', name: 'Phase 2', description: 'Content widgets and partner integration', order: 2, color: '#6610f2' },
    { id: 'ALL', name: 'One-shot', description: 'All scope in a single release', order: 1, color: '#198754' }
  ],
  proposals: [
    { id: 'prop1', projectId: 'proj-sample', title: 'Two Phases (Base Squad)', description: 'Two-phase rollout with base team', teamId: 'team-base', bufferPct: 12, phaseIds: ['P1','P2'], pxPerDay: 18, overrides: {} },
    { id: 'prop2a', projectId: 'proj-sample', title: 'Two Phases (Scaled Squad)', description: 'Two-phase rollout with scaled team', teamId: 'team-scaled', bufferPct: 12, phaseIds: ['P1','P2'], pxPerDay: 18, overrides: {} },
    { id: 'prop2b', projectId: 'proj-sample', title: 'One‑Shot (Scaled Squad)', description: 'All scope in one release, scaled team', teamId: 'team-scaled', bufferPct: 12, phaseIds: ['ALL'], pxPerDay: 18, overrides: {} }
  ],
  tasks: []
};

const seedTasks = [
  'EP1|Dashboard entry tile/banner', 'EP2|Accounts/Transactions CTA', 'EP3|Notifications/Inbox CTA', 'EP4|Settings: feature toggle & consent',
  'SR1|Consent soft-enable & opt-out','SR2|Registration stepper','SR3|Survey engine (CMS-driven)','SR4|Submit survey to BE & success',
  'DB1|Dashboard shell & skeleton','DB2|Monthly CO₂ summary','DB3|Category breakdown chart (CMS colors)','DB4|Trend period switcher (3/6/9/12m)',
  'DB5|Txn badges & details view','DB6|Empty/error/offline states','DB7|i18n/RTL & a11y polish','DB8|Analytics + feature flags',
  'CT1|Recommendations module','CT2|Tips module','CT3|Articles module','CT4|Journal module','CT5|Deals module (if enabled)',
  'LX1|Partner theming & layout adaptation','LX2|Partner release & monitoring',
  'AT1|Cucumber repo & smoke','AT2|Nightly & regression growth'
];

DEFAULT_DATA.tasks = seedTasks.map(s => {
  const [id, title] = s.split('|');
  const phase = id.startsWith('CT') || id.startsWith('LX') || id === 'AT2' ? 'P2' : 'P1';
  return {
    id,
    title,
    projectId: 'proj-sample',
    startDate: '',
    efforts: [],
    phaseIds: [phase],
    assignments: [
      { proposalId: 'prop1', phaseId: phase },
      { proposalId: 'prop2a', phaseId: phase },
      { proposalId: 'prop2b', phaseId: 'ALL' }
    ]
  };
});

DEFAULT_DATA.tasks.push(
  { id: 'TBE1', title: 'BE: APIs & integration (Phase 1)', projectId: 'proj-sample', startDate: '', efforts: [{ platform: 'BE', manDays: 74 }], phaseIds: ['P1'], assignments: [{ proposalId: 'prop1', phaseId: 'P1' }, { proposalId: 'prop2a', phaseId: 'P1' }] },
  { id: 'TBE2', title: 'BE: APIs & integration (Phase 2)', projectId: 'proj-sample', startDate: '', efforts: [{ platform: 'BE', manDays: 24 }], phaseIds: ['P2'], assignments: [{ proposalId: 'prop1', phaseId: 'P2' }, { proposalId: 'prop2a', phaseId: 'P2' }] },
  { id: 'TBE3', title: 'BE: APIs & integration (One-shot)', projectId: 'proj-sample', startDate: '', efforts: [{ platform: 'BE', manDays: 98 }], phaseIds: ['ALL'], assignments: [{ proposalId: 'prop2b', phaseId: 'ALL' }] }
);

const FE_IDS = new Set(seedTasks.map(s => s.split('|')[0]));

const BASELINE = {
  "prop1": { "P1": { "iOS": 70, "Android": 57, "Online": 52, "QA": 30, "BE": 0 }, "P2": { "iOS": 37, "Android": 30, "Online": 28, "QA": 30, "BE": 0 } },
  "prop2a": { "P1": { "iOS": 70, "Android": 57, "Online": 52, "QA": 30, "BE": 0 }, "P2": { "iOS": 37, "Android": 30, "Online": 28, "QA": 30, "BE": 0 } },
  "prop2b": { "ALL": { "iOS": 107, "Android": 87, "Online": 80, "QA": 60, "BE": 0 } }
};

function getTasksByPhase(data, projectId, phaseId){
  const pid = projectId != null ? String(projectId) : '';
  const phid = phaseId != null ? String(phaseId) : '';
  return (data.tasks||[]).filter(t => String(t.projectId ?? '') === pid && (t.phaseIds||[]).some(id => String(id) === phid));
}

function seedEffortsFromBaseline(){
  try {
    const seen = new Set();
    const types = DEFAULT_EFFORT_TYPES.map(e => e.key);
    (DEFAULT_DATA.proposals || []).forEach(plan => {
      (plan.phaseIds || []).forEach(phId => {
        const base = (BASELINE[plan.id] || {})[phId];
        if(!base) return;
        const tasks = getTasksByPhase(DEFAULT_DATA, plan.projectId, phId).filter(t => FE_IDS.has(t.id));
        const feCount = Math.max(1, tasks.length);
        tasks.forEach(t => {
          if((t.efforts || []).length) return;
          if(seen.has(t.id)) return;
          const perType = {};
          types.forEach(plat => {
            const val = +(((+base[plat] || 0) / feCount).toFixed(1));
            if(val > 0) perType[plat] = val;
          });
          t.efforts = Object.entries(perType).map(([platform, manDays]) => ({ platform, manDays }));
          seen.add(t.id);
        });
      });
    });
  } catch (e) {
    console.warn('seedEffortsFromBaseline failed', e);
  }
}

seedEffortsFromBaseline();

export { DEFAULT_DATA };
