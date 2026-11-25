import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import './App.css';
import {
    Dumbbell,
    Calendar,
    Utensils,
    TrendingUp,
    BarChart3,
    Settings,
    Check,
    Play,
    Pause,
    SkipForward,
    Award,
    Flame,
    Droplets,
    AlertTriangle,
    ArrowUpRight,
    ArrowDownRight,
    Info,
    Sun,
    Moon,
    Download,
    Upload,
    Trash2,
    Clock,
    ChevronRight,
    CheckCircle2,
    Sparkles,
    Scale,
    ShieldCheck,
    ShieldAlert,
    Brain,
    Target,
    Trophy,
    Activity,
    X,
    Footprints,
    Zap,
    RotateCcw,
    Plus,
    ShoppingBag,
    RefreshCw,
    Cloud,
    CloudOff,
    Database,
    History
} from 'lucide-react';
import {
    ResponsiveContainer,
    ComposedChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ReferenceArea,
    ReferenceLine,
    Area,
    BarChart,
    Bar,
    Cell,
    RadarChart,
    Radar,
    PolarGrid,
    PolarAngleAxis,
    RadialBarChart,
    RadialBar,
    PolarAngleAxis as RadialPolarAngleAxis
} from 'recharts';

// ============================================================================
// SECTION 0: BACKEND API CLIENT (DEDICATED POSTGRESQL RELATIONAL BACKEND)
// ============================================================================

export const API_BASE_URL = (
    (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_URL) ||
    'http://localhost:3001'
).replace(/\/+$/, '');

async function apiRequest(path, options = {}) {
    const controller = new AbortController();
    const timeoutMs = options.timeoutMs || 15000;
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    try {
        const res = await fetch(`${API_BASE_URL}${path}`, {
            method: options.method || 'GET',
            headers: {
                'Content-Type': 'application/json',
                ...(options.headers || {})
            },
            body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
            signal: controller.signal
        });

        const text = await res.text();
        let json = {};
        try {
            json = text ? JSON.parse(text) : {};
        } catch {
            json = { error: text || `HTTP ${res.status}` };
        }

        if (!res.ok) {
            throw new Error(json.error || json.message || `Request failed (${res.status})`);
        }
        return json;
    } finally {
        clearTimeout(timer);
    }
}

export const vtaperApi = {
    health: () => apiRequest('/api/health'),
    bootstrap: () => apiRequest('/api/bootstrap'),
    updateConfig: (payload) => apiRequest('/api/config', { method: 'PUT', body: payload }),
    completeWorkout: (payload) =>
        apiRequest('/api/workouts/complete', { method: 'POST', body: payload }),
    getWorkoutRecall: (dayIndex) => apiRequest(`/api/workouts/recall/${dayIndex}`),
    deleteWorkout: (id) => apiRequest(`/api/workouts/${id}`, { method: 'DELETE' }),
    saveDailyLog: (date, payload) =>
        apiRequest(`/api/daily/${date}`, { method: 'PUT', body: payload }),
    saveWeightLog: (date, payload) =>
        apiRequest(`/api/weights/${date}`, { method: 'PUT', body: payload }),
    deleteWeightLog: (date) => apiRequest(`/api/weights/${date}`, { method: 'DELETE' }),
    addMeasurement: (payload) => apiRequest('/api/measurements', { method: 'POST', body: payload }),
    deleteMeasurement: (id) => apiRequest(`/api/measurements/${id}`, { method: 'DELETE' }),
    saveDiscipline: (date, payload) =>
        apiRequest(`/api/discipline/${date}`, { method: 'PUT', body: payload }),
    deleteDiscipline: (date) => apiRequest(`/api/discipline/${date}`, { method: 'DELETE' }),
    logUrge: (payload) => apiRequest('/api/urges', { method: 'POST', body: payload }),
    saveCardio: (date, payload) =>
        apiRequest(`/api/cardio/${date}`, { method: 'PUT', body: payload }),
    savePelvic: (date, payload) =>
        apiRequest(`/api/pelvic/${date}`, { method: 'PUT', body: payload }),
    getOverview: (period = 'weekly') => apiRequest(`/api/overview?period=${period}`),
    listBackups: () => apiRequest('/api/backups'),
    createBackupNow: () => apiRequest('/api/backups/now', { method: 'POST' }),
    restoreBackup: (snapshotDate) =>
        apiRequest('/api/backups/restore', { method: 'POST', body: { snapshotDate } }),
    importState: (data) => apiRequest('/api/import', { method: 'POST', body: { data } }),
    resetAll: (theme = 'dark') => apiRequest('/api/reset', { method: 'POST', body: { theme } })
};

// ============================================================================
// SECTION 1: SCIENCE RULES (Pure Constants — Zero App State Mixed In)
// ============================================================================

export const SCIENCE_RULES = {
    VOLUME_MIN_SETS: 10,
    VOLUME_MAX_SETS: 20,
    VOLUME_MINOR_MIN_SETS: 6,
    VOLUME_MINOR_MAX_SETS: 12,
    SECONDARY_MUSCLE_CREDIT: 0.5,

    COMPOUND_TARGET_RIR: '2 RIR',
    ISOLATION_TARGET_RIR: '0–2 RIR (last set optional failure calibration)',

    RAMP_IN_SETS: 3,
    RAMP_IN_RIR: '3–4 RIR',
    DELOAD_FREQUENCY_WEEKS: 6,

    REST_COMPOUND_HEAVY_SEC: 150,
    REST_COMPOUND_STD_SEC: 120,
    REST_ISOLATION_STRETCH_SEC: 90,
    REST_ISOLATION_STD_SEC: 75,

    BMR_KCAL: 1526,
    TDEE_MIN_KCAL: 2350,
    TDEE_MAX_KCAL: 2650,
    TARGET_KCAL: 2900,
    MIN_ACCEPTABLE_KCAL: 2600,
    ADVISORY_CARBS_G: 370,
    ADVISORY_FAT_G: 95,

    TARGET_PROTEIN_G: 130,
    FLOOR_PROTEIN_G: 110,
    MIN_PROTEIN_FEEDINGS: 4,
    MIN_PROTEIN_PER_FEEDING_G: 22,

    GAIN_IGNORE_INITIAL_DAYS: 14,
    GAIN_MIN_PCT_BW: 0.0025,
    GAIN_MAX_PCT_BW: 0.01,
    GAIN_UPPER_HARD_CAP_KG: 0.7,
    GAIN_LOWER_FLOOR_KG: 0.2,

    TARGET_WATER_ML: 3500,
    TARGET_SLEEP_HOURS: 7.5,
    REBOOT_TARGET_DAYS: 90
};

export const DEFAULT_STEP_INCREMENTS = {
    'B2.5': { label: '+2.5 kg (Barbell)', deltaKg: 2.5, mode: 'add' },
    B5: { label: '+5.0 kg (Barbell / Sled)', deltaKg: 5.0, mode: 'add' },
    DB: { label: '+2.0 kg (Next Dumbbell Pair)', deltaKg: 2.0, mode: 'add' },
    PIN: { label: '+2.5 kg (1 Stack Pin)', deltaKg: 2.5, mode: 'add' },
    S1: { label: '+1.0 kg (Micro-load / Cable)', deltaKg: 1.0, mode: 'add' },
    ASSIST: { label: '-5.0 kg Assistance (Harder)', deltaKg: -5.0, mode: 'assist' },
    BW: { label: 'Reps first, then +2.5 kg', deltaKg: 2.5, mode: 'bodyweight' }
};

// ============================================================================
// SECTION 2: FINAL TRAINING DATA (6-Day PPL V-Taper Split — Exact 131 Sets)
// ============================================================================

export const WORKOUT_PLAN = [
    {
        dayIndex: 1,
        shortDay: 'Mon',
        dayName: 'Monday',
        title: 'Push A',
        subtitle: 'Chest, Shoulders & Triceps (7 Exercises • 21 Sets)',
        isRest: false,
        estimatedMinutes: 75,
        chartFile: 'monday.png',
        chartImage: '/charts/monday.png',
        exercises: [
            {
                id: 'mon-1',
                name: 'Flat Barbell Bench Press',
                sets: 3,
                repMin: 6,
                repMax: 8,
                repLabel: '6-8',
                type: 'compound',
                restSec: 150,
                targetMuscle: 'Chest',
                primaryGroup: 'Chest',
                secondaryGroups: ['Front delts', 'Triceps'],
                step: 'B2.5',
                cue: 'Shoulder blades pinned back and down, feet planted, touch the lower chest, press up and slightly back.',
                alternatives: ['Machine Chest Press', 'Flat DB Press'],
                flags: {},
                guide: {
                    setup: 'Bench par let kar aankhein bar ke bilkul neeche rakhein. Dono pair zameen par mazbooti se jamayein. Shoulder blades (kandhe ki peechli haddiyan) peeche aur neeche pinch karke bench mein lock karein—halka natural arch aayega. Grip shoulder-width se thodi wide rakhein.',
                    execution: 'Bar ko unrack karke chest ke upar laayein. Saans andar bhar kar elbows ko 45° angle par (body se chipka nahi, aur bilkul 90° T-shape bhi nahi) rakh kar 2–3 second mein bar ko lower chest / nipple line par touch karein, phir upar press karein.',
                    feelRight: 'Neeche aate waqt poore chest (middle & outer) mein deep stretch aur upar press karte waqt chest mein tight squeeze feel hona chahiye.',
                    feelWrong: 'Agar front shoulder mein chubhan ya elbow mein dard ho, toh aap elbows ko 90° bahar phaila rahe hain ya bar ko gale ke paas neeche laa rahe hain.'
                }
            },
            {
                id: 'mon-2',
                name: 'Incline DB Press (30° bench)',
                sets: 3,
                repMin: 8,
                repMax: 10,
                repLabel: '8-10',
                type: 'compound',
                restSec: 120,
                targetMuscle: 'Upper chest',
                primaryGroup: 'Chest',
                secondaryGroups: ['Front delts', 'Triceps'],
                step: 'DB',
                cue: 'Elbows about 45° from the torso, deep stretch at the bottom, press without clanging the dumbbells.',
                alternatives: ['Incline Machine Press'],
                flags: {},
                guide: {
                    setup: 'Bench ko 30° angle par set karein (45° ya usse zyada mat karein warna shoulder takeover kar lega). Chest upar utha kar shoulder blades bench mein press karein.',
                    execution: 'Dumbbells ko 45° elbow angle par dheere se chest ke kinare tak neeche laayein taaki poora stretch mile. Upar press karte waqt dumbbells ko halka andar laayein par aapas mein takrana nahi hai.',
                    feelRight: 'Collarbone ke neeche wale hisse (Upper Chest) mein gehra stretch aur pump feel hona chahiye—yahi aesthetic chest shelf banata hai.',
                    feelWrong: 'Agar sirf front shoulder jal raha hai, toh bench angle zyada uncha hai ya shoulders aage roll ho rahe hain.'
                }
            },
            {
                id: 'mon-3',
                name: 'Seated DB Shoulder Press',
                sets: 3,
                repMin: 8,
                repMax: 10,
                repLabel: '8-10',
                type: 'compound',
                restSec: 120,
                targetMuscle: 'Front delts',
                primaryGroup: 'Front delts',
                secondaryGroups: ['Side delts', 'Triceps'],
                step: 'DB',
                cue: 'Back flat on the pad, ribs down, press up and slightly inward, stop just short of lockout.',
                alternatives: ['Machine Shoulder Press'],
                flags: {},
                guide: {
                    setup: 'Bench ko bilkul 90° seedha na rakh kar ek notch peeche (~75–80°) rakhein. Peeth pad se chipka kar core tight karein aur elbows ko bilkul side mein nahi balki 30° aage (scapular plane) rakhein.',
                    execution: 'Dumbbells ko kaan (ear) ke level tak slow neeche laayein, phir seedha upar press karein. Top par elbows ko hard lock karne se just pehle ruk kar next rep shuru karein.',
                    feelRight: 'Front aur side shoulder (deltoid cap) mein clean burn aur fullness feel honi chahiye.',
                    feelWrong: 'Agar lower back mein dard aaye toh weight heavy hai aur aap peeth arch kar rahe hain; agar neck tight ho toh shoulders upar shrug kar rahe hain.'
                }
            },
            {
                id: 'mon-4',
                name: 'DB Lateral Raise',
                sets: 4,
                repMin: 12,
                repMax: 15,
                repLabel: '12-15',
                type: 'isolation',
                restSec: 75,
                targetMuscle: 'Side delts',
                primaryGroup: 'Side delts',
                secondaryGroups: [],
                step: 'S1',
                cue: 'Slight forward lean, lead with the elbows, raise to shoulder height, lower over 2 s, no swinging.',
                alternatives: ['Cable Lateral Raise', 'Machine Lateral Raise'],
                flags: {},
                guide: {
                    setup: 'Pair shoulder-width par, kamar se halka sa (10–15°) aage jhukein. Dumbbells thighs ke side mein rakhein, elbows mein halka bend aur shoulders neeche relaxed rakhein.',
                    execution: 'Haathon ko seedha side mein nahi balki halka aage (20–30° angle par) bahar ki taraf push karein jaise deewar chhuni ho. Sirf shoulder height tak uthayein aur 2 second mein slow neeche laayein.',
                    feelRight: 'Kandhe ke bilkul side (Side Delt cap) mein tez burn feel hona chahiye—V-taper width ka #1 muscle yahi hai.',
                    feelWrong: 'Agar gardan ke side (upper traps) mein tension aaye, toh weight zyada heavy hai ya aap shoulders ko kaan ki taraf uchka rahe hain.'
                }
            },
            {
                id: 'mon-5',
                name: 'Overhead Triceps Extension (cable rope or DB)',
                sets: 3,
                repMin: 10,
                repMax: 12,
                repLabel: '10-12',
                type: 'isolation',
                restSec: 90,
                targetMuscle: 'Triceps long head',
                primaryGroup: 'Triceps',
                secondaryGroups: [],
                step: 'PIN',
                cue: 'Elbows beside the ears, lower until the triceps stretch hard behind the head, then extend fully.',
                alternatives: ['EZ Skull Crusher'],
                flags: { updatedInV2: true },
                guide: {
                    setup: 'Cable pulley ko kamar ya neeche ke level par set karein, machine se peeth karke khade hon aur ek pair aage rakh kar balance banayein. Elbows sir ke side mein lock rakhein.',
                    execution: 'Sirf forearms ko peeche jaane dein jab tak triceps mein poora stretch na aa jaye, phir rope ko aage-upar extend karein aur 1 second squeeze karein.',
                    feelRight: 'Baanh ke bilkul peeche aur andar (Triceps Long Head — arm ka sabse bada hissa) mein deep stretch aur burn feel hoga.',
                    feelWrong: 'Agar elbow joint mein sharp pain aaye toh weight kam karein aur thoda zyada warm-up karein; lower back arch mat hone dein.'
                }
            },
            {
                id: 'mon-6',
                name: 'Triceps Rope Pushdown',
                sets: 3,
                repMin: 12,
                repMax: 15,
                repLabel: '12-15',
                type: 'isolation',
                restSec: 75,
                targetMuscle: 'Triceps',
                primaryGroup: 'Triceps',
                secondaryGroups: [],
                step: 'PIN',
                cue: 'Elbows pinned to the ribs, spread the rope at the bottom, control the return.',
                alternatives: [],
                flags: { updatedInV2: true },
                guide: {
                    setup: 'High pulley par rope lagayein, machine se 1 kadam peeche, hips halka peeche aur chest upar rakhein. Elbows ko pasliyon (ribs) ke side mein chipka kar fix kar dein.',
                    execution: 'Upper arm ko bilkul hilaye bina rope ko neeche push karein aur neeche pahunch kar dono haath halka bahar kholein. Slow control se 90° se thoda upar tak wapas aayein.',
                    feelRight: 'Baanh ke peeche outer side (Triceps horseshoe shape) mein sharp contraction aur pump feel hona chahiye.',
                    feelWrong: 'Agar shoulders aage jhuk rahe hain ya poori body hil rahi hai, toh weight heavy hai aur chest/shoulders kaam chura rahe hain.'
                }
            },
            {
                id: 'mon-7',
                name: 'Low-to-High Cable Fly',
                sets: 2,
                repMin: 12,
                repMax: 15,
                repLabel: '12-15',
                type: 'isolation',
                restSec: 75,
                targetMuscle: 'Upper chest shelf',
                primaryGroup: 'Chest',
                secondaryGroups: ['Front delts'],
                step: 'PIN',
                cue: 'Pulleys at lowest notch, chest proud, scoop arms up and across toward collarbone level.',
                alternatives: ['Incline DB Fly'],
                flags: { updatedInV2: true },
                guide: {
                    setup: 'Dono cable pulleys ko bilkul neeche (ankle level) set karein. Beech mein khade hokar 1 kadam aage lein, chest bahar aur shoulders peeche-neeche lock rakhein.',
                    execution: 'Elbows mein halka soft bend rakh kar dono haathon ko neeche se upar-andar ki taraf scoop karein (jaise kisi ko hug kar rahe hon) aur collarbone ke saamne 1 second squeeze karein.',
                    feelRight: 'Upper aur inner chest line mein zabardast tight squeeze aur pump feel hoga—zero joint stress.',
                    feelWrong: 'Agar sirf biceps ya front shoulder thak raha hai, toh elbows zyada bend kar rahe hain ya haath bahut upar (face ke upar) le ja rahe hain.'
                }
            }
        ]
    },
    {
        dayIndex: 2,
        shortDay: 'Tue',
        dayName: 'Tuesday',
        title: 'Pull A',
        subtitle: 'Lat Width, Back, Rear Delts & Biceps (7 Exercises • 21 Sets)',
        isRest: false,
        estimatedMinutes: 75,
        chartFile: 'tuesday.png',
        chartImage: '/charts/tuesday.png',
        exercises: [
            {
                id: 'tue-1',
                name: 'Lat Pulldown (wide grip)',
                sets: 4,
                repMin: 8,
                repMax: 10,
                repLabel: '8-10',
                type: 'compound',
                restSec: 120,
                targetMuscle: 'Lats/Back',
                primaryGroup: 'Lats/Back',
                secondaryGroups: ['Biceps', 'Rear delts'],
                step: 'PIN',
                cue: 'Slight lean back, chest tall, drive the elbows down toward the back pockets, full stretch overhead.',
                alternatives: ['Neutral-grip Pulldown'],
                flags: {},
                guide: {
                    setup: 'Thigh pad ko thighs par tight lock karein. Bar ko shoulder-width se 1.5x wide pakdein (thumbless/hook grip se biceps kam involve hota hai). Torso ko sirf 10–15° peeche rakhein.',
                    execution: 'Pehle shoulders ko kaan se neeche girayein (depress), phir bar ko nahi balki apni elbows ko kamar/hips ki taraf neeche kheenchein jab tak bar upper chest ke paas na aa jaye. Upar jaate waqt poora lat stretch lein.',
                    feelRight: 'Bagal ke neeche aur peeth ke dono side (Lats — V-shape wings) mein strong stretch aur pull feel hona chahiye.',
                    feelWrong: 'Agar sirf forearms ya biceps jal rahe hain, toh aap haathon se kheench rahe hain—elbows se neeche drive karne par focus karein.'
                }
            },
            {
                id: 'tue-2',
                name: 'Assisted Pull-up',
                sets: 3,
                repMin: 6,
                repMax: 10,
                repLabel: '6-10',
                type: 'compound',
                restSec: 120,
                targetMuscle: 'Lats/Back',
                primaryGroup: 'Lats/Back',
                secondaryGroups: ['Biceps'],
                step: 'ASSIST',
                cue: 'Start from a dead hang, set the shoulder blades down first, chin over the bar.',
                alternatives: ['Lat Pulldown'],
                flags: { assisted: true },
                guide: {
                    setup: 'Itna assistance weight lagayein ki aap 8–10 clean reps bina jhatke kar sakein. Wide ya shoulder-width grip pakad kar ghutne pad par rakhein aur core tight rakhein.',
                    execution: 'Neeche poora dead hang stretch lein. Pehle shoulders neeche set karein, phir chest ko bar ki taraf upar le jayein aur chin bar se upar nikalkar 2–3 second mein slow neeche aayein.',
                    feelRight: 'Poore upper back aur outer lats mein deep vertical stretch aur load feel hoga.',
                    feelWrong: 'Agar kandhe kaan mein ghuse hue hain ya body jhool rahi hai, toh assistance thoda badhayein aur form clean karein.'
                }
            },
            {
                id: 'tue-3',
                name: 'Seated Cable Row',
                sets: 3,
                repMin: 8,
                repMax: 10,
                repLabel: '8-10',
                type: 'compound',
                restSec: 120,
                targetMuscle: 'Lats/Back',
                primaryGroup: 'Lats/Back',
                secondaryGroups: ['Biceps', 'Rear delts'],
                step: 'PIN',
                cue: 'Sit tall, pull the handle to the lower ribs, 1 s squeeze, let the shoulder blades stretch forward.',
                alternatives: ['Chest-Supported Row'],
                flags: {},
                guide: {
                    setup: 'Footplate par pair rakhein, ghutne halka soft bend, aur peeth bilkul seedhi (90° upright) rakhein. V-bar handle pakad kar chest tall karein.',
                    execution: 'Kamar ko aage-peeche hilaye bina handle ko nabhi (lower ribs/stomach) ki taraf pull karein. Peeche shoulder blades ko 1 second pinch karein, phir aage jaakar poora stretch lein.',
                    feelRight: 'Peeth ke beech (Mid-Back / Rhomboids) aur lower lats mein thick squeeze aur stretch feel hoga.',
                    feelWrong: 'Agar lower back mein thakan ya dard aaye, toh aap aage-peeche swing kar rahe hain—torso ko bilkul stable rakhein.'
                }
            },
            {
                id: 'tue-4',
                name: 'Face Pull',
                sets: 3,
                repMin: 12,
                repMax: 15,
                repLabel: '12-15',
                type: 'isolation',
                restSec: 75,
                targetMuscle: 'Rear delts',
                primaryGroup: 'Rear delts',
                secondaryGroups: [],
                step: 'PIN',
                cue: 'Rope to the forehead, thumbs back, elbows high.',
                alternatives: ['Reverse Pec Deck'],
                flags: {},
                guide: {
                    setup: 'Cable pulley ko forehead/eye level par rakhein. Rope ko aise pakdein ki dono anguthe (thumbs) aapki taraf point karein. 2 kadam peeche hokar stagger stance lein.',
                    execution: 'Rope ko maathe (forehead) ki taraf pull karein aur saath mein dono haath bahar kholein—end position double-bicep pose jaisi dikhni chahiye jahan wrists elbows se peeche jayein.',
                    feelRight: 'Kandhe ke bilkul peeche (Rear Delts) aur upper back mein burn feel hoga—yeh rounded shoulders theek karta hai aur 3D look deta hai.',
                    feelWrong: 'Agar lower back peeche jhuk rahi hai ya sirf upper traps tight ho rahe hain, toh weight kam karein.'
                }
            },
            {
                id: 'tue-5',
                name: 'EZ-Bar Curl',
                sets: 3,
                repMin: 8,
                repMax: 10,
                repLabel: '8-10',
                type: 'isolation',
                restSec: 75,
                targetMuscle: 'Biceps',
                primaryGroup: 'Biceps',
                secondaryGroups: [],
                step: 'B2.5',
                cue: 'Elbows fixed at the ribs, no torso swing, full stretch at the bottom.',
                alternatives: ['DB Curl'],
                flags: {},
                guide: {
                    setup: 'EZ-bar ke angled outer grip par haath rakhein (wrists natural rahengi). Pair shoulder-width, glutes aur abs tight, elbows kamar ke bilkul side mein pin rakhein.',
                    execution: 'Kamar hilaye bina bar ko chest ke paas curl karein, top par 1 second bicep hard squeeze karein, aur 2–3 second mein poora neeche straight hone tak laayein.',
                    feelRight: 'Baanh ke aage poore Bicep belly mein tight pump aur neeche poora stretch feel hona chahiye.',
                    feelWrong: 'Agar lower back ya front shoulder mein load aaye, toh aap body jhatak kar weight upar fek rahe hain.'
                }
            },
            {
                id: 'tue-6',
                name: 'Hammer Curl',
                sets: 3,
                repMin: 10,
                repMax: 12,
                repLabel: '10-12',
                type: 'isolation',
                restSec: 75,
                targetMuscle: 'Biceps (brachialis)',
                primaryGroup: 'Biceps',
                secondaryGroups: [],
                step: 'DB',
                cue: 'Neutral grip, slow 2 s lowering.',
                alternatives: [],
                flags: {},
                guide: {
                    setup: 'Dono dumbbells ko neutral grip (thumbs upar ki taraf, hatheliyan andar) mein pakdein. Elbows ko body ke side mein lock karein.',
                    execution: 'Wrists ko bilkul twist kiye bina dumbbell ko shoulder ki taraf curl karein, top par pause lein, aur slow 2 second mein neeche laayein.',
                    feelRight: 'Bicep ke side/neeche (Brachialis) aur forearm ke upar wale hisse mein thick pump feel hoga—yeh arm ko side se chauda dikhata hai.',
                    feelWrong: 'Agar elbows aage bhaag rahe hain ya wrist mud rahi hai, toh halka dumbbell use karein.'
                }
            },
            {
                id: 'tue-7',
                name: 'Single-Arm Cable Lat Pull-In',
                sets: 2,
                repMin: 12,
                repMax: 15,
                repLabel: '12-15 / arm',
                type: 'isolation',
                restSec: 75,
                targetMuscle: 'Lower Lats (V-Sweep)',
                primaryGroup: 'Lats/Back',
                secondaryGroups: [],
                step: 'PIN',
                cue: 'Kneel sideways to high pulley, drive elbow in an arc tight to your hip pocket, squeeze lower lat.',
                alternatives: ['Single-Arm Lat Pulldown'],
                flags: { unilateral: true, updatedInV2: true },
                guide: {
                    setup: 'High pulley par single D-handle lagayein. Machine ke side mein ek ghutne par baithein (ya bench par), taaki cable line upar se aapke working side ke angle par aaye.',
                    execution: 'Working haath ko upar-aage poora stretch hone dein, phir elbow ko body ke bilkul paas rakh kar apni hip pocket ki taraf neeche-peeche arc mein pull karein aur 1 second hold karein.',
                    feelRight: 'Kamar ke upar side wale hisse (Lower Lats) mein razor-sharp cramp jaisa squeeze feel hoga—left aur right side ka imbalance bhi theek hota hai.',
                    feelWrong: 'Agar sirf bicep thak raha hai, toh elbow ko peeche zyada mat khinchein—sirf hip bone ke level par ruk kar lat squeeze karein.'
                }
            }
        ]
    },
    {
        dayIndex: 3,
        shortDay: 'Wed',
        dayName: 'Wednesday',
        title: 'Legs A',
        subtitle: 'Quads, Hamstrings, Calves, Glute Med & Abs (7 Exercises • 23 Sets)',
        isRest: false,
        estimatedMinutes: 75,
        chartFile: 'wednesday.png',
        chartImage: '/charts/wednesday.png',
        exercises: [
            {
                id: 'wed-1',
                name: 'Leg Press',
                sets: 4,
                repMin: 8,
                repMax: 10,
                repLabel: '8-10',
                type: 'compound',
                restSec: 150,
                targetMuscle: 'Quads',
                primaryGroup: 'Quads',
                secondaryGroups: ['Glutes'],
                step: 'B5',
                cue: 'Feet shoulder-width mid-platform, lower to about 90° at the knee with the lower back staying on the pad, never lock out.',
                alternatives: ['Hack Squat'],
                flags: {},
                guide: {
                    setup: 'Seat par poore hips aur lower back ko chipka kar baithein. Pair shoulder-width par platform ke middle-low area mein rakhein, panje halka bahar (10–15°). Side handles kas kar pakdein.',
                    execution: 'Safety unlock karke sled ko slow (2–3s) neeche laayein jab tak ghutne 90° ya usse thode zyada bend na hon (lower back pad se uthna nahi chahiye). Heels aur mid-foot se upar push karein—top par ghutne lock mat karein.',
                    feelRight: 'Thighs ke aage (Quads) mein heavy pressure aur burn feel hona chahiye.',
                    feelWrong: 'Agar lower back pad se uth kar gol ho rahi hai (butt wink) ya ghutno ke aage chubhan ho, toh range thodi kam karein ya pair thoda upar rakhein.'
                }
            },
            {
                id: 'wed-2',
                name: 'Romanian Deadlift',
                sets: 3,
                repMin: 8,
                repMax: 10,
                repLabel: '8-10',
                type: 'compound',
                restSec: 150,
                targetMuscle: 'Hamstrings',
                primaryGroup: 'Hamstrings',
                secondaryGroups: ['Glutes'],
                step: 'B5',
                cue: 'Soft knees, hips back, bar slides down the thighs, stop at a deep hamstring stretch with a flat back.',
                alternatives: ['DB RDL'],
                flags: {},
                guide: {
                    setup: 'Barbell ya dumbbells pakad kar pair hip-width par khade hon. Chest upar, lats tight (jaise bagal mein pencil dabayi ho), aur ghutno mein halka soft bend (15°) fix kar dein.',
                    execution: 'Neeche jhukne ki jagah apni hips ko peeche deewar ki taraf push karein. Bar thighs se chipak kar neeche jaye. Jaise hi hips peeche jana band karein (shin ke mid tak), glutes squeeze karke upar aayein.',
                    feelRight: 'Thighs ke bilkul peeche (Hamstrings) aur glutes mein gehra rubber-band jaisa stretch feel hona chahiye.',
                    feelWrong: 'Agar lower back mein tez dard ya kheenchav aaye, toh aap kamar gol kar rahe hain ya bar body se door ja rahi hai.'
                }
            },
            {
                id: 'wed-3',
                name: 'Leg Extension',
                sets: 3,
                repMin: 12,
                repMax: 15,
                repLabel: '12-15',
                type: 'isolation',
                restSec: 90,
                targetMuscle: 'Quads',
                primaryGroup: 'Quads',
                secondaryGroups: [],
                step: 'PIN',
                cue: 'Pause 1 s at the top, lower over 2–3 s, knee aligned with the machine pivot.',
                alternatives: [],
                flags: {},
                guide: {
                    setup: 'Back pad aise set karein ki aapka knee joint machine ke red pivot dot ki seedh mein aaye. Lower pad ankle ke bilkul upar (shin par) hona chahiye. Handles pakad kar hips seat mein dabaye rakhein.',
                    execution: 'Dono pairo ko smoothly upar straight karein, top par 1 full second quads ko squeeze karein, phir 2–3 second mein slow neeche laayein.',
                    feelRight: 'Ghutne ke upar teardrop muscle (VMO) aur poori front thigh (Quads) mein intense burn feel hoga.',
                    feelWrong: 'Agar knee cap ke andar sharp pain aaye, toh bottom par weight jhatke se utha rahe hain ya machine pivot align nahi hai.'
                }
            },
            {
                id: 'wed-4',
                name: 'Seated Leg Curl',
                sets: 3,
                repMin: 10,
                repMax: 12,
                repLabel: '10-12',
                type: 'isolation',
                restSec: 90,
                targetMuscle: 'Hamstrings',
                primaryGroup: 'Hamstrings',
                secondaryGroups: [],
                step: 'PIN',
                cue: 'Hips pinned, lean slightly forward, full stretch at the start, curl the heels under the seat.',
                alternatives: ['Lying Leg Curl'],
                flags: { updatedInV2: true },
                guide: {
                    setup: 'Lap/thigh pad ko thighs par jitna tight ho sake lock karein (yeh sabse important step hai). Ankle pad Achilles tendon ke upar set karein aur torso halka sa aage rakhein.',
                    execution: 'Heels ko seat ke bilkul neeche tak curl karein, 1 second squeeze karein, aur 3 second mein slow upar aayein jab tak legs almost seedhi na ho jayein.',
                    feelRight: 'Poori back thigh (Hamstrings) mein deep stretch aur strong contraction feel hoga.',
                    feelWrong: 'Agar calves mein cramp aaye toh toes ko apni taraf (dorsiflex) na kheench kar halka relaxed/pointed rakhein.'
                }
            },
            {
                id: 'wed-5',
                name: 'Standing Calf Raise',
                sets: 4,
                repMin: 12,
                repMax: 15,
                repLabel: '12-15',
                type: 'isolation',
                restSec: 75,
                targetMuscle: 'Calves',
                primaryGroup: 'Calves',
                secondaryGroups: [],
                step: 'B5',
                cue: '1–2 s stretch at the bottom, rise high on the big toe, no bouncing.',
                alternatives: ['Leg-Press Calf Raise'],
                flags: {},
                guide: {
                    setup: 'Step edge par sirf pair ka aage wala hissa (balls of feet) rakhein, heels bahar latki rahein. Ghutne almost seedhe (soft lock) aur core tight rakhein.',
                    execution: 'Heels ko poora neeche girne dein aur bottom par 2 second ruk kar bounce khatam karein. Phir big toe (anguthe) ke ball se jitna uncha ho sake upar uthein aur 1 second hold karein.',
                    feelRight: 'Pindli (upper Calf / Gastrocnemius) mein deep stretch aur tez burn feel hona chahiye.',
                    feelWrong: 'Agar bilkul feel nahi ho raha toh aap jaldi-jaldi bounce kar rahe hain—bottom pause zaroori hai.'
                }
            },
            {
                id: 'wed-6',
                name: 'Hanging Leg Raise',
                sets: 3,
                repMin: 10,
                repMax: 15,
                repLabel: '10-15',
                type: 'isolation',
                restSec: 75,
                targetMuscle: 'Abs',
                primaryGroup: 'Abs',
                secondaryGroups: [],
                step: 'BW',
                cue: 'Curl the pelvis up toward the ribs rather than swinging the legs; start with knee raises if needed.',
                alternatives: ["Captain's-Chair Knee Raise"],
                flags: { bodyweight: true },
                guide: {
                    setup: 'Pull-up bar par shoulder-width grip se latkein (ya Captain’s Chair use karein). Body bilkul still rakhein—swing rokne ke liye lats halka engage karein.',
                    execution: 'Sirf taangein upar mat uthayein; apni lower back ko halka gol karke pelvis (hips) ko upar chest ki taraf curl karein (agar seedhe pair mushkil hon toh knees bend karke karein). Slow neeche laayein.',
                    feelRight: 'Poore pet (khaaskar lower & mid Abs) mein gehra crunch aur burn feel hoga.',
                    feelWrong: 'Agar sirf thighs ke upar (hip flexors) mein dard ho raha hai, toh aap sirf legs hila rahe hain aur pelvis curl nahi kar rahe.'
                }
            },
            {
                id: 'wed-7',
                name: 'Seated Hip Abduction Machine',
                sets: 3,
                repMin: 15,
                repMax: 20,
                repLabel: '15-20',
                type: 'isolation',
                restSec: 60,
                targetMuscle: 'Glute Medius (Pelvic Stability)',
                primaryGroup: 'Glutes',
                secondaryGroups: [],
                step: 'PIN',
                cue: 'Sit tall or lean slightly forward, push knees outward smoothly, pause 1 s at outer end.',
                alternatives: ['Cable Hip Abduction'],
                flags: { updatedInV2: true },
                guide: {
                    setup: 'Machine par seedhe baithein (ya 10° aage jhuk kar handles pakdein). Pads outer knees/thighs par set karein aur dono sides par barabar pressure rakhne par dhyan dein.',
                    execution: 'Outer hips ki power se dono ghutno ko bahar ki taraf kholein, bahar 1 second hold karein, aur 2 second mein control ke saath andar laayein (weight plates takrane na dein).',
                    feelRight: 'Hips ke bilkul outer upper side (Glute Medius) mein clean burn feel hoga—yeh athletic lower body aur level pelvis dono ke liye best hai.',
                    feelWrong: 'Agar lower back mein khinchav aaye toh weight heavy hai aur aap peeth arch kar rahe hain.'
                }
            }
        ]
    },
    {
        dayIndex: 4,
        shortDay: 'Thu',
        dayName: 'Thursday',
        title: 'Push B',
        subtitle: 'Overhead Strength, Side Delts, Chest & Triceps (7 Exercises • 22 Sets)',
        isRest: false,
        estimatedMinutes: 75,
        chartFile: 'thursday.png',
        chartImage: '/charts/thursday.png',
        exercises: [
            {
                id: 'thu-1',
                name: 'Standing Overhead Press (barbell)',
                sets: 4,
                repMin: 6,
                repMax: 8,
                repLabel: '6-8',
                type: 'compound',
                restSec: 150,
                targetMuscle: 'Front delts',
                primaryGroup: 'Front delts',
                secondaryGroups: ['Side delts', 'Triceps'],
                step: 'B2.5',
                cue: 'Glutes and abs tight, bar path vertical, head through at the top, no leaning back.',
                alternatives: ['Seated DB Press', 'Machine Press'],
                flags: {},
                guide: {
                    setup: 'Pair shoulder-width par, glutes aur abs kas kar tight (pelvis bilkul neutral). Bar ko collarbone par rest karein, grip shoulders se just bahar aur elbows bar ke halka aage rakhein.',
                    execution: 'Chin ko halka peeche hatakar bar ko seedhi vertical line mein upar press karein. Jaise hi bar forehead cross kare, sir ko halka aage (window through) le aayein taaki bar mid-foot ke upar lock ho.',
                    feelRight: 'Front & side shoulders aur triceps mein solid strength load aur upper body stability feel hogi.',
                    feelWrong: 'Agar lower back mein dard aaye, toh aap peeche jhuk kar incline bench bana rahe hain—glutes squeeze karein aur weight kam karein.'
                }
            },
            {
                id: 'thu-2',
                name: 'Machine or DB Chest Press',
                sets: 3,
                repMin: 8,
                repMax: 10,
                repLabel: '8-10',
                type: 'compound',
                restSec: 120,
                targetMuscle: 'Chest',
                primaryGroup: 'Chest',
                secondaryGroups: ['Front delts', 'Triceps'],
                step: 'PIN',
                cue: 'Shoulders pinned back into the seat, drive through the palms, control the stretch.',
                alternatives: [],
                flags: {},
                guide: {
                    setup: 'Seat height aise adjust karein ki handles mid-lower chest ke level par aayein. Shoulder blades seat mein peeche daba kar chest bahar nikaalein.',
                    execution: 'Palms se aage press karein bina shoulders ko seat se aage uthaye. 2–3 second mein slow peeche laayein taaki chest mein full stretch mile.',
                    feelRight: 'Poore pectoral (Chest) area mein bina balance ki tension ke pure pump feel hoga.',
                    feelWrong: 'Agar shoulder ke aage pain aaye toh seat bahut neeche hai (handles collarbones ke paas aa rahe hain)—seat upar karein.'
                }
            },
            {
                id: 'thu-3',
                name: 'Cable Lateral Raise',
                sets: 4,
                repMin: 15,
                repMax: 20,
                repLabel: '15-20',
                type: 'isolation',
                restSec: 75,
                targetMuscle: 'Side delts',
                primaryGroup: 'Side delts',
                secondaryGroups: [],
                step: 'S1',
                cue: 'Pulley low, sweep the arm out and up with a slight lean away, constant tension.',
                alternatives: ['DB Lateral Raise', 'Machine Lateral Raise'],
                flags: {},
                guide: {
                    setup: 'Cable pulley ko wrist/hip height par rakhein (bilkul zameen se thoda upar—is height par stretch best milta hai). Machine ke side khade hon aur far hand se handle pakdein.',
                    execution: 'Cable ko body ke saamne ya peeche se guzaar kar working arm ko bahar-upar shoulder level tak sweep karein. Slow neeche laayein taaki neeche bhi tension bani rahe.',
                    feelRight: 'Side Delt mein shuru se lekar end tak constant burning pump feel hoga—broad shoulders ke liye best exercise.',
                    feelWrong: 'Agar traps/gardan mein tension aaye toh shoulder neeche drop rakhein aur arm ko upar nahi balki deewar ki taraf door le jaane ka sochein.'
                }
            },
            {
                id: 'thu-4',
                name: 'Pec Deck or Cable Fly',
                sets: 3,
                repMin: 12,
                repMax: 15,
                repLabel: '12-15',
                type: 'isolation',
                restSec: 75,
                targetMuscle: 'Chest',
                primaryGroup: 'Chest',
                secondaryGroups: [],
                step: 'PIN',
                cue: 'Soft elbows, hug a wide tree, deep controlled stretch, squeeze at the centre.',
                alternatives: [],
                flags: {},
                guide: {
                    setup: 'Seat aise set karein ki haath mid-chest level par hon. Handles ko bahut peeche mat set karein (comfortable stretch notch rakhein). Chest up, shoulders back.',
                    execution: 'Haathon ko nahi balki apni elbows (inner biceps) ko aapas mein milaane ki koshish karein. Centre mein 1 second squeeze, aur slow peeche stretch.',
                    feelRight: 'Outer se lekar inner chest line tak full stretch aur strong squeeze feel hoga.',
                    feelWrong: 'Agar front shoulder mein khinchav aaye toh handles zyada peeche set hain ya shoulders aage roll ho rahe hain.'
                }
            },
            {
                id: 'thu-5',
                name: 'Assisted Dips (chest-leaning) OR EZ Skull Crusher',
                sets: 3,
                repMin: 8,
                repMax: 12,
                repLabel: '8-12',
                type: 'compound',
                restSec: 120,
                targetMuscle: 'Triceps',
                primaryGroup: 'Triceps',
                secondaryGroups: ['Chest'],
                step: 'ASSIST',
                cue: 'Elbows tucked, lower under control to a deep stretch.',
                alternatives: [],
                flags: {
                    variants: [
                        {
                            id: 'dips',
                            name: 'Assisted Dips (chest-leaning)',
                            step: 'ASSIST',
                            assisted: true
                        },
                        {
                            id: 'skull',
                            name: 'EZ Skull Crusher',
                            step: 'B2.5',
                            assisted: false
                        }
                    ]
                },
                guide: {
                    setup: 'Dips ke liye shoulders neeche press karein, torso 15° aage jhukayein aur elbows peeche tucked rakhein. Skull Crusher ke liye flat bench par let kar arms vertical se 10° peeche tilt rakhein.',
                    execution: 'Dips mein 90° elbow bend tak slow neeche jayein aur upar press karein. Skull Crusher mein bar ko maathe ke peeche (sir ke upar) le jaakar stretch karein aur upar extend karein.',
                    feelRight: 'Triceps aur lower chest (dips mein) mein strong stretch aur heavy contraction feel hoga.',
                    feelWrong: 'Agar front shoulder ya elbow mein sharp pinch aaye, toh depth thodi kam karein ya EZ Skull Crusher variant select karein.'
                }
            },
            {
                id: 'thu-6',
                name: 'Rear Delt Fly (DB or cable)',
                sets: 3,
                repMin: 15,
                repMax: 15,
                repLabel: '15',
                type: 'isolation',
                restSec: 75,
                targetMuscle: 'Rear delts',
                primaryGroup: 'Rear delts',
                secondaryGroups: [],
                step: 'S1',
                cue: 'Hinge forward, push the hands out and back, no shrugging.',
                alternatives: [],
                flags: {},
                guide: {
                    setup: 'Incline bench par chest tika kar (ya hip hinge karke) light dumbbells pakdein. Arms neeche hang karein, palms ek dusre ki taraf ya peeche.',
                    execution: 'Shoulder blades ko zor se peeche pinch karne ki jagah haathon ko 45° bahar aur door sweep karein (elbow height shoulder line se just neeche).',
                    feelRight: 'Kandhe ke bilkul peeche chhote ball (Rear Delts) mein sharp localized burn feel hoga.',
                    feelWrong: 'Agar peeth ke beech (traps) mein zyada pressure aa raha hai, toh aap shoulder blades squeeze kar rahe hain ya weight zyada heavy hai.'
                }
            },
            {
                id: 'thu-7',
                name: 'Single-Arm Cable Triceps Pushdown',
                sets: 2,
                repMin: 12,
                repMax: 15,
                repLabel: '12-15 / arm',
                type: 'isolation',
                restSec: 60,
                targetMuscle: 'Triceps (Symmetry)',
                primaryGroup: 'Triceps',
                secondaryGroups: [],
                step: 'PIN',
                cue: 'No attachment or single handle, elbow pinned beside torso, extend fully down and slightly back.',
                alternatives: ['Single-Arm Rope Pushdown'],
                flags: { unilateral: true, updatedInV2: true },
                guide: {
                    setup: 'High pulley par single handle (ya seedha rubber ball) pakdein. Halka sa side turn lein taaki cable arm ki seedh mein aaye. Working elbow ribs ke paas lock rakhein.',
                    execution: 'Forearm ko poora neeche extend karke halka sa peeche hip ke paas lock karein aur 1 second triceps squeeze karein. Weak arm se pehle start karein.',
                    feelRight: 'Triceps ke lateral aur medial head mein clean isolation burn—dono arms ka size barabar rakhta hai.',
                    feelWrong: 'Agar shoulder aage ghoom raha hai ya elbow aage-peeche hil raha hai, toh pin ek notch halka karein.'
                }
            }
        ]
    },
    {
        dayIndex: 5,
        shortDay: 'Fri',
        dayName: 'Friday',
        title: 'Pull B',
        subtitle: 'Lat Thickness, V-Taper Sweep, Rear Delts, Biceps & Forearms (7 Exercises • 22 Sets)',
        isRest: false,
        estimatedMinutes: 75,
        chartFile: 'friday.png',
        chartImage: '/charts/friday.png',
        exercises: [
            {
                id: 'fri-1',
                name: 'Chest-Supported Row or One-Arm DB Row',
                sets: 4,
                repMin: 8,
                repMax: 10,
                repLabel: '8-10',
                type: 'compound',
                restSec: 120,
                targetMuscle: 'Lats/Back',
                primaryGroup: 'Lats/Back',
                secondaryGroups: ['Biceps', 'Rear delts'],
                step: 'DB',
                cue: 'Row in an arc toward the hip pocket, let the shoulder blade stretch at the bottom.',
                alternatives: [],
                flags: {},
                guide: {
                    setup: 'One-Arm DB Row ke liye ek haath aur ghutna bench par (ya free hand incline bench par) tika kar peeth bilkul flat rakhein. Chest-Supported Row mein chest pad se chipka kar rakhein.',
                    execution: 'Dumbbell ko seedha upar chest par mat kheenchein—ek curve (J-arc) mein apni hip pocket ki taraf pull karein. Neeche aate waqt shoulder blade ko poora stretch hone dein.',
                    feelRight: 'Outer aur lower Lats mein deep stretch aur thick back contraction feel hoga.',
                    feelWrong: 'Agar torso twist ho raha hai ya bicep zyada jal raha hai, toh weight kam karein aur elbow ko hip ki taraf drive karein.'
                }
            },
            {
                id: 'fri-2',
                name: 'Neutral-Grip Pulldown',
                sets: 3,
                repMin: 10,
                repMax: 12,
                repLabel: '10-12',
                type: 'compound',
                restSec: 120,
                targetMuscle: 'Lats/Back',
                primaryGroup: 'Lats/Back',
                secondaryGroups: ['Biceps'],
                step: 'PIN',
                cue: 'Elbows forward and tucked, drive down to the upper chest.',
                alternatives: [],
                flags: {},
                guide: {
                    setup: 'Shoulder-width neutral-grip handle (palms ek dusre ke saamne) lagayein. Thigh pad tight lock karein aur bilkul seedhe ya 10° peeche baithein.',
                    execution: 'Elbows ko aage aur body ke kareeb rakh kar seedha neeche hips ki taraf drive karein jab tak handle upper chest tak na aa jaye. Upar full stretch lein.',
                    feelRight: 'Lats ke lower aur front-side hisse mein zabardast vertical stretch aur V-taper thickness feel hogi.',
                    feelWrong: 'Agar elbows bahar phail rahe hain ya aap 45° peeche let rahe hain, toh load lats se hat kar upper back par chala jayega.'
                }
            },
            {
                id: 'fri-3',
                name: 'Straight-Arm Pulldown',
                sets: 3,
                repMin: 12,
                repMax: 15,
                repLabel: '12-15',
                type: 'isolation',
                restSec: 75,
                targetMuscle: 'Lats/Back',
                primaryGroup: 'Lats/Back',
                secondaryGroups: [],
                step: 'PIN',
                cue: 'Arms nearly straight, sweep the bar to the thighs using the lats only.',
                alternatives: [],
                flags: {},
                guide: {
                    setup: 'High pulley par rope ya straight bar lagayein. 2 kadam peeche hokar hips se 30° aage jhukein (peeth flat). Arms sir ke upar poora stretch, elbows mein halka soft bend fix rakhein.',
                    execution: 'Bina elbows ko bend kiye bar ko ek bade arc mein thighs tak neeche sweep karein—chest upar kholein aur bottom par lats ko 1 second hard squeeze karein.',
                    feelRight: 'Pure Lats (bagal se kamar tak) mein zero-bicep involvement ke saath intense burn feel hoga.',
                    feelWrong: 'Agar triceps zyada thak rahe hain, toh aap elbows ko bend karke pushdown bana rahe hain—elbow angle bilkul lock rakhein.'
                }
            },
            {
                id: 'fri-4',
                name: 'Reverse Pec Deck',
                sets: 3,
                repMin: 15,
                repMax: 15,
                repLabel: '15',
                type: 'isolation',
                restSec: 75,
                targetMuscle: 'Rear delts',
                primaryGroup: 'Rear delts',
                secondaryGroups: [],
                step: 'PIN',
                cue: 'Chest on the pad, sweep the arms back without shrugging.',
                alternatives: [],
                flags: {},
                guide: {
                    setup: 'Machine ki taraf munh karke baithein, chest pad par press karein. Seat height aise rakhein ki handles shoulders ke level par hon. Neutral ya palms-down grip use karein.',
                    execution: 'Shoulders neeche relax rakh kar arms ko bahar-peeche wide sweep karein (torso ki line ke just peeche tak, usse zyada peeche mat le jayein).',
                    feelRight: 'Kandhe ke bilkul peeche (Rear Delts) mein deep burn feel hoga.',
                    feelWrong: 'Agar handles bahut peeche le ja rahe hain toh shoulder blades aapas mein takra kar traps kaam karne lagenge.'
                }
            },
            {
                id: 'fri-5',
                name: 'Incline DB Curl',
                sets: 3,
                repMin: 10,
                repMax: 12,
                repLabel: '10-12',
                type: 'isolation',
                restSec: 75,
                targetMuscle: 'Biceps (long head)',
                primaryGroup: 'Biceps',
                secondaryGroups: [],
                step: 'DB',
                cue: 'Bench at 45–60°, let the arms hang behind the torso for a full stretch before each curl.',
                alternatives: [],
                flags: {},
                guide: {
                    setup: 'Bench ko 45°–60° par set karein. Peeth aur sir pad par tika kar dono arms ko torso ke peeche seedha neeche latakne dein (palms aage ki taraf).',
                    execution: 'Elbows ko peeche hi lock rakh kar dumbbells upar curl karein. Top par 1 second squeeze aur 3 second mein slow poora neeche stretch hone dein.',
                    feelRight: 'Bicep ke outer/upper hisse (Long Head — bicep peak) mein gehra stretch aur intense pump feel hoga.',
                    feelWrong: 'Agar front shoulder mein khinchav ya dard aaye, toh bench thoda zyada seedha (60°) karein aur elbows aage mat khiskein.'
                }
            },
            {
                id: 'fri-6',
                name: 'Cable Curl',
                sets: 3,
                repMin: 12,
                repMax: 12,
                repLabel: '12',
                type: 'isolation',
                restSec: 75,
                targetMuscle: 'Biceps',
                primaryGroup: 'Biceps',
                secondaryGroups: [],
                step: 'PIN',
                cue: 'Constant tension, squeeze at the top.',
                alternatives: [],
                flags: {},
                guide: {
                    setup: 'Low pulley par straight ya EZ bar lagayein. Machine se 1 kadam peeche khade hon taaki bottom par bhi cable mein tension rahe. Elbows sides par fixed.',
                    execution: 'Smoothly shoulders ki taraf curl karein, top par pinky finger ko halka andar twist karke squeeze karein, aur 2 second mein slow neeche laayein.',
                    feelRight: 'Poore bicep mein start se finish tak lagatar blood pump feel hoga.',
                    feelWrong: 'Agar kamar peeche jhuk rahi hai toh pin 1–2 notches kam karein.'
                }
            },
            {
                id: 'fri-7',
                name: 'Reverse EZ-Bar Curl',
                sets: 3,
                repMin: 12,
                repMax: 15,
                repLabel: '12-15',
                type: 'isolation',
                restSec: 60,
                targetMuscle: 'Forearms & Brachialis',
                primaryGroup: 'Biceps',
                secondaryGroups: [],
                step: 'B2.5',
                cue: 'Overhand grip (knuckles up), wrists straight, elbows pinned to ribs, slow 2 s negative.',
                alternatives: ['Reverse Cable Curl'],
                flags: { updatedInV2: true },
                guide: {
                    setup: 'EZ-bar ko overhand grip (hatheliyan neeche, knuckles upar) se shoulder-width par pakdein. Wrists bilkul straight (neeche jhuki nahi honi chahiye) aur elbows ribs par fixed.',
                    execution: 'Bar ko chest tak curl karein, top par forearm aur outer arm squeeze karein, aur 2–3 second mein slow control se neeche laayein.',
                    feelRight: 'Forearms ke upar wale hisse (Brachioradialis) aur outer bicep mein zabardast vascular pump feel hoga—t-shirt mein aesthetic arms ke liye must hai.',
                    feelWrong: 'Agar wrist joint mein dard aaye toh straight bar ki jagah EZ-bar ya cable use karein aur weight light rakhein.'
                }
            }
        ]
    },
    {
        dayIndex: 6,
        shortDay: 'Sat',
        dayName: 'Saturday',
        title: 'Legs B',
        subtitle: 'Glutes, Quads, Hamstrings, Calves, Side Delts & Abs (7 Exercises • 22 Sets)',
        isRest: false,
        estimatedMinutes: 75,
        chartFile: 'saturday.png',
        chartImage: '/charts/saturday.png',
        exercises: [
            {
                id: 'sat-1',
                name: 'Bulgarian Split Squat',
                sets: 3,
                repMin: 8,
                repMax: 10,
                repLabel: '8-10 per leg',
                type: 'compound',
                restSec: 120,
                targetMuscle: 'Quads',
                primaryGroup: 'Quads',
                secondaryGroups: ['Glutes'],
                step: 'DB',
                cue: 'Rear foot on the bench, slight forward lean, lower the back knee straight down.',
                alternatives: ['Smith Split Squat'],
                flags: { unilateral: true },
                guide: {
                    setup: 'Bench se ~2–2.5 feet aage front foot rakhein aur peeche wala pair bench par (laces down). Hips seedhe saamne (pelvis level) aur torso halka 10–15° aage lean rakhein.',
                    execution: 'Peechle ghutne ko seedha zameen ki taraf neeche le jayein jab tak front thigh zameen ke parallel na aa jaye. Front heel aur mid-foot se upar drive karein. Weak leg se start karein.',
                    feelRight: 'Front leg ke Quad aur Glute mein deep stretch aur burning pressure feel hoga—single-leg symmetry ke liye king exercise hai.',
                    feelWrong: 'Agar peechle pair ke quad mein zyada pressure aa raha hai, toh aap peechle pair par weight daal rahe hain—85% weight front leg par rakhein.'
                }
            },
            {
                id: 'sat-2',
                name: 'Hip Thrust',
                sets: 3,
                repMin: 10,
                repMax: 10,
                repLabel: '10',
                type: 'compound',
                restSec: 120,
                targetMuscle: 'Glutes',
                primaryGroup: 'Glutes',
                secondaryGroups: [],
                step: 'B5',
                cue: 'Chin tucked, drive through the heels to full hip lockout, squeeze for 1 s.',
                alternatives: [],
                flags: {},
                guide: {
                    setup: 'Upper back (shoulder blades ke just neeche) bench edge par tikayein. Barbell pad hips ke crease par rakhein. Pair aise rakhein ki top position par shins bilkul 90° vertical hon.',
                    execution: 'Chin ko chest ki taraf tuck rakhein (aankhein saamne, upar ceiling par nahi). Heels se push karke hips upar lockout karein, top par glutes 1 second squeeze karein.',
                    feelRight: 'Sirf Glutes mein strong top squeeze feel hona chahiye.',
                    feelWrong: 'Agar lower back mein dard ho toh aap top par kamar hyperextend kar rahe hain; agar hamstrings mein cramp aaye toh pair thode paas laayein; agar quads mein feel ho toh pair thode aage karein.'
                }
            },
            {
                id: 'sat-3',
                name: 'Hack or Smith Squat',
                sets: 3,
                repMin: 10,
                repMax: 12,
                repLabel: '10-12',
                type: 'compound',
                restSec: 120,
                targetMuscle: 'Quads',
                primaryGroup: 'Quads',
                secondaryGroups: ['Glutes'],
                step: 'B5',
                cue: 'Back flat on the pad, go below parallel with the knees tracking over the toes.',
                alternatives: [],
                flags: {},
                guide: {
                    setup: 'Hack squat mein poori peeth aur hips pad se chipka kar pair platform ke lower-mid mein shoulder-width rakhein. Smith squat mein bar upper traps par aur pair bar se 4–6 inch aage rakhein.',
                    execution: 'Saans pet mein bhar kar core brace karein, 3 second mein slow neeche parallel ke neeche tak jayein (ghutne toes ki direction mein). Heels zameen par rakh kar upar drive karein.',
                    feelRight: 'Poore front thighs (Quads) mein deep stretch aur massive pump feel hoga.',
                    feelWrong: 'Agar heels uth rahi hain toh pair thode aage rakhein; agar knees andar gir rahi hain toh ghutno ko bahar toes ki taraf push karein.'
                }
            },
            {
                id: 'sat-4',
                name: 'Seated Leg Curl',
                sets: 3,
                repMin: 10,
                repMax: 12,
                repLabel: '10-12',
                type: 'isolation',
                restSec: 90,
                targetMuscle: 'Hamstrings',
                primaryGroup: 'Hamstrings',
                secondaryGroups: [],
                step: 'PIN',
                cue: 'Thigh pad snug, curl the heels all the way under the seat.',
                alternatives: [],
                flags: {},
                guide: {
                    setup: 'Lap pad ko thighs par tightly press karke lock karein taaki hips bilkul na uthein. Ankle pad heels ke upar set karein.',
                    execution: 'Heels ko seat ke neeche tak full range mein curl karein, 1 second squeeze, phir 3 second mein slow upar stretch.',
                    feelRight: 'Hamstrings mein bottom se top tak complete tension aur burn feel hoga.',
                    feelWrong: 'Agar hips seat se uth rahi hain toh lap pad loose hai ya weight zyada heavy hai.'
                }
            },
            {
                id: 'sat-5',
                name: 'Seated Calf Raise',
                sets: 4,
                repMin: 15,
                repMax: 15,
                repLabel: '15',
                type: 'isolation',
                restSec: 75,
                targetMuscle: 'Calves (soleus)',
                primaryGroup: 'Calves',
                secondaryGroups: [],
                step: 'B5',
                cue: 'Full pause at the bottom stretch and at the top.',
                alternatives: [],
                flags: {},
                guide: {
                    setup: 'Knee pad ghutno ke bilkul upar (thighs ke end par) set karein. Balls of feet footplate par rakhein, heels free.',
                    execution: 'Heels poora neeche drop karke 2 second stretch hold karein, phir upar panjo par high rise karke 1 second squeeze karein.',
                    feelRight: 'Lower calf aur pindli ke andar wale hisse (Soleus) mein deep burn feel hoga—yeh calf ko chauda banata hai.',
                    feelWrong: 'Agar bounce karke tez reps kar rahe hain toh Achilles tendon load le lega aur muscle grow nahi hoga.'
                }
            },
            {
                id: 'sat-6',
                name: 'Lateral Raise (DB or cable)',
                sets: 3,
                repMin: 15,
                repMax: 20,
                repLabel: '15-20',
                type: 'isolation',
                restSec: 75,
                targetMuscle: 'Side delts',
                primaryGroup: 'Side delts',
                secondaryGroups: [],
                step: 'S1',
                cue: 'Bonus V-taper volume: strict form, zero momentum.',
                alternatives: [],
                flags: {},
                guide: {
                    setup: 'Light weight lein kyunki yeh high-rep (15–20) bonus V-taper pump set hai. Torso 10° forward lean, shoulders down & relaxed.',
                    execution: 'Arms ko 20–30° aage wale plane mein bahar-upar shoulder level tak uthayein. 2 second slow neeche—zero body swing.',
                    feelRight: 'Side delts mein crazy burning pump feel hoga—3x/week frequency se shoulders jaldi wide dikhte hain.',
                    feelWrong: 'Agar gardan ya lower back hile toh weight turant kam karein.'
                }
            },
            {
                id: 'sat-7',
                name: 'Cable Crunch',
                sets: 3,
                repMin: 12,
                repMax: 15,
                repLabel: '12-15',
                type: 'isolation',
                restSec: 75,
                targetMuscle: 'Abs',
                primaryGroup: 'Abs',
                secondaryGroups: [],
                step: 'PIN',
                cue: 'Hips still, flex the spine bringing the elbows toward the knees.',
                alternatives: [],
                flags: {},
                guide: {
                    setup: 'High pulley par rope lagakar machine ke saamne ghutno par baithein. Rope ke ends ko forehead/ears ke paas fix kar dein (haath poore set mein nahi hilenge). Hips ko heels ke upar lock rakhein.',
                    execution: 'Saans bahar chhodte hue apni spine (upper back) ko gol karke ribs ko pelvis ki taraf crunch karein (elbows ghutno ya thighs ki taraf aayein). Hips peeche mat khisakne dein.',
                    feelRight: 'Upper aur middle Abs (6-pack blocks) mein deep cramp jaisa contraction feel hoga.',
                    feelWrong: 'Agar hips aage-peeche hil rahi hain aur sirf hip flexors ya arms thak rahe hain, toh aap spine flex nahi kar rahe balki sirf kamar se jhuk rahe hain.'
                }
            }
        ]
    },
    {
        dayIndex: 0,
        shortDay: 'Sun',
        dayName: 'Sunday',
        title: 'Rest & Recovery',
        subtitle: '20–30 min easy walk, light mobility, no lifting',
        isRest: true,
        estimatedMinutes: 30,
        chartFile: null,
        chartImage: null,
        exercises: []
    }
];

export const EXPECTED_WEEKLY_PRIMARY_SETS = {
    Chest: 14,
    'Front delts': 7,
    'Side delts': 11,
    'Rear delts': 9,
    'Lats/Back': 22,
    Biceps: 15,
    Triceps: 11,
    Quads: 13,
    Hamstrings: 9,
    Glutes: 6,
    Calves: 8,
    Abs: 6
};

export const TOTAL_WEEKLY_PRIMARY_SETS = Object.values(EXPECTED_WEEKLY_PRIMARY_SETS).reduce(
    (sum, v) => sum + v,
    0
);

// ============================================================================
// SECTION 3: NUTRITION DATABASE (29 Indian Whole Foods — Zero Supplements)
// ============================================================================

export const INITIAL_FOOD_DATABASE = [
    { id: 'whole_egg', name: 'Whole egg (1 egg ≈ 50 g)', basis: 1, unit: 'egg', category: 'Protein', kcal: 72, protein: 6.3, carbs: 0.4, fat: 4.8 },
    { id: 'chicken_breast_raw', name: 'Chicken breast, raw, skinless', basis: 100, unit: 'g', category: 'Protein', kcal: 120, protein: 22.5, carbs: 0, fat: 2.6 },
    { id: 'paneer', name: 'Paneer, full-fat', basis: 100, unit: 'g', category: 'Dairy', kcal: 280, protein: 18.5, carbs: 3, fat: 21 },
    { id: 'soya_chunks_dry', name: 'Soya chunks, dry', basis: 100, unit: 'g', category: 'Protein', kcal: 345, protein: 52, carbs: 33, fat: 0.5 },
    { id: 'moong_dal_dry', name: 'Moong dal, dry', basis: 100, unit: 'g', category: 'Protein', kcal: 347, protein: 24, carbs: 59, fat: 1.2 },
    { id: 'toor_dal_dry', name: 'Toor dal, dry', basis: 100, unit: 'g', category: 'Protein', kcal: 335, protein: 22, carbs: 57, fat: 1.5 },
    { id: 'rajma_dry', name: 'Rajma, dry', basis: 100, unit: 'g', category: 'Protein', kcal: 333, protein: 22, carbs: 60, fat: 1 },
    { id: 'kabuli_chana_dry', name: 'Kabuli chana, dry', basis: 100, unit: 'g', category: 'Protein', kcal: 364, protein: 19, carbs: 61, fat: 6 },
    { id: 'roasted_chana', name: 'Roasted chana', basis: 100, unit: 'g', category: 'Protein', kcal: 370, protein: 19, carbs: 58, fat: 5 },
    { id: 'sattu', name: 'Sattu (roasted chana flour)', basis: 100, unit: 'g', category: 'Protein', kcal: 405, protein: 20, carbs: 60, fat: 6 },
    { id: 'peanuts', name: 'Peanuts', basis: 100, unit: 'g', category: 'Pantry', kcal: 567, protein: 24, carbs: 16, fat: 49 },
    { id: 'peanut_butter', name: 'Peanut butter', basis: 100, unit: 'g', category: 'Pantry', kcal: 588, protein: 25, carbs: 20, fat: 50 },
    { id: 'almonds', name: 'Almonds', basis: 100, unit: 'g', category: 'Pantry', kcal: 579, protein: 21, carbs: 22, fat: 50 },
    { id: 'whole_milk', name: 'Whole milk', basis: 100, unit: 'ml', category: 'Dairy', kcal: 61, protein: 3.2, carbs: 4.8, fat: 3.3 },
    { id: 'curd', name: 'Curd / dahi (whole milk)', basis: 100, unit: 'g', category: 'Dairy', kcal: 61, protein: 3.5, carbs: 4.7, fat: 3.3 },
    { id: 'atta_dry', name: 'Whole-wheat atta, dry', basis: 100, unit: 'g', category: 'Carbs', kcal: 346, protein: 11.8, carbs: 71, fat: 1.5 },
    { id: 'roti', name: 'Whole-wheat roti (1 roti = 30 g atta)', basis: 1, unit: 'roti', category: 'Carbs', kcal: 104, protein: 3.5, carbs: 21.3, fat: 0.5 },
    { id: 'rice_cooked', name: 'Rice, cooked', basis: 100, unit: 'g', category: 'Carbs', kcal: 130, protein: 2.7, carbs: 28, fat: 0.3 },
    { id: 'poha_dry', name: 'Poha, dry', basis: 100, unit: 'g', category: 'Carbs', kcal: 346, protein: 6.6, carbs: 77, fat: 1.2 },
    { id: 'rolled_oats', name: 'Rolled oats', basis: 100, unit: 'g', category: 'Carbs', kcal: 389, protein: 16.9, carbs: 66, fat: 6.9 },
    { id: 'bread_slice', name: 'Whole-wheat bread (1 slice, 30 g)', basis: 1, unit: 'slice', category: 'Carbs', kcal: 75, protein: 3.5, carbs: 13, fat: 1 },
    { id: 'banana', name: 'Banana (1 medium, 118 g)', basis: 1, unit: 'banana', category: 'Carbs', kcal: 105, protein: 1.3, carbs: 27, fat: 0.4 },
    { id: 'dates', name: 'Dates', basis: 100, unit: 'g', category: 'Carbs', kcal: 277, protein: 1.8, carbs: 75, fat: 0.2 },
    { id: 'jaggery', name: 'Jaggery', basis: 100, unit: 'g', category: 'Pantry', kcal: 383, protein: 0.4, carbs: 98, fat: 0.1 },
    { id: 'ghee', name: 'Ghee', basis: 100, unit: 'g', category: 'Pantry', kcal: 900, protein: 0, carbs: 0, fat: 100 },
    { id: 'cooking_oil', name: 'Cooking oil', basis: 100, unit: 'g', category: 'Pantry', kcal: 900, protein: 0, carbs: 0, fat: 100 },
    { id: 'potato_boiled', name: 'Potato, boiled', basis: 100, unit: 'g', category: 'Carbs', kcal: 87, protein: 1.9, carbs: 20, fat: 0.1 },
    { id: 'mixed_sabzi', name: 'Mixed sabzi, cooked with ~5% oil', basis: 100, unit: 'g', category: 'Carbs', kcal: 85, protein: 2, carbs: 8, fat: 5 },
    { id: 'gravy_base', name: 'Onion–tomato gravy base', basis: 100, unit: 'g', category: 'Pantry', kcal: 45, protein: 1.2, carbs: 7, fat: 1.5 }
];

export const MEAL_SLOTS = [
    {
        slotId: 'breakfast',
        slotName: 'Breakfast',
        timeHint: '08:00',
        options: [
            {
                id: 'B1',
                code: 'B1',
                label: 'B1 (Egg Bhurji / Omelette)',
                description: '2 whole eggs as bhurji or omelette in 5 g oil + 3 roti + 250 ml milk',
                tracks: ['non-veg', 'eggetarian'],
                proteinAnchor: 'egg',
                expected: { kcal: 654, protein: 31, carbs: 77, fat: 24 },
                ingredients: [
                    { foodId: 'whole_egg', amount: 2 },
                    { foodId: 'cooking_oil', amount: 5 },
                    { foodId: 'roti', amount: 3 },
                    { foodId: 'whole_milk', amount: 250 }
                ]
            },
            {
                id: 'B2',
                code: 'B2',
                label: 'B2 (Veg Paneer Bhurji)',
                description: '80 g paneer bhurji in 5 g oil + 2 roti + 250 ml milk',
                tracks: ['non-veg', 'eggetarian', 'veg'],
                proteinAnchor: 'paneer',
                expected: { kcal: 630, protein: 30, carbs: 57, fat: 31 },
                ingredients: [
                    { foodId: 'paneer', amount: 80 },
                    { foodId: 'cooking_oil', amount: 5 },
                    { foodId: 'roti', amount: 2 },
                    { foodId: 'whole_milk', amount: 250 }
                ]
            }
        ]
    },
    {
        slotId: 'mid_morning',
        slotName: 'Mid-morning',
        timeHint: '11:00',
        options: [
            {
                id: 'M1',
                code: 'M1',
                label: 'M1 (Banana PB Milk Shake)',
                description: '1 banana + 300 ml milk + 16 g peanut butter shake',
                tracks: ['non-veg', 'eggetarian', 'veg'],
                proteinAnchor: 'dairy',
                expected: { kcal: 382, protein: 15, carbs: 45, fat: 18 },
                ingredients: [
                    { foodId: 'banana', amount: 1 },
                    { foodId: 'whole_milk', amount: 300 },
                    { foodId: 'peanut_butter', amount: 16 }
                ]
            },
            {
                id: 'M2',
                code: 'M2',
                label: 'M2 (Sattu–Milk No-Blender Drink)',
                description: '40 g sattu + 250 ml milk + 10 g jaggery',
                tracks: ['non-veg', 'eggetarian', 'veg'],
                proteinAnchor: 'sattu',
                expected: { kcal: 353, protein: 16, carbs: 46, fat: 11 },
                ingredients: [
                    { foodId: 'sattu', amount: 40 },
                    { foodId: 'whole_milk', amount: 250 },
                    { foodId: 'jaggery', amount: 10 }
                ]
            }
        ]
    },
    {
        slotId: 'lunch',
        slotName: 'Lunch',
        timeHint: '13:30',
        options: [
            {
                id: 'L1',
                code: 'L1',
                label: 'L1 (Chicken Curry Thali)',
                description: '100 g raw chicken breast curry in 8 g oil + 200 g cooked rice + dal (35 g dry moong + 5 g ghee) + 100 g curd',
                tracks: ['non-veg'],
                proteinAnchor: 'chicken',
                expected: { kcal: 680, protein: 40, carbs: 81, fat: 20 },
                ingredients: [
                    { foodId: 'chicken_breast_raw', amount: 100 },
                    { foodId: 'cooking_oil', amount: 8 },
                    { foodId: 'rice_cooked', amount: 200 },
                    { foodId: 'moong_dal_dry', amount: 35 },
                    { foodId: 'ghee', amount: 5 },
                    { foodId: 'curd', amount: 100 }
                ]
            },
            {
                id: 'L2',
                code: 'L2',
                label: 'L2 (Veg Soya Chunks & Dal Thali)',
                description: '40 g dry soya chunks curry in 8 g oil + 200 g cooked rice + dal (35 g dry moong + 5 g ghee) + 100 g curd',
                tracks: ['non-veg', 'eggetarian', 'veg'],
                proteinAnchor: 'soya',
                expected: { kcal: 698, protein: 38, carbs: 95, fat: 18 },
                ingredients: [
                    { foodId: 'soya_chunks_dry', amount: 40 },
                    { foodId: 'cooking_oil', amount: 8 },
                    { foodId: 'rice_cooked', amount: 200 },
                    { foodId: 'moong_dal_dry', amount: 35 },
                    { foodId: 'ghee', amount: 5 },
                    { foodId: 'curd', amount: 100 }
                ]
            }
        ]
    },
    {
        slotId: 'pre_workout',
        slotName: 'Pre-workout',
        timeHint: '17:00',
        options: [
            {
                id: 'P1',
                code: 'P1',
                label: 'P1 (Bread + Banana)',
                description: '2 slices whole-wheat bread + 1 banana (60–90 min pre-gym)',
                tracks: ['non-veg', 'eggetarian', 'veg'],
                proteinAnchor: 'carbs',
                expected: { kcal: 255, protein: 8, carbs: 53, fat: 2 },
                ingredients: [
                    { foodId: 'bread_slice', amount: 2 },
                    { foodId: 'banana', amount: 1 }
                ]
            },
            {
                id: 'P2',
                code: 'P2',
                label: 'P2 (Banana + Dates + Almonds)',
                description: '1 banana + 30 g dates + 6 g almonds',
                tracks: ['non-veg', 'eggetarian', 'veg'],
                proteinAnchor: 'carbs',
                expected: { kcal: 223, protein: 3, carbs: 51, fat: 3.5 },
                ingredients: [
                    { foodId: 'banana', amount: 1 },
                    { foodId: 'dates', amount: 30 },
                    { foodId: 'almonds', amount: 6 }
                ]
            }
        ]
    },
    {
        slotId: 'post_workout',
        slotName: 'Post-workout',
        timeHint: '19:00',
        options: [
            {
                id: 'X1',
                code: 'X1',
                label: 'X1 (3 Boiled Eggs)',
                description: '3 whole boiled eggs with pinch of salt & pepper',
                tracks: ['non-veg', 'eggetarian'],
                proteinAnchor: 'egg',
                expected: { kcal: 216, protein: 19, carbs: 1, fat: 14 },
                ingredients: [{ foodId: 'whole_egg', amount: 3 }]
            },
            {
                id: 'X2',
                code: 'X2',
                label: 'X2 (Chicken Tikka + Roti)',
                description: '100 g raw chicken breast grilled or tikka with 3 g oil + 1 roti',
                tracks: ['non-veg'],
                proteinAnchor: 'chicken',
                expected: { kcal: 251, protein: 26, carbs: 21, fat: 6 },
                ingredients: [
                    { foodId: 'chicken_breast_raw', amount: 100 },
                    { foodId: 'cooking_oil', amount: 3 },
                    { foodId: 'roti', amount: 1 }
                ]
            },
            {
                id: 'X3',
                code: 'X3',
                label: 'X3 (Veg Soya Chaat + Banana)',
                description: '35 g dry soya chunks boiled and tossed with onion, lemon and 5 g oil + 1 banana',
                tracks: ['non-veg', 'eggetarian', 'veg'],
                proteinAnchor: 'soya',
                expected: { kcal: 271, protein: 19.5, carbs: 39, fat: 5.6 },
                ingredients: [
                    { foodId: 'soya_chunks_dry', amount: 35 },
                    { foodId: 'cooking_oil', amount: 5 },
                    { foodId: 'banana', amount: 1 }
                ]
            }
        ]
    },
    {
        slotId: 'dinner',
        slotName: 'Dinner',
        timeHint: '20:30',
        options: [
            {
                id: 'D1',
                code: 'D1',
                label: 'D1 (Chicken Curry + Roti + Rice)',
                description: '100 g raw chicken breast curry in 7 g oil + 2 roti + 100 g sabzi + 100 g cooked rice',
                tracks: ['non-veg'],
                proteinAnchor: 'chicken',
                expected: { kcal: 606, protein: 34, carbs: 79, fat: 16 },
                ingredients: [
                    { foodId: 'chicken_breast_raw', amount: 100 },
                    { foodId: 'cooking_oil', amount: 7 },
                    { foodId: 'roti', amount: 2 },
                    { foodId: 'mixed_sabzi', amount: 100 },
                    { foodId: 'rice_cooked', amount: 100 }
                ]
            },
            {
                id: 'D2',
                code: 'D2',
                label: 'D2 (Egg Curry + Roti + Curd)',
                description: '3 eggs in 8 g oil + 50 g gravy base + 2 roti + 150 g curd',
                tracks: ['non-veg', 'eggetarian'],
                proteinAnchor: 'egg',
                expected: { kcal: 610, protein: 32, carbs: 54, fat: 29 },
                ingredients: [
                    { foodId: 'whole_egg', amount: 3 },
                    { foodId: 'cooking_oil', amount: 8 },
                    { foodId: 'gravy_base', amount: 50 },
                    { foodId: 'roti', amount: 2 },
                    { foodId: 'curd', amount: 150 }
                ]
            },
            {
                id: 'D3',
                code: 'D3',
                label: 'D3 (Paneer Masala + Roti + Curd)',
                description: '80 g paneer in 5 g oil + 50 g gravy base + 2 roti + 150 g curd',
                tracks: ['non-veg', 'eggetarian', 'veg'],
                proteinAnchor: 'paneer',
                expected: { kcal: 591, protein: 28, carbs: 56, fat: 29 },
                ingredients: [
                    { foodId: 'paneer', amount: 80 },
                    { foodId: 'cooking_oil', amount: 5 },
                    { foodId: 'gravy_base', amount: 50 },
                    { foodId: 'roti', amount: 2 },
                    { foodId: 'curd', amount: 150 }
                ]
            },
            {
                id: 'D4',
                code: 'D4',
                label: 'D4 (Soya Chunks Curry + Roti + Rice)',
                description: '50 g dry soya chunks curry in 8 g oil + 50 g gravy base + 2 roti + 100 g cooked rice',
                tracks: ['non-veg', 'eggetarian', 'veg'],
                proteinAnchor: 'soya',
                expected: { kcal: 605, protein: 36, carbs: 91, fat: 10 },
                ingredients: [
                    { foodId: 'soya_chunks_dry', amount: 50 },
                    { foodId: 'cooking_oil', amount: 8 },
                    { foodId: 'gravy_base', amount: 50 },
                    { foodId: 'roti', amount: 2 },
                    { foodId: 'rice_cooked', amount: 100 }
                ]
            }
        ]
    },
    {
        slotId: 'bedtime',
        slotName: 'Bedtime',
        timeHint: '22:30',
        options: [
            {
                id: 'S1',
                code: 'S1',
                label: 'S1 (Warm Milk + Almonds)',
                description: '200 ml milk + 6 almonds (7 g)',
                tracks: ['non-veg', 'eggetarian', 'veg'],
                proteinAnchor: 'dairy',
                expected: { kcal: 163, protein: 8, carbs: 11, fat: 10 },
                ingredients: [
                    { foodId: 'whole_milk', amount: 200 },
                    { foodId: 'almonds', amount: 7 }
                ]
            },
            {
                id: 'S2',
                code: 'S2',
                label: 'S2 (Curd + Peanut Butter Bowl)',
                description: '150 g curd + 10 g peanut butter',
                tracks: ['non-veg', 'eggetarian', 'veg'],
                proteinAnchor: 'dairy',
                expected: { kcal: 150, protein: 8, carbs: 9, fat: 10 },
                ingredients: [
                    { foodId: 'curd', amount: 150 },
                    { foodId: 'peanut_butter', amount: 10 }
                ]
            }
        ]
    }
];

export const APPETITE_HELPERS = [
    { id: 'ah-ghee', label: '1 tsp ghee on dal/roti', kcal: 45, protein: 0, carbs: 0, fat: 5 },
    { id: 'ah-pb', label: '1 tbsp peanut butter', kcal: 94, protein: 4, carbs: 3.2, fat: 8 },
    { id: 'ah-peanuts', label: '30 g roasted peanuts', kcal: 170, protein: 7, carbs: 4.8, fat: 14.7 },
    { id: 'ah-sattu', label: '30 g sattu in water/milk', kcal: 122, protein: 6, carbs: 18, fat: 1.8 },
    { id: 'ah-banana', label: '1 medium banana', kcal: 105, protein: 1.3, carbs: 27, fat: 0.4 },
    { id: 'ah-milk', label: '250 ml extra milk', kcal: 152, protein: 8, carbs: 12, fat: 8.3 }
];

// ============================================================================
// SECTION 4: DISCIPLINE (NO PORN / NO MASTURBATION) PROTOCOL & MILESTONES
// ============================================================================

export const DISCIPLINE_MILESTONES = [
    { days: 1, title: 'Day 1 Spark', benefit: 'Decision locked — breaking the autopilot loop.' },
    { days: 3, title: '72-Hour Filter', benefit: 'Initial dopamine crash passes; mental fog begins lifting.' },
    { days: 7, title: '1 Week Warrior', benefit: 'Energy & gym drive stabilize; morning alertness rises.' },
    { days: 14, title: '2 Weeks Control', benefit: 'Urge waves shorten; focus & study/work stamina improve.' },
    { days: 30, title: '30-Day Rewire', benefit: 'Baseline dopamine sensitivity recovering; strong self-respect.' },
    { days: 60, title: '60-Day Iron Mind', benefit: 'Habit cues lose grip; calm confidence becomes default.' },
    { days: 90, title: '90-Day Full Reboot', benefit: 'Deep neural rewiring achieved — new permanent identity.' },
    { days: 180, title: '180-Day Mastery', benefit: 'Zero compulsion; energy fully channeled into physique & career.' },
    { days: 365, title: '365-Day Legend', benefit: 'Full year clean — complete mastery over impulses.' }
];

export const COMMON_URGE_TRIGGERS = [
    'Late Night Phone',
    'Boredom / Alone',
    'Stress / Anxiety',
    'Social Media Reels',
    'Fatigue / Low Sleep',
    'After Argument / Mood'
];

export const URGE_SOS_ACTIONS = [
    'Phone bedroom se bahar rakhein aur turant room se bahar walk karein (2 min).',
    '20 strict Push-ups ya 30 Bodyweight Squats turant lagayein — blood flow redirect hoga.',
    'Chehre aur gardan par thanda paani chhidkein (diving reflex instantly calms urges).',
    '90-Second Box Breathing (4s inhale • 4s hold • 4s exhale • 4s hold) complete karein.'
];

// ============================================================================
// SECTION 5: COMPUTATION & ANALYTICS HELPERS (100% UNIT-TESTED)
// ============================================================================

export function getLocalDateStr(dateObj = new Date()) {
    return dateObj.toLocaleDateString('en-CA');
}

export function addDaysToDateStr(dateStr, offsetDays) {
    const [y, m, d] = dateStr.split('-').map(Number);
    const dt = new Date(y, m - 1, d);
    dt.setDate(dt.getDate() + offsetDays);
    return getLocalDateStr(dt);
}

export function computeMealOptionMacros(option, foodDb = INITIAL_FOOD_DATABASE) {
    if (!option || !Array.isArray(option.ingredients)) {
        return { kcal: 0, protein: 0, carbs: 0, fat: 0 };
    }
    let kcal = 0;
    let protein = 0;
    let carbs = 0;
    let fat = 0;

    option.ingredients.forEach((item) => {
        const food = foodDb.find((f) => f.id === item.foodId);
        if (!food) return;
        const ratio = Number(item.amount || 0) / Number(food.basis || 100);
        kcal += food.kcal * ratio;
        protein += food.protein * ratio;
        carbs += food.carbs * ratio;
        fat += food.fat * ratio;
    });

    return {
        kcal: Math.round(kcal),
        protein: Number(protein.toFixed(1)),
        carbs: Number(carbs.toFixed(1)),
        fat: Number(fat.toFixed(1))
    };
}

export function computeDayNutritionTotals(state) {
    let consumedKcal = 0;
    let consumedProtein = 0;
    let consumedCarbs = 0;
    let consumedFat = 0;
    let proteinFeedingsCount = 0;
    let plannedKcal = 0;
    let plannedProtein = 0;

    const foodDb = state?.foodDatabase?.length ? state.foodDatabase : INITIAL_FOOD_DATABASE;
    const dietTrack = state?.profile?.dietTrack || 'non-veg';

    MEAL_SLOTS.forEach((slot) => {
        const selectedOptId = state?.selectedMealOptions?.[slot.slotId];
        const opt =
            slot.options.find((o) => o.id === selectedOptId) ||
            slot.options.find((o) => o.tracks.includes(dietTrack)) ||
            slot.options[0];
        if (!opt) return;

        const macros = computeMealOptionMacros(opt, foodDb);
        plannedKcal += macros.kcal;
        plannedProtein += macros.protein;

        if (state?.completedMealSlots?.[slot.slotId]) {
            consumedKcal += macros.kcal;
            consumedProtein += macros.protein;
            consumedCarbs += macros.carbs;
            consumedFat += macros.fat;
            if (macros.protein >= 18) {
                proteinFeedingsCount += 1;
            }
        }
    });

    (state?.loggedAppetiteHelpers || []).forEach((helperId) => {
        const helper = APPETITE_HELPERS.find((h) => h.id === helperId);
        if (helper) {
            consumedKcal += helper.kcal;
            consumedProtein += helper.protein;
            consumedCarbs += helper.carbs;
            consumedFat += helper.fat;
        }
    });

    return {
        consumedKcal: Math.round(consumedKcal),
        consumedProtein: Math.round(consumedProtein),
        consumedCarbs: Math.round(consumedCarbs),
        consumedFat: Math.round(consumedFat),
        plannedKcal: Math.round(plannedKcal),
        plannedProtein: Math.round(plannedProtein),
        proteinFeedingsCount
    };
}

export function buildPelvicProtocol(highSideKey = 'right') {
    const high = highSideKey === 'right' ? 'Right' : 'Left';
    const low = highSideKey === 'right' ? 'Left' : 'Right';

    return {
        highSide: high,
        lowSide: low,
        totalMinutes: 18,
        frequency: '5–6 days / week',
        imbalanceMap: {
            tight: [
                `${high} Quadratus Lumborum (QL / Side Waist) — pulls ${high} hip upward`,
                `${high} Inner Thigh (Adductors) — pulls ${high} hip inward/up`,
                `${low} Outer Hip (Piriformis / TFL) — pulls ${low} hip downward`
            ],
            weak: [
                `${high} Glute Medius (Outer Hip) — fails to stabilize level pelvis`,
                `${low} QL & Obliques (Side Core) — fails to lift ${low} hip up`,
                'Deep Core (Transverse Abdominis) — locks neutral pelvis alignment'
            ]
        },
        habits: [
            {
                id: 'hab-stand',
                label: 'Stand with 50–50% equal weight on both feet (avoid leaning onto one hip)'
            },
            {
                id: 'hab-sit',
                label: 'Sit evenly on both sit-bones (no crossing legs, no wallet/phone in back pocket)'
            },
            {
                id: 'hab-bag',
                label: 'Use a dual-strap backpack evenly on both shoulders instead of one-sided bags'
            },
            {
                id: 'hab-sleep',
                label: 'Place a pillow between knees if side-sleeping to keep pelvis neutral overnight'
            }
        ],
        phases: [
            {
                id: 'pelvic-p1',
                title: 'Phase 1: Release & Stretch Tight Muscles',
                durationMin: 6,
                focus: 'Unilateral Mobility • Decompress High-Side Waist',
                exercises: [
                    {
                        id: 'pt-1',
                        name: `${high} Standing QL Side Bend Stretch`,
                        standardName: 'Standing Quadratus Lumborum Stretch',
                        sideTag: `${high} Side Only`,
                        target: `${high} QL & Side Waist`,
                        mode: 'hold',
                        sets: 3,
                        workSec: 30,
                        restSec: 15,
                        prescription: '3 sets × 30 sec hold',
                        tempo: 'Slow nasal breathing into side ribs',
                        cue: `Stand tall, raise your ${high} arm overhead, and slowly lean your torso toward the ${low} side until you feel a clean stretch along your ${high} waist.`,
                        mistake: 'Avoid twisting your chest forward or collapsing your shoulder—stay strictly sideways.'
                    },
                    {
                        id: 'pt-2',
                        name: `${high} Half-Kneeling Adductor Rock-Back`,
                        standardName: 'Half-Kneeling Adductor Stretch',
                        sideTag: `${high} Leg Only`,
                        target: `${high} Inner Thigh (Adductors)`,
                        mode: 'hold',
                        sets: 3,
                        workSec: 30,
                        restSec: 15,
                        prescription: '3 sets × 30 sec hold',
                        tempo: 'Gentle rock back on exhale',
                        cue: `Kneel on your ${low} knee and extend your ${high} leg straight out to the side with foot flat. Keep back flat and push hips gently backward.`,
                        mistake: 'Do not round your lower back to force depth—stop as soon as the inner thigh feels a moderate stretch.'
                    },
                    {
                        id: 'pt-3',
                        name: `${low} Supine Figure-4 Outer Hip Stretch`,
                        standardName: 'Supine Piriformis / Reclined Pigeon Stretch',
                        sideTag: `${low} Hip Only`,
                        target: `${low} Outer Hip / Piriformis`,
                        mode: 'hold',
                        sets: 3,
                        workSec: 30,
                        restSec: 15,
                        prescription: '3 sets × 30 sec hold',
                        tempo: 'Relax tailbone into the floor',
                        cue: `Lie on your back with knees bent. Cross your ${low} ankle over your ${high} knee, then pull your ${high} thigh toward your chest.`,
                        mistake: 'Keep your tailbone and head resting on the mat—do not yank hard if you feel knee discomfort.'
                    }
                ]
            },
            {
                id: 'pelvic-p2',
                title: 'Phase 2: Strengthen & Level the Pelvis',
                durationMin: 9,
                focus: 'Activate Weak Glute Medius & Opposite Side Core',
                exercises: [
                    {
                        id: 'pt-4',
                        name: `${high}-Leg Standing Pelvic Drop & Hike`,
                        standardName: 'Single-Leg Hip Hike (Step Drill)',
                        sideTag: `Stand on ${high} Leg`,
                        target: `${high} Glute Medius + ${low} QL`,
                        mode: 'reps',
                        sets: 3,
                        workSec: 45,
                        restSec: 45,
                        prescription: '3 sets × 12 reps (~45s / set)',
                        tempo: '2s lift • 2s pause at level • 2s lower',
                        cue: `Stand with your ${high} foot on a 2–4 inch step/book and let your ${low} leg hang off the edge (hold a wall lightly). Keep both knees straight; drop the ${low} hip slightly, then squeeze your ${high} outer glute to hike the ${low} hip back to level.`,
                        mistake: 'Do not bend the standing knee or lean your upper body sideways—all motion comes purely from the pelvis.'
                    },
                    {
                        id: 'pt-5',
                        name: `${high} Side-Lying Clamshells`,
                        standardName: 'Side-Lying Clamshell (Glute Medius Isolation)',
                        sideTag: `${high} Leg On Top`,
                        target: `${high} Glute Medius`,
                        mode: 'reps',
                        sets: 3,
                        workSec: 50,
                        restSec: 40,
                        prescription: '3 sets × 15 reps (~50s / set)',
                        tempo: '1s open • 2s squeeze at top • 2s lower',
                        cue: `Lie on your ${low} side with hips and knees bent ~45–90° and feet stacked together. Open your top (${high}) knee upward without letting your pelvis roll backward.`,
                        mistake: 'Rolling your hips backward turns this into a hip-flexor move—keep your back near a wall to check form.'
                    },
                    {
                        id: 'pt-6',
                        name: `${low}-Side Modified Side Plank`,
                        standardName: 'Short-Lever Side Plank (Hip Lift)',
                        sideTag: `${low} Side Down`,
                        target: `${low} QL & Lateral Obliques`,
                        mode: 'hold',
                        sets: 3,
                        workSec: 25,
                        restSec: 40,
                        prescription: '3 sets × 25–30 sec hold',
                        tempo: 'Steady brace • breathe through ribs',
                        cue: `Lie on your ${low} forearm with knees bent (or legs straight if strong). Drive your ${low} hip up toward the ceiling so your body forms a straight line from shoulder to knees.`,
                        mistake: 'Do not let your bottom shoulder shrug into your ear or allow your hips to sag.'
                    }
                ]
            },
            {
                id: 'pelvic-p3',
                title: 'Phase 3: Neutral Pelvis Core Lock',
                durationMin: 3,
                focus: 'Anti-Rotation & Bilateral Symmetry Integration',
                exercises: [
                    {
                        id: 'pt-7',
                        name: 'Slow Controlled Dead Bug',
                        standardName: 'Supine Dead Bug (Core Stabilization)',
                        sideTag: 'Both Sides',
                        target: 'Deep Core (TVA) & Neutral Pelvis',
                        mode: 'reps',
                        sets: 3,
                        workSec: 50,
                        restSec: 35,
                        prescription: '3 sets × 10 reps / side (~50s / set)',
                        tempo: '3s slow reach • exhale on extension',
                        cue: 'Lie on your back, arms vertical, knees at 90°. Press your lower back flat into the floor, then slowly lower opposite arm and leg near the ground without arching your spine.',
                        mistake: 'If your lower back lifts off the floor, reduce how far you extend your leg.'
                    }
                ]
            }
        ]
    };
}

export function getDefaultSelectedMealsForTrack(dietTrack = 'non-veg') {
    if (dietTrack === 'veg') {
        return {
            breakfast: 'B2',
            mid_morning: 'M1',
            lunch: 'L2',
            pre_workout: 'P1',
            post_workout: 'X3',
            dinner: 'D3',
            bedtime: 'S1'
        };
    }
    if (dietTrack === 'eggetarian') {
        return {
            breakfast: 'B1',
            mid_morning: 'M1',
            lunch: 'L2',
            pre_workout: 'P1',
            post_workout: 'X1',
            dinner: 'D2',
            bedtime: 'S1'
        };
    }
    return {
        breakfast: 'B1',
        mid_morning: 'M1',
        lunch: 'L1',
        pre_workout: 'P1',
        post_workout: 'X1',
        dinner: 'D1',
        bedtime: 'S1'
    };
}

export function generateWeeklyMenuRotation(dietTrack = 'non-veg') {
    const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const getAllowed = (slotId) => {
        const slot = MEAL_SLOTS.find((s) => s.slotId === slotId);
        return (slot?.options || []).filter((opt) => opt.tracks.includes(dietTrack));
    };

    const bOpts = getAllowed('breakfast');
    const mOpts = getAllowed('mid_morning');
    const lOpts = getAllowed('lunch');
    const pOpts = getAllowed('pre_workout');
    const xOpts = getAllowed('post_workout');
    const dOpts = getAllowed('dinner');
    const sOpts = getAllowed('bedtime');

    let prevDinnerAnchor = '';
    let consecutiveDinnerAnchorCount = 0;

    return dayNames.map((day, idx) => {
        const b = bOpts[idx % bOpts.length];
        const m = mOpts[idx % mOpts.length];
        const l = lOpts[idx % lOpts.length];
        const p = pOpts[idx % pOpts.length];
        const x = xOpts[idx % xOpts.length];
        const s = sOpts[idx % sOpts.length];

        let candidates = dOpts.filter((opt) => opt.proteinAnchor !== l.proteinAnchor);
        if (candidates.length === 0) candidates = dOpts;

        let chosenDinner = candidates[idx % candidates.length];
        if (chosenDinner.proteinAnchor === prevDinnerAnchor && consecutiveDinnerAnchorCount >= 1) {
            const alt = candidates.find((c) => c.proteinAnchor !== prevDinnerAnchor);
            if (alt) chosenDinner = alt;
        }

        if (chosenDinner.proteinAnchor === prevDinnerAnchor) {
            consecutiveDinnerAnchorCount += 1;
        } else {
            prevDinnerAnchor = chosenDinner.proteinAnchor;
            consecutiveDinnerAnchorCount = 1;
        }

        return {
            day,
            slots: {
                breakfast: b.id,
                mid_morning: m.id,
                lunch: l.id,
                pre_workout: p.id,
                post_workout: x.id,
                dinner: chosenDinner.id,
                bedtime: s.id
            }
        };
    });
}

export function generateWeeklyGroceryList(weeklyMenu, foodDb = INITIAL_FOOD_DATABASE) {
    const totalsByFoodId = {};
    const optionLookup = {};
    MEAL_SLOTS.forEach((slot) => {
        slot.options.forEach((opt) => {
            optionLookup[opt.id] = opt;
        });
    });

    weeklyMenu.forEach((dayEntry) => {
        Object.values(dayEntry.slots).forEach((optId) => {
            const opt = optionLookup[optId];
            if (!opt) return;
            opt.ingredients.forEach((ing) => {
                totalsByFoodId[ing.foodId] = (totalsByFoodId[ing.foodId] || 0) + Number(ing.amount || 0);
            });
        });
    });

    const grouped = { Protein: [], Carbs: [], Dairy: [], Pantry: [] };
    Object.entries(totalsByFoodId).forEach(([foodId, rawTotal]) => {
        const food = foodDb.find((f) => f.id === foodId);
        if (!food) return;
        let displayQty = '';
        if (food.id === 'whole_egg') {
            const dozens = (rawTotal / 12).toFixed(1);
            displayQty = `${rawTotal} eggs (${dozens} dozen)`;
        } else if (food.id === 'roti') {
            const attaGrams = rawTotal * 30;
            displayQty = `${rawTotal} rotis (~${(attaGrams / 1000).toFixed(2)} kg dry atta)`;
        } else if (food.unit === 'g') {
            displayQty =
                rawTotal >= 1000 ? `${(rawTotal / 1000).toFixed(2)} kg` : `${Math.round(rawTotal)} g`;
        } else if (food.unit === 'ml') {
            displayQty =
                rawTotal >= 1000 ? `${(rawTotal / 1000).toFixed(2)} L` : `${Math.round(rawTotal)} ml`;
        } else {
            displayQty = `${rawTotal} ${food.unit}s`;
        }

        const cat = grouped[food.category] ? food.category : 'Pantry';
        grouped[cat].push({
            id: food.id,
            name: food.name,
            rawTotal,
            displayQty
        });
    });

    return grouped;
}

export function computeWeeklyMuscleVolumes() {
    const primary = {};
    const totalWithSecondary = {};

    Object.keys(EXPECTED_WEEKLY_PRIMARY_SETS).forEach((k) => {
        primary[k] = 0;
        totalWithSecondary[k] = 0;
    });

    WORKOUT_PLAN.forEach((day) => {
        day.exercises.forEach((ex) => {
            const g = ex.primaryGroup;
            primary[g] = (primary[g] || 0) + ex.sets;
            totalWithSecondary[g] = (totalWithSecondary[g] || 0) + ex.sets;

            (ex.secondaryGroups || []).forEach((sec) => {
                totalWithSecondary[sec] =
                    (totalWithSecondary[sec] || 0) + ex.sets * SCIENCE_RULES.SECONDARY_MUSCLE_CREDIT;
            });
        });
    });

    return { primary, totalWithSecondary };
}

export function calculateProgressiveOverload(
    exercise,
    previousSets,
    customSteps = {},
    activeVariantId = null
) {
    const prescribedSets = exercise?.sets || 3;
    if (!exercise || !Array.isArray(previousSets) || previousSets.length < prescribedSets) {
        return {
            shouldIncrease: false,
            incrementKg: 0,
            lastWeightKg: 0,
            suggestedWeightKg: 0,
            mode: 'add',
            reason: `Complete all ${prescribedSets} working sets first`
        };
    }

    let stepCode = exercise.step || 'B2.5';
    let isAssisted = Boolean(exercise.flags?.assisted);
    const isBodyweight = Boolean(exercise.flags?.bodyweight);

    if (exercise.flags?.variants && activeVariantId) {
        const v = exercise.flags.variants.find((item) => item.id === activeVariantId);
        if (v) {
            stepCode = v.step;
            isAssisted = Boolean(v.assisted);
        }
    }

    const stepDef = DEFAULT_STEP_INCREMENTS[stepCode] || DEFAULT_STEP_INCREMENTS['B2.5'];
    const customDelta =
        customSteps[exercise.id] !== undefined ? Number(customSteps[exercise.id]) : stepDef.deltaKg;

    const relevantSets = previousSets.slice(0, prescribedSets);
    const baseWeight = Number(relevantSets[0]?.weight || 0);

    if (isBodyweight) {
        const allHitMax = relevantSets.every((s) => Number(s.reps) >= exercise.repMax);
        if (allHitMax) {
            const nextWeight = Number((baseWeight + Math.abs(customDelta)).toFixed(2));
            return {
                shouldIncrease: true,
                incrementKg: Math.abs(customDelta),
                lastWeightKg: baseWeight,
                suggestedWeightKg: nextWeight,
                mode: 'bodyweight',
                reason: `All ${prescribedSets} sets hit ${exercise.repMax} reps — add +${Math.abs(
                    customDelta
                )} kg or harder variation`
            };
        }
        return {
            shouldIncrease: false,
            incrementKg: 0,
            lastWeightKg: baseWeight,
            suggestedWeightKg: baseWeight,
            mode: 'bodyweight',
            reason: `Progress reps to ${exercise.repMax} across all ${prescribedSets} sets before adding weight`
        };
    }

    const allHitMax = relevantSets.every(
        (s) => Number(s.reps) >= exercise.repMax && Number(s.weight) > 0
    );

    if (allHitMax) {
        if (isAssisted || stepDef.mode === 'assist') {
            const reduction = Math.abs(customDelta) || 5.0;
            const suggestedWeightKg = Math.max(0, Number((baseWeight - reduction).toFixed(2)));
            return {
                shouldIncrease: true,
                incrementKg: -reduction,
                lastWeightKg: baseWeight,
                suggestedWeightKg,
                mode: 'assist',
                reason: `All ${prescribedSets} sets hit ${exercise.repMax}+ reps — reduce assistance by ${reduction} kg`
            };
        }

        const incrementKg = Math.abs(customDelta);
        return {
            shouldIncrease: true,
            incrementKg,
            lastWeightKg: baseWeight,
            suggestedWeightKg: Number((baseWeight + incrementKg).toFixed(2)),
            mode: 'add',
            reason: `All ${prescribedSets} sets hit ${exercise.repMax}+ reps last session (${stepCode})`
        };
    }

    return {
        shouldIncrease: false,
        incrementKg: 0,
        lastWeightKg: baseWeight,
        suggestedWeightKg: baseWeight,
        mode: isAssisted ? 'assist' : 'add',
        reason: isAssisted
            ? `Hit ${exercise.repMax} reps on all ${prescribedSets} sets to reduce assistance by ${Math.abs(
                  customDelta
              )} kg`
            : `Hit ${exercise.repMax} reps across all ${prescribedSets} sets to unlock +${Math.abs(
                  customDelta
              )} kg`
    };
}

export function analyzeWeeklyGainRate(weightLogs, ignoreInitial14Days = true) {
    if (!Array.isArray(weightLogs) || weightLogs.length < 2) {
        return {
            status: 'INSUFFICIENT_DATA',
            latestWeeklyGainKg: 0,
            avgWeeklyGainKg: 0,
            consecutiveLowWeeks: 0,
            calorieAdjustment: 0,
            headline: 'Log at least 2 morning weigh-ins',
            message:
                'Subah uthne ke baad (washroom jaane ke baad, khali pet) aur raat ko sone se pehle apna weight log karein.'
        };
    }

    const getTrueWeight = (entry) =>
        Number(entry.morningKg || entry.weightKg || entry.nightKg || 0);

    const sorted = [...weightLogs]
        .filter((w) => getTrueWeight(w) > 0)
        .sort((a, b) => new Date(a.date) - new Date(b.date));

    if (sorted.length < 2) {
        return {
            status: 'INSUFFICIENT_DATA',
            latestWeeklyGainKg: 0,
            avgWeeklyGainKg: 0,
            consecutiveLowWeeks: 0,
            calorieAdjustment: 0,
            headline: 'Log at least 2 valid weigh-ins',
            message: 'True lean-bulk velocity track karne ke liye kam se kam 2 din ka weight log karein.'
        };
    }

    const firstDateMs = new Date(sorted[0].date).getTime();
    const lastDateMs = new Date(sorted[sorted.length - 1].date).getTime();
    const totalSpanDays = Math.max(1, (lastDateMs - firstDateMs) / (1000 * 60 * 60 * 24));

    const weeklyDeltas = [];
    for (let i = 1; i < sorted.length; i++) {
        const prev = sorted[i - 1];
        const curr = sorted[i];
        const daysDiff = Math.max(
            1,
            (new Date(curr.date).getTime() - new Date(prev.date).getTime()) / (1000 * 60 * 60 * 24)
        );
        const weeklyRate = ((getTrueWeight(curr) - getTrueWeight(prev)) / daysDiff) * 7;
        weeklyDeltas.push(Number(weeklyRate.toFixed(2)));
    }

    const latestWeeklyGainKg = weeklyDeltas[weeklyDeltas.length - 1];
    const recentSlice = weeklyDeltas.slice(-7);
    const avgWeeklyGainKg = Number(
        (recentSlice.reduce((acc, v) => acc + v, 0) / recentSlice.length).toFixed(2)
    );

    let consecutiveLowWeeks = 0;
    for (let i = weeklyDeltas.length - 1; i >= 0; i--) {
        if (weeklyDeltas[i] < SCIENCE_RULES.GAIN_LOWER_FLOOR_KG) {
            consecutiveLowWeeks++;
        } else {
            break;
        }
    }

    if (
        ignoreInitial14Days &&
        totalSpanDays < SCIENCE_RULES.GAIN_IGNORE_INITIAL_DAYS &&
        sorted.length <= 2 &&
        latestWeeklyGainKg <= SCIENCE_RULES.GAIN_UPPER_HARD_CAP_KG
    ) {
        return {
            status: 'EARLY_GLYCOGEN_PHASE',
            latestWeeklyGainKg,
            avgWeeklyGainKg,
            consecutiveLowWeeks,
            calorieAdjustment: 0,
            headline: 'Days 1–14: Initial Glycogen & Water Phase',
            message: `Current rate +${latestWeeklyGainKg.toFixed(
                2
            )} kg/wk hai. Starting ke 14 days mein muscle glycogen aur water fill hota hai. Calories 2,900 kcal par steady rakhein.`
        };
    }

    if (
        latestWeeklyGainKg > SCIENCE_RULES.GAIN_UPPER_HARD_CAP_KG ||
        avgWeeklyGainKg > SCIENCE_RULES.GAIN_UPPER_HARD_CAP_KG
    ) {
        return {
            status: 'FAST_GAIN_WARNING',
            latestWeeklyGainKg,
            avgWeeklyGainKg,
            consecutiveLowWeeks,
            calorieAdjustment: -200,
            headline: 'Warning: Gaining Above 0.7 kg/week (Waist Fat Risk)',
            message: `Current rate +${latestWeeklyGainKg.toFixed(
                2
            )} kg/wk (rolling avg +${avgWeeklyGainKg.toFixed(
                2
            )} kg/wk) hai. 0.7 kg/wk se zyada gain hone par waist fat badhta hai. ~200 kcal/day kam karein.`
        };
    }

    if (consecutiveLowWeeks >= 2) {
        return {
            status: 'PLATEAU_SUGGESTION',
            latestWeeklyGainKg,
            avgWeeklyGainKg,
            consecutiveLowWeeks,
            calorieAdjustment: 300,
            headline: 'Plateau Detected (below 0.2 kg/wk): Add +300 kcal',
            message: `Pichle ${consecutiveLowWeeks} check-ins se gain 0.2 kg/wk se kam hai (latest: +${latestWeeklyGainKg.toFixed(
                2
            )} kg/wk). Nutrition tab se +300 kcal/day add karein.`
        };
    }

    return {
        status: 'OPTIMAL_LEAN_BULK',
        latestWeeklyGainKg,
        avgWeeklyGainKg,
        consecutiveLowWeeks,
        calorieAdjustment: 0,
        headline: 'Optimal Lean-Bulk Velocity (0.20 – 0.55 kg/week)',
        message: `Gaining +${latestWeeklyGainKg.toFixed(
            2
        )} kg/wk (rolling avg +${avgWeeklyGainKg.toFixed(
            2
        )} kg/wk). Aapka lean-mass gain bilkul sweet spot mein chal raha hai!`
    };
}

export function analyzeDisciplineProgress(
    disciplineLogs = {},
    urgeLogs = [],
    referenceDateStr = getLocalDateStr()
) {
    const entries = Object.values(disciplineLogs || {})
        .filter((e) => e && e.date)
        .sort((a, b) => a.date.localeCompare(b.date));

    const totalLoggedDays = entries.length;
    const totalCleanDays = entries.filter((e) => e.status === 'clean').length;
    const totalRelapses = entries.filter((e) => e.status === 'relapse').length;
    const cleanRatePct =
        totalLoggedDays > 0 ? Math.round((totalCleanDays / totalLoggedDays) * 100) : 0;

    let currentStreak = 0;
    const todayEntry = disciplineLogs?.[referenceDateStr];
    const yesterdayStr = addDaysToDateStr(referenceDateStr, -1);
    let cursorDate =
        todayEntry?.status === 'clean'
            ? referenceDateStr
            : todayEntry?.status === 'relapse'
                ? null
                : disciplineLogs?.[yesterdayStr]?.status === 'clean'
                    ? yesterdayStr
                    : null;

    while (cursorDate && disciplineLogs?.[cursorDate]?.status === 'clean') {
        currentStreak += 1;
        cursorDate = addDaysToDateStr(cursorDate, -1);
    }

    let bestStreak = 0;
    let runningStreak = 0;
    let momentumScore = 0;
    let prevDate = null;

    const urgesByDate = {};
    (urgeLogs || []).forEach((u) => {
        if (!u?.date) return;
        urgesByDate[u.date] = (urgesByDate[u.date] || 0) + 1;
    });

    const dailyGrowthSeries = entries.map((entry, idx) => {
        const isConsecutive = prevDate ? addDaysToDateStr(prevDate, 1) === entry.date : false;
        const defeatedToday = urgesByDate[entry.date] || 0;

        if (entry.status === 'clean') {
            runningStreak = isConsecutive ? runningStreak + 1 : 1;
            if (runningStreak > bestStreak) bestStreak = runningStreak;
            momentumScore += 10 + Math.min(10, runningStreak) + defeatedToday * 3;
        } else {
            runningStreak = 0;
            momentumScore = Math.max(0, Math.round(momentumScore * 0.72));
        }

        const windowEntries = entries.slice(Math.max(0, idx - 6), idx + 1);
        const cleanInWindow = windowEntries.filter((w) => w.status === 'clean').length;
        const rolling7Pct = Math.round((cleanInWindow / windowEntries.length) * 100);

        prevDate = entry.date;

        return {
            date: entry.date.slice(5),
            fullDate: entry.date,
            status: entry.status,
            streak: runningStreak,
            momentum: momentumScore,
            consistency7d: rolling7Pct,
            urgeLevel: Number(entry.urgeLevel || 0),
            urgesDefeated: defeatedToday
        };
    });

    const triggerCounts = {};
    entries.forEach((e) => {
        if (e.trigger) triggerCounts[e.trigger] = (triggerCounts[e.trigger] || 0) + 1;
    });
    (urgeLogs || []).forEach((u) => {
        if (u.trigger) triggerCounts[u.trigger] = (triggerCounts[u.trigger] || 0) + 1;
    });

    const triggerBreakdown = Object.entries(triggerCounts)
        .map(([trigger, count]) => ({ trigger, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 6);

    const heatmap35 = Array.from({ length: 35 }, (_, i) => {
        const dStr = addDaysToDateStr(referenceDateStr, -(34 - i));
        const log = disciplineLogs?.[dStr] || null;
        return {
            date: dStr,
            shortDate: dStr.slice(5),
            status: log?.status || 'unlogged',
            urgeLevel: log?.urgeLevel || 0,
            urgesDefeated: urgesByDate[dStr] || 0
        };
    });

    const rebootPct = Math.min(
        100,
        Math.round((currentStreak / SCIENCE_RULES.REBOOT_TARGET_DAYS) * 100)
    );

    const nextMilestone =
        DISCIPLINE_MILESTONES.find((m) => m.days > currentStreak) ||
        DISCIPLINE_MILESTONES[DISCIPLINE_MILESTONES.length - 1];

    const currentRank =
        [...DISCIPLINE_MILESTONES].reverse().find((m) => currentStreak >= m.days) || {
            days: 0,
            title: 'Day 0 — Ready to Begin',
            benefit: 'Tap "Mark Today Clean" below to start your permanent transformation.'
        };

    return {
        currentStreak,
        bestStreak,
        totalLoggedDays,
        totalCleanDays,
        totalRelapses,
        cleanRatePct,
        urgesDefeated: (urgeLogs || []).length,
        rebootPct,
        nextMilestone,
        currentRank,
        dailyGrowthSeries,
        triggerBreakdown,
        heatmap35,
        todayLoggedStatus: todayEntry?.status || null
    };
}

export function runBuiltInUnitTests() {
    const results = [];

    const { primary } = computeWeeklyMuscleVolumes();
    const totalSets = Object.values(primary).reduce((a, b) => a + b, 0);
    const allMatchExpected = Object.entries(EXPECTED_WEEKLY_PRIMARY_SETS).every(
        ([group, exp]) => primary[group] === exp
    );
    results.push({
        name: `Weekly Primary Sets Match Exact Spec (Total = ${TOTAL_WEEKLY_PRIMARY_SETS} Sets)`,
        passed: allMatchExpected && totalSets === TOTAL_WEEKLY_PRIMARY_SETS,
        expected: `${TOTAL_WEEKLY_PRIMARY_SETS} sets (Lats/Back 22, Biceps 15, Chest 14, Quads 13...)`,
        actual: `${totalSets} sets (Lats/Back ${primary['Lats/Back']}, Biceps ${primary.Biceps}, Chest ${primary.Chest}, Quads ${primary.Quads})`
    });

    const assistPullup = WORKOUT_PLAN[1].exercises[1];
    const tAssist = calculateProgressiveOverload(assistPullup, [
        { weight: 25, reps: 10 },
        { weight: 25, reps: 10 },
        { weight: 25, reps: 10 }
    ]);
    results.push({
        name: 'Assisted Lift Overload Reduces Assistance (-5 kg -> 20 kg)',
        passed:
            tAssist.shouldIncrease === true &&
            tAssist.incrementKg === -5 &&
            tAssist.suggestedWeightKg === 20,
        expected: 'shouldIncrease: true, -5 kg -> 20 kg assistance',
        actual: `shouldIncrease: ${tAssist.shouldIncrease}, ${tAssist.incrementKg} kg -> ${tAssist.suggestedWeightKg} kg`
    });

    let allMealsWithin5Pct = true;
    let maxDeviationPct = 0;
    MEAL_SLOTS.forEach((slot) => {
        slot.options.forEach((opt) => {
            const calc = computeMealOptionMacros(opt, INITIAL_FOOD_DATABASE);
            const diffPct = Math.abs(calc.kcal - opt.expected.kcal) / opt.expected.kcal;
            if (diffPct > maxDeviationPct) maxDeviationPct = diffPct;
            if (diffPct > 0.05) allMealsWithin5Pct = false;
        });
    });
    results.push({
        name: 'All 17 Meal Options Computed from Food DB Within ±5%',
        passed: allMealsWithin5Pct,
        expected: 'Max deviation <= 5.0% across B1..S2',
        actual: `Max deviation ${(maxDeviationPct * 100).toFixed(2)}% across 17 options`
    });

    const findOpt = (code) => {
        for (const s of MEAL_SLOTS) {
            const found = s.options.find((o) => o.code === code);
            if (found) return computeMealOptionMacros(found, INITIAL_FOOD_DATABASE);
        }
        return { kcal: 0, protein: 0, carbs: 0, fat: 0 };
    };
    const nonVegCodes = ['B1', 'M1', 'L1', 'P1', 'X1', 'D1', 'S1'];
    const nonVegTotals = nonVegCodes.reduce(
        (acc, c) => {
            const m = findOpt(c);
            return { kcal: acc.kcal + m.kcal, protein: acc.protein + m.protein };
        },
        { kcal: 0, protein: 0 }
    );
    const vegCodes = ['B2', 'M1', 'L2', 'P1', 'X3', 'D3', 'S1'];
    const vegTotals = vegCodes.reduce(
        (acc, c) => {
            const m = findOpt(c);
            return { kcal: acc.kcal + m.kcal, protein: acc.protein + m.protein };
        },
        { kcal: 0, protein: 0 }
    );
    const nonVegPass =
        Math.abs(nonVegTotals.kcal - 2955) <= 25 && Math.round(nonVegTotals.protein) >= 150;
    const vegPass = Math.abs(vegTotals.kcal - 2990) <= 25 && Math.round(vegTotals.protein) >= 144;
    results.push({
        name: 'Full-Day Non-Veg (~2,955 kcal / 155g P) & Veg (~2,990 kcal / 146g P)',
        passed: nonVegPass && vegPass,
        expected: 'Non-Veg ~2955 kcal/155g P | Veg ~2990 kcal/146g P',
        actual: `Non-Veg ${nonVegTotals.kcal} kcal/${Math.round(
            nonVegTotals.protein
        )}g P | Veg ${vegTotals.kcal} kcal/${Math.round(vegTotals.protein)}g P`
    });

    const tFast = analyzeWeeklyGainRate(
        [
            { date: '2026-10-01', morningKg: 55.0 },
            { date: '2026-10-20', morningKg: 55.6 },
            { date: '2026-10-27', morningKg: 56.55 }
        ],
        false
    );
    const tSlow = analyzeWeeklyGainRate(
        [
            { date: '2026-10-01', morningKg: 56.0 },
            { date: '2026-10-08', morningKg: 56.1 },
            { date: '2026-10-15', morningKg: 56.2 }
        ],
        false
    );
    results.push({
        name: 'Gain Rate Rules (>0.7 kg/wk Warn & <0.2 kg/wk for 2 Wks -> +300 kcal)',
        passed:
            tFast.status === 'FAST_GAIN_WARNING' &&
            tSlow.status === 'PLATEAU_SUGGESTION' &&
            tSlow.calorieAdjustment === 300,
        expected: 'FAST_GAIN_WARNING & PLATEAU_SUGGESTION (+300 kcal)',
        actual: `${tFast.status} & ${tSlow.status} (+${tSlow.calorieAdjustment} kcal)`
    });

    const mockDiscipline = {
        '2026-11-18': { date: '2026-11-18', status: 'clean', noPorn: true, noFap: true, urgeLevel: 4 },
        '2026-11-19': { date: '2026-11-19', status: 'clean', noPorn: true, noFap: true, urgeLevel: 3 },
        '2026-11-20': { date: '2026-11-20', status: 'relapse', noPorn: false, noFap: false, urgeLevel: 8 },
        '2026-11-21': { date: '2026-11-21', status: 'clean', noPorn: true, noFap: true, urgeLevel: 2 },
        '2026-11-22': { date: '2026-11-22', status: 'clean', noPorn: true, noFap: true, urgeLevel: 1 }
    };
    const tDisc = analyzeDisciplineProgress(mockDiscipline, [], '2026-11-22');
    results.push({
        name: 'Clean Discipline Engine (Streak, Best Streak & Clean Rate %)',
        passed:
            tDisc.currentStreak === 2 &&
            tDisc.bestStreak === 2 &&
            tDisc.totalCleanDays === 4 &&
            tDisc.cleanRatePct === 80,
        expected: 'current: 2d, best: 2d, clean: 4, rate: 80%',
        actual: `current: ${tDisc.currentStreak}d, best: ${tDisc.bestStreak}d, clean: ${tDisc.totalCleanDays}, rate: ${tDisc.cleanRatePct}%`
    });

    return results;
}

// ============================================================================
// SECTION 6: INITIAL STATE & SERVER HYDRATION MERGER
// ============================================================================

const DEFAULT_PROFILE = {
    age: 0,
    heightCm: 0,
    startWeightKg: 0,
    currentWeightKg: 0,
    goalWeightMinKg: 65,
    goalWeightMaxKg: 68,
    dietTrack: 'non-veg',
    targetCalories: 2900,
    targetProteinG: 130,
    targetCarbsG: 370,
    targetFatG: 95,
    targetWaterMl: 3500,
    targetSleepHours: 7.5
};

const VTAPER_SVG_RAW = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512" fill="none">
  <rect width="512" height="512" rx="112" fill="#0A0A0B" />
  <rect x="16" y="16" width="480" height="480" rx="96" stroke="#27272A" stroke-width="14" />
  <rect x="76" y="116" width="360" height="20" rx="6" fill="#27272A" />
  <rect x="92" y="96" width="24" height="60" rx="6" fill="#CCFF00" />
  <rect x="396" y="96" width="24" height="60" rx="6" fill="#CCFF00" />
  <path d="M88 156H188L256 348L324 156H424L292 428H220L88 156Z" fill="#CCFF00" />
  <polygon points="208,156 304,156 256,284" fill="#27272A" />
  <rect x="212" y="444" width="88" height="12" rx="6" fill="#27272A" />
</svg>`;

const STORAGE_KEY = 'vtaper_tracker_state_v5';

function buildInitialActiveDrafts(
    lastLogs = {},
    rampInEnabled = true,
    customSteps = {},
    variantChoices = {}
) {
    const drafts = {};
    WORKOUT_PLAN.forEach((day) => {
        day.exercises.forEach((ex) => {
            const targetSets = rampInEnabled ? Math.min(SCIENCE_RULES.RAMP_IN_SETS, ex.sets) : ex.sets;
            const prev = lastLogs[ex.id] || [];
            const activeVar = variantChoices[ex.id] || ex.flags?.variants?.[0]?.id || null;
            const overload = calculateProgressiveOverload(ex, prev, customSteps, activeVar);
            drafts[ex.id] = Array.from({ length: ex.sets }, (_, idx) => {
                const prevSet = prev[idx] || prev[prev.length - 1] || null;
                return {
                    setNumber: idx + 1,
                    weight: prevSet
                        ? overload.shouldIncrease
                            ? overload.suggestedWeightKg
                            : prevSet.weight
                        : 0,
                    reps: prevSet ? (overload.shouldIncrease ? ex.repMin : prevSet.reps) : 0,
                    completed: false,
                    hiddenInRampIn: idx >= targetSets
                };
            });
        });
    });
    return drafts;
}

function getFreshInitialState(theme = 'dark') {
    const defaultTrack = DEFAULT_PROFILE.dietTrack;
    return {
        onboarded: false,
        dayStamp: getLocalDateStr(),
        theme,
        unit: 'kg',
        rampInEnabled: true,
        profile: { ...DEFAULT_PROFILE },
        customSteps: {},
        variantChoices: { 'thu-5': 'dips' },
        swappedAlternatives: {},
        lastSessionLogs: {},
        lastSessionMetaByExercise: {},
        activeDrafts: buildInitialActiveDrafts({}, true, {}, { 'thu-5': 'dips' }),
        foodDatabase: INITIAL_FOOD_DATABASE,
        selectedMealOptions: getDefaultSelectedMealsForTrack(defaultTrack),
        completedMealSlots: {},
        loggedAppetiteHelpers: [],
        waterMl: 0,
        sleepHours: 0,
        sundayWalkDone: false,
        workoutStreak: 0,
        weightLogs: [],
        measurements: [],
        workoutHistory: [],
        exerciseHistory: {},
        dailyLogs: {},
        cardioLogs: [],
        pelvicSide: 'right',
        pelvicLogs: [],
        pelvicHabits: {},
        disciplineLogs: {},
        urgeLogs: []
    };
}

function hydrateMergedState(rawState) {
    const base = getFreshInitialState(rawState?.theme || 'dark');
    if (!rawState || typeof rawState !== 'object') return base;

    const { name: _legacyName, ...savedProfile } = rawState.profile || {};
    const mergedProfile = { ...DEFAULT_PROFILE, ...savedProfile };
    const trackDefaults = getDefaultSelectedMealsForTrack(mergedProfile.dietTrack);
    const selectedMeals =
        rawState.selectedMealOptions && Object.keys(rawState.selectedMealOptions).length > 0
            ? { ...trackDefaults, ...rawState.selectedMealOptions }
            : trackDefaults;

    const lastLogs = rawState.lastSessionLogs || {};
    const rampIn = rawState.rampInEnabled ?? true;
    const customSteps = rawState.customSteps || {};
    const variantChoices = { 'thu-5': 'dips', ...(rawState.variantChoices || {}) };

    const builtDrafts = buildInitialActiveDrafts(lastLogs, rampIn, customSteps, variantChoices);
    const mergedDrafts = { ...builtDrafts };
    if (rawState.activeDrafts && typeof rawState.activeDrafts === 'object') {
        Object.entries(rawState.activeDrafts).forEach(([exId, sets]) => {
            if (Array.isArray(sets) && sets.length > 0) {
                mergedDrafts[exId] = sets;
            }
        });
    }

    return {
        ...base,
        ...rawState,
        profile: mergedProfile,
        foodDatabase: rawState.foodDatabase?.length ? rawState.foodDatabase : INITIAL_FOOD_DATABASE,
        selectedMealOptions: selectedMeals,
        variantChoices,
        lastSessionLogs: lastLogs,
        activeDrafts: mergedDrafts,
        dailyLogs: rawState.dailyLogs || {}
    };
}

function hasAnyLocalProgress(state) {
    if (!state || typeof state !== 'object') return false;
    return (
        Boolean(state.onboarded) ||
        (state.workoutHistory?.length || 0) > 0 ||
        (state.weightLogs?.length || 0) > 0 ||
        (state.measurements?.length || 0) > 0 ||
        Object.keys(state.disciplineLogs || {}).length > 0 ||
        (state.cardioLogs?.length || 0) > 0 ||
        (state.pelvicLogs?.length || 0) > 0
    );
}

// ============================================================================
// SECTION 7: MODERN EDITORIAL CHARTS & SHARED BRANDING COMPONENTS
// ============================================================================

function BrandLogo({ size = 40, isDark = true, colors }) {
    const bgFill = isDark ? '#000000' : '#FFFFFF';
    const barFill = isDark ? '#ffffff' : '#000000';
    const cutoutFill = isDark ? '#FFFFFF' : '#000000';
    const accentFill = colors?.accent || (isDark ? '#CCFF00' : '#0059FF');

    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 512 512"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-label="VTaper Logo"
            className="vt-brand-logo"
        >
            <rect width="512" height="512" rx="112" fill={bgFill} />
            <rect x="76" y="116" width="360" height="20" rx="6" fill={barFill} />
            <rect x="92" y="96" width="24" height="60" rx="6" fill={accentFill} />
            <rect x="396" y="96" width="24" height="60" rx="6" fill={accentFill} />
            <path d="M88 156H188L256 348L324 156H424L292 428H220L88 156Z" fill={accentFill} />
            <polygon points="208,156 304,156 256,284" fill={cutoutFill} />
            <rect x="212" y="444" width="88" height="12" rx="6" fill={barFill} />
        </svg>
    );
}

function ModernChartTooltip({ active, payload, label, colors, suffixMap = {} }) {
    if (!active || !payload || !payload.length) return null;
    return (
        <div
            style={{
                backgroundColor: colors.card,
                border: `1px solid ${colors.border}`,
                borderRadius: 12,
                padding: '10px 12px',
                minWidth: 156,
                color: colors.text
            }}
        >
            <div
                className="font-mono-num"
                style={{
                    fontSize: 10,
                    fontWeight: 800,
                    letterSpacing: '0.06em',
                    textTransform: 'uppercase',
                    color: colors.muted,
                    marginBottom: 6,
                    paddingBottom: 5,
                    borderBottom: `1px solid ${colors.border}`
                }}
            >
                {label}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                {payload
                    .filter((item) => item.value !== null && item.value !== undefined)
                    .map((item, idx) => (
                        <div
                            key={`${item.dataKey}-${idx}`}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                gap: 14,
                                fontSize: 12
                            }}
                        >
                            <span style={{ display: 'flex', alignItems: 'center', gap: 6, color: colors.muted }}>
                                <span
                                    style={{
                                        width: 8,
                                        height: 8,
                                        borderRadius: '50%',
                                        backgroundColor: item.color || colors.accent,
                                        flexShrink: 0
                                    }}
                                />
                                <span>{item.name}</span>
                            </span>
                            <span className="font-mono-num" style={{ fontWeight: 800, color: colors.text }}>
                                {item.value}
                                {suffixMap[item.dataKey] ? ` ${suffixMap[item.dataKey]}` : ''}
                            </span>
                        </div>
                    ))}
            </div>
        </div>
    );
}

function Ring({ value, max, size = 92, stroke = 10, color, track, label, sub }) {
    const r = (size - stroke) / 2;
    const c = 2 * Math.PI * r;
    const pct = Math.min(1, max > 0 ? value / max : 0);

    return (
        <div className="vt-ring-wrap" style={{ width: size, height: size }}>
            <svg width={size} height={size} className="vt-ring-svg">
                <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={track} strokeWidth={stroke} />
                <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={r}
                    fill="none"
                    stroke={color}
                    strokeWidth={stroke}
                    strokeLinecap="round"
                    strokeDasharray={c}
                    strokeDashoffset={c * (1 - pct)}
                    style={{ transition: 'stroke-dashoffset .6s ease' }}
                />
            </svg>
            <div className="vt-ring-center">
                <span className="vt-ring-label font-display">{label}</span>
                <span className="vt-ring-sub">{sub}</span>
            </div>
        </div>
    );
}

function VTaperGauge({ ratio, colors, isDark }) {
    const MIN = 1.0,
        MAX = 1.7,
        cx = 110,
        cy = 108,
        r = 88;
    const ang = (v) => Math.PI * (1 - (Math.min(MAX, Math.max(MIN, v)) - MIN) / (MAX - MIN));
    const pt = (v, rad = r) => [cx + rad * Math.cos(ang(v)), cy - rad * Math.sin(ang(v))];
    const arc = (a, b) => {
        const [x1, y1] = pt(a),
            [x2, y2] = pt(b);
        return `M${x1} ${y1} A${r} ${r} 0 0 1 ${x2} ${y2}`;
    };
    const [nx, ny] = ratio ? pt(ratio, r - 20) : pt(MIN, r - 20);
    const hot = isDark ? colors.accent : colors.text;

    return (
        <div
            style={{ backgroundColor: colors.card, borderColor: colors.border }}
            className="vt-card vt-gauge-card"
        >
            <div className="vt-gauge-title" style={{ color: colors.muted }}>
                V-Taper Gauge
            </div>
            <svg viewBox="0 0 220 130" className="vt-gauge-svg">
                <path d={arc(MIN, MAX)} fill="none" stroke={colors.elevated} strokeWidth="14" strokeLinecap="round" />
                <path d={arc(1.4, 1.5)} fill="none" stroke={colors.accent} strokeWidth="14" />
                <line x1={cx} y1={cy} x2={nx} y2={ny} stroke={colors.text} strokeWidth="3" strokeLinecap="round" />
                <circle cx={cx} cy={cy} r="6" fill={colors.text} />
                <text x="14" y="126" fontSize="10" fill={colors.muted}>
                    1.0
                </text>
                <text x="190" y="126" fontSize="10" fill={colors.muted}>
                    1.7
                </text>
                <text
                    x={cx}
                    y="94"
                    textAnchor="middle"
                    fontSize="26"
                    fontWeight="900"
                    fill={hot}
                    className="font-display"
                >
                    {ratio ? `${ratio.toFixed(2)}x` : '0.00x'}
                </text>
            </svg>
            <div className="vt-gauge-sub" style={{ color: colors.muted }}>
                Goal band 1.40–1.50x
            </div>
        </div>
    );
}

function RebootRadialGauge({ pct, currentStreak, colors, isDark }) {
    const data = [{ name: '90-Day Reboot', value: Math.max(0, Math.min(100, pct)) }];
    const strokeCol = isDark ? colors.accent : '#0059ff';

    return (
        <div
            style={{ backgroundColor: colors.card, borderColor: colors.border }}
            className="vt-card vt-p-card vt-col-between"
        >
            <div>
                <div className="vt-text-10 vt-font-extrabold vt-uppercase" style={{ color: colors.muted }}>
                    90-Day Neural Reboot
                </div>
                <h3 className="font-display vt-text-2xl vt-font-black vt-uppercase">
                    Rewiring Progress
                </h3>
            </div>

            <div style={{ width: '100%', height: 185, position: 'relative' }}>
                <ResponsiveContainer width="100%" height="100%">
                    <RadialBarChart
                        cx="50%"
                        cy="56%"
                        innerRadius="68%"
                        outerRadius="96%"
                        barSize={14}
                        data={data}
                        startAngle={215}
                        endAngle={-35}
                    >
                        <RadialPolarAngleAxis type="number" domain={[0, 100]} angleAxisId={0} tick={false} />
                        <RadialBar
                            background={{ fill: colors.elevated }}
                            dataKey="value"
                            cornerRadius={10}
                            fill={strokeCol}
                        />
                    </RadialBarChart>
                </ResponsiveContainer>
                <div
                    style={{
                        position: 'absolute',
                        inset: 0,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        paddingTop: 14,
                        pointerEvents: 'none'
                    }}
                >
                    <span
                        className="font-display"
                        style={{
                            fontSize: 34,
                            fontWeight: 900,
                            lineHeight: 1,
                            color: isDark ? colors.accent : colors.text
                        }}
                    >
                        {pct}%
                    </span>
                    <span className="font-mono-num" style={{ fontSize: 11, color: colors.muted, marginTop: 4 }}>
                        {currentStreak} / {SCIENCE_RULES.REBOOT_TARGET_DAYS} Days
                    </span>
                </div>
            </div>

            <div className="vt-between-center vt-text-11 font-mono-num" style={{ color: colors.muted }}>
                <span>Start: Day 0</span>
                <span>Target: 90 Clean Days</span>
            </div>
        </div>
    );
}

function MuscleRadar({ colors, isDark }) {
    const { primary } = useMemo(() => computeWeeklyMuscleVolumes(), []);
    const data = Object.entries(primary).map(([g, v]) => ({ g, v, t: 12 }));

    return (
        <div
            style={{ backgroundColor: colors.card, borderColor: colors.border }}
            className="vt-card vt-p-card"
        >
            <h3 className="vt-section-title font-display">Muscle Balance Radar</h3>
            <p className="vt-radar-sub" style={{ color: colors.muted }}>
                Direct weekly sets ({TOTAL_WEEKLY_PRIMARY_SETS} total) vs 12-set hypertrophy ring
            </p>
            <div className="vt-radar-chart">
                <ResponsiveContainer width="100%" height="100%">
                    <RadarChart data={data} outerRadius="72%">
                        <PolarGrid stroke={colors.border} />
                        <PolarAngleAxis dataKey="g" tick={{ fill: colors.muted, fontSize: 10 }} />
                        <Tooltip content={<ModernChartTooltip colors={colors} suffixMap={{ v: 'sets', t: 'sets' }} />} />
                        <Radar
                            name="Target Ring"
                            dataKey="t"
                            stroke={colors.muted}
                            fill="none"
                            strokeDasharray="4 4"
                        />
                        <Radar
                            name="Prescribed Sets"
                            dataKey="v"
                            stroke={isDark ? colors.accent : '#0059ff'}
                            fill={colors.accent}
                            fillOpacity={0.28}
                            strokeWidth={2.5}
                        />
                    </RadarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}

function ProgressCharts({ appState, formatWeight, colors, isDark }) {
    const hist = appState.workoutHistory || [];
    const weightLogs = appState.weightLogs || [];

    const primaryStroke = isDark ? colors.accent : '#0059ff';
    const secondaryStroke = '#FF7A1A';
    const weightOnlyColor = isDark ? '#38BDF8' : '#0EA5E9';

    const heatmapData = useMemo(() => {
        const workoutMap = {};
        hist.forEach((h) => {
            workoutMap[h.date] = (workoutMap[h.date] || 0) + 1;
        });

        const weightMap = {};
        weightLogs.forEach((w) => {
            weightMap[w.date] = w;
        });

        const today = getLocalDateStr();
        const days = Array.from({ length: 28 }, (_, i) => {
            const dateStr = addDaysToDateStr(today, -(27 - i));
            const hasWorkout = Boolean(workoutMap[dateStr]);
            const hasWeight = Boolean(weightMap[dateStr]);
            return {
                date: dateStr,
                shortDate: dateStr.slice(5),
                hasWorkout,
                hasWeight,
                workoutCount: workoutMap[dateStr] || 0
            };
        });

        const activeWorkoutDays = days.filter((d) => d.hasWorkout).length;
        const activeWeightDays = days.filter((d) => d.hasWeight).length;
        const gymConsistencyPct = Math.min(100, Math.round((activeWorkoutDays / 24) * 100));

        return { days, activeWorkoutDays, activeWeightDays, gymConsistencyPct };
    }, [hist, weightLogs]);

    const [volumeRange, setVolumeRange] = useState(10);
    const volumeAnalytics = useMemo(() => {
        const sliced = hist.slice(0, volumeRange).reverse();
        const chart = sliced.map((h) => ({
            d: h.date.slice(5),
            title: h.dayTitle || 'Session',
            v: Math.round(formatWeight(h.totalVolumeKg)),
            sets: h.setsCompleted || 0,
            prs: h.prsCount || 0
        }));

        const avgVol = chart.length
            ? Math.round(chart.reduce((acc, item) => acc + item.v, 0) / chart.length)
            : 0;
        const peakVol = chart.length ? Math.max(...chart.map((item) => item.v)) : 0;

        return { chart, avgVol, peakVol };
    }, [hist, volumeRange, formatWeight]);

    const exList = useMemo(
        () =>
            WORKOUT_PLAN.flatMap((d) => d.exercises).filter(
                (e) => (appState.exerciseHistory?.[e.id] || []).length > 0
            ),
        [appState.exerciseHistory]
    );

    const [exId, setExId] = useState(null);
    const [showE1rm, setShowE1rm] = useState(true);
    const sel = exList.find((e) => e.id === exId) || exList[0];

    const strengthAnalytics = useMemo(() => {
        const rawHist = appState.exerciseHistory?.[sel?.id] || [];
        const isAssisted = Boolean(sel?.flags?.assisted);

        const chart = rawHist.map((h) => {
            const topKg = Number(h.topWeightKg || 0);
            const reps = Number(h.bestReps || 1);
            const e1rmKg =
                !isAssisted && topKg > 0 && reps > 1
                    ? Number((topKg * (1 + reps / 30)).toFixed(2))
                    : topKg;

            return {
                d: h.date.slice(5),
                w: formatWeight(topKg),
                e1rm: formatWeight(e1rmKg),
                reps,
                vol: Math.round(formatWeight(h.volumeKg || 0))
            };
        });

        if (chart.length === 0) {
            return { chart: [], bestWeight: 0, bestE1rm: 0, delta: 0, isAssisted };
        }

        const bestWeight = isAssisted
            ? Math.min(...chart.map((c) => c.w))
            : Math.max(...chart.map((c) => c.w));
        const bestE1rm = Math.max(...chart.map((c) => c.e1rm));
        const firstW = chart[0].w;
        const lastW = chart[chart.length - 1].w;
        const delta = Number((isAssisted ? firstW - lastW : lastW - firstW).toFixed(1));

        return { chart, bestWeight, bestE1rm, delta, isAssisted };
    }, [appState.exerciseHistory, sel, formatWeight]);

    const card = { backgroundColor: colors.card, borderColor: colors.border };

    return (
        <div className="vt-stack-4">
            <div style={card} className="vt-card vt-p-card vt-stack-3">
                <div className="vt-between-center vt-flex-wrap vt-gap-2">
                    <div>
                        <h3 className="vt-section-title font-display">Last 28 Days Consistency</h3>
                        <p className="vt-text-xs" style={{ color: colors.muted }}>
                            Gym sessions ({heatmapData.activeWorkoutDays}/24 target • {heatmapData.gymConsistencyPct}%) & Weight check-ins ({heatmapData.activeWeightDays}/28 days)
                        </p>
                    </div>

                    <div className="vt-row-wrap vt-gap-3 vt-text-11 vt-font-bold">
                        <span className="vt-flex vt-items-center vt-gap-1-5">
                            <span className="vt-legend-dot" style={{ backgroundColor: colors.accent }} />
                            Gym Workout
                        </span>
                        <span className="vt-flex vt-items-center vt-gap-1-5">
                            <span className="vt-legend-dot" style={{ backgroundColor: weightOnlyColor }} />
                            Weight Logged Only
                        </span>
                    </div>
                </div>

                <div className="vt-heatmap-grid">
                    {heatmapData.days.map((d) => {
                        const bg = d.hasWorkout
                            ? colors.accent
                            : d.hasWeight
                                ? weightOnlyColor
                                : colors.elevated;
                        const statusText =
                            d.hasWorkout && d.hasWeight
                                ? 'Workout + Weight Logged'
                                : d.hasWorkout
                                    ? 'Workout Completed'
                                    : d.hasWeight
                                        ? 'Weight Logged (Rest/Cardio)'
                                        : 'No Log';

                        return (
                            <div
                                key={d.date}
                                title={`${d.date}: ${statusText}`}
                                style={{ backgroundColor: bg }}
                                className="vt-heatmap-cell"
                            />
                        );
                    })}
                </div>
            </div>

            <div style={card} className="vt-card vt-p-card vt-stack-3">
                <div className="vt-between-center vt-flex-wrap vt-gap-2">
                    <div>
                        <h3 className="vt-section-title font-display">
                            Session Volume & Sets ({appState.unit})
                        </h3>
                        {volumeAnalytics.chart.length > 0 && (
                            <p className="vt-text-11 font-mono-num" style={{ color: colors.muted }}>
                                Avg: <strong style={{ color: colors.text }}>{volumeAnalytics.avgVol} {appState.unit}</strong> • Peak:{' '}
                                <strong style={{ color: primaryStroke }}>{volumeAnalytics.peakVol} {appState.unit}</strong>
                            </p>
                        )}
                    </div>

                    <div className="vt-flex vt-items-center vt-gap-1-5">
                        {[10, 20].map((n) => (
                            <button
                                key={n}
                                type="button"
                                onClick={() => setVolumeRange(n)}
                                style={{
                                    backgroundColor: volumeRange === n ? colors.accent : colors.elevated,
                                    color: volumeRange === n ? colors.accentText : colors.text,
                                    borderColor: volumeRange === n ? colors.accentBorder : colors.border
                                }}
                                className="vt-btn vt-h-32 vt-px-2-5 vt-rounded-lg vt-border vt-text-10 vt-font-extrabold vt-uppercase"
                            >
                                Last {n}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="vt-chart-box-sm">
                    {volumeAnalytics.chart.length ? (
                        <ResponsiveContainer width="100%" height="100%">
                            <ComposedChart
                                data={volumeAnalytics.chart}
                                margin={{ top: 12, right: 12, left: -12, bottom: 0 }}
                            >
                                <defs>
                                    <linearGradient id="vtVolBarGrad" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="0%" stopColor={primaryStroke} stopOpacity={0.95} />
                                        <stop offset="100%" stopColor={primaryStroke} stopOpacity={0.28} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid stroke={colors.border} strokeDasharray="3 3" vertical={false} />
                                <XAxis dataKey="d" stroke={colors.muted} fontSize={10} tickLine={false} axisLine={false} />
                                <YAxis yAxisId="left" stroke={colors.muted} fontSize={10} tickLine={false} axisLine={false} />
                                <YAxis yAxisId="right" orientation="right" stroke={colors.muted} fontSize={10} tickLine={false} axisLine={false} />
                                <Tooltip
                                    content={
                                        <ModernChartTooltip
                                            colors={colors}
                                            suffixMap={{ v: appState.unit, sets: 'sets' }}
                                        />
                                    }
                                />
                                {volumeAnalytics.avgVol > 0 && (
                                    <ReferenceLine
                                        yAxisId="left"
                                        y={volumeAnalytics.avgVol}
                                        stroke={secondaryStroke}
                                        strokeDasharray="4 4"
                                    />
                                )}
                                <Bar
                                    yAxisId="left"
                                    dataKey="v"
                                    name="Volume"
                                    fill="url(#vtVolBarGrad)"
                                    radius={[8, 8, 2, 2]}
                                    maxBarSize={36}
                                />
                                <Line
                                    yAxisId="right"
                                    type="monotone"
                                    dataKey="sets"
                                    name="Sets Done"
                                    stroke={secondaryStroke}
                                    strokeWidth={2.5}
                                    dot={{ r: 3.5, fill: secondaryStroke, stroke: colors.card, strokeWidth: 1.5 }}
                                />
                            </ComposedChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="vt-chart-empty" style={{ color: colors.muted }}>
                            0 workouts logged yet — finish your first session in Today tab to unlock volume & set progression.
                        </div>
                    )}
                </div>
            </div>

            <div style={card} className="vt-card vt-p-card vt-stack-3">
                <div className="vt-between-center vt-flex-wrap vt-gap-2">
                    <div>
                        <h3 className="vt-section-title font-display">Strength & Estimated 1RM Curve</h3>
                        {strengthAnalytics.chart.length > 0 && (
                            <div className="vt-row-wrap vt-gap-2 vt-text-11 font-mono-num vt-mt-0-5" style={{ color: colors.muted }}>
                                <span>
                                    Best:{' '}
                                    <strong style={{ color: colors.text }}>
                                        {strengthAnalytics.bestWeight} {appState.unit}
                                    </strong>
                                </span>
                                {!strengthAnalytics.isAssisted && (
                                    <span>
                                        • Peak e1RM:{' '}
                                        <strong style={{ color: secondaryStroke }}>
                                            {strengthAnalytics.bestE1rm} {appState.unit}
                                        </strong>
                                    </span>
                                )}
                                <span>
                                    • Gain:{' '}
                                    <strong style={{ color: strengthAnalytics.delta >= 0 ? primaryStroke : colors.danger }}>
                                        {strengthAnalytics.delta >= 0 ? '+' : ''}
                                        {strengthAnalytics.delta} {appState.unit}
                                    </strong>
                                </span>
                            </div>
                        )}
                    </div>

                    <div className="vt-row-wrap vt-gap-1-5">
                        {!strengthAnalytics.isAssisted && exList.length > 0 && (
                            <button
                                type="button"
                                onClick={() => setShowE1rm((prev) => !prev)}
                                style={{
                                    backgroundColor: showE1rm ? colors.accentSurface : colors.elevated,
                                    color: colors.text,
                                    borderColor: showE1rm ? colors.accentBorder : colors.border
                                }}
                                className="vt-btn vt-h-34 vt-px-2-5 vt-rounded-lg vt-border vt-text-10 vt-font-extrabold vt-uppercase"
                            >
                                {showE1rm ? 'e1RM: ON' : 'e1RM: OFF'}
                            </button>
                        )}

                        {exList.length > 0 && (
                            <select
                                value={sel?.id || ''}
                                onChange={(e) => setExId(e.target.value)}
                                style={{
                                    backgroundColor: colors.elevated,
                                    borderColor: colors.border,
                                    color: colors.text
                                }}
                                className="vt-select-compact"
                            >
                                {exList.map((e) => (
                                    <option key={e.id} value={e.id}>
                                        {e.name}
                                    </option>
                                ))}
                            </select>
                        )}
                    </div>
                </div>

                <div className="vt-chart-box-md">
                    {strengthAnalytics.chart.length ? (
                        <ResponsiveContainer width="100%" height="100%">
                            <ComposedChart
                                data={strengthAnalytics.chart}
                                margin={{ top: 12, right: 12, left: -12, bottom: 0 }}
                            >
                                <defs>
                                    <linearGradient id="vtStrengthAreaGrad" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="0%" stopColor={primaryStroke} stopOpacity={0.34} />
                                        <stop offset="100%" stopColor={primaryStroke} stopOpacity={0.02} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid stroke={colors.border} strokeDasharray="3 3" vertical={false} />
                                <XAxis dataKey="d" stroke={colors.muted} fontSize={10} tickLine={false} axisLine={false} />
                                <YAxis
                                    stroke={colors.muted}
                                    fontSize={10}
                                    tickLine={false}
                                    axisLine={false}
                                    domain={['dataMin - 2', 'dataMax + 3']}
                                />
                                <Tooltip
                                    content={
                                        <ModernChartTooltip
                                            colors={colors}
                                            suffixMap={{ w: appState.unit, e1rm: appState.unit }}
                                        />
                                    }
                                />
                                <Area
                                    type="monotone"
                                    dataKey="w"
                                    name="Top Set"
                                    stroke={primaryStroke}
                                    strokeWidth={3}
                                    fill="url(#vtStrengthAreaGrad)"
                                    dot={{ r: 4, fill: primaryStroke, stroke: colors.card, strokeWidth: 2 }}
                                    activeDot={{ r: 6.5, fill: primaryStroke, stroke: colors.text, strokeWidth: 2 }}
                                />
                                {showE1rm && !strengthAnalytics.isAssisted && (
                                    <Line
                                        type="monotone"
                                        dataKey="e1rm"
                                        name="Est. 1RM"
                                        stroke={secondaryStroke}
                                        strokeWidth={2.4}
                                        strokeDasharray="5 4"
                                        dot={{ r: 3.5, fill: secondaryStroke, stroke: colors.card, strokeWidth: 1.5 }}
                                    />
                                )}
                            </ComposedChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="vt-chart-empty" style={{ color: colors.muted }}>
                            0 strength logs yet — log workouts to plot top-set weight & estimated 1RM progression.
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

// ============================================================================
// END OF PART 1 — REPLY "OK" FOR PART 2 (Main App + Cloud Sync + Today Recall + Discipline)
// ============================================================================

// ============================================================================
// SECTION 8: MAIN APPLICATION COMPONENT (POSTGRESQL SYNC + FULL STATE ENGINE)
// ============================================================================

export default function App() {
    useEffect(() => {
        const fontId = 'vtaper-google-fonts';
        if (!document.getElementById(fontId)) {
            const link = document.createElement('link');
            link.id = fontId;
            link.rel = 'stylesheet';
            link.href =
                'https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@700;800;900&family=JetBrains+Mono:wght@600;700&family=Sora:wght@400;500;600;700;800&display=swap';
            document.head.appendChild(link);
        }
    }, []);

    // Instant offline cache hydration while PostgreSQL bootstrap loads
    const [appState, setAppState] = useState(() => {
        try {
            const saved = localStorage.getItem(STORAGE_KEY);
            if (saved) {
                return hydrateMergedState(JSON.parse(saved));
            }
        } catch {
            // Ignore localStorage read errors
        }
        return getFreshInitialState();
    });

    // Cloud Sync State
    const [syncStatus, setSyncStatus] = useState('loading'); // 'loading' | 'synced' | 'syncing' | 'offline'
    const [lastSyncedAt, setLastSyncedAt] = useState(null);
    const [syncErrorMsg, setSyncErrorMsg] = useState('');
    const [localMigrationCandidate, setLocalMigrationCandidate] = useState(null);
    const [overviewRefreshKey, setOverviewRefreshKey] = useState(0);

    // Prevent debounced effects from firing before initial PostgreSQL load completes
    const serverReadyRef = useRef(false);
    const skipNextConfigSyncRef = useRef(true);
    const skipNextDailySyncRef = useRef(true);
    const configTimerRef = useRef(null);
    const dailyTimerRef = useRef(null);

    const [activeTab, setActiveTab] = useState('today');
    const currentWeekdayIndex = useMemo(() => new Date().getDay(), []);
    const [selectedDayIndex, setSelectedDayIndex] = useState(currentWeekdayIndex);

    // Exact Workout Day Recall (from PostgreSQL `ExerciseLog` & `WorkoutSession`)
    const [dayRecall, setDayRecall] = useState(null);
    const [recallLoading, setRecallLoading] = useState(false);

    const [showOnboarding, setShowOnboarding] = useState(false);
    const [onboardingForm, setOnboardingForm] = useState(appState.profile);

    const [workoutRunning, setWorkoutRunning] = useState(false);
    const [workoutElapsedSec, setWorkoutElapsedSec] = useState(0);
    const [savingWorkout, setSavingWorkout] = useState(false);

    const [restTimer, setRestTimer] = useState({
        active: false,
        paused: false,
        remainingSec: 0,
        totalSec: 120,
        exerciseName: '',
        exerciseType: 'compound'
    });

    const [workoutSummary, setWorkoutSummary] = useState(null);
    const [toast, setToast] = useState(null);

    const showToast = useCallback((message) => {
        setToast(message);
        setTimeout(() => {
            setToast((prev) => (prev === message ? null : prev));
        }, 3400);
    }, []);

    const bumpOverview = useCallback(() => {
        setOverviewRefreshKey((k) => k + 1);
    }, []);

    // Helper: Fetch fresh state from PostgreSQL backend
    const loadFromBackend = useCallback(
        async (silent = false) => {
            setSyncStatus((prev) => (prev === 'loading' ? 'loading' : 'syncing'));
            setSyncErrorMsg('');
            try {
                const res = await vtaperApi.bootstrap();
                const mergedServerState = hydrateMergedState(res.state);

                // Check if old localStorage has progress while PostgreSQL is completely fresh
                let cachedLocal = null;
                try {
                    const rawLocal = localStorage.getItem(STORAGE_KEY);
                    if (rawLocal) cachedLocal = JSON.parse(rawLocal);
                } catch {
                    cachedLocal = null;
                }

                if (!hasAnyLocalProgress(mergedServerState) && hasAnyLocalProgress(cachedLocal)) {
                    setLocalMigrationCandidate(cachedLocal);
                } else {
                    setLocalMigrationCandidate(null);
                }

                skipNextConfigSyncRef.current = true;
                skipNextDailySyncRef.current = true;
                setAppState(mergedServerState);
                setOnboardingForm(mergedServerState.profile);
                setShowOnboarding(!mergedServerState.onboarded);
                serverReadyRef.current = true;
                setSyncStatus('synced');
                setLastSyncedAt(res.syncedAt || new Date().toISOString());
                bumpOverview();
                if (!silent) {
                    showToast('Synced with PostgreSQL database!');
                }
            } catch (err) {
                serverReadyRef.current = true;
                setSyncStatus('offline');
                setSyncErrorMsg(err.message || 'Backend unreachable');
                setShowOnboarding((prev) => prev || !appState.onboarded);
                if (!silent) {
                    showToast(`Offline mode: ${err.message || 'Backend se connect nahi ho paya'}`);
                }
            }
        },
        [bumpOverview, showToast]
    );

    // Bootstrap from PostgreSQL on app mount
    useEffect(() => {
        loadFromBackend(true);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Keep localStorage mirrored purely as fast offline cache
    useEffect(() => {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(appState));
        } catch {
            // Ignore quota errors
        }
    }, [appState]);

    // Fetch Exact Workout Day Recall whenever selectedDayIndex changes
    const fetchDayRecall = useCallback(async (dayIdx) => {
        if (dayIdx === 0) {
            setDayRecall(null);
            return;
        }
        setRecallLoading(true);
        try {
            const res = await vtaperApi.getWorkoutRecall(dayIdx);
            setDayRecall(res);
        } catch {
            setDayRecall(null);
        } finally {
            setRecallLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchDayRecall(selectedDayIndex);
    }, [selectedDayIndex, fetchDayRecall]);

    // Debounced auto-sync for UserConfig & live activeDrafts -> PUT /api/config
    const configSyncSignature = useMemo(
        () =>
            JSON.stringify({
                onboarded: appState.onboarded,
                dayStamp: appState.dayStamp,
                theme: appState.theme,
                unit: appState.unit,
                rampInEnabled: appState.rampInEnabled,
                pelvicSide: appState.pelvicSide,
                workoutStreak: appState.workoutStreak,
                profile: appState.profile,
                customSteps: appState.customSteps,
                variantChoices: appState.variantChoices,
                swappedAlternatives: appState.swappedAlternatives,
                selectedMealOptions: appState.selectedMealOptions,
                activeDrafts: appState.activeDrafts
            }),
        [
            appState.onboarded,
            appState.dayStamp,
            appState.theme,
            appState.unit,
            appState.rampInEnabled,
            appState.pelvicSide,
            appState.workoutStreak,
            appState.profile,
            appState.customSteps,
            appState.variantChoices,
            appState.swappedAlternatives,
            appState.selectedMealOptions,
            appState.activeDrafts
        ]
    );

    useEffect(() => {
        if (!serverReadyRef.current) return;
        if (skipNextConfigSyncRef.current) {
            skipNextConfigSyncRef.current = false;
            return;
        }

        if (configTimerRef.current) clearTimeout(configTimerRef.current);
        configTimerRef.current = setTimeout(async () => {
            try {
                setSyncStatus('syncing');
                const payload = JSON.parse(configSyncSignature);
                const res = await vtaperApi.updateConfig(payload);
                setSyncStatus('synced');
                setLastSyncedAt(res.updatedAt || new Date().toISOString());
                setSyncErrorMsg('');
            } catch (err) {
                setSyncStatus('offline');
                setSyncErrorMsg(err.message || 'Config sync failed');
            }
        }, 700);

        return () => {
            if (configTimerRef.current) clearTimeout(configTimerRef.current);
        };
    }, [configSyncSignature]);

    // Computed Nutrition Totals for Today
    const nutritionTotals = useMemo(
        () => computeDayNutritionTotals(appState),
        [
            appState.selectedMealOptions,
            appState.completedMealSlots,
            appState.loggedAppetiteHelpers,
            appState.foodDatabase,
            appState.profile.dietTrack
        ]
    );

    // Debounced auto-sync for Today's DailyLog (Nutrition, Water, Sleep, Habits) -> PUT /api/daily/:date
    const dailySyncSignature = useMemo(
        () =>
            JSON.stringify({
                date: appState.dayStamp || getLocalDateStr(),
                kcal: nutritionTotals.consumedKcal,
                protein: nutritionTotals.consumedProtein,
                carbs: nutritionTotals.consumedCarbs,
                fat: nutritionTotals.consumedFat,
                proteinFeedings: nutritionTotals.proteinFeedingsCount,
                waterMl: appState.waterMl,
                sleepHours: appState.sleepHours,
                sundayWalkDone: appState.sundayWalkDone,
                selectedMealOptions: appState.selectedMealOptions,
                completedMealSlots: appState.completedMealSlots,
                loggedAppetiteHelpers: appState.loggedAppetiteHelpers,
                pelvicHabits: appState.pelvicHabits
            }),
        [
            appState.dayStamp,
            nutritionTotals.consumedKcal,
            nutritionTotals.consumedProtein,
            nutritionTotals.consumedCarbs,
            nutritionTotals.consumedFat,
            nutritionTotals.proteinFeedingsCount,
            appState.waterMl,
            appState.sleepHours,
            appState.sundayWalkDone,
            appState.selectedMealOptions,
            appState.completedMealSlots,
            appState.loggedAppetiteHelpers,
            appState.pelvicHabits
        ]
    );

    useEffect(() => {
        if (!serverReadyRef.current) return;
        if (skipNextDailySyncRef.current) {
            skipNextDailySyncRef.current = false;
            return;
        }

        if (dailyTimerRef.current) clearTimeout(dailyTimerRef.current);
        dailyTimerRef.current = setTimeout(async () => {
            try {
                const payload = JSON.parse(dailySyncSignature);
                const { date, ...body } = payload;

                // Keep local dailyLogs archive in sync too
                setAppState((prev) => ({
                    ...prev,
                    dailyLogs: {
                        ...(prev.dailyLogs || {}),
                        [date]: { date, ...body }
                    }
                }));

                setSyncStatus('syncing');
                await vtaperApi.saveDailyLog(date, body);
                setSyncStatus('synced');
                setLastSyncedAt(new Date().toISOString());
                setSyncErrorMsg('');
                bumpOverview();
            } catch (err) {
                setSyncStatus('offline');
                setSyncErrorMsg(err.message || 'Daily log sync failed');
            }
        }, 650);

        return () => {
            if (dailyTimerRef.current) clearTimeout(dailyTimerRef.current);
        };
    }, [dailySyncSignature, bumpOverview]);

    // Safe Midnight Rollover (archives yesterday into PostgreSQL before resetting today's checklists)
    useEffect(() => {
        const rollover = () => {
            const today = getLocalDateStr();
            setAppState((prev) => {
                if (prev.dayStamp === today) return prev;
                const oldDate = prev.dayStamp;
                const oldTotals = computeDayNutritionTotals(prev);
                const archivedYesterday = {
                    date: oldDate,
                    kcal: oldTotals.consumedKcal,
                    protein: oldTotals.consumedProtein,
                    carbs: oldTotals.consumedCarbs,
                    fat: oldTotals.consumedFat,
                    proteinFeedings: oldTotals.proteinFeedingsCount,
                    waterMl: prev.waterMl || 0,
                    sleepHours: prev.sleepHours || 0,
                    sundayWalkDone: Boolean(prev.sundayWalkDone),
                    selectedMealOptions: prev.selectedMealOptions || {},
                    completedMealSlots: prev.completedMealSlots || {},
                    loggedAppetiteHelpers: prev.loggedAppetiteHelpers || [],
                    pelvicHabits: prev.pelvicHabits || {}
                };

                if (oldDate) {
                    vtaperApi.saveDailyLog(oldDate, archivedYesterday).catch(() => {});
                }

                const drafts = Object.fromEntries(
                    Object.entries(prev.activeDrafts || {}).map(([id, sets]) => [
                        id,
                        sets.map((s) => ({ ...s, completed: false }))
                    ])
                );

                return {
                    ...prev,
                    dayStamp: today,
                    waterMl: 0,
                    sleepHours: 0,
                    sundayWalkDone: false,
                    completedMealSlots: {},
                    loggedAppetiteHelpers: [],
                    pelvicHabits: {},
                    activeDrafts: drafts,
                    dailyLogs: {
                        ...(prev.dailyLogs || {}),
                        ...(oldDate ? { [oldDate]: archivedYesterday } : {})
                    }
                };
            });
        };
        rollover();
        document.addEventListener('visibilitychange', rollover);
        return () => document.removeEventListener('visibilitychange', rollover);
    }, []);

    // Helper wrapper for direct PostgreSQL mutations from child views
    const runCloudMutation = useCallback(
        async (apiFn, errorLabel = 'Cloud sync failed') => {
            setSyncStatus('syncing');
            try {
                const res = await apiFn();
                setSyncStatus('synced');
                setLastSyncedAt(new Date().toISOString());
                setSyncErrorMsg('');
                bumpOverview();
                return res;
            } catch (err) {
                setSyncStatus('offline');
                setSyncErrorMsg(err.message || errorLabel);
                showToast(`${errorLabel}: ${err.message || 'Check backend server'}`);
                return null;
            }
        },
        [bumpOverview, showToast]
    );

    const openProfileEditor = useCallback(() => {
        setOnboardingForm(appState.profile);
        setShowOnboarding(true);
    }, [appState.profile]);

    useEffect(() => {
        if (!workoutRunning) return;
        const interval = setInterval(() => {
            setWorkoutElapsedSec((prev) => prev + 1);
        }, 1000);
        return () => clearInterval(interval);
    }, [workoutRunning]);

    useEffect(() => {
        if (!restTimer.active || restTimer.paused) return;
        if (restTimer.remainingSec <= 0) {
            setRestTimer((prev) => ({ ...prev, active: false }));
            showToast('Rest complete — hit your next working set with 1–2 RIR!');
            navigator.vibrate?.([200, 100, 200]);
            return;
        }
        const interval = setInterval(() => {
            setRestTimer((prev) => ({ ...prev, remainingSec: Math.max(0, prev.remainingSec - 1) }));
        }, 1000);
        return () => clearInterval(interval);
    }, [restTimer.active, restTimer.paused, restTimer.remainingSec, showToast]);

    const isDark = appState.theme === 'dark';

    const colors = useMemo(
        () =>
            isDark
                ? {
                      bg: '#0A0A0B',
                      card: '#000000',
                      elevated: '#141416',
                      border: '#27272A',
                      text: '#FFFFFF',
                      muted: '#A1A1AA',
                      accent: '#CCFF00',
                      accentText: '#0A0A0B',
                      accentSurface: '#1A2205',
                      accentBorder: '#CCFF00',
                      danger: '#EF4444',
                      warning: '#FBBF24',
                      success: '#22C55E'
                  }
                : {
                      bg: '#F4F4F2',
                      card: '#FFFFFF',
                      elevated: '#EDEDEA',
                      border: '#D6D6D1',
                      text: '#0A0A0B',
                      muted: '#55555C',
                      accent: '#0059FF',
                      accentText: '#FFFFFF',
                      accentSurface: '#DBEAFE',
                      accentBorder: '#0059FF',
                      danger: '#DC2626',
                      warning: '#D97706',
                      success: '#16A34A'
                  },
        [isDark]
    );

    useEffect(() => {
        document.documentElement.dataset.theme = appState.theme;
        let m = document.querySelector('meta[name="theme-color"]');
        if (!m) {
            m = document.createElement('meta');
            m.name = 'theme-color';
            document.head.appendChild(m);
        }
        m.content = colors.bg;
    }, [appState.theme, colors.bg]);

    const isLb = appState.unit === 'lb';
    const formatWeight = useCallback(
        (kgVal) => {
            const num = Number(kgVal || 0);
            if (isLb) {
                return Number((num * 2.20462).toFixed(1));
            }
            return Number(num.toFixed(2));
        },
        [isLb]
    );

    const toKg = useCallback(
        (displayVal) => {
            const num = Number(displayVal || 0);
            if (isLb) {
                return Number((num / 2.20462).toFixed(2));
            }
            return num;
        },
        [isLb]
    );

    const formatTime = (sec) => {
        const mins = Math.floor(sec / 60);
        const rem = sec % 60;
        return `${String(mins).padStart(2, '0')}:${String(rem).padStart(2, '0')}`;
    };

    const activeDayPlan = useMemo(
        () => WORKOUT_PLAN.find((d) => d.dayIndex === selectedDayIndex) || WORKOUT_PLAN[0],
        [selectedDayIndex]
    );

    // ============================================================================
    // HANDLERS FOR TODAY TAB (WORKOUT, SETS, RECALL & ATOMIC DB SAVE)
    // ============================================================================

    const getEffectiveSetCount = useCallback(
        (exercise) => {
            if (appState.rampInEnabled) {
                return Math.min(SCIENCE_RULES.RAMP_IN_SETS, exercise.sets);
            }
            return exercise.sets;
        },
        [appState.rampInEnabled]
    );

    const handleSetInputChange = (exerciseId, setIndex, field, rawValue) => {
        const numericVal = rawValue === '' ? '' : Math.max(0, Number(rawValue));
        setAppState((prev) => {
            const currentSets = prev.activeDrafts[exerciseId] || [];
            const updatedSets = currentSets.map((s, idx) => {
                if (idx !== setIndex) return s;
                if (field === 'weight') {
                    return { ...s, weight: rawValue === '' ? '' : toKg(numericVal) };
                }
                return { ...s, [field]: numericVal };
            });
            return {
                ...prev,
                activeDrafts: {
                    ...prev.activeDrafts,
                    [exerciseId]: updatedSets
                }
            };
        });
    };

    const handleToggleSetComplete = (exercise, setIndex) => {
        if (!workoutRunning) {
            setWorkoutRunning(true);
        }

        const currentSets = appState.activeDrafts[exercise.id] || [];
        const targetSet = currentSets[setIndex];
        const willComplete = !targetSet?.completed;

        setAppState((prev) => {
            const sets = prev.activeDrafts[exercise.id] || [];
            const nextSets = sets.map((s, idx) =>
                idx === setIndex ? { ...s, completed: willComplete } : s
            );
            return {
                ...prev,
                activeDrafts: {
                    ...prev.activeDrafts,
                    [exercise.id]: nextSets
                }
            };
        });

        if (willComplete) {
            const restSeconds = exercise.restSec || (exercise.type === 'compound' ? 120 : 75);
            setRestTimer({
                active: true,
                paused: false,
                remainingSec: restSeconds,
                totalSec: restSeconds,
                exerciseName: exercise.name,
                exerciseType: exercise.type
            });
        }
    };

    const handleApplyOverloadWeight = (exercise, suggestedWeightKg) => {
        setAppState((prev) => {
            const sets = prev.activeDrafts[exercise.id] || [];
            const nextSets = sets.map((s) => ({
                ...s,
                weight: suggestedWeightKg
            }));
            return {
                ...prev,
                activeDrafts: {
                    ...prev.activeDrafts,
                    [exercise.id]: nextSets
                }
            };
        });
        showToast(
            `Applied ${formatWeight(suggestedWeightKg)} ${appState.unit} across sets of ${exercise.name}`
        );
    };

    const handleCopyLastSessionSets = (exercise, lastSets) => {
        if (!Array.isArray(lastSets) || lastSets.length === 0) return;
        setAppState((prev) => {
            const currentSets = prev.activeDrafts[exercise.id] || [];
            const nextSets = currentSets.map((s, idx) => {
                const match = lastSets[idx] || lastSets[lastSets.length - 1];
                return {
                    ...s,
                    weight: Number(match?.weight || 0),
                    reps: Number(match?.reps || 0)
                };
            });
            return {
                ...prev,
                activeDrafts: {
                    ...prev.activeDrafts,
                    [exercise.id]: nextSets
                }
            };
        });
        showToast(`Loaded exact last session weights & reps for ${exercise.name}`);
    };

    const handleFinishWorkout = async () => {
        if (activeDayPlan.isRest || savingWorkout) return;

        const anyCompleted = activeDayPlan.exercises.some((ex) => {
            const limit = getEffectiveSetCount(ex);
            return (appState.activeDrafts[ex.id] || []).slice(0, limit).some((s) => s.completed);
        });
        if (!anyCompleted) {
            showToast('Check off at least 1 completed working set before finishing your workout.');
            return;
        }

        setSavingWorkout(true);

        let totalVolumeKg = 0;
        let setsCompleted = 0;
        const prsAchievedLocal = [];
        const updatedLastLogs = { ...appState.lastSessionLogs };
        const updatedExerciseHistory = { ...(appState.exerciseHistory || {}) };
        const todayStr = getLocalDateStr();
        const apiExercisesPayload = [];
        const exerciseSetsMap = {};

        activeDayPlan.exercises.forEach((ex) => {
            const limit = getEffectiveSetCount(ex);
            const draftSets = (appState.activeDrafts[ex.id] || []).slice(0, limit);
            const completedSets = draftSets.filter((s) => s.completed);

            if (completedSets.length === 0) return;

            const activeVar = appState.variantChoices?.[ex.id];
            const swappedName = appState.swappedAlternatives?.[ex.id];
            const activeVariantObj = ex.flags?.variants?.find((v) => v.id === activeVar);
            const finalName = swappedName || (activeVariantObj ? activeVariantObj.name : ex.name);
            const isAssisted =
                Boolean(ex.flags?.assisted) || Boolean(activeVariantObj?.assisted);

            let exVolume = 0;
            let bestWeight = isAssisted ? Infinity : 0;
            let bestRepsAtBest = 0;

            const normalizedSets = completedSets.map((s, idx) => ({
                setNumber: idx + 1,
                weight: Number(s.weight || 0),
                reps: Number(s.reps || 0)
            }));

            normalizedSets.forEach((s) => {
                const unilateralMultiplier = ex.flags?.unilateral ? 2 : 1;
                exVolume += s.weight * s.reps * unilateralMultiplier;

                if (isAssisted) {
                    if (s.weight < bestWeight || (s.weight === bestWeight && s.reps > bestRepsAtBest)) {
                        bestWeight = s.weight;
                        bestRepsAtBest = s.reps;
                    }
                } else {
                    if (s.weight > bestWeight || (s.weight === bestWeight && s.reps > bestRepsAtBest)) {
                        bestWeight = s.weight;
                        bestRepsAtBest = s.reps;
                    }
                }
            });

            setsCompleted += normalizedSets.length;
            totalVolumeKg += Math.round(exVolume);
            exerciseSetsMap[ex.id] = normalizedSets;

            apiExercisesPayload.push({
                exerciseId: ex.id,
                exerciseName: finalName,
                primaryGroup: ex.primaryGroup,
                isAssisted,
                unilateral: Boolean(ex.flags?.unilateral),
                sets: normalizedSets
            });

            const prevSets = appState.lastSessionLogs[ex.id] || [];
            if (prevSets.length > 0) {
                if (isAssisted) {
                    const prevMinAssist = prevSets.reduce(
                        (min, s) => Math.min(min, Number(s.weight || Infinity)),
                        Infinity
                    );
                    const prevRepsAtMin = prevSets
                        .filter((s) => Number(s.weight || 0) === prevMinAssist)
                        .reduce((max, s) => Math.max(max, Number(s.reps || 0)), 0);
                    if (
                        bestWeight < prevMinAssist ||
                        (bestWeight === prevMinAssist && bestRepsAtBest > prevRepsAtMin)
                    ) {
                        prsAchievedLocal.push({
                            exerciseName: finalName,
                            weightKg: bestWeight,
                            reps: bestRepsAtBest,
                            isAssisted: true
                        });
                    }
                } else if (bestWeight > 0) {
                    const prevBestWeight = prevSets.reduce(
                        (max, s) => Math.max(max, Number(s.weight || 0)),
                        0
                    );
                    const prevBestReps = prevSets
                        .filter((s) => Number(s.weight || 0) === prevBestWeight)
                        .reduce((max, s) => Math.max(max, Number(s.reps || 0)), 0);
                    if (
                        bestWeight > prevBestWeight ||
                        (bestWeight === prevBestWeight && bestRepsAtBest > prevBestReps)
                    ) {
                        prsAchievedLocal.push({
                            exerciseName: finalName,
                            weightKg: bestWeight,
                            reps: bestRepsAtBest,
                            isAssisted: false
                        });
                    }
                }
            }

            updatedLastLogs[ex.id] = normalizedSets.map((s) => ({
                weight: s.weight,
                reps: s.reps
            }));

            const prevExHist = updatedExerciseHistory[ex.id] || [];
            updatedExerciseHistory[ex.id] = [
                ...prevExHist,
                {
                    id: `${ex.id}-${Date.now()}`,
                    date: todayStr,
                    dayIndex: activeDayPlan.dayIndex,
                    topWeightKg: bestWeight === Infinity ? 0 : bestWeight,
                    bestReps: bestRepsAtBest,
                    volumeKg: Math.round(exVolume),
                    setsCompleted: normalizedSets.length,
                    primaryGroup: ex.primaryGroup,
                    sets: normalizedSets
                }
            ];
        });

        const durationToRecord = workoutElapsedSec;

        const nextDrafts = { ...appState.activeDrafts };
        activeDayPlan.exercises.forEach((ex) => {
            const limit = getEffectiveSetCount(ex);
            if (!(appState.activeDrafts[ex.id] || []).slice(0, limit).some((s) => s.completed)) return;
            const saved = updatedLastLogs[ex.id];
            const activeVar = appState.variantChoices?.[ex.id] || null;
            const ov = calculateProgressiveOverload(ex, saved, appState.customSteps || {}, activeVar);
            nextDrafts[ex.id] = Array.from({ length: ex.sets }, (_, i) => {
                const s = saved[i] || saved[saved.length - 1];
                return {
                    setNumber: i + 1,
                    weight: ov.shouldIncrease ? ov.suggestedWeightKg : s.weight,
                    reps: ov.shouldIncrease ? ex.repMin : s.reps,
                    completed: false
                };
            });
        });

        // Persist atomically to PostgreSQL (`WorkoutSession` + `ExerciseLog` tables)
        const apiRes = await runCloudMutation(
            () =>
                vtaperApi.completeWorkout({
                    date: todayStr,
                    dayIndex: activeDayPlan.dayIndex,
                    dayTitle: activeDayPlan.title,
                    durationSec: durationToRecord,
                    exercises: apiExercisesPayload,
                    nextActiveDrafts: nextDrafts
                }),
            'Workout saved locally (DB offline)'
        );

        const finalPRs = apiRes?.prsAchieved || prsAchievedLocal;
        const newHistoryEntry = {
            id: apiRes?.session?.id || `hist-${Date.now()}`,
            date: todayStr,
            dayIndex: activeDayPlan.dayIndex,
            dayTitle: activeDayPlan.title,
            durationSec: durationToRecord,
            totalVolumeKg: apiRes?.session?.totalVolumeKg ?? totalVolumeKg,
            setsCompleted: apiRes?.session?.setsCompleted ?? setsCompleted,
            prsCount: finalPRs.length,
            exerciseSets: exerciseSetsMap
        };

        setAppState((prev) => ({
            ...prev,
            lastSessionLogs: updatedLastLogs,
            activeDrafts: nextDrafts,
            exerciseHistory: updatedExerciseHistory,
            workoutStreak: apiRes?.workoutStreak ?? prev.workoutStreak + 1,
            workoutHistory: [newHistoryEntry, ...prev.workoutHistory]
        }));

        setWorkoutRunning(false);
        setWorkoutElapsedSec(0);
        setRestTimer((prev) => ({ ...prev, active: false }));
        setSavingWorkout(false);

        setWorkoutSummary({
            dayTitle: `${activeDayPlan.shortDay} — ${activeDayPlan.title}`,
            durationSec: durationToRecord,
            totalVolumeKg: newHistoryEntry.totalVolumeKg,
            setsCompleted: newHistoryEntry.setsCompleted,
            prsAchieved: finalPRs,
            savedToCloud: Boolean(apiRes?.ok)
        });

        // Refresh exact recall for this day from PostgreSQL
        fetchDayRecall(activeDayPlan.dayIndex);
    };

    // ============================================================================
    // COMPUTED ANALYTICS (GAIN RATE, MEASUREMENTS & DISCIPLINE)
    // ============================================================================

    const gainAnalysis = useMemo(
        () => analyzeWeeklyGainRate(appState.weightLogs, true),
        [appState.weightLogs]
    );

    const disciplineStats = useMemo(
        () => analyzeDisciplineProgress(appState.disciplineLogs, appState.urgeLogs),
        [appState.disciplineLogs, appState.urgeLogs]
    );

    const latestMeasurement = useMemo(() => {
        if (!appState.measurements.length) return null;
        return appState.measurements[appState.measurements.length - 1];
    }, [appState.measurements]);

    const vTaperRatio = useMemo(() => {
        if (!latestMeasurement || !latestMeasurement.waist || latestMeasurement.waist <= 0) {
            return null;
        }
        return Number((latestMeasurement.shoulders / latestMeasurement.waist).toFixed(2));
    }, [latestMeasurement]);

    const latestWeightKg = useMemo(() => {
        if (appState.weightLogs.length > 0) {
            const latest = appState.weightLogs[appState.weightLogs.length - 1];
            return Number(latest.morningKg || latest.weightKg || latest.nightKg || 0);
        }
        return Number(appState.profile.startWeightKg || 0);
    }, [appState.weightLogs, appState.profile.startWeightKg]);

    const kcalTarget = appState.profile.targetCalories || SCIENCE_RULES.TARGET_KCAL;
    const proteinTarget = appState.profile.targetProteinG || SCIENCE_RULES.TARGET_PROTEIN_G;

    const navItems = [
        { id: 'today', label: 'Today', icon: Dumbbell },
        { id: 'clean', label: 'Clean', icon: Brain },
        { id: 'cardio', label: 'Cardio', icon: Flame },
        { id: 'pelvic', label: 'Pelvic', icon: ShieldCheck },
        { id: 'plan', label: 'Plan', icon: Calendar },
        { id: 'nutrition', label: 'Nutrition', icon: Utensils },
        { id: 'progress', label: 'Progress', icon: TrendingUp },
        { id: 'stats', label: 'Stats', icon: BarChart3 },
        { id: 'settings', label: 'Settings', icon: Settings }
    ];

    const handleDietTrackChange = (newTrack) => {
        setAppState((prev) => ({
            ...prev,
            profile: { ...prev.profile, dietTrack: newTrack },
            selectedMealOptions: getDefaultSelectedMealsForTrack(newTrack)
        }));
        showToast(`Switched diet track to ${newTrack.toUpperCase()} (100% whole foods)`);
    };

    const handleSaveOnboarding = async () => {
        const chosenTrack = onboardingForm.dietTrack || 'non-veg';
        const parsedStartKg = Number(onboardingForm.startWeightKg || 0);
        const todayStr = getLocalDateStr();

        const updatedProfile = {
            ...onboardingForm,
            dietTrack: chosenTrack,
            goalWeightMinKg: Number(onboardingForm.goalWeightMinKg || 65),
            goalWeightMaxKg: Number(onboardingForm.goalWeightMaxKg || 68)
        };

        const shouldCreateBaselineWeight = appState.weightLogs.length === 0 && parsedStartKg > 0;

        setAppState((prev) => ({
            ...prev,
            onboarded: true,
            profile: updatedProfile,
            selectedMealOptions: getDefaultSelectedMealsForTrack(chosenTrack),
            weightLogs: shouldCreateBaselineWeight
                ? [
                      {
                          id: 'w-start',
                          date: todayStr,
                          label: 'Start',
                          morningKg: parsedStartKg,
                          nightKg: null,
                          weightKg: parsedStartKg,
                          notes: 'Initial baseline'
                      }
                  ]
                : prev.weightLogs
        }));
        setShowOnboarding(false);

        if (shouldCreateBaselineWeight) {
            await runCloudMutation(
                () =>
                    vtaperApi.saveWeightLog(todayStr, {
                        morningKg: parsedStartKg,
                        nightKg: null,
                        notes: 'Initial baseline'
                    }),
                'Baseline weight sync failed'
            );
        }

        showToast(`Profile saved to PostgreSQL (${chosenTrack.toUpperCase()})!`);
    };

    const handleMigrateLocalToCloud = async () => {
        if (!localMigrationCandidate) return;
        const res = await runCloudMutation(
            () => vtaperApi.importState(localMigrationCandidate),
            'Migration failed'
        );
        if (res?.state) {
            skipNextConfigSyncRef.current = true;
            skipNextDailySyncRef.current = true;
            const merged = hydrateMergedState(res.state);
            setAppState(merged);
            setLocalMigrationCandidate(null);
            setShowOnboarding(!merged.onboarded);
            fetchDayRecall(selectedDayIndex);
            showToast('Poora purana LocalStorage data PostgreSQL mein migrate ho gaya!');
        }
    };

    const syncPillColor =
        syncStatus === 'synced'
            ? colors.success
            : syncStatus === 'offline'
              ? colors.danger
              : colors.warning;

    const syncPillLabel =
        syncStatus === 'synced'
            ? 'DB Synced'
            : syncStatus === 'syncing'
              ? 'Saving...'
              : syncStatus === 'loading'
                ? 'Loading DB...'
                : 'Offline Cache';

    return (
        <div
            style={{
                backgroundColor: colors.bg,
                color: colors.text,
                fontFamily: "'Sora', -apple-system, BlinkMacSystemFont, sans-serif",
                '--ring': colors.accentBorder
            }}
            className="vt-app"
        >
            {/* ==================================================================== */}
            {/* DESKTOP SIDEBAR                                                      */}
            {/* ==================================================================== */}
            <aside
                style={{ backgroundColor: colors.card, borderColor: colors.border }}
                className="vt-sidebar"
            >
                <div style={{ borderColor: colors.border }} className="vt-sidebar-header">
                    <div className="vt-brand-group">
                        <BrandLogo size={42} isDark={isDark} colors={colors} />
                        <div>
                            <h1 className="vt-brand-title font-display">VTAPER</h1>
                            <p style={{ color: colors.muted }} className="vt-brand-sub">
                                Goal Band • {appState.profile.goalWeightMinKg}–{appState.profile.goalWeightMaxKg} kg
                            </p>
                        </div>
                    </div>

                    <button
                        onClick={() =>
                            setAppState((prev) => ({
                                ...prev,
                                theme: prev.theme === 'dark' ? 'light' : 'dark'
                            }))
                        }
                        aria-label="Toggle color theme"
                        style={{ backgroundColor: colors.elevated, borderColor: colors.border, color: colors.text }}
                        className="vt-icon-btn-44"
                    >
                        {isDark ? <Sun size={20} /> : <Moon size={20} />}
                    </button>
                </div>

                {/* Live PostgreSQL Sync Status Strip */}
                <div style={{ padding: '0.625rem 0.875rem 0' }}>
                    <button
                        type="button"
                        onClick={() => loadFromBackend(false)}
                        title={
                            lastSyncedAt
                                ? `Last synced: ${new Date(lastSyncedAt).toLocaleTimeString()} (Click to refresh)`
                                : syncErrorMsg || 'Click to sync with PostgreSQL'
                        }
                        style={{
                            width: '100%',
                            backgroundColor: colors.elevated,
                            borderColor: syncStatus === 'offline' ? colors.danger : colors.border,
                            color: colors.text,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '0.45rem 0.7rem',
                            borderRadius: '0.75rem',
                            borderWidth: '1px',
                            borderStyle: 'solid',
                            fontSize: '11px',
                            fontWeight: 800,
                            cursor: 'pointer'
                        }}
                        className="font-mono-num"
                    >
                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                            {syncStatus === 'offline' ? (
                                <CloudOff size={14} style={{ color: syncPillColor }} />
                            ) : (
                                <Database size={14} style={{ color: syncPillColor }} />
                            )}
                            <span style={{ color: syncPillColor }}>{syncPillLabel}</span>
                        </span>
                        <RefreshCw
                            size={13}
                            style={{
                                color: colors.muted,
                                animation: syncStatus === 'syncing' || syncStatus === 'loading' ? 'spin 1s linear infinite' : 'none'
                            }}
                        />
                    </button>
                </div>

                {/* User Snapshot Card */}
                <div className="vt-sidebar-snapshot-wrap">
                    <div
                        style={{ backgroundColor: colors.elevated, borderColor: colors.border }}
                        className="vt-sidebar-snapshot"
                    >
                        <div className="vt-snapshot-top">
                            <span className="vt-track-label" style={{ color: colors.muted }}>
                                {appState.profile.dietTrack} Track
                            </span>
                            <button
                                onClick={openProfileEditor}
                                style={{
                                    backgroundColor: colors.accent,
                                    color: colors.accentText
                                }}
                                className="vt-edit-goals-btn"
                            >
                                <span>Edit Goals</span>
                            </button>
                        </div>
                        <div className="vt-snapshot-stats font-display">
                            {appState.profile.age > 0 ? `${appState.profile.age} yrs` : '0 yrs'} •{' '}
                            {appState.profile.heightCm > 0 ? `${appState.profile.heightCm} cm` : '0 cm'}
                        </div>
                        <div className="vt-snapshot-grid" style={{ borderColor: colors.border }}>
                            <div>
                                <div className="vt-stat-caption" style={{ color: colors.muted }}>
                                    Current
                                </div>
                                <div className="vt-stat-value-xl font-display">
                                    {formatWeight(latestWeightKg)} {appState.unit}
                                </div>
                            </div>
                            <div>
                                <div className="vt-stat-caption" style={{ color: colors.muted }}>
                                    Goal Band
                                </div>
                                <div
                                    style={{ color: isDark ? colors.accent : colors.text }}
                                    className="vt-stat-value-xl font-display"
                                >
                                    {formatWeight(appState.profile.goalWeightMinKg)}–
                                    {formatWeight(appState.profile.goalWeightMaxKg)} {appState.unit}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Navigation Links */}
                <nav className="vt-sidebar-nav" aria-label="Main Navigation">
                    {navItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = activeTab === item.id;
                        return (
                            <button
                                key={item.id}
                                onClick={() => setActiveTab(item.id)}
                                style={{
                                    backgroundColor: isActive ? colors.accent : 'transparent',
                                    color: isActive ? colors.accentText : colors.text,
                                    borderColor: isActive ? colors.accentBorder : 'transparent'
                                }}
                                className="vt-nav-btn"
                            >
                                <Icon size={20} style={{ flexShrink: 0 }} />
                                <span>{item.label}</span>
                                {item.id === 'today' && workoutRunning && (
                                    <span
                                        style={{
                                            backgroundColor: isActive ? '#0A0A0B' : colors.accent,
                                            color: isActive ? colors.accent : colors.accentText
                                        }}
                                        className="vt-nav-timer-badge font-mono-num"
                                    >
                                        {formatTime(workoutElapsedSec)}
                                    </span>
                                )}
                            </button>
                        );
                    })}
                </nav>

                {/* Daily Targets Mini Footer */}
                <div style={{ borderColor: colors.border }} className="vt-sidebar-footer">
                    <div className="vt-footer-row">
                        <span style={{ color: colors.muted }}>Clean Streak</span>
                        <span
                            style={{
                                fontWeight: 800,
                                color: disciplineStats.currentStreak > 0 ? colors.success : colors.text
                            }}
                            className="font-mono-num"
                        >
                            {disciplineStats.currentStreak} / {SCIENCE_RULES.REBOOT_TARGET_DAYS} d
                        </span>
                    </div>
                    <div className="vt-footer-row">
                        <span style={{ color: colors.muted }}>Calories Today</span>
                        <span style={{ fontWeight: 800 }} className="font-mono-num">
                            {nutritionTotals.consumedKcal} / {kcalTarget} kcal
                        </span>
                    </div>
                    <div className="vt-footer-row">
                        <span style={{ color: colors.muted }}>Protein (Floor 110g)</span>
                        <span style={{ fontWeight: 800 }} className="font-mono-num">
                            {nutritionTotals.consumedProtein}g / {proteinTarget}g
                        </span>
                    </div>
                </div>
            </aside>

            {/* ==================================================================== */}
            {/* MAIN CONTENT AREA                                                    */}
            {/* ==================================================================== */}
            <div className="vt-main-wrap">
                {/* Mobile Top Bar */}
                <header
                    style={{ backgroundColor: colors.card, borderColor: colors.border }}
                    className="vt-mobile-header"
                >
                    <div className="vt-mobile-brand">
                        <BrandLogo size={36} isDark={isDark} colors={colors} />
                        <div style={{ minWidth: 0 }}>
                            <div className="vt-mobile-title font-display">VTAPER</div>
                            <div style={{ color: colors.muted }} className="vt-mobile-sub">
                                Clean: {disciplineStats.currentStreak}d •{' '}
                                <span style={{ color: syncPillColor, fontWeight: 700 }}>{syncPillLabel}</span>
                            </div>
                        </div>
                    </div>

                    <div className="vt-mobile-actions">
                        <button
                            onClick={() => loadFromBackend(false)}
                            aria-label="Sync with PostgreSQL"
                            style={{
                                backgroundColor: colors.elevated,
                                borderColor: syncStatus === 'offline' ? colors.danger : colors.border,
                                color: syncPillColor
                            }}
                            className="vt-icon-btn-44"
                        >
                            {syncStatus === 'offline' ? <CloudOff size={16} /> : <Cloud size={16} />}
                        </button>
                        <button
                            onClick={() =>
                                setAppState((prev) => ({
                                    ...prev,
                                    unit: prev.unit === 'kg' ? 'lb' : 'kg'
                                }))
                            }
                            style={{ backgroundColor: colors.elevated, borderColor: colors.border, color: colors.text }}
                            className="vt-unit-btn"
                        >
                            {appState.unit}
                        </button>
                        <button
                            onClick={() =>
                                setAppState((prev) => ({
                                    ...prev,
                                    theme: prev.theme === 'dark' ? 'light' : 'dark'
                                }))
                            }
                            aria-label="Toggle Theme"
                            style={{ backgroundColor: colors.elevated, borderColor: colors.border, color: colors.text }}
                            className="vt-icon-btn-44"
                        >
                            {isDark ? <Sun size={16} /> : <Moon size={16} />}
                        </button>
                    </div>
                </header>

                {/* Toast Notification Banner */}
                {toast && (
                    <div className="vt-toast-wrap">
                        <div
                            style={{
                                backgroundColor: colors.accent,
                                color: colors.accentText,
                                borderColor: colors.accentBorder
                            }}
                            className="vt-toast-card"
                        >
                            <CheckCircle2 size={20} style={{ flexShrink: 0 }} />
                            <span>{toast}</span>
                        </div>
                    </div>
                )}

                {/* Active Rest Timer Floating Bar */}
                {restTimer.active && (
                    <div
                        style={{
                            backgroundColor: colors.card,
                            borderColor: colors.accentBorder
                        }}
                        className="vt-rest-bar"
                    >
                        <div className="vt-rest-info">
                            <div
                                style={{
                                    backgroundColor: colors.accent,
                                    color: colors.accentText
                                }}
                                className="vt-rest-clock font-display tabular-nums"
                            >
                                {formatTime(restTimer.remainingSec)}
                            </div>
                            <div style={{ minWidth: 0 }}>
                                <div
                                    className="vt-rest-meta tabular-nums"
                                    style={{ color: isDark ? colors.accent : colors.text }}
                                >
                                    Rest • {restTimer.exerciseType} ({restTimer.totalSec}s target)
                                </div>
                                <div className="vt-rest-ex-name">{restTimer.exerciseName}</div>
                            </div>
                        </div>

                        <div className="vt-rest-controls tabular-nums">
                            <button
                                onClick={() =>
                                    setRestTimer((prev) => ({
                                        ...prev,
                                        remainingSec: Math.max(0, prev.remainingSec - 15)
                                    }))
                                }
                                style={{ backgroundColor: colors.elevated, borderColor: colors.border, color: colors.text }}
                                className="vt-rest-step-btn"
                            >
                                -15s
                            </button>
                            <button
                                onClick={() =>
                                    setRestTimer((prev) => ({
                                        ...prev,
                                        remainingSec: prev.remainingSec + 15
                                    }))
                                }
                                style={{ backgroundColor: colors.elevated, borderColor: colors.border, color: colors.text }}
                                className="vt-rest-step-btn"
                            >
                                +15s
                            </button>
                            <button
                                onClick={() =>
                                    setRestTimer((prev) => ({ ...prev, paused: !prev.paused }))
                                }
                                aria-label={restTimer.paused ? 'Resume rest timer' : 'Pause rest timer'}
                                style={{ backgroundColor: colors.elevated, borderColor: colors.border, color: colors.text }}
                                className="vt-icon-btn-44"
                            >
                                {restTimer.paused ? <Play size={16} /> : <Pause size={16} />}
                            </button>
                            <button
                                onClick={() => setRestTimer((prev) => ({ ...prev, active: false }))}
                                aria-label="Skip rest timer"
                                style={{
                                    backgroundColor: colors.accent,
                                    color: colors.accentText,
                                    borderColor: colors.accentBorder
                                }}
                                className="vt-rest-skip-btn"
                            >
                                <SkipForward size={16} />
                                <span>Skip</span>
                            </button>
                        </div>
                    </div>
                )}

                {/* Page Container */}
                <main className="vt-page-main">
                    {/* 1-Click LocalStorage-to-PostgreSQL Migration Banner (only if DB is empty & old local data found) */}
                    {localMigrationCandidate && (
                        <div
                            style={{
                                backgroundColor: colors.accentSurface,
                                borderColor: colors.accentBorder,
                                marginBottom: '1rem'
                            }}
                            className="vt-card-b2 vt-p-4 vt-resp-row-md"
                        >
                            <div className="vt-stack-0-5">
                                <div className="vt-text-xs vt-font-extrabold vt-uppercase">
                                    Purana LocalStorage Data Detected!
                                </div>
                                <div className="vt-text-xs" style={{ color: colors.muted }}>
                                    PostgreSQL database abhi empty hai par browser mein purana VTaper progress mila hai. 1 click mein poora data PostgreSQL mein shift kar lo.
                                </div>
                            </div>
                            <div className="vt-flex vt-items-center vt-gap-2 vt-shrink-0">
                                <button
                                    type="button"
                                    onClick={handleMigrateLocalToCloud}
                                    style={{ backgroundColor: colors.accent, color: colors.accentText }}
                                    className="vt-btn vt-h-40 vt-px-3-5 vt-rounded-xl vt-text-xs vt-font-extrabold vt-uppercase"
                                >
                                    Migrate to PostgreSQL
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setLocalMigrationCandidate(null)}
                                    style={{ backgroundColor: colors.card, borderColor: colors.border, color: colors.text }}
                                    className="vt-btn vt-h-40 vt-px-3 vt-box-xl vt-text-xs vt-font-bold"
                                >
                                    Dismiss
                                </button>
                            </div>
                        </div>
                    )}

                    {activeTab === 'today' && (
                        <TodayView
                            colors={colors}
                            isDark={isDark}
                            appState={appState}
                            setAppState={setAppState}
                            selectedDayIndex={selectedDayIndex}
                            setSelectedDayIndex={setSelectedDayIndex}
                            currentWeekdayIndex={currentWeekdayIndex}
                            activeDayPlan={activeDayPlan}
                            dayRecall={dayRecall}
                            recallLoading={recallLoading}
                            workoutRunning={workoutRunning}
                            setWorkoutRunning={setWorkoutRunning}
                            workoutElapsedSec={workoutElapsedSec}
                            setWorkoutElapsedSec={setWorkoutElapsedSec}
                            savingWorkout={savingWorkout}
                            formatTime={formatTime}
                            formatWeight={formatWeight}
                            getEffectiveSetCount={getEffectiveSetCount}
                            handleSetInputChange={handleSetInputChange}
                            handleToggleSetComplete={handleToggleSetComplete}
                            handleApplyOverloadWeight={handleApplyOverloadWeight}
                            handleCopyLastSessionSets={handleCopyLastSessionSets}
                            handleFinishWorkout={handleFinishWorkout}
                            setRestTimer={setRestTimer}
                            showToast={showToast}
                        />
                    )}

                    {activeTab === 'clean' && (
                        <DisciplineView
                            colors={colors}
                            isDark={isDark}
                            appState={appState}
                            setAppState={setAppState}
                            disciplineStats={disciplineStats}
                            runCloudMutation={runCloudMutation}
                            showToast={showToast}
                        />
                    )}

                    {activeTab === 'plan' && (
                        <PlanView
                            colors={colors}
                            isDark={isDark}
                            appState={appState}
                            onSelectWorkoutDay={(dayIdx) => {
                                setSelectedDayIndex(dayIdx);
                                setActiveTab('today');
                            }}
                        />
                    )}

                    {activeTab === 'cardio' && (
                        <HomeCardioSection
                            colors={colors}
                            isDark={isDark}
                            appState={appState}
                            setAppState={setAppState}
                            runCloudMutation={runCloudMutation}
                            showToast={showToast}
                        />
                    )}

                    {activeTab === 'nutrition' && (
                        <NutritionView
                            colors={colors}
                            isDark={isDark}
                            appState={appState}
                            setAppState={setAppState}
                            nutritionTotals={nutritionTotals}
                            gainAnalysis={gainAnalysis}
                            handleDietTrackChange={handleDietTrackChange}
                            showToast={showToast}
                        />
                    )}

                    {activeTab === 'pelvic' && (
                        <PelvicRehabSection
                            colors={colors}
                            isDark={isDark}
                            appState={appState}
                            setAppState={setAppState}
                            runCloudMutation={runCloudMutation}
                            showToast={showToast}
                        />
                    )}

                    {activeTab === 'progress' && (
                        <ProgressView
                            colors={colors}
                            isDark={isDark}
                            appState={appState}
                            setAppState={setAppState}
                            formatWeight={formatWeight}
                            toKg={toKg}
                            gainAnalysis={gainAnalysis}
                            vTaperRatio={vTaperRatio}
                            latestMeasurement={latestMeasurement}
                            runCloudMutation={runCloudMutation}
                            showToast={showToast}
                        />
                    )}

                    {activeTab === 'stats' && (
                        <StatsView
                            colors={colors}
                            isDark={isDark}
                            appState={appState}
                            disciplineStats={disciplineStats}
                            formatWeight={formatWeight}
                            formatTime={formatTime}
                            overviewRefreshKey={overviewRefreshKey}
                        />
                    )}

                    {activeTab === 'settings' && (
                        <SettingsView
                            colors={colors}
                            isDark={isDark}
                            appState={appState}
                            setAppState={setAppState}
                            setShowOnboarding={setShowOnboarding}
                            setOnboardingForm={setOnboardingForm}
                            handleDietTrackChange={handleDietTrackChange}
                            syncStatus={syncStatus}
                            lastSyncedAt={lastSyncedAt}
                            loadFromBackend={loadFromBackend}
                            runCloudMutation={runCloudMutation}
                            onStateReplaced={(nextState) => {
                                skipNextConfigSyncRef.current = true;
                                skipNextDailySyncRef.current = true;
                                setAppState(hydrateMergedState(nextState));
                                fetchDayRecall(selectedDayIndex);
                                bumpOverview();
                            }}
                            showToast={showToast}
                        />
                    )}
                </main>
            </div>

            {/* ==================================================================== */}
            {/* MOBILE BOTTOM NAVIGATION BAR                                         */}
            {/* ==================================================================== */}
            <nav
                style={{ backgroundColor: colors.bg, borderColor: colors.border }}
                aria-label="Mobile Navigation"
                className="vt-mobile-nav"
            >
                {navItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = activeTab === item.id;
                    const on = isDark ? colors.accent : colors.text;
                    return (
                        <button
                            key={item.id}
                            onClick={() => setActiveTab(item.id)}
                            aria-current={isActive ? 'page' : undefined}
                            style={{ color: isActive ? on : colors.muted }}
                            className="vt-mobile-nav-btn"
                        >
                            <span
                                style={{ backgroundColor: isActive ? on : 'transparent' }}
                                className="vt-mobile-nav-indicator"
                            />
                            <Icon size={20} strokeWidth={isActive ? 2.5 : 2} />
                            <span>{item.label}</span>
                        </button>
                    );
                })}
            </nav>

            {/* ==================================================================== */}
            {/* ONBOARDING & PROFILE EDITOR MODAL                                    */}
            {/* ==================================================================== */}
            {showOnboarding && (
                <div
                    style={{ backgroundColor: 'rgba(0, 0, 0, 0.9)' }}
                    className="vt-modal-overlay"
                >
                    <div
                        style={{ backgroundColor: colors.card, borderColor: colors.border }}
                        className="vt-modal-card"
                    >
                        <div className="vt-flex-start-between">
                            <div>
                                <span
                                    style={{
                                        backgroundColor: colors.accent,
                                        color: colors.accentText,
                                        marginBottom: '0.5rem'
                                    }}
                                    className="vt-badge-accent"
                                >
                                    PostgreSQL Cloud Sync • Goal 65–68 kg
                                </span>
                                <h2 className="vt-section-title vt-section-title-lg font-display">
                                    Athlete Profile Setup
                                </h2>
                                <p style={{ color: colors.muted, fontSize: '0.8125rem', margin: '0.25rem 0 0 0' }}>
                                    Har workout, weight, nutrition aur discipline log seedha PostgreSQL database mein save hoga. Apni current details daalein:
                                </p>
                            </div>
                            <button
                                onClick={() => {
                                    setAppState((prev) => ({ ...prev, onboarded: true }));
                                    setShowOnboarding(false);
                                }}
                                aria-label="Close profile setup"
                                style={{ backgroundColor: colors.elevated, borderColor: colors.border, color: colors.text }}
                                className="vt-icon-btn-44"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <div className="vt-modal-form-grid tabular-nums">
                            <div className="vt-col-span-2-sm">
                                <label
                                    style={{
                                        display: 'block',
                                        fontSize: '0.75rem',
                                        fontWeight: 700,
                                        textTransform: 'uppercase',
                                        marginBottom: '0.375rem',
                                        color: colors.muted
                                    }}
                                >
                                    Indian Home-Style Diet Track (No Supplements)
                                </label>
                                <div className="vt-track-selector-grid">
                                    {[
                                        { id: 'non-veg', label: 'Non-Veg', sub: 'Eggs + Chicken + Dairy' },
                                        { id: 'eggetarian', label: 'Eggetarian', sub: 'Eggs + Dairy + Soya' },
                                        { id: 'veg', label: 'Vegetarian', sub: 'Dairy + Soya + Dal' }
                                    ].map((t) => {
                                        const active = (onboardingForm.dietTrack || 'non-veg') === t.id;
                                        return (
                                            <button
                                                key={t.id}
                                                type="button"
                                                onClick={() =>
                                                    setOnboardingForm((prev) => ({ ...prev, dietTrack: t.id }))
                                                }
                                                style={{
                                                    backgroundColor: active ? colors.accent : colors.elevated,
                                                    color: active ? colors.accentText : colors.text,
                                                    borderColor: active ? colors.accentBorder : colors.border
                                                }}
                                                className="vt-track-option-btn"
                                            >
                                                <div style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase' }}>
                                                    {t.label}
                                                </div>
                                                <div style={{ fontSize: '10px', opacity: 0.8, lineHeight: 1.25, marginTop: '0.125rem' }}>
                                                    {t.sub}
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            <div>
                                <label
                                    style={{
                                        display: 'block',
                                        fontSize: '0.75rem',
                                        fontWeight: 700,
                                        textTransform: 'uppercase',
                                        marginBottom: '0.375rem',
                                        color: colors.muted
                                    }}
                                >
                                    Age (Years)
                                </label>
                                <input
                                    type="number"
                                    inputMode="numeric"
                                    placeholder="0"
                                    value={onboardingForm.age === 0 ? '' : onboardingForm.age}
                                    onChange={(e) =>
                                        setOnboardingForm((prev) => ({
                                            ...prev,
                                            age: e.target.value === '' ? 0 : Number(e.target.value)
                                        }))
                                    }
                                    style={{
                                        backgroundColor: colors.elevated,
                                        borderColor: colors.border,
                                        color: colors.text
                                    }}
                                    className="vt-form-input"
                                />
                            </div>
                            <div>
                                <label
                                    style={{
                                        display: 'block',
                                        fontSize: '0.75rem',
                                        fontWeight: 700,
                                        textTransform: 'uppercase',
                                        marginBottom: '0.375rem',
                                        color: colors.muted
                                    }}
                                >
                                    Height (cm)
                                </label>
                                <input
                                    type="number"
                                    inputMode="numeric"
                                    placeholder="0"
                                    value={onboardingForm.heightCm === 0 ? '' : onboardingForm.heightCm}
                                    onChange={(e) =>
                                        setOnboardingForm((prev) => ({
                                            ...prev,
                                            heightCm: e.target.value === '' ? 0 : Number(e.target.value)
                                        }))
                                    }
                                    style={{
                                        backgroundColor: colors.elevated,
                                        borderColor: colors.border,
                                        color: colors.text
                                    }}
                                    className="vt-form-input"
                                />
                            </div>
                            <div>
                                <label
                                    style={{
                                        display: 'block',
                                        fontSize: '0.75rem',
                                        fontWeight: 700,
                                        textTransform: 'uppercase',
                                        marginBottom: '0.375rem',
                                        color: colors.muted
                                    }}
                                >
                                    Start Weight (kg)
                                </label>
                                <input
                                    type="number"
                                    inputMode="decimal"
                                    step="0.1"
                                    placeholder="0.0"
                                    value={onboardingForm.startWeightKg === 0 ? '' : onboardingForm.startWeightKg}
                                    onChange={(e) => {
                                        const v = e.target.value === '' ? 0 : Number(e.target.value);
                                        setOnboardingForm((prev) => ({
                                            ...prev,
                                            startWeightKg: v,
                                            currentWeightKg: v
                                        }));
                                    }}
                                    style={{
                                        backgroundColor: colors.elevated,
                                        borderColor: colors.border,
                                        color: colors.text
                                    }}
                                    className="vt-form-input"
                                />
                            </div>
                            <div className="vt-grid-2">
                                <div>
                                    <label
                                        style={{
                                            display: 'block',
                                            fontSize: '0.75rem',
                                            fontWeight: 700,
                                            textTransform: 'uppercase',
                                            marginBottom: '0.375rem',
                                            color: colors.muted
                                        }}
                                    >
                                        Goal Min (kg)
                                    </label>
                                    <input
                                        type="number"
                                        inputMode="decimal"
                                        step="0.5"
                                        value={onboardingForm.goalWeightMinKg}
                                        onChange={(e) =>
                                            setOnboardingForm((prev) => ({
                                                ...prev,
                                                goalWeightMinKg: Number(e.target.value)
                                            }))
                                        }
                                        style={{
                                            backgroundColor: colors.elevated,
                                            borderColor: colors.border,
                                            color: colors.text
                                        }}
                                        className="vt-form-input"
                                    />
                                </div>
                                <div>
                                    <label
                                        style={{
                                            display: 'block',
                                            fontSize: '0.75rem',
                                            fontWeight: 700,
                                            textTransform: 'uppercase',
                                            marginBottom: '0.375rem',
                                            color: colors.muted
                                        }}
                                    >
                                        Goal Max (kg)
                                    </label>
                                    <input
                                        type="number"
                                        inputMode="decimal"
                                        step="0.5"
                                        value={onboardingForm.goalWeightMaxKg}
                                        onChange={(e) =>
                                            setOnboardingForm((prev) => ({
                                                ...prev,
                                                goalWeightMaxKg: Number(e.target.value)
                                            }))
                                        }
                                        style={{
                                            backgroundColor: colors.elevated,
                                            borderColor: colors.border,
                                            color: colors.text
                                        }}
                                        className="vt-form-input"
                                    />
                                </div>
                            </div>
                        </div>

                        <div
                            style={{
                                backgroundColor: colors.elevated,
                                borderColor: colors.border,
                                padding: '0.875rem',
                                borderRadius: '0.75rem',
                                borderWidth: '1px',
                                borderStyle: 'solid',
                                textAlign: 'center'
                            }}
                            className="vt-grid-3 tabular-nums"
                        >
                            <div>
                                <div style={{ fontSize: '10px', textTransform: 'uppercase', fontWeight: 700, color: colors.muted }}>
                                    Goal Band
                                </div>
                                <div className="vt-stat-value-xl font-display">
                                    {onboardingForm.goalWeightMinKg}–{onboardingForm.goalWeightMaxKg} kg
                                </div>
                            </div>
                            <div>
                                <div style={{ fontSize: '10px', textTransform: 'uppercase', fontWeight: 700, color: colors.muted }}>
                                    Daily Surplus
                                </div>
                                <div className="vt-stat-value-xl font-display">2,900 kcal</div>
                            </div>
                            <div>
                                <div style={{ fontSize: '10px', textTransform: 'uppercase', fontWeight: 700, color: colors.muted }}>
                                    Clean Reboot
                                </div>
                                <div className="vt-stat-value-xl font-display">90 Days</div>
                            </div>
                        </div>

                        <button
                            onClick={handleSaveOnboarding}
                            style={{
                                backgroundColor: colors.accent,
                                color: colors.accentText,
                                borderColor: colors.accentBorder,
                                minHeight: '48px',
                                fontSize: '0.875rem'
                            }}
                            className="vt-primary-cta"
                        >
                            Save to PostgreSQL & Launch VTaper
                        </button>
                    </div>
                </div>
            )}

            {/* ==================================================================== */}
            {/* END-OF-WORKOUT SUMMARY MODAL                                         */}
            {/* ==================================================================== */}
            {workoutSummary && (
                <div
                    style={{ backgroundColor: 'rgba(0, 0, 0, 0.9)' }}
                    className="vt-summary-overlay"
                >
                    <div
                        style={{ backgroundColor: colors.card, borderColor: colors.accentBorder }}
                        className="vt-summary-card"
                    >
                        <div className="vt-flex-center-gap-3">
                            <div
                                style={{
                                    backgroundColor: colors.accent,
                                    color: colors.accentText,
                                    width: '3rem',
                                    height: '3rem',
                                    borderRadius: '1rem',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    flexShrink: 0
                                }}
                            >
                                <Award size={28} />
                            </div>
                            <div>
                                <div
                                    style={{
                                        fontSize: '0.75rem',
                                        fontWeight: 800,
                                        textTransform: 'uppercase',
                                        letterSpacing: '0.05em',
                                        color: isDark ? colors.accent : colors.text
                                    }}
                                >
                                    Session Complete {workoutSummary.savedToCloud ? '• Saved in PostgreSQL ✓' : '• Cached Locally'}
                                </div>
                                <h3 className="vt-section-title vt-section-title-lg font-display">
                                    {workoutSummary.dayTitle}
                                </h3>
                            </div>
                        </div>

                        <div className="vt-grid-3 tabular-nums">
                            <div
                                style={{
                                    backgroundColor: colors.elevated,
                                    borderColor: colors.border,
                                    padding: '0.75rem',
                                    borderRadius: '0.75rem',
                                    borderWidth: '1px',
                                    borderStyle: 'solid',
                                    textAlign: 'center'
                                }}
                            >
                                <div className="vt-stat-caption" style={{ color: colors.muted }}>
                                    Duration
                                </div>
                                <div style={{ fontSize: '1.5rem', fontWeight: 800, marginTop: '0.125rem' }} className="font-display">
                                    {formatTime(workoutSummary.durationSec)}
                                </div>
                            </div>
                            <div
                                style={{
                                    backgroundColor: colors.elevated,
                                    borderColor: colors.border,
                                    padding: '0.75rem',
                                    borderRadius: '0.75rem',
                                    borderWidth: '1px',
                                    borderStyle: 'solid',
                                    textAlign: 'center'
                                }}
                            >
                                <div className="vt-stat-caption" style={{ color: colors.muted }}>
                                    Volume
                                </div>
                                <div style={{ fontSize: '1.5rem', fontWeight: 800, marginTop: '0.125rem' }} className="font-display">
                                    {formatWeight(workoutSummary.totalVolumeKg)} {appState.unit}
                                </div>
                            </div>
                            <div
                                style={{
                                    backgroundColor: colors.elevated,
                                    borderColor: colors.border,
                                    padding: '0.75rem',
                                    borderRadius: '0.75rem',
                                    borderWidth: '1px',
                                    borderStyle: 'solid',
                                    textAlign: 'center'
                                }}
                            >
                                <div className="vt-stat-caption" style={{ color: colors.muted }}>
                                    PRs Hit
                                </div>
                                <div
                                    style={{
                                        color: isDark ? colors.accent : colors.text,
                                        fontSize: '1.5rem',
                                        fontWeight: 800,
                                        marginTop: '0.125rem'
                                    }}
                                    className="font-display"
                                >
                                    {workoutSummary.prsAchieved.length}
                                </div>
                            </div>
                        </div>

                        {workoutSummary.prsAchieved.length > 0 && (
                            <div
                                style={{
                                    backgroundColor: colors.elevated,
                                    borderColor: colors.border,
                                    padding: '1rem',
                                    borderRadius: '0.75rem',
                                    borderWidth: '1px',
                                    borderStyle: 'solid'
                                }}
                                className="vt-stack-2 tabular-nums"
                            >
                                <div
                                    style={{
                                        fontSize: '0.75rem',
                                        fontWeight: 700,
                                        textTransform: 'uppercase',
                                        letterSpacing: '0.05em',
                                        marginBottom: '0.5rem'
                                    }}
                                    className="vt-flex-center-gap-2"
                                >
                                    <Sparkles size={16} />
                                    <span>New Personal Records</span>
                                </div>
                                {workoutSummary.prsAchieved.map((pr, idx) => (
                                    <div key={idx} className="vt-flex-between" style={{ fontSize: '0.875rem', marginTop: '0.375rem' }}>
                                        <span style={{ fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', paddingRight: '0.5rem' }}>
                                            {pr.exerciseName}
                                        </span>
                                        <span
                                            style={{
                                                backgroundColor: colors.accent,
                                                color: colors.accentText,
                                                fontSize: '0.75rem',
                                                fontWeight: 800,
                                                padding: '0.125rem 0.5rem',
                                                borderRadius: '0.375rem',
                                                flexShrink: 0
                                            }}
                                        >
                                            {pr.isAssisted ? 'Assist ' : ''}
                                            {formatWeight(pr.weightKg)} {appState.unit} × {pr.reps}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        )}

                        <button
                            onClick={() => setWorkoutSummary(null)}
                            style={{
                                backgroundColor: colors.accent,
                                color: colors.accentText,
                                borderColor: colors.accentBorder,
                                minHeight: '48px',
                                fontSize: '0.875rem'
                            }}
                            className="vt-primary-cta"
                        >
                            Done & View Progress
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

// ============================================================================
// SECTION 9: DISCIPLINE VIEW (NO PORN / NO MASTURBATION + 90s SOS + DB SYNC)
// ============================================================================

function DisciplineView({
    colors,
    isDark,
    appState,
    setAppState,
    disciplineStats,
    runCloudMutation,
    showToast
}) {
    const todayStr = useMemo(() => getLocalDateStr(), []);
    const [selectedDate, setSelectedDate] = useState(todayStr);
    const [urgeLevel, setUrgeLevel] = useState(0);
    const [selectedTrigger, setSelectedTrigger] = useState('');
    const [dailyNote, setDailyNote] = useState('');
    const [growthChartMode, setGrowthChartMode] = useState('growth');
    const [confirmRelapse, setConfirmRelapse] = useState(false);

    const [sosActive, setSosActive] = useState(false);
    const [sosSecLeft, setSosSecLeft] = useState(90);
    const [sosTipIdx, setSosTipIdx] = useState(0);

    const existingForSelected = appState.disciplineLogs?.[selectedDate] || null;

    useEffect(() => {
        if (existingForSelected) {
            setUrgeLevel(Number(existingForSelected.urgeLevel || 0));
            setSelectedTrigger(existingForSelected.trigger || '');
            setDailyNote(existingForSelected.note || '');
        } else {
            setUrgeLevel(0);
            setSelectedTrigger('');
            setDailyNote('');
        }
        setConfirmRelapse(false);
    }, [selectedDate, existingForSelected]);

    const persistUrgeVictory = useCallback(
        async (triggerLabel) => {
            const newUrge = {
                id: `urge-${Date.now()}`,
                date: todayStr,
                time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                trigger: triggerLabel || 'Instant Control',
                defeated: true
            };
            setAppState((prev) => ({
                ...prev,
                urgeLogs: [newUrge, ...(prev.urgeLogs || [])]
            }));
            await runCloudMutation(() => vtaperApi.logUrge(newUrge), 'Urge log sync failed');
        },
        [todayStr, setAppState, runCloudMutation]
    );

    useEffect(() => {
        if (!sosActive) return;
        if (sosSecLeft <= 0) {
            setSosActive(false);
            setSosSecLeft(90);
            persistUrgeVictory(selectedTrigger || 'SOS Protocol Completed');
            navigator.vibrate?.([150, 80, 150]);
            showToast('90s Urge Wave Defeated! +1 Victory saved to PostgreSQL.');
            return;
        }
        const timer = setInterval(() => {
            setSosSecLeft((prev) => {
                const next = Math.max(0, prev - 1);
                if (next > 0 && next % 22 === 0) {
                    setSosTipIdx((idx) => (idx + 1) % URGE_SOS_ACTIONS.length);
                }
                return next;
            });
        }, 1000);
        return () => clearInterval(timer);
    }, [sosActive, sosSecLeft, selectedTrigger, persistUrgeVictory, showToast]);

    const handleMarkCleanDay = async () => {
        const entry = {
            date: selectedDate,
            status: 'clean',
            noPorn: true,
            noFap: true,
            urgeLevel: Number(urgeLevel || 0),
            trigger: selectedTrigger || '',
            note: dailyNote.trim()
        };

        setAppState((prev) => ({
            ...prev,
            disciplineLogs: {
                ...(prev.disciplineLogs || {}),
                [selectedDate]: { ...entry, updatedAt: Date.now() }
            }
        }));
        setConfirmRelapse(false);
        navigator.vibrate?.([120, 60, 120]);

        await runCloudMutation(
            () => vtaperApi.saveDiscipline(selectedDate, entry),
            'Discipline sync failed'
        );

        showToast(
            selectedDate === todayStr
                ? 'LOCKED IN! Aaj ka din 100% Clean (No Porn + No Masturbation) saved.'
                : `${selectedDate} marked 100% Clean & saved!`
        );
    };

    const handleLogRelapse = async () => {
        const entry = {
            date: selectedDate,
            status: 'relapse',
            noPorn: false,
            noFap: false,
            urgeLevel: Math.max(5, Number(urgeLevel || 7)),
            trigger: selectedTrigger || 'Unspecified Trigger',
            note: dailyNote.trim()
        };

        setAppState((prev) => ({
            ...prev,
            disciplineLogs: {
                ...(prev.disciplineLogs || {}),
                [selectedDate]: { ...entry, updatedAt: Date.now() }
            }
        }));
        setConfirmRelapse(false);

        await runCloudMutation(
            () => vtaperApi.saveDiscipline(selectedDate, entry),
            'Discipline sync failed'
        );

        showToast('Honest log saved. Trigger identify karke turant comeback karein — guilt nahi, data use karein.');
    };

    const handleBeatUrgeQuick = async () => {
        await persistUrgeVictory(selectedTrigger || 'Instant Control');
        navigator.vibrate?.([100]);
        showToast('Urge Defeated (+1)! Aapka prefrontal cortex har baar stronger ho raha hai.');
    };

    const handleDeleteDisciplineDate = async (dateKey) => {
        setAppState((prev) => {
            const next = { ...(prev.disciplineLogs || {}) };
            delete next[dateKey];
            return { ...prev, disciplineLogs: next };
        });
        await runCloudMutation(() => vtaperApi.deleteDiscipline(dateKey), 'Delete failed');
        showToast(`Removed discipline entry for ${dateKey}`);
    };

    const primaryStroke = isDark ? colors.accent : '#0059FF';
    const momentumStroke = colors.success;
    const consistencyStroke = '#FF7A1A';

    const isSelectedClean = existingForSelected?.status === 'clean';
    const isSelectedRelapse = existingForSelected?.status === 'relapse';

    return (
        <div className="vt-stack-5">
            {/* 1. HERO DAILY CHECK-IN COMMAND CARD */}
            <div
                style={{
                    backgroundColor: colors.card,
                    borderColor: isSelectedClean ? colors.accentBorder : colors.border
                }}
                className="vt-card-b2 vt-p-card vt-stack-4"
            >
                <div className="vt-between-start vt-flex-wrap vt-gap-3">
                    <div className="vt-stack-1">
                        <div className="vt-pill-row">
                            <span
                                style={{ backgroundColor: colors.accent, color: colors.accentText }}
                                className="vt-badge-accent"
                            >
                                No Porn • No Masturbation Protocol
                            </span>
                            <span
                                style={{
                                    backgroundColor: colors.elevated,
                                    borderColor: colors.border,
                                    color: isDark ? colors.accent : colors.text
                                }}
                                className="vt-meta-pill font-mono-num"
                            >
                                <Trophy size={14} />
                                <span>{disciplineStats.currentRank.title}</span>
                            </span>
                        </div>
                        <h2 className="vt-hero-heading font-display">
                            Daily Discipline Lock-In & Permanent Habit Elimination
                        </h2>
                        <p className="vt-text-xs" style={{ color: colors.muted }}>
                            Roz raat sone se pehle (ya subah pledge ke baad) 1 tap mein apna clean din lock karein. Har entry directly PostgreSQL mein store hoti hai.
                        </p>
                    </div>

                    <div className="vt-flex vt-items-center vt-gap-1-5 vt-shrink-0">
                        <input
                            type="date"
                            max={todayStr}
                            value={selectedDate}
                            onChange={(e) => setSelectedDate(e.target.value)}
                            style={{
                                backgroundColor: colors.elevated,
                                borderColor: colors.border,
                                color: colors.text
                            }}
                            className="vt-input vt-h-40 vt-px-3 vt-text-xs vt-font-bold font-mono-num"
                        />
                        {selectedDate !== todayStr && (
                            <button
                                type="button"
                                onClick={() => setSelectedDate(todayStr)}
                                style={{
                                    backgroundColor: colors.accent,
                                    color: colors.accentText
                                }}
                                className="vt-btn vt-h-40 vt-px-3 vt-rounded-xl vt-text-11 vt-font-extrabold vt-uppercase"
                            >
                                Today
                            </button>
                        )}
                    </div>
                </div>

                {/* Big 1-Tap Clean Action Row */}
                <div className="vt-grid-md-3 vt-gap-3">
                    <button
                        type="button"
                        onClick={handleMarkCleanDay}
                        style={{
                            backgroundColor: isSelectedClean ? colors.success : colors.accent,
                            color: isSelectedClean ? '#FFFFFF' : colors.accentText,
                            borderColor: isSelectedClean ? colors.success : colors.accentBorder,
                            minHeight: 60
                        }}
                        className="vt-btn vt-col-span-md-2 vt-px-4 vt-py-3 vt-box-xl vt-gap-2-5"
                    >
                        <CheckCircle2 size={22} strokeWidth={2.5} />
                        <div className="vt-text-left">
                            <div className="vt-text-sm vt-font-black vt-uppercase">
                                {isSelectedClean
                                    ? `100% CLEAN LOCKED (${selectedDate}) ✓`
                                    : `MARK ${selectedDate === todayStr ? 'TODAY' : selectedDate} 100% CLEAN`}
                            </div>
                            <div style={{ fontSize: 11, fontWeight: 700, opacity: 0.9 }}>
                                Zero Porn + Zero Masturbation + Growth Streak
                            </div>
                        </div>
                    </button>

                    <button
                        type="button"
                        onClick={handleBeatUrgeQuick}
                        style={{
                            backgroundColor: colors.elevated,
                            borderColor: colors.accentBorder,
                            color: colors.text,
                            minHeight: 60
                        }}
                        className="vt-btn vt-px-4 vt-py-3 vt-box-xl vt-gap-2"
                    >
                        <Zap size={18} style={{ color: isDark ? colors.accent : colors.accent }} />
                        <div className="vt-text-left">
                            <div className="vt-text-xs vt-font-extrabold vt-uppercase">
                                Defeated An Urge (+1)
                            </div>
                            <div className="vt-text-10 font-mono-num" style={{ color: colors.muted }}>
                                Total Beaten: {disciplineStats.urgesDefeated}
                            </div>
                        </div>
                    </button>
                </div>

                {/* Urge Level, Trigger Selector & Honest Slip Log */}
                <div
                    style={{ backgroundColor: colors.elevated, borderColor: colors.border }}
                    className="vt-p-3-5 vt-box-xl vt-stack-3"
                >
                    <div className="vt-between-center vt-flex-wrap vt-gap-2">
                        <span className="vt-text-11 vt-font-extrabold vt-uppercase" style={{ color: colors.muted }}>
                            Urge Intensity Today ({urgeLevel}/10)
                        </span>
                        <input
                            type="range"
                            min="0"
                            max="10"
                            value={urgeLevel}
                            onChange={(e) => setUrgeLevel(Number(e.target.value))}
                            style={{ width: 170, accentColor: colors.accent }}
                        />
                    </div>

                    <div className="vt-row-wrap vt-gap-1-5">
                        {COMMON_URGE_TRIGGERS.map((trig) => {
                            const active = selectedTrigger === trig;
                            return (
                                <button
                                    key={trig}
                                    type="button"
                                    onClick={() => setSelectedTrigger(active ? '' : trig)}
                                    style={{
                                        backgroundColor: active ? colors.accent : colors.card,
                                        color: active ? colors.accentText : colors.text,
                                        borderColor: active ? colors.accentBorder : colors.border
                                    }}
                                    className="vt-btn vt-h-32 vt-px-2-5 vt-rounded-lg vt-border vt-text-11 vt-font-bold"
                                >
                                    {trig}
                                </button>
                            );
                        })}
                    </div>

                    <div className="vt-between-center vt-flex-wrap vt-gap-2">
                        <input
                            type="text"
                            placeholder="Short reflection or note (optional)..."
                            value={dailyNote}
                            onChange={(e) => setDailyNote(e.target.value)}
                            style={{
                                backgroundColor: colors.card,
                                borderColor: colors.border,
                                color: colors.text,
                                flex: 1,
                                minWidth: 190
                            }}
                            className="vt-input vt-h-38 vt-px-3 vt-text-xs"
                        />

                        <div className="vt-flex vt-items-center vt-gap-1-5">
                            {existingForSelected && (
                                <button
                                    type="button"
                                    onClick={() => handleDeleteDisciplineDate(selectedDate)}
                                    style={{ backgroundColor: colors.card, borderColor: colors.border, color: colors.muted }}
                                    className="vt-btn vt-h-38 vt-px-2-5 vt-rounded-lg vt-border vt-text-11 vt-font-bold"
                                >
                                    Clear Date
                                </button>
                            )}
                            {!confirmRelapse ? (
                                <button
                                    type="button"
                                    onClick={() => setConfirmRelapse(true)}
                                    style={{
                                        backgroundColor: isSelectedRelapse ? colors.danger : colors.card,
                                        color: isSelectedRelapse ? '#FFFFFF' : colors.danger,
                                        borderColor: colors.danger
                                    }}
                                    className="vt-btn vt-h-38 vt-px-3 vt-rounded-lg vt-border vt-text-11 vt-font-extrabold vt-uppercase"
                                >
                                    {isSelectedRelapse ? 'Slip Logged' : 'Log Honest Slip'}
                                </button>
                            ) : (
                                <>
                                    <button
                                        type="button"
                                        onClick={handleLogRelapse}
                                        style={{ backgroundColor: colors.danger, color: '#FFFFFF' }}
                                        className="vt-btn vt-h-38 vt-px-3 vt-rounded-lg vt-text-11 vt-font-extrabold vt-uppercase"
                                    >
                                        Confirm Slip
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setConfirmRelapse(false)}
                                        style={{ backgroundColor: colors.card, borderColor: colors.border, color: colors.text }}
                                        className="vt-btn vt-h-38 vt-px-2-5 vt-rounded-lg vt-border vt-text-11 vt-font-bold"
                                    >
                                        Cancel
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* 2. TOP 4 LIVE DISCIPLINE KPI CARDS */}
            <div className="vt-grid-kpi vt-gap-3 vt-tabular">
                <div
                    style={{ backgroundColor: colors.card, borderColor: colors.border }}
                    className="vt-card vt-p-4"
                >
                    <div className="vt-text-xs vt-font-bold vt-uppercase" style={{ color: colors.muted }}>
                        Current Clean Streak
                    </div>
                    <div
                        style={{ color: disciplineStats.currentStreak > 0 ? colors.accent : colors.text }}
                        className="font-display vt-text-3xl vt-font-black vt-mt-1"
                    >
                        {disciplineStats.currentStreak} Days
                    </div>
                    <div className="vt-text-11 font-mono-num" style={{ color: colors.muted }}>
                        Next Rank: {disciplineStats.nextMilestone.title} ({disciplineStats.nextMilestone.days}d)
                    </div>
                </div>

                <div
                    style={{ backgroundColor: colors.card, borderColor: colors.border }}
                    className="vt-card vt-p-4"
                >
                    <div className="vt-text-xs vt-font-bold vt-uppercase" style={{ color: colors.muted }}>
                        All-Time Best Streak
                    </div>
                    <div
                        style={{ color: isDark ? colors.accent : colors.accent }}
                        className="font-display vt-text-3xl vt-font-black vt-mt-1"
                    >
                        {disciplineStats.bestStreak} Days
                    </div>
                    <div className="vt-text-11 font-mono-num" style={{ color: colors.muted }}>
                        Total Clean Days: {disciplineStats.totalCleanDays}
                    </div>
                </div>

                <div
                    style={{ backgroundColor: colors.card, borderColor: colors.border }}
                    className="vt-card vt-p-4"
                >
                    <div className="vt-text-xs vt-font-bold vt-uppercase" style={{ color: colors.muted }}>
                        Clean Discipline Rate
                    </div>
                    <div className="font-display vt-text-3xl vt-font-black vt-mt-1">
                        {disciplineStats.cleanRatePct}%
                    </div>
                    <div className="vt-text-11 font-mono-num" style={{ color: colors.muted }}>
                        {disciplineStats.totalCleanDays} clean • {disciplineStats.totalRelapses} slips
                    </div>
                </div>

                <div
                    style={{ backgroundColor: colors.card, borderColor: colors.border }}
                    className="vt-card vt-p-4"
                >
                    <div className="vt-text-xs vt-font-bold vt-uppercase" style={{ color: colors.muted }}>
                        Urges Conquered
                    </div>
                    <div className="font-display vt-text-3xl vt-font-black vt-mt-1">
                        {disciplineStats.urgesDefeated}
                    </div>
                    <div className="vt-text-11 font-mono-num" style={{ color: colors.muted }}>
                        Each win weakens the old loop
                    </div>
                </div>
            </div>

            {/* 3. MODERN DAILY GROWTH GRAPH + 90-DAY RADIAL REBOOT GAUGE */}
            <div className="vt-grid-lg-3 vt-gap-4">
                <div
                    style={{ backgroundColor: colors.card, borderColor: colors.border }}
                    className="vt-col-span-lg-2 vt-card vt-p-card vt-stack-3 vt-col-between"
                >
                    <div className="vt-between-center vt-flex-wrap vt-gap-2">
                        <div>
                            <h3 className="font-display vt-text-2xl vt-font-black vt-uppercase">
                                {growthChartMode === 'growth'
                                    ? 'Daily Growth Curve (Momentum • Streak • 7-Day Consistency)'
                                    : 'Daily Urge Intensity & Victories Control Chart'}
                            </h3>
                            <p className="vt-text-xs" style={{ color: colors.muted }}>
                                {growthChartMode === 'growth'
                                    ? 'Rozana clean check-in ke saath aapka Discipline Momentum Score aur Active Streak live grow hota hai.'
                                    : 'Green bars = Clean din par urge control • Red bars = Relapse din par urge spike.'}
                            </p>
                        </div>

                        <div className="vt-flex vt-items-center vt-gap-1-5">
                            <button
                                type="button"
                                onClick={() => setGrowthChartMode('growth')}
                                style={{
                                    backgroundColor: growthChartMode === 'growth' ? colors.accent : colors.elevated,
                                    color: growthChartMode === 'growth' ? colors.accentText : colors.text,
                                    borderColor: growthChartMode === 'growth' ? colors.accentBorder : colors.border
                                }}
                                className="vt-btn vt-h-34 vt-px-2-5 vt-rounded-lg vt-border vt-text-10 vt-font-extrabold vt-uppercase"
                            >
                                Growth Curve
                            </button>
                            <button
                                type="button"
                                onClick={() => setGrowthChartMode('urges')}
                                style={{
                                    backgroundColor: growthChartMode === 'urges' ? colors.accent : colors.elevated,
                                    color: growthChartMode === 'urges' ? colors.accentText : colors.text,
                                    borderColor: growthChartMode === 'urges' ? colors.accentBorder : colors.border
                                }}
                                className="vt-btn vt-h-34 vt-px-2-5 vt-rounded-lg vt-border vt-text-10 vt-font-extrabold vt-uppercase"
                            >
                                Urge Control
                            </button>
                        </div>
                    </div>

                    {growthChartMode === 'growth' && (
                        <div className="vt-row-wrap vt-gap-3 vt-text-11 vt-font-bold">
                            <span className="vt-flex vt-items-center vt-gap-1-5">
                                <span className="vt-legend-dot" style={{ backgroundColor: momentumStroke }} />
                                Growth Momentum Score
                            </span>
                            <span className="vt-flex vt-items-center vt-gap-1-5">
                                <span className="vt-legend-dot" style={{ backgroundColor: primaryStroke }} />
                                Active Clean Streak (Days)
                            </span>
                            <span className="vt-flex vt-items-center vt-gap-1-5">
                                <span className="vt-legend-dot" style={{ backgroundColor: consistencyStroke }} />
                                7-Day Consistency (%)
                            </span>
                        </div>
                    )}

                    <div style={{ width: '100%', height: 270 }}>
                        {disciplineStats.dailyGrowthSeries.length > 0 ? (
                            growthChartMode === 'growth' ? (
                                <ResponsiveContainer width="100%" height={270}>
                                    <ComposedChart
                                        data={disciplineStats.dailyGrowthSeries}
                                        margin={{ top: 12, right: 12, left: -12, bottom: 0 }}
                                    >
                                        <defs>
                                            <linearGradient id="vtCleanMomentumGrad" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="0%" stopColor={momentumStroke} stopOpacity={0.38} />
                                                <stop offset="100%" stopColor={momentumStroke} stopOpacity={0.02} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid stroke={colors.border} strokeDasharray="3 3" vertical={false} />
                                        <XAxis dataKey="date" stroke={colors.muted} fontSize={10} tickLine={false} axisLine={false} />
                                        <YAxis yAxisId="left" stroke={colors.muted} fontSize={10} tickLine={false} axisLine={false} />
                                        <YAxis
                                            yAxisId="right"
                                            orientation="right"
                                            domain={[0, 100]}
                                            stroke={colors.muted}
                                            fontSize={10}
                                            tickLine={false}
                                            axisLine={false}
                                        />
                                        <Tooltip
                                            content={
                                                <ModernChartTooltip
                                                    colors={colors}
                                                    suffixMap={{
                                                        momentum: 'pts',
                                                        streak: 'days',
                                                        consistency7d: '%'
                                                    }}
                                                />
                                            }
                                        />
                                        <Area
                                            yAxisId="left"
                                            type="monotone"
                                            dataKey="momentum"
                                            name="Growth Score"
                                            stroke={momentumStroke}
                                            strokeWidth={2.8}
                                            fill="url(#vtCleanMomentumGrad)"
                                            dot={{ r: 4, fill: momentumStroke, stroke: colors.card, strokeWidth: 1.5 }}
                                            activeDot={{ r: 6.5 }}
                                        />
                                        <Line
                                            yAxisId="left"
                                            type="monotone"
                                            dataKey="streak"
                                            name="Clean Streak"
                                            stroke={primaryStroke}
                                            strokeWidth={2.5}
                                            dot={{ r: 4, fill: primaryStroke, stroke: colors.card, strokeWidth: 1.5 }}
                                        />
                                        <Line
                                            yAxisId="right"
                                            type="monotone"
                                            dataKey="consistency7d"
                                            name="7-Day Consistency"
                                            stroke={consistencyStroke}
                                            strokeWidth={2}
                                            strokeDasharray="4 4"
                                            dot={false}
                                        />
                                    </ComposedChart>
                                </ResponsiveContainer>
                            ) : (
                                <ResponsiveContainer width="100%" height={270}>
                                    <ComposedChart
                                        data={disciplineStats.dailyGrowthSeries}
                                        margin={{ top: 12, right: 12, left: -12, bottom: 0 }}
                                    >
                                        <CartesianGrid stroke={colors.border} strokeDasharray="3 3" vertical={false} />
                                        <XAxis dataKey="date" stroke={colors.muted} fontSize={10} tickLine={false} axisLine={false} />
                                        <YAxis domain={[0, 10]} stroke={colors.muted} fontSize={10} tickLine={false} axisLine={false} />
                                        <Tooltip
                                            content={
                                                <ModernChartTooltip
                                                    colors={colors}
                                                    suffixMap={{ urgeLevel: '/ 10', urgesDefeated: 'wins' }}
                                                />
                                            }
                                        />
                                        <Bar
                                            dataKey="urgeLevel"
                                            name="Urge Level"
                                            radius={[8, 8, 2, 2]}
                                            maxBarSize={34}
                                        >
                                            {disciplineStats.dailyGrowthSeries.map((entry, idx) => (
                                                <Cell
                                                    key={`cell-${idx}`}
                                                    fill={entry.status === 'clean' ? colors.success : colors.danger}
                                                />
                                            ))}
                                        </Bar>
                                        <Line
                                            type="monotone"
                                            dataKey="urgesDefeated"
                                            name="Urges Defeated"
                                            stroke={primaryStroke}
                                            strokeWidth={2.5}
                                            dot={{ r: 4, fill: primaryStroke, stroke: colors.card, strokeWidth: 1.5 }}
                                        />
                                    </ComposedChart>
                                </ResponsiveContainer>
                            )
                        ) : (
                            <div
                                style={{ backgroundColor: colors.elevated, borderColor: colors.border, color: colors.muted }}
                                className="vt-h-full vt-box-xl vt-flex vt-items-center vt-justify-center vt-text-xs vt-font-semibold vt-p-4 vt-text-center"
                            >
                                Day 0 se start — upar "MARK TODAY 100% CLEAN" button dabayein aur apna daily growth curve plot hote dekhein.
                            </div>
                        )}
                    </div>
                </div>

                <RebootRadialGauge
                    pct={disciplineStats.rebootPct}
                    currentStreak={disciplineStats.currentStreak}
                    colors={colors}
                    isDark={isDark}
                />
            </div>

            {/* 4. URGE SOS 90-SECOND EMERGENCY BREAKER + 35-DAY HEATMAP */}
            <div className="vt-grid-lg-3 vt-gap-4">
                <div
                    style={{
                        backgroundColor: colors.card,
                        borderColor: sosActive ? colors.danger : colors.border
                    }}
                    className="vt-card vt-p-card vt-stack-3 vt-col-between"
                >
                    <div className="vt-stack-1">
                        <div className="vt-flex vt-items-center vt-gap-2">
                            <ShieldAlert size={18} style={{ color: colors.danger }} />
                            <span className="vt-text-10 vt-font-extrabold vt-uppercase" style={{ color: colors.danger }}>
                                Emergency Circuit Breaker
                            </span>
                        </div>
                        <h3 className="font-display vt-text-2xl vt-font-black vt-uppercase">
                            90-Sec Urge SOS Timer
                        </h3>
                        <p className="vt-text-xs" style={{ color: colors.muted }}>
                            Jab strong urge aaye, turant SOS start karein — 90 second survive karne par dopamine wave 80% gir jaati hai.
                        </p>
                    </div>

                    <div
                        style={{
                            backgroundColor: colors.elevated,
                            borderColor: sosActive ? colors.danger : colors.border,
                            textAlign: 'center'
                        }}
                        className="vt-p-4 vt-box-xl vt-stack-2"
                    >
                        <div
                            className="font-display tabular-nums"
                            style={{
                                fontSize: 44,
                                fontWeight: 900,
                                lineHeight: 1,
                                color: sosActive ? colors.danger : colors.text
                            }}
                        >
                            {sosSecLeft}s
                        </div>
                        <p className="vt-text-xs vt-font-semibold" style={{ color: colors.text }}>
                            {URGE_SOS_ACTIONS[sosTipIdx]}
                        </p>
                    </div>

                    <div className="vt-flex vt-gap-2">
                        <button
                            type="button"
                            onClick={() => setSosActive((p) => !p)}
                            style={{
                                backgroundColor: sosActive ? colors.elevated : colors.danger,
                                color: sosActive ? colors.text : '#FFFFFF',
                                borderColor: colors.danger,
                                flex: 1
                            }}
                            className="vt-btn vt-h-44 vt-rounded-xl vt-border vt-text-xs vt-font-extrabold vt-uppercase"
                        >
                            {sosActive ? 'Pause SOS' : 'Start 90s SOS'}
                        </button>
                        <button
                            type="button"
                            onClick={() => {
                                setSosActive(false);
                                setSosSecLeft(90);
                                setSosTipIdx((i) => (i + 1) % URGE_SOS_ACTIONS.length);
                            }}
                            aria-label="Reset SOS timer"
                            style={{ backgroundColor: colors.elevated, borderColor: colors.border, color: colors.text }}
                            className="vt-icon-btn-44"
                        >
                            <RotateCcw size={16} />
                        </button>
                    </div>
                </div>

                {/* 35-Day Clean Consistency Heatmap + Trigger Breakdown */}
                <div
                    style={{ backgroundColor: colors.card, borderColor: colors.border }}
                    className="vt-col-span-lg-2 vt-card vt-p-card vt-stack-4"
                >
                    <div className="vt-between-center vt-flex-wrap vt-gap-2">
                        <div>
                            <h3 className="font-display vt-text-2xl vt-font-black vt-uppercase">
                                35-Day Clean Wall (5-Week Matrix)
                            </h3>
                            <p className="vt-text-xs" style={{ color: colors.muted }}>
                                Har square ek din hai — kisi bhi din par tap karke log edit karein.
                            </p>
                        </div>

                        <div className="vt-row-wrap vt-gap-3 vt-text-11 vt-font-bold">
                            <span className="vt-flex vt-items-center vt-gap-1-5">
                                <span className="vt-legend-dot" style={{ backgroundColor: colors.accent }} />
                                Clean
                            </span>
                            <span className="vt-flex vt-items-center vt-gap-1-5">
                                <span className="vt-legend-dot" style={{ backgroundColor: colors.danger }} />
                                Slip
                            </span>
                            <span className="vt-flex vt-items-center vt-gap-1-5">
                                <span className="vt-legend-dot" style={{ backgroundColor: colors.elevated }} />
                                Unlogged
                            </span>
                        </div>
                    </div>

                    <div
                        style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(7, minmax(0, 1fr))',
                            gap: 8
                        }}
                    >
                        {disciplineStats.heatmap35.map((cell) => {
                            const bg =
                                cell.status === 'clean'
                                    ? colors.accent
                                    : cell.status === 'relapse'
                                      ? colors.danger
                                      : colors.elevated;

                            return (
                                <button
                                    key={cell.date}
                                    type="button"
                                    onClick={() => setSelectedDate(cell.date)}
                                    title={`${cell.date} — ${cell.status.toUpperCase()}`}
                                    style={{
                                        backgroundColor: bg,
                                        border:
                                            cell.date === selectedDate
                                                ? `2px solid ${colors.text}`
                                                : `1px solid ${colors.border}`,
                                        borderRadius: 8,
                                        height: 36,
                                        color:
                                            cell.status === 'clean'
                                                ? colors.accentText
                                                : cell.status === 'relapse'
                                                  ? '#FFFFFF'
                                                  : colors.muted,
                                        fontSize: 10,
                                        fontWeight: 800,
                                        cursor: 'pointer'
                                    }}
                                    className="font-mono-num"
                                >
                                    {cell.shortDate.slice(3)}
                                </button>
                            );
                        })}
                    </div>

                    {disciplineStats.triggerBreakdown.length > 0 && (
                        <div className="vt-stack-2 vt-pt-2 vt-border-t" style={{ borderColor: colors.border }}>
                            <div className="vt-text-xs vt-font-extrabold vt-uppercase" style={{ color: colors.muted }}>
                                Top Trigger Analysis (Apne Weak Points Pehchanein)
                            </div>
                            <div style={{ width: '100%', height: 150 }}>
                                <ResponsiveContainer width="100%" height={150}>
                                    <BarChart
                                        data={disciplineStats.triggerBreakdown}
                                        layout="vertical"
                                        margin={{ top: 4, right: 16, left: 10, bottom: 4 }}
                                    >
                                        <CartesianGrid stroke={colors.border} strokeDasharray="3 3" horizontal={false} />
                                        <XAxis type="number" allowDecimals={false} stroke={colors.muted} fontSize={10} />
                                        <YAxis type="category" dataKey="trigger" width={120} stroke={colors.muted} fontSize={10} />
                                        <Tooltip content={<ModernChartTooltip colors={colors} suffixMap={{ count: 'logs' }} />} />
                                        <Bar dataKey="count" name="Occurrences" fill={colors.warning} radius={[0, 6, 6, 0]} maxBarSize={18} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* 5. MILESTONES ROADMAP */}
            <div
                style={{ backgroundColor: colors.card, borderColor: colors.border }}
                className="vt-card vt-p-card vt-stack-3"
            >
                <div className="vt-between-center">
                    <div>
                        <h3 className="font-display vt-text-2xl vt-font-black vt-uppercase">
                            Permanent Freedom Milestones (Day 1 → Day 365)
                        </h3>
                        <p className="vt-text-xs" style={{ color: colors.muted }}>
                            Har unlocked rank aapke dimag mein discipline ka naya baseline banata hai.
                        </p>
                    </div>
                    <Target size={20} style={{ color: isDark ? colors.accent : colors.accent }} />
                </div>

                <div className="vt-grid-md-3 vt-gap-2-5">
                    {DISCIPLINE_MILESTONES.map((m) => {
                        const unlocked = disciplineStats.bestStreak >= m.days;
                        return (
                            <div
                                key={m.days}
                                style={{
                                    backgroundColor: unlocked ? colors.accentSurface : colors.elevated,
                                    borderColor: unlocked ? colors.accentBorder : colors.border
                                }}
                                className="vt-p-3 vt-box-xl vt-stack-1"
                            >
                                <div className="vt-between-center">
                                    <span className="vt-text-xs vt-font-extrabold">{m.title}</span>
                                    <span
                                        style={{
                                            backgroundColor: unlocked ? colors.accent : colors.card,
                                            color: unlocked ? colors.accentText : colors.muted,
                                            borderColor: colors.border
                                        }}
                                        className="vt-badge-xs vt-border font-mono-num vt-text-10 vt-font-extrabold"
                                    >
                                        {unlocked ? `UNLOCKED ✓` : `${m.days}d`}
                                    </span>
                                </div>
                                <p className="vt-text-11" style={{ color: colors.muted }}>
                                    {m.benefit}
                                </p>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}

// ============================================================================
// SECTION 10: FULL-SCREEN VISUAL FORM CHART MODAL
// ============================================================================

function FormChartModal({
    initialDayIndex,
    focusExercise = null,
    onClose,
    colors,
    isDark
}) {
    const chartTabs = useMemo(() => {
        const days = [1, 2, 3, 4, 5, 6]
            .map((idx) => WORKOUT_PLAN.find((d) => d.dayIndex === idx))
            .filter(Boolean);

        return [
            ...days,
            {
                dayIndex: 'alternative',
                shortDay: 'Alt',
                dayName: 'Alternative',
                title: '17 Non-Default Exercises',
                chartFile: 'alternative.png',
                chartImage: '/charts/alternative.png'
            }
        ];
    }, []);

    const [viewDayIndex, setViewDayIndex] = useState(
        chartTabs.some((d) => d.dayIndex === initialDayIndex) ? initialDayIndex : 1
    );
    const [zoom, setZoom] = useState(1);
    const [imgError, setImgError] = useState(false);

    const activeChartDay =
        chartTabs.find((d) => d.dayIndex === viewDayIndex) || chartTabs[0];

    useEffect(() => {
        setImgError(false);
        setZoom(1);
    }, [viewDayIndex]);

    useEffect(() => {
        const onKeyDown = (e) => {
            if (e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', onKeyDown);
        return () => window.removeEventListener('keydown', onKeyDown);
    }, [onClose]);

    const cycleZoom = () => {
        setZoom((prev) => (prev === 1 ? 1.5 : prev === 1.5 ? 2 : 1));
    };

    const showFocusBanner = focusExercise && viewDayIndex === initialDayIndex;

    return (
        <div
            onClick={onClose}
            style={{ backgroundColor: 'rgba(0, 0, 0, 0.92)' }}
            className="vt-chart-modal-overlay"
        >
            <div
                onClick={(e) => e.stopPropagation()}
                style={{ backgroundColor: colors.card, borderColor: colors.border }}
                className="vt-chart-modal-box"
            >
                <div style={{ borderColor: colors.border }} className="vt-chart-modal-header">
                    <div className="vt-stack-0-5">
                        <span
                            style={{ backgroundColor: colors.accent, color: colors.accentText }}
                            className="vt-badge-xs vt-text-10 vt-font-extrabold vt-uppercase"
                        >
                            Red Highlight = Target Muscle Pressure
                        </span>
                        <h3 className="font-display vt-text-2xl vt-font-black vt-uppercase">
                            {activeChartDay.dayName}: {activeChartDay.title} Form Chart
                        </h3>
                    </div>

                    <div className="vt-flex vt-items-center vt-gap-1-5">
                        <button
                            type="button"
                            onClick={cycleZoom}
                            style={{
                                backgroundColor: zoom > 1 ? colors.accent : colors.elevated,
                                color: zoom > 1 ? colors.accentText : colors.text,
                                borderColor: zoom > 1 ? colors.accentBorder : colors.border
                            }}
                            className="vt-btn vt-h-38 vt-px-3 vt-rounded-lg vt-border vt-text-11 vt-font-extrabold font-mono-num"
                        >
                            Zoom {Math.round(zoom * 100)}%
                        </button>

                        {zoom > 1 && (
                            <button
                                type="button"
                                onClick={() => setZoom(1)}
                                aria-label="Reset zoom"
                                style={{
                                    backgroundColor: colors.elevated,
                                    borderColor: colors.border,
                                    color: colors.text
                                }}
                                className="vt-icon-btn-44"
                            >
                                <RotateCcw size={16} />
                            </button>
                        )}

                        <button
                            type="button"
                            onClick={onClose}
                            aria-label="Close chart modal"
                            style={{
                                backgroundColor: colors.elevated,
                                borderColor: colors.border,
                                color: colors.text
                            }}
                            className="vt-icon-btn-44"
                        >
                            <X size={20} />
                        </button>
                    </div>
                </div>

                {showFocusBanner && (
                    <div
                        style={{
                            backgroundColor: colors.accentSurface,
                            borderColor: colors.accentBorder
                        }}
                        className="vt-chart-focus-strip"
                    >
                        <Sparkles
                            size={15}
                            style={{
                                color: isDark ? colors.accent : colors.text,
                                flexShrink: 0
                            }}
                        />
                        <span className="vt-text-xs vt-font-extrabold">
                            Chart mein Panel #{focusExercise.number} dekhein: {focusExercise.name}
                        </span>
                    </div>
                )}

                <div style={{ borderColor: colors.border }} className="vt-chart-day-tabs">
                    {chartTabs.map((day) => {
                        const active = viewDayIndex === day.dayIndex;
                        return (
                            <button
                                key={day.dayIndex}
                                type="button"
                                onClick={() => setViewDayIndex(day.dayIndex)}
                                style={{
                                    backgroundColor: active ? colors.accent : colors.elevated,
                                    color: active ? colors.accentText : colors.text,
                                    borderColor: active ? colors.accentBorder : colors.border
                                }}
                                className="vt-btn vt-h-34 vt-px-3 vt-rounded-lg vt-border vt-text-11 vt-font-extrabold vt-uppercase vt-nowrap"
                            >
                                {day.dayIndex === 'alternative'
                                    ? 'Alternative'
                                    : `${day.shortDay} • ${day.title}`}
                            </button>
                        );
                    })}
                </div>

                <div style={{ backgroundColor: colors.elevated }} className="vt-chart-modal-body">
                    {imgError ? (
                        <div
                            style={{
                                backgroundColor: colors.card,
                                borderColor: colors.warning,
                                color: colors.text
                            }}
                            className="vt-chart-missing-box"
                        >
                            <AlertTriangle size={28} style={{ color: colors.warning }} />
                            <div className="vt-font-extrabold vt-text-sm">
                                Photo missing: <code>public/charts/{activeChartDay.chartFile}</code>
                            </div>
                            <p className="vt-text-xs" style={{ color: colors.muted }}>
                                Apni image ko <strong>public/charts/{activeChartDay.chartFile}</strong> naam se save karein aur page refresh karein—yahan turant high-res chart load ho jayega.
                            </p>
                        </div>
                    ) : (
                        <div className="vt-chart-img-scroll">
                            <img
                                src={activeChartDay.chartImage}
                                alt={`${activeChartDay.dayName} ${activeChartDay.title} Form Chart`}
                                onClick={cycleZoom}
                                onError={() => setImgError(true)}
                                style={{
                                    width: `${zoom * 100}%`,
                                    maxWidth: zoom === 1 ? '680px' : 'none',
                                    cursor: zoom >= 2 ? 'zoom-out' : 'zoom-in'
                                }}
                                className="vt-chart-full-img"
                            />
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

// ============================================================================
// SECTION 11: TODAY VIEW (EXACT LAST WORKOUT RECALL + ALL-TIME PR + HISTORY)
// ============================================================================

function TodayView({
    colors,
    isDark,
    appState,
    setAppState,
    selectedDayIndex,
    setSelectedDayIndex,
    activeDayPlan,
    dayRecall,
    recallLoading,
    workoutRunning,
    setWorkoutRunning,
    workoutElapsedSec,
    setWorkoutElapsedSec,
    savingWorkout,
    formatTime,
    formatWeight,
    getEffectiveSetCount,
    handleSetInputChange,
    handleToggleSetComplete,
    handleApplyOverloadWeight,
    handleCopyLastSessionSets,
    handleFinishWorkout,
    setRestTimer,
    showToast
}) {
    const [openGuides, setOpenGuides] = useState({});
    const [openHistory, setOpenHistory] = useState({});
    const [chartModalState, setChartModalState] = useState(null);
    const [thumbFailed, setThumbFailed] = useState(false);

    useEffect(() => {
        setThumbFailed(false);
    }, [activeDayPlan.dayIndex]);

    const toggleGuide = (exerciseId) => {
        setOpenGuides((prev) => ({ ...prev, [exerciseId]: !prev[exerciseId] }));
    };

    const toggleHistory = (exerciseId) => {
        setOpenHistory((prev) => ({ ...prev, [exerciseId]: !prev[exerciseId] }));
    };

    const orderedDays = [1, 2, 3, 4, 5, 6, 0].map((idx) =>
        WORKOUT_PLAN.find((d) => d.dayIndex === idx)
    );

    // Fallback recall from local state if offline
    const fallbackLastSession = useMemo(() => {
        const matches = (appState.workoutHistory || []).filter(
            (h) => Number(h.dayIndex) === Number(activeDayPlan.dayIndex)
        );
        return matches[0] || null;
    }, [appState.workoutHistory, activeDayPlan.dayIndex]);

    const effectiveLastSession = dayRecall?.lastSession || fallbackLastSession;

    const sessionProgress = useMemo(() => {
        if (activeDayPlan.isRest) {
            return { completedSets: 0, totalSets: 0, volumeKg: 0, overloadReadyCount: 0, pct: 0 };
        }
        let completedSets = 0;
        let totalSets = 0;
        let volumeKg = 0;
        let overloadReadyCount = 0;

        activeDayPlan.exercises.forEach((ex) => {
            const limit = getEffectiveSetCount(ex);
            const sets = (appState.activeDrafts[ex.id] || []).slice(0, limit);
            const exRecall = dayRecall?.exercises?.[ex.id];
            const prev =
                exRecall?.lastSets?.length > 0
                    ? exRecall.lastSets
                    : appState.lastSessionLogs[ex.id] || [];
            const activeVar = appState.variantChoices?.[ex.id] || null;
            if (
                calculateProgressiveOverload(ex, prev, appState.customSteps || {}, activeVar)
                    .shouldIncrease
            ) {
                overloadReadyCount++;
            }
            totalSets += limit;
            sets.forEach((s) => {
                if (s.completed) {
                    completedSets++;
                    const mult = ex.flags?.unilateral ? 2 : 1;
                    volumeKg += Number(s.weight || 0) * Number(s.reps || 0) * mult;
                }
            });
        });

        const pct = totalSets > 0 ? Math.round((completedSets / totalSets) * 100) : 0;
        return { completedSets, totalSets, volumeKg: Math.round(volumeKg), overloadReadyCount, pct };
    }, [
        activeDayPlan,
        appState.activeDrafts,
        appState.lastSessionLogs,
        appState.customSteps,
        appState.variantChoices,
        dayRecall,
        getEffectiveSetCount
    ]);

    const firstCompoundWorkingWeightKg = useMemo(() => {
        if (activeDayPlan.isRest || !activeDayPlan.exercises.length) return 0;
        const firstEx = activeDayPlan.exercises[0];
        const draft = appState.activeDrafts[firstEx.id]?.[0]?.weight;
        const recallW = dayRecall?.exercises?.[firstEx.id]?.lastSets?.[0]?.weight;
        const prev = appState.lastSessionLogs[firstEx.id]?.[0]?.weight;
        return Number(draft || recallW || prev || 0);
    }, [activeDayPlan, appState.activeDrafts, appState.lastSessionLogs, dayRecall]);

    const roundToPlate = (kg) => Math.max(0, Math.round(kg / 2.5) * 2.5);

    return (
        <div className="vt-stack-4">
            {/* 7-Day Selector Bar */}
            <div
                style={{ backgroundColor: colors.card, borderColor: colors.border }}
                className="vt-day-bar"
            >
                {orderedDays.map((day) => {
                    const isSelected = day.dayIndex === selectedDayIndex;
                    return (
                        <button
                            key={day.dayIndex}
                            onClick={() => setSelectedDayIndex(day.dayIndex)}
                            style={{
                                backgroundColor: isSelected ? colors.accent : colors.elevated,
                                color: isSelected ? colors.accentText : colors.text,
                                borderColor: isSelected ? colors.accentBorder : colors.border
                            }}
                            className="vt-day-btn"
                        >
                            <div className="vt-day-btn-top">
                                <span className="vt-day-short">{day.shortDay}</span>
                            </div>
                            <span className="vt-day-sub" style={{ opacity: isSelected ? 0.95 : 0.75 }}>
                                {day.isRest ? 'Rest' : day.title}
                            </span>
                        </button>
                    );
                })}
            </div>

            {/* LAST TIME YOU DID THIS EXACT WORKOUT DAY — RECALL CARD */}
            {!activeDayPlan.isRest && (effectiveLastSession || recallLoading) && (
                <div
                    style={{
                        backgroundColor: colors.accentSurface,
                        borderColor: colors.accentBorder
                    }}
                    className="vt-card-b2 vt-p-4 vt-resp-row-md vt-tabular"
                >
                    <div className="vt-stack-1">
                        <div className="vt-flex vt-items-center vt-gap-2 vt-flex-wrap">
                            <History size={16} style={{ color: isDark ? colors.accent : colors.text }} />
                            <span className="vt-text-xs vt-font-extrabold vt-uppercase vt-tracking-wider">
                                Last {activeDayPlan.title} Recall
                                {dayRecall?.totalCompletedSessions
                                    ? ` (${dayRecall.totalCompletedSessions} Sessions Logged)`
                                    : ''}
                            </span>
                            {effectiveLastSession?.date && (
                                <span
                                    style={{ backgroundColor: colors.card, borderColor: colors.border }}
                                    className="vt-badge-xs vt-border font-mono-num vt-text-10 vt-font-extrabold"
                                >
                                    {effectiveLastSession.date}
                                    {typeof effectiveLastSession.daysAgo === 'number'
                                        ? effectiveLastSession.daysAgo === 0
                                            ? ' (Today)'
                                            : ` (${effectiveLastSession.daysAgo}d ago)`
                                        : ''}
                                </span>
                            )}
                        </div>
                        {recallLoading && !effectiveLastSession ? (
                            <p className="vt-text-xs" style={{ color: colors.muted }}>
                                Loading previous session weights from PostgreSQL...
                            </p>
                        ) : (
                            <p className="vt-text-xs" style={{ color: colors.muted }}>
                                Pichli baar tumne{' '}
                                <strong style={{ color: colors.text }}>
                                    {formatWeight(effectiveLastSession.totalVolumeKg)} {appState.unit}
                                </strong>{' '}
                                volume ({effectiveLastSession.setsCompleted} sets
                                {effectiveLastSession.prsCount > 0 ? `, ${effectiveLastSession.prsCount} PRs` : ''}) lift kiya tha.
                                {typeof dayRecall?.volumeDiffKg === 'number' && (
                                    <>
                                        {' '}
                                        Usse pehle se{' '}
                                        <strong
                                            style={{
                                                color: dayRecall.volumeDiffKg >= 0 ? colors.success : colors.danger
                                            }}
                                        >
                                            {dayRecall.volumeDiffKg >= 0 ? '+' : ''}
                                            {formatWeight(dayRecall.volumeDiffKg)} {appState.unit}
                                        </strong>
                                        .
                                    </>
                                )}{' '}
                                Neeche har exercise mein exact pichli baar ka weight × reps aur PR dikha raha hai!
                            </p>
                        )}
                    </div>

                    {effectiveLastSession && (
                        <div className="vt-flex vt-items-center vt-gap-3 vt-shrink-0 font-mono-num">
                            <div className="vt-text-right">
                                <div className="vt-text-10 vt-uppercase vt-font-bold" style={{ color: colors.muted }}>
                                    Target To Beat
                                </div>
                                <div
                                    className="font-display vt-text-2xl vt-font-black"
                                    style={{ color: isDark ? colors.accent : colors.text }}
                                >
                                    {formatWeight(effectiveLastSession.totalVolumeKg)} {appState.unit}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Bento Header Summary + Warm-up & Ramp-in Controls */}
            <div className="vt-bento-3">
                <div
                    style={{ backgroundColor: colors.card, borderColor: colors.border }}
                    className="vt-card vt-span-2-lg vt-today-hero-card"
                >
                    <div className="vt-today-hero-top">
                        <div>
                            <div className="vt-pill-row">
                                <span
                                    style={{ backgroundColor: colors.accent, color: colors.accentText }}
                                    className="vt-badge-accent"
                                >
                                    {activeDayPlan.dayName}
                                </span>
                                <span
                                    style={{
                                        backgroundColor: colors.elevated,
                                        borderColor: colors.border,
                                        color: colors.muted
                                    }}
                                    className="vt-meta-pill tabular-nums"
                                >
                                    <Clock size={14} />
                                    <span>~{activeDayPlan.estimatedMinutes} min</span>
                                </span>
                                {!activeDayPlan.isRest && (
                                    <button
                                        onClick={() =>
                                            setAppState((prev) => ({
                                                ...prev,
                                                rampInEnabled: !prev.rampInEnabled
                                            }))
                                        }
                                        style={{
                                            backgroundColor: appState.rampInEnabled
                                                ? colors.accentSurface
                                                : colors.elevated,
                                            borderColor: appState.rampInEnabled ? colors.accentBorder : colors.border,
                                            color: colors.text
                                        }}
                                        className="vt-ramp-btn"
                                    >
                                        {appState.rampInEnabled
                                            ? 'Wk 1–2 Ramp-In: ON (Max 3 sets @ 3–4 RIR)'
                                            : 'Full Volume: ON (1–3 RIR)'}
                                    </button>
                                )}
                            </div>
                            <h2 className="vt-hero-heading font-display">
                                {activeDayPlan.title}: {activeDayPlan.subtitle}
                            </h2>
                        </div>

                        {!activeDayPlan.isRest && (
                            <div className="vt-workout-actions">
                                <button
                                    onClick={() => setWorkoutRunning((prev) => !prev)}
                                    style={{
                                        backgroundColor: colors.elevated,
                                        borderColor: colors.border,
                                        color: colors.text
                                    }}
                                    className="vt-timer-btn font-mono-num"
                                >
                                    {workoutRunning ? <Pause size={16} /> : <Play size={16} />}
                                    <span>
                                        {workoutRunning || workoutElapsedSec > 0
                                            ? formatTime(workoutElapsedSec)
                                            : 'Start Timer'}
                                    </span>
                                </button>
                                {workoutElapsedSec > 0 && (
                                    <button
                                        onClick={() => {
                                            setWorkoutRunning(false);
                                            setWorkoutElapsedSec(0);
                                        }}
                                        aria-label="Reset workout timer"
                                        style={{
                                            backgroundColor: colors.elevated,
                                            borderColor: colors.border,
                                            color: colors.muted
                                        }}
                                        className="vt-reset-timer-btn"
                                    >
                                        <RotateCcw size={16} />
                                    </button>
                                )}
                                <button
                                    disabled={savingWorkout}
                                    onClick={handleFinishWorkout}
                                    style={{
                                        backgroundColor: colors.accent,
                                        color: colors.accentText,
                                        borderColor: colors.accentBorder,
                                        opacity: savingWorkout ? 0.7 : 1
                                    }}
                                    className="vt-finish-btn"
                                >
                                    <Check size={16} strokeWidth={2.5} />
                                    <span>{savingWorkout ? 'Saving DB...' : 'Finish Workout'}</span>
                                </button>
                            </div>
                        )}
                    </div>

                    {!activeDayPlan.isRest && (
                        <>
                            <div className="vt-hero-metrics" style={{ borderColor: colors.border }}>
                                <div>
                                    <div className="vt-stat-caption" style={{ color: colors.muted }}>
                                        Sets Logged
                                    </div>
                                    <div className="vt-metric-val font-display">
                                        {sessionProgress.completedSets} / {sessionProgress.totalSets}
                                    </div>
                                </div>
                                <div>
                                    <div className="vt-stat-caption" style={{ color: colors.muted }}>
                                        Live Volume
                                    </div>
                                    <div className="vt-metric-val font-display">
                                        {formatWeight(sessionProgress.volumeKg)} {appState.unit}
                                    </div>
                                </div>
                                <div>
                                    <div className="vt-stat-caption" style={{ color: colors.muted }}>
                                        Effort Target
                                    </div>
                                    <div
                                        style={{ color: isDark ? colors.accent : colors.text }}
                                        className="vt-metric-val font-display"
                                    >
                                        {appState.rampInEnabled ? '3–4 RIR' : '1–3 RIR'}
                                    </div>
                                </div>
                            </div>

                            <div className="vt-stack-1">
                                <div
                                    className="vt-between-center vt-text-11 font-mono-num"
                                    style={{ color: colors.muted }}
                                >
                                    <span>
                                        Session Progress ({sessionProgress.pct}%)
                                        {sessionProgress.overloadReadyCount > 0
                                            ? ` • ${sessionProgress.overloadReadyCount} Overload Ready`
                                            : ''}
                                    </span>
                                    <span>
                                        {Math.max(0, sessionProgress.totalSets - sessionProgress.completedSets)} sets left
                                    </span>
                                </div>
                                <div style={{ backgroundColor: colors.elevated }} className="vt-progress-track-sm">
                                    <div
                                        style={{
                                            width: `${sessionProgress.pct}%`,
                                            backgroundColor: colors.accent
                                        }}
                                        className="vt-progress-fill"
                                    />
                                </div>
                            </div>
                        </>
                    )}
                </div>

                {/* Warm-Up Protocol Card */}
                <div
                    style={{ backgroundColor: colors.card, borderColor: colors.border }}
                    className="vt-card vt-warmup-card"
                >
                    <div>
                        <div className="vt-track-label" style={{ color: colors.muted }}>
                            Warm-Up & Rest Protocol
                        </div>
                        <h3 className="vt-warmup-title font-display">
                            5 Min Cardio + 3 Compound Ramp Sets
                        </h3>
                        {!activeDayPlan.isRest && (
                            <div className="vt-warmup-list tabular-nums" style={{ color: colors.muted }}>
                                {firstCompoundWorkingWeightKg > 0 ? (
                                    <p>
                                        <strong style={{ color: colors.text }}>1st Compound Ramp:</strong>{' '}
                                        {formatWeight(roundToPlate(firstCompoundWorkingWeightKg * 0.5))}
                                        {appState.unit} × 8 →{' '}
                                        {formatWeight(roundToPlate(firstCompoundWorkingWeightKg * 0.7))}
                                        {appState.unit} × 5 →{' '}
                                        {formatWeight(roundToPlate(firstCompoundWorkingWeightKg * 0.85))}
                                        {appState.unit} × 3
                                    </p>
                                ) : (
                                    <p>
                                        <strong style={{ color: colors.text }}>1st Compound Ramp:</strong> Enter working weight in Set #1 to auto-calculate 50% / 70% / 85% warm-ups.
                                    </p>
                                )}
                                <p>
                                    <strong style={{ color: colors.text }}>Isolations:</strong> 1 light feeler set only.
                                </p>
                            </div>
                        )}
                    </div>

                    <div className="vt-rest-presets tabular-nums">
                        <button
                            onClick={() =>
                                setRestTimer({
                                    active: true,
                                    paused: false,
                                    remainingSec: 150,
                                    totalSec: 150,
                                    exerciseName: 'Heavy Compound Rest',
                                    exerciseType: 'compound'
                                })
                            }
                            style={{ backgroundColor: colors.elevated, borderColor: colors.border, color: colors.text }}
                            className="vt-preset-btn"
                        >
                            <Clock size={14} />
                            <span>150s Heavy</span>
                        </button>
                        <button
                            onClick={() =>
                                setRestTimer({
                                    active: true,
                                    paused: false,
                                    remainingSec: 75,
                                    totalSec: 75,
                                    exerciseName: 'Isolation Lift Rest',
                                    exerciseType: 'isolation'
                                })
                            }
                            style={{ backgroundColor: colors.elevated, borderColor: colors.border, color: colors.text }}
                            className="vt-preset-btn"
                        >
                            <Zap size={14} />
                            <span>75s Iso</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* Today's Visual Form Chart Preview Banner */}
            {!activeDayPlan.isRest && activeDayPlan.chartImage && (
                <div
                    style={{ backgroundColor: colors.card, borderColor: colors.border }}
                    className="vt-card vt-p-4 vt-chart-preview-bar"
                >
                    <div className="vt-chart-preview-left">
                        {!thumbFailed ? (
                            <img
                                src={activeDayPlan.chartImage}
                                alt={`${activeDayPlan.dayName} Visual Form Chart`}
                                onClick={() =>
                                    setChartModalState({
                                        dayIndex: activeDayPlan.dayIndex,
                                        focusExercise: null
                                    })
                                }
                                onError={() => setThumbFailed(true)}
                                style={{ borderColor: colors.border }}
                                className="vt-chart-thumb"
                            />
                        ) : (
                            <div
                                onClick={() =>
                                    setChartModalState({
                                        dayIndex: activeDayPlan.dayIndex,
                                        focusExercise: null
                                    })
                                }
                                style={{
                                    backgroundColor: colors.elevated,
                                    borderColor: colors.border,
                                    color: colors.muted
                                }}
                                className="vt-chart-thumb-placeholder font-mono-num"
                            >
                                {activeDayPlan.chartFile}
                            </div>
                        )}

                        <div className="vt-stack-0-5">
                            <div className="vt-row-wrap vt-gap-1-5">
                                <span
                                    style={{ backgroundColor: colors.accent, color: colors.accentText }}
                                    className="vt-badge-xs vt-text-10 vt-font-extrabold vt-uppercase"
                                >
                                    Visual Form Chart
                                </span>
                                <span className="vt-text-10 font-mono-num" style={{ color: colors.muted }}>
                                    /charts/{activeDayPlan.chartFile}
                                </span>
                            </div>
                            <div className="vt-font-extrabold vt-text-sm">
                                {activeDayPlan.dayName} ({activeDayPlan.title}) — Saari 7 Exercises Ka Sahi Posture & Red Target Muscle
                            </div>
                            <div className="vt-text-xs" style={{ color: colors.muted }}>
                                Set se pehle 1 tap mein full-screen zoom karke exact angle aur position verify karein.
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Sunday Rest Day View */}
            {activeDayPlan.isRest ? (
                <div
                    style={{ backgroundColor: colors.card, borderColor: colors.border }}
                    className="vt-card vt-rest-day-card"
                >
                    <div
                        style={{ backgroundColor: colors.accent, color: colors.accentText }}
                        className="vt-rest-day-icon"
                    >
                        <Footprints size={32} />
                    </div>
                    <h3 className="vt-section-title vt-section-title-lg font-display">
                        Sunday Active Recovery: 20–30 Min Easy Walk
                    </h3>
                    <p style={{ color: colors.muted }} className="vt-rest-day-desc">
                        Light mobility, no lifting. Keep nutrition identical to training days (2,900 kcal & 130 g protein from whole Indian foods) and sleep ≥ 7.5 hours.
                    </p>
                    <div className="vt-row-wrap vt-gap-2" style={{ justifyContent: 'center' }}>
                        <button
                            onClick={() => {
                                setAppState((prev) => ({ ...prev, sundayWalkDone: !prev.sundayWalkDone }));
                                showToast('Sunday 20–30 min walk status saved to PostgreSQL!');
                            }}
                            style={{
                                backgroundColor: appState.sundayWalkDone ? colors.accent : colors.elevated,
                                color: appState.sundayWalkDone ? colors.accentText : colors.text,
                                borderColor: appState.sundayWalkDone ? colors.accentBorder : colors.border
                            }}
                            className="vt-walk-btn"
                        >
                            <Check size={16} strokeWidth={2.5} />
                            <span>
                                {appState.sundayWalkDone
                                    ? '20–30 Min Walk Completed ✓'
                                    : 'Mark 20–30 Min Walk Complete'}
                            </span>
                        </button>
                        <button
                            type="button"
                            onClick={() => setChartModalState({ dayIndex: 1, focusExercise: null })}
                            style={{
                                backgroundColor: colors.elevated,
                                borderColor: colors.border,
                                color: colors.text
                            }}
                            className="vt-walk-btn"
                        >
                            <Sparkles size={15} />
                            <span>Revise Mon–Sat Form Charts</span>
                        </button>
                    </div>
                </div>
            ) : (
                /* Exercise Cards List */
                <div className="vt-stack-3-5">
                    {activeDayPlan.exercises.map((exercise, exIdx) => {
                        const limit = getEffectiveSetCount(exercise);
                        const existingDraft = appState.activeDrafts[exercise.id];
                        const draftSets = Array.from({ length: limit }, (_, idx) => {
                            if (existingDraft?.[idx]) return existingDraft[idx];
                            return {
                                setNumber: idx + 1,
                                weight: 0,
                                reps: 0,
                                completed: false
                            };
                        });

                        const exRecall = dayRecall?.exercises?.[exercise.id] || null;
                        const prevSets =
                            exRecall?.lastSets?.length > 0
                                ? exRecall.lastSets
                                : appState.lastSessionLogs[exercise.id] || [];
                        const recentSessions = exRecall?.recentSessions || [];

                        const activeVariantId =
                            appState.variantChoices?.[exercise.id] ||
                            exercise.flags?.variants?.[0]?.id ||
                            null;
                        const activeVariantObj = exercise.flags?.variants?.find(
                            (v) => v.id === activeVariantId
                        );
                        const swappedName = appState.swappedAlternatives?.[exercise.id];
                        const displayName =
                            swappedName || (activeVariantObj ? activeVariantObj.name : exercise.name);
                        const activeStepCode = activeVariantObj ? activeVariantObj.step : exercise.step;
                        const isAssisted = Boolean(
                            activeVariantObj ? activeVariantObj.assisted : exercise.flags?.assisted
                        );
                        const isGuideOpen = Boolean(openGuides[exercise.id]);
                        const isHistOpen = Boolean(openHistory[exercise.id]);
                        const allSetsDone = draftSets.length > 0 && draftSets.every((s) => s.completed);

                        const overload = calculateProgressiveOverload(
                            exercise,
                            prevSets,
                            appState.customSteps || {},
                            activeVariantId
                        );

                        return (
                            <div
                                key={exercise.id}
                                style={{
                                    backgroundColor: colors.card,
                                    borderColor: allSetsDone ? colors.accentBorder : colors.border
                                }}
                                className="vt-card vt-p-card vt-stack-3-5"
                            >
                                <div className="vt-between-start vt-gap-2-5">
                                    <div className="vt-stack-1 vt-min-w-0 vt-flex-1">
                                        <div className="vt-row-wrap vt-gap-1-5">
                                            <span
                                                style={{
                                                    backgroundColor: allSetsDone ? colors.accent : colors.elevated,
                                                    color: allSetsDone ? colors.accentText : colors.text,
                                                    borderColor: allSetsDone ? colors.accentBorder : colors.border
                                                }}
                                                className="vt-badge vt-border vt-text-11 vt-font-extrabold font-mono-num"
                                            >
                                                #{exIdx + 1}
                                            </span>
                                            {exercise.flags?.updatedInV2 && (
                                                <span
                                                    style={{ backgroundColor: colors.accent, color: colors.accentText }}
                                                    className="vt-badge-xs vt-text-10 vt-font-extrabold vt-uppercase"
                                                >
                                                    ★ V-Taper Priority
                                                </span>
                                            )}
                                            {allSetsDone && (
                                                <span
                                                    style={{
                                                        backgroundColor: colors.accentSurface,
                                                        borderColor: colors.accentBorder,
                                                        color: isDark ? colors.accent : colors.text
                                                    }}
                                                    className="vt-badge-xs vt-border vt-text-10 vt-font-extrabold vt-uppercase"
                                                >
                                                    Done ✓
                                                </span>
                                            )}
                                            <h3 className="font-display vt-text-resp-2xl-3xl vt-font-black vt-uppercase vt-tracking-wide vt-leading-tight">
                                                {displayName}
                                            </h3>
                                        </div>

                                        <div className="vt-row-wrap vt-gap-1-5 vt-pt-0-5">
                                            <span
                                                style={{
                                                    backgroundColor: colors.elevated,
                                                    borderColor: colors.border,
                                                    color: isDark ? colors.accent : colors.text
                                                }}
                                                className="vt-badge vt-border vt-text-11 vt-font-extrabold vt-uppercase"
                                            >
                                                {exercise.targetMuscle}
                                            </span>
                                            {exercise.secondaryGroups?.length > 0 && (
                                                <span
                                                    style={{
                                                        backgroundColor: colors.elevated,
                                                        borderColor: colors.border,
                                                        color: colors.muted
                                                    }}
                                                    className="vt-badge vt-border vt-text-11 vt-font-semibold"
                                                >
                                                    sec: {exercise.secondaryGroups.join(', ')}
                                                </span>
                                            )}
                                            <span
                                                style={{
                                                    backgroundColor: colors.elevated,
                                                    borderColor: colors.border,
                                                    color: colors.muted
                                                }}
                                                className="vt-badge vt-border vt-text-11 vt-font-bold font-mono-num"
                                            >
                                                {exercise.type} • {exercise.restSec}s rest • Step {activeStepCode}
                                            </span>
                                            {exRecall && exRecall.allTimeBestWeightKg > 0 && (
                                                <span
                                                    style={{
                                                        backgroundColor: colors.accentSurface,
                                                        borderColor: colors.accentBorder,
                                                        color: isDark ? colors.accent : colors.text
                                                    }}
                                                    className="vt-badge vt-border vt-text-11 vt-font-extrabold font-mono-num"
                                                >
                                                    PR: {isAssisted ? 'Assist ' : ''}
                                                    {formatWeight(exRecall.allTimeBestWeightKg)}
                                                    {appState.unit} × {exRecall.allTimeBestReps}
                                                    {!isAssisted && exRecall.allTimeBestE1RM > 0
                                                        ? ` (e1RM ${formatWeight(exRecall.allTimeBestE1RM)})`
                                                        : ''}
                                                </span>
                                            )}
                                        </div>

                                        {exercise.flags?.variants && (
                                            <div className="vt-row-wrap vt-gap-1-5 vt-pt-1">
                                                <span className="vt-text-11 vt-font-bold vt-uppercase" style={{ color: colors.muted }}>
                                                    Variant:
                                                </span>
                                                {exercise.flags.variants.map((v) => {
                                                    const isChosen = activeVariantId === v.id;
                                                    return (
                                                        <button
                                                            key={v.id}
                                                            type="button"
                                                            onClick={() =>
                                                                setAppState((prev) => ({
                                                                    ...prev,
                                                                    variantChoices: {
                                                                        ...(prev.variantChoices || {}),
                                                                        [exercise.id]: v.id
                                                                    }
                                                                }))
                                                            }
                                                            style={{
                                                                backgroundColor: isChosen ? colors.accent : colors.elevated,
                                                                color: isChosen ? colors.accentText : colors.text,
                                                                borderColor: isChosen ? colors.accentBorder : colors.border
                                                            }}
                                                            className="vt-btn vt-h-36 vt-px-2-5 vt-py-1 vt-rounded-lg vt-border vt-text-xs vt-font-extrabold"
                                                        >
                                                            {v.name}
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        )}

                                        {exercise.alternatives?.length > 0 && (
                                            <div className="vt-row-wrap vt-gap-1-5 vt-pt-1">
                                                <span className="vt-text-11 vt-font-bold vt-uppercase" style={{ color: colors.muted }}>
                                                    Busy? Swap:
                                                </span>
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        setAppState((prev) => {
                                                            const next = { ...(prev.swappedAlternatives || {}) };
                                                            delete next[exercise.id];
                                                            return { ...prev, swappedAlternatives: next };
                                                        })
                                                    }
                                                    style={{
                                                        backgroundColor: !swappedName ? colors.accentSurface : colors.elevated,
                                                        borderColor: !swappedName ? colors.accentBorder : colors.border,
                                                        color: colors.text
                                                    }}
                                                    className="vt-btn vt-h-32 vt-px-2 vt-py-0-5 vt-rounded-lg vt-border vt-text-11 vt-font-bold"
                                                >
                                                    Default
                                                </button>
                                                {exercise.alternatives.map((alt) => {
                                                    const isSwapped = swappedName === alt;
                                                    return (
                                                        <button
                                                            key={alt}
                                                            type="button"
                                                            onClick={() =>
                                                                setAppState((prev) => ({
                                                                    ...prev,
                                                                    swappedAlternatives: {
                                                                        ...(prev.swappedAlternatives || {}),
                                                                        [exercise.id]: alt
                                                                    }
                                                                }))
                                                            }
                                                            style={{
                                                                backgroundColor: isSwapped ? colors.accent : colors.elevated,
                                                                color: isSwapped ? colors.accentText : colors.text,
                                                                borderColor: isSwapped ? colors.accentBorder : colors.border
                                                            }}
                                                            className="vt-btn vt-h-32 vt-px-2 vt-py-0-5 vt-rounded-lg vt-border vt-text-11 vt-font-bold"
                                                        >
                                                            {alt}
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        )}

                                        <p
                                            style={{ color: colors.muted }}
                                            className="vt-text-resp-xs-sm vt-flex vt-items-start vt-gap-1-5 vt-pt-1"
                                        >
                                            <Info
                                                className="vt-icon-4 vt-shrink-0 vt-mt-0-5"
                                                style={{ color: isDark ? colors.accent : colors.text }}
                                            />
                                            <span>
                                                <strong style={{ color: colors.text }}>Quick Cue:</strong> {exercise.cue}
                                            </span>
                                        </p>
                                    </div>

                                    <div
                                        style={{ backgroundColor: colors.elevated, borderColor: colors.border }}
                                        className="vt-px-3 vt-py-1-5 vt-box-xl vt-text-right vt-tabular vt-shrink-0"
                                    >
                                        <div className="vt-text-10 vt-font-bold vt-uppercase" style={{ color: colors.muted }}>
                                            Sets × Reps
                                        </div>
                                        <div className="font-display vt-text-resp-xl-2xl vt-font-extrabold">
                                            {limit} × {exercise.repLabel}
                                        </div>
                                    </div>
                                </div>

                                {/* Form Guide & Photo Button */}
                                {exercise.guide && (
                                    <div className="vt-guide-wrap">
                                        <div className="vt-guide-action-row">
                                            <button
                                                type="button"
                                                onClick={() => toggleGuide(exercise.id)}
                                                style={{
                                                    backgroundColor: isGuideOpen ? colors.accentSurface : colors.elevated,
                                                    borderColor: isGuideOpen ? colors.accentBorder : colors.border,
                                                    color: colors.text
                                                }}
                                                className="vt-guide-toggle-btn"
                                            >
                                                <span className="vt-flex vt-items-center vt-gap-2">
                                                    <Info
                                                        size={15}
                                                        style={{ color: isDark ? colors.accent : colors.text }}
                                                    />
                                                    <span>
                                                        {isGuideOpen
                                                            ? 'Hide Form & Feel Guide'
                                                            : 'Form & Feel Guide (Sahi Position + Pressure)'}
                                                    </span>
                                                </span>
                                                <ChevronRight
                                                    size={16}
                                                    className={isGuideOpen ? 'vt-chevron-open' : 'vt-chevron'}
                                                />
                                            </button>

                                            {activeDayPlan.chartImage && (
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        setChartModalState({
                                                            dayIndex: activeDayPlan.dayIndex,
                                                            focusExercise: {
                                                                number: exIdx + 1,
                                                                name: displayName
                                                            }
                                                        })
                                                    }
                                                    style={{
                                                        backgroundColor: colors.elevated,
                                                        borderColor: colors.accentBorder,
                                                        color: isDark ? colors.accent : colors.text
                                                    }}
                                                    className="vt-btn vt-h-40 vt-px-3 vt-box-xl vt-text-11 vt-font-extrabold vt-uppercase vt-gap-1-5 vt-nowrap vt-shrink-0"
                                                >
                                                    <Sparkles size={14} />
                                                    <span>Photo #{exIdx + 1}</span>
                                                </button>
                                            )}
                                        </div>

                                        {isGuideOpen && (
                                            <div
                                                style={{
                                                    backgroundColor: colors.elevated,
                                                    borderColor: colors.border
                                                }}
                                                className="vt-guide-panel"
                                            >
                                                <div
                                                    style={{ backgroundColor: colors.card, borderColor: colors.border }}
                                                    className="vt-guide-item"
                                                >
                                                    <div
                                                        className="vt-guide-label"
                                                        style={{ color: isDark ? colors.accent : colors.text }}
                                                    >
                                                        1. Sahi Position (Setup)
                                                    </div>
                                                    <p className="vt-guide-text" style={{ color: colors.muted }}>
                                                        {exercise.guide.setup}
                                                    </p>
                                                </div>

                                                <div
                                                    style={{ backgroundColor: colors.card, borderColor: colors.border }}
                                                    className="vt-guide-item"
                                                >
                                                    <div
                                                        className="vt-guide-label"
                                                        style={{ color: isDark ? colors.accent : colors.text }}
                                                    >
                                                        2. Kaise Karein (Execution)
                                                    </div>
                                                    <p className="vt-guide-text" style={{ color: colors.muted }}>
                                                        {exercise.guide.execution}
                                                    </p>
                                                </div>

                                                <div
                                                    style={{ backgroundColor: colors.card, borderColor: colors.success }}
                                                    className="vt-guide-item"
                                                >
                                                    <div
                                                        className="vt-guide-label vt-flex vt-items-center vt-gap-1-5"
                                                        style={{ color: colors.success }}
                                                    >
                                                        <CheckCircle2 size={14} />
                                                        <span>3. Sahi Pressure Kaha Feel Hoga</span>
                                                    </div>
                                                    <p className="vt-guide-text" style={{ color: colors.text }}>
                                                        {exercise.guide.feelRight}
                                                    </p>
                                                </div>

                                                <div
                                                    style={{ backgroundColor: colors.card, borderColor: colors.warning }}
                                                    className="vt-guide-item"
                                                >
                                                    <div
                                                        className="vt-guide-label vt-flex vt-items-center vt-gap-1-5"
                                                        style={{ color: colors.warning }}
                                                    >
                                                        <AlertTriangle size={14} />
                                                        <span>4. Galat Pressure Warning</span>
                                                    </div>
                                                    <p className="vt-guide-text" style={{ color: colors.muted }}>
                                                        {exercise.guide.feelWrong}
                                                    </p>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* EXACT LAST SESSION RECALL + PROGRESSIVE OVERLOAD BANNER */}
                                <div
                                    style={{
                                        backgroundColor: overload.shouldIncrease ? colors.accentSurface : colors.elevated,
                                        borderColor: overload.shouldIncrease ? colors.accentBorder : colors.border
                                    }}
                                    className="vt-p-3 vt-box-xl vt-stack-2 vt-tabular"
                                >
                                    <div className="vt-resp-row">
                                        <div className="vt-stack-0-5">
                                            <div className="vt-text-xs vt-font-bold vt-uppercase vt-tracking-wider vt-row-wrap vt-gap-1-5">
                                                <span>
                                                    Last Time
                                                    {exRecall?.lastDate ? ` (${exRecall.lastDate})` : ''}:
                                                </span>
                                                <span style={{ color: colors.text }} className="font-mono-num">
                                                    {prevSets.length > 0
                                                        ? prevSets
                                                              .map(
                                                                  (s) =>
                                                                      `${isAssisted ? 'Assist ' : ''}${formatWeight(s.weight)}${appState.unit} × ${s.reps}`
                                                              )
                                                              .join('  |  ')
                                                        : 'First session — enter your starting weights & reps'}
                                                </span>
                                            </div>
                                            <div className="vt-text-xs vt-font-semibold" style={{ color: colors.muted }}>
                                                {overload.reason}
                                                {exRecall?.lastVolumeKg > 0
                                                    ? ` • Last Vol: ${formatWeight(exRecall.lastVolumeKg)} ${appState.unit}`
                                                    : ''}
                                            </div>
                                        </div>

                                        <div className="vt-overload-actions">
                                            {prevSets.length > 0 && !overload.shouldIncrease && (
                                                <button
                                                    type="button"
                                                    onClick={() => handleCopyLastSessionSets(exercise, prevSets)}
                                                    style={{
                                                        backgroundColor: colors.card,
                                                        borderColor: colors.border,
                                                        color: colors.text
                                                    }}
                                                    className="vt-btn vt-h-36 vt-px-2-5 vt-rounded-lg vt-border vt-text-11 vt-font-extrabold vt-uppercase vt-shrink-0"
                                                >
                                                    Load Last
                                                </button>
                                            )}

                                            {overload.shouldIncrease && (
                                                <>
                                                    <span
                                                        style={{
                                                            backgroundColor: colors.accent,
                                                            color: colors.accentText
                                                        }}
                                                        className="vt-pill-lg vt-text-xs vt-font-extrabold vt-uppercase vt-gap-1 font-mono-num"
                                                    >
                                                        {overload.mode === 'assist' ? (
                                                            <ArrowDownRight className="vt-icon-4 vt-stroke-2-5" />
                                                        ) : (
                                                            <ArrowUpRight className="vt-icon-4 vt-stroke-2-5" />
                                                        )}
                                                        <span>
                                                            {overload.mode === 'assist'
                                                                ? `${formatWeight(overload.incrementKg)} ${appState.unit} Assist → ${formatWeight(
                                                                      overload.suggestedWeightKg
                                                                  )} ${appState.unit}`
                                                                : `+${formatWeight(overload.incrementKg)} ${appState.unit} → ${formatWeight(
                                                                      overload.suggestedWeightKg
                                                                  )} ${appState.unit}`}
                                                        </span>
                                                    </span>
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            handleApplyOverloadWeight(exercise, overload.suggestedWeightKg)
                                                        }
                                                        style={{
                                                            backgroundColor: colors.card,
                                                            borderColor: colors.accentBorder,
                                                            color: colors.text
                                                        }}
                                                        className="vt-btn vt-h-40 vt-px-3 vt-box-xl vt-text-xs vt-font-extrabold vt-uppercase vt-shrink-0"
                                                    >
                                                        Apply
                                                    </button>
                                                </>
                                            )}

                                            {recentSessions.length > 1 && (
                                                <button
                                                    type="button"
                                                    onClick={() => toggleHistory(exercise.id)}
                                                    style={{
                                                        backgroundColor: isHistOpen ? colors.accentSurface : colors.card,
                                                        borderColor: isHistOpen ? colors.accentBorder : colors.border,
                                                        color: colors.text
                                                    }}
                                                    className="vt-btn vt-h-36 vt-px-2-5 vt-rounded-lg vt-border vt-text-11 vt-font-extrabold vt-gap-1"
                                                >
                                                    <History size={13} />
                                                    <span>Last {recentSessions.length}</span>
                                                </button>
                                            )}
                                        </div>
                                    </div>

                                    {/* Expandable Recent 4 Sessions Mini-History */}
                                    {isHistOpen && recentSessions.length > 0 && (
                                        <div
                                            style={{ borderColor: colors.border }}
                                            className="vt-pt-2 vt-border-t vt-stack-1-5"
                                        >
                                            <div className="vt-text-10 vt-font-extrabold vt-uppercase" style={{ color: colors.muted }}>
                                                Previous {recentSessions.length} Sessions Progression
                                            </div>
                                            {recentSessions.map((rs, idx) => (
                                                <div
                                                    key={`${rs.date}-${idx}`}
                                                    style={{ backgroundColor: colors.card, borderColor: colors.border }}
                                                    className="vt-p-2 vt-rounded-lg vt-border vt-between-center vt-flex-wrap vt-gap-2 vt-text-11 font-mono-num"
                                                >
                                                    <span style={{ color: colors.muted, fontWeight: 700 }}>{rs.date}</span>
                                                    <span style={{ fontWeight: 800 }}>
                                                        {(rs.sets || [])
                                                            .map(
                                                                (s) =>
                                                                    `${formatWeight(s.weight)}${appState.unit}×${s.reps}`
                                                            )
                                                            .join(' | ')}
                                                    </span>
                                                    <span style={{ color: isDark ? colors.accent : colors.text, fontWeight: 700 }}>
                                                        Vol: {formatWeight(rs.volumeKg)} {appState.unit}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* Set Rows Table */}
                                <div className="vt-stack-2 vt-tabular">
                                    <div
                                        style={{ color: colors.muted }}
                                        className="vt-grid-12 vt-set-grid-gap vt-px-2 vt-text-resp-10-11 vt-font-extrabold vt-uppercase vt-tracking-wider"
                                    >
                                        <div className="vt-col-span-2">Set</div>
                                        <div className="vt-col-span-4">
                                            {isAssisted ? `Assist (${appState.unit})` : `Weight (${appState.unit})`}
                                        </div>
                                        <div className="vt-col-span-4">Reps ({exercise.repLabel})</div>
                                        <div className="vt-col-span-2 vt-text-right">Done</div>
                                    </div>

                                    {draftSets.map((setRow, sIdx) => {
                                        const prevSet = prevSets[sIdx];
                                        return (
                                            <div
                                                key={sIdx}
                                                style={{
                                                    backgroundColor: setRow.completed ? colors.accentSurface : colors.elevated,
                                                    borderColor: setRow.completed ? colors.accentBorder : colors.border
                                                }}
                                                className="vt-grid-12 vt-set-grid-gap vt-items-center vt-p-2 vt-box-xl vt-transition-colors"
                                            >
                                                <div className="vt-col-span-2 vt-pl-1">
                                                    <span className="font-display vt-text-xl vt-font-extrabold">
                                                        #{sIdx + 1}
                                                    </span>
                                                    {prevSet && (
                                                        <div
                                                            className="vt-text-10 font-mono-num vt-leading-tight"
                                                            style={{ color: colors.muted }}
                                                        >
                                                            Last: {formatWeight(prevSet.weight)}×{prevSet.reps}
                                                        </div>
                                                    )}
                                                </div>

                                                <div className="vt-col-span-4">
                                                    <input
                                                        type="number"
                                                        inputMode="decimal"
                                                        step="0.5"
                                                        placeholder={prevSet ? String(formatWeight(prevSet.weight)) : '0'}
                                                        aria-label={`${displayName} set ${sIdx + 1} weight`}
                                                        value={
                                                            setRow.weight === '' || setRow.weight === 0
                                                                ? ''
                                                                : formatWeight(setRow.weight)
                                                        }
                                                        onChange={(e) =>
                                                            handleSetInputChange(exercise.id, sIdx, 'weight', e.target.value)
                                                        }
                                                        style={{
                                                            backgroundColor: colors.card,
                                                            borderColor: colors.border,
                                                            color: colors.text
                                                        }}
                                                        className="vt-input vt-h-44 vt-px-2 vt-text-center vt-font-extrabold vt-text-base font-mono-num"
                                                    />
                                                </div>

                                                <div className="vt-col-span-4">
                                                    <input
                                                        type="number"
                                                        inputMode="numeric"
                                                        placeholder={prevSet ? String(prevSet.reps) : '0'}
                                                        aria-label={`${displayName} set ${sIdx + 1} reps`}
                                                        value={setRow.reps === '' || setRow.reps === 0 ? '' : setRow.reps}
                                                        onChange={(e) =>
                                                            handleSetInputChange(exercise.id, sIdx, 'reps', e.target.value)
                                                        }
                                                        style={{
                                                            backgroundColor: colors.card,
                                                            borderColor: colors.border,
                                                            color: colors.text
                                                        }}
                                                        className="vt-input vt-h-44 vt-px-2 vt-text-center vt-font-extrabold vt-text-base font-mono-num"
                                                    />
                                                </div>

                                                <div className="vt-col-span-2 vt-flex vt-justify-end">
                                                    <button
                                                        onClick={() => handleToggleSetComplete(exercise, sIdx)}
                                                        aria-label={`Mark ${displayName} set ${sIdx + 1} complete`}
                                                        style={{
                                                            backgroundColor: setRow.completed ? colors.accent : colors.card,
                                                            color: setRow.completed ? colors.accentText : colors.muted,
                                                            borderColor: setRow.completed ? colors.accentBorder : colors.border
                                                        }}
                                                        className="vt-btn vt-sq-44 vt-box-xl vt-transition-colors"
                                                    >
                                                        <Check className="vt-icon-5 vt-stroke-2-5" />
                                                    </button>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {chartModalState && (
                <FormChartModal
                    initialDayIndex={chartModalState.dayIndex}
                    focusExercise={chartModalState.focusExercise}
                    onClose={() => setChartModalState(null)}
                    colors={colors}
                    isDark={isDark}
                />
            )}
        </div>
    );
}

// ============================================================================
// END OF PART 2 — REPLY "OK" FOR PART 3 (FINAL PART: Weekly/Monthly Complete Overview, Plan, Nutrition, Progress, Settings, Cardio & Pelvic)
// ============================================================================

// ============================================================================
// SECTION 12: PLAN VIEW COMPONENT (PART 3 START — FINAL PART)
// ============================================================================

function PlanView({ colors, isDark, onSelectWorkoutDay }) {
    const [muscleFilter, setMuscleFilter] = useState('All');

    const muscleCategories = [
        'All',
        'Lats/Back',
        'Side delts',
        'Front delts',
        'Rear delts',
        'Chest',
        'Quads',
        'Hamstrings',
        'Glutes',
        'Biceps',
        'Triceps',
        'Calves',
        'Abs'
    ];

    const orderedDays = [1, 2, 3, 4, 5, 6, 0].map((idx) =>
        WORKOUT_PLAN.find((d) => d.dayIndex === idx)
    );

    return (
        <div className="vt-stack-5">
            <div
                style={{ backgroundColor: colors.card, borderColor: colors.border }}
                className="vt-card vt-p-card vt-stack-4"
            >
                <div className="vt-between-center vt-flex-wrap vt-gap-4">
                    <div>
                        <span
                            style={{ backgroundColor: colors.accent, color: colors.accentText }}
                            className="vt-badge-lg vt-text-xs vt-font-extrabold vt-uppercase"
                        >
                            6-Day PPL V-Taper Split ({TOTAL_WEEKLY_PRIMARY_SETS} Primary Sets)
                        </span>
                        <h2 className="font-display vt-text-resp-3xl-4xl vt-font-black vt-uppercase vt-mt-2">
                            Weekly Hypertrophy Blueprint
                        </h2>
                        <p style={{ color: colors.muted }} className="vt-text-resp-xs-sm">
                            22 direct Lat/Back sets + 27 total Deltoid sets (11 Side, 7 Front, 9 Rear) + 14 Chest sets engineered for maximum shoulder-to-waist ratio.
                        </p>
                    </div>
                </div>

                <div className="vt-flex vt-items-center vt-gap-1-5 vt-overflow-x-auto vt-pt-1">
                    {muscleCategories.map((cat) => {
                        const active = muscleFilter === cat;
                        return (
                            <button
                                key={cat}
                                onClick={() => setMuscleFilter(cat)}
                                style={{
                                    backgroundColor: active ? colors.accent : colors.elevated,
                                    color: active ? colors.accentText : colors.text,
                                    borderColor: active ? colors.accentBorder : colors.border
                                }}
                                className="vt-btn vt-h-40 vt-px-3 vt-box-xl vt-text-xs vt-font-extrabold vt-uppercase vt-nowrap"
                            >
                                {cat}
                            </button>
                        );
                    })}
                </div>
            </div>

            <div className="vt-grid-1 vt-gap-4">
                {orderedDays.map((day) => {
                    const filteredExercises =
                        muscleFilter === 'All'
                            ? day.exercises
                            : day.exercises.filter(
                                  (ex) =>
                                      ex.primaryGroup === muscleFilter ||
                                      (ex.secondaryGroups || []).includes(muscleFilter)
                              );

                    if (muscleFilter !== 'All' && filteredExercises.length === 0 && !day.isRest) {
                        return null;
                    }

                    return (
                        <div
                            key={day.dayIndex}
                            style={{ backgroundColor: colors.card, borderColor: colors.border }}
                            className="vt-card vt-p-card vt-stack-4"
                        >
                            <div
                                className="vt-between-center vt-flex-wrap vt-gap-3 vt-pb-3 vt-border-b"
                                style={{ borderColor: colors.border }}
                            >
                                <div className="vt-flex vt-items-center vt-gap-2">
                                    <span
                                        style={{ backgroundColor: colors.accent, color: colors.accentText }}
                                        className="vt-badge-lg vt-text-xs vt-font-extrabold vt-uppercase"
                                    >
                                        {day.shortDay}
                                    </span>
                                    <h3 className="font-display vt-text-resp-2xl-3xl vt-font-black vt-uppercase">
                                        {day.title} — {day.subtitle}
                                    </h3>
                                </div>

                                <button
                                    onClick={() => onSelectWorkoutDay(day.dayIndex)}
                                    style={{ backgroundColor: colors.elevated, borderColor: colors.border, color: colors.text }}
                                    className="vt-btn vt-h-42 vt-px-3-5 vt-box-xl vt-text-xs vt-font-extrabold vt-uppercase vt-gap-1"
                                >
                                    <span>Open in Today</span>
                                    <ChevronRight className="vt-icon-4" />
                                </button>
                            </div>

                            {day.isRest ? (
                                <div
                                    style={{ backgroundColor: colors.elevated, borderColor: colors.border }}
                                    className="vt-p-4 vt-box-xl vt-flex vt-items-center vt-gap-3"
                                >
                                    <Footprints
                                        className="vt-icon-6 vt-shrink-0"
                                        style={{ color: isDark ? colors.accent : colors.text }}
                                    />
                                    <div className="vt-text-resp-xs-sm">
                                        <strong>Rest, 20–30 min easy walk.</strong> Active recovery, light mobility, and weekly grocery prep.
                                    </div>
                                </div>
                            ) : (
                                <div className="vt-grid-md-2 vt-gap-3">
                                    {filteredExercises.map((ex) => (
                                        <div
                                            key={ex.id}
                                            style={{ backgroundColor: colors.elevated, borderColor: colors.border }}
                                            className="vt-p-3-5 vt-box-xl vt-col-between vt-gap-2"
                                        >
                                            <div className="vt-between-start vt-gap-2">
                                                <div>
                                                    <div className="vt-font-extrabold vt-text-resp-sm-base">{ex.name}</div>
                                                    <div className="vt-row-wrap vt-gap-1-5 vt-mt-1">
                                                        <span
                                                            style={{
                                                                backgroundColor: colors.card,
                                                                borderColor: colors.border,
                                                                color: isDark ? colors.accent : colors.text
                                                            }}
                                                            className="vt-badge-xs vt-border vt-text-10 vt-font-extrabold vt-uppercase"
                                                        >
                                                            {ex.primaryGroup}
                                                        </span>
                                                        <span className="vt-text-11 vt-font-semibold font-mono-num" style={{ color: colors.muted }}>
                                                            {ex.type} • {ex.restSec}s • Step {ex.step}
                                                        </span>
                                                    </div>
                                                </div>
                                                <div
                                                    style={{
                                                        backgroundColor: colors.card,
                                                        borderColor: colors.border
                                                    }}
                                                    className="font-display vt-px-2-5 vt-py-1 vt-rounded-lg vt-border vt-text-lg vt-font-extrabold vt-shrink-0 vt-tabular"
                                                >
                                                    {ex.sets} × {ex.repLabel}
                                                </div>
                                            </div>

                                            <p
                                                className="vt-text-xs vt-pt-2 vt-border-t"
                                                style={{ color: colors.muted, borderColor: colors.border }}
                                            >
                                                <strong style={{ color: colors.text }}>Cue:</strong> {ex.cue}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

// ============================================================================
// SECTION 13: NUTRITION VIEW (100% WHOLE-FOOD INDIAN + SLEEP + AUTO DB ARCHIVE)
// ============================================================================

function NutritionView({
    colors,
    isDark,
    appState,
    setAppState,
    nutritionTotals,
    handleDietTrackChange,
    showToast
}) {
    const [subView, setSubView] = useState('daily');

    const kcalTarget = appState.profile.targetCalories || SCIENCE_RULES.TARGET_KCAL;
    const proteinTarget = appState.profile.targetProteinG || SCIENCE_RULES.TARGET_PROTEIN_G;
    const waterTarget = appState.profile.targetWaterMl || SCIENCE_RULES.TARGET_WATER_ML;
    const sleepTarget = appState.profile.targetSleepHours || SCIENCE_RULES.TARGET_SLEEP_HOURS;

    const kcalPercent = Math.min(100, Math.round((nutritionTotals.consumedKcal / kcalTarget) * 100));
    const proteinPercent = Math.min(
        100,
        Math.round((nutritionTotals.consumedProtein / proteinTarget) * 100)
    );
    const waterPercent = Math.min(100, Math.round((appState.waterMl / waterTarget) * 100));

    const weeklyMenu = useMemo(
        () => generateWeeklyMenuRotation(appState.profile.dietTrack || 'non-veg'),
        [appState.profile.dietTrack]
    );

    const groceryList = useMemo(
        () => generateWeeklyGroceryList(weeklyMenu, appState.foodDatabase),
        [weeklyMenu, appState.foodDatabase]
    );

    const toggleMealSlotCompleted = (slotId) => {
        setAppState((prev) => ({
            ...prev,
            completedMealSlots: {
                ...(prev.completedMealSlots || {}),
                [slotId]: !prev.completedMealSlots?.[slotId]
            }
        }));
    };

    const handleSelectSlotOption = (slotId, optionId) => {
        setAppState((prev) => ({
            ...prev,
            selectedMealOptions: {
                ...(prev.selectedMealOptions || {}),
                [slotId]: optionId
            }
        }));
    };

    const handleAddAppetiteHelper = (helper) => {
        setAppState((prev) => ({
            ...prev,
            loggedAppetiteHelpers: [...(prev.loggedAppetiteHelpers || []), helper.id]
        }));
        showToast(`Added ${helper.label} (+${helper.kcal} kcal)`);
    };

    const handleClearHelpers = () => {
        setAppState((prev) => ({ ...prev, loggedAppetiteHelpers: [] }));
        showToast('Cleared extra appetite helpers for today.');
    };

    return (
        <div className="vt-stack-5">
            {/* Top Track Switcher */}
            <div
                style={{ backgroundColor: colors.card, borderColor: colors.border }}
                className="vt-card vt-p-card-md vt-resp-row-md"
            >
                <div>
                    <span
                        style={{ backgroundColor: colors.accent, color: colors.accentText }}
                        className="vt-badge-lg vt-text-11 vt-font-extrabold vt-uppercase"
                    >
                        Zero Supplements • Auto-Archived Daily in PostgreSQL
                    </span>
                    <h2 className="font-display vt-text-resp-3xl-4xl vt-font-black vt-uppercase vt-mt-1">
                        Whole-Food Lean Bulk Nutrition
                    </h2>
                </div>

                <div className="vt-row-wrap vt-gap-1-5">
                    {['non-veg', 'eggetarian', 'veg'].map((t) => {
                        const active = (appState.profile.dietTrack || 'non-veg') === t;
                        return (
                            <button
                                key={t}
                                onClick={() => handleDietTrackChange(t)}
                                style={{
                                    backgroundColor: active ? colors.accent : colors.elevated,
                                    color: active ? colors.accentText : colors.text,
                                    borderColor: active ? colors.accentBorder : colors.border
                                }}
                                className="vt-btn vt-h-40 vt-px-3 vt-box-xl vt-text-xs vt-font-extrabold vt-uppercase"
                            >
                                {t}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Activity Rings Card */}
            <div
                style={{ backgroundColor: colors.card, borderColor: colors.border }}
                className="vt-card vt-p-4 vt-grid-3 vt-gap-2 vt-justify-items-center vt-tabular"
            >
                {[
                    {
                        v: nutritionTotals.consumedKcal,
                        m: kcalTarget,
                        c: colors.accent,
                        s: 'kcal',
                        t: `${nutritionTotals.consumedKcal}/${kcalTarget}`
                    },
                    {
                        v: nutritionTotals.consumedProtein,
                        m: proteinTarget,
                        c: '#FF7A1A',
                        s: 'protein',
                        t: `${nutritionTotals.consumedProtein}/${proteinTarget}g`
                    },
                    {
                        v: appState.waterMl,
                        m: waterTarget,
                        c: '#0059FF',
                        s: 'water',
                        t: `${(appState.waterMl / 1000).toFixed(1)}/${(waterTarget / 1000).toFixed(1)}L`
                    }
                ].map((r) => (
                    <div key={r.s} className="vt-text-center">
                        <Ring
                            value={r.v}
                            max={r.m}
                            color={r.c}
                            track={colors.elevated}
                            label={`${Math.min(100, Math.round((r.v / r.m) * 100))}%`}
                            sub={r.s}
                        />
                        <div className="vt-text-11 vt-font-bold vt-mt-1-5 font-mono-num">{r.t}</div>
                    </div>
                ))}
            </div>

            {/* Macro, Hydration & Sleep Bento Grid */}
            <div className="vt-grid-md-3 vt-gap-4 vt-tabular">
                <div
                    style={{ backgroundColor: colors.card, borderColor: colors.border }}
                    className="vt-card vt-p-card-md vt-stack-3"
                >
                    <div className="vt-between-center">
                        <span className="vt-text-xs vt-font-extrabold vt-uppercase" style={{ color: colors.muted }}>
                            Daily Energy
                        </span>
                        <Flame className="vt-icon-5" style={{ color: isDark ? colors.accent : colors.text }} />
                    </div>
                    <div className="vt-flex vt-items-baseline vt-justify-between">
                        <div className="font-display vt-text-resp-3xl-4xl vt-font-black">
                            {nutritionTotals.consumedKcal}{' '}
                            <span className="vt-text-lg vt-font-bold" style={{ color: colors.muted }}>
                                / {kcalTarget} kcal
                            </span>
                        </div>
                        <span className="vt-text-xs vt-font-extrabold font-mono-num">{kcalPercent}%</span>
                    </div>
                    <div style={{ backgroundColor: colors.elevated }} className="vt-progress-track">
                        <div
                            style={{ width: `${kcalPercent}%`, backgroundColor: colors.accent }}
                            className="vt-progress-fill"
                        />
                    </div>
                    <div className="vt-text-11 vt-between-center" style={{ color: colors.muted }}>
                        <span>Planned Menu: {nutritionTotals.plannedKcal} kcal</span>
                        <span>Floor: {SCIENCE_RULES.MIN_ACCEPTABLE_KCAL} kcal</span>
                    </div>
                </div>

                <div
                    style={{ backgroundColor: colors.card, borderColor: colors.border }}
                    className="vt-card vt-p-card-md vt-stack-3"
                >
                    <div className="vt-between-center">
                        <span className="vt-text-xs vt-font-extrabold vt-uppercase" style={{ color: colors.muted }}>
                            Whole-Food Protein
                        </span>
                        <ShieldCheck
                            className="vt-icon-5"
                            style={{ color: isDark ? colors.accent : colors.text }}
                        />
                    </div>
                    <div className="vt-flex vt-items-baseline vt-justify-between">
                        <div className="font-display vt-text-resp-3xl-4xl vt-font-black">
                            {nutritionTotals.consumedProtein}g{' '}
                            <span className="vt-text-lg vt-font-bold" style={{ color: colors.muted }}>
                                / {proteinTarget}g
                            </span>
                        </div>
                        <span className="vt-text-xs vt-font-extrabold font-mono-num">{proteinPercent}%</span>
                    </div>
                    <div style={{ backgroundColor: colors.elevated }} className="vt-progress-track">
                        <div
                            style={{ width: `${proteinPercent}%`, backgroundColor: colors.accent }}
                            className="vt-progress-fill"
                        />
                    </div>
                    <div className="vt-text-11 vt-between-center" style={{ color: colors.muted }}>
                        <span>Feedings ≥18g: {nutritionTotals.proteinFeedingsCount}/4</span>
                        <span>Floor: 110g/day</span>
                    </div>
                </div>

                <div
                    style={{ backgroundColor: colors.card, borderColor: colors.border }}
                    className="vt-card vt-p-card-md vt-stack-3"
                >
                    <div className="vt-between-center">
                        <span className="vt-text-xs vt-font-extrabold vt-uppercase" style={{ color: colors.muted }}>
                            Water ({(waterTarget / 1000).toFixed(1)}L) & Sleep ({sleepTarget}h)
                        </span>
                        <Droplets className="vt-icon-5" style={{ color: isDark ? colors.accent : colors.text }} />
                    </div>
                    <div className="vt-flex vt-items-baseline vt-justify-between">
                        <div className="font-display vt-text-resp-3xl-4xl vt-font-black">
                            {(appState.waterMl / 1000).toFixed(2)}L{' '}
                            <span className="vt-text-sm vt-font-bold" style={{ color: colors.muted }}>
                                • {appState.sleepHours || 0}h sleep
                            </span>
                        </div>
                        <span className="vt-text-xs vt-font-extrabold font-mono-num">{waterPercent}%</span>
                    </div>
                    <div className="vt-grid-3 vt-gap-1-5">
                        <button
                            onClick={() =>
                                setAppState((prev) => ({ ...prev, waterMl: prev.waterMl + 250 }))
                            }
                            style={{ backgroundColor: colors.elevated, borderColor: colors.border, color: colors.text }}
                            className="vt-btn vt-h-36 vt-box-xl vt-text-xs vt-font-extrabold"
                        >
                            +250ml
                        </button>
                        <button
                            onClick={() =>
                                setAppState((prev) => ({ ...prev, waterMl: prev.waterMl + 500 }))
                            }
                            style={{ backgroundColor: colors.accent, color: colors.accentText }}
                            className="vt-btn vt-h-36 vt-rounded-xl vt-text-xs vt-font-extrabold"
                        >
                            +500ml
                        </button>
                        <button
                            onClick={() => setAppState((prev) => ({ ...prev, waterMl: 0 }))}
                            style={{ backgroundColor: colors.elevated, borderColor: colors.border, color: colors.text }}
                            className="vt-btn vt-h-36 vt-box-xl vt-text-xs vt-font-bold"
                        >
                            Reset
                        </button>
                    </div>
                    <div className="vt-between-center vt-gap-2 vt-pt-1 vt-border-t" style={{ borderColor: colors.border }}>
                        <span className="vt-text-11 vt-font-bold" style={{ color: colors.muted }}>
                            Sleep Logged:
                        </span>
                        <div className="vt-flex vt-items-center vt-gap-1">
                            {[6.5, 7.5, 8, 8.5].map((hrs) => (
                                <button
                                    key={hrs}
                                    type="button"
                                    onClick={() =>
                                        setAppState((prev) => ({ ...prev, sleepHours: hrs }))
                                    }
                                    style={{
                                        backgroundColor:
                                            Number(appState.sleepHours) === hrs
                                                ? colors.accent
                                                : colors.elevated,
                                        color:
                                            Number(appState.sleepHours) === hrs
                                                ? colors.accentText
                                                : colors.text,
                                        borderColor:
                                            Number(appState.sleepHours) === hrs
                                                ? colors.accentBorder
                                                : colors.border
                                    }}
                                    className="vt-btn vt-h-30 vt-px-2 vt-rounded-lg vt-border vt-text-10 vt-font-extrabold font-mono-num"
                                >
                                    {hrs}h
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Sub-Tabs */}
            <div className="vt-flex vt-items-center vt-gap-2 vt-overflow-x-auto">
                {[
                    { id: 'daily', label: 'Today 7-Slot Checklist' },
                    { id: 'rotation', label: '7-Day Rotation & Grocery List' },
                    { id: 'foods', label: '29 Indian Whole Foods DB' }
                ].map((tab) => {
                    const active = subView === tab.id;
                    return (
                        <button
                            key={tab.id}
                            onClick={() => setSubView(tab.id)}
                            style={{
                                backgroundColor: active ? colors.accent : colors.card,
                                color: active ? colors.accentText : colors.text,
                                borderColor: active ? colors.accentBorder : colors.border
                            }}
                            className="vt-btn vt-h-42 vt-px-3-5 vt-box-xl vt-text-xs vt-font-extrabold vt-uppercase vt-nowrap"
                        >
                            {tab.label}
                        </button>
                    );
                })}
            </div>

            {subView === 'daily' && (
                <div className="vt-stack-4">
                    <div className="vt-stack-3">
                        {MEAL_SLOTS.map((slot) => {
                            const allowedOptions = slot.options.filter((o) =>
                                o.tracks.includes(appState.profile.dietTrack || 'non-veg')
                            );
                            const selectedOptId = appState.selectedMealOptions?.[slot.slotId];
                            const activeOpt =
                                allowedOptions.find((o) => o.id === selectedOptId) ||
                                allowedOptions[0] ||
                                slot.options[0];
                            const macros = computeMealOptionMacros(activeOpt, appState.foodDatabase);
                            const isDone = Boolean(appState.completedMealSlots?.[slot.slotId]);

                            return (
                                <div
                                    key={slot.slotId}
                                    style={{
                                        backgroundColor: isDone ? colors.accentSurface : colors.card,
                                        borderColor: isDone ? colors.accentBorder : colors.border
                                    }}
                                    className="vt-card vt-p-card-md vt-stack-3 vt-transition-colors"
                                >
                                    <div className="vt-between-start vt-gap-3">
                                        <div className="vt-stack-1 vt-flex-1">
                                            <div className="vt-row-wrap vt-gap-2">
                                                <span
                                                    style={{ backgroundColor: colors.elevated, borderColor: colors.border }}
                                                    className="vt-badge vt-border vt-text-11 vt-font-extrabold font-mono-num"
                                                >
                                                    {slot.timeHint}
                                                </span>
                                                <h3 className="font-display vt-text-2xl vt-font-black vt-uppercase">
                                                    {slot.slotName}
                                                </h3>
                                                <span
                                                    style={{ backgroundColor: colors.accent, color: colors.accentText }}
                                                    className="vt-badge vt-text-xs vt-font-extrabold font-mono-num"
                                                >
                                                    {macros.kcal} kcal • {macros.protein}g P
                                                </span>
                                            </div>
                                            <p className="vt-text-resp-xs-sm vt-font-semibold">{activeOpt.description}</p>
                                            <div className="vt-text-11 font-mono-num" style={{ color: colors.muted }}>
                                                Carbs: {macros.carbs}g • Fat: {macros.fat}g • Anchor: {activeOpt.proteinAnchor}
                                            </div>
                                        </div>

                                        <button
                                            onClick={() => toggleMealSlotCompleted(slot.slotId)}
                                            aria-label={`Mark ${slot.slotName} completed`}
                                            style={{
                                                backgroundColor: isDone ? colors.accent : colors.elevated,
                                                color: isDone ? colors.accentText : colors.muted,
                                                borderColor: isDone ? colors.accentBorder : colors.border
                                            }}
                                            className="vt-btn vt-sq-48 vt-box-xl vt-shrink-0"
                                        >
                                            <Check className="vt-icon-6 vt-stroke-2-5" />
                                        </button>
                                    </div>

                                    {allowedOptions.length > 1 && (
                                        <div
                                            className="vt-row-wrap vt-gap-1-5 vt-pt-2 vt-border-t"
                                            style={{ borderColor: colors.border }}
                                        >
                                            <span className="vt-text-11 vt-font-bold vt-uppercase" style={{ color: colors.muted }}>
                                                Swap Option:
                                            </span>
                                            {allowedOptions.map((opt) => {
                                                const chosen = opt.id === activeOpt.id;
                                                return (
                                                    <button
                                                        key={opt.id}
                                                        onClick={() => handleSelectSlotOption(slot.slotId, opt.id)}
                                                        style={{
                                                            backgroundColor: chosen ? colors.accent : colors.elevated,
                                                            color: chosen ? colors.accentText : colors.text,
                                                            borderColor: chosen ? colors.accentBorder : colors.border
                                                        }}
                                                        className="vt-btn vt-h-34 vt-px-2-5 vt-py-1 vt-rounded-lg vt-border vt-text-xs vt-font-extrabold"
                                                    >
                                                        {opt.label}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>

                    <div
                        style={{ backgroundColor: colors.card, borderColor: colors.border }}
                        className="vt-card vt-p-card-md vt-stack-3"
                    >
                        <div className="vt-between-center">
                            <div>
                                <h3 className="font-display vt-text-2xl vt-font-black vt-uppercase">
                                    One-Tap Appetite Helpers (+Calories)
                                </h3>
                                <p className="vt-text-xs" style={{ color: colors.muted }}>
                                    Struggling to hit 2,900 kcal or need +300 kcal for a plateau? Tap to log low-volume whole foods.
                                </p>
                            </div>
                            {(appState.loggedAppetiteHelpers?.length || 0) > 0 && (
                                <button
                                    onClick={handleClearHelpers}
                                    style={{ backgroundColor: colors.elevated, borderColor: colors.border, color: colors.text }}
                                    className="vt-btn vt-h-38 vt-px-3 vt-box-xl vt-text-xs vt-font-bold"
                                >
                                    Clear ({appState.loggedAppetiteHelpers.length})
                                </button>
                            )}
                        </div>

                        <div className="vt-grid-helpers vt-gap-2">
                            {APPETITE_HELPERS.map((helper) => (
                                <button
                                    key={helper.id}
                                    onClick={() => handleAddAppetiteHelper(helper)}
                                    style={{ backgroundColor: colors.elevated, borderColor: colors.border, color: colors.text }}
                                    className="vt-btn vt-h-48 vt-p-3 vt-box-xl vt-text-left vt-between-center vt-gap-2"
                                >
                                    <div>
                                        <div className="vt-text-xs vt-font-extrabold">{helper.label}</div>
                                        <div className="vt-text-11 font-mono-num" style={{ color: colors.muted }}>
                                            +{helper.kcal} kcal • +{helper.protein}g P
                                        </div>
                                    </div>
                                    <Plus className="vt-icon-4 vt-shrink-0" />
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {subView === 'rotation' && (
                <div className="vt-stack-4">
                    <div
                        style={{ backgroundColor: colors.card, borderColor: colors.border }}
                        className="vt-card vt-p-card vt-stack-3"
                    >
                        <h3 className="font-display vt-text-resp-2xl-3xl vt-font-black vt-uppercase">
                            7-Day Non-Repeating Dinner Protein Rotation ({appState.profile.dietTrack})
                        </h3>
                        <p className="vt-text-xs" style={{ color: colors.muted }}>
                            Lunch and Dinner never use the same primary protein anchor on the same day.
                        </p>
                        <div className="vt-grid-rotation vt-gap-2 vt-pt-2">
                            {weeklyMenu.map((d) => (
                                <div
                                    key={d.day}
                                    style={{ backgroundColor: colors.elevated, borderColor: colors.border }}
                                    className="vt-p-3 vt-box-xl vt-stack-1-5 vt-text-xs"
                                >
                                    <div
                                        style={{ backgroundColor: colors.accent, color: colors.accentText }}
                                        className="vt-badge vt-font-extrabold vt-uppercase vt-self-start"
                                    >
                                        {d.day}
                                    </div>
                                    <div className="font-mono-num vt-stack-0-5 vt-text-11">
                                        <div>B: {d.slots.breakfast}</div>
                                        <div>M: {d.slots.mid_morning}</div>
                                        <div>L: {d.slots.lunch}</div>
                                        <div>Pre: {d.slots.pre_workout}</div>
                                        <div>Post: {d.slots.post_workout}</div>
                                        <div>D: {d.slots.dinner}</div>
                                        <div>Bed: {d.slots.bedtime}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div
                        style={{ backgroundColor: colors.card, borderColor: colors.border }}
                        className="vt-card vt-p-card vt-stack-4"
                    >
                        <div className="vt-flex vt-items-center vt-gap-2">
                            <ShoppingBag className="vt-icon-5" style={{ color: isDark ? colors.accent : colors.text }} />
                            <h3 className="font-display vt-text-resp-2xl-3xl vt-font-black vt-uppercase">
                                Weekly Indian Grocery List (7 Days)
                            </h3>
                        </div>
                        <div className="vt-grid-sm-2 vt-gap-4">
                            {Object.entries(groceryList).map(([category, items]) => (
                                <div
                                    key={category}
                                    style={{ backgroundColor: colors.elevated, borderColor: colors.border }}
                                    className="vt-p-4 vt-box-xl vt-stack-2"
                                >
                                    <div
                                        className="vt-text-xs vt-font-extrabold vt-uppercase vt-tracking-wider"
                                        style={{ color: isDark ? colors.accent : colors.text }}
                                    >
                                        {category}
                                    </div>
                                    <div className="vt-stack-1-5 vt-text-xs">
                                        {items.map((item) => (
                                            <div key={item.id} className="vt-between-center vt-gap-2">
                                                <span>{item.name}</span>
                                                <span className="vt-font-extrabold font-mono-num vt-shrink-0">{item.displayQty}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {subView === 'foods' && (
                <div
                    style={{ backgroundColor: colors.card, borderColor: colors.border }}
                    className="vt-card vt-p-card vt-stack-3"
                >
                    <h3 className="font-display vt-text-resp-2xl-3xl vt-font-black vt-uppercase">
                        IFCT 2017 / USDA Indian Whole-Food Database (29 Items)
                    </h3>
                    <div className="vt-grid-md-2 vt-gap-2-5">
                        {appState.foodDatabase.map((f) => (
                            <div
                                key={f.id}
                                style={{ backgroundColor: colors.elevated, borderColor: colors.border }}
                                className="vt-p-3 vt-box-xl vt-between-center vt-gap-2 vt-text-xs"
                            >
                                <div>
                                    <div className="vt-font-extrabold">{f.name}</div>
                                    <div style={{ color: colors.muted }}>
                                        Per {f.basis} {f.unit} ({f.category})
                                    </div>
                                </div>
                                <div className="vt-text-right font-mono-num vt-shrink-0">
                                    <div className="vt-font-extrabold">{f.kcal} kcal</div>
                                    <div style={{ color: colors.muted }}>
                                        P:{f.protein}g • C:{f.carbs}g • F:{f.fat}g
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

// ============================================================================
// SECTION 14: PROGRESS VIEW (POSTGRESQL WEIGHTS, MEASUREMENTS & CHARTS)
// ============================================================================

function ProgressView({
    colors,
    isDark,
    appState,
    setAppState,
    formatWeight,
    toKg,
    gainAnalysis,
    vTaperRatio,
    latestMeasurement,
    runCloudMutation,
    showToast
}) {
    const todayStr = useMemo(() => getLocalDateStr(), []);
    const [weightDate, setWeightDate] = useState(todayStr);
    const [morningInput, setMorningInput] = useState('');
    const [nightInput, setNightInput] = useState('');
    const [noteInput, setNoteInput] = useState('');
    const [reportTab, setReportTab] = useState('weekly');
    const [chartMode, setChartMode] = useState('trajectory');

    const [measForm, setMeasForm] = useState({
        shoulders: latestMeasurement?.shoulders || 0,
        chest: latestMeasurement?.chest || 0,
        waist: latestMeasurement?.waist || 0,
        arms: latestMeasurement?.arms || 0,
        thighs: latestMeasurement?.thighs || 0
    });

    const normalizedLogs = useMemo(() => {
        const sorted = [...(appState.weightLogs || [])]
            .map((item) => {
                const mKg =
                    item.morningKg !== undefined && item.morningKg !== null
                        ? Number(item.morningKg)
                        : item.weightKg !== undefined
                          ? Number(item.weightKg)
                          : null;
                const nKg =
                    item.nightKg !== undefined && item.nightKg !== null ? Number(item.nightKg) : null;
                const primaryKg = mKg || nKg || Number(item.weightKg || 0);
                const fluctuationKg = mKg && nKg ? Number((nKg - mKg).toFixed(2)) : null;

                return {
                    ...item,
                    morningKg: mKg,
                    nightKg: nKg,
                    weightKg: primaryKg,
                    fluctuationKg,
                    notes: item.notes || ''
                };
            })
            .filter((item) => item.weightKg > 0)
            .sort((a, b) => new Date(a.date) - new Date(b.date));

        return sorted.map((entry, idx) => {
            const windowSlice = sorted.slice(Math.max(0, idx - 6), idx + 1);
            const sum = windowSlice.reduce((acc, cur) => acc + cur.weightKg, 0);
            const movingAvgKg = Number((sum / windowSlice.length).toFixed(2));
            return { ...entry, movingAvgKg };
        });
    }, [appState.weightLogs]);

    useEffect(() => {
        const existing = normalizedLogs.find((w) => w.date === weightDate);
        if (existing) {
            setMorningInput(existing.morningKg ? String(formatWeight(existing.morningKg)) : '');
            setNightInput(existing.nightKg ? String(formatWeight(existing.nightKg)) : '');
            setNoteInput(existing.notes || '');
        } else {
            setMorningInput('');
            setNightInput('');
            setNoteInput('');
        }
    }, [weightDate, normalizedLogs, formatWeight]);

    const handleSaveDualWeightLog = async (e) => {
        e.preventDefault();
        const hasMorning = morningInput !== '' && !Number.isNaN(Number(morningInput));
        const hasNight = nightInput !== '' && !Number.isNaN(Number(nightInput));

        if (!hasMorning && !hasNight) {
            showToast('Subah (Morning) ya Raat (Night) mein se kam se kam ek weight enter karein.');
            return;
        }

        const mVal = hasMorning ? Number(morningInput) : null;
        const nVal = hasNight ? Number(nightInput) : null;

        if (
            (mVal !== null && (mVal <= 25 || mVal >= 250)) ||
            (nVal !== null && (nVal <= 25 || nVal >= 250))
        ) {
            showToast(`Valid weight enter karein (25–250 ${appState.unit}).`);
            return;
        }

        const morningKg = mVal !== null ? toKg(mVal) : null;
        const nightKg = nVal !== null ? toKg(nVal) : null;
        const existingForDate = (appState.weightLogs || []).find((w) => w.date === weightDate);
        const finalMorningKg =
            morningKg !== null
                ? morningKg
                : existingForDate?.morningKg ?? existingForDate?.weightKg ?? null;
        const finalNightKg = nightKg !== null ? nightKg : existingForDate?.nightKg ?? null;
        const finalPrimaryKg = finalMorningKg || finalNightKg;

        const updatedEntry = {
            id: existingForDate?.id || `w-${Date.now()}`,
            date: weightDate,
            label: weightDate.slice(5),
            morningKg: finalMorningKg,
            nightKg: finalNightKg,
            weightKg: finalPrimaryKg,
            notes: noteInput.trim()
        };

        setAppState((prev) => {
            const nextLogs = [
                ...(prev.weightLogs || []).filter((w) => w.date !== weightDate),
                updatedEntry
            ].sort((a, b) => new Date(a.date) - new Date(b.date));

            const latestLog = nextLogs[nextLogs.length - 1];
            const firstLog = nextLogs[0];

            return {
                ...prev,
                profile: {
                    ...prev.profile,
                    startWeightKg:
                        prev.profile.startWeightKg > 0
                            ? prev.profile.startWeightKg
                            : firstLog
                              ? firstLog.weightKg
                              : finalPrimaryKg,
                    currentWeightKg: latestLog ? latestLog.weightKg : finalPrimaryKg
                },
                weightLogs: nextLogs
            };
        });

        await runCloudMutation(
            () =>
                vtaperApi.saveWeightLog(weightDate, {
                    morningKg: finalMorningKg,
                    nightKg: finalNightKg,
                    weightKg: finalPrimaryKg,
                    notes: updatedEntry.notes
                }),
            'Weight log sync failed'
        );

        const parts = [];
        if (mVal !== null) parts.push(`Subah: ${mVal}${appState.unit}`);
        if (nVal !== null) parts.push(`Raat: ${nVal}${appState.unit}`);
        showToast(`Saved to PostgreSQL (${weightDate}) — ${parts.join(' | ')}`);
    };

    const handleDeleteWeightLog = async (dateToDelete) => {
        setAppState((prev) => {
            const nextLogs = (prev.weightLogs || []).filter((w) => w.date !== dateToDelete);
            const latestLog = nextLogs[nextLogs.length - 1];
            return {
                ...prev,
                profile: {
                    ...prev.profile,
                    currentWeightKg: latestLog ? latestLog.weightKg : prev.profile.startWeightKg
                },
                weightLogs: nextLogs
            };
        });

        await runCloudMutation(
            () => vtaperApi.deleteWeightLog(dateToDelete),
            'Weight delete failed'
        );
        showToast(`Deleted weight log for ${dateToDelete}`);
    };

    const getWeekStartMonday = (dateStr) => {
        const [y, m, d] = dateStr.split('-').map(Number);
        const dt = new Date(y, m - 1, d);
        const day = dt.getDay();
        const diff = dt.getDate() - day + (day === 0 ? -6 : 1);
        const monday = new Date(dt.setDate(diff));
        return getLocalDateStr(monday);
    };

    const weeklyReports = useMemo(() => {
        const groups = {};
        normalizedLogs.forEach((log) => {
            const weekKey = getWeekStartMonday(log.date);
            if (!groups[weekKey]) groups[weekKey] = [];
            groups[weekKey].push(log);
        });

        const sortedWeeks = Object.keys(groups).sort((a, b) => new Date(a) - new Date(b));

        const reports = sortedWeeks.map((weekStart, idx) => {
            const entries = groups[weekStart];
            const morningList = entries.filter((e) => e.morningKg !== null).map((e) => e.morningKg);
            const nightList = entries.filter((e) => e.nightKg !== null).map((e) => e.nightKg);
            const primaryList = entries.map((e) => e.weightKg);
            const swingList = entries
                .filter((e) => e.fluctuationKg !== null)
                .map((e) => e.fluctuationKg);

            const avgMorningKg = morningList.length
                ? Number((morningList.reduce((a, b) => a + b, 0) / morningList.length).toFixed(2))
                : Number((primaryList.reduce((a, b) => a + b, 0) / primaryList.length).toFixed(2));

            const avgNightKg = nightList.length
                ? Number((nightList.reduce((a, b) => a + b, 0) / nightList.length).toFixed(2))
                : null;

            const avgSwingKg = swingList.length
                ? Number((swingList.reduce((a, b) => a + b, 0) / swingList.length).toFixed(2))
                : null;

            const minKg = Math.min(...primaryList);
            const maxKg = Math.max(...primaryList);
            const weekEnd = addDaysToDateStr(weekStart, 6);

            return {
                weekNumber: idx + 1,
                weekStart,
                weekEnd,
                label: `${weekStart.slice(5)} → ${weekEnd.slice(5)}`,
                daysLogged: entries.length,
                amCount: morningList.length,
                pmCount: nightList.length,
                avgMorningKg,
                avgNightKg,
                avgSwingKg,
                minKg,
                maxKg,
                weeklyDeltaKg: 0,
                status: 'BASELINE'
            };
        });

        for (let i = 1; i < reports.length; i++) {
            const delta = Number((reports[i].avgMorningKg - reports[i - 1].avgMorningKg).toFixed(2));
            reports[i].weeklyDeltaKg = delta;
            if (delta > SCIENCE_RULES.GAIN_UPPER_HARD_CAP_KG) {
                reports[i].status = 'FAST_GAIN';
            } else if (delta < SCIENCE_RULES.GAIN_LOWER_FLOOR_KG) {
                reports[i].status = 'SLOW_GAIN';
            } else {
                reports[i].status = 'OPTIMAL';
            }
        }

        return reports.reverse();
    }, [normalizedLogs]);

    const monthlyReports = useMemo(() => {
        const groups = {};
        normalizedLogs.forEach((log) => {
            const monthKey = log.date.slice(0, 7);
            if (!groups[monthKey]) groups[monthKey] = [];
            groups[monthKey].push(log);
        });

        const sortedMonths = Object.keys(groups).sort();

        return sortedMonths
            .map((monthKey) => {
                const entries = groups[monthKey];
                const [yearNum, monthNum] = monthKey.split('-').map(Number);
                const daysInMonth = new Date(yearNum, monthNum, 0).getDate();
                const monthName = new Date(yearNum, monthNum - 1, 1).toLocaleString('en-US', {
                    month: 'short',
                    year: 'numeric'
                });

                const morningList = entries.filter((e) => e.morningKg !== null).map((e) => e.morningKg);
                const nightList = entries.filter((e) => e.nightKg !== null).map((e) => e.nightKg);
                const primaryList = entries.map((e) => e.weightKg);

                const startWeightKg = primaryList[0];
                const endWeightKg = primaryList[primaryList.length - 1];
                const netGainKg = Number((endWeightKg - startWeightKg).toFixed(2));

                const avgMorningKg = morningList.length
                    ? Number((morningList.reduce((a, b) => a + b, 0) / morningList.length).toFixed(2))
                    : Number((primaryList.reduce((a, b) => a + b, 0) / primaryList.length).toFixed(2));

                const avgNightKg = nightList.length
                    ? Number((nightList.reduce((a, b) => a + b, 0) / nightList.length).toFixed(2))
                    : null;

                const minKg = Math.min(...primaryList);
                const maxKg = Math.max(...(nightList.length ? nightList : primaryList));
                const consistencyPct = Math.min(100, Math.round((entries.length / daysInMonth) * 100));

                return {
                    monthKey,
                    monthName,
                    daysLogged: entries.length,
                    daysInMonth,
                    consistencyPct,
                    amCount: morningList.length,
                    pmCount: nightList.length,
                    startWeightKg,
                    endWeightKg,
                    netGainKg,
                    avgMorningKg,
                    avgNightKg,
                    minKg,
                    maxKg
                };
            })
            .reverse();
    }, [normalizedLogs]);

    const kpiSummary = useMemo(() => {
        const firstLoggedKg = normalizedLogs.length > 0 ? normalizedLogs[0].weightKg : 0;
        const startKg =
            Number(appState.profile.startWeightKg || 0) > 0
                ? Number(appState.profile.startWeightKg)
                : firstLoggedKg;
        const goalMinKg = Number(appState.profile.goalWeightMinKg || 65);
        const latestEntry = normalizedLogs[normalizedLogs.length - 1];
        const currentKg = latestEntry ? latestEntry.weightKg : startKg;
        const hasBaseline = currentKg > 0 && startKg > 0;
        const totalGainedKg = hasBaseline ? Number((currentKg - startKg).toFixed(2)) : 0;
        const remainingToGoalKg =
            currentKg > 0 ? Math.max(0, Number((goalMinKg - currentKg).toFixed(2))) : 0;

        const dualDays = normalizedLogs.filter((w) => w.fluctuationKg !== null);
        const overallAvgSwingKg = dualDays.length
            ? Number(
                  (dualDays.reduce((acc, w) => acc + w.fluctuationKg, 0) / dualDays.length).toFixed(2)
              )
            : null;

        const weeklyVelocity =
            gainAnalysis.avgWeeklyGainKg >= 0.15 ? gainAnalysis.avgWeeklyGainKg : 0.35;
        const estWeeksToGoal =
            currentKg > 0 && remainingToGoalKg > 0 ? Math.ceil(remainingToGoalKg / weeklyVelocity) : 0;

        return {
            startKg,
            currentKg,
            hasBaseline,
            totalGainedKg,
            remainingToGoalKg,
            overallAvgSwingKg,
            estWeeksToGoal,
            dualLoggedCount: dualDays.length
        };
    }, [
        normalizedLogs,
        appState.profile.startWeightKg,
        appState.profile.goalWeightMinKg,
        gainAnalysis.avgWeeklyGainKg
    ]);

    const chartData = useMemo(() => {
        return normalizedLogs.map((w) => ({
            date: w.date.slice(5),
            fullDate: w.date,
            morning: w.morningKg !== null ? formatWeight(w.morningKg) : null,
            night: w.nightKg !== null ? formatWeight(w.nightKg) : null,
            trend: formatWeight(w.movingAvgKg),
            swing: w.fluctuationKg !== null ? formatWeight(w.fluctuationKg) : 0
        }));
    }, [normalizedLogs, formatWeight]);

    const handleSaveMeasurements = async (e) => {
        e.preventDefault();
        if (Number(measForm.shoulders || 0) <= 0 || Number(measForm.waist || 0) <= 0) {
            showToast('Shoulders aur Waist measurements (cm) enter karein.');
            return;
        }
        const payload = {
            date: getLocalDateStr(),
            shoulders: Number(measForm.shoulders || 0),
            chest: Number(measForm.chest || 0),
            waist: Number(measForm.waist || 0),
            arms: Number(measForm.arms || 0),
            thighs: Number(measForm.thighs || 0)
        };

        const res = await runCloudMutation(
            () => vtaperApi.addMeasurement(payload),
            'Measurement sync failed'
        );

        const entry = res?.measurement || {
            id: `m-${Date.now()}`,
            ...payload
        };

        setAppState((prev) => ({
            ...prev,
            measurements: [...prev.measurements, entry]
        }));
        const ratio = (entry.shoulders / Math.max(1, entry.waist)).toFixed(2);
        showToast(`Measurements saved to PostgreSQL! V-Taper Ratio: ${ratio}x`);
    };

    const liveRatio =
        measForm.shoulders > 0 && measForm.waist > 0
            ? Number((measForm.shoulders / measForm.waist).toFixed(2))
            : vTaperRatio || 0;

    const liveFormSwing =
        morningInput !== '' && nightInput !== ''
            ? Number((Number(nightInput) - Number(morningInput)).toFixed(2))
            : null;

    const morningStroke = isDark ? colors.accent : '#16A34A';
    const nightStroke = isDark ? '#38BDF8' : '#2563EB';
    const trendStroke = '#FF7A1A';

    return (
        <div className="vt-stack-5">
            {/* 1. Weekly Gain Rate Science Banner */}
            <div
                style={{
                    backgroundColor:
                        gainAnalysis.status === 'PLATEAU_SUGGESTION' ? colors.accentSurface : colors.card,
                    borderColor:
                        gainAnalysis.status === 'FAST_GAIN_WARNING'
                            ? colors.danger
                            : gainAnalysis.status === 'PLATEAU_SUGGESTION'
                              ? colors.accentBorder
                              : colors.border
                }}
                className="vt-card-b2 vt-p-card vt-resp-row-lg"
            >
                <div className="vt-stack-1">
                    <div className="vt-flex vt-items-center vt-gap-2">
                        <AlertTriangle
                            className="vt-icon-4"
                            style={{
                                color:
                                    gainAnalysis.status === 'FAST_GAIN_WARNING'
                                        ? colors.danger
                                        : isDark
                                          ? colors.accent
                                          : colors.text
                            }}
                        />
                        <span className="vt-text-xs vt-font-extrabold vt-uppercase vt-tracking-wider">
                            {gainAnalysis.headline}
                        </span>
                    </div>
                    <p className="vt-text-resp-xs-sm" style={{ color: colors.muted }}>
                        {gainAnalysis.message}
                    </p>
                </div>

                {gainAnalysis.calorieAdjustment !== 0 && (
                    <button
                        onClick={() => {
                            setAppState((prev) => ({
                                ...prev,
                                profile: {
                                    ...prev.profile,
                                    targetCalories:
                                        (prev.profile.targetCalories || 2900) + gainAnalysis.calorieAdjustment
                                }
                            }));
                            showToast(
                                `Updated daily target by ${gainAnalysis.calorieAdjustment > 0 ? '+' : ''}${gainAnalysis.calorieAdjustment} kcal!`
                            );
                        }}
                        style={{ backgroundColor: colors.accent, color: colors.accentText }}
                        className="vt-btn vt-h-44 vt-px-4 vt-rounded-xl vt-text-xs vt-font-extrabold vt-uppercase vt-shrink-0"
                    >
                        Apply {gainAnalysis.calorieAdjustment > 0 ? '+300' : '-200'} kcal
                    </button>
                )}
            </div>

            {/* 2. Top 4 Quick KPI Summary Cards */}
            <div className="vt-grid-kpi vt-gap-3 vt-tabular">
                <div
                    style={{ backgroundColor: colors.card, borderColor: colors.border }}
                    className="vt-card vt-p-4"
                >
                    <div className="vt-text-xs vt-font-bold vt-uppercase" style={{ color: colors.muted }}>
                        Total Net Gain
                    </div>
                    <div
                        style={{ color: kpiSummary.totalGainedKg >= 0 ? colors.accent : colors.danger }}
                        className="font-display vt-text-3xl vt-font-black vt-mt-1"
                    >
                        {kpiSummary.totalGainedKg >= 0 ? '+' : ''}
                        {formatWeight(kpiSummary.totalGainedKg)} {appState.unit}
                    </div>
                    <div className="vt-text-11 font-mono-num" style={{ color: colors.muted }}>
                        Start: {formatWeight(kpiSummary.startKg)} → Now: {formatWeight(kpiSummary.currentKg)} {appState.unit}
                    </div>
                </div>

                <div
                    style={{ backgroundColor: colors.card, borderColor: colors.border }}
                    className="vt-card vt-p-4"
                >
                    <div className="vt-text-xs vt-font-bold vt-uppercase" style={{ color: colors.muted }}>
                        7-Day Velocity
                    </div>
                    <div className="font-display vt-text-3xl vt-font-black vt-mt-1">
                        {gainAnalysis.avgWeeklyGainKg >= 0 ? '+' : ''}
                        {formatWeight(gainAnalysis.avgWeeklyGainKg)} {appState.unit}/wk
                    </div>
                    <div className="vt-text-11 font-mono-num" style={{ color: colors.muted }}>
                        Target: +0.25 to +0.55 kg/wk
                    </div>
                </div>

                <div
                    style={{ backgroundColor: colors.card, borderColor: colors.border }}
                    className="vt-card vt-p-4"
                >
                    <div className="vt-text-xs vt-font-bold vt-uppercase" style={{ color: colors.muted }}>
                        Avg AM→PM Swing
                    </div>
                    <div className="font-display vt-text-3xl vt-font-black vt-mt-1" style={{ color: colors.accent }}>
                        {kpiSummary.overallAvgSwingKg !== null
                            ? `${kpiSummary.overallAvgSwingKg >= 0 ? '+' : ''}${formatWeight(
                                  kpiSummary.overallAvgSwingKg
                              )} ${appState.unit}`
                            : '0'}
                    </div>
                    <div className="vt-text-11 font-mono-num" style={{ color: colors.muted }}>
                        {kpiSummary.dualLoggedCount} dual-logged days
                    </div>
                </div>

                <div
                    style={{ backgroundColor: colors.card, borderColor: colors.border }}
                    className="vt-card vt-p-4"
                >
                    <div className="vt-text-xs vt-font-bold vt-uppercase" style={{ color: colors.muted }}>
                        Goal Band ({appState.profile.goalWeightMinKg}–{appState.profile.goalWeightMaxKg} kg)
                    </div>
                    <div className="font-display vt-text-3xl vt-font-black vt-mt-1">
                        {kpiSummary.currentKg <= 0
                            ? 'Day 0'
                            : kpiSummary.remainingToGoalKg <= 0
                              ? 'Goal Hit ✓'
                              : `~${kpiSummary.estWeeksToGoal} Wks`}
                    </div>
                    <div className="vt-text-11 font-mono-num" style={{ color: colors.muted }}>
                        {kpiSummary.currentKg > 0
                            ? `${formatWeight(kpiSummary.remainingToGoalKg)} ${appState.unit} left to ${formatWeight(appState.profile.goalWeightMinKg)} ${appState.unit}`
                            : 'Log 1st morning weigh-in'}
                    </div>
                </div>
            </div>

            {/* 3. Dual Daily Weigh-In Logger + Modern Gradient Composed Chart */}
            <div className="vt-grid-lg-3 vt-gap-4">
                <form
                    onSubmit={handleSaveDualWeightLog}
                    style={{ backgroundColor: colors.card, borderColor: colors.border }}
                    className="vt-card vt-p-card vt-stack-3-5"
                >
                    <div className="vt-between-center">
                        <div className="vt-flex vt-items-center vt-gap-2">
                            <Scale className="vt-icon-5" style={{ color: isDark ? colors.accent : colors.text }} />
                            <h3 className="font-display vt-text-2xl vt-font-black vt-uppercase">
                                2× Daily Weight Log
                            </h3>
                        </div>
                        <button
                            type="button"
                            onClick={() => setWeightDate(todayStr)}
                            style={{
                                backgroundColor: weightDate === todayStr ? colors.accent : colors.elevated,
                                color: weightDate === todayStr ? colors.accentText : colors.text,
                                borderColor: weightDate === todayStr ? colors.accentBorder : colors.border
                            }}
                            className="vt-btn vt-h-32 vt-px-2-5 vt-rounded-lg vt-border vt-text-10 vt-font-extrabold vt-uppercase"
                        >
                            Today
                        </button>
                    </div>

                    <div>
                        <label
                            className="vt-block vt-text-11 vt-font-bold vt-uppercase vt-mb-1"
                            style={{ color: colors.muted }}
                        >
                            Select Date
                        </label>
                        <input
                            type="date"
                            value={weightDate}
                            onChange={(e) => setWeightDate(e.target.value)}
                            style={{
                                backgroundColor: colors.elevated,
                                borderColor: colors.border,
                                color: colors.text
                            }}
                            className="vt-input vt-h-42 vt-px-3 vt-text-sm vt-font-bold font-mono-num"
                        />
                    </div>

                    <div className="vt-grid-2 vt-gap-2-5">
                        <div
                            style={{
                                backgroundColor: colors.elevated,
                                borderColor: morningInput !== '' ? colors.accentBorder : colors.border
                            }}
                            className="vt-p-2-5 vt-box-xl vt-stack-1-5"
                        >
                            <div className="vt-flex vt-items-center vt-gap-1-5">
                                <Sun size={14} style={{ color: morningStroke }} />
                                <span className="vt-text-10 vt-font-extrabold vt-uppercase">
                                    Morning
                                </span>
                            </div>
                            <input
                                type="number"
                                inputMode="decimal"
                                step="0.05"
                                placeholder="0.0"
                                value={morningInput}
                                onChange={(e) => setMorningInput(e.target.value)}
                                style={{
                                    backgroundColor: colors.card,
                                    borderColor: colors.border,
                                    color: colors.text
                                }}
                                className="vt-input vt-h-42 vt-px-2 vt-text-center vt-text-base vt-font-extrabold font-mono-num"
                            />
                        </div>

                        <div
                            style={{
                                backgroundColor: colors.elevated,
                                borderColor: nightInput !== '' ? nightStroke : colors.border
                            }}
                            className="vt-p-2-5 vt-box-xl vt-stack-1-5"
                        >
                            <div className="vt-flex vt-items-center vt-gap-1-5">
                                <Moon size={14} style={{ color: nightStroke }} />
                                <span className="vt-text-10 vt-font-extrabold vt-uppercase">
                                    Bedtime
                                </span>
                            </div>
                            <input
                                type="number"
                                inputMode="decimal"
                                step="0.05"
                                placeholder="0.0"
                                value={nightInput}
                                onChange={(e) => setNightInput(e.target.value)}
                                style={{
                                    backgroundColor: colors.card,
                                    borderColor: colors.border,
                                    color: colors.text
                                }}
                                className="vt-input vt-h-42 vt-px-2 vt-text-center vt-text-base vt-font-extrabold font-mono-num"
                            />
                        </div>
                    </div>

                    <div>
                        <input
                            type="text"
                            placeholder="Optional note (high carbs, salt, sleep...)"
                            value={noteInput}
                            onChange={(e) => setNoteInput(e.target.value)}
                            style={{
                                backgroundColor: colors.elevated,
                                borderColor: colors.border,
                                color: colors.text
                            }}
                            className="vt-input vt-h-38 vt-px-3 vt-text-xs"
                        />
                    </div>

                    {liveFormSwing !== null && (
                        <div
                            style={{
                                backgroundColor: colors.accentSurface,
                                borderColor: colors.accentBorder
                            }}
                            className="vt-p-2-5 vt-box-xl vt-between-center vt-text-xs font-mono-num"
                        >
                            <span className="vt-font-bold">Difference (PM − AM):</span>
                            <span className="vt-font-extrabold">
                                {liveFormSwing >= 0 ? '+' : ''}
                                {liveFormSwing} {appState.unit}
                            </span>
                        </div>
                    )}

                    <button
                        type="submit"
                        style={{ backgroundColor: colors.accent, color: colors.accentText }}
                        className="vt-btn vt-w-full vt-h-46 vt-rounded-xl vt-font-extrabold vt-text-xs vt-uppercase vt-tracking-wider"
                    >
                        Save Weigh-In to PostgreSQL
                    </button>
                </form>

                {/* Modern Multi-Series Gradient Trajectory & Swing Chart */}
                <div
                    style={{ backgroundColor: colors.card, borderColor: colors.border }}
                    className="vt-col-span-lg-2 vt-card vt-p-card vt-col-between vt-stack-3"
                >
                    <div className="vt-between-center vt-flex-wrap vt-gap-2">
                        <div>
                            <h3 className="font-display vt-text-2xl vt-font-black vt-uppercase">
                                {chartMode === 'trajectory'
                                    ? `Morning vs Night + 7-Day True Trend (${appState.unit})`
                                    : `Daily Night − Morning Swing (${appState.unit})`}
                            </h3>
                            <p className="vt-text-xs" style={{ color: colors.muted }}>
                                {chartMode === 'trajectory'
                                    ? 'Shaded Goal Band = 65–68 kg • Smooth Area = Fasted Morning • Orange = 7-Day Moving Avg'
                                    : 'Tracks daily food, water & glycogen weight carried by bedtime'}
                            </p>
                        </div>

                        <div className="vt-flex vt-items-center vt-gap-1-5">
                            <button
                                type="button"
                                onClick={() => setChartMode('trajectory')}
                                style={{
                                    backgroundColor: chartMode === 'trajectory' ? colors.accent : colors.elevated,
                                    color: chartMode === 'trajectory' ? colors.accentText : colors.text,
                                    borderColor: chartMode === 'trajectory' ? colors.accentBorder : colors.border
                                }}
                                className="vt-btn vt-h-34 vt-px-2-5 vt-rounded-lg vt-border vt-text-11 vt-font-extrabold vt-uppercase"
                            >
                                AM/PM Trend
                            </button>
                            <button
                                type="button"
                                onClick={() => setChartMode('fluctuation')}
                                style={{
                                    backgroundColor: chartMode === 'fluctuation' ? colors.accent : colors.elevated,
                                    color: chartMode === 'fluctuation' ? colors.accentText : colors.text,
                                    borderColor: chartMode === 'fluctuation' ? colors.accentBorder : colors.border
                                }}
                                className="vt-btn vt-h-34 vt-px-2-5 vt-rounded-lg vt-border vt-text-11 vt-font-extrabold vt-uppercase"
                            >
                                Daily Swing
                            </button>
                        </div>
                    </div>

                    {chartMode === 'trajectory' && (
                        <div className="vt-row-wrap vt-gap-3 vt-text-11 vt-font-bold">
                            <span className="vt-flex vt-items-center vt-gap-1-5">
                                <span className="vt-legend-dot" style={{ backgroundColor: morningStroke }} />
                                Morning (AM)
                            </span>
                            <span className="vt-flex vt-items-center vt-gap-1-5">
                                <span className="vt-legend-dot" style={{ backgroundColor: trendStroke }} />
                                7-Day True Trend
                            </span>
                            <span className="vt-flex vt-items-center vt-gap-1-5">
                                <span className="vt-legend-dot" style={{ backgroundColor: nightStroke }} />
                                Night (PM)
                            </span>
                        </div>
                    )}

                    <div className="vt-chart-h-60" style={{ width: '100%', height: 265 }}>
                        {chartData.length > 0 ? (
                            chartMode === 'trajectory' ? (
                                (() => {
                                    const allVals = chartData
                                        .flatMap((d) => [d.morning, d.night, d.trend])
                                        .filter((v) => typeof v === 'number' && !Number.isNaN(v));
                                    const yMin = allVals.length
                                        ? Math.floor((Math.min(...allVals) - 0.8) * 10) / 10
                                        : 'auto';
                                    const yMax = allVals.length
                                        ? Math.ceil((Math.max(...allVals) + 0.8) * 10) / 10
                                        : 'auto';

                                    return (
                                        <ResponsiveContainer width="100%" height={265}>
                                            <ComposedChart data={chartData} margin={{ top: 12, right: 16, left: -10, bottom: 0 }}>
                                                <defs>
                                                    <linearGradient id="vtMorningAreaGrad" x1="0" y1="0" x2="0" y2="1">
                                                        <stop offset="0%" stopColor={morningStroke} stopOpacity={0.34} />
                                                        <stop offset="100%" stopColor={morningStroke} stopOpacity={0.02} />
                                                    </linearGradient>
                                                </defs>
                                                <CartesianGrid stroke={colors.border} strokeDasharray="3 3" vertical={false} />
                                                <XAxis dataKey="date" stroke={colors.muted} fontSize={11} tickLine={false} axisLine={false} />
                                                <YAxis stroke={colors.muted} fontSize={11} tickLine={false} axisLine={false} domain={[yMin, yMax]} />
                                                <Tooltip
                                                    content={
                                                        <ModernChartTooltip
                                                            colors={colors}
                                                            suffixMap={{
                                                                morning: appState.unit,
                                                                trend: appState.unit,
                                                                night: appState.unit
                                                            }}
                                                        />
                                                    }
                                                />
                                                <ReferenceArea
                                                    y1={formatWeight(appState.profile.goalWeightMinKg)}
                                                    y2={formatWeight(appState.profile.goalWeightMaxKg)}
                                                    fill={colors.accent}
                                                    fillOpacity={0.12}
                                                />
                                                <ReferenceLine
                                                    y={formatWeight(appState.profile.goalWeightMinKg)}
                                                    stroke={colors.accentBorder}
                                                    strokeDasharray="4 4"
                                                />
                                                <Area
                                                    type="monotone"
                                                    dataKey="morning"
                                                    name="Morning (AM)"
                                                    stroke={morningStroke}
                                                    strokeWidth={2.8}
                                                    fill="url(#vtMorningAreaGrad)"
                                                    connectNulls
                                                    dot={{ r: 4.5, fill: morningStroke, stroke: colors.card, strokeWidth: 1.5 }}
                                                    activeDot={{ r: 7 }}
                                                />
                                                <Line
                                                    type="monotone"
                                                    dataKey="trend"
                                                    name="7-Day Avg Trend"
                                                    stroke={trendStroke}
                                                    strokeWidth={2.5}
                                                    strokeDasharray="5 4"
                                                    dot={false}
                                                />
                                                <Line
                                                    type="monotone"
                                                    dataKey="night"
                                                    name="Night (PM)"
                                                    stroke={nightStroke}
                                                    strokeWidth={2.5}
                                                    connectNulls
                                                    dot={{ r: 4.5, fill: nightStroke, stroke: colors.card, strokeWidth: 1.5 }}
                                                    activeDot={{ r: 6.5 }}
                                                />
                                            </ComposedChart>
                                        </ResponsiveContainer>
                                    );
                                })()
                            ) : (
                                <ResponsiveContainer width="100%" height={265}>
                                    <BarChart data={chartData} margin={{ top: 12, right: 16, left: -10, bottom: 0 }}>
                                        <defs>
                                            <linearGradient id="vtSwingBarGrad" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="0%" stopColor={nightStroke} stopOpacity={0.95} />
                                                <stop offset="100%" stopColor={nightStroke} stopOpacity={0.25} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid stroke={colors.border} strokeDasharray="3 3" vertical={false} />
                                        <XAxis dataKey="date" stroke={colors.muted} fontSize={11} tickLine={false} axisLine={false} />
                                        <YAxis stroke={colors.muted} fontSize={11} tickLine={false} axisLine={false} />
                                        <Tooltip
                                            content={<ModernChartTooltip colors={colors} suffixMap={{ swing: appState.unit }} />}
                                        />
                                        <ReferenceLine y={0} stroke={colors.border} />
                                        <Bar
                                            dataKey="swing"
                                            name="PM − AM Delta"
                                            fill="url(#vtSwingBarGrad)"
                                            radius={[8, 8, 2, 2]}
                                            maxBarSize={36}
                                        />
                                    </BarChart>
                                </ResponsiveContainer>
                            )
                        ) : (
                            <div
                                style={{ backgroundColor: colors.elevated, borderColor: colors.border, color: colors.muted }}
                                className="vt-h-full vt-box-xl vt-flex vt-items-center vt-justify-center vt-text-xs vt-font-semibold vt-p-4 vt-text-center"
                            >
                                0 weight entries yet — left form mein apna Morning & Bedtime weight log karein aur 65–68 kg goal trajectory dekhein.
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* 4. WEEKLY & MONTHLY WEIGHT PROGRESS REPORTS */}
            <div
                style={{ backgroundColor: colors.card, borderColor: colors.border }}
                className="vt-card vt-p-card vt-stack-4"
            >
                <div className="vt-between-center vt-flex-wrap vt-gap-3">
                    <div>
                        <span
                            style={{ backgroundColor: colors.accent, color: colors.accentText }}
                            className="vt-badge-lg vt-text-10 vt-font-extrabold vt-uppercase"
                        >
                            Automated Analytics Engine
                        </span>
                        <h3 className="font-display vt-text-resp-2xl-3xl vt-font-black vt-uppercase vt-mt-1">
                            Weekly & Monthly Weight Progress Reports
                        </h3>
                        <p className="vt-text-xs" style={{ color: colors.muted }}>
                            True hypertrophy progress hamesha weekly aur monthly Morning Average se measure hota hai — daily water fluctuation eliminate ho jata hai.
                        </p>
                    </div>

                    <div className="vt-flex vt-items-center vt-gap-1-5 vt-flex-wrap">
                        {[
                            { id: 'weekly', label: `Weekly (${weeklyReports.length})` },
                            { id: 'monthly', label: `Monthly (${monthlyReports.length})` },
                            { id: 'history', label: `Daily Logs (${normalizedLogs.length})` }
                        ].map((t) => {
                            const active = reportTab === t.id;
                            return (
                                <button
                                    key={t.id}
                                    type="button"
                                    onClick={() => setReportTab(t.id)}
                                    style={{
                                        backgroundColor: active ? colors.accent : colors.elevated,
                                        color: active ? colors.accentText : colors.text,
                                        borderColor: active ? colors.accentBorder : colors.border
                                    }}
                                    className="vt-btn vt-h-38 vt-px-3 vt-box-xl vt-text-xs vt-font-extrabold vt-uppercase"
                                >
                                    {t.label}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {reportTab === 'weekly' && (
                    <div className="vt-grid-md-2 vt-gap-3 vt-tabular">
                        {weeklyReports.length === 0 ? (
                            <div
                                style={{ backgroundColor: colors.elevated, borderColor: colors.border, color: colors.muted }}
                                className="vt-p-4 vt-box-xl vt-text-xs"
                            >
                                0 weekly reports yet. Roz subah aur raat weight log karein.
                            </div>
                        ) : (
                            weeklyReports.map((wk) => {
                                const badgeBg =
                                    wk.status === 'OPTIMAL'
                                        ? colors.accent
                                        : wk.status === 'FAST_GAIN'
                                          ? colors.danger
                                          : colors.elevated;
                                const badgeColor =
                                    wk.status === 'OPTIMAL'
                                        ? colors.accentText
                                        : wk.status === 'FAST_GAIN'
                                          ? '#FFFFFF'
                                          : colors.text;
                                const badgeText =
                                    wk.status === 'BASELINE'
                                        ? 'Baseline Week'
                                        : wk.status === 'OPTIMAL'
                                          ? 'Optimal Gain ✓'
                                          : wk.status === 'FAST_GAIN'
                                            ? 'Fast Gain'
                                            : 'Slow / Plateau';

                                return (
                                    <div
                                        key={wk.weekStart}
                                        style={{ backgroundColor: colors.elevated, borderColor: colors.border }}
                                        className="vt-p-4 vt-box-xl vt-stack-3"
                                    >
                                        <div className="vt-between-start vt-gap-2">
                                            <div>
                                                <div className="vt-text-10 vt-font-extrabold vt-uppercase" style={{ color: colors.muted }}>
                                                    Week #{wk.weekNumber} • {wk.label}
                                                </div>
                                                <div className="font-display vt-text-2xl vt-font-black vt-mt-0-5">
                                                    Avg Subah: {formatWeight(wk.avgMorningKg)} {appState.unit}
                                                </div>
                                            </div>
                                            <span
                                                style={{ backgroundColor: badgeBg, color: badgeColor, borderColor: colors.border }}
                                                className="vt-badge vt-border vt-text-10 vt-font-extrabold vt-uppercase"
                                            >
                                                {badgeText}
                                            </span>
                                        </div>

                                        <div className="vt-grid-3 vt-gap-2 vt-pt-2 vt-border-t" style={{ borderColor: colors.border }}>
                                            <div>
                                                <div className="vt-text-10 vt-uppercase" style={{ color: colors.muted }}>
                                                    Vs Prev Week
                                                </div>
                                                <div
                                                    className="vt-text-sm vt-font-extrabold font-mono-num"
                                                    style={{ color: wk.weeklyDeltaKg > 0 ? colors.success : colors.text }}
                                                >
                                                    {wk.status === 'BASELINE'
                                                        ? 'Start'
                                                        : `${wk.weeklyDeltaKg >= 0 ? '+' : ''}${formatWeight(wk.weeklyDeltaKg)} ${appState.unit}`}
                                                </div>
                                            </div>

                                            <div>
                                                <div className="vt-text-10 vt-uppercase" style={{ color: colors.muted }}>
                                                    Average (PM)
                                                </div>
                                                <div className="vt-text-sm vt-font-extrabold font-mono-num" style={{ color: nightStroke }}>
                                                    {wk.avgNightKg !== null ? `${formatWeight(wk.avgNightKg)} ${appState.unit}` : '--'}
                                                </div>
                                            </div>

                                            <div>
                                                <div className="vt-text-10 vt-uppercase" style={{ color: colors.muted }}>
                                                    Avg PM−AM Diff
                                                </div>
                                                <div className="vt-text-sm vt-font-extrabold font-mono-num">
                                                    {wk.avgSwingKg !== null ? `+${formatWeight(wk.avgSwingKg)} ${appState.unit}` : '--'}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="vt-between-center vt-text-11 font-mono-num vt-pt-1" style={{ color: colors.muted }}>
                                            <span>
                                                Range: {formatWeight(wk.minKg)} – {formatWeight(wk.maxKg)} {appState.unit}
                                            </span>
                                            <span>
                                                Logged: {wk.amCount} AM • {wk.pmCount} PM ({wk.daysLogged}/7d)
                                            </span>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                )}

                {reportTab === 'monthly' && (
                    <div className="vt-grid-md-2 vt-gap-3 vt-tabular">
                        {monthlyReports.length === 0 ? (
                            <div
                                style={{ backgroundColor: colors.elevated, borderColor: colors.border, color: colors.muted }}
                                className="vt-p-4 vt-box-xl vt-text-xs"
                            >
                                0 monthly reports available yet.
                            </div>
                        ) : (
                            monthlyReports.map((mo) => (
                                <div
                                    key={mo.monthKey}
                                    style={{ backgroundColor: colors.elevated, borderColor: colors.border }}
                                    className="vt-p-4 vt-box-xl vt-stack-3"
                                >
                                    <div className="vt-between-start vt-gap-2">
                                        <div>
                                            <div className="vt-text-10 vt-font-extrabold vt-uppercase" style={{ color: colors.muted }}>
                                                Monthly Summary • {mo.daysLogged}/{mo.daysInMonth} Days ({mo.consistencyPct}%)
                                            </div>
                                            <div className="font-display vt-text-2xl vt-font-black vt-uppercase vt-mt-0-5">
                                                {mo.monthName}
                                            </div>
                                        </div>
                                        <span
                                            style={{ backgroundColor: colors.accent, color: colors.accentText }}
                                            className="vt-badge vt-text-xs vt-font-extrabold font-mono-num"
                                        >
                                            {mo.netGainKg >= 0 ? '+' : ''}
                                            {formatWeight(mo.netGainKg)} {appState.unit} Net
                                        </span>
                                    </div>

                                    <div className="vt-grid-3 vt-gap-2 vt-pt-2 vt-border-t" style={{ borderColor: colors.border }}>
                                        <div>
                                            <div className="vt-text-10 vt-uppercase" style={{ color: colors.muted }}>
                                                Start → End
                                            </div>
                                            <div className="vt-text-xs vt-font-extrabold font-mono-num">
                                                {formatWeight(mo.startWeightKg)} → {formatWeight(mo.endWeightKg)} {appState.unit}
                                            </div>
                                        </div>
                                        <div>
                                            <div className="vt-text-10 vt-uppercase" style={{ color: colors.muted }}>
                                                Month Avg AM
                                            </div>
                                            <div className="vt-text-xs vt-font-extrabold font-mono-num">
                                                {formatWeight(mo.avgMorningKg)} {appState.unit}
                                            </div>
                                        </div>
                                        <div>
                                            <div className="vt-text-10 vt-uppercase" style={{ color: colors.muted }}>
                                                Month Avg PM
                                            </div>
                                            <div className="vt-text-xs vt-font-extrabold font-mono-num" style={{ color: nightStroke }}>
                                                {mo.avgNightKg !== null ? `${formatWeight(mo.avgNightKg)} ${appState.unit}` : '--'}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="vt-between-center vt-text-11 font-mono-num vt-pt-1" style={{ color: colors.muted }}>
                                        <span>
                                            Min/Max: {formatWeight(mo.minKg)} – {formatWeight(mo.maxKg)} {appState.unit}
                                        </span>
                                        <span>
                                            Check-ins: {mo.amCount} AM • {mo.pmCount} PM
                                        </span>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                )}

                {reportTab === 'history' && (
                    <div className="vt-stack-2 vt-tabular">
                        {normalizedLogs.length === 0 ? (
                            <div
                                style={{ backgroundColor: colors.elevated, borderColor: colors.border, color: colors.muted }}
                                className="vt-p-4 vt-box-xl vt-text-xs"
                            >
                                0 daily weight logs yet.
                            </div>
                        ) : (
                            [...normalizedLogs].reverse().map((entry) => (
                                <div
                                    key={entry.date}
                                    style={{
                                        backgroundColor: entry.date === weightDate ? colors.accentSurface : colors.elevated,
                                        borderColor: entry.date === weightDate ? colors.accentBorder : colors.border
                                    }}
                                    className="vt-p-3 vt-box-xl vt-between-center vt-flex-wrap vt-gap-2 vt-text-xs"
                                >
                                    <div className="vt-flex vt-items-center vt-gap-3 vt-flex-wrap">
                                        <span className="font-mono-num vt-font-extrabold">{entry.date}</span>
                                        <span className="font-mono-num">
                                            <strong style={{ color: morningStroke }}>Subah:</strong>{' '}
                                            {entry.morningKg !== null ? `${formatWeight(entry.morningKg)} ${appState.unit}` : '--'}
                                        </span>
                                        <span className="font-mono-num">
                                            <strong style={{ color: nightStroke }}>Raat:</strong>{' '}
                                            {entry.nightKg !== null ? `${formatWeight(entry.nightKg)} ${appState.unit}` : '--'}
                                        </span>
                                        {entry.fluctuationKg !== null && (
                                            <span
                                                style={{ backgroundColor: colors.card, borderColor: colors.border }}
                                                className="vt-badge-xs vt-border font-mono-num"
                                            >
                                                Diff: {entry.fluctuationKg >= 0 ? '+' : ''}
                                                {formatWeight(entry.fluctuationKg)} {appState.unit}
                                            </span>
                                        )}
                                        {entry.notes && (
                                            <span style={{ color: colors.muted }} className="vt-text-11">
                                                • “{entry.notes}”
                                            </span>
                                        )}
                                    </div>

                                    <div className="vt-flex vt-items-center vt-gap-1-5">
                                        <button
                                            type="button"
                                            onClick={() => setWeightDate(entry.date)}
                                            style={{ backgroundColor: colors.card, borderColor: colors.border, color: colors.text }}
                                            className="vt-btn vt-h-32 vt-px-2-5 vt-rounded-lg vt-border vt-text-10 vt-font-extrabold vt-uppercase"
                                        >
                                            Edit
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => handleDeleteWeightLog(entry.date)}
                                            aria-label={`Delete log for ${entry.date}`}
                                            style={{ backgroundColor: colors.card, borderColor: colors.border, color: colors.danger }}
                                            className="vt-btn vt-h-32 vt-px-2 vt-rounded-lg vt-border"
                                        >
                                            <Trash2 size={13} />
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                )}
            </div>

            {/* 5. V-Taper Body Measurements + V-Taper Gauge */}
            <div className="vt-grid-lg-3 vt-gap-4">
                <div
                    style={{ backgroundColor: colors.card, borderColor: colors.border }}
                    className="vt-col-span-lg-2 vt-card vt-p-card vt-stack-4 vt-col-between"
                >
                    <div className="vt-between-center vt-flex-wrap vt-gap-3">
                        <div>
                            <h3 className="font-display vt-text-resp-2xl-3xl vt-font-black vt-uppercase">
                                V-Taper Body Measurements (cm)
                            </h3>
                            <p className="vt-text-xs" style={{ color: colors.muted }}>
                                Auto-calculates Shoulder-to-Waist Ratio (Goal: 1.40–1.50x). Keep waist gain ≤ 4 cm across the bulk.
                            </p>
                        </div>

                        <div
                            style={{ backgroundColor: colors.accent, color: colors.accentText }}
                            className="vt-px-3-5 vt-py-2 vt-rounded-xl font-mono-num vt-text-right"
                        >
                            <div className="vt-text-10 vt-font-extrabold vt-uppercase">Current V-Taper Ratio</div>
                            <div className="font-display vt-text-2xl vt-font-black">
                                {liveRatio > 0 ? `${liveRatio.toFixed(2)}x` : '0.00x'}
                            </div>
                        </div>
                    </div>

                    <form onSubmit={handleSaveMeasurements} className="vt-grid-meas vt-gap-2-5 vt-items-end">
                        {[
                            { key: 'shoulders', label: 'Shoulders (cm)' },
                            { key: 'chest', label: 'Chest (cm)' },
                            { key: 'waist', label: 'Waist @ Navel (cm)' },
                            { key: 'arms', label: 'Arms (cm)' },
                            { key: 'thighs', label: 'Thighs (cm)' }
                        ].map((field) => (
                            <div key={field.key}>
                                <label
                                    className="vt-block vt-text-11 vt-font-bold vt-uppercase vt-mb-1"
                                    style={{ color: colors.muted }}
                                >
                                    {field.label}
                                </label>
                                <input
                                    type="number"
                                    inputMode="decimal"
                                    step="0.5"
                                    placeholder="0"
                                    value={measForm[field.key] === 0 ? '' : measForm[field.key]}
                                    onChange={(e) =>
                                        setMeasForm((prev) => ({
                                            ...prev,
                                            [field.key]: e.target.value === '' ? 0 : Number(e.target.value)
                                        }))
                                    }
                                    style={{
                                        backgroundColor: colors.elevated,
                                        borderColor: colors.border,
                                        color: colors.text
                                    }}
                                    className="vt-input vt-h-44 vt-px-3 vt-text-sm vt-font-extrabold font-mono-num"
                                />
                            </div>
                        ))}
                        <button
                            type="submit"
                            style={{ backgroundColor: colors.accent, color: colors.accentText }}
                            className="vt-btn vt-col-span-2-sm-1 vt-h-44 vt-rounded-xl vt-font-extrabold vt-text-xs vt-uppercase vt-tracking-wider"
                        >
                            Save Tape
                        </button>
                    </form>
                </div>

                <VTaperGauge ratio={liveRatio} colors={colors} isDark={isDark} />
            </div>

            {/* 6. Consistency Heatmap, Volume Bars & Strength Curve */}
            <ProgressCharts
                appState={appState}
                formatWeight={formatWeight}
                colors={colors}
                isDark={isDark}
            />
        </div>
    );
}

// ============================================================================
// SECTION 15: STATS VIEW (COMPLETE WEEKLY & MONTHLY OVERVIEW + MUSCLE RADAR)
// ============================================================================

function StatsView({
    colors,
    isDark,
    appState,
    disciplineStats,
    formatWeight,
    overviewRefreshKey
}) {
    const volumes = useMemo(() => computeWeeklyMuscleVolumes(), []);
    const unitTests = useMemo(() => runBuiltInUnitTests(), []);

    const [overviewPeriod, setOverviewPeriod] = useState('weekly');
    const [overviewData, setOverviewData] = useState(null);
    const [overviewLoading, setOverviewLoading] = useState(false);
    const [overviewError, setOverviewError] = useState('');

    const fetchOverview = useCallback(async (period) => {
        setOverviewLoading(true);
        setOverviewError('');
        try {
            const res = await vtaperApi.getOverview(period);
            setOverviewData(res);
        } catch (err) {
            setOverviewError(err.message || 'Backend overview unavailable');
        } finally {
            setOverviewLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchOverview(overviewPeriod);
    }, [overviewPeriod, overviewRefreshKey, fetchOverview]);

    const currentPeriod = overviewData?.current || null;
    const previousPeriod = overviewData?.previous || null;
    const deltas = overviewData?.deltas || null;
    const highlights = overviewData?.highlights || [];
    const timeline = overviewData?.timeline || [];

    const formatDeltaChip = (val, suffix = '', invertGood = false) => {
        if (val === null || val === undefined || Number.isNaN(Number(val))) return null;
        const num = Number(val);
        const positive = invertGood ? num <= 0 : num >= 0;
        const sign = num > 0 ? '+' : '';
        return (
            <span
                style={{
                    color: num === 0 ? colors.muted : positive ? colors.success : colors.danger,
                    fontWeight: 800
                }}
                className="font-mono-num vt-text-11"
            >
                {sign}
                {num}
                {suffix} vs {overviewPeriod === 'weekly' ? 'last wk' : 'last mo'}
            </span>
        );
    };

    return (
        <div className="vt-stack-5">
            {/* 1. COMPLETE WEEKLY & MONTHLY OVERVIEW DASHBOARD (POWERED BY POSTGRESQL) */}
            <div
                style={{ backgroundColor: colors.card, borderColor: colors.accentBorder }}
                className="vt-card-b2 vt-p-card vt-stack-4"
            >
                <div className="vt-between-center vt-flex-wrap vt-gap-3">
                    <div>
                        <div className="vt-row-wrap vt-gap-2">
                            <span
                                style={{ backgroundColor: colors.accent, color: colors.accentText }}
                                className="vt-badge-lg vt-text-10 vt-font-extrabold vt-uppercase"
                            >
                                Complete {overviewPeriod === 'weekly' ? 'Weekly' : 'Monthly'} Overview
                            </span>
                            {currentPeriod && (
                                <span
                                    style={{ backgroundColor: colors.elevated, borderColor: colors.border }}
                                    className="vt-badge vt-border font-mono-num vt-text-11 vt-font-extrabold"
                                >
                                    {currentPeriod.label}
                                </span>
                            )}
                        </div>
                        <h2 className="font-display vt-text-resp-3xl-4xl vt-font-black vt-uppercase vt-mt-1">
                            {overviewPeriod === 'weekly'
                                ? 'Is Hafte & Pichle Hafte Ka Complete Report'
                                : 'Is Mahine & Pichle Mahine Ka Complete Report'}
                        </h2>
                        <p className="vt-text-xs" style={{ color: colors.muted }}>
                            Workout volume, sets, PRs, Morning/Night weight, nutrition avg, clean streak, cardio aur pelvic rehab — sab ek jagah PostgreSQL se live calculate hota hai.
                        </p>
                    </div>

                    <div className="vt-flex vt-items-center vt-gap-1-5">
                        {['weekly', 'monthly'].map((p) => {
                            const active = overviewPeriod === p;
                            return (
                                <button
                                    key={p}
                                    type="button"
                                    onClick={() => setOverviewPeriod(p)}
                                    style={{
                                        backgroundColor: active ? colors.accent : colors.elevated,
                                        color: active ? colors.accentText : colors.text,
                                        borderColor: active ? colors.accentBorder : colors.border
                                    }}
                                    className="vt-btn vt-h-40 vt-px-3-5 vt-box-xl vt-text-xs vt-font-extrabold vt-uppercase"
                                >
                                    {p}
                                </button>
                            );
                        })}
                        <button
                            type="button"
                            onClick={() => fetchOverview(overviewPeriod)}
                            aria-label="Refresh overview"
                            style={{ backgroundColor: colors.elevated, borderColor: colors.border, color: colors.text }}
                            className="vt-icon-btn-44"
                        >
                            <RefreshCw size={16} />
                        </button>
                    </div>
                </div>

                {overviewLoading && !currentPeriod ? (
                    <div
                        style={{ backgroundColor: colors.elevated, borderColor: colors.border, color: colors.muted }}
                        className="vt-p-4 vt-box-xl vt-text-xs vt-font-semibold"
                    >
                        Loading {overviewPeriod} overview from PostgreSQL...
                    </div>
                ) : overviewError && !currentPeriod ? (
                    <div
                        style={{ backgroundColor: colors.elevated, borderColor: colors.danger, color: colors.danger }}
                        className="vt-p-4 vt-box-xl vt-text-xs vt-font-bold"
                    >
                        {overviewError} — Backend start karke refresh button dabayein.
                    </div>
                ) : currentPeriod ? (
                    <>
                        {/* Consistency Score & Progress Highlights Banner */}
                        <div
                            style={{ backgroundColor: colors.elevated, borderColor: colors.border }}
                            className="vt-p-4 vt-box-xl vt-resp-row-md vt-gap-3"
                        >
                            <div className="vt-stack-1 vt-flex-1">
                                <div className="vt-text-xs vt-font-extrabold vt-uppercase" style={{ color: isDark ? colors.accent : colors.text }}>
                                    Progress Summary ({overviewPeriod === 'weekly' ? 'Week-over-Week' : 'Month-over-Month'})
                                </div>
                                {highlights.length > 0 ? (
                                    <div className="vt-stack-1 vt-text-xs">
                                        {highlights.map((h, i) => (
                                            <div key={i}>• {h}</div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="vt-text-xs" style={{ color: colors.muted }}>
                                        {previousPeriod
                                            ? `Comparing ${currentPeriod.label} against ${previousPeriod.label}.`
                                            : 'Yeh aapka pehla tracked period hai — agle hafte/mahine se automatic comparison delta aur growth highlights dikhenge.'}
                                    </p>
                                )}
                            </div>

                            <div
                                style={{
                                    backgroundColor: colors.card,
                                    borderColor: colors.accentBorder,
                                    minWidth: 132,
                                    textAlign: 'center'
                                }}
                                className="vt-p-3 vt-box-xl vt-shrink-0"
                            >
                                <div className="vt-text-10 vt-font-extrabold vt-uppercase" style={{ color: colors.muted }}>
                                    Consistency Score
                                </div>
                                <div
                                    className="font-display vt-text-3xl vt-font-black"
                                    style={{ color: isDark ? colors.accent : colors.text }}
                                >
                                    {currentPeriod.overallScore}/100
                                </div>
                                {deltas && formatDeltaChip(deltas.overallScoreDiff, ' pts')}
                            </div>
                        </div>

                        {/* 6-Pillar Current Period Grid */}
                        <div className="vt-grid-md-3 vt-gap-3 vt-tabular">
                            {/* Pillar 1: Workouts & Volume */}
                            <div
                                style={{ backgroundColor: colors.elevated, borderColor: colors.border }}
                                className="vt-p-3-5 vt-box-xl vt-stack-1-5"
                            >
                                <div className="vt-between-center">
                                    <span className="vt-text-10 vt-font-extrabold vt-uppercase" style={{ color: colors.muted }}>
                                        Workouts & Volume
                                    </span>
                                    <Dumbbell size={15} style={{ color: isDark ? colors.accent : colors.text }} />
                                </div>
                                <div className="font-display vt-text-2xl vt-font-black">
                                    {currentPeriod.workout.sessions} / {currentPeriod.workout.targetSessions} Sessions
                                </div>
                                <div className="vt-text-xs font-mono-num">
                                    Vol: <strong>{formatWeight(currentPeriod.workout.totalVolumeKg)} {appState.unit}</strong> •{' '}
                                    {currentPeriod.workout.totalSets} sets • {currentPeriod.workout.totalPRs} PRs
                                </div>
                                {deltas && (
                                    <div>
                                        {formatDeltaChip(
                                            formatWeight(deltas.volumeDiffKg),
                                            ` ${appState.unit}${deltas.volumeDiffPct !== null ? ` (${deltas.volumeDiffPct}%)` : ''}`
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Pillar 2: Weight Velocity */}
                            <div
                                style={{ backgroundColor: colors.elevated, borderColor: colors.border }}
                                className="vt-p-3-5 vt-box-xl vt-stack-1-5"
                            >
                                <div className="vt-between-center">
                                    <span className="vt-text-10 vt-font-extrabold vt-uppercase" style={{ color: colors.muted }}>
                                        Body Weight (AM / PM)
                                    </span>
                                    <Scale size={15} style={{ color: isDark ? colors.accent : colors.text }} />
                                </div>
                                <div className="font-display vt-text-2xl vt-font-black">
                                    {currentPeriod.weight.avgMorningKg !== null
                                        ? `${formatWeight(currentPeriod.weight.avgMorningKg)} ${appState.unit} AM`
                                        : 'No Logs'}
                                </div>
                                <div className="vt-text-xs font-mono-num" style={{ color: colors.muted }}>
                                    PM Avg:{' '}
                                    <strong style={{ color: colors.text }}>
                                        {currentPeriod.weight.avgNightKg !== null
                                            ? `${formatWeight(currentPeriod.weight.avgNightKg)} ${appState.unit}`
                                            : '--'}
                                    </strong>{' '}
                                    • {currentPeriod.weight.daysLogged} weigh-ins
                                </div>
                                {deltas && formatDeltaChip(
                                    deltas.weightAvgDiffKg !== null ? formatWeight(deltas.weightAvgDiffKg) : null,
                                    ` ${appState.unit}`
                                )}
                            </div>

                            {/* Pillar 3: Nutrition & Protein */}
                            <div
                                style={{ backgroundColor: colors.elevated, borderColor: colors.border }}
                                className="vt-p-3-5 vt-box-xl vt-stack-1-5"
                            >
                                <div className="vt-between-center">
                                    <span className="vt-text-10 vt-font-extrabold vt-uppercase" style={{ color: colors.muted }}>
                                        Nutrition Average
                                    </span>
                                    <Utensils size={15} style={{ color: isDark ? colors.accent : colors.text }} />
                                </div>
                                <div className="font-display vt-text-2xl vt-font-black">
                                    {currentPeriod.nutrition.avgKcal} kcal • {currentPeriod.nutrition.avgProteinG}g P
                                </div>
                                <div className="vt-text-xs font-mono-num" style={{ color: colors.muted }}>
                                    110g+ Protein: <strong style={{ color: colors.text }}>{currentPeriod.nutrition.proteinFloorHitDays}/{currentPeriod.nutrition.daysLogged}d</strong>
                                </div>
                                {deltas && formatDeltaChip(deltas.avgProteinDiffG, 'g P/day')}
                            </div>

                            {/* Pillar 4: Clean Discipline */}
                            <div
                                style={{ backgroundColor: colors.elevated, borderColor: colors.border }}
                                className="vt-p-3-5 vt-box-xl vt-stack-1-5"
                            >
                                <div className="vt-between-center">
                                    <span className="vt-text-10 vt-font-extrabold vt-uppercase" style={{ color: colors.muted }}>
                                        Clean Discipline
                                    </span>
                                    <Brain size={15} style={{ color: isDark ? colors.accent : colors.text }} />
                                </div>
                                <div className="font-display vt-text-2xl vt-font-black">
                                    {currentPeriod.discipline.cleanRatePct}% Clean
                                </div>
                                <div className="vt-text-xs font-mono-num" style={{ color: colors.muted }}>
                                    {currentPeriod.discipline.cleanDays} clean • {currentPeriod.discipline.relapseDays} slips •{' '}
                                    {currentPeriod.discipline.urgesDefeated} urges beat
                                </div>
                                {deltas && formatDeltaChip(deltas.cleanRateDiffPct, '%')}
                            </div>

                            {/* Pillar 5: Hydration & Sleep */}
                            <div
                                style={{ backgroundColor: colors.elevated, borderColor: colors.border }}
                                className="vt-p-3-5 vt-box-xl vt-stack-1-5"
                            >
                                <div className="vt-between-center">
                                    <span className="vt-text-10 vt-font-extrabold vt-uppercase" style={{ color: colors.muted }}>
                                        Water & Sleep Avg
                                    </span>
                                    <Droplets size={15} style={{ color: isDark ? colors.accent : colors.text }} />
                                </div>
                                <div className="font-display vt-text-2xl vt-font-black">
                                    {(currentPeriod.nutrition.avgWaterMl / 1000).toFixed(2)}L • {currentPeriod.nutrition.avgSleepHours || 0}h
                                </div>
                                <div className="vt-text-xs font-mono-num" style={{ color: colors.muted }}>
                                    3.5L Goal Hit: <strong style={{ color: colors.text }}>{currentPeriod.nutrition.waterGoalHitDays} days</strong>
                                </div>
                            </div>

                            {/* Pillar 6: Cardio, Pelvic & V-Taper */}
                            <div
                                style={{ backgroundColor: colors.elevated, borderColor: colors.border }}
                                className="vt-p-3-5 vt-box-xl vt-stack-1-5"
                            >
                                <div className="vt-between-center">
                                    <span className="vt-text-10 vt-font-extrabold vt-uppercase" style={{ color: colors.muted }}>
                                        Cardio • Pelvic • Ratio
                                    </span>
                                    <Activity size={15} style={{ color: isDark ? colors.accent : colors.text }} />
                                </div>
                                <div className="font-display vt-text-2xl vt-font-black">
                                    {currentPeriod.recovery.cardioSessions} Cardio • {currentPeriod.recovery.pelvicSessions} Rehab
                                </div>
                                <div className="vt-text-xs font-mono-num" style={{ color: colors.muted }}>
                                    V-Taper:{' '}
                                    <strong style={{ color: colors.text }}>
                                        {currentPeriod.body.vTaperRatio ? `${currentPeriod.body.vTaperRatio}x` : '--'}
                                    </strong>{' '}
                                    • {currentPeriod.recovery.cardioMinutes}m cardio
                                </div>
                            </div>
                        </div>

                        {/* Past Weeks / Months Complete Archive Cards */}
                        {timeline.length > 0 && (
                            <div className="vt-stack-2-5 vt-pt-2 vt-border-t" style={{ borderColor: colors.border }}>
                                <div className="vt-text-xs vt-font-extrabold vt-uppercase" style={{ color: colors.muted }}>
                                    Complete {overviewPeriod === 'weekly' ? 'Week-by-Week' : 'Month-by-Month'} History ({timeline.length})
                                </div>
                                <div className="vt-grid-md-2 vt-gap-3 vt-tabular">
                                    {timeline.map((item) => (
                                        <div
                                            key={item.periodKey}
                                            style={{
                                                backgroundColor: item.isCurrent ? colors.accentSurface : colors.elevated,
                                                borderColor: item.isCurrent ? colors.accentBorder : colors.border
                                            }}
                                            className="vt-p-3-5 vt-box-xl vt-stack-2"
                                        >
                                            <div className="vt-between-center vt-gap-2">
                                                <div>
                                                    <span className="vt-text-10 vt-font-extrabold vt-uppercase" style={{ color: colors.muted }}>
                                                        {overviewPeriod === 'weekly' ? `Week #${item.index}` : `Month #${item.index}`}
                                                        {item.isCurrent ? ' • CURRENT' : ''}
                                                    </span>
                                                    <div className="font-display vt-text-xl vt-font-black">{item.label}</div>
                                                </div>
                                                <span
                                                    style={{ backgroundColor: colors.accent, color: colors.accentText }}
                                                    className="vt-badge font-mono-num vt-text-xs vt-font-extrabold"
                                                >
                                                    Score {item.overallScore}
                                                </span>
                                            </div>

                                            <div className="vt-grid-2 vt-gap-2 vt-text-11 font-mono-num">
                                                <div>
                                                    Gym: <strong>{item.workout.sessions}</strong> ({formatWeight(item.workout.totalVolumeKg)} {appState.unit})
                                                </div>
                                                <div>
                                                    Weight AM:{' '}
                                                    <strong>
                                                        {item.weight.avgMorningKg !== null
                                                            ? `${formatWeight(item.weight.avgMorningKg)} ${appState.unit}`
                                                            : '--'}
                                                    </strong>
                                                </div>
                                                <div>
                                                    Diet: <strong>{item.nutrition.avgKcal} kcal / {item.nutrition.avgProteinG}g P</strong>
                                                </div>
                                                <div>
                                                    Clean: <strong>{item.discipline.cleanRatePct}%</strong> ({item.discipline.cleanDays}d)
                                                </div>
                                            </div>

                                            {item.workout.topLift && (
                                                <div
                                                    className="vt-text-11 vt-pt-1-5 vt-border-t font-mono-num"
                                                    style={{ color: colors.muted, borderColor: colors.border }}
                                                >
                                                    Top Lift: <strong style={{ color: colors.text }}>{item.workout.topLift.name}</strong> (
                                                    {formatWeight(item.workout.topLift.topWeightKg)} {appState.unit} × {item.workout.topLift.bestReps})
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </>
                ) : null}
            </div>

            {/* 2. Top Lifetime KPI Cards */}
            <div className="vt-grid-kpi vt-gap-3 vt-tabular">
                <div
                    style={{ backgroundColor: colors.card, borderColor: colors.border }}
                    className="vt-card vt-p-4"
                >
                    <div className="vt-text-xs vt-font-bold vt-uppercase" style={{ color: colors.muted }}>
                        Workout Streak
                    </div>
                    <div className="font-display vt-text-3xl vt-font-black vt-mt-1">
                        {appState.workoutStreak} Sessions
                    </div>
                </div>
                <div
                    style={{ backgroundColor: colors.card, borderColor: colors.border }}
                    className="vt-card vt-p-4"
                >
                    <div className="vt-text-xs vt-font-bold vt-uppercase" style={{ color: colors.muted }}>
                        Clean Discipline Streak
                    </div>
                    <div
                        style={{ color: disciplineStats?.currentStreak > 0 ? colors.success : colors.text }}
                        className="font-display vt-text-3xl vt-font-black vt-mt-1"
                    >
                        {disciplineStats?.currentStreak || 0} Days
                    </div>
                </div>
                <div
                    style={{ backgroundColor: colors.card, borderColor: colors.border }}
                    className="vt-card vt-p-4"
                >
                    <div className="vt-text-xs vt-font-bold vt-uppercase" style={{ color: colors.muted }}>
                        Prescribed Sets
                    </div>
                    <div className="font-display vt-text-3xl vt-font-black vt-mt-1">
                        {TOTAL_WEEKLY_PRIMARY_SETS} / wk
                    </div>
                </div>
                <div
                    style={{ backgroundColor: colors.card, borderColor: colors.border }}
                    className="vt-card vt-p-4"
                >
                    <div className="vt-text-xs vt-font-bold vt-uppercase" style={{ color: colors.muted }}>
                        Logged Workouts
                    </div>
                    <div className="font-display vt-text-3xl vt-font-black vt-mt-1">
                        {appState.workoutHistory.length}
                    </div>
                </div>
            </div>

            {/* 3. Muscle Balance Radar + Weekly Sets Per Muscle Group */}
            <div className="vt-grid-lg-3 vt-gap-4">
                <MuscleRadar colors={colors} isDark={isDark} />

                <div
                    style={{ backgroundColor: colors.card, borderColor: colors.border }}
                    className="vt-col-span-lg-2 vt-card vt-p-card vt-stack-4"
                >
                    <div>
                        <h3 className="font-display vt-text-resp-2xl-3xl vt-font-black vt-uppercase">
                            Weekly Hypertrophy Volume Per Muscle Group ({TOTAL_WEEKLY_PRIMARY_SETS} Direct Sets)
                        </h3>
                        <p className="vt-text-xs" style={{ color: colors.muted }}>
                            Shows direct primary sets and effective sets including 0.5× secondary compound credit.
                        </p>
                    </div>

                    <div className="vt-grid-sm-2 vt-gap-3 vt-tabular">
                        {Object.entries(volumes.primary).map(([group, primSets]) => {
                            const effSets = volumes.totalWithSecondary[group];
                            const pct = Math.min(100, Math.round((primSets / 22) * 100));
                            return (
                                <div
                                    key={group}
                                    style={{ backgroundColor: colors.elevated, borderColor: colors.border }}
                                    className="vt-p-3-5 vt-box-xl vt-stack-2"
                                >
                                    <div className="vt-between-center vt-text-xs">
                                        <span className="vt-font-extrabold vt-uppercase">{group}</span>
                                        <span className="font-mono-num vt-font-bold">
                                            {primSets} direct ({effSets} eff)
                                        </span>
                                    </div>
                                    <div style={{ backgroundColor: colors.card }} className="vt-progress-track-sm">
                                        <div
                                            style={{ width: `${pct}%`, backgroundColor: colors.accent }}
                                            className="vt-progress-fill"
                                        />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* 4. Built-in Science & Logic Verification Suite */}
            <div
                style={{ backgroundColor: colors.card, borderColor: colors.border }}
                className="vt-card vt-p-card vt-stack-3"
            >
                <h3 className="font-display vt-text-2xl vt-font-black vt-uppercase">
                    Automated Science, Overload & Discipline Unit Tests (
                    {unitTests.filter((t) => t.passed).length}/{unitTests.length} Passing)
                </h3>
                <div className="vt-stack-2">
                    {unitTests.map((t, idx) => (
                        <div
                            key={idx}
                            style={{ backgroundColor: colors.elevated, borderColor: colors.border }}
                            className="vt-p-3 vt-box-xl vt-resp-row vt-text-xs"
                        >
                            <div>
                                <div className="vt-font-extrabold">{t.name}</div>
                                <div className="font-mono-num vt-text-11" style={{ color: colors.muted }}>
                                    Actual: {t.actual}
                                </div>
                            </div>
                            <span
                                style={{
                                    backgroundColor: t.passed ? colors.accent : colors.danger,
                                    color: t.passed ? colors.accentText : '#FFFFFF'
                                }}
                                className="vt-test-badge vt-font-extrabold vt-uppercase vt-text-10 vt-shrink-0"
                            >
                                {t.passed ? 'PASS' : 'FAIL'}
                            </span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

// ============================================================================
// SECTION 16: SETTINGS VIEW (POSTGRESQL CLOUD BACKUPS, IMPORT, EXPORT, RESET)
// ============================================================================

function SettingsView({
    colors,
    isDark,
    appState,
    setAppState,
    setShowOnboarding,
    setOnboardingForm,
    handleDietTrackChange,
    syncStatus,
    lastSyncedAt,
    loadFromBackend,
    runCloudMutation,
    onStateReplaced,
    showToast
}) {
    const [confirmReset, setConfirmReset] = useState(false);
    const [backups, setBackups] = useState([]);
    const [loadingBackups, setLoadingBackups] = useState(false);

    const fetchBackups = useCallback(async () => {
        setLoadingBackups(true);
        try {
            const res = await vtaperApi.listBackups();
            setBackups(res.backups || []);
        } catch {
            setBackups([]);
        } finally {
            setLoadingBackups(false);
        }
    }, []);

    useEffect(() => {
        fetchBackups();
    }, [fetchBackups]);

    const handleCreateBackupNow = async () => {
        const res = await runCloudMutation(
            () => vtaperApi.createBackupNow(),
            'Cloud backup failed'
        );
        if (res?.ok) {
            fetchBackups();
            showToast('Instant PostgreSQL Cloud Snapshot created!');
        }
    };

    const handleRestoreBackup = async (snapshotDate) => {
        const res = await runCloudMutation(
            () => vtaperApi.restoreBackup(snapshotDate),
            'Restore failed'
        );
        if (res?.state) {
            onStateReplaced(res.state);
            showToast(`Restored full database from ${snapshotDate} snapshot!`);
        }
    };

    const handleExportJson = () => {
        const dataStr = JSON.stringify(appState, null, 2);
        const blob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `vtaper-backup-${getLocalDateStr()}.json`;
        a.click();
        URL.revokeObjectURL(url);
        showToast('Exported VTaper JSON backup.');
    };

    const handleDownloadSvgIcon = () => {
        const blob = new Blob([VTAPER_SVG_RAW], { type: 'image/svg+xml' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'icon.svg';
        a.click();
        URL.revokeObjectURL(url);
        showToast('Downloaded public/icon.svg!');
    };

    const handleImportJson = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = async (ev) => {
            try {
                const parsed = JSON.parse(String(ev.target?.result || '{}'));
                const res = await runCloudMutation(
                    () => vtaperApi.importState(parsed),
                    'Database import failed'
                );
                if (res?.state) {
                    onStateReplaced(res.state);
                    fetchBackups();
                    showToast('JSON backup imported directly into PostgreSQL!');
                } else {
                    onStateReplaced(parsed);
                    showToast('Backup restored locally (DB offline).');
                }
            } catch {
                showToast('Invalid JSON backup file.');
            }
        };
        reader.readAsText(file);
    };

    const handleFullReset = async () => {
        const res = await runCloudMutation(
            () => vtaperApi.resetAll(appState.theme),
            'Cloud reset failed'
        );
        if (res?.state) {
            onStateReplaced(res.state);
            fetchBackups();
        } else {
            const fresh = getFreshInitialState(appState.theme);
            setAppState(fresh);
        }
        setConfirmReset(false);
        setShowOnboarding(true);
        showToast('All data wiped cleanly to 0 (Safety backup saved in PostgreSQL).');
    };

    return (
        <div className="vt-stack-5">
            {/* 1. Preferences & Goals */}
            <div
                style={{ backgroundColor: colors.card, borderColor: colors.border }}
                className="vt-card vt-p-card vt-stack-4"
            >
                <div className="vt-between-center vt-flex-wrap vt-gap-3">
                    <div>
                        <h3 className="font-display vt-text-2xl vt-font-black vt-uppercase">
                            Preferences & Athlete Goals
                        </h3>
                        <p className="vt-text-xs" style={{ color: colors.muted }}>
                            Goal Band: {appState.profile.goalWeightMinKg}–{appState.profile.goalWeightMaxKg} kg • Units, theme aur diet track yahan se update karein.
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={() => {
                            setOnboardingForm(appState.profile);
                            setShowOnboarding(true);
                        }}
                        style={{ backgroundColor: colors.accent, color: colors.accentText }}
                        className="vt-btn vt-h-42 vt-px-4 vt-rounded-xl vt-text-xs vt-font-extrabold vt-uppercase"
                    >
                        Edit Profile & Goals
                    </button>
                </div>

                <div className="vt-grid-md-3 vt-gap-3">
                    <div
                        style={{ backgroundColor: colors.elevated, borderColor: colors.border }}
                        className="vt-p-3-5 vt-box-xl vt-between-center"
                    >
                        <span className="vt-text-xs vt-font-extrabold vt-uppercase">Weight Unit</span>
                        <div className="vt-flex vt-gap-1">
                            {['kg', 'lb'].map((u) => (
                                <button
                                    key={u}
                                    type="button"
                                    onClick={() => setAppState((prev) => ({ ...prev, unit: u }))}
                                    style={{
                                        backgroundColor: appState.unit === u ? colors.accent : colors.card,
                                        color: appState.unit === u ? colors.accentText : colors.text,
                                        borderColor: appState.unit === u ? colors.accentBorder : colors.border
                                    }}
                                    className="vt-btn vt-h-34 vt-px-3 vt-rounded-lg vt-border vt-text-xs vt-font-extrabold vt-uppercase"
                                >
                                    {u}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div
                        style={{ backgroundColor: colors.elevated, borderColor: colors.border }}
                        className="vt-p-3-5 vt-box-xl vt-between-center"
                    >
                        <span className="vt-text-xs vt-font-extrabold vt-uppercase">Color Theme</span>
                        <button
                            type="button"
                            onClick={() =>
                                setAppState((prev) => ({
                                    ...prev,
                                    theme: prev.theme === 'dark' ? 'light' : 'dark'
                                }))
                            }
                            style={{ backgroundColor: colors.card, borderColor: colors.border, color: colors.text }}
                            className="vt-btn vt-h-34 vt-px-3 vt-rounded-lg vt-border vt-text-xs vt-font-extrabold vt-uppercase vt-gap-1-5"
                        >
                            {isDark ? <Sun size={14} /> : <Moon size={14} />}
                            <span>{isDark ? 'Dark' : 'Light'}</span>
                        </button>
                    </div>

                    <div
                        style={{ backgroundColor: colors.elevated, borderColor: colors.border }}
                        className="vt-p-3-5 vt-box-xl vt-between-center vt-gap-2"
                    >
                        <span className="vt-text-xs vt-font-extrabold vt-uppercase">Diet</span>
                        <select
                            value={appState.profile.dietTrack || 'non-veg'}
                            onChange={(e) => handleDietTrackChange(e.target.value)}
                            style={{ backgroundColor: colors.card, borderColor: colors.border, color: colors.text }}
                            className="vt-select-compact"
                        >
                            <option value="non-veg">Non-Veg</option>
                            <option value="eggetarian">Eggetarian</option>
                            <option value="veg">Vegetarian</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* 2. PostgreSQL Cloud Sync & 14-Day Automatic Snapshots */}
            <div
                style={{ backgroundColor: colors.card, borderColor: colors.border }}
                className="vt-card vt-p-card vt-stack-4"
            >
                <div className="vt-between-center vt-flex-wrap vt-gap-3">
                    <div>
                        <div className="vt-flex vt-items-center vt-gap-2">
                            <Database size={18} style={{ color: isDark ? colors.accent : colors.text }} />
                            <h3 className="font-display vt-text-2xl vt-font-black vt-uppercase">
                                PostgreSQL Cloud Backups (14-Day Auto Snapshots)
                            </h3>
                        </div>
                        <p className="vt-text-xs font-mono-num" style={{ color: colors.muted }}>
                            API: {API_BASE_URL} • Status: <strong>{syncStatus.toUpperCase()}</strong>
                            {lastSyncedAt ? ` • Last Sync: ${new Date(lastSyncedAt).toLocaleTimeString()}` : ''}
                        </p>
                    </div>

                    <div className="vt-flex vt-items-center vt-gap-2">
                        <button
                            type="button"
                            onClick={() => loadFromBackend(false)}
                            style={{ backgroundColor: colors.elevated, borderColor: colors.border, color: colors.text }}
                            className="vt-btn vt-h-40 vt-px-3 vt-box-xl vt-text-xs vt-font-extrabold vt-uppercase vt-gap-1-5"
                        >
                            <RefreshCw size={14} />
                            <span>Reload DB</span>
                        </button>
                        <button
                            type="button"
                            onClick={handleCreateBackupNow}
                            style={{ backgroundColor: colors.accent, color: colors.accentText }}
                            className="vt-btn vt-h-40 vt-px-3-5 vt-rounded-xl vt-text-xs vt-font-extrabold vt-uppercase"
                        >
                            Backup Now
                        </button>
                    </div>
                </div>

                {loadingBackups ? (
                    <div className="vt-text-xs" style={{ color: colors.muted }}>
                        Loading cloud snapshots...
                    </div>
                ) : backups.length === 0 ? (
                    <div
                        style={{ backgroundColor: colors.elevated, borderColor: colors.border, color: colors.muted }}
                        className="vt-p-3-5 vt-box-xl vt-text-xs"
                    >
                        Abhi koi cloud snapshot nahi hai — "Backup Now" click karo ya apna pehla workout/weight save karo.
                    </div>
                ) : (
                    <div className="vt-stack-2">
                        {backups.map((b) => (
                            <div
                                key={b.id}
                                style={{ backgroundColor: colors.elevated, borderColor: colors.border }}
                                className="vt-p-3 vt-box-xl vt-between-center vt-flex-wrap vt-gap-2 vt-text-xs"
                            >
                                <div className="font-mono-num">
                                    <strong>{b.snapshotDate}</strong>{' '}
                                    <span style={{ color: colors.muted }}>
                                        • {b.meta?.workoutsCount || 0} workouts • {b.meta?.weightLogsCount || 0} weights •{' '}
                                        {b.meta?.disciplineDaysCount || 0} clean days
                                    </span>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => handleRestoreBackup(b.snapshotDate)}
                                    style={{ backgroundColor: colors.card, borderColor: colors.accentBorder, color: colors.text }}
                                    className="vt-btn vt-h-34 vt-px-3 vt-rounded-lg vt-border vt-text-11 vt-font-extrabold vt-uppercase"
                                >
                                    Restore
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* 3. Local JSON Backup, Icon & Zero Reset */}
            <div
                style={{ backgroundColor: colors.card, borderColor: colors.border }}
                className="vt-card vt-p-card vt-stack-4"
            >
                <h3 className="font-display vt-text-2xl vt-font-black vt-uppercase">
                    JSON Export / Import, App Icon & Zero Reset
                </h3>
                <div className="vt-backup-row">
                    <button
                        onClick={handleExportJson}
                        style={{ backgroundColor: colors.elevated, borderColor: colors.border, color: colors.text }}
                        className="vt-btn vt-h-46 vt-px-4 vt-box-xl vt-text-xs vt-font-extrabold vt-uppercase vt-gap-2"
                    >
                        <Download className="vt-icon-4" />
                        <span>Export JSON</span>
                    </button>

                    <label
                        style={{ backgroundColor: colors.elevated, borderColor: colors.border, color: colors.text }}
                        className="vt-btn vt-h-46 vt-px-4 vt-box-xl vt-text-xs vt-font-extrabold vt-uppercase vt-gap-2 vt-cursor-pointer"
                    >
                        <Upload className="vt-icon-4" />
                        <span>Import JSON → DB</span>
                        <input type="file" accept=".json" onChange={handleImportJson} className="vt-hidden" />
                    </label>

                    <button
                        onClick={handleDownloadSvgIcon}
                        style={{ backgroundColor: colors.elevated, borderColor: colors.border, color: colors.text }}
                        className="vt-btn vt-h-46 vt-px-4 vt-box-xl vt-text-xs vt-font-extrabold vt-uppercase vt-gap-2"
                    >
                        <Sparkles className="vt-icon-4" />
                        <span>Download icon.svg</span>
                    </button>

                    {!confirmReset ? (
                        <button
                            onClick={() => setConfirmReset(true)}
                            style={{ backgroundColor: colors.danger, color: '#FFFFFF' }}
                            className="vt-btn vt-h-46 vt-px-4 vt-rounded-xl vt-text-xs vt-font-extrabold vt-uppercase vt-gap-2 vt-ml-auto"
                        >
                            <Trash2 className="vt-icon-4" />
                            <span>Reset All to 0</span>
                        </button>
                    ) : (
                        <div className="vt-flex vt-items-center vt-gap-2 vt-ml-auto">
                            <button
                                onClick={handleFullReset}
                                style={{ backgroundColor: colors.danger, color: '#FFFFFF' }}
                                className="vt-btn vt-h-46 vt-px-4 vt-rounded-xl vt-text-xs vt-font-extrabold vt-uppercase"
                            >
                                Confirm Wipe
                            </button>
                            <button
                                onClick={() => setConfirmReset(false)}
                                style={{ backgroundColor: colors.elevated, borderColor: colors.border, color: colors.text }}
                                className="vt-btn vt-h-46 vt-px-3 vt-box-xl vt-text-xs vt-font-bold"
                            >
                                Cancel
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

// ============================================================================
// SECTION 17: HOME 30-MIN NO-EQUIPMENT V-TAPER CARDIO PROTOCOL
// ============================================================================

export const HOME_CARDIO_PROTOCOL = {
    totalMinutes: 30,
    estimatedKcalBurn: 210,
    phases: [
        {
            id: 'phase-1',
            title: 'Phase 1: Thoracic & Shoulder Frame Opener',
            durationMin: 5,
            focus: 'Posture, Ribcage Expansion & Scapular Mobility',
            drills: [
                {
                    id: 'hc-1',
                    name: 'High-Knee March + Overhead Arm Swings',
                    durationSec: 120,
                    repsLabel: '2 min continuous',
                    target: 'Warm-up & Heart Rate',
                    cue: 'Chest tall, core braced, swing arms full range overhead to open lats.'
                },
                {
                    id: 'hc-2',
                    name: 'Wall Scapular Slides (No-Equipment Wall Angel)',
                    durationSec: 90,
                    repsLabel: '15 slow reps',
                    target: 'Lower Traps & Posture',
                    cue: 'Back and wrists near wall, slide elbows down into back pockets for wider frame.'
                },
                {
                    id: 'hc-3',
                    name: 'World’s Greatest Stretch + Thoracic Reach',
                    durationSec: 90,
                    repsLabel: '6 reps / side',
                    target: 'T-Spine & Hips',
                    cue: 'Deep lunge, rotate upper back and reach hand to ceiling, follow with eyes.'
                }
            ]
        },
        {
            id: 'phase-2',
            title: 'Phase 2: V-Taper Athletic Calisthenics Circuit',
            durationMin: 15,
            focus: '3 Rounds • Delt Cap Endurance, Serratus & Conditioning',
            drills: [
                {
                    id: 'hc-4',
                    name: 'Incline / Pike Push-Up + Shoulder Tap Combo',
                    durationSec: 180,
                    repsLabel: '3 sets × 45s work / 15s rest',
                    target: 'Side/Front Delts & Serratus',
                    cue: 'Hips high in V-position, push floor away hard at top to protract serratus, tap each shoulder.'
                },
                {
                    id: 'hc-5',
                    name: 'Prisoner Squat to Tiplock Calf Raise',
                    durationSec: 180,
                    repsLabel: '3 sets × 45s work / 15s rest',
                    target: 'Leg Drive & Upper Back Posture',
                    cue: 'Hands behind head, elbows pulled wide back (opens chest), squat deep and rise onto big toes.'
                },
                {
                    id: 'hc-6',
                    name: 'Cross-Body Slow Mountain Climbers',
                    durationSec: 180,
                    repsLabel: '3 sets × 40s work / 20s rest',
                    target: 'Obliques & Serratus Lines',
                    cue: 'Drive knee toward opposite elbow with 1s squeeze, keep hips low and shoulders stacked.'
                },
                {
                    id: 'hc-7',
                    name: 'Shadow Boxing + Sprawl Conditioning',
                    durationSec: 180,
                    repsLabel: '3 sets × 45s work / 15s rest',
                    target: 'VO2 Max & Shoulder Stamina',
                    cue: 'Crisp 1-2 punches at eye level, drop into a fast plank sprawl every 6 punches.'
                },
                {
                    id: 'hc-8',
                    name: 'Prone Y-T-W Isometric Back Flies (Floor)',
                    durationSec: 180,
                    repsLabel: '3 sets × 45s work / 15s rest',
                    target: 'Rear Delts & Mid-Back',
                    cue: 'Lie face down on mat/towel, lift chest slightly, sweep thumbs up in Y-T-W shapes.'
                }
            ]
        },
        {
            id: 'phase-3',
            title: 'Phase 3: Waist-Cincher & Stomach Vacuum Block',
            durationMin: 7,
            focus: 'Transverse Abdominis Control (Shrinks Waist Measurement)',
            drills: [
                {
                    id: 'hc-9',
                    name: 'Standing / Quadruped Stomach Vacuums',
                    durationSec: 240,
                    repsLabel: '6 sets × 20s hold / 20s rest',
                    target: 'Inner Waist Belt (TVA)',
                    cue: 'Exhale all air, pull navel hard toward spine and up under ribs. #1 drill for 1.45x V-taper.'
                },
                {
                    id: 'hc-10',
                    name: 'Hollow-Body Hold / Dead Bug Control',
                    durationSec: 180,
                    repsLabel: '3 sets × 40s work / 20s rest',
                    target: 'Flat Lower Abs',
                    cue: 'Lower back glued flat to floor, ribs tucked down, zero arch in lumbar spine.'
                }
            ]
        },
        {
            id: 'phase-4',
            title: 'Phase 4: Nasal Recovery & Lat Decompression',
            durationMin: 3,
            focus: 'Cortisol Drop & Fascia Stretch',
            drills: [
                {
                    id: 'hc-11',
                    name: 'Child’s Pose Lat Reach + 4-4-4-4 Box Breathing',
                    durationSec: 180,
                    repsLabel: '3 min nasal breathing',
                    target: 'Lat Width Stretch & Recovery',
                    cue: 'Knees wide, walk fingers far forward on floor, breathe deep into side ribs.'
                }
            ]
        }
    ]
};

export function HomeCardioSection({
    colors,
    isDark,
    appState,
    setAppState,
    runCloudMutation,
    showToast
}) {
    const allDrills = useMemo(
        () => HOME_CARDIO_PROTOCOL.phases.flatMap((p) => p.drills),
        []
    );

    const [activeDrillIdx, setActiveDrillIdx] = useState(0);
    const [drillSecLeft, setDrillSecLeft] = useState(allDrills[0].durationSec);
    const [timerRunning, setTimerRunning] = useState(false);
    const [completedDrills, setCompletedDrills] = useState({});

    const currentDrill = allDrills[activeDrillIdx] || allDrills[0];
    const todayStr = getLocalDateStr();
    const cardioLogs = appState.cardioLogs || [];
    const isCompletedToday = cardioLogs.some((log) => log.date === todayStr);

    useEffect(() => {
        if (!timerRunning || drillSecLeft <= 0) return;
        const interval = setInterval(() => {
            setDrillSecLeft((prev) => Math.max(0, prev - 1));
        }, 1000);
        return () => clearInterval(interval);
    }, [timerRunning, drillSecLeft]);

    useEffect(() => {
        if (!timerRunning || drillSecLeft > 0) return;
        setCompletedDrills((cd) => ({ ...cd, [currentDrill.id]: true }));
        if (activeDrillIdx < allDrills.length - 1) {
            const nextIdx = activeDrillIdx + 1;
            setActiveDrillIdx(nextIdx);
            setDrillSecLeft(allDrills[nextIdx].durationSec);
        } else {
            setTimerRunning(false);
            if (showToast) showToast('30-Min Home V-Taper Cardio Complete! Log your session below.');
        }
    }, [timerRunning, drillSecLeft, activeDrillIdx, allDrills, currentDrill.id, showToast]);

    const formatClock = (sec) => {
        const m = Math.floor(sec / 60);
        const s = sec % 60;
        return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    };

    const handleSelectDrill = (idx) => {
        setActiveDrillIdx(idx);
        setDrillSecLeft(allDrills[idx].durationSec);
        setTimerRunning(false);
    };

    const handleToggleDrillDone = (drillId) => {
        setCompletedDrills((prev) => ({ ...prev, [drillId]: !prev[drillId] }));
    };

    const completedCount = Object.values(completedDrills).filter(Boolean).length;
    const progressPct = Math.round((completedCount / allDrills.length) * 100);

    const handleLogCardioSession = async () => {
        const payload = {
            durationMin: 30,
            drillsCompleted: completedCount || allDrills.length,
            kcalBurned: HOME_CARDIO_PROTOCOL.estimatedKcalBurn
        };

        setAppState((prev) => {
            const existing = prev.cardioLogs || [];
            const filtered = existing.filter((item) => item.date !== todayStr);
            return {
                ...prev,
                sundayWalkDone: true,
                cardioLogs: [
                    {
                        id: `cardio-${Date.now()}`,
                        date: todayStr,
                        ...payload
                    },
                    ...filtered
                ]
            };
        });

        await runCloudMutation(
            () => vtaperApi.saveCardio(todayStr, payload),
            'Cardio sync failed'
        );

        if (showToast) {
            showToast('Logged 30-Min Home V-Taper Cardio in PostgreSQL! Eat +200 kcal if bulking hard.');
        }
    };

    return (
        <section className="vt-cardio-section vt-stack-4">
            <div
                style={{ backgroundColor: colors.card, borderColor: colors.border }}
                className="vt-card vt-p-card vt-cardio-hero"
            >
                <div className="vt-cardio-hero-top">
                    <div className="vt-stack-1">
                        <div className="vt-pill-row">
                            <span
                                style={{ backgroundColor: colors.accent, color: colors.accentText }}
                                className="vt-badge-accent"
                            >
                                Zero Equipment • Home Protocol
                            </span>
                            <span
                                style={{
                                    backgroundColor: colors.elevated,
                                    borderColor: colors.border,
                                    color: colors.muted
                                }}
                                className="vt-meta-pill font-mono-num"
                            >
                                <Clock size={14} />
                                <span>30 Min • ~{HOME_CARDIO_PROTOCOL.estimatedKcalBurn} kcal</span>
                            </span>
                            <span
                                style={{
                                    backgroundColor: colors.elevated,
                                    borderColor: colors.border,
                                    color: isDark ? colors.accent : colors.text
                                }}
                                className="vt-meta-pill font-mono-num"
                            >
                                <Flame size={14} />
                                <span>Sessions Logged: {cardioLogs.length}</span>
                            </span>
                        </div>

                        <h2 className="vt-hero-heading font-display">
                            30-Min V-Taper Conditioning & Waist Vacuum Circuit
                        </h2>
                        <p className="vt-text-xs" style={{ color: colors.muted }}>
                            Designed for home execution without equipment: widens upper-back posture, builds serratus & lateral delt stamina, and tightens your waist via transverse abdominis vacuums.
                        </p>
                    </div>

                    <button
                        onClick={handleLogCardioSession}
                        style={{
                            backgroundColor: isCompletedToday ? colors.accentSurface : colors.accent,
                            color: isCompletedToday ? colors.text : colors.accentText,
                            borderColor: colors.accentBorder
                        }}
                        className="vt-finish-btn vt-shrink-0"
                    >
                        <Check size={16} strokeWidth={2.5} />
                        <span>{isCompletedToday ? 'Completed Today ✓' : 'Complete 30m Session'}</span>
                    </button>
                </div>

                <div
                    style={{
                        backgroundColor: colors.elevated,
                        borderColor: timerRunning ? colors.accentBorder : colors.border
                    }}
                    className="vt-cardio-player"
                >
                    <div className="vt-cardio-player-left">
                        <div
                            style={{ backgroundColor: colors.accent, color: colors.accentText }}
                            className="vt-cardio-clock font-display tabular-nums"
                        >
                            {formatClock(drillSecLeft)}
                        </div>
                        <div style={{ minWidth: 0 }}>
                            <div
                                className="vt-text-10 vt-font-extrabold vt-uppercase font-mono-num"
                                style={{ color: isDark ? colors.accent : colors.text }}
                            >
                                Drill {activeDrillIdx + 1} of {allDrills.length} • {currentDrill.target}
                            </div>
                            <div className="vt-cardio-active-name">{currentDrill.name}</div>
                            <div className="vt-text-11" style={{ color: colors.muted }}>
                                {currentDrill.cue}
                            </div>
                        </div>
                    </div>

                    <div className="vt-cardio-player-controls">
                        <button
                            onClick={() => setTimerRunning((prev) => !prev)}
                            style={{
                                backgroundColor: colors.accent,
                                color: colors.accentText,
                                borderColor: colors.accentBorder
                            }}
                            className="vt-cardio-ctrl-btn"
                        >
                            {timerRunning ? <Pause size={16} /> : <Play size={16} />}
                            <span>{timerRunning ? 'Pause' : 'Start Drill'}</span>
                        </button>

                        <button
                            onClick={() => setDrillSecLeft(currentDrill.durationSec)}
                            aria-label="Reset current drill timer"
                            style={{ backgroundColor: colors.card, borderColor: colors.border, color: colors.text }}
                            className="vt-icon-btn-44"
                        >
                            <RotateCcw size={16} />
                        </button>

                        <button
                            onClick={() => handleSelectDrill((activeDrillIdx + 1) % allDrills.length)}
                            aria-label="Next drill"
                            style={{ backgroundColor: colors.card, borderColor: colors.border, color: colors.text }}
                            className="vt-icon-btn-44"
                        >
                            <SkipForward size={16} />
                        </button>
                    </div>
                </div>

                <div className="vt-stack-1">
                    <div className="vt-between-center vt-text-11 font-mono-num" style={{ color: colors.muted }}>
                        <span>Circuit Progress: {completedCount} / {allDrills.length} drills checked</span>
                        <span>{progressPct}%</span>
                    </div>
                    <div style={{ backgroundColor: colors.elevated }} className="vt-progress-track-sm">
                        <div
                            style={{ width: `${progressPct}%`, backgroundColor: colors.accent }}
                            className="vt-progress-fill"
                        />
                    </div>
                </div>
            </div>

            <div className="vt-cardio-phases-grid">
                {HOME_CARDIO_PROTOCOL.phases.map((phase) => (
                    <div
                        key={phase.id}
                        style={{ backgroundColor: colors.card, borderColor: colors.border }}
                        className="vt-card vt-p-card vt-stack-3"
                    >
                        <div className="vt-between-start vt-gap-2">
                            <div>
                                <span
                                    style={{
                                        backgroundColor: colors.elevated,
                                        borderColor: colors.border,
                                        color: isDark ? colors.accent : colors.text
                                    }}
                                    className="vt-badge vt-border vt-text-10 vt-font-extrabold vt-uppercase"
                                >
                                    {phase.focus}
                                </span>
                                <h3 className="font-display vt-text-2xl vt-font-black vt-uppercase vt-mt-1">
                                    {phase.title}
                                </h3>
                            </div>
                            <span
                                style={{ backgroundColor: colors.accent, color: colors.accentText }}
                                className="vt-badge vt-text-xs vt-font-extrabold font-mono-num vt-shrink-0"
                            >
                                {phase.durationMin} MIN
                            </span>
                        </div>

                        <div className="vt-stack-2">
                            {phase.drills.map((drill) => {
                                const globalIdx = allDrills.findIndex((d) => d.id === drill.id);
                                const isCurrent = globalIdx === activeDrillIdx;
                                const isDone = Boolean(completedDrills[drill.id]);

                                return (
                                    <div
                                        key={drill.id}
                                        style={{
                                            backgroundColor: isDone ? colors.accentSurface : colors.elevated,
                                            borderColor: isDone || isCurrent ? colors.accentBorder : colors.border
                                        }}
                                        className="vt-cardio-drill-row"
                                    >
                                        <div
                                            onClick={() => handleSelectDrill(globalIdx)}
                                            className="vt-cardio-drill-main vt-cursor-pointer"
                                        >
                                            <div className="vt-row-wrap vt-gap-1-5">
                                                <span className="vt-font-extrabold vt-text-sm">{drill.name}</span>
                                                <span
                                                    style={{
                                                        backgroundColor: colors.card,
                                                        borderColor: colors.border,
                                                        color: isDark ? colors.accent : colors.text
                                                    }}
                                                    className="vt-badge-xs vt-border vt-text-10 vt-font-extrabold vt-uppercase"
                                                >
                                                    {drill.target}
                                                </span>
                                            </div>
                                            <div className="vt-text-11 font-mono-num" style={{ color: colors.muted }}>
                                                {drill.repsLabel} ({Math.round(drill.durationSec / 60)}m)
                                            </div>
                                            <p className="vt-text-xs" style={{ color: colors.muted }}>
                                                <strong style={{ color: colors.text }}>Cue:</strong> {drill.cue}
                                            </p>
                                        </div>

                                        <button
                                            onClick={() => handleToggleDrillDone(drill.id)}
                                            aria-label={`Mark ${drill.name} done`}
                                            style={{
                                                backgroundColor: isDone ? colors.accent : colors.card,
                                                color: isDone ? colors.accentText : colors.muted,
                                                borderColor: isDone ? colors.accentBorder : colors.border
                                            }}
                                            className="vt-btn vt-sq-44 vt-box-xl vt-shrink-0"
                                        >
                                            <Check size={18} strokeWidth={2.5} />
                                        </button>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                ))}
            </div>

            <div
                style={{ backgroundColor: colors.card, borderColor: colors.border }}
                className="vt-card vt-p-4 vt-flex vt-items-start vt-gap-3"
            >
                <ShieldCheck
                    size={20}
                    className="vt-shrink-0 vt-mt-0-5"
                    style={{ color: isDark ? colors.accent : colors.text }}
                />
                <div className="vt-text-xs" style={{ color: colors.muted }}>
                    <strong style={{ color: colors.text }}>Lean-Bulk Cardio Rule:</strong> Perform this 30-min circuit on{' '}
                    <strong style={{ color: colors.text }}>Sunday (Active Recovery)</strong> or 2–3×/week separated by at least 4 hours from lifting. Since it burns ~210 kcal, tap{' '}
                    <strong style={{ color: colors.text }}>+1 Medium Banana + 250 ml Milk (+257 kcal)</strong> in the Nutrition tab on cardio days so your muscle-gain surplus stays intact.
                </div>
            </div>
        </section>
    );
}

// ============================================================================
// SECTION 18: PELVIC ALIGNMENT & POSTURE REHAB SECTION
// ============================================================================

export function PelvicRehabSection({
    colors,
    isDark,
    appState,
    setAppState,
    runCloudMutation,
    showToast
}) {
    const pelvicSide = appState.pelvicSide || 'right';
    const protocol = useMemo(() => buildPelvicProtocol(pelvicSide), [pelvicSide]);
    const allExercises = useMemo(
        () => protocol.phases.flatMap((p) => p.exercises),
        [protocol]
    );

    const [activeExIdx, setActiveExIdx] = useState(0);
    const [activeSetNum, setActiveSetNum] = useState(1);
    const [timerPhase, setTimerPhase] = useState('work');
    const [secLeft, setSecLeft] = useState(allExercises[0].workSec);
    const [timerRunning, setTimerRunning] = useState(false);

    const [setChecks, setSetChecks] = useState(() => {
        const init = {};
        allExercises.forEach((ex) => {
            init[ex.id] = Array(ex.sets).fill(false);
        });
        return init;
    });

    const currentEx = allExercises[activeExIdx] || allExercises[0];
    const todayStr = getLocalDateStr();
    const pelvicLogs = appState.pelvicLogs || [];
    const isLoggedToday = pelvicLogs.some((log) => log.date === todayStr);
    const dailyHabits = appState.pelvicHabits || {};

    useEffect(() => {
        if (!timerRunning || secLeft <= 0) return;
        const interval = setInterval(() => {
            setSecLeft((prev) => Math.max(0, prev - 1));
        }, 1000);
        return () => clearInterval(interval);
    }, [timerRunning, secLeft]);

    useEffect(() => {
        if (!timerRunning || secLeft > 0) return;

        if (timerPhase === 'work') {
            setSetChecks((prev) => {
                const arr = [...(prev[currentEx.id] || Array(currentEx.sets).fill(false))];
                arr[activeSetNum - 1] = true;
                return { ...prev, [currentEx.id]: arr };
            });

            if (activeSetNum < currentEx.sets) {
                setTimerPhase('rest');
                setSecLeft(currentEx.restSec);
                if (showToast) {
                    showToast(
                        `${currentEx.name} — Set ${activeSetNum}/${currentEx.sets} done! Rest ${currentEx.restSec}s.`
                    );
                }
            } else if (activeExIdx < allExercises.length - 1) {
                const nextIdx = activeExIdx + 1;
                setActiveExIdx(nextIdx);
                setActiveSetNum(1);
                setTimerPhase('rest');
                setSecLeft(Math.min(30, currentEx.restSec));
                if (showToast) {
                    showToast(`Finished ${currentEx.name}! Up next: ${allExercises[nextIdx].name}`);
                }
            } else {
                setTimerRunning(false);
                if (showToast) {
                    showToast('All 7 Pelvic Rehab exercises complete! Tap "Complete Rehab Session" to log.');
                }
            }
        } else {
            setTimerPhase('work');
            setActiveSetNum((prev) => {
                const currentArr = setChecks[currentEx.id] || [];
                const nextUnchecked = currentArr.findIndex((done) => !done);
                if (nextUnchecked !== -1) return nextUnchecked + 1;
                return Math.min(currentEx.sets, prev + 1);
            });
            setSecLeft(currentEx.workSec);
        }
    }, [
        timerRunning,
        secLeft,
        timerPhase,
        currentEx,
        activeSetNum,
        activeExIdx,
        allExercises,
        setChecks,
        showToast
    ]);

    const formatClock = (sec) => {
        const m = Math.floor(sec / 60);
        const s = sec % 60;
        return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    };

    const handleSideSwitch = (newSide) => {
        setTimerRunning(false);
        setAppState((prev) => ({ ...prev, pelvicSide: newSide }));
        setActiveExIdx(0);
        setActiveSetNum(1);
        setTimerPhase('work');
        setSecLeft(allExercises[0].workSec);
        if (showToast) {
            showToast(
                `Switched protocol for ${newSide.toUpperCase()} High Pelvis (all cues auto-mirrored).`
            );
        }
    };

    const handleSelectExercise = (idx) => {
        const target = allExercises[idx];
        const checks = setChecks[target.id] || [];
        const firstOpen = checks.findIndex((c) => !c);
        setActiveExIdx(idx);
        setActiveSetNum(firstOpen === -1 ? 1 : firstOpen + 1);
        setTimerPhase('work');
        setSecLeft(target.workSec);
        setTimerRunning(false);
    };

    const handleToggleSetBox = (ex, setIdx) => {
        setSetChecks((prev) => {
            const arr = [...(prev[ex.id] || Array(ex.sets).fill(false))];
            arr[setIdx] = !arr[setIdx];
            return { ...prev, [ex.id]: arr };
        });
    };

    const handleToggleHabit = (habitId) => {
        setAppState((prev) => ({
            ...prev,
            pelvicHabits: {
                ...(prev.pelvicHabits || {}),
                [habitId]: !prev.pelvicHabits?.[habitId]
            }
        }));
    };

    const totalSets = useMemo(
        () => allExercises.reduce((acc, ex) => acc + ex.sets, 0),
        [allExercises]
    );

    const completedSets = useMemo(
        () =>
            allExercises.reduce((acc, ex) => {
                const arr = setChecks[ex.id] || [];
                return acc + arr.filter(Boolean).length;
            }, 0),
        [allExercises, setChecks]
    );

    const progressPct = totalSets > 0 ? Math.round((completedSets / totalSets) * 100) : 0;

    const handleLogPelvicSession = async () => {
        const payload = {
            highSide: pelvicSide,
            durationMin: protocol.totalMinutes,
            setsCompleted: completedSets || totalSets
        };

        setAppState((prev) => {
            const existing = prev.pelvicLogs || [];
            const filtered = existing.filter((item) => item.date !== todayStr);
            return {
                ...prev,
                pelvicLogs: [
                    {
                        id: `pelvic-${Date.now()}`,
                        date: todayStr,
                        ...payload
                    },
                    ...filtered
                ]
            };
        });

        await runCloudMutation(
            () => vtaperApi.savePelvic(todayStr, payload),
            'Pelvic rehab sync failed'
        );

        if (showToast) {
            showToast(
                `Logged Pelvic Alignment Session (${protocol.highSide} High) in PostgreSQL!`
            );
        }
    };

    return (
        <section className="vt-cardio-section vt-stack-4">
            <div
                style={{ backgroundColor: colors.card, borderColor: colors.border }}
                className="vt-card vt-p-card vt-cardio-hero"
            >
                <div className="vt-cardio-hero-top">
                    <div className="vt-stack-1">
                        <div className="vt-pill-row">
                            <span
                                style={{ backgroundColor: colors.accent, color: colors.accentText }}
                                className="vt-badge-accent"
                            >
                                Lateral Pelvic Tilt Rehab
                            </span>
                            <span
                                style={{
                                    backgroundColor: colors.elevated,
                                    borderColor: colors.border,
                                    color: colors.muted
                                }}
                                className="vt-meta-pill font-mono-num"
                            >
                                <Clock size={14} />
                                <span>~{protocol.totalMinutes} Min • {protocol.frequency}</span>
                            </span>
                            <span
                                style={{
                                    backgroundColor: colors.elevated,
                                    borderColor: colors.border,
                                    color: isDark ? colors.accent : colors.text
                                }}
                                className="vt-meta-pill font-mono-num"
                            >
                                <Award size={14} />
                                <span>Logged: {pelvicLogs.length} sessions</span>
                            </span>
                        </div>

                        <h2 className="vt-hero-heading font-display">
                            Pelvic Alignment & Posture Correction ({protocol.highSide} Hip High)
                        </h2>
                        <p className="vt-text-xs" style={{ color: colors.muted }}>
                            Targeted 3-phase protocol: releases tight {protocol.highSide} waist/adductors & {protocol.lowSide} outer hip, then strengthens weak {protocol.highSide} Glute Medius & {protocol.lowSide} side core.
                        </p>
                    </div>

                    <div className="vt-stack-2 vt-shrink-0">
                        <div className="vt-flex vt-items-center vt-gap-1-5">
                            {[
                                { id: 'right', label: 'Right Hip High' },
                                { id: 'left', label: 'Left Hip High' }
                            ].map((opt) => {
                                const active = pelvicSide === opt.id;
                                return (
                                    <button
                                        key={opt.id}
                                        type="button"
                                        onClick={() => handleSideSwitch(opt.id)}
                                        style={{
                                            backgroundColor: active ? colors.accent : colors.elevated,
                                            color: active ? colors.accentText : colors.text,
                                            borderColor: active ? colors.accentBorder : colors.border
                                        }}
                                        className="vt-btn vt-h-38 vt-px-3 vt-box-xl vt-text-11 vt-font-extrabold vt-uppercase"
                                    >
                                        {opt.label}
                                    </button>
                                );
                            })}
                        </div>

                        <button
                            type="button"
                            onClick={handleLogPelvicSession}
                            style={{
                                backgroundColor: isLoggedToday ? colors.accentSurface : colors.accent,
                                color: isLoggedToday ? colors.text : colors.accentText,
                                borderColor: colors.accentBorder
                            }}
                            className="vt-finish-btn"
                        >
                            <Check size={16} strokeWidth={2.5} />
                            <span>{isLoggedToday ? 'Rehab Logged Today ✓' : 'Complete Rehab Session'}</span>
                        </button>
                    </div>
                </div>

                <div
                    style={{
                        backgroundColor: colors.elevated,
                        borderColor: timerRunning
                            ? timerPhase === 'rest'
                                ? '#0059FF'
                                : colors.accentBorder
                            : colors.border
                    }}
                    className="vt-cardio-player"
                >
                    <div className="vt-cardio-player-left">
                        <div
                            style={{
                                backgroundColor: timerPhase === 'rest' ? '#0059FF' : colors.accent,
                                color: timerPhase === 'rest' ? '#FFFFFF' : colors.accentText
                            }}
                            className="vt-cardio-clock font-display tabular-nums"
                        >
                            {formatClock(secLeft)}
                        </div>
                        <div style={{ minWidth: 0 }}>
                            <div
                                className="vt-text-10 vt-font-extrabold vt-uppercase font-mono-num"
                                style={{
                                    color:
                                        timerPhase === 'rest'
                                            ? '#0059FF'
                                            : isDark
                                              ? colors.accent
                                              : colors.text
                                }}
                            >
                                {timerPhase === 'rest'
                                    ? `REST PERIOD (${currentEx.restSec}s) • NEXT SET READY`
                                    : `EXERCISE ${activeExIdx + 1}/${allExercises.length} • SET ${activeSetNum}/${currentEx.sets} • ${currentEx.sideTag}`}
                            </div>
                            <div className="vt-cardio-active-name">{currentEx.name}</div>
                            <div className="vt-text-11" style={{ color: colors.muted }}>
                                {currentEx.prescription} • {currentEx.tempo}
                            </div>
                        </div>
                    </div>

                    <div className="vt-cardio-player-controls">
                        <button
                            type="button"
                            onClick={() => setSecLeft((s) => Math.max(5, s - 5))}
                            style={{ backgroundColor: colors.card, borderColor: colors.border, color: colors.text }}
                            className="vt-btn vt-h-38 vt-px-2-5 vt-rounded-lg vt-border vt-text-11 vt-font-extrabold font-mono-num"
                        >
                            -5s
                        </button>
                        <button
                            type="button"
                            onClick={() => setSecLeft((s) => s + 5)}
                            style={{ backgroundColor: colors.card, borderColor: colors.border, color: colors.text }}
                            className="vt-btn vt-h-38 vt-px-2-5 vt-rounded-lg vt-border vt-text-11 vt-font-extrabold font-mono-num"
                        >
                            +5s
                        </button>
                        <button
                            type="button"
                            onClick={() => setTimerRunning((prev) => !prev)}
                            style={{
                                backgroundColor: colors.accent,
                                color: colors.accentText,
                                borderColor: colors.accentBorder
                            }}
                            className="vt-cardio-ctrl-btn"
                        >
                            {timerRunning ? <Pause size={16} /> : <Play size={16} />}
                            <span>{timerRunning ? 'Pause' : timerPhase === 'rest' ? 'Resume Rest' : 'Start Set'}</span>
                        </button>
                        <button
                            type="button"
                            onClick={() => {
                                setTimerRunning(false);
                                setTimerPhase('work');
                                setSecLeft(currentEx.workSec);
                            }}
                            aria-label="Reset current set timer"
                            style={{ backgroundColor: colors.card, borderColor: colors.border, color: colors.text }}
                            className="vt-icon-btn-44"
                        >
                            <RotateCcw size={16} />
                        </button>
                        <button
                            type="button"
                            onClick={() => handleSelectExercise((activeExIdx + 1) % allExercises.length)}
                            aria-label="Next pelvic exercise"
                            style={{ backgroundColor: colors.card, borderColor: colors.border, color: colors.text }}
                            className="vt-icon-btn-44"
                        >
                            <SkipForward size={16} />
                        </button>
                    </div>
                </div>

                <div className="vt-stack-1">
                    <div className="vt-between-center vt-text-11 font-mono-num" style={{ color: colors.muted }}>
                        <span>Session Progress: {completedSets} / {totalSets} total sets completed</span>
                        <span>{progressPct}%</span>
                    </div>
                    <div style={{ backgroundColor: colors.elevated }} className="vt-progress-track-sm">
                        <div
                            style={{ width: `${progressPct}%`, backgroundColor: colors.accent }}
                            className="vt-progress-fill"
                        />
                    </div>
                </div>
            </div>

            <div className="vt-grid-sm-2 vt-gap-3">
                <div
                    style={{ backgroundColor: colors.card, borderColor: colors.border }}
                    className="vt-card vt-p-4 vt-stack-2"
                >
                    <div className="vt-text-xs vt-font-extrabold vt-uppercase vt-tracking-wider" style={{ color: colors.warning }}>
                        Tight / Shortened (Phase 1: Stretch)
                    </div>
                    <div className="vt-stack-1-5 vt-text-xs" style={{ color: colors.muted }}>
                        {protocol.imbalanceMap.tight.map((line, i) => (
                            <div key={i}>• {line}</div>
                        ))}
                    </div>
                </div>

                <div
                    style={{ backgroundColor: colors.card, borderColor: colors.border }}
                    className="vt-card vt-p-4 vt-stack-2"
                >
                    <div
                        className="vt-text-xs vt-font-extrabold vt-uppercase vt-tracking-wider"
                        style={{ color: isDark ? colors.accent : colors.success }}
                    >
                        Weak / Lengthened (Phase 2–3: Strengthen)
                    </div>
                    <div className="vt-stack-1-5 vt-text-xs" style={{ color: colors.muted }}>
                        {protocol.imbalanceMap.weak.map((line, i) => (
                            <div key={i}>• {line}</div>
                        ))}
                    </div>
                </div>
            </div>

            <div className="vt-stack-4">
                {protocol.phases.map((phase) => (
                    <div
                        key={phase.id}
                        style={{ backgroundColor: colors.card, borderColor: colors.border }}
                        className="vt-card vt-p-card vt-stack-3"
                    >
                        <div className="vt-between-start vt-gap-2">
                            <div>
                                <span
                                    style={{
                                        backgroundColor: colors.elevated,
                                        borderColor: colors.border,
                                        color: isDark ? colors.accent : colors.text
                                    }}
                                    className="vt-badge vt-border vt-text-10 vt-font-extrabold vt-uppercase"
                                >
                                    {phase.focus}
                                </span>
                                <h3 className="font-display vt-text-2xl vt-font-black vt-uppercase vt-mt-1">
                                    {phase.title}
                                </h3>
                            </div>
                            <span
                                style={{ backgroundColor: colors.accent, color: colors.accentText }}
                                className="vt-badge vt-text-xs vt-font-extrabold font-mono-num vt-shrink-0"
                            >
                                {phase.durationMin} MIN
                            </span>
                        </div>

                        <div className="vt-stack-3">
                            {phase.exercises.map((ex) => {
                                const globalIdx = allExercises.findIndex((item) => item.id === ex.id);
                                const isCurrent = globalIdx === activeExIdx;
                                const checks = setChecks[ex.id] || Array(ex.sets).fill(false);
                                const allDone = checks.every(Boolean);

                                return (
                                    <div
                                        key={ex.id}
                                        style={{
                                            backgroundColor: allDone ? colors.accentSurface : colors.elevated,
                                            borderColor: allDone || isCurrent ? colors.accentBorder : colors.border
                                        }}
                                        className="vt-p-4 vt-box-xl vt-stack-3"
                                    >
                                        <div className="vt-between-start vt-flex-wrap vt-gap-2">
                                            <div className="vt-stack-1 vt-flex-1">
                                                <div className="vt-row-wrap vt-gap-1-5">
                                                    <span className="vt-font-extrabold vt-text-sm">
                                                        {globalIdx + 1}. {ex.name}
                                                    </span>
                                                    <span
                                                        style={{ backgroundColor: colors.accent, color: colors.accentText }}
                                                        className="vt-badge-xs vt-text-10 vt-font-extrabold vt-uppercase"
                                                    >
                                                        {ex.sideTag}
                                                    </span>
                                                </div>
                                                <div className="vt-text-11" style={{ color: colors.muted }}>
                                                    Standard Name: <strong style={{ color: colors.text }}>{ex.standardName}</strong> • Target: {ex.target}
                                                </div>
                                            </div>

                                            <button
                                                type="button"
                                                onClick={() => handleSelectExercise(globalIdx)}
                                                style={{
                                                    backgroundColor: isCurrent ? colors.accent : colors.card,
                                                    color: isCurrent ? colors.accentText : colors.text,
                                                    borderColor: isCurrent ? colors.accentBorder : colors.border
                                                }}
                                                className="vt-btn vt-h-34 vt-px-3 vt-rounded-lg vt-border vt-text-11 vt-font-extrabold vt-uppercase vt-gap-1"
                                            >
                                                <Play size={12} />
                                                <span>{isCurrent ? 'Loaded in Timer' : 'Load Timer'}</span>
                                            </button>
                                        </div>

                                        <div className="vt-row-wrap vt-gap-2 font-mono-num vt-text-11">
                                            <span
                                                style={{ backgroundColor: colors.card, borderColor: colors.border }}
                                                className="vt-badge vt-border vt-font-extrabold"
                                            >
                                                {ex.prescription}
                                            </span>
                                            <span
                                                style={{ backgroundColor: colors.card, borderColor: colors.border, color: colors.muted }}
                                                className="vt-badge vt-border"
                                            >
                                                Rest: {ex.restSec}s
                                            </span>
                                            <span
                                                style={{ backgroundColor: colors.card, borderColor: colors.border, color: colors.muted }}
                                                className="vt-badge vt-border"
                                            >
                                                Tempo: {ex.tempo}
                                            </span>
                                        </div>

                                        <div className="vt-stack-1 vt-text-xs" style={{ color: colors.muted }}>
                                            <p>
                                                <strong style={{ color: colors.text }}>How to do it:</strong> {ex.cue}
                                            </p>
                                            <p>
                                                <strong style={{ color: colors.warning }}>Avoid:</strong> {ex.mistake}
                                            </p>
                                        </div>

                                        <div
                                            className="vt-row-wrap vt-gap-2 vt-pt-2 vt-border-t"
                                            style={{ borderColor: colors.border }}
                                        >
                                            <span className="vt-text-10 vt-font-extrabold vt-uppercase" style={{ color: colors.muted }}>
                                                Track Sets:
                                            </span>
                                            {checks.map((done, sIdx) => (
                                                <button
                                                    key={sIdx}
                                                    type="button"
                                                    onClick={() => handleToggleSetBox(ex, sIdx)}
                                                    style={{
                                                        backgroundColor: done ? colors.accent : colors.card,
                                                        color: done ? colors.accentText : colors.text,
                                                        borderColor: done ? colors.accentBorder : colors.border
                                                    }}
                                                    className="vt-btn vt-h-34 vt-px-3 vt-rounded-lg vt-border vt-text-11 vt-font-extrabold vt-gap-1 font-mono-num"
                                                >
                                                    <Check size={13} strokeWidth={2.5} />
                                                    <span>Set {sIdx + 1} ({ex.workSec}s)</span>
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                ))}
            </div>

            <div
                style={{ backgroundColor: colors.card, borderColor: colors.border }}
                className="vt-card vt-p-card vt-stack-3"
            >
                <div>
                    <h3 className="font-display vt-text-2xl vt-font-black vt-uppercase">
                        Daily Posture Habits (Keeps Your Progress Locked In)
                    </h3>
                    <p className="vt-text-xs" style={{ color: colors.muted }}>
                        18 minutes of exercise cannot beat 12 hours of asymmetrical standing or sitting. Check these off daily:
                    </p>
                </div>

                <div className="vt-grid-sm-2 vt-gap-2-5">
                    {protocol.habits.map((hab) => {
                        const checked = Boolean(dailyHabits[hab.id]);
                        return (
                            <button
                                key={hab.id}
                                type="button"
                                onClick={() => handleToggleHabit(hab.id)}
                                style={{
                                    backgroundColor: checked ? colors.accentSurface : colors.elevated,
                                    borderColor: checked ? colors.accentBorder : colors.border,
                                    color: colors.text,
                                    textAlign: 'left'
                                }}
                                className="vt-p-3 vt-box-xl vt-flex vt-items-center vt-justify-between vt-gap-3 vt-cursor-pointer"
                            >
                                <span className="vt-text-xs vt-font-semibold">{hab.label}</span>
                                <span
                                    style={{
                                        backgroundColor: checked ? colors.accent : colors.card,
                                        color: checked ? colors.accentText : colors.muted,
                                        borderColor: checked ? colors.accentBorder : colors.border
                                    }}
                                    className="vt-btn vt-sq-44 vt-box-xl vt-shrink-0"
                                >
                                    <Check size={16} strokeWidth={2.5} />
                                </span>
                            </button>
                        );
                    })}
                </div>
            </div>

            <div
                style={{ backgroundColor: colors.card, borderColor: colors.border }}
                className="vt-card vt-p-4 vt-flex vt-items-start vt-gap-3"
            >
                <AlertTriangle size={20} className="vt-shrink-0 vt-mt-0-5" style={{ color: colors.warning }} />
                <div className="vt-text-xs" style={{ color: colors.muted }}>
                    <strong style={{ color: colors.text }}>Safety & Rehab Rule:</strong> Stop immediately if any drill causes sharp lower-back pain, hip pinching, or leg tingling/numbness. Muscular lateral pelvic tilt typically improves within{' '}
                    <strong style={{ color: colors.text }}>4–6 weeks</strong> of consistent practice. If asymmetry persists or you notice a rib hump on forward bending, get evaluated by a licensed{' '}
                    <strong style={{ color: colors.text }}>Physiotherapist or Orthopedic Doctor</strong> to rule out structural scoliosis or leg-length discrepancy.
                </div>
            </div>
        </section>
    );
}