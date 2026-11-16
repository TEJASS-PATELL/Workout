import React, { useState, useEffect, useMemo, useCallback } from 'react';
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
  Ruler,
  ShieldCheck,
  Edit3,
  X,
  Footprints,
  Zap,
  RotateCcw,
  Plus,
  ShoppingBag
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceArea,
  ReferenceLine,
  AreaChart,
  Area,
  BarChart,
  Bar,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis
} from 'recharts';

// ============================================================================
// SECTION 3: SCIENCE RULES (src/lib/science.ts equivalent)
// Each constant is documented with its peer-reviewed exercise/nutrition rationale.
// ============================================================================

export const SCIENCE_RULES = {
  // Volume: Meta-analyses (Schoenfeld et al.) show a graded dose-response up to at least
  // 10 weekly sets per muscle; 12–20 sets is the sweet spot for hypertrophy when hit 2x/week.
  // Lower-priority groups (calves, abs) can sit at 6–12 direct sets.
  VOLUME_MIN_SETS: 10,
  VOLUME_MAX_SETS: 20,
  VOLUME_MINOR_MIN_SETS: 6,
  VOLUME_MINOR_MAX_SETS: 12,
  SECONDARY_MUSCLE_CREDIT: 0.5,

  // Effort (RIR): Most working sets finish 1–3 reps in reserve (compounds ~2 RIR, isolations 0–2 RIR)
  // to maximize motor unit recruitment without excessive central nervous system fatigue.
  // Beginners often underestimate effort, so 1 safe isolation set per session may go to 0 RIR / failure.
  COMPOUND_TARGET_RIR: '2 RIR',
  ISOLATION_TARGET_RIR: '0–2 RIR (last set optional failure calibration)',

  // Ramp-in: Weeks 1–2 use 2 working sets per exercise at 3–4 RIR to prioritize motor learning
  // and prevent debilitating delayed-onset muscle soreness (DOMS) in beginners.
  RAMP_IN_SETS: 3,
  RAMP_IN_RIR: '3–4 RIR',
  DELOAD_FREQUENCY_WEEKS: 6,

  // Rest intervals: Longer inter-set rests (120–150s on compounds, 75–90s on isolations)
  // preserve volume load across sets; RCTs in trained men show 2–3 min beats 1 min for hypertrophy.
  REST_COMPOUND_HEAVY_SEC: 150,
  REST_COMPOUND_STD_SEC: 120,
  REST_ISOLATION_STRETCH_SEC: 90,
  REST_ISOLATION_STD_SEC: 75,

  // Energy (Mifflin–St Jeor for 22y male, 173 cm, 55 kg):
  // BMR = (10 * 55) + (6.25 * 173) - (5 * 22) + 5 = 1,526.25 kcal/day.
  // TDEE (6 days/wk training, activity multiplier 1.55–1.725) ≈ 2,350–2,650 kcal/day.
  // 2,900 kcal provides a controlled +10–20% lean-bulk surplus.
  BMR_KCAL: 1526,
  TDEE_MIN_KCAL: 2350,
  TDEE_MAX_KCAL: 2650,
  TARGET_KCAL: 2900,
  MIN_ACCEPTABLE_KCAL: 2600,
  ADVISORY_CARBS_G: 370,
  ADVISORY_FAT_G: 95,

  // Protein: Muscle protein synthesis plateaus around ~1.6 g/kg/day (upper 95% CI ~2.2 g/kg).
  // Target 130 g/day (~2.4 g/kg at 55 kg, ~1.9 g/kg at 68 kg) with a 110 g floor to account
  // for lower digestibility/leucine density in Indian plant-heavy diets.
  // Spread across >= 4 feedings of >= 22–30 g (~0.4 g/kg/meal).
  TARGET_PROTEIN_G: 130,
  FLOOR_PROTEIN_G: 110,
  MIN_PROTEIN_FEEDINGS: 4,
  MIN_PROTEIN_PER_FEEDING_G: 22,

  // Rate of gain: Standard lean bulk is 0.25–0.5% body weight/week; underweight beginners (BMI ~18.4)
  // can safely gain up to ~1% BW/week early. Always ignore the first 14 days (intracellular glycogen + water).
  GAIN_IGNORE_INITIAL_DAYS: 14,
  GAIN_MIN_PCT_BW: 0.0025,
  GAIN_MAX_PCT_BW: 0.01,
  GAIN_UPPER_HARD_CAP_KG: 0.7,
  GAIN_LOWER_FLOOR_KG: 0.2,

  // Recovery: 7–9 h sleep (target >= 7.5 h), 3.5 L hydration, Sunday 20–30 min easy walk.
  TARGET_WATER_ML: 3500,
  TARGET_SLEEP_HOURS: 7.5
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
// SECTION 4: FINAL TRAINING DATA (src/data/plan.ts equivalent)
// Exact 6-Day PPL V-Taper Split (116 Primary Weekly Sets)
// ============================================================================

export const WORKOUT_PLAN = [
  {
    dayIndex: 1,
    shortDay: 'Mon',
    dayName: 'Monday',
    title: 'Push A',
    subtitle: 'Chest, Shoulders & Triceps (18 Sets)',
    isRest: false,
    estimatedMinutes: 70,
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
        flags: {}
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
        flags: {}
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
        flags: {}
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
        flags: {}
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
        flags: { updatedInV2: true }
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
        flags: { updatedInV2: true }
      }
    ]
  },
  {
    dayIndex: 2,
    shortDay: 'Tue',
    dayName: 'Tuesday',
    title: 'Pull A',
    subtitle: 'Lat Width, Back, Rear Delts & Biceps (18 Sets)',
    isRest: false,
    estimatedMinutes: 70,
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
        flags: {}
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
        flags: { assisted: true }
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
        flags: {}
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
        flags: {}
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
        flags: {}
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
        flags: {}
      }
    ]
  },
  {
    dayIndex: 3,
    shortDay: 'Wed',
    dayName: 'Wednesday',
    title: 'Legs A',
    subtitle: 'Quads, Hamstrings, Calves & Abs (20 Sets)',
    isRest: false,
    estimatedMinutes: 70,
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
        flags: {}
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
        flags: {}
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
        flags: {}
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
        flags: { updatedInV2: true }
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
        flags: {}
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
        flags: { bodyweight: true }
      }
    ]
  },
  {
    dayIndex: 4,
    shortDay: 'Thu',
    dayName: 'Thursday',
    title: 'Push B',
    subtitle: 'Overhead Strength, Side Delts, Chest & Triceps (20 Sets)',
    isRest: false,
    estimatedMinutes: 70,
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
        flags: {}
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
        flags: {}
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
        flags: {}
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
        flags: {}
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
        flags: {}
      }
    ]
  },
  {
    dayIndex: 5,
    shortDay: 'Fri',
    dayName: 'Friday',
    title: 'Pull B',
    subtitle: 'Lat Thickness, V-Taper Sweep, Rear Delts & Biceps (18 Sets)',
    isRest: false,
    estimatedMinutes: 70,
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
        flags: {}
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
        flags: {}
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
        flags: {}
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
        flags: {}
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
        flags: {}
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
        flags: {}
      }
    ]
  },
  {
    dayIndex: 6,
    shortDay: 'Sat',
    dayName: 'Saturday',
    title: 'Legs B',
    subtitle: 'Glutes, Quads, Hamstrings, Calves, Side Delts & Abs (22 Sets)',
    isRest: false,
    estimatedMinutes: 70,
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
        flags: { unilateral: true }
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
        flags: {}
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
        flags: {}
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
        flags: {}
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
        flags: {}
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
        flags: {}
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
        flags: {}
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
    exercises: []
  }
];

export const EXPECTED_WEEKLY_PRIMARY_SETS = {
  Chest: 12,
  'Front delts': 7,
  'Side delts': 11,
  'Rear delts': 9,
  'Lats/Back': 20,
  Biceps: 10,
  Triceps: 8,
  Quads: 13,
  Hamstrings: 9,
  Glutes: 3,
  Calves: 8,
  Abs: 6
};

// ============================================================================
// SECTION 5: FINAL NUTRITION DATA (src/data/foods.ts & src/data/meals.ts)
// Whole-Food Indian Database (IFCT 2017 / USDA) — Zero Supplements
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
// NUTRITION & TRAINING COMPUTATION HELPERS (WITH UNIT TEST COVERAGE)
// ============================================================================

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
      headline: 'Log at least 2 weekly weigh-ins',
      message:
        'Weigh yourself once a week on the same morning (after waking, post-void) to track your true lean-bulk velocity.'
    };
  }

  const sorted = [...weightLogs].sort((a, b) => new Date(a.date) - new Date(b.date));
  const firstDateMs = new Date(sorted[0].date).getTime();
  const lastDateMs = new Date(sorted[sorted.length - 1].date).getTime();
  const totalSpanDays = (lastDateMs - firstDateMs) / (1000 * 60 * 60 * 24);

  const weeklyDeltas = [];
  for (let i = 1; i < sorted.length; i++) {
    const prev = sorted[i - 1];
    const curr = sorted[i];
    const daysDiff = Math.max(
      1,
      (new Date(curr.date).getTime() - new Date(prev.date).getTime()) / (1000 * 60 * 60 * 24)
    );
    const weeklyRate = ((curr.weightKg - prev.weightKg) / daysDiff) * 7;
    weeklyDeltas.push(Number(weeklyRate.toFixed(2)));
  }

  const latestWeeklyGainKg = weeklyDeltas[weeklyDeltas.length - 1];
  const recentSlice = weeklyDeltas.slice(-3);
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
      message: `Current rate is +${latestWeeklyGainKg.toFixed(
        2
      )} kg/wk. Science rule: early weight shifts in the first 14 days reflect muscle glycogen and water supercompensation. Keep calories steady at 2,900 kcal.`
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
      message: `Current rate is +${latestWeeklyGainKg.toFixed(
        2
      )} kg/wk (recent avg +${avgWeeklyGainKg.toFixed(
        2
      )} kg/wk). Exceeding 0.7 kg/wk adds unnecessary visceral/waist fat and blurs your V-taper. Trim ~200 kcal/day.`
    };
  }

  if (consecutiveLowWeeks >= 2) {
    return {
      status: 'PLATEAU_SUGGESTION',
      latestWeeklyGainKg,
      avgWeeklyGainKg,
      consecutiveLowWeeks,
      calorieAdjustment: 300,
      headline: 'Plateau Detected (<0.2 kg/wk for 2+ Weeks): Add +300 kcal',
      message: `Gained under 0.2 kg/wk for ${consecutiveLowWeeks} consecutive weeks (latest: +${latestWeeklyGainKg.toFixed(
        2
      )} kg/wk). Add +300 kcal/day using a one-tap Appetite Helper.`
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
    )} kg/wk (7-day rolling avg +${avgWeeklyGainKg.toFixed(
      2
    )} kg/wk). Right inside the 0.25–1.0% BW/week beginner lean-mass zone.`
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
    name: 'Weekly Primary Sets Match Exact Spec (Total = 116 Sets)',
    passed: allMatchExpected && totalSets === 116,
    expected: '116 sets (Lats/Back 20, Quads 13, Chest 12, Side delts 11...)',
    actual: `${totalSets} sets (Lats/Back ${primary['Lats/Back']}, Quads ${primary.Quads}, Chest ${primary.Chest}, Side delts ${primary['Side delts']})`
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
      return {
        kcal: acc.kcal + m.kcal,
        protein: acc.protein + m.protein
      };
    },
    { kcal: 0, protein: 0 }
  );
  const vegCodes = ['B2', 'M1', 'L2', 'P1', 'X3', 'D3', 'S1'];
  const vegTotals = vegCodes.reduce(
    (acc, c) => {
      const m = findOpt(c);
      return {
        kcal: acc.kcal + m.kcal,
        protein: acc.protein + m.protein
      };
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
      { date: '2026-10-01', weightKg: 55.0 },
      { date: '2026-10-20', weightKg: 55.6 },
      { date: '2026-10-27', weightKg: 56.55 }
    ],
    false
  );
  const tSlow = analyzeWeeklyGainRate(
    [
      { date: '2026-10-01', weightKg: 56.0 },
      { date: '2026-10-08', weightKg: 56.1 },
      { date: '2026-10-15', weightKg: 56.2 }
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

  return results;
}

// ============================================================================
// INITIAL CONSTANTS & LOCAL STORAGE STATE BUILDER (ZERO SUPPLEMENTS)
// ============================================================================

const INITIAL_LAST_SESSION_LOGS = {};
const INITIAL_WEIGHT_LOGS = [];
const INITIAL_MEASUREMENTS = [];
const INITIAL_WORKOUT_HISTORY = [];
const INITIAL_EXERCISE_HISTORY = {};

const DEFAULT_PROFILE = {
  age: 22,
  heightCm: 173,
  startWeightKg: 55,
  currentWeightKg: 55,
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

const STORAGE_KEY = 'vtaper_tracker_state_v4';

function buildInitialActiveDrafts(lastLogs, rampInEnabled = true, customSteps = {}, variantChoices = {}) {
  const drafts = {};
  WORKOUT_PLAN.forEach((day) => {
    day.exercises.forEach((ex) => {
      const targetSets = rampInEnabled ? Math.min(SCIENCE_RULES.RAMP_IN_SETS, ex.sets) : ex.sets;
      const prev = lastLogs[ex.id] || [];
      const activeVar = variantChoices[ex.id] || ex.flags?.variants?.[0]?.id || null;
      const overload = calculateProgressiveOverload(ex, prev, customSteps, activeVar);
      drafts[ex.id] = Array.from({ length: ex.sets }, (_, idx) => {
        const prevSet = prev[idx] || prev[prev.length - 1] || {
          weight: ex.flags?.assisted ? 25 : 0,
          reps: ex.repMin
        };
        return {
          setNumber: idx + 1,
          weight: overload.shouldIncrease ? overload.suggestedWeightKg : prevSet.weight,
          reps: overload.shouldIncrease ? ex.repMin : prevSet.reps,
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
    theme,
    unit: 'kg',
    rampInEnabled: true,
    profile: DEFAULT_PROFILE,
    customSteps: {},
    variantChoices: { 'thu-5': 'dips' },
    swappedAlternatives: {},
    lastSessionLogs: INITIAL_LAST_SESSION_LOGS,
    activeDrafts: buildInitialActiveDrafts(INITIAL_LAST_SESSION_LOGS, true, {}, { 'thu-5': 'dips' }),
    foodDatabase: INITIAL_FOOD_DATABASE,
    selectedMealOptions: getDefaultSelectedMealsForTrack(defaultTrack),
    completedMealSlots: {},
    loggedAppetiteHelpers: [],
    waterMl: 0,
    sleepHours: 7.5,
    sundayWalkDone: false,
    workoutStreak: 0,
    weightLogs: INITIAL_WEIGHT_LOGS,
    measurements: INITIAL_MEASUREMENTS,
    workoutHistory: INITIAL_WORKOUT_HISTORY,
    exerciseHistory: INITIAL_EXERCISE_HISTORY
  };
}

// ============================================================================
// SHARED VISUALIZATION & BRANDING COMPONENTS
// ============================================================================

function BrandLogo({ size = 40 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 512 512"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="VTaper Logo"
      className="shrink-0 rounded-xl"
    >
      <rect width="512" height="512" rx="112" fill="#0A0A0B" />
      <rect x="16" y="16" width="480" height="480" rx="96" stroke="#27272A" strokeWidth="14" />
      <rect x="76" y="116" width="360" height="20" rx="6" fill="#27272A" />
      <rect x="92" y="96" width="24" height="60" rx="6" fill="#CCFF00" />
      <rect x="396" y="96" width="24" height="60" rx="6" fill="#CCFF00" />
      <path d="M88 156H188L256 348L324 156H424L292 428H220L88 156Z" fill="#CCFF00" />
      <polygon points="208,156 304,156 256,284" fill="#27272A" />
      <rect x="212" y="444" width="88" height="12" rx="6" fill="#27272A" />
    </svg>
  );
}

const tip = (colors) => ({
  contentStyle: {
    backgroundColor: colors.card,
    border: `1px solid ${colors.border}`,
    borderRadius: 12,
    color: colors.text,
    fontSize: 12
  },
  cursor: { fill: colors.elevated }
});

// Flat activity ring (SVG)
function Ring({ value, max, size = 92, stroke = 10, color, track, label, sub }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const pct = Math.min(1, max > 0 ? value / max : 0);

  return (
    <div className="relative shrink-0 mx-auto" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
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
      <div className="absolute inset-0 flex flex-col items-center justify-center leading-none tabular-nums">
        <span className="font-display text-xl font-black">{label}</span>
        <span className="text-[9px] font-bold uppercase opacity-60 mt-0.5">{sub}</span>
      </div>
    </div>
  );
}

// Semi-circle V-taper gauge (goal band 1.40-1.50)
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
  const [nx, ny] = ratio ? pt(ratio, r - 20) : [cx, cy];
  const hot = isDark ? colors.accent : colors.text;

  return (
    <div
      style={{ backgroundColor: colors.card, borderColor: colors.border }}
      className="p-4 sm:p-6 rounded-2xl border flex flex-col items-center justify-between"
    >
      <div
        className="text-xs font-extrabold uppercase tracking-wider self-start"
        style={{ color: colors.muted }}
      >
        V-Taper Gauge
      </div>
      <svg viewBox="0 0 220 130" className="w-full max-w-xs">
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
          {ratio ? `${ratio.toFixed(2)}x` : '--'}
        </text>
      </svg>
      <div className="text-[11px]" style={{ color: colors.muted }}>
        Goal band 1.40-1.50x
      </div>
    </div>
  );
}

// Weekly sets radar (STATS tab)
function MuscleRadar({ colors, isDark }) {
  const { primary } = useMemo(() => computeWeeklyMuscleVolumes(), []);
  const data = Object.entries(primary).map(([g, v]) => ({ g, v, t: 12 }));

  return (
    <div
      style={{ backgroundColor: colors.card, borderColor: colors.border }}
      className="p-4 sm:p-6 rounded-2xl border"
    >
      <h3 className="font-display text-2xl font-black uppercase">Muscle Balance Radar</h3>
      <p className="text-xs mb-2" style={{ color: colors.muted }}>
        Direct weekly sets vs 12-set reference ring
      </p>
      <div className="h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart data={data} outerRadius="72%">
            <PolarGrid stroke={colors.border} />
            <PolarAngleAxis dataKey="g" tick={{ fill: colors.muted, fontSize: 10 }} />
            <Radar dataKey="t" stroke={colors.muted} fill="none" strokeDasharray="4 4" />
            <Radar
              dataKey="v"
              stroke={isDark ? colors.accent : '#111113'}
              fill={colors.accent}
              fillOpacity={0.25}
              strokeWidth={2.5}
            />
          </RadarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

// 28-day consistency heatmap + session volume bars + per-exercise strength curve
function ProgressCharts({ appState, formatWeight, colors, isDark }) {
  const hist = appState.workoutHistory || [];
  const days = Array.from({ length: 28 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (27 - i));
    return d.toLocaleDateString('en-CA');
  });
  const counts = {};
  hist.forEach((h) => {
    counts[h.date] = (counts[h.date] || 0) + 1;
  });
  const vol = hist
    .slice(0, 8)
    .reverse()
    .map((h) => ({ d: h.date.slice(5), v: Math.round(formatWeight(h.totalVolumeKg)) }));
  const exList = WORKOUT_PLAN.flatMap((d) => d.exercises).filter(
    (e) => (appState.exerciseHistory?.[e.id] || []).length > 0
  );
  const [exId, setExId] = useState(null);
  const sel = exList.find((e) => e.id === exId) || exList[0];
  const strength = (appState.exerciseHistory?.[sel?.id] || []).map((h) => ({
    d: h.date.slice(5),
    w: formatWeight(h.topWeightKg)
  }));
  const hot = isDark ? colors.accent : '#111113';
  const card = { backgroundColor: colors.card, borderColor: colors.border };

  return (
    <div className="space-y-4">
      <div style={card} className="p-4 sm:p-6 rounded-2xl border">
        <h3 className="font-display text-2xl font-black uppercase">Last 28 Days Consistency</h3>
        <div className="grid grid-cols-7 gap-1.5 mt-3">
          {days.map((d) => (
            <div
              key={d}
              title={d}
              style={{
                backgroundColor: counts[d] ? colors.accent : colors.elevated,
                aspectRatio: '1'
              }}
              className="rounded-md"
            />
          ))}
        </div>
      </div>

      <div style={card} className="p-4 sm:p-6 rounded-2xl border">
        <h3 className="font-display text-2xl font-black uppercase">
          Session Volume ({appState.unit})
        </h3>
        <div className="h-44 w-full mt-2">
          {vol.length ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={vol} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
                <CartesianGrid stroke={colors.border} strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="d" stroke={colors.muted} fontSize={10} />
                <YAxis stroke={colors.muted} fontSize={10} />
                <Tooltip {...tip(colors)} />
                <Bar dataKey="v" fill={colors.accent} radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div
              className="h-full flex items-center justify-center text-xs"
              style={{ color: colors.muted }}
            >
              Finish a workout to see volume bars.
            </div>
          )}
        </div>
      </div>

      <div style={card} className="p-4 sm:p-6 rounded-2xl border">
        <div className="flex items-center justify-between gap-2">
          <h3 className="font-display text-2xl font-black uppercase">Strength Curve</h3>
          {exList.length > 0 && (
            <select
              value={sel?.id || ''}
              onChange={(e) => setExId(e.target.value)}
              style={{
                backgroundColor: colors.elevated,
                borderColor: colors.border,
                color: colors.text
              }}
              className="min-h-[40px] max-w-[55%] px-2 rounded-xl border text-xs font-bold"
            >
              {exList.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.name}
                </option>
              ))}
            </select>
          )}
        </div>
        <div className="h-48 w-full mt-2">
          {strength.length ? (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={strength} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
                <CartesianGrid stroke={colors.border} strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="d" stroke={colors.muted} fontSize={10} />
                <YAxis
                  stroke={colors.muted}
                  fontSize={10}
                  domain={['dataMin - 2', 'dataMax + 2']}
                />
                <Tooltip {...tip(colors)} />
                <Area
                  type="monotone"
                  dataKey="w"
                  stroke={hot}
                  strokeWidth={3}
                  fill={colors.accent}
                  fillOpacity={0.14}
                  dot={{ r: 3, fill: colors.accent }}
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div
              className="h-full flex items-center justify-center text-xs"
              style={{ color: colors.muted }}
            >
              Log workouts to plot top-set weight per exercise.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// MAIN APPLICATION COMPONENT
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

  const [appState, setAppState] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        const { name: _legacyName, ...savedProfile } = parsed.profile || {};
        const mergedProfile = { ...DEFAULT_PROFILE, ...savedProfile };
        return {
          ...getFreshInitialState(),
          ...parsed,
          profile: mergedProfile,
          foodDatabase: parsed.foodDatabase?.length ? parsed.foodDatabase : INITIAL_FOOD_DATABASE,
          selectedMealOptions:
            parsed.selectedMealOptions || getDefaultSelectedMealsForTrack(mergedProfile.dietTrack),
          activeDrafts:
            parsed.activeDrafts ||
            buildInitialActiveDrafts(
              parsed.lastSessionLogs || INITIAL_LAST_SESSION_LOGS,
              parsed.rampInEnabled ?? true,
              parsed.customSteps || {},
              parsed.variantChoices || { 'thu-5': 'dips' }
            )
        };
      }
    } catch (e) {
      // Fallback to clean state if localStorage is blocked
    }
    return getFreshInitialState();
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(appState));
    } catch (e) {
      // Ignore storage quota errors
    }
  }, [appState]);

  const [activeTab, setActiveTab] = useState('today');

  const currentWeekdayIndex = useMemo(() => new Date().getDay(), []);
  const [selectedDayIndex, setSelectedDayIndex] = useState(currentWeekdayIndex);

  const [showOnboarding, setShowOnboarding] = useState(!appState.onboarded);
  const [onboardingForm, setOnboardingForm] = useState(appState.profile);

  const openProfileEditor = useCallback(() => {
    setOnboardingForm(appState.profile);
    setShowOnboarding(true);
  }, [appState.profile]);

  const [workoutRunning, setWorkoutRunning] = useState(false);
  const [workoutElapsedSec, setWorkoutElapsedSec] = useState(0);

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
    }, 3200);
  }, []);

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
      return;
    }
    const interval = setInterval(() => {
      setRestTimer((prev) => {
        if (prev.remainingSec <= 1) {
          return { ...prev, remainingSec: 0, active: false };
        }
        return { ...prev, remainingSec: prev.remainingSec - 1 };
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [restTimer.active, restTimer.paused, restTimer.remainingSec, showToast]);

  const isDark = appState.theme === 'dark';
  const colors = useMemo(
    () =>
      isDark
        ? {
            bg: '#0A0A0B',
            card: '#141416',
            elevated: '#1C1C1F',
            border: '#27272A',
            text: '#F4F4F5',
            muted: '#A1A1AA',
            accent: '#CCFF00',
            accentText: '#0A0A0B',
            accentSurface: '#22290A',
            accentBorder: '#CCFF00',
            danger: '#EF4444',
            warning: '#F59E0B',
            success: '#22C55E'
          }
        : {
            bg: '#F4F4F5',
            card: '#FFFFFF',
            elevated: '#E4E4E7',
            border: '#D4D4D8',
            text: '#111113',
            muted: '#52525B',
            accent: '#CCFF00',
            accentText: '#0A0A0B',
            accentSurface: '#ECFCCB',
            accentBorder: '#84CC16',
            danger: '#DC2626',
            warning: '#D97706',
            success: '#16A34A'
          },
    [isDark]
  );

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
  // HANDLERS FOR TODAY TAB (WORKOUT, SETS, VARIANTS & RAMP-IN)
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

  const handleFinishWorkout = () => {
    if (activeDayPlan.isRest) return;

    const anyCompleted = activeDayPlan.exercises.some((ex) => {
      const limit = getEffectiveSetCount(ex);
      return (appState.activeDrafts[ex.id] || []).slice(0, limit).some((s) => s.completed);
    });
    if (!anyCompleted) {
      showToast('Check off at least 1 completed working set before finishing your workout.');
      return;
    }

    let totalVolumeKg = 0;
    let setsCompleted = 0;
    const prsAchieved = [];
    const updatedLastLogs = { ...appState.lastSessionLogs };
    const updatedExerciseHistory = { ...(appState.exerciseHistory || {}) };
    const todayStr = new Date().toLocaleDateString('en-CA');

    activeDayPlan.exercises.forEach((ex) => {
      const limit = getEffectiveSetCount(ex);
      const draftSets = (appState.activeDrafts[ex.id] || []).slice(0, limit);
      const completedSets = draftSets.filter((s) => s.completed);

      if (completedSets.length === 0) return;

      const activeVar = appState.variantChoices?.[ex.id];
      const isAssisted =
        Boolean(ex.flags?.assisted) ||
        Boolean(ex.flags?.variants?.find((v) => v.id === activeVar)?.assisted);

      let exVolume = 0;
      let bestWeight = isAssisted ? Infinity : 0;
      let bestRepsAtBest = 0;

      completedSets.forEach((s) => {
        const w = Number(s.weight || 0);
        const r = Number(s.reps || 0);
        const unilateralMultiplier = ex.flags?.unilateral ? 2 : 1;
        exVolume += w * r * unilateralMultiplier;

        if (isAssisted) {
          if (w < bestWeight || (w === bestWeight && r > bestRepsAtBest)) {
            bestWeight = w;
            bestRepsAtBest = r;
          }
        } else {
          if (w > bestWeight || (w === bestWeight && r > bestRepsAtBest)) {
            bestWeight = w;
            bestRepsAtBest = r;
          }
        }
      });

      setsCompleted += completedSets.length;
      totalVolumeKg += Math.round(exVolume);

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
            prsAchieved.push({
              exerciseName: ex.name,
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
            prsAchieved.push({
              exerciseName: ex.name,
              weightKg: bestWeight,
              reps: bestRepsAtBest,
              isAssisted: false
            });
          }
        }
      }

      updatedLastLogs[ex.id] = completedSets.map((s) => ({
        weight: Number(s.weight || 0),
        reps: Number(s.reps || 0)
      }));

      const prevExHist = updatedExerciseHistory[ex.id] || [];
      updatedExerciseHistory[ex.id] = [
        ...prevExHist,
        {
          id: `${ex.id}-${Date.now()}`,
          date: todayStr,
          topWeightKg: bestWeight === Infinity ? 0 : bestWeight,
          bestReps: bestRepsAtBest,
          volumeKg: Math.round(exVolume),
          setsCompleted: completedSets.length,
          primaryGroup: ex.primaryGroup
        }
      ];
    });

    const durationToRecord = workoutElapsedSec;
    const newHistoryEntry = {
      id: `hist-${Date.now()}`,
      date: todayStr,
      dayIndex: activeDayPlan.dayIndex,
      dayTitle: activeDayPlan.title,
      durationSec: durationToRecord,
      totalVolumeKg,
      setsCompleted,
      prsCount: prsAchieved.length
    };

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

    setAppState((prev) => ({
      ...prev,
      lastSessionLogs: updatedLastLogs,
      activeDrafts: nextDrafts,
      exerciseHistory: updatedExerciseHistory,
      workoutStreak: prev.workoutStreak + 1,
      workoutHistory: [newHistoryEntry, ...prev.workoutHistory]
    }));

    setWorkoutRunning(false);
    setWorkoutElapsedSec(0);
    setRestTimer((prev) => ({ ...prev, active: false }));

    setWorkoutSummary({
      dayTitle: `${activeDayPlan.shortDay} — ${activeDayPlan.title}`,
      durationSec: durationToRecord,
      totalVolumeKg,
      setsCompleted,
      prsAchieved
    });
  };

  // ============================================================================
  // COMPUTED NUTRITION TOTALS (FROM FOOD DATABASE + APPETITE HELPERS)
  // ============================================================================

  const nutritionTotals = useMemo(() => {
    let consumedKcal = 0;
    let consumedProtein = 0;
    let consumedCarbs = 0;
    let consumedFat = 0;
    let proteinFeedingsCount = 0;

    let plannedKcal = 0;
    let plannedProtein = 0;

    MEAL_SLOTS.forEach((slot) => {
      const selectedOptId = appState.selectedMealOptions?.[slot.slotId];
      const opt =
        slot.options.find((o) => o.id === selectedOptId) ||
        slot.options.find((o) => o.tracks.includes(appState.profile.dietTrack)) ||
        slot.options[0];
      if (!opt) return;

      const macros = computeMealOptionMacros(opt, appState.foodDatabase);
      plannedKcal += macros.kcal;
      plannedProtein += macros.protein;

      if (appState.completedMealSlots?.[slot.slotId]) {
        consumedKcal += macros.kcal;
        consumedProtein += macros.protein;
        consumedCarbs += macros.carbs;
        consumedFat += macros.fat;
        if (macros.protein >= 18) {
          proteinFeedingsCount += 1;
        }
      }
    });

    (appState.loggedAppetiteHelpers || []).forEach((helperId) => {
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
  }, [
    appState.selectedMealOptions,
    appState.completedMealSlots,
    appState.loggedAppetiteHelpers,
    appState.foodDatabase,
    appState.profile.dietTrack
  ]);

  const gainAnalysis = useMemo(
    () => analyzeWeeklyGainRate(appState.weightLogs, true),
    [appState.weightLogs]
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
      return appState.weightLogs[appState.weightLogs.length - 1].weightKg;
    }
    return appState.profile.startWeightKg || 55;
  }, [appState.weightLogs, appState.profile.startWeightKg]);

  const kcalTarget = appState.profile.targetCalories || SCIENCE_RULES.TARGET_KCAL;
  const proteinTarget = appState.profile.targetProteinG || SCIENCE_RULES.TARGET_PROTEIN_G;

  const navItems = [
    { id: 'today', label: 'Today', icon: Dumbbell },
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

  return (
    <div
      style={{
        backgroundColor: colors.bg,
        color: colors.text,
        fontFamily: "'Sora', -apple-system, BlinkMacSystemFont, sans-serif",
        '--ring': isDark ? '#CCFF00' : '#84CC16'
      }}
      className="min-h-screen w-full overflow-x-hidden antialiased flex flex-col md:flex-row selection:bg-[#CCFF00] selection:text-[#0A0A0B]"
    >
      {/* Global Typography & Zero-Scrollbar Rules */}
      <style>{`
        html {
          -webkit-text-size-adjust: 100%;
          text-size-adjust: 100%;
          scroll-behavior: smooth;
        }
        body {
          margin: 0;
          min-width: 320px;
          overflow-x: hidden;
          overscroll-behavior-y: contain;
        }
        button, input, select, textarea {
          font: inherit;
        }
        button {
          touch-action: manipulation;
        }
        main, section, article, .recharts-responsive-container {
          min-width: 0;
          max-width: 100%;
        }
        @media (max-width: 640px) {
          input, select, textarea {
            font-size: 16px !important;
          }
          .recharts-wrapper, .recharts-surface {
            max-width: 100%;
          }
        }
        * {
          box-sizing: border-box;
          scrollbar-width: none !important;
          -ms-overflow-style: none !important;
          -webkit-tap-highlight-color: transparent;
        }
        *::-webkit-scrollbar {
          display: none !important;
          width: 0 !important;
          height: 0 !important;
        }
        input[type='number']::-webkit-inner-spin-button,
        input[type='number']::-webkit-outer-spin-button {
          -webkit-appearance: none;
          margin: 0;
        }
        input[type='number'] {
          -moz-appearance: textfield;
          font-family: 'JetBrains Mono', 'Sora', monospace;
        }
        .font-display {
          font-family: 'Barlow Condensed', sans-serif;
          letter-spacing: 0.03em;
        }
        .font-mono-num {
          font-family: 'JetBrains Mono', 'Sora', monospace;
          font-variant-numeric: tabular-nums;
        }
        @media (prefers-reduced-motion: reduce) {
          * {
            animation-duration: 0.01ms !important;
            transition-duration: 0.01ms !important;
          }
        }
      `}</style>

      {/* ==================================================================== */}
      {/* DESKTOP SIDEBAR                                                      */}
      {/* ==================================================================== */}
      <aside
        style={{ backgroundColor: colors.card, borderColor: colors.border }}
        className="hidden md:flex md:w-64 lg:w-72 md:flex-col md:fixed md:inset-y-0 border-r z-30"
      >
        <div
          style={{ borderColor: colors.border }}
          className="p-6 border-b flex items-center justify-between"
        >
          <div className="flex items-center gap-3">
            <BrandLogo size={42} />
            <div>
              <h1 className="font-display text-3xl font-black uppercase tracking-wider leading-none">
                VTAPER
              </h1>
              <p style={{ color: colors.muted }} className="text-xs mt-0.5 font-semibold tabular-nums">
                Whole-Food Bulk • {appState.profile.startWeightKg}→{appState.profile.goalWeightMaxKg}kg
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
            style={{ backgroundColor: colors.elevated, borderColor: colors.border }}
            className="w-11 h-11 rounded-xl border flex items-center justify-center focus-visible:outline focus-visible:outline-2 focus-visible:outline-[color:var(--ring)]"
          >
            {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>
        </div>

        {/* User Snapshot Card */}
        <div className="p-4">
          <div
            style={{ backgroundColor: colors.elevated, borderColor: colors.border }}
            className="p-4 rounded-2xl border"
          >
            <div className="flex items-center justify-between mb-2">
              <span
                className="text-xs font-bold uppercase tracking-wider"
                style={{ color: colors.muted }}
              >
                {appState.profile.dietTrack} Track
              </span>
              <button
                onClick={openProfileEditor}
                style={{
                  backgroundColor: colors.accent,
                  color: colors.accentText
                }}
                className="text-[11px] font-extrabold px-2 py-0.5 rounded-md uppercase flex items-center gap-1"
              >
                <Edit3 className="w-3 h-3" />
                <span>Edit Goals</span>
              </button>
            </div>
            <div className="font-display text-2xl font-extrabold uppercase tracking-wide tabular-nums truncate">
              {appState.profile.age} years • {appState.profile.heightCm} cm
            </div>
            <div
              className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t tabular-nums"
              style={{ borderColor: colors.border }}
            >
              <div>
                <div className="text-[11px] font-semibold" style={{ color: colors.muted }}>
                  Current
                </div>
                <div className="font-display text-xl font-extrabold">
                  {formatWeight(latestWeightKg)} {appState.unit}
                </div>
              </div>
              <div>
                <div className="text-[11px] font-semibold" style={{ color: colors.muted }}>
                  Goal Band
                </div>
                <div
                  style={{ color: isDark ? colors.accent : colors.text }}
                  className="font-display text-xl font-extrabold"
                >
                  {formatWeight(appState.profile.goalWeightMinKg)}–
                  {formatWeight(appState.profile.goalWeightMaxKg)} {appState.unit}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 px-4 space-y-1.5 overflow-y-auto" aria-label="Main Navigation">
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
                className="w-full min-h-[48px] px-4 rounded-xl border flex items-center gap-3 font-bold text-sm transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-[color:var(--ring)]"
              >
                <Icon className="w-5 h-5 shrink-0" />
                <span>{item.label}</span>
                {item.id === 'today' && workoutRunning && (
                  <span
                    style={{
                      backgroundColor: isActive ? '#0A0A0B' : colors.accent,
                      color: isActive ? '#CCFF00' : colors.accentText
                    }}
                    className="ml-auto text-xs font-extrabold px-2 py-0.5 rounded-md font-mono-num"
                  >
                    {formatTime(workoutElapsedSec)}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Daily Targets Mini Footer */}
        <div
          style={{ borderColor: colors.border }}
          className="p-4 border-t text-xs space-y-2 tabular-nums"
        >
          <div className="flex items-center justify-between">
            <span style={{ color: colors.muted }}>Calories Today</span>
            <span className="font-extrabold font-mono-num">
              {nutritionTotals.consumedKcal} / {kcalTarget} kcal
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span style={{ color: colors.muted }}>Protein (Floor 110g)</span>
            <span className="font-extrabold font-mono-num">
              {nutritionTotals.consumedProtein}g / {proteinTarget}g
            </span>
          </div>
        </div>
      </aside>

      {/* ==================================================================== */}
      {/* MAIN CONTENT AREA                                                    */}
      {/* ==================================================================== */}
      <div className="flex-1 min-w-0 md:pl-64 lg:pl-72 flex flex-col min-h-screen w-full max-w-full pb-[calc(9.5rem+env(safe-area-inset-bottom))] md:pb-10">
        {/* Mobile Top Bar */}
        <header
          style={{ backgroundColor: colors.card, borderColor: colors.border }}
          className="md:hidden sticky top-0 z-20 border-b px-3.5 py-2.5 flex items-center justify-between gap-2"
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <BrandLogo size={36} />
            <div className="min-w-0">
              <div className="font-display text-2xl font-black uppercase tracking-wider leading-none">
                VTAPER
              </div>
              <div style={{ color: colors.muted }} className="text-[11px] font-bold uppercase truncate">
                {appState.profile.dietTrack} • {appState.profile.age}y • {appState.profile.heightCm} cm
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={() =>
                setAppState((prev) => ({
                  ...prev,
                  unit: prev.unit === 'kg' ? 'lb' : 'kg'
                }))
              }
              style={{ backgroundColor: colors.elevated, borderColor: colors.border }}
              className="min-h-[44px] min-w-[44px] px-2.5 rounded-xl border text-xs font-extrabold uppercase focus-visible:outline focus-visible:outline-2 focus-visible:outline-[color:var(--ring)]"
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
              style={{ backgroundColor: colors.elevated, borderColor: colors.border }}
              className="min-h-[44px] min-w-[44px] rounded-xl border flex items-center justify-center focus-visible:outline focus-visible:outline-2 focus-visible:outline-[color:var(--ring)]"
            >
              {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
          </div>
        </header>

        {/* Toast Notification Banner */}
        {toast && (
          <div className="fixed top-16 md:top-4 inset-x-4 md:inset-x-auto md:right-4 z-50 md:max-w-sm">
            <div
              style={{
                backgroundColor: colors.accent,
                color: colors.accentText,
                borderColor: colors.accentBorder
              }}
              className="px-4 py-3 rounded-2xl border font-extrabold text-xs sm:text-sm flex items-center gap-2.5"
            >
              <CheckCircle2 className="w-5 h-5 shrink-0" />
              <span>{toast}</span>
            </div>
          </div>
        )}

        {/* Active Rest Timer Floating Bar (Docked above mobile nav for thumb reach) */}
        {restTimer.active && (
          <div
            style={{
              backgroundColor: colors.card,
              borderColor: colors.accentBorder
            }}
            className="fixed inset-x-2 bottom-[calc(4.9rem+env(safe-area-inset-bottom))] z-40 p-3 rounded-2xl border-2 flex flex-wrap items-center justify-between gap-2.5 md:sticky md:inset-x-auto md:bottom-auto md:top-4 md:mx-4 md:mt-2.5"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div
                style={{
                  backgroundColor: colors.accent,
                  color: colors.accentText
                }}
                className="font-display px-3 py-1 rounded-xl font-black text-2xl sm:text-3xl tabular-nums tracking-wide shrink-0"
              >
                {formatTime(restTimer.remainingSec)}
              </div>
              <div className="min-w-0">
                <div
                  className="text-[11px] font-extrabold uppercase tracking-wider tabular-nums"
                  style={{ color: isDark ? colors.accent : colors.text }}
                >
                  Rest • {restTimer.exerciseType} ({restTimer.totalSec}s target)
                </div>
                <div className="text-xs sm:text-sm font-bold truncate max-w-[160px] sm:max-w-xs">
                  {restTimer.exerciseName}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1.5 tabular-nums ml-auto">
              <button
                onClick={() =>
                  setRestTimer((prev) => ({
                    ...prev,
                    remainingSec: Math.max(0, prev.remainingSec - 15)
                  }))
                }
                style={{ backgroundColor: colors.elevated, borderColor: colors.border }}
                className="min-h-[44px] px-2.5 rounded-xl border text-xs font-extrabold"
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
                style={{ backgroundColor: colors.elevated, borderColor: colors.border }}
                className="min-h-[44px] px-2.5 rounded-xl border text-xs font-extrabold"
              >
                +15s
              </button>
              <button
                onClick={() =>
                  setRestTimer((prev) => ({ ...prev, paused: !prev.paused }))
                }
                aria-label={restTimer.paused ? 'Resume rest timer' : 'Pause rest timer'}
                style={{ backgroundColor: colors.elevated, borderColor: colors.border }}
                className="min-h-[44px] min-w-[44px] rounded-xl border flex items-center justify-center"
              >
                {restTimer.paused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
              </button>
              <button
                onClick={() => setRestTimer((prev) => ({ ...prev, active: false }))}
                aria-label="Skip rest timer"
                style={{
                  backgroundColor: colors.accent,
                  color: colors.accentText,
                  borderColor: colors.accentBorder
                }}
                className="min-h-[44px] px-3 rounded-xl border text-xs font-extrabold flex items-center gap-1"
              >
                <SkipForward className="w-4 h-4" />
                <span>Skip</span>
              </button>
            </div>
          </div>
        )}

        {/* Page Container */}
        <main className="flex-1 max-w-6xl w-full mx-auto px-3 sm:px-4 py-4 sm:py-6 space-y-5">
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
              workoutRunning={workoutRunning}
              setWorkoutRunning={setWorkoutRunning}
              workoutElapsedSec={workoutElapsedSec}
              setWorkoutElapsedSec={setWorkoutElapsedSec}
              formatTime={formatTime}
              formatWeight={formatWeight}
              getEffectiveSetCount={getEffectiveSetCount}
              handleSetInputChange={handleSetInputChange}
              handleToggleSetComplete={handleToggleSetComplete}
              handleApplyOverloadWeight={handleApplyOverloadWeight}
              handleFinishWorkout={handleFinishWorkout}
              setRestTimer={setRestTimer}
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
              showToast={showToast}
            />
          )}

          {activeTab === 'stats' && (
            <StatsView
              colors={colors}
              isDark={isDark}
              appState={appState}
              formatWeight={formatWeight}
              formatTime={formatTime}
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
              showToast={showToast}
            />
          )}
        </main>
      </div>

      {/* ==================================================================== */}
      {/* MOBILE BOTTOM NAVIGATION BAR (Top Bar Indicator + Thumb Ergonomics)  */}
      {/* ==================================================================== */}
      <nav
        style={{ backgroundColor: colors.bg, borderColor: colors.border }}
        aria-label="Mobile Navigation"
        className="md:hidden fixed bottom-0 inset-x-0 border-t z-30 grid grid-cols-6 pt-1 pb-[max(0.5rem,env(safe-area-inset-bottom))]"
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
              className="relative min-h-[54px] flex flex-col items-center justify-center gap-1 text-[10px] font-bold"
            >
              <span
                style={{ backgroundColor: isActive ? on : 'transparent' }}
                className="absolute top-0 h-[3px] w-8 rounded-b-full"
              />
              <Icon className="w-[22px] h-[22px]" strokeWidth={isActive ? 2.5 : 2} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* ==================================================================== */}
      {/* ONBOARDING & PROFILE EDITOR MODAL (PROFILE & DIET TRACK)             */}
      {/* ==================================================================== */}
      {showOnboarding && (
        <div
          style={{ backgroundColor: 'rgba(0, 0, 0, 0.9)' }}
          className="fixed inset-0 z-50 flex items-start sm:items-center justify-center p-2 sm:p-4 overflow-y-auto overscroll-contain"
        >
          <div
            style={{ backgroundColor: colors.card, borderColor: colors.border }}
            className="w-full max-w-lg max-h-[calc(100dvh-1rem)] sm:max-h-[calc(100dvh-2rem)] overflow-y-auto overscroll-contain rounded-2xl border p-4 sm:p-6 space-y-4 sm:space-y-5 my-auto"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <span
                  style={{
                    backgroundColor: colors.accent,
                    color: colors.accentText
                  }}
                  className="inline-block text-xs font-extrabold uppercase px-2.5 py-1 rounded-md mb-2"
                >
                  Whole-Food V-Taper Protocol
                </span>
                <h2 className="font-display text-3xl sm:text-4xl font-black uppercase tracking-wide">
                  Athlete Profile Setup
                </h2>
                <p style={{ color: colors.muted }} className="text-xs sm:text-sm mt-1">
                  22y • 173 cm • 55 kg → 65–68 kg goal. 100% Indian home-style food (zero supplements).
                </p>
              </div>
              <button
                onClick={() => {
                  const chosenTrack = onboardingForm.dietTrack || 'non-veg';
                  setAppState((prev) => ({
                    ...prev,
                    onboarded: true,
                    profile: { ...onboardingForm, dietTrack: chosenTrack },
                    selectedMealOptions: prev.onboarded
                      ? prev.selectedMealOptions
                      : getDefaultSelectedMealsForTrack(chosenTrack),
                    weightLogs: prev.onboarded
                      ? prev.weightLogs
                      : [
                          {
                            id: 'w-0',
                            date: new Date().toLocaleDateString('en-CA'),
                            label: 'Start',
                            weightKg: Number(onboardingForm.startWeightKg || 55)
                          }
                        ]
                  }));
                  setShowOnboarding(false);
                }}
                aria-label="Close profile setup"
                style={{ backgroundColor: colors.elevated, borderColor: colors.border }}
                className="min-h-[44px] min-w-[44px] rounded-xl border flex items-center justify-center shrink-0"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 tabular-nums">
              {/* Indian Diet Track Selector */}
              <div className="sm:col-span-2">
                <label
                  className="block text-xs font-bold uppercase mb-1.5"
                  style={{ color: colors.muted }}
                >
                  Indian Home-Style Diet Track (No Supplements)
                </label>
                <div className="grid grid-cols-3 gap-2">
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
                        className="min-h-[54px] p-2 rounded-xl border text-left flex flex-col justify-center"
                      >
                        <div className="text-xs font-extrabold uppercase">{t.label}</div>
                        <div className="text-[10px] opacity-80 leading-tight mt-0.5">{t.sub}</div>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label
                  className="block text-xs font-bold uppercase mb-1.5"
                  style={{ color: colors.muted }}
                >
                  Age (Years)
                </label>
                <input
                  type="number"
                  inputMode="numeric"
                  value={onboardingForm.age}
                  onChange={(e) =>
                    setOnboardingForm((prev) => ({ ...prev, age: Number(e.target.value) }))
                  }
                  style={{
                    backgroundColor: colors.elevated,
                    borderColor: colors.border,
                    color: colors.text
                  }}
                  className="w-full min-h-[44px] px-3.5 rounded-xl border text-sm font-bold"
                />
              </div>
              <div>
                <label
                  className="block text-xs font-bold uppercase mb-1.5"
                  style={{ color: colors.muted }}
                >
                  Height (cm)
                </label>
                <input
                  type="number"
                  inputMode="numeric"
                  value={onboardingForm.heightCm}
                  onChange={(e) =>
                    setOnboardingForm((prev) => ({
                      ...prev,
                      heightCm: Number(e.target.value)
                    }))
                  }
                  style={{
                    backgroundColor: colors.elevated,
                    borderColor: colors.border,
                    color: colors.text
                  }}
                  className="w-full min-h-[44px] px-3.5 rounded-xl border text-sm font-bold"
                />
              </div>
              <div>
                <label
                  className="block text-xs font-bold uppercase mb-1.5"
                  style={{ color: colors.muted }}
                >
                  Start Weight (kg)
                </label>
                <input
                  type="number"
                  inputMode="decimal"
                  step="0.1"
                  value={onboardingForm.startWeightKg}
                  onChange={(e) =>
                    setOnboardingForm((prev) => ({
                      ...prev,
                      startWeightKg: Number(e.target.value),
                      currentWeightKg: Number(e.target.value)
                    }))
                  }
                  style={{
                    backgroundColor: colors.elevated,
                    borderColor: colors.border,
                    color: colors.text
                  }}
                  className="w-full min-h-[44px] px-3.5 rounded-xl border text-sm font-bold"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label
                    className="block text-xs font-bold uppercase mb-1.5"
                    style={{ color: colors.muted }}
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
                    className="w-full min-h-[44px] px-3 rounded-xl border text-sm font-bold"
                  />
                </div>
                <div>
                  <label
                    className="block text-xs font-bold uppercase mb-1.5"
                    style={{ color: colors.muted }}
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
                    className="w-full min-h-[44px] px-3 rounded-xl border text-sm font-bold"
                  />
                </div>
              </div>
            </div>

            <div
              style={{ backgroundColor: colors.elevated, borderColor: colors.border }}
              className="p-3.5 rounded-xl border grid grid-cols-3 gap-2 text-center tabular-nums"
            >
              <div>
                <div className="text-[10px] uppercase font-bold" style={{ color: colors.muted }}>
                  Daily Surplus
                </div>
                <div className="font-display text-xl sm:text-2xl font-extrabold">2,900 kcal</div>
              </div>
              <div>
                <div className="text-[10px] uppercase font-bold" style={{ color: colors.muted }}>
                  Protein Target
                </div>
                <div className="font-display text-xl sm:text-2xl font-extrabold">
                  130g (110g floor)
                </div>
              </div>
              <div>
                <div className="text-[10px] uppercase font-bold" style={{ color: colors.muted }}>
                  V-Taper Goal
                </div>
                <div className="font-display text-xl sm:text-2xl font-extrabold">1.40–1.50x</div>
              </div>
            </div>

            <button
              onClick={() => {
                const chosenTrack = onboardingForm.dietTrack || 'non-veg';
                setAppState((prev) => ({
                  ...prev,
                  onboarded: true,
                  profile: { ...onboardingForm, dietTrack: chosenTrack },
                  selectedMealOptions: getDefaultSelectedMealsForTrack(chosenTrack),
                  weightLogs: prev.onboarded
                    ? prev.weightLogs
                    : [
                        {
                          id: 'w-0',
                          date: new Date().toLocaleDateString('en-CA'),
                          label: 'Start',
                          weightKg: Number(onboardingForm.startWeightKg || 55)
                        }
                      ]
                }));
                setShowOnboarding(false);
                showToast(`Profile saved (${chosenTrack.toUpperCase()})!`);
              }}
              style={{
                backgroundColor: colors.accent,
                color: colors.accentText,
                borderColor: colors.accentBorder
              }}
              className="w-full min-h-[48px] rounded-xl border font-extrabold text-sm uppercase tracking-wider focus-visible:outline focus-visible:outline-2 focus-visible:outline-[color:var(--ring)]"
            >
              Save Profile & Launch VTaper
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
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
        >
          <div
            style={{ backgroundColor: colors.card, borderColor: colors.accentBorder }}
            className="w-full max-w-md rounded-2xl border-2 p-5 sm:p-6 space-y-5"
          >
            <div className="flex items-center gap-3">
              <div
                style={{ backgroundColor: colors.accent, color: colors.accentText }}
                className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0"
              >
                <Award className="w-7 h-7" />
              </div>
              <div>
                <div
                  className="text-xs font-extrabold uppercase tracking-wider"
                  style={{ color: isDark ? colors.accent : colors.text }}
                >
                  Session Complete
                </div>
                <h3 className="font-display text-3xl font-black uppercase">
                  {workoutSummary.dayTitle}
                </h3>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2.5 tabular-nums">
              <div
                style={{ backgroundColor: colors.elevated, borderColor: colors.border }}
                className="p-3 rounded-xl border text-center"
              >
                <div className="text-[11px] font-semibold" style={{ color: colors.muted }}>
                  Duration
                </div>
                <div className="font-display text-2xl font-extrabold mt-0.5">
                  {formatTime(workoutSummary.durationSec)}
                </div>
              </div>
              <div
                style={{ backgroundColor: colors.elevated, borderColor: colors.border }}
                className="p-3 rounded-xl border text-center"
              >
                <div className="text-[11px] font-semibold" style={{ color: colors.muted }}>
                  Volume
                </div>
                <div className="font-display text-2xl font-extrabold mt-0.5">
                  {formatWeight(workoutSummary.totalVolumeKg)} {appState.unit}
                </div>
              </div>
              <div
                style={{ backgroundColor: colors.elevated, borderColor: colors.border }}
                className="p-3 rounded-xl border text-center"
              >
                <div className="text-[11px] font-semibold" style={{ color: colors.muted }}>
                  PRs Hit
                </div>
                <div
                  style={{ color: isDark ? colors.accent : colors.text }}
                  className="font-display text-2xl font-extrabold mt-0.5"
                >
                  {workoutSummary.prsAchieved.length}
                </div>
              </div>
            </div>

            {workoutSummary.prsAchieved.length > 0 && (
              <div
                style={{ backgroundColor: colors.elevated, borderColor: colors.border }}
                className="p-4 rounded-xl border space-y-2 tabular-nums"
              >
                <div className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4" />
                  <span>New Personal Records</span>
                </div>
                {workoutSummary.prsAchieved.map((pr, idx) => (
                  <div key={idx} className="flex items-center justify-between text-sm">
                    <span className="font-semibold truncate pr-2">{pr.exerciseName}</span>
                    <span
                      style={{
                        backgroundColor: colors.accent,
                        color: colors.accentText
                      }}
                      className="text-xs font-extrabold px-2 py-0.5 rounded-md shrink-0"
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
                borderColor: colors.accentBorder
              }}
              className="w-full min-h-[48px] rounded-xl border font-extrabold text-sm uppercase tracking-wider"
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
// 1. TODAY VIEW COMPONENT
// ============================================================================

function TodayView({
  colors,
  isDark,
  appState,
  setAppState,
  selectedDayIndex,
  setSelectedDayIndex,
  currentWeekdayIndex,
  activeDayPlan,
  workoutRunning,
  setWorkoutRunning,
  workoutElapsedSec,
  setWorkoutElapsedSec,
  formatTime,
  formatWeight,
  getEffectiveSetCount,
  handleSetInputChange,
  handleToggleSetComplete,
  handleApplyOverloadWeight,
  handleFinishWorkout,
  setRestTimer,
  showToast
}) {
  const orderedDays = [1, 2, 3, 4, 5, 6, 0].map((idx) =>
    WORKOUT_PLAN.find((d) => d.dayIndex === idx)
  );

  const sessionProgress = useMemo(() => {
    if (activeDayPlan.isRest) {
      return { completedSets: 0, totalSets: 0, volumeKg: 0, overloadReadyCount: 0 };
    }
    let completedSets = 0;
    let totalSets = 0;
    let volumeKg = 0;
    let overloadReadyCount = 0;

    activeDayPlan.exercises.forEach((ex) => {
      const limit = getEffectiveSetCount(ex);
      const sets = (appState.activeDrafts[ex.id] || []).slice(0, limit);
      const prev = appState.lastSessionLogs[ex.id] || [];
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

    return { completedSets, totalSets, volumeKg: Math.round(volumeKg), overloadReadyCount };
  }, [
    activeDayPlan,
    appState.activeDrafts,
    appState.lastSessionLogs,
    appState.customSteps,
    appState.variantChoices,
    getEffectiveSetCount
  ]);

  const firstCompoundWorkingWeightKg = useMemo(() => {
    if (activeDayPlan.isRest || !activeDayPlan.exercises.length) return 0;
    const firstEx = activeDayPlan.exercises[0];
    const draft = appState.activeDrafts[firstEx.id]?.[0]?.weight;
    const prev = appState.lastSessionLogs[firstEx.id]?.[0]?.weight;
    return Number(draft || prev || 40);
  }, [activeDayPlan, appState.activeDrafts, appState.lastSessionLogs]);

  const roundToPlate = (kg) => Math.max(0, Math.round(kg / 2.5) * 2.5);

  return (
    <div className="space-y-4 sm:space-y-5">
      {/* 7-Day Selector Bar */}
      <div
        style={{ backgroundColor: colors.card, borderColor: colors.border }}
        className="p-2 sm:p-3 rounded-2xl border grid grid-cols-7 gap-1 sm:gap-1.5"
      >
        {orderedDays.map((day) => {
          const isSelected = day.dayIndex === selectedDayIndex;
          const isToday = day.dayIndex === currentWeekdayIndex;
          return (
            <button
              key={day.dayIndex}
              onClick={() => setSelectedDayIndex(day.dayIndex)}
              style={{
                backgroundColor: isSelected ? colors.accent : colors.elevated,
                color: isSelected ? colors.accentText : colors.text,
                borderColor: isSelected ? colors.accentBorder : colors.border
              }}
              className="min-h-[50px] px-1 py-1.5 rounded-xl border flex flex-col items-center justify-center transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-[color:var(--ring)]"
            >
              <div className="flex items-center gap-0.5">
                <span className="text-[11px] sm:text-xs font-extrabold uppercase">{day.shortDay}</span>
                {isToday && (
                  <span
                    style={{
                      backgroundColor: isSelected ? '#0A0A0B' : colors.accent
                    }}
                    className="w-1.5 h-1.5 rounded-full"
                  />
                )}
              </div>
              <span
                className="text-[9px] sm:text-[11px] font-bold truncate max-w-full"
                style={{ opacity: isSelected ? 0.95 : 0.75 }}
              >
                {day.isRest ? 'Rest' : day.title}
              </span>
            </button>
          );
        })}
      </div>

      {/* Bento Header Summary + Warm-up & Ramp-in Controls */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div
          style={{ backgroundColor: colors.card, borderColor: colors.border }}
          className="lg:col-span-2 p-4 sm:p-6 rounded-2xl border flex flex-col justify-between gap-4"
        >
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3.5">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span
                  style={{
                    backgroundColor: colors.accent,
                    color: colors.accentText
                  }}
                  className="text-xs font-extrabold uppercase px-2.5 py-1 rounded-md"
                >
                  {activeDayPlan.dayName}
                </span>
                <span
                  style={{
                    backgroundColor: colors.elevated,
                    borderColor: colors.border,
                    color: colors.muted
                  }}
                  className="text-xs font-bold px-2.5 py-1 rounded-md border flex items-center gap-1 tabular-nums"
                >
                  <Clock className="w-3.5 h-3.5" />
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
                    className="text-xs font-extrabold px-2.5 py-1 rounded-md border uppercase"
                  >
                    {appState.rampInEnabled
                      ? 'Wk 1–2 Ramp-In: ON (2 sets @ 3–4 RIR)'
                      : 'Full Volume: ON (1–3 RIR)'}
                  </button>
                )}
              </div>
              <h2 className="font-display text-3xl sm:text-5xl font-black uppercase tracking-wide mt-2 leading-tight">
                {activeDayPlan.title}: {activeDayPlan.subtitle}
              </h2>
            </div>

            {!activeDayPlan.isRest && (
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  onClick={() => setWorkoutRunning((prev) => !prev)}
                  style={{
                    backgroundColor: colors.elevated,
                    borderColor: colors.border,
                    color: colors.text
                  }}
                  className="flex-1 sm:flex-initial min-h-[46px] px-3.5 rounded-xl border font-extrabold text-xs sm:text-sm flex items-center justify-center gap-1.5 font-mono-num"
                >
                  {workoutRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
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
                    className="min-h-[46px] min-w-[46px] rounded-xl border flex items-center justify-center shrink-0"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </button>
                )}
                <button
                  onClick={handleFinishWorkout}
                  style={{
                    backgroundColor: colors.accent,
                    color: colors.accentText,
                    borderColor: colors.accentBorder
                  }}
                  className="flex-1 sm:flex-initial min-h-[46px] px-4 rounded-xl border font-extrabold text-xs sm:text-sm uppercase tracking-wider flex items-center justify-center gap-1.5"
                >
                  <Check className="w-4 h-4 stroke-[2.5]" />
                  <span>Finish Workout</span>
                </button>
              </div>
            )}
          </div>

          {!activeDayPlan.isRest && (
            <div
              className="grid grid-cols-3 gap-2 sm:gap-3 pt-3.5 border-t tabular-nums"
              style={{ borderColor: colors.border }}
            >
              <div>
                <div className="text-[11px] font-semibold" style={{ color: colors.muted }}>
                  Sets Logged
                </div>
                <div className="font-display text-2xl sm:text-3xl font-extrabold">
                  {sessionProgress.completedSets} / {sessionProgress.totalSets}
                </div>
              </div>
              <div>
                <div className="text-[11px] font-semibold" style={{ color: colors.muted }}>
                  Live Volume
                </div>
                <div className="font-display text-2xl sm:text-3xl font-extrabold">
                  {formatWeight(sessionProgress.volumeKg)} {appState.unit}
                </div>
              </div>
              <div>
                <div className="text-[11px] font-semibold" style={{ color: colors.muted }}>
                  Effort Target
                </div>
                <div
                  style={{ color: isDark ? colors.accent : colors.text }}
                  className="font-display text-2xl sm:text-3xl font-extrabold"
                >
                  {appState.rampInEnabled ? '3–4 RIR' : '1–3 RIR'}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Warm-Up Protocol Card */}
        <div
          style={{ backgroundColor: colors.card, borderColor: colors.border }}
          className="p-4 sm:p-6 rounded-2xl border flex flex-col justify-between gap-3.5"
        >
          <div>
            <div className="text-xs font-extrabold uppercase tracking-wider" style={{ color: colors.muted }}>
              Warm-Up & Rest Protocol
            </div>
            <h3 className="font-display text-2xl font-extrabold uppercase mt-1">
              5 Min Cardio + 3 Compound Ramp Sets
            </h3>
            {!activeDayPlan.isRest && (
              <div className="text-xs mt-1.5 space-y-1 tabular-nums" style={{ color: colors.muted }}>
                <p>
                  <strong style={{ color: colors.text }}>1st Compound Ramp:</strong>{' '}
                  {formatWeight(roundToPlate(firstCompoundWorkingWeightKg * 0.5))}
                  {appState.unit} × 8 →{' '}
                  {formatWeight(roundToPlate(firstCompoundWorkingWeightKg * 0.7))}
                  {appState.unit} × 5 →{' '}
                  {formatWeight(roundToPlate(firstCompoundWorkingWeightKg * 0.85))}
                  {appState.unit} × 3
                </p>
                <p>
                  <strong style={{ color: colors.text }}>Isolations:</strong> 1 light feeler set only.
                </p>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-2 tabular-nums">
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
              style={{ backgroundColor: colors.elevated, borderColor: colors.border }}
              className="min-h-[44px] px-2.5 rounded-xl border text-xs font-extrabold flex items-center justify-center gap-1"
            >
              <Clock className="w-3.5 h-3.5" />
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
              style={{ backgroundColor: colors.elevated, borderColor: colors.border }}
              className="min-h-[44px] px-2.5 rounded-xl border text-xs font-extrabold flex items-center justify-center gap-1"
            >
              <Zap className="w-3.5 h-3.5" />
              <span>75s Iso</span>
            </button>
          </div>
        </div>
      </div>

      {/* Sunday Rest Day View */}
      {activeDayPlan.isRest ? (
        <div
          style={{ backgroundColor: colors.card, borderColor: colors.border }}
          className="p-6 sm:p-8 rounded-2xl border text-center space-y-4"
        >
          <div
            style={{ backgroundColor: colors.accent, color: colors.accentText }}
            className="w-16 h-16 rounded-2xl mx-auto flex items-center justify-center"
          >
            <Footprints className="w-8 h-8" />
          </div>
          <h3 className="font-display text-3xl sm:text-4xl font-black uppercase">
            Sunday Active Recovery: 20–30 Min Easy Walk
          </h3>
          <p style={{ color: colors.muted }} className="max-w-lg mx-auto text-xs sm:text-sm">
            Light mobility, no lifting. Keep nutrition identical to training days (2,900 kcal &amp; 130 g protein from whole Indian foods) and sleep ≥ 7.5 hours.
          </p>
          <button
            onClick={() => {
              setAppState((prev) => ({ ...prev, sundayWalkDone: !prev.sundayWalkDone }));
              showToast('Sunday 20–30 min walk status updated!');
            }}
            style={{
              backgroundColor: appState.sundayWalkDone ? colors.accent : colors.elevated,
              color: appState.sundayWalkDone ? colors.accentText : colors.text,
              borderColor: appState.sundayWalkDone ? colors.accentBorder : colors.border
            }}
            className="min-h-[48px] px-6 rounded-xl border font-extrabold text-xs uppercase tracking-wider inline-flex items-center gap-2"
          >
            <Check className="w-4 h-4 stroke-[2.5]" />
            <span>
              {appState.sundayWalkDone
                ? '20–30 Min Walk Completed ✓'
                : 'Mark 20–30 Min Walk Complete'}
            </span>
          </button>
        </div>
      ) : (
        /* Exercise Cards List */
        <div className="space-y-3.5 sm:space-y-4">
          {activeDayPlan.exercises.map((exercise, exIdx) => {
            const limit = getEffectiveSetCount(exercise);
            const draftSets = (appState.activeDrafts[exercise.id] || []).slice(0, limit);
            const prevSets = appState.lastSessionLogs[exercise.id] || [];
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

            const overload = calculateProgressiveOverload(
              exercise,
              prevSets,
              appState.customSteps || {},
              activeVariantId
            );

            return (
              <div
                key={exercise.id}
                style={{ backgroundColor: colors.card, borderColor: colors.border }}
                className="p-4 sm:p-6 rounded-2xl border space-y-3.5"
              >
                {/* Exercise Header */}
                <div className="flex items-start justify-between gap-2.5">
                  <div className="space-y-1 min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span
                        style={{ backgroundColor: colors.elevated, borderColor: colors.border }}
                        className="text-[11px] font-extrabold px-2 py-0.5 rounded-md border font-mono-num"
                      >
                        #{exIdx + 1}
                      </span>
                      {exercise.flags?.updatedInV2 && (
                        <span
                          style={{ backgroundColor: colors.accent, color: colors.accentText }}
                          className="text-[10px] font-extrabold px-1.5 py-0.5 rounded uppercase"
                        >
                          ★ Stretch Priority
                        </span>
                      )}
                      <h3 className="font-display text-2xl sm:text-3xl font-black uppercase tracking-wide leading-tight">
                        {displayName}
                      </h3>
                    </div>

                    <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                      <span
                        style={{
                          backgroundColor: colors.elevated,
                          borderColor: colors.border,
                          color: isDark ? colors.accent : colors.text
                        }}
                        className="text-[11px] font-extrabold px-2 py-0.5 rounded-md border uppercase"
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
                          className="text-[11px] font-semibold px-2 py-0.5 rounded-md border"
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
                        className="text-[11px] font-bold px-2 py-0.5 rounded-md border font-mono-num"
                      >
                        {exercise.type} • {exercise.restSec}s rest • Step {activeStepCode}
                      </span>
                      {exercise.flags?.unilateral && (
                        <span
                          style={{
                            backgroundColor: colors.accentSurface,
                            borderColor: colors.accentBorder
                          }}
                          className="text-[11px] font-extrabold px-2 py-0.5 rounded-md border uppercase"
                        >
                          Unilateral (Per Leg)
                        </span>
                      )}
                    </div>

                    {exercise.flags?.variants && (
                      <div className="flex flex-wrap items-center gap-1.5 pt-1">
                        <span className="text-[11px] font-bold uppercase" style={{ color: colors.muted }}>
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
                              className="min-h-[36px] px-2.5 py-1 rounded-lg border text-xs font-extrabold"
                            >
                              {v.name}
                            </button>
                          );
                        })}
                      </div>
                    )}

                    {/* Equipment Busy Alternative Swapper */}
                    {exercise.alternatives?.length > 0 && (
                      <div className="flex flex-wrap items-center gap-1.5 pt-1">
                        <span className="text-[11px] font-bold uppercase" style={{ color: colors.muted }}>
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
                          className="min-h-[32px] px-2 py-0.5 rounded-lg border text-[11px] font-bold"
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
                              className="min-h-[32px] px-2 py-0.5 rounded-lg border text-[11px] font-bold"
                            >
                              {alt}
                            </button>
                          );
                        })}
                      </div>
                    )}

                    {/* One-Line Form Cue */}
                    <p
                      style={{ color: colors.muted }}
                      className="text-xs sm:text-sm flex items-start gap-1.5 pt-1"
                    >
                      <Info
                        className="w-4 h-4 shrink-0 mt-0.5"
                        style={{ color: isDark ? colors.accent : colors.text }}
                      />
                      <span>
                        <strong style={{ color: colors.text }}>Cue:</strong> {exercise.cue}
                      </span>
                    </p>
                  </div>

                  {/* Prescription Pill */}
                  <div
                    style={{ backgroundColor: colors.elevated, borderColor: colors.border }}
                    className="px-3 py-1.5 rounded-xl border text-right tabular-nums shrink-0"
                  >
                    <div className="text-[10px] font-bold uppercase" style={{ color: colors.muted }}>
                      Sets × Reps
                    </div>
                    <div className="font-display text-xl sm:text-2xl font-extrabold">
                      {limit} × {exercise.repLabel}
                    </div>
                  </div>
                </div>

                {/* Last Session Numbers + Progressive Overload Banner */}
                <div
                  style={{
                    backgroundColor: overload.shouldIncrease ? colors.accentSurface : colors.elevated,
                    borderColor: overload.shouldIncrease ? colors.accentBorder : colors.border
                  }}
                  className="p-3 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 tabular-nums"
                >
                  <div className="space-y-0.5">
                    <div className="text-xs font-bold uppercase tracking-wider flex flex-wrap items-center gap-1.5">
                      <span>Last Session:</span>
                      <span style={{ color: colors.muted }} className="font-mono-num">
                        {prevSets.length > 0
                          ? prevSets
                              .map(
                                (s) =>
                                  `${isAssisted ? 'Assist ' : ''}${formatWeight(s.weight)}${
                                    appState.unit
                                  } × ${s.reps}`
                              )
                              .join('  |  ')
                          : 'First session — log your starting working weights'}
                      </span>
                    </div>
                    <div className="text-xs font-semibold" style={{ color: colors.muted }}>
                      {overload.reason}
                    </div>
                  </div>

                  {overload.shouldIncrease && (
                    <div className="flex items-center justify-between sm:justify-end gap-2">
                      <span
                        style={{
                          backgroundColor: colors.accent,
                          color: colors.accentText
                        }}
                        className="text-xs font-extrabold uppercase px-2.5 py-1.5 rounded-lg flex items-center gap-1 font-mono-num"
                      >
                        {overload.mode === 'assist' ? (
                          <ArrowDownRight className="w-4 h-4 stroke-[2.5]" />
                        ) : (
                          <ArrowUpRight className="w-4 h-4 stroke-[2.5]" />
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
                        onClick={() =>
                          handleApplyOverloadWeight(exercise, overload.suggestedWeightKg)
                        }
                        style={{
                          backgroundColor: colors.card,
                          borderColor: colors.accentBorder,
                          color: colors.text
                        }}
                        className="min-h-[44px] px-3 rounded-xl border text-xs font-extrabold uppercase shrink-0"
                      >
                        Apply
                      </button>
                    </div>
                  )}
                </div>

                {/* Set Rows Table */}
                <div className="space-y-2 tabular-nums">
                  <div
                    style={{ color: colors.muted }}
                    className="grid grid-cols-12 gap-1.5 sm:gap-2 px-2 text-[10px] sm:text-[11px] font-extrabold uppercase tracking-wider"
                  >
                    <div className="col-span-2">Set</div>
                    <div className="col-span-4">
                      {isAssisted ? `Assist (${appState.unit})` : `Weight (${appState.unit})`}
                    </div>
                    <div className="col-span-4">Reps ({exercise.repLabel})</div>
                    <div className="col-span-2 text-right">Done</div>
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
                        className="grid grid-cols-12 gap-1.5 sm:gap-2 items-center p-2 rounded-xl border transition-colors"
                      >
                        <div className="col-span-2 pl-1">
                          <span className="font-display text-xl font-extrabold">
                            #{sIdx + 1}
                          </span>
                          {prevSet && (
                            <div
                              className="text-[10px] font-mono-num leading-tight"
                              style={{ color: colors.muted }}
                            >
                              {formatWeight(prevSet.weight)}×{prevSet.reps}
                            </div>
                          )}
                        </div>

                        <div className="col-span-4">
                          <input
                            type="number"
                            inputMode="decimal"
                            step="0.5"
                            aria-label={`${displayName} set ${sIdx + 1} weight`}
                            value={setRow.weight === '' ? '' : formatWeight(setRow.weight)}
                            onChange={(e) =>
                              handleSetInputChange(exercise.id, sIdx, 'weight', e.target.value)
                            }
                            style={{
                              backgroundColor: colors.card,
                              borderColor: colors.border,
                              color: colors.text
                            }}
                            className="w-full min-h-[44px] px-2 rounded-xl border text-center font-extrabold text-base font-mono-num focus-visible:outline focus-visible:outline-2 focus-visible:outline-[color:var(--ring)]"
                          />
                        </div>

                        <div className="col-span-4">
                          <input
                            type="number"
                            inputMode="numeric"
                            aria-label={`${displayName} set ${sIdx + 1} reps`}
                            value={setRow.reps}
                            onChange={(e) =>
                              handleSetInputChange(exercise.id, sIdx, 'reps', e.target.value)
                            }
                            style={{
                              backgroundColor: colors.card,
                              borderColor: colors.border,
                              color: colors.text
                            }}
                            className="w-full min-h-[44px] px-2 rounded-xl border text-center font-extrabold text-base font-mono-num focus-visible:outline focus-visible:outline-2 focus-visible:outline-[color:var(--ring)]"
                          />
                        </div>

                        <div className="col-span-2 flex justify-end">
                          <button
                            onClick={() => handleToggleSetComplete(exercise, sIdx)}
                            aria-label={`Mark ${displayName} set ${sIdx + 1} complete`}
                            style={{
                              backgroundColor: setRow.completed ? colors.accent : colors.card,
                              color: setRow.completed ? colors.accentText : colors.muted,
                              borderColor: setRow.completed ? colors.accentBorder : colors.border
                            }}
                            className="min-h-[44px] min-w-[44px] rounded-xl border flex items-center justify-center transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-[color:var(--ring)]"
                          >
                            <Check className="w-5 h-5 stroke-[2.5]" />
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
    </div>
  );
}

// ============================================================================
// 2. PLAN VIEW COMPONENT
// ============================================================================

function PlanView({ colors, isDark, appState, onSelectWorkoutDay }) {
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
    <div className="space-y-5">
      <div
        style={{ backgroundColor: colors.card, borderColor: colors.border }}
        className="p-4 sm:p-6 rounded-2xl border space-y-4"
      >
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <span
              style={{ backgroundColor: colors.accent, color: colors.accentText }}
              className="text-xs font-extrabold uppercase px-2.5 py-1 rounded-md"
            >
              6-Day PPL V-Taper Split (116 Primary Sets)
            </span>
            <h2 className="font-display text-3xl sm:text-4xl font-black uppercase mt-2">
              Weekly Hypertrophy Blueprint
            </h2>
            <p style={{ color: colors.muted }} className="text-xs sm:text-sm">
              20 direct Lat/Back sets + 27 total Deltoid sets (11 Side, 7 Front, 9 Rear) engineered for maximum shoulder-to-waist ratio.
            </p>
          </div>
        </div>

        {/* Muscle Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pt-1">
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
                className="min-h-[40px] px-3 rounded-xl border text-xs font-extrabold uppercase whitespace-nowrap"
              >
                {cat}
              </button>
            );
          })}
        </div>
      </div>

      {/* Days Grid */}
      <div className="grid grid-cols-1 gap-4">
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
              className="p-4 sm:p-6 rounded-2xl border space-y-4"
            >
              <div
                className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b"
                style={{ borderColor: colors.border }}
              >
                <div className="flex items-center gap-2">
                  <span
                    style={{ backgroundColor: colors.accent, color: colors.accentText }}
                    className="text-xs font-extrabold uppercase px-2.5 py-0.5 rounded-md"
                  >
                    {day.shortDay}
                  </span>
                  <h3 className="font-display text-2xl sm:text-3xl font-black uppercase">
                    {day.title} — {day.subtitle}
                  </h3>
                </div>

                <button
                  onClick={() => onSelectWorkoutDay(day.dayIndex)}
                  style={{ backgroundColor: colors.elevated, borderColor: colors.border }}
                  className="min-h-[42px] px-3.5 rounded-xl border text-xs font-extrabold uppercase flex items-center gap-1"
                >
                  <span>Open in Today</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              {day.isRest ? (
                <div
                  style={{ backgroundColor: colors.elevated, borderColor: colors.border }}
                  className="p-4 rounded-xl border flex items-center gap-3"
                >
                  <Footprints
                    className="w-6 h-6 shrink-0"
                    style={{ color: isDark ? colors.accent : colors.text }}
                  />
                  <div className="text-xs sm:text-sm">
                    <strong>Rest, 20–30 min easy walk.</strong> Active recovery, light mobility, and weekly grocery prep.
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {filteredExercises.map((ex) => (
                    <div
                      key={ex.id}
                      style={{ backgroundColor: colors.elevated, borderColor: colors.border }}
                      className="p-3.5 rounded-xl border flex flex-col justify-between gap-2"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="font-extrabold text-sm sm:text-base">{ex.name}</div>
                          <div className="flex flex-wrap items-center gap-1.5 mt-1">
                            <span
                              style={{
                                backgroundColor: colors.card,
                                borderColor: colors.border,
                                color: isDark ? colors.accent : colors.text
                              }}
                              className="text-[10px] font-extrabold px-2 py-0.5 rounded border uppercase"
                            >
                              {ex.primaryGroup}
                            </span>
                            <span className="text-[11px] font-semibold font-mono-num" style={{ color: colors.muted }}>
                              {ex.type} • {ex.restSec}s • Step {ex.step}
                            </span>
                          </div>
                        </div>
                        <div
                          style={{
                            backgroundColor: colors.card,
                            borderColor: colors.border
                          }}
                          className="font-display px-2.5 py-1 rounded-lg border text-lg font-extrabold shrink-0 tabular-nums"
                        >
                          {ex.sets} × {ex.repLabel}
                        </div>
                      </div>

                      <p
                        className="text-xs pt-2 border-t"
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
// 3. NUTRITION VIEW COMPONENT (100% WHOLE-FOOD INDIAN SYSTEM)
// ============================================================================

function NutritionView({
  colors,
  isDark,
  appState,
  setAppState,
  nutritionTotals,
  gainAnalysis,
  handleDietTrackChange,
  showToast
}) {
  const [subView, setSubView] = useState('daily'); // 'daily' | 'rotation' | 'foods'

  const kcalTarget = appState.profile.targetCalories || SCIENCE_RULES.TARGET_KCAL;
  const proteinTarget = appState.profile.targetProteinG || SCIENCE_RULES.TARGET_PROTEIN_G;
  const waterTarget = appState.profile.targetWaterMl || SCIENCE_RULES.TARGET_WATER_ML;

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
    <div className="space-y-5">
      {/* Top Track Switcher */}
      <div
        style={{ backgroundColor: colors.card, borderColor: colors.border }}
        className="p-4 sm:p-5 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3"
      >
        <div>
          <span
            style={{ backgroundColor: colors.accent, color: colors.accentText }}
            className="text-[11px] font-extrabold uppercase px-2.5 py-0.5 rounded-md"
          >
            Zero Supplements • 100% Indian Kitchen
          </span>
          <h2 className="font-display text-3xl sm:text-4xl font-black uppercase mt-1">
            Whole-Food Lean Bulk Nutrition
          </h2>
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
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
                className="min-h-[40px] px-3 rounded-xl border text-xs font-extrabold uppercase"
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
        className="p-4 rounded-2xl border grid grid-cols-3 gap-2 justify-items-center tabular-nums"
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
            c: '#38BDF8',
            s: 'water',
            t: `${(appState.waterMl / 1000).toFixed(1)}/${(waterTarget / 1000).toFixed(1)}L`
          }
        ].map((r) => (
          <div key={r.s} className="text-center">
            <Ring
              value={r.v}
              max={r.m}
              color={r.c}
              track={colors.elevated}
              label={`${Math.min(100, Math.round((r.v / r.m) * 100))}%`}
              sub={r.s}
            />
            <div className="text-[11px] font-bold mt-1.5 font-mono-num">{r.t}</div>
          </div>
        ))}
      </div>

      {/* Macro & Hydration Bento Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 tabular-nums">
        {/* Calories Card */}
        <div
          style={{ backgroundColor: colors.card, borderColor: colors.border }}
          className="p-4 sm:p-5 rounded-2xl border space-y-3"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold uppercase" style={{ color: colors.muted }}>
              Daily Energy
            </span>
            <Flame className="w-5 h-5" style={{ color: isDark ? colors.accent : colors.text }} />
          </div>
          <div className="flex items-baseline justify-between">
            <div className="font-display text-3xl sm:text-4xl font-black">
              {nutritionTotals.consumedKcal}{' '}
              <span className="text-lg font-bold" style={{ color: colors.muted }}>
                / {kcalTarget} kcal
              </span>
            </div>
            <span className="text-xs font-extrabold font-mono-num">{kcalPercent}%</span>
          </div>
          <div
            style={{ backgroundColor: colors.elevated }}
            className="w-full h-3 rounded-full overflow-hidden"
          >
            <div
              style={{
                width: `${kcalPercent}%`,
                backgroundColor: colors.accent
              }}
              className="h-full transition-all"
            />
          </div>
          <div className="text-[11px] flex justify-between" style={{ color: colors.muted }}>
            <span>Planned Menu: {nutritionTotals.plannedKcal} kcal</span>
            <span>Floor: {SCIENCE_RULES.MIN_ACCEPTABLE_KCAL} kcal</span>
          </div>
        </div>

        {/* Protein Card */}
        <div
          style={{ backgroundColor: colors.card, borderColor: colors.border }}
          className="p-4 sm:p-5 rounded-2xl border space-y-3"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold uppercase" style={{ color: colors.muted }}>
              Whole-Food Protein
            </span>
            <ShieldCheck
              className="w-5 h-5"
              style={{ color: isDark ? colors.accent : colors.text }}
            />
          </div>
          <div className="flex items-baseline justify-between">
            <div className="font-display text-3xl sm:text-4xl font-black">
              {nutritionTotals.consumedProtein}g{' '}
              <span className="text-lg font-bold" style={{ color: colors.muted }}>
                / {proteinTarget}g
              </span>
            </div>
            <span className="text-xs font-extrabold font-mono-num">{proteinPercent}%</span>
          </div>
          <div
            style={{ backgroundColor: colors.elevated }}
            className="w-full h-3 rounded-full overflow-hidden"
          >
            <div
              style={{
                width: `${proteinPercent}%`,
                backgroundColor: colors.accent
              }}
              className="h-full transition-all"
            />
          </div>
          <div className="text-[11px] flex justify-between" style={{ color: colors.muted }}>
            <span>Feedings ≥18g: {nutritionTotals.proteinFeedingsCount}/4</span>
            <span>Floor: 110g/day</span>
          </div>
        </div>

        {/* Hydration & Sleep Card */}
        <div
          style={{ backgroundColor: colors.card, borderColor: colors.border }}
          className="p-4 sm:p-5 rounded-2xl border space-y-3"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold uppercase" style={{ color: colors.muted }}>
              Water (3.5L) &amp; Sleep
            </span>
            <Droplets className="w-5 h-5" style={{ color: isDark ? colors.accent : colors.text }} />
          </div>
          <div className="flex items-baseline justify-between">
            <div className="font-display text-3xl sm:text-4xl font-black">
              {(appState.waterMl / 1000).toFixed(2)}L{' '}
              <span className="text-lg font-bold" style={{ color: colors.muted }}>
                / {(waterTarget / 1000).toFixed(1)}L
              </span>
            </div>
            <span className="text-xs font-extrabold font-mono-num">{waterPercent}%</span>
          </div>
          <div className="grid grid-cols-3 gap-1.5">
            <button
              onClick={() =>
                setAppState((prev) => ({ ...prev, waterMl: prev.waterMl + 250 }))
              }
              style={{ backgroundColor: colors.elevated, borderColor: colors.border }}
              className="min-h-[38px] rounded-xl border text-xs font-extrabold"
            >
              +250ml
            </button>
            <button
              onClick={() =>
                setAppState((prev) => ({ ...prev, waterMl: prev.waterMl + 500 }))
              }
              style={{ backgroundColor: colors.accent, color: colors.accentText }}
              className="min-h-[38px] rounded-xl text-xs font-extrabold"
            >
              +500ml
            </button>
            <button
              onClick={() => setAppState((prev) => ({ ...prev, waterMl: 0 }))}
              style={{ backgroundColor: colors.elevated, borderColor: colors.border }}
              className="min-h-[38px] rounded-xl border text-xs font-bold"
            >
              Reset
            </button>
          </div>
        </div>
      </div>

      {/* Sub-Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto">
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
              className="min-h-[42px] px-3.5 rounded-xl border text-xs font-extrabold uppercase whitespace-nowrap"
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {subView === 'daily' && (
        <div className="space-y-4">
          <div className="space-y-3">
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
                  className="p-4 sm:p-5 rounded-2xl border space-y-3 transition-colors"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          style={{ backgroundColor: colors.elevated, borderColor: colors.border }}
                          className="text-[11px] font-extrabold px-2 py-0.5 rounded border font-mono-num"
                        >
                          {slot.timeHint}
                        </span>
                        <h3 className="font-display text-2xl font-black uppercase">
                          {slot.slotName}
                        </h3>
                        <span
                          style={{
                            backgroundColor: colors.accent,
                            color: colors.accentText
                          }}
                          className="text-xs font-extrabold px-2 py-0.5 rounded font-mono-num"
                        >
                          {macros.kcal} kcal • {macros.protein}g P
                        </span>
                      </div>
                      <p className="text-xs sm:text-sm font-semibold">{activeOpt.description}</p>
                      <div className="text-[11px] font-mono-num" style={{ color: colors.muted }}>
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
                      className="min-h-[48px] min-w-[48px] rounded-xl border flex items-center justify-center shrink-0"
                    >
                      <Check className="w-6 h-6 stroke-[2.5]" />
                    </button>
                  </div>

                  {allowedOptions.length > 1 && (
                    <div
                      className="flex flex-wrap items-center gap-1.5 pt-2 border-t"
                      style={{ borderColor: colors.border }}
                    >
                      <span className="text-[11px] font-bold uppercase" style={{ color: colors.muted }}>
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
                            className="min-h-[34px] px-2.5 py-1 rounded-lg border text-xs font-extrabold"
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

          {/* Appetite Helpers */}
          <div
            style={{ backgroundColor: colors.card, borderColor: colors.border }}
            className="p-4 sm:p-5 rounded-2xl border space-y-3"
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-display text-2xl font-black uppercase">
                  One-Tap Appetite Helpers (+Calories)
                </h3>
                <p className="text-xs" style={{ color: colors.muted }}>
                  Struggling to hit 2,900 kcal or need +300 kcal for a plateau? Tap to log low-volume whole foods.
                </p>
              </div>
              {(appState.loggedAppetiteHelpers?.length || 0) > 0 && (
                <button
                  onClick={handleClearHelpers}
                  style={{ backgroundColor: colors.elevated, borderColor: colors.border }}
                  className="min-h-[38px] px-3 rounded-xl border text-xs font-bold"
                >
                  Clear ({appState.loggedAppetiteHelpers.length})
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
              {APPETITE_HELPERS.map((helper) => (
                <button
                  key={helper.id}
                  onClick={() => handleAddAppetiteHelper(helper)}
                  style={{ backgroundColor: colors.elevated, borderColor: colors.border }}
                  className="min-h-[48px] p-3 rounded-xl border text-left flex items-center justify-between gap-2"
                >
                  <div>
                    <div className="text-xs font-extrabold">{helper.label}</div>
                    <div className="text-[11px] font-mono-num" style={{ color: colors.muted }}>
                      +{helper.kcal} kcal • +{helper.protein}g P
                    </div>
                  </div>
                  <Plus className="w-4 h-4 shrink-0" />
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {subView === 'rotation' && (
        <div className="space-y-4">
          <div
            style={{ backgroundColor: colors.card, borderColor: colors.border }}
            className="p-4 sm:p-6 rounded-2xl border space-y-3"
          >
            <h3 className="font-display text-2xl sm:text-3xl font-black uppercase">
              7-Day Non-Repeating Dinner Protein Rotation ({appState.profile.dietTrack})
            </h3>
            <p className="text-xs" style={{ color: colors.muted }}>
              Lunch and Dinner never use the same primary protein anchor on the same day.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-7 gap-2 pt-2">
              {weeklyMenu.map((d) => (
                <div
                  key={d.day}
                  style={{ backgroundColor: colors.elevated, borderColor: colors.border }}
                  className="p-3 rounded-xl border space-y-1.5 text-xs"
                >
                  <div
                    style={{ backgroundColor: colors.accent, color: colors.accentText }}
                    className="inline-block px-2 py-0.5 rounded font-extrabold uppercase"
                  >
                    {d.day}
                  </div>
                  <div className="font-mono-num space-y-0.5 text-[11px]">
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
            className="p-4 sm:p-6 rounded-2xl border space-y-4"
          >
            <div className="flex items-center gap-2">
              <ShoppingBag className="w-5 h-5" style={{ color: isDark ? colors.accent : colors.text }} />
              <h3 className="font-display text-2xl sm:text-3xl font-black uppercase">
                Weekly Indian Grocery List (7 Days)
              </h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {Object.entries(groceryList).map(([category, items]) => (
                <div
                  key={category}
                  style={{ backgroundColor: colors.elevated, borderColor: colors.border }}
                  className="p-4 rounded-xl border space-y-2"
                >
                  <div
                    className="text-xs font-extrabold uppercase tracking-wider"
                    style={{ color: isDark ? colors.accent : colors.text }}
                  >
                    {category}
                  </div>
                  <div className="space-y-1.5 text-xs">
                    {items.map((item) => (
                      <div key={item.id} className="flex items-center justify-between gap-2">
                        <span>{item.name}</span>
                        <span className="font-extrabold font-mono-num shrink-0">{item.displayQty}</span>
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
          className="p-4 sm:p-6 rounded-2xl border space-y-3"
        >
          <h3 className="font-display text-2xl sm:text-3xl font-black uppercase">
            IFCT 2017 / USDA Indian Whole-Food Database (29 Items)
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
            {appState.foodDatabase.map((f) => (
              <div
                key={f.id}
                style={{ backgroundColor: colors.elevated, borderColor: colors.border }}
                className="p-3 rounded-xl border flex items-center justify-between gap-2 text-xs"
              >
                <div>
                  <div className="font-extrabold">{f.name}</div>
                  <div style={{ color: colors.muted }}>
                    Per {f.basis} {f.unit} ({f.category})
                  </div>
                </div>
                <div className="text-right font-mono-num shrink-0">
                  <div className="font-extrabold">{f.kcal} kcal</div>
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
// 4. PROGRESS VIEW COMPONENT (WEIGH-INS, GAIN RATE & V-TAPER RATIO)
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
  showToast
}) {
  const [weightInput, setWeightInput] = useState('');
  const [weightDate, setWeightDate] = useState(() => new Date().toLocaleDateString('en-CA'));

  const [measForm, setMeasForm] = useState({
    shoulders: latestMeasurement?.shoulders || 108,
    chest: latestMeasurement?.chest || 92,
    waist: latestMeasurement?.waist || 74,
    arms: latestMeasurement?.arms || 31,
    thighs: latestMeasurement?.thighs || 50
  });

  const handleAddWeightLog = (e) => {
    e.preventDefault();
    const num = Number(weightInput);
    if (!num || num <= 25 || num >= 250) {
      showToast('Enter a valid morning weight.');
      return;
    }
    const kgVal = toKg(num);
    const entry = {
      id: `w-${Date.now()}`,
      date: weightDate,
      label: weightDate.slice(5),
      weightKg: kgVal
    };
    setAppState((prev) => ({
      ...prev,
      profile: { ...prev.profile, currentWeightKg: kgVal },
      weightLogs: [...prev.weightLogs.filter((w) => w.date !== weightDate), entry].sort(
        (a, b) => new Date(a.date) - new Date(b.date)
      )
    }));
    setWeightInput('');
    showToast(`Logged morning weigh-in: ${num} ${appState.unit}`);
  };

  const handleSaveMeasurements = (e) => {
    e.preventDefault();
    const entry = {
      id: `m-${Date.now()}`,
      date: new Date().toLocaleDateString('en-CA'),
      shoulders: Number(measForm.shoulders || 0),
      chest: Number(measForm.chest || 0),
      waist: Number(measForm.waist || 0),
      arms: Number(measForm.arms || 0),
      thighs: Number(measForm.thighs || 0)
    };
    setAppState((prev) => ({
      ...prev,
      measurements: [...prev.measurements, entry]
    }));
    const ratio = (entry.shoulders / Math.max(1, entry.waist)).toFixed(2);
    showToast(`Measurements saved! V-Taper Ratio: ${ratio}x`);
  };

  const chartData = useMemo(() => {
    return appState.weightLogs.map((w) => ({
      date: w.date.slice(5),
      weight: formatWeight(w.weightKg)
    }));
  }, [appState.weightLogs, formatWeight]);

  const liveRatio =
    vTaperRatio || Number((measForm.shoulders / Math.max(1, measForm.waist)).toFixed(2));

  return (
    <div className="space-y-5">
      {/* Weekly Gain Rate Analyzer Banner */}
      <div
        style={{
          backgroundColor:
            gainAnalysis.status === 'FAST_GAIN_WARNING'
              ? colors.card
              : gainAnalysis.status === 'PLATEAU_SUGGESTION'
              ? colors.accentSurface
              : colors.card,
          borderColor:
            gainAnalysis.status === 'FAST_GAIN_WARNING'
              ? colors.danger
              : gainAnalysis.status === 'PLATEAU_SUGGESTION'
              ? colors.accentBorder
              : colors.border
        }}
        className="p-4 sm:p-6 rounded-2xl border-2 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
      >
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <AlertTriangle
              className="w-4 h-4"
              style={{
                color:
                  gainAnalysis.status === 'FAST_GAIN_WARNING'
                    ? colors.danger
                    : isDark
                    ? colors.accent
                    : colors.text
              }}
            />
            <span className="text-xs font-extrabold uppercase tracking-wider">
              {gainAnalysis.headline}
            </span>
          </div>
          <p className="text-xs sm:text-sm" style={{ color: colors.muted }}>
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
                `Updated daily target by ${
                  gainAnalysis.calorieAdjustment > 0 ? '+' : ''
                }${gainAnalysis.calorieAdjustment} kcal!`
              );
            }}
            style={{
              backgroundColor: colors.accent,
              color: colors.accentText
            }}
            className="min-h-[44px] px-4 rounded-xl text-xs font-extrabold uppercase shrink-0"
          >
            Apply {gainAnalysis.calorieAdjustment > 0 ? '+300' : '-200'} kcal
          </button>
        )}
      </div>

      {/* Weight Logger + Line Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <form
          onSubmit={handleAddWeightLog}
          style={{ backgroundColor: colors.card, borderColor: colors.border }}
          className="p-4 sm:p-6 rounded-2xl border space-y-4"
        >
          <div className="flex items-center gap-2">
            <Scale className="w-5 h-5" style={{ color: isDark ? colors.accent : colors.text }} />
            <h3 className="font-display text-2xl font-black uppercase">
              Log Morning Weigh-In
            </h3>
          </div>
          <div>
            <label className="block text-xs font-bold uppercase mb-1" style={{ color: colors.muted }}>
              Date
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
              className="w-full min-h-[44px] px-3 rounded-xl border text-sm font-bold font-mono-num"
            />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase mb-1" style={{ color: colors.muted }}>
              Morning Weight ({appState.unit})
            </label>
            <input
              type="number"
              inputMode="decimal"
              step="0.1"
              placeholder={`e.g. ${formatWeight(56.2)}`}
              value={weightInput}
              onChange={(e) => setWeightInput(e.target.value)}
              style={{
                backgroundColor: colors.elevated,
                borderColor: colors.border,
                color: colors.text
              }}
              className="w-full min-h-[44px] px-3 rounded-xl border text-base font-extrabold font-mono-num"
            />
          </div>
          <button
            type="submit"
            style={{ backgroundColor: colors.accent, color: colors.accentText }}
            className="w-full min-h-[46px] rounded-xl font-extrabold text-xs uppercase tracking-wider"
          >
            Save Weigh-In
          </button>
        </form>

        {/* Weight Chart */}
        <div
          style={{ backgroundColor: colors.card, borderColor: colors.border }}
          className="lg:col-span-2 p-4 sm:p-6 rounded-2xl border flex flex-col justify-between"
        >
          <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
            <div>
              <h3 className="font-display text-2xl font-black uppercase">
                Lean-Bulk Trajectory (Target Band: {formatWeight(appState.profile.goalWeightMinKg)}–
                {formatWeight(appState.profile.goalWeightMaxKg)} {appState.unit})
              </h3>
            </div>
            <span
              style={{ backgroundColor: colors.elevated, borderColor: colors.border }}
              className="text-xs font-bold px-2.5 py-1 rounded-lg border font-mono-num"
            >
              {appState.weightLogs.length} logs
            </span>
          </div>

          <div className="h-60 w-full">
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 10, right: 16, left: -10, bottom: 0 }}>
                  <CartesianGrid stroke={colors.border} strokeDasharray="3 3" />
                  <XAxis dataKey="date" stroke={colors.muted} fontSize={11} />
                  <YAxis
                    stroke={colors.muted}
                    fontSize={11}
                    domain={['dataMin - 2', 'dataMax + 5']}
                  />
                  <Tooltip {...tip(colors)} />
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
                  <Line
                    type="monotone"
                    dataKey="weight"
                    stroke={isDark ? colors.accent : '#111113'}
                    strokeWidth={3}
                    dot={{ r: 4, fill: colors.accent }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div
                style={{ backgroundColor: colors.elevated, borderColor: colors.border }}
                className="h-full rounded-xl border flex items-center justify-center text-xs font-semibold p-4 text-center"
              >
                Log your first weekly weigh-in on the left to plot your 55 kg → 65–68 kg trajectory.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Body Measurements + V-Taper Gauge */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div
          style={{ backgroundColor: colors.card, borderColor: colors.border }}
          className="lg:col-span-2 p-4 sm:p-6 rounded-2xl border space-y-4 flex flex-col justify-between"
        >
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Ruler className="w-5 h-5" style={{ color: isDark ? colors.accent : colors.text }} />
              <div>
                <h3 className="font-display text-2xl sm:text-3xl font-black uppercase">
                  V-Taper Body Measurements (cm)
                </h3>
                <p className="text-xs" style={{ color: colors.muted }}>
                  Auto-calculates Shoulder-to-Waist Ratio (Goal: 1.40–1.50x). Keep waist gain ≤ 4 cm across the bulk.
                </p>
              </div>
            </div>

            <div
              style={{ backgroundColor: colors.accent, color: colors.accentText }}
              className="px-3.5 py-2 rounded-xl font-mono-num text-right"
            >
              <div className="text-[10px] font-extrabold uppercase">Current V-Taper Ratio</div>
              <div className="font-display text-2xl font-black">{liveRatio}x</div>
            </div>
          </div>

          <form onSubmit={handleSaveMeasurements} className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 items-end">
            {[
              { key: 'shoulders', label: 'Shoulders (cm)' },
              { key: 'chest', label: 'Chest (cm)' },
              { key: 'waist', label: 'Waist @ Navel (cm)' },
              { key: 'arms', label: 'Arms (cm)' },
              { key: 'thighs', label: 'Thighs (cm)' }
            ].map((field) => (
              <div key={field.key}>
                <label className="block text-[11px] font-bold uppercase mb-1" style={{ color: colors.muted }}>
                  {field.label}
                </label>
                <input
                  type="number"
                  inputMode="decimal"
                  step="0.5"
                  value={measForm[field.key]}
                  onChange={(e) =>
                    setMeasForm((prev) => ({ ...prev, [field.key]: Number(e.target.value) }))
                  }
                  style={{
                    backgroundColor: colors.elevated,
                    borderColor: colors.border,
                    color: colors.text
                  }}
                  className="w-full min-h-[44px] px-3 rounded-xl border text-sm font-extrabold font-mono-num"
                />
              </div>
            ))}
            <button
              type="submit"
              style={{ backgroundColor: colors.accent, color: colors.accentText }}
              className="col-span-2 sm:col-span-1 min-h-[44px] rounded-xl font-extrabold text-xs uppercase tracking-wider"
            >
              Save Tape
            </button>
          </form>
        </div>

        <VTaperGauge ratio={liveRatio} colors={colors} isDark={isDark} />
      </div>

      {/* Consistency Heatmap, Volume Bars & Strength Curve */}
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
// 5. STATS VIEW COMPONENT (MUSCLE VOLUMES, RADAR, HISTORY & UNIT TESTS)
// ============================================================================

function StatsView({ colors, isDark, appState }) {
  const volumes = useMemo(() => computeWeeklyMuscleVolumes(), []);
  const unitTests = useMemo(() => runBuiltInUnitTests(), []);

  return (
    <div className="space-y-5">
      {/* Top KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 tabular-nums">
        <div
          style={{ backgroundColor: colors.card, borderColor: colors.border }}
          className="p-4 rounded-2xl border"
        >
          <div className="text-xs font-bold uppercase" style={{ color: colors.muted }}>
            Workout Streak
          </div>
          <div className="font-display text-3xl font-black mt-1">
            {appState.workoutStreak} Sessions
          </div>
        </div>
        <div
          style={{ backgroundColor: colors.card, borderColor: colors.border }}
          className="p-4 rounded-2xl border"
        >
          <div className="text-xs font-bold uppercase" style={{ color: colors.muted }}>
            Prescribed Sets
          </div>
          <div className="font-display text-3xl font-black mt-1">116 / wk</div>
        </div>
        <div
          style={{ backgroundColor: colors.card, borderColor: colors.border }}
          className="p-4 rounded-2xl border"
        >
          <div className="text-xs font-bold uppercase" style={{ color: colors.muted }}>
            Logged Workouts
          </div>
          <div className="font-display text-3xl font-black mt-1">
            {appState.workoutHistory.length}
          </div>
        </div>
        <div
          style={{ backgroundColor: colors.card, borderColor: colors.border }}
          className="p-4 rounded-2xl border"
        >
          <div className="text-xs font-bold uppercase" style={{ color: colors.muted }}>
            Sunday Walk
          </div>
          <div
            style={{ color: isDark ? colors.accent : colors.text }}
            className="font-display text-3xl font-black mt-1"
          >
            {appState.sundayWalkDone ? 'Done ✓' : 'Pending'}
          </div>
        </div>
      </div>

      {/* Muscle Balance Radar + Weekly Sets Per Muscle Group */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <MuscleRadar colors={colors} isDark={isDark} />

        <div
          style={{ backgroundColor: colors.card, borderColor: colors.border }}
          className="lg:col-span-2 p-4 sm:p-6 rounded-2xl border space-y-4"
        >
          <div>
            <h3 className="font-display text-2xl sm:text-3xl font-black uppercase">
              Weekly Hypertrophy Volume Per Muscle Group (Target 10–20 Sets)
            </h3>
            <p className="text-xs" style={{ color: colors.muted }}>
              Shows direct primary sets and effective sets including 0.5× secondary compound credit.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 tabular-nums">
            {Object.entries(volumes.primary).map(([group, primSets]) => {
              const effSets = volumes.totalWithSecondary[group];
              const pct = Math.min(100, Math.round((primSets / 20) * 100));
              return (
                <div
                  key={group}
                  style={{ backgroundColor: colors.elevated, borderColor: colors.border }}
                  className="p-3.5 rounded-xl border space-y-2"
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-extrabold uppercase">{group}</span>
                    <span className="font-mono-num font-bold">
                      {primSets} direct ({effSets} eff)
                    </span>
                  </div>
                  <div
                    style={{ backgroundColor: colors.card }}
                    className="w-full h-2.5 rounded-full overflow-hidden"
                  >
                    <div
                      style={{ width: `${pct}%`, backgroundColor: colors.accent }}
                      className="h-full"
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Built-in Science & Logic Verification Suite */}
      <div
        style={{ backgroundColor: colors.card, borderColor: colors.border }}
        className="p-4 sm:p-6 rounded-2xl border space-y-3"
      >
        <h3 className="font-display text-2xl font-black uppercase">
          Automated Science &amp; Overload Unit Tests ({unitTests.filter((t) => t.passed).length}/
          {unitTests.length} Passing)
        </h3>
        <div className="space-y-2">
          {unitTests.map((t, idx) => (
            <div
              key={idx}
              style={{ backgroundColor: colors.elevated, borderColor: colors.border }}
              className="p-3 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
            >
              <div>
                <div className="font-extrabold">{t.name}</div>
                <div className="font-mono-num text-[11px]" style={{ color: colors.muted }}>
                  Actual: {t.actual}
                </div>
              </div>
              <span
                style={{
                  backgroundColor: t.passed ? colors.accent : colors.danger,
                  color: t.passed ? colors.accentText : '#FFFFFF'
                }}
                className="px-2.5 py-1 rounded-md font-extrabold uppercase text-[10px] self-start sm:self-center shrink-0"
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
// 6. SETTINGS VIEW COMPONENT (PROFILE, ICON.SVG DOWNLOAD, JSON BACKUP, RESET)
// ============================================================================

function SettingsView({
  colors,
  appState,
  setAppState,
  setShowOnboarding,
  setOnboardingForm,
  showToast
}) {
  const [confirmReset, setConfirmReset] = useState(false);

  const handleExportJson = () => {
    const dataStr = JSON.stringify(appState, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `vtaper-backup-${new Date().toLocaleDateString('en-CA')}.json`;
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
    reader.onload = (ev) => {
      try {
        const parsed = JSON.parse(String(ev.target?.result || '{}'));
        const { name: _legacyName, ...importedProfile } = parsed.profile || {};
        setAppState((prev) => ({
          ...prev,
          ...parsed,
          profile: { ...DEFAULT_PROFILE, ...importedProfile }
        }));
        showToast('Backup restored successfully!');
      } catch (err) {
        showToast('Invalid JSON backup file.');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-5">
      <div
        style={{ backgroundColor: colors.card, borderColor: colors.border }}
        className="p-4 sm:p-6 rounded-2xl border space-y-4"
      >
        <h2 className="font-display text-3xl font-black uppercase">
          Profile &amp; App Preferences
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <button
            onClick={() => {
              setOnboardingForm(appState.profile);
              setShowOnboarding(true);
            }}
            style={{ backgroundColor: colors.accent, color: colors.accentText }}
            className="min-h-[48px] px-4 rounded-xl font-extrabold text-xs uppercase tracking-wider flex items-center justify-center gap-2"
          >
            <Edit3 className="w-4 h-4" />
            <span>Edit Profile &amp; Goals</span>
          </button>

          <button
            onClick={handleDownloadSvgIcon}
            style={{ backgroundColor: colors.elevated, borderColor: colors.border }}
            className="min-h-[48px] px-4 rounded-xl border font-extrabold text-xs uppercase tracking-wider flex items-center justify-center gap-2"
          >
            <Download className="w-4 h-4" />
            <span>Download Brand icon.svg</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
          <div
            style={{ backgroundColor: colors.elevated, borderColor: colors.border }}
            className="p-4 rounded-xl border flex items-center justify-between"
          >
            <div>
              <div className="font-extrabold text-sm">Weight Unit</div>
              <div className="text-xs" style={{ color: colors.muted }}>
                Switch between kilograms (kg) and pounds (lb)
              </div>
            </div>
            <button
              onClick={() =>
                setAppState((prev) => ({
                  ...prev,
                  unit: prev.unit === 'kg' ? 'lb' : 'kg'
                }))
              }
              style={{ backgroundColor: colors.accent, color: colors.accentText }}
              className="min-h-[42px] px-4 rounded-xl font-extrabold text-xs uppercase"
            >
              {appState.unit.toUpperCase()}
            </button>
          </div>

          <div
            style={{ backgroundColor: colors.elevated, borderColor: colors.border }}
            className="p-4 rounded-xl border flex items-center justify-between"
          >
            <div>
              <div className="font-extrabold text-sm">Color Theme</div>
              <div className="text-xs" style={{ color: colors.muted }}>
                Solid flat dark or light mode (electric lime buttons)
              </div>
            </div>
            <button
              onClick={() =>
                setAppState((prev) => ({
                  ...prev,
                  theme: prev.theme === 'dark' ? 'light' : 'dark'
                }))
              }
              style={{ backgroundColor: colors.accent, color: colors.accentText }}
              className="min-h-[42px] px-4 rounded-xl font-extrabold text-xs uppercase"
            >
              {appState.theme.toUpperCase()}
            </button>
          </div>
        </div>
      </div>

      {/* Backup & Reset */}
      <div
        style={{ backgroundColor: colors.card, borderColor: colors.border }}
        className="p-4 sm:p-6 rounded-2xl border space-y-4"
      >
        <h3 className="font-display text-2xl font-black uppercase">
          Local Backup (JSON) &amp; Data Reset
        </h3>
        <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-2.5">
          <button
            onClick={handleExportJson}
            style={{ backgroundColor: colors.elevated, borderColor: colors.border }}
            className="min-h-[46px] px-4 rounded-xl border text-xs font-extrabold uppercase flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            <span>Export JSON Backup</span>
          </button>

          <label
            style={{ backgroundColor: colors.elevated, borderColor: colors.border }}
            className="min-h-[46px] px-4 rounded-xl border text-xs font-extrabold uppercase flex items-center gap-2 cursor-pointer"
          >
            <Upload className="w-4 h-4" />
            <span>Import JSON Backup</span>
            <input type="file" accept=".json" onChange={handleImportJson} className="hidden" />
          </label>

          {!confirmReset ? (
            <button
              onClick={() => setConfirmReset(true)}
              style={{ backgroundColor: colors.danger, color: '#FFFFFF' }}
              className="min-h-[46px] px-4 rounded-xl text-xs font-extrabold uppercase flex items-center gap-2 ml-auto"
            >
              <Trash2 className="w-4 h-4" />
              <span>Reset All Data</span>
            </button>
          ) : (
            <div className="flex items-center gap-2 ml-auto">
              <button
                onClick={() => {
                  const fresh = getFreshInitialState(appState.theme);
                  setAppState(fresh);
                  setConfirmReset(false);
                  setShowOnboarding(true);
                  showToast('All data reset to clean defaults.');
                }}
                style={{ backgroundColor: colors.danger, color: '#FFFFFF' }}
                className="min-h-[46px] px-4 rounded-xl text-xs font-extrabold uppercase"
              >
                Confirm Wipe
              </button>
              <button
                onClick={() => setConfirmReset(false)}
                style={{ backgroundColor: colors.elevated, borderColor: colors.border }}
                className="min-h-[46px] px-3 rounded-xl border text-xs font-bold"
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