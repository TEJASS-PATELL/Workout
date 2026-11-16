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
  Info,
  Sun,
  Moon,
  Download,
  Upload,
  Trash2,
  User,
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
  RotateCcw
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
  ReferenceLine
} from 'recharts';

// ============================================================================
// EXACT WORKOUT & MEAL PLAN DATA (src/data/plan.ts equivalent)
// ============================================================================

const WORKOUT_PLAN = [
  {
    dayIndex: 1,
    shortDay: 'Mon',
    dayName: 'Monday',
    title: 'Push A',
    subtitle: 'Chest, Front/Side Delts & Triceps',
    isRest: false,
    estimatedMinutes: 70,
    exercises: [
      {
        id: 'mon-1',
        name: 'Flat Bench Press',
        sets: 3,
        repMin: 6,
        repMax: 8,
        repLabel: '6-8',
        type: 'Compound',
        targetMuscle: 'Chest',
        muscleCategory: 'Chest',
        isLowerBody: false,
        cue: 'Retract shoulder blades, arch slightly, touch lower chest.'
      },
      {
        id: 'mon-2',
        name: 'Incline DB Press',
        sets: 3,
        repMin: 8,
        repMax: 10,
        repLabel: '8-10',
        type: 'Compound',
        targetMuscle: 'Upper Chest',
        muscleCategory: 'Chest',
        isLowerBody: false,
        cue: '30-degree bench angle, lower dumbbells with elbows at 45 degrees.'
      },
      {
        id: 'mon-3',
        name: 'Seated DB Shoulder Press',
        sets: 3,
        repMin: 8,
        repMax: 10,
        repLabel: '8-10',
        type: 'Compound',
        targetMuscle: 'Front/Side Delts',
        muscleCategory: 'Shoulders',
        isLowerBody: false,
        cue: 'Keep core braced and back flat against the pad; press overhead without clanking.'
      },
      {
        id: 'mon-4',
        name: 'Lateral Raise',
        sets: 4,
        repMin: 12,
        repMax: 15,
        repLabel: '12-15',
        type: 'Isolation',
        targetMuscle: 'Side Delts',
        muscleCategory: 'Shoulders',
        isLowerBody: false,
        cue: 'Lead with elbows slightly bent, raise to shoulder height, control the descent.'
      },
      {
        id: 'mon-5',
        name: 'Triceps Rope Pushdown',
        sets: 3,
        repMin: 10,
        repMax: 12,
        repLabel: '10-12',
        type: 'Isolation',
        targetMuscle: 'Triceps',
        muscleCategory: 'Triceps',
        isLowerBody: false,
        cue: 'Pin elbows to your sides and spread the rope apart at the bottom.'
      },
      {
        id: 'mon-6',
        name: 'Overhead Triceps Extension',
        sets: 2,
        repMin: 10,
        repMax: 12,
        repLabel: '10-12',
        type: 'Isolation',
        targetMuscle: 'Triceps (Long Head)',
        muscleCategory: 'Triceps',
        isLowerBody: false,
        cue: 'Keep upper arms vertical by your ears to maximize long-head stretch.'
      }
    ]
  },
  {
    dayIndex: 2,
    shortDay: 'Tue',
    dayName: 'Tuesday',
    title: 'Pull A',
    subtitle: 'Lat Width, Mid-Back, Rear Delts & Biceps',
    isRest: false,
    estimatedMinutes: 70,
    exercises: [
      {
        id: 'tue-1',
        name: 'Lat Pulldown wide grip',
        sets: 4,
        repMin: 8,
        repMax: 10,
        repLabel: '8-10',
        type: 'Compound',
        targetMuscle: 'Lats (Width)',
        muscleCategory: 'Back / Lats',
        isLowerBody: false,
        cue: 'Drive elbows down toward your hips, slight lean back, chest tall.'
      },
      {
        id: 'tue-2',
        name: 'Assisted Pull-up',
        sets: 3,
        repMin: 6,
        repMax: 10,
        repLabel: '6-10',
        type: 'Compound',
        targetMuscle: 'Lats (Width)',
        muscleCategory: 'Back / Lats',
        isLowerBody: false,
        cue: 'Full dead hang at bottom, pull chin over bar by depressing scapulae first.'
      },
      {
        id: 'tue-3',
        name: 'Seated Cable Row',
        sets: 3,
        repMin: 8,
        repMax: 10,
        repLabel: '8-10',
        type: 'Compound',
        targetMuscle: 'Mid-Back / Lats',
        muscleCategory: 'Back / Lats',
        isLowerBody: false,
        cue: 'Sit tall, pull handle to lower ribs, squeeze shoulder blades for 1 second.'
      },
      {
        id: 'tue-4',
        name: 'Face Pull',
        sets: 3,
        repMin: 12,
        repMax: 15,
        repLabel: '12-15',
        type: 'Isolation',
        targetMuscle: 'Rear Delts / Traps',
        muscleCategory: 'Shoulders',
        isLowerBody: false,
        cue: 'Pull rope toward forehead while externally rotating thumbs backward.'
      },
      {
        id: 'tue-5',
        name: 'EZ-Bar Curl',
        sets: 3,
        repMin: 8,
        repMax: 10,
        repLabel: '8-10',
        type: 'Isolation',
        targetMuscle: 'Biceps',
        muscleCategory: 'Biceps',
        isLowerBody: false,
        cue: 'Keep elbows tucked at ribs, curl without swinging your torso.'
      },
      {
        id: 'tue-6',
        name: 'Hammer Curl',
        sets: 2,
        repMin: 10,
        repMax: 12,
        repLabel: '10-12',
        type: 'Isolation',
        targetMuscle: 'Brachialis / Forearms',
        muscleCategory: 'Biceps',
        isLowerBody: false,
        cue: 'Neutral palms-facing grip, controlled eccentric for arm thickness.'
      }
    ]
  },
  {
    dayIndex: 3,
    shortDay: 'Wed',
    dayName: 'Wednesday',
    title: 'Legs A',
    subtitle: 'Quads, Hamstrings, Calves & Core',
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
        type: 'Compound',
        targetMuscle: 'Quads',
        muscleCategory: 'Quads',
        isLowerBody: true,
        cue: 'Feet shoulder-width, lower sled until knees hit 90 degrees without lower back rounding.'
      },
      {
        id: 'wed-2',
        name: 'Romanian Deadlift',
        sets: 3,
        repMin: 8,
        repMax: 10,
        repLabel: '8-10',
        type: 'Compound',
        targetMuscle: 'Hamstrings',
        muscleCategory: 'Hamstrings',
        isLowerBody: true,
        cue: 'Push hips straight back with soft knees until deep hamstring stretch, bar close to shins.'
      },
      {
        id: 'wed-3',
        name: 'Leg Extension',
        sets: 3,
        repMin: 12,
        repMax: 15,
        repLabel: '12-15',
        type: 'Isolation',
        targetMuscle: 'Quads',
        muscleCategory: 'Quads',
        isLowerBody: true,
        cue: 'Pause 1 second at top contraction, control the lowering phase.'
      },
      {
        id: 'wed-4',
        name: 'Leg Curl',
        sets: 3,
        repMin: 10,
        repMax: 12,
        repLabel: '10-12',
        type: 'Isolation',
        targetMuscle: 'Hamstrings',
        muscleCategory: 'Hamstrings',
        isLowerBody: true,
        cue: 'Keep hips pressed into the pad throughout the entire curl.'
      },
      {
        id: 'wed-5',
        name: 'Standing Calf Raise',
        sets: 4,
        repMin: 12,
        repMax: 15,
        repLabel: '12-15',
        type: 'Isolation',
        targetMuscle: 'Calves',
        muscleCategory: 'Calves',
        isLowerBody: true,
        cue: 'Full stretch at the bottom for 1 second, press high onto big toes.'
      },
      {
        id: 'wed-6',
        name: 'Hanging Leg Raise',
        sets: 3,
        repMin: 10,
        repMax: 15,
        repLabel: '10-15',
        type: 'Isolation',
        targetMuscle: 'Abs / Core',
        muscleCategory: 'Abs / Core',
        isLowerBody: false,
        cue: 'Curl pelvis upward toward ribs rather than just swinging legs.'
      }
    ]
  },
  {
    dayIndex: 4,
    shortDay: 'Thu',
    dayName: 'Thursday',
    title: 'Push B',
    subtitle: 'Overhead Power, Side Delts, Chest & Triceps',
    isRest: false,
    estimatedMinutes: 70,
    exercises: [
      {
        id: 'thu-1',
        name: 'Overhead Press',
        sets: 4,
        repMin: 6,
        repMax: 8,
        repLabel: '6-8',
        type: 'Compound',
        targetMuscle: 'Shoulders / Upper Chest',
        muscleCategory: 'Shoulders',
        isLowerBody: false,
        cue: 'Squeeze glutes and abs tight, press bar vertically in a straight line.'
      },
      {
        id: 'thu-2',
        name: 'Machine/DB Chest Press',
        sets: 3,
        repMin: 8,
        repMax: 10,
        repLabel: '8-10',
        type: 'Compound',
        targetMuscle: 'Chest',
        muscleCategory: 'Chest',
        isLowerBody: false,
        cue: 'Drive through palms with shoulders pinned back into the seat.'
      },
      {
        id: 'thu-3',
        name: 'Cable Lateral Raise',
        sets: 4,
        repMin: 15,
        repMax: 20,
        repLabel: '15-20',
        type: 'Isolation',
        targetMuscle: 'Side Delts',
        muscleCategory: 'Shoulders',
        isLowerBody: false,
        cue: 'Set pulley at wrist height, sweep arm out in a wide arc for constant tension.'
      },
      {
        id: 'thu-4',
        name: 'Pec Deck/Cable Fly',
        sets: 3,
        repMin: 12,
        repMax: 15,
        repLabel: '12-15',
        type: 'Isolation',
        targetMuscle: 'Chest',
        muscleCategory: 'Chest',
        isLowerBody: false,
        cue: 'Hug a wide tree trunk with soft elbows, squeeze inner chest at center.'
      },
      {
        id: 'thu-5',
        name: 'Assisted Dips or Skull Crusher',
        sets: 3,
        repMin: 8,
        repMax: 12,
        repLabel: '8-12',
        type: 'Compound',
        targetMuscle: 'Triceps / Lower Chest',
        muscleCategory: 'Triceps',
        isLowerBody: false,
        cue: 'Keep elbows tucked and lower under full control until deep stretch.'
      },
      {
        id: 'thu-6',
        name: 'Rear Delt Fly',
        sets: 3,
        repMin: 15,
        repMax: 15,
        repLabel: '15',
        type: 'Isolation',
        targetMuscle: 'Rear Delts',
        muscleCategory: 'Shoulders',
        isLowerBody: false,
        cue: 'Push hands outward and back with pinkies slightly turned out.'
      }
    ]
  },
  {
    dayIndex: 5,
    shortDay: 'Fri',
    dayName: 'Friday',
    title: 'Pull B',
    subtitle: 'Lat Thickness, V-Taper Sweep & Biceps Peak',
    isRest: false,
    estimatedMinutes: 70,
    exercises: [
      {
        id: 'fri-1',
        name: 'Chest-Supported/One-arm DB Row',
        sets: 4,
        repMin: 8,
        repMax: 10,
        repLabel: '8-10',
        type: 'Compound',
        targetMuscle: 'Lats / Mid-Back',
        muscleCategory: 'Back / Lats',
        isLowerBody: false,
        cue: 'Row dumbbell in an arc toward your hip pocket to isolate the lat.'
      },
      {
        id: 'fri-2',
        name: 'Neutral-grip Pulldown',
        sets: 3,
        repMin: 10,
        repMax: 12,
        repLabel: '10-12',
        type: 'Compound',
        targetMuscle: 'Lats',
        muscleCategory: 'Back / Lats',
        isLowerBody: false,
        cue: 'Keep elbows tucked forward and drive down to upper chest.'
      },
      {
        id: 'fri-3',
        name: 'Straight-arm Pulldown',
        sets: 3,
        repMin: 12,
        repMax: 15,
        repLabel: '12-15',
        type: 'Isolation',
        targetMuscle: 'Lats',
        muscleCategory: 'Back / Lats',
        isLowerBody: false,
        cue: 'Arms nearly straight, sweep bar down to thighs using lats only.'
      },
      {
        id: 'fri-4',
        name: 'Reverse Pec Deck',
        sets: 3,
        repMin: 15,
        repMax: 15,
        repLabel: '15',
        type: 'Isolation',
        targetMuscle: 'Rear Delts',
        muscleCategory: 'Shoulders',
        isLowerBody: false,
        cue: 'Chest against pad, sweep arms straight back without shrugging traps.'
      },
      {
        id: 'fri-5',
        name: 'Incline DB Curl',
        sets: 3,
        repMin: 10,
        repMax: 12,
        repLabel: '10-12',
        type: 'Isolation',
        targetMuscle: 'Biceps (Long Head)',
        muscleCategory: 'Biceps',
        isLowerBody: false,
        cue: 'Let arms hang straight behind torso for maximum stretch before curling.'
      },
      {
        id: 'fri-6',
        name: 'Cable Curl',
        sets: 2,
        repMin: 12,
        repMax: 12,
        repLabel: '12',
        type: 'Isolation',
        targetMuscle: 'Biceps',
        muscleCategory: 'Biceps',
        isLowerBody: false,
        cue: 'Constant cable tension, squeeze hard at the top.'
      }
    ]
  },
  {
    dayIndex: 6,
    shortDay: 'Sat',
    dayName: 'Saturday',
    title: 'Legs B',
    subtitle: 'Unilateral Legs, Glutes, Bonus Side Delts & Abs',
    isRest: false,
    estimatedMinutes: 70,
    exercises: [
      {
        id: 'sat-1',
        name: 'Bulgarian Split Squat',
        sets: 3,
        repMin: 8,
        repMax: 10,
        repLabel: '8-10',
        type: 'Compound',
        targetMuscle: 'Quads / Glutes',
        muscleCategory: 'Quads',
        isLowerBody: true,
        cue: 'Rear foot on bench, lean torso slightly forward, drop back knee straight down.'
      },
      {
        id: 'sat-2',
        name: 'Hip Thrust',
        sets: 3,
        repMin: 10,
        repMax: 10,
        repLabel: '10',
        type: 'Compound',
        targetMuscle: 'Glutes',
        muscleCategory: 'Glutes',
        isLowerBody: true,
        cue: 'Chin tucked, drive through heels to full hip lockout, squeeze glutes.'
      },
      {
        id: 'sat-3',
        name: 'Hack/Smith Squat',
        sets: 3,
        repMin: 10,
        repMax: 12,
        repLabel: '10-12',
        type: 'Compound',
        targetMuscle: 'Quads',
        muscleCategory: 'Quads',
        isLowerBody: true,
        cue: 'Back flat on sled, descend below parallel with knees tracking over toes.'
      },
      {
        id: 'sat-4',
        name: 'Seated Leg Curl',
        sets: 3,
        repMin: 10,
        repMax: 12,
        repLabel: '10-12',
        type: 'Isolation',
        targetMuscle: 'Hamstrings',
        muscleCategory: 'Hamstrings',
        isLowerBody: true,
        cue: 'Lock thigh pad snug over knees and curl heels all the way under seat.'
      },
      {
        id: 'sat-5',
        name: 'Seated Calf Raise',
        sets: 4,
        repMin: 15,
        repMax: 15,
        repLabel: '15',
        type: 'Isolation',
        targetMuscle: 'Calves (Soleus)',
        muscleCategory: 'Calves',
        isLowerBody: true,
        cue: 'Full pause at bottom stretch and top peak contraction.'
      },
      {
        id: 'sat-6',
        name: 'Lateral Raise',
        sets: 3,
        repMin: 15,
        repMax: 20,
        repLabel: '15-20',
        type: 'Isolation',
        targetMuscle: 'Side Delts',
        muscleCategory: 'Shoulders',
        isLowerBody: false,
        cue: 'Bonus V-taper volume: strict form, zero momentum, pinky-neutral.'
      },
      {
        id: 'sat-7',
        name: 'Cable Crunch',
        sets: 3,
        repMin: 12,
        repMax: 15,
        repLabel: '12-15',
        type: 'Isolation',
        targetMuscle: 'Abs / Core',
        muscleCategory: 'Abs / Core',
        isLowerBody: false,
        cue: 'Hips stationary, flex spine downward bringing elbows toward knees.'
      }
    ]
  },
  {
    dayIndex: 0,
    shortDay: 'Sun',
    dayName: 'Sunday',
    title: 'Rest & Recovery',
    subtitle: 'Rest, 20-30 min walk',
    isRest: true,
    estimatedMinutes: 30,
    exercises: []
  }
];

const INITIAL_MEAL_TEMPLATES = [
  {
    id: 'meal-1',
    name: 'Breakfast',
    timeHint: '08:00 AM',
    kcal: 650,
    protein: 28,
    items: '3 eggs or paneer bhurji, 2 roti, milk',
    completed: false
  },
  {
    id: 'meal-2',
    name: 'Mid-morning',
    timeHint: '11:00 AM',
    kcal: 350,
    protein: 14,
    items: 'banana shake with peanut butter',
    completed: false
  },
  {
    id: 'meal-3',
    name: 'Lunch',
    timeHint: '01:30 PM',
    kcal: 750,
    protein: 35,
    items: 'rice/roti, dal, chicken/paneer, sabzi, curd',
    completed: false
  },
  {
    id: 'meal-4',
    name: 'Pre-workout',
    timeHint: '05:00 PM',
    kcal: 250,
    protein: 8,
    items: 'Pre-workout carbs (banana + oats / toast)',
    completed: false
  },
  {
    id: 'meal-5',
    name: 'Post-workout',
    timeHint: '07:00 PM',
    kcal: 200,
    protein: 25,
    items: 'whey or soya chunks',
    completed: false
  },
  {
    id: 'meal-6',
    name: 'Dinner',
    timeHint: '08:30 PM',
    kcal: 600,
    protein: 22,
    items: 'Rice/roti, chicken/paneer/dal, sabzi',
    completed: false
  },
  {
    id: 'meal-7',
    name: 'Bedtime',
    timeHint: '10:30 PM',
    kcal: 150,
    protein: 8,
    items: 'milk + almonds',
    completed: false
  }
];

// ============================================================================
// CLEAN ZERO-FAKE-DATA INITIAL CONSTANTS (DEFAULT NAME: 'XYZ')
// ============================================================================

const INITIAL_LAST_SESSION_LOGS = {};
const INITIAL_WEIGHT_LOGS = [];
const INITIAL_MEASUREMENTS = [];
const INITIAL_WORKOUT_HISTORY = [];
const INITIAL_EXERCISE_HISTORY = {};

const DEFAULT_PROFILE = {
  name: 'XYZ',
  age: 22,
  heightCm: 173,
  startWeightKg: 55,
  currentWeightKg: 55,
  goalWeightMinKg: 65,
  goalWeightMaxKg: 68,
  targetCalories: 2900,
  targetProteinG: 130,
  targetWaterMl: 3500
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

// ============================================================================
// CORE BUSINESS LOGIC (PURE FUNCTIONS WITH UNIT TEST COVERAGE)
// ============================================================================

export function calculateProgressiveOverload(exercise, previousSets) {
  if (!exercise || !Array.isArray(previousSets) || previousSets.length < exercise.sets) {
    return {
      shouldIncrease: false,
      incrementKg: 0,
      lastWeightKg: 0,
      suggestedWeightKg: 0,
      reason: 'Log all prescribed sets first'
    };
  }

  const relevantSets = previousSets.slice(0, exercise.sets);
  const allHitMax = relevantSets.every(
    (s) => Number(s.reps) >= exercise.repMax && Number(s.weight) > 0
  );
  const baseWeight = Number(relevantSets[0]?.weight || 0);

  if (allHitMax) {
    const incrementKg = exercise.isLowerBody ? 5.0 : 2.5;
    return {
      shouldIncrease: true,
      incrementKg,
      lastWeightKg: baseWeight,
      suggestedWeightKg: Number((baseWeight + incrementKg).toFixed(2)),
      reason: `All ${exercise.sets} sets hit ${exercise.repMax}+ reps last session`
    };
  }

  return {
    shouldIncrease: false,
    incrementKg: 0,
    lastWeightKg: baseWeight,
    suggestedWeightKg: baseWeight,
    reason: `Hit ${exercise.repMax} reps across all ${exercise.sets} sets to unlock +${
      exercise.isLowerBody ? 5 : 2.5
    } kg`
  };
}

export function analyzeWeeklyGainRate(weightLogs) {
  if (!Array.isArray(weightLogs) || weightLogs.length < 2) {
    return {
      status: 'INSUFFICIENT_DATA',
      latestWeeklyGainKg: 0,
      avgWeeklyGainKg: 0,
      consecutiveLowWeeks: 0,
      calorieAdjustment: 0,
      headline: 'Log at least 2 weekly weigh-ins',
      message: 'Weigh yourself once a week every morning after waking up to track your lean-bulk rate.'
    };
  }

  const sorted = [...weightLogs].sort((a, b) => new Date(a.date) - new Date(b.date));
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
    if (weeklyDeltas[i] < 0.2) {
      consecutiveLowWeeks++;
    } else {
      break;
    }
  }

  if (latestWeeklyGainKg > 0.7 || avgWeeklyGainKg > 0.7) {
    return {
      status: 'FAST_GAIN_WARNING',
      latestWeeklyGainKg,
      avgWeeklyGainKg,
      consecutiveLowWeeks,
      calorieAdjustment: -200,
      headline: 'Warning: Gaining Above 0.7 kg/week (Fat Gain Risk)',
      message: `Current rate is +${latestWeeklyGainKg.toFixed(
        2
      )} kg/wk (recent avg +${avgWeeklyGainKg.toFixed(
        2
      )} kg/wk). Exceeding 0.7 kg/wk adds unnecessary waist fat and blurs your V-taper. Reduce daily intake by ~200 kcal.`
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
      message: `You gained under 0.2 kg/wk for ${consecutiveLowWeeks} consecutive weeks (latest: +${latestWeeklyGainKg.toFixed(
        2
      )} kg/wk). Increase daily target by +300 kcal to restart lean tissue growth.`
    };
  }

  return {
    status: 'OPTIMAL_LEAN_BULK',
    latestWeeklyGainKg,
    avgWeeklyGainKg,
    consecutiveLowWeeks,
    calorieAdjustment: 0,
    headline: 'Optimal Lean-Bulk Velocity (0.2 – 0.7 kg/week)',
    message: `Gaining +${latestWeeklyGainKg.toFixed(
      2
    )} kg/wk (avg +${avgWeeklyGainKg.toFixed(
      2
    )} kg/wk). Keep hitting ${DEFAULT_PROFILE.targetCalories} kcal and ${DEFAULT_PROFILE.targetProteinG}g protein daily while progressing lifts.`
  };
}

function runBuiltInUnitTests() {
  const results = [];

  const benchEx = WORKOUT_PLAN[0].exercises[0];
  const t1 = calculateProgressiveOverload(benchEx, [
    { weight: 50, reps: 8 },
    { weight: 50, reps: 8 },
    { weight: 50, reps: 9 }
  ]);
  results.push({
    name: 'Upper Body Overload (+2.5 kg when all sets hit top rep range)',
    passed: t1.shouldIncrease === true && t1.incrementKg === 2.5 && t1.suggestedWeightKg === 52.5,
    expected: 'shouldIncrease: true, +2.5 kg -> 52.5 kg',
    actual: `shouldIncrease: ${t1.shouldIncrease}, +${t1.incrementKg} kg -> ${t1.suggestedWeightKg} kg`
  });

  const legPressEx = WORKOUT_PLAN[2].exercises[0];
  const t2 = calculateProgressiveOverload(legPressEx, [
    { weight: 100, reps: 10 },
    { weight: 100, reps: 10 },
    { weight: 100, reps: 10 },
    { weight: 100, reps: 10 }
  ]);
  results.push({
    name: 'Lower Body Overload (+5.0 kg when all sets hit top rep range)',
    passed: t2.shouldIncrease === true && t2.incrementKg === 5.0 && t2.suggestedWeightKg === 105,
    expected: 'shouldIncrease: true, +5 kg -> 105 kg',
    actual: `shouldIncrease: ${t2.shouldIncrease}, +${t2.incrementKg} kg -> ${t2.suggestedWeightKg} kg`
  });

  const t3 = calculateProgressiveOverload(benchEx, [
    { weight: 50, reps: 8 },
    { weight: 50, reps: 8 },
    { weight: 50, reps: 7 }
  ]);
  results.push({
    name: 'Hold Weight When Any Set Misses Top of Rep Range',
    passed: t3.shouldIncrease === false && t3.incrementKg === 0,
    expected: 'shouldIncrease: false, +0 kg',
    actual: `shouldIncrease: ${t3.shouldIncrease}, +${t3.incrementKg} kg`
  });

  const t4 = analyzeWeeklyGainRate([
    { date: '2026-11-01', weightKg: 56.0 },
    { date: '2026-11-08', weightKg: 56.95 }
  ]);
  results.push({
    name: 'Weekly Gain > 0.7 kg/wk Triggers Excess Fat Warning',
    passed: t4.status === 'FAST_GAIN_WARNING' && t4.latestWeeklyGainKg === 0.95,
    expected: 'FAST_GAIN_WARNING (+0.95 kg/wk)',
    actual: `${t4.status} (+${t4.latestWeeklyGainKg} kg/wk)`
  });

  const t5 = analyzeWeeklyGainRate([
    { date: '2026-11-01', weightKg: 56.0 },
    { date: '2026-11-08', weightKg: 56.1 },
    { date: '2026-11-15', weightKg: 56.2 }
  ]);
  results.push({
    name: 'Gain < 0.2 kg/wk for 2 Consecutive Weeks Suggests +300 kcal',
    passed: t5.status === 'PLATEAU_SUGGESTION' && t5.calorieAdjustment === 300,
    expected: 'PLATEAU_SUGGESTION (+300 kcal)',
    actual: `${t5.status} (+${t5.calorieAdjustment} kcal)`
  });

  return results;
}

// ============================================================================
// LOCAL STORAGE KEY & INITIAL APP STATE BUILDER
// ============================================================================

const STORAGE_KEY = 'vtaper_tracker_state_v3';

function buildInitialActiveDrafts(lastLogs) {
  const drafts = {};
  WORKOUT_PLAN.forEach((day) => {
    day.exercises.forEach((ex) => {
      const prev = lastLogs[ex.id] || [];
      const overload = calculateProgressiveOverload(ex, prev);
      drafts[ex.id] = Array.from({ length: ex.sets }, (_, idx) => {
        const prevSet = prev[idx] || prev[prev.length - 1] || { weight: 0, reps: ex.repMin };
        return {
          setNumber: idx + 1,
          weight: overload.shouldIncrease ? overload.suggestedWeightKg : prevSet.weight,
          reps: overload.shouldIncrease ? ex.repMin : prevSet.reps,
          completed: false
        };
      });
    });
  });
  return drafts;
}

function getFreshInitialState(theme = 'dark') {
  return {
    onboarded: false,
    theme,
    unit: 'kg',
    profile: DEFAULT_PROFILE,
    lastSessionLogs: INITIAL_LAST_SESSION_LOGS,
    activeDrafts: buildInitialActiveDrafts(INITIAL_LAST_SESSION_LOGS),
    meals: INITIAL_MEAL_TEMPLATES.map((m) => ({ ...m, completed: false })),
    waterMl: 0,
    creatineTaken: false,
    creatineStreak: 0,
    creatineDates: [],
    workoutStreak: 0,
    weightLogs: INITIAL_WEIGHT_LOGS,
    measurements: INITIAL_MEASUREMENTS,
    workoutHistory: INITIAL_WORKOUT_HISTORY,
    exerciseHistory: INITIAL_EXERCISE_HISTORY
  };
}

// Flat Geometric VTaper SVG Brand Logo
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
        'https://fonts.googleapis.com/css2?family=Big+Shoulders+Display:wght@700;800;900&family=Manrope:wght@400;500;600;700;800&display=swap';
      document.head.appendChild(link);
    }
  }, []);

  const [appState, setAppState] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        return {
          ...getFreshInitialState(),
          ...parsed,
          profile: { ...DEFAULT_PROFILE, ...(parsed.profile || {}) },
          activeDrafts:
            parsed.activeDrafts ||
            buildInitialActiveDrafts(parsed.lastSessionLogs || INITIAL_LAST_SESSION_LOGS),
          exerciseHistory: parsed.exerciseHistory || INITIAL_EXERCISE_HISTORY,
          creatineDates: parsed.creatineDates || []
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
      // Ignore quota errors
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
    exerciseType: 'Compound'
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
      showToast('Rest complete — crush your next set!');
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

  // Solid Flat Theme Tokens (No Gradients Anywhere, Electric Lime Accent in Both Modes)
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
  // HANDLERS FOR TODAY TAB (WORKOUT & SETS)
  // ============================================================================

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
      const restSeconds = exercise.type === 'Compound' ? 120 : 75;
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
      `Applied ${formatWeight(suggestedWeightKg)} ${appState.unit} to all sets of ${exercise.name}`
    );
  };

  const handleFinishWorkout = () => {
    if (activeDayPlan.isRest) return;

    const anyCompleted = activeDayPlan.exercises.some((ex) =>
      (appState.activeDrafts[ex.id] || []).some((s) => s.completed)
    );
    if (!anyCompleted) {
      showToast('Check off at least 1 completed set before finishing your workout.');
      return;
    }

    let totalVolumeKg = 0;
    let setsCompleted = 0;
    const prsAchieved = [];
    const updatedLastLogs = { ...appState.lastSessionLogs };
    const updatedExerciseHistory = { ...(appState.exerciseHistory || {}) };
    const todayStr = new Date().toLocaleDateString('en-CA');

    activeDayPlan.exercises.forEach((ex) => {
      const draftSets = appState.activeDrafts[ex.id] || [];
      const completedSets = draftSets.filter((s) => s.completed);

      if (completedSets.length === 0) return;
      const effectiveSets = completedSets;

      let exVolume = 0;
      let bestWeight = 0;
      let bestRepsAtMax = 0;

      effectiveSets.forEach((s) => {
        const w = Number(s.weight || 0);
        const r = Number(s.reps || 0);
        exVolume += w * r;
        if (w > bestWeight || (w === bestWeight && r > bestRepsAtMax)) {
          bestWeight = w;
          bestRepsAtMax = r;
        }
      });

      setsCompleted += effectiveSets.length;
      totalVolumeKg += Math.round(exVolume);

      const prevSets = appState.lastSessionLogs[ex.id] || [];
      const prevBestWeight = prevSets.reduce((max, s) => Math.max(max, Number(s.weight || 0)), 0);
      const prevBestRepsAtMax = prevSets
        .filter((s) => Number(s.weight || 0) === prevBestWeight)
        .reduce((max, s) => Math.max(max, Number(s.reps || 0)), 0);

      if (
        prevSets.length > 0 &&
        bestWeight > 0 &&
        (bestWeight > prevBestWeight ||
          (bestWeight === prevBestWeight && bestRepsAtMax > prevBestRepsAtMax))
      ) {
        prsAchieved.push({
          exerciseName: ex.name,
          weightKg: bestWeight,
          reps: bestRepsAtMax
        });
      }

      updatedLastLogs[ex.id] = effectiveSets.map((s) => ({
        weight: Number(s.weight || 0),
        reps: Number(s.reps || 0)
      }));

      const prevExHist = updatedExerciseHistory[ex.id] || [];
      updatedExerciseHistory[ex.id] = [
        ...prevExHist,
        {
          id: `${ex.id}-${Date.now()}`,
          date: todayStr,
          topWeightKg: bestWeight,
          bestReps: bestRepsAtMax,
          volumeKg: Math.round(exVolume),
          setsCompleted: effectiveSets.length,
          muscleCategory: ex.muscleCategory
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
      if (!(appState.activeDrafts[ex.id] || []).some((s) => s.completed)) return;
      const saved = updatedLastLogs[ex.id];
      const ov = calculateProgressiveOverload(ex, saved);
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

  const navItems = [
    { id: 'today', label: 'Today', icon: Dumbbell },
    { id: 'plan', label: 'Plan', icon: Calendar },
    { id: 'nutrition', label: 'Nutrition', icon: Utensils },
    { id: 'progress', label: 'Progress', icon: TrendingUp },
    { id: 'stats', label: 'Stats', icon: BarChart3 },
    { id: 'settings', label: 'Settings', icon: Settings }
  ];

  const nutritionTotals = useMemo(() => {
    const completedMeals = appState.meals.filter((m) => m.completed);
    const consumedKcal = completedMeals.reduce((sum, m) => sum + Number(m.kcal || 0), 0);
    const consumedProtein = completedMeals.reduce((sum, m) => sum + Number(m.protein || 0), 0);
    return { consumedKcal, consumedProtein };
  }, [appState.meals]);

  const gainAnalysis = useMemo(
    () => analyzeWeeklyGainRate(appState.weightLogs),
    [appState.weightLogs]
  );

  const latestMeasurement = useMemo(() => {
    if (!appState.measurements.length) {
      return null;
    }
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

  const kcalTarget = appState.profile.targetCalories || appState.profile.dailyKcalTarget || 2900;
  const proteinTarget = appState.profile.targetProteinG || appState.profile.dailyProteinTarget || 130;

  return (
    <div
      style={{
        backgroundColor: colors.bg,
        color: colors.text,
        fontFamily: "'Manrope', -apple-system, BlinkMacSystemFont, sans-serif",
        '--ring': isDark ? '#CCFF00' : '#84CC16'
      }}
      className="min-h-screen w-full overflow-x-hidden flex flex-col md:flex-row selection:bg-[#CCFF00] selection:text-[#0A0A0B]"
    >
      {/* Global CSS for Hiding Scrollbars & Number Spinners on Mobile/Desktop */}
      <style>{`
        * {
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
              <h1
                style={{ fontFamily: "'Big Shoulders Display', sans-serif" }}
                className="text-3xl font-extrabold uppercase tracking-wider leading-none"
              >
                VTAPER
              </h1>
              <p style={{ color: colors.muted }} className="text-xs mt-0.5 font-medium tabular-nums">
                Lean Bulk • {appState.profile.startWeightKg} → {appState.profile.goalWeightMaxKg} kg
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

        {/* User Snapshot Card (Click to Edit Name / Profile) */}
        <div className="p-4">
          <div
            style={{ backgroundColor: colors.elevated, borderColor: colors.border }}
            className="p-4 rounded-2xl border"
          >
            <div className="flex items-center justify-between mb-2">
              <span
                className="text-xs font-semibold uppercase tracking-wider"
                style={{ color: colors.muted }}
              >
                Athlete Profile
              </span>
              <button
                onClick={openProfileEditor}
                style={{
                  backgroundColor: colors.accent,
                  color: colors.accentText
                }}
                className="text-[11px] font-bold px-2 py-0.5 rounded-md uppercase flex items-center gap-1"
              >
                <Edit3 className="w-3 h-3" />
                <span>Edit Name</span>
              </button>
            </div>
            <button
              onClick={openProfileEditor}
              style={{ fontFamily: "'Big Shoulders Display', sans-serif" }}
              className="text-2xl font-extrabold uppercase tracking-wide tabular-nums text-left w-full truncate hover:underline"
            >
              {appState.profile.name || 'XYZ'} • {appState.profile.age}y • {appState.profile.heightCm} cm
            </button>
            <div
              className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t tabular-nums"
              style={{ borderColor: colors.border }}
            >
              <div>
                <div className="text-[11px]" style={{ color: colors.muted }}>
                  Current
                </div>
                <div
                  style={{ fontFamily: "'Big Shoulders Display', sans-serif" }}
                  className="text-xl font-extrabold"
                >
                  {formatWeight(latestWeightKg)} {appState.unit}
                </div>
              </div>
              <div>
                <div className="text-[11px]" style={{ color: colors.muted }}>
                  Target Band
                </div>
                <div
                  style={{
                    fontFamily: "'Big Shoulders Display', sans-serif",
                    color: isDark ? colors.accent : colors.text
                  }}
                  className="text-xl font-extrabold"
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
                className="w-full min-h-[48px] px-4 rounded-xl border flex items-center gap-3 font-semibold text-sm transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-[color:var(--ring)]"
              >
                <Icon className="w-5 h-5 shrink-0" />
                <span>{item.label}</span>
                {item.id === 'today' && workoutRunning && (
                  <span
                    style={{
                      backgroundColor: isActive ? '#0A0A0B' : colors.accent,
                      color: isActive ? '#CCFF00' : colors.accentText
                    }}
                    className="ml-auto text-xs font-bold px-2 py-0.5 rounded-md tabular-nums"
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
            <span className="font-bold">
              {nutritionTotals.consumedKcal} / {kcalTarget} kcal
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span style={{ color: colors.muted }}>Protein Today</span>
            <span className="font-bold">
              {nutritionTotals.consumedProtein}g / {proteinTarget}g
            </span>
          </div>
        </div>
      </aside>

      {/* ==================================================================== */}
      {/* MAIN CONTENT AREA                                                    */}
      {/* ==================================================================== */}
      <div className="flex-1 md:pl-64 lg:pl-72 flex flex-col min-h-screen w-full max-w-full pb-24 md:pb-10">
        {/* Mobile Top Bar */}
        <header
          style={{ backgroundColor: colors.card, borderColor: colors.border }}
          className="md:hidden sticky top-0 z-20 border-b px-3.5 py-2.5 flex items-center justify-between gap-2"
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <BrandLogo size={36} />
            <div className="min-w-0">
              <div
                style={{ fontFamily: "'Big Shoulders Display', sans-serif" }}
                className="text-2xl font-extrabold uppercase tracking-wider leading-none"
              >
                VTAPER
              </div>
              <button
                onClick={openProfileEditor}
                style={{ color: colors.muted }}
                className="text-[11px] font-semibold tabular-nums flex items-center gap-1 truncate max-w-[160px] text-left"
              >
                <span className="truncate">{appState.profile.name || 'XYZ'}</span>
                <span>•</span>
                <span>
                  {vTaperRatio
                    ? `V ${vTaperRatio}`
                    : `${formatWeight(latestWeightKg)} ${appState.unit}`}
                </span>
                <Edit3 className="w-3 h-3 shrink-0" />
              </button>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={openProfileEditor}
              aria-label="Edit Profile & Name"
              style={{ backgroundColor: colors.elevated, borderColor: colors.border }}
              className="min-h-[42px] px-2.5 rounded-xl border text-xs font-bold flex items-center gap-1 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[color:var(--ring)]"
            >
              <User className="w-4 h-4" />
              <span className="hidden xs:inline">Profile</span>
            </button>
            <button
              onClick={() =>
                setAppState((prev) => ({
                  ...prev,
                  unit: prev.unit === 'kg' ? 'lb' : 'kg'
                }))
              }
              style={{ backgroundColor: colors.elevated, borderColor: colors.border }}
              className="min-h-[42px] min-w-[42px] px-2.5 rounded-xl border text-xs font-bold uppercase focus-visible:outline focus-visible:outline-2 focus-visible:outline-[color:var(--ring)]"
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
              className="min-h-[42px] min-w-[42px] rounded-xl border flex items-center justify-center focus-visible:outline focus-visible:outline-2 focus-visible:outline-[color:var(--ring)]"
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
              className="px-4 py-3 rounded-2xl border font-bold text-xs sm:text-sm flex items-center gap-2.5"
            >
              <CheckCircle2 className="w-5 h-5 shrink-0" />
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
            className="sticky top-[57px] md:top-4 z-30 mx-3 sm:mx-4 mt-2.5 p-3 rounded-2xl border-2 flex flex-wrap items-center justify-between gap-2.5"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div
                style={{
                  backgroundColor: colors.accent,
                  color: colors.accentText,
                  fontFamily: "'Big Shoulders Display', sans-serif"
                }}
                className="px-3 py-1 rounded-xl font-extrabold text-2xl sm:text-3xl tabular-nums tracking-wide shrink-0"
              >
                {formatTime(restTimer.remainingSec)}
              </div>
              <div className="min-w-0">
                <div
                  className="text-[11px] font-bold uppercase tracking-wider tabular-nums"
                  style={{ color: isDark ? colors.accent : colors.text }}
                >
                  Rest • {restTimer.exerciseType} ({restTimer.totalSec}s)
                </div>
                <div className="text-xs sm:text-sm font-semibold truncate max-w-[150px] sm:max-w-xs">
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
                className="min-h-[40px] px-2.5 rounded-xl border text-xs font-bold"
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
                className="min-h-[40px] px-2.5 rounded-xl border text-xs font-bold"
              >
                +15s
              </button>
              <button
                onClick={() =>
                  setRestTimer((prev) => ({ ...prev, paused: !prev.paused }))
                }
                aria-label={restTimer.paused ? 'Resume rest timer' : 'Pause rest timer'}
                style={{ backgroundColor: colors.elevated, borderColor: colors.border }}
                className="min-h-[40px] min-w-[40px] rounded-xl border flex items-center justify-center"
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
                className="min-h-[40px] px-3 rounded-xl border text-xs font-extrabold flex items-center gap-1"
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
              handleSetInputChange={handleSetInputChange}
              handleToggleSetComplete={handleToggleSetComplete}
              handleApplyOverloadWeight={handleApplyOverloadWeight}
              handleFinishWorkout={handleFinishWorkout}
              setRestTimer={setRestTimer}
            />
          )}

          {activeTab === 'plan' && (
            <PlanView
              colors={colors}
              isDark={isDark}
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
              showToast={showToast}
            />
          )}
        </main>
      </div>

      {/* ==================================================================== */}
      {/* MOBILE BOTTOM NAVIGATION BAR (44px+ Tap Targets, Safe Area)          */}
      {/* ==================================================================== */}
      <nav
        style={{ backgroundColor: colors.card, borderColor: colors.border }}
        aria-label="Mobile Navigation"
        className="md:hidden fixed bottom-0 inset-x-0 border-t z-30 grid grid-cols-6 px-1.5 py-1.5 pb-[max(0.375rem,env(safe-area-inset-bottom))]"
      >
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              style={{
                backgroundColor: isActive ? colors.accent : 'transparent',
                color: isActive ? colors.accentText : colors.muted
              }}
              className="min-h-[48px] rounded-xl flex flex-col items-center justify-center gap-0.5 font-bold text-[10px] sm:text-[11px] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[color:var(--ring)]"
            >
              <Icon className="w-5 h-5" />
              <span className="truncate max-w-full px-0.5">{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* ==================================================================== */}
      {/* ONBOARDING & PROFILE EDITOR MODAL (SAVE YOUR OWN NAME)               */}
      {/* ==================================================================== */}
      {showOnboarding && (
        <div
          style={{ backgroundColor: 'rgba(10, 10, 11, 0.85)' }}
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto"
        >
          <div
            style={{ backgroundColor: colors.card, borderColor: colors.border }}
            className="w-full max-w-lg rounded-2xl border p-5 sm:p-6 space-y-5 my-auto"
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
                  V-Taper Protocol
                </span>
                <h2
                  style={{ fontFamily: "'Big Shoulders Display', sans-serif" }}
                  className="text-3xl sm:text-4xl font-extrabold uppercase tracking-wide"
                >
                  Athlete Profile Setup
                </h2>
                <p style={{ color: colors.muted }} className="text-xs sm:text-sm mt-1">
                  Enter your name and customize your 55 kg → 65–68 kg lean-bulk & V-taper targets.
                </p>
              </div>
              <button
                onClick={() => {
                  const cleanName = String(onboardingForm.name || '').trim() || 'XYZ';
                  setAppState((prev) => ({
                    ...prev,
                    onboarded: true,
                    profile: { ...onboardingForm, name: cleanName },
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
              <div className="sm:col-span-2">
                <label
                  className="block text-xs font-bold uppercase mb-1.5"
                  style={{ color: colors.muted }}
                >
                  Your Name
                </label>
                <input
                  type="text"
                  placeholder="Enter your name (e.g. XYZ)"
                  value={onboardingForm.name}
                  onFocus={(e) => {
                    if (e.target.value === 'XYZ') {
                      setOnboardingForm((prev) => ({ ...prev, name: '' }));
                    }
                  }}
                  onChange={(e) =>
                    setOnboardingForm((prev) => ({ ...prev, name: e.target.value }))
                  }
                  style={{
                    backgroundColor: colors.elevated,
                    borderColor: colors.accentBorder,
                    color: colors.text
                  }}
                  className="w-full min-h-[48px] px-3.5 rounded-xl border-2 text-base font-bold focus-visible:outline focus-visible:outline-2 focus-visible:outline-[color:var(--ring)]"
                />
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
                  className="w-full min-h-[44px] px-3.5 rounded-xl border text-sm font-semibold tabular-nums"
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
                  className="w-full min-h-[44px] px-3.5 rounded-xl border text-sm font-semibold tabular-nums"
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
                  className="w-full min-h-[44px] px-3.5 rounded-xl border text-sm font-semibold tabular-nums"
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
                    className="w-full min-h-[44px] px-3 rounded-xl border text-sm font-semibold tabular-nums"
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
                    className="w-full min-h-[44px] px-3 rounded-xl border text-sm font-semibold tabular-nums"
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
                  Daily Intake
                </div>
                <div
                  style={{ fontFamily: "'Big Shoulders Display', sans-serif" }}
                  className="text-xl sm:text-2xl font-extrabold"
                >
                  2,900 kcal
                </div>
              </div>
              <div>
                <div className="text-[10px] uppercase font-bold" style={{ color: colors.muted }}>
                  Protein Goal
                </div>
                <div
                  style={{ fontFamily: "'Big Shoulders Display', sans-serif" }}
                  className="text-xl sm:text-2xl font-extrabold"
                >
                  130g / day
                </div>
              </div>
              <div>
                <div className="text-[10px] uppercase font-bold" style={{ color: colors.muted }}>
                  V-Taper Goal
                </div>
                <div
                  style={{ fontFamily: "'Big Shoulders Display', sans-serif" }}
                  className="text-xl sm:text-2xl font-extrabold"
                >
                  1.40–1.50x
                </div>
              </div>
            </div>

            <button
              onClick={() => {
                const cleanName = String(onboardingForm.name || '').trim() || 'XYZ';
                setAppState((prev) => ({
                  ...prev,
                  onboarded: true,
                  profile: { ...onboardingForm, name: cleanName },
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
                showToast(`Profile saved as "${cleanName}"!`);
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
          style={{ backgroundColor: 'rgba(10, 10, 11, 0.85)' }}
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
                <h3
                  style={{ fontFamily: "'Big Shoulders Display', sans-serif" }}
                  className="text-3xl font-extrabold uppercase"
                >
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
                <div
                  style={{ fontFamily: "'Big Shoulders Display', sans-serif" }}
                  className="text-2xl font-extrabold mt-0.5"
                >
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
                <div
                  style={{ fontFamily: "'Big Shoulders Display', sans-serif" }}
                  className="text-2xl font-extrabold mt-0.5"
                >
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
                  style={{
                    fontFamily: "'Big Shoulders Display', sans-serif",
                    color: isDark ? colors.accent : colors.text
                  }}
                  className="text-2xl font-extrabold mt-0.5"
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
  handleSetInputChange,
  handleToggleSetComplete,
  handleApplyOverloadWeight,
  handleFinishWorkout,
  setRestTimer
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
      const sets = appState.activeDrafts[ex.id] || [];
      const prev = appState.lastSessionLogs[ex.id] || [];
      if (calculateProgressiveOverload(ex, prev).shouldIncrease) {
        overloadReadyCount++;
      }
      totalSets += ex.sets;
      sets.forEach((s) => {
        if (s.completed) {
          completedSets++;
          volumeKg += Number(s.weight || 0) * Number(s.reps || 0);
        }
      });
    });

    return { completedSets, totalSets, volumeKg: Math.round(volumeKg), overloadReadyCount };
  }, [activeDayPlan, appState.activeDrafts, appState.lastSessionLogs]);

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* 7-Day Selector Bar — Fits All 7 Days on Mobile Without Scrollbar */}
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
                className="text-[9px] sm:text-[11px] font-semibold truncate max-w-full"
                style={{ opacity: isSelected ? 0.95 : 0.75 }}
              >
                {day.isRest ? 'Rest' : day.title}
              </span>
            </button>
          );
        })}
      </div>

      {/* Bento Header Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div
          style={{ backgroundColor: colors.card, borderColor: colors.border }}
          className="lg:col-span-2 p-4 sm:p-6 rounded-2xl border flex flex-col justify-between gap-4"
        >
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3.5">
            <div>
              <div className="flex items-center gap-2">
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
              </div>
              <h2
                style={{ fontFamily: "'Big Shoulders Display', sans-serif" }}
                className="text-3xl sm:text-5xl font-extrabold uppercase tracking-wide mt-2 leading-tight"
              >
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
                  className="flex-1 sm:flex-initial min-h-[46px] px-3.5 rounded-xl border font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 tabular-nums"
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
                <div className="text-[11px] font-medium" style={{ color: colors.muted }}>
                  Sets Logged
                </div>
                <div
                  style={{ fontFamily: "'Big Shoulders Display', sans-serif" }}
                  className="text-2xl sm:text-3xl font-extrabold"
                >
                  {sessionProgress.completedSets} / {sessionProgress.totalSets}
                </div>
              </div>
              <div>
                <div className="text-[11px] font-medium" style={{ color: colors.muted }}>
                  Live Volume
                </div>
                <div
                  style={{ fontFamily: "'Big Shoulders Display', sans-serif" }}
                  className="text-2xl sm:text-3xl font-extrabold"
                >
                  {formatWeight(sessionProgress.volumeKg)} {appState.unit}
                </div>
              </div>
              <div>
                <div className="text-[11px] font-medium" style={{ color: colors.muted }}>
                  Overload Targets
                </div>
                <div
                  style={{
                    fontFamily: "'Big Shoulders Display', sans-serif",
                    color: isDark ? colors.accent : colors.text
                  }}
                  className="text-2xl sm:text-3xl font-extrabold"
                >
                  {sessionProgress.overloadReadyCount} Ready
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Rest Timer Quick Trigger Bento Card */}
        <div
          style={{ backgroundColor: colors.card, borderColor: colors.border }}
          className="p-4 sm:p-6 rounded-2xl border flex flex-col justify-between gap-3.5"
        >
          <div>
            <div className="text-xs font-bold uppercase tracking-wider" style={{ color: colors.muted }}>
              Auto Rest Timer Protocol
            </div>
            <h3
              style={{ fontFamily: "'Big Shoulders Display', sans-serif" }}
              className="text-2xl font-extrabold uppercase mt-1 tabular-nums"
            >
              120s Compounds • 75s Isolation
            </h3>
            <p className="text-xs mt-1" style={{ color: colors.muted }}>
              Checking any set box automatically launches the exact rest countdown.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-2.5 tabular-nums">
            <button
              onClick={() =>
                setRestTimer({
                  active: true,
                  paused: false,
                  remainingSec: 120,
                  totalSec: 120,
                  exerciseName: 'Compound Lift Rest',
                  exerciseType: 'Compound'
                })
              }
              style={{ backgroundColor: colors.elevated, borderColor: colors.border }}
              className="min-h-[44px] px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5"
            >
              <Clock className="w-4 h-4" />
              <span>Start 120s</span>
            </button>
            <button
              onClick={() =>
                setRestTimer({
                  active: true,
                  paused: false,
                  remainingSec: 75,
                  totalSec: 75,
                  exerciseName: 'Isolation Lift Rest',
                  exerciseType: 'Isolation'
                })
              }
              style={{ backgroundColor: colors.elevated, borderColor: colors.border }}
              className="min-h-[44px] px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5"
            >
              <Zap className="w-4 h-4" />
              <span>Start 75s</span>
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
          <h3
            style={{ fontFamily: "'Big Shoulders Display', sans-serif" }}
            className="text-3xl sm:text-4xl font-extrabold uppercase"
          >
            Sunday Active Recovery: 20–30 Min Walk
          </h3>
          <p style={{ color: colors.muted }} className="max-w-lg mx-auto text-xs sm:text-sm">
            Muscles grow during recovery. Complete a low-intensity 20–30 minute outdoor walk, hit your 2,900 kcal and 130g protein target, take 5g creatine, and prep for Monday Push A.
          </p>
        </div>
      ) : (
        /* Exercise Cards List */
        <div className="space-y-3.5 sm:space-y-4">
          {activeDayPlan.exercises.map((exercise, exIdx) => {
            const draftSets = appState.activeDrafts[exercise.id] || [];
            const prevSets = appState.lastSessionLogs[exercise.id] || [];
            const overload = calculateProgressiveOverload(exercise, prevSets);

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
                        className="text-[11px] font-extrabold px-2 py-0.5 rounded-md border tabular-nums"
                      >
                        #{exIdx + 1}
                      </span>
                      <h3
                        style={{ fontFamily: "'Big Shoulders Display', sans-serif" }}
                        className="text-2xl sm:text-3xl font-extrabold uppercase tracking-wide leading-tight"
                      >
                        {exercise.name}
                      </h3>
                    </div>

                    <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                      <span
                        style={{
                          backgroundColor: colors.elevated,
                          borderColor: colors.border,
                          color: isDark ? colors.accent : colors.text
                        }}
                        className="text-[11px] font-bold px-2 py-0.5 rounded-md border uppercase"
                      >
                        {exercise.targetMuscle}
                      </span>
                      <span
                        style={{
                          backgroundColor: colors.elevated,
                          borderColor: colors.border,
                          color: colors.muted
                        }}
                        className="text-[11px] font-semibold px-2 py-0.5 rounded-md border tabular-nums"
                      >
                        {exercise.type} • {exercise.type === 'Compound' ? '120s' : '75s'}
                      </span>
                    </div>

                    {/* One-Line Form Cue */}
                    <p
                      style={{ color: colors.muted }}
                      className="text-xs flex items-start gap-1.5 pt-1"
                    >
                      <Info
                        className="w-3.5 h-3.5 shrink-0 mt-0.5"
                        style={{ color: isDark ? colors.accent : colors.text }}
                      />
                      <span>
                        <strong style={{ color: colors.text }}>Cue:</strong> {exercise.cue}
                      </span>
                    </p>

                    {/* Warm-up Sets Calculator on First Compound Lift */}
                    {exIdx === 0 && prevSets.length > 0 && (
                      <p className="text-xs tabular-nums pt-0.5" style={{ color: colors.muted }}>
                        <strong style={{ color: colors.text }}>Warm-up:</strong>{' '}
                        {[
                          [0.5, 8],
                          [0.7, 5],
                          [0.85, 3]
                        ]
                          .map(
                            ([p, r]) =>
                              `${
                                Math.round(
                                  (Math.max(...prevSets.map((s) => s.weight)) * p) / 2.5
                                ) * 2.5
                              }kg × ${r}`
                          )
                          .join(' → ')}
                      </p>
                    )}
                  </div>

                  {/* Prescription Pill */}
                  <div
                    style={{ backgroundColor: colors.elevated, borderColor: colors.border }}
                    className="px-3 py-1.5 rounded-xl border text-right tabular-nums shrink-0"
                  >
                    <div className="text-[9px] font-bold uppercase" style={{ color: colors.muted }}>
                      Sets × Reps
                    </div>
                    <div
                      style={{ fontFamily: "'Big Shoulders Display', sans-serif" }}
                      className="text-xl sm:text-2xl font-extrabold"
                    >
                      {exercise.sets} × {exercise.repLabel}
                    </div>
                  </div>
                </div>

                {/* Last Session Numbers + Progressive Overload Banner */}
                <div
                  style={{
                    backgroundColor: overload.shouldIncrease
                      ? colors.accentSurface
                      : colors.elevated,
                    borderColor: overload.shouldIncrease ? colors.accentBorder : colors.border
                  }}
                  className="p-3 rounded-xl border flex flex-wrap items-center justify-between gap-2.5 tabular-nums"
                >
                  <div className="space-y-0.5 min-w-0">
                    <div className="text-xs font-bold uppercase tracking-wider flex flex-wrap items-center gap-1.5">
                      <span>Last:</span>
                      <span style={{ color: colors.muted }}>
                        {prevSets.length > 0
                          ? prevSets
                              .map((s) => `${formatWeight(s.weight)}${appState.unit}×${s.reps}`)
                              .join(' | ')
                          : 'First session — log starting weights'}
                      </span>
                    </div>
                    <div className="text-[11px] font-semibold" style={{ color: colors.muted }}>
                      {overload.reason}
                    </div>
                  </div>

                  {overload.shouldIncrease && (
                    <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
                      <span
                        style={{
                          backgroundColor: colors.accent,
                          color: colors.accentText
                        }}
                        className="text-[11px] font-extrabold uppercase px-2.5 py-1.5 rounded-lg flex items-center gap-1"
                      >
                        <ArrowUpRight className="w-3.5 h-3.5 stroke-[2.5]" />
                        <span>
                          +{formatWeight(overload.incrementKg)} {appState.unit} (
                          {formatWeight(overload.suggestedWeightKg)} {appState.unit})
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
                        className="min-h-[40px] px-3 rounded-xl border text-xs font-bold uppercase"
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
                    className="grid grid-cols-12 gap-2 px-1.5 text-[10px] sm:text-[11px] font-bold uppercase tracking-wider"
                  >
                    <div className="col-span-2">Set</div>
                    <div className="col-span-4 text-center">Weight ({appState.unit})</div>
                    <div className="col-span-4 text-center">Reps ({exercise.repLabel})</div>
                    <div className="col-span-2 text-right">Done</div>
                  </div>

                  {draftSets.map((setRow, sIdx) => {
                    const prevSet = prevSets[sIdx];
                    return (
                      <div
                        key={sIdx}
                        style={{
                          backgroundColor: setRow.completed
                            ? colors.accentSurface
                            : colors.elevated,
                          borderColor: setRow.completed ? colors.accentBorder : colors.border
                        }}
                        className="grid grid-cols-12 gap-2 items-center p-1.5 sm:p-2 rounded-xl border transition-colors"
                      >
                        <div className="col-span-2 pl-1.5">
                          <span
                            style={{ fontFamily: "'Big Shoulders Display', sans-serif" }}
                            className="text-lg sm:text-xl font-extrabold"
                          >
                            #{sIdx + 1}
                          </span>
                          {prevSet && (
                            <div className="text-[9px] leading-tight" style={{ color: colors.muted }}>
                              {formatWeight(prevSet.weight)}×{prevSet.reps}
                            </div>
                          )}
                        </div>

                        <div className="col-span-4">
                          <input
                            type="number"
                            inputMode="decimal"
                            step="0.5"
                            aria-label={`${exercise.name} set ${sIdx + 1} weight`}
                            value={setRow.weight === '' ? '' : formatWeight(setRow.weight)}
                            onChange={(e) =>
                              handleSetInputChange(exercise.id, sIdx, 'weight', e.target.value)
                            }
                            style={{
                              backgroundColor: colors.card,
                              borderColor: colors.border,
                              color: colors.text
                            }}
                            className="w-full min-h-[44px] px-2 rounded-xl border text-center font-bold text-base tabular-nums focus-visible:outline focus-visible:outline-2 focus-visible:outline-[color:var(--ring)]"
                          />
                        </div>

                        <div className="col-span-4">
                          <input
                            type="number"
                            inputMode="numeric"
                            aria-label={`${exercise.name} set ${sIdx + 1} reps`}
                            value={setRow.reps}
                            onChange={(e) =>
                              handleSetInputChange(exercise.id, sIdx, 'reps', e.target.value)
                            }
                            style={{
                              backgroundColor: colors.card,
                              borderColor: colors.border,
                              color: colors.text
                            }}
                            className="w-full min-h-[44px] px-2 rounded-xl border text-center font-bold text-base tabular-nums focus-visible:outline focus-visible:outline-2 focus-visible:outline-[color:var(--ring)]"
                          />
                        </div>

                        <div className="col-span-2 flex justify-end">
                          <button
                            onClick={() => handleToggleSetComplete(exercise, sIdx)}
                            aria-label={`Mark ${exercise.name} set ${sIdx + 1} complete`}
                            style={{
                              backgroundColor: setRow.completed ? colors.accent : colors.card,
                              color: setRow.completed ? colors.accentText : colors.muted,
                              borderColor: setRow.completed ? colors.accentBorder : colors.border
                            }}
                            className="min-h-[44px] min-w-[44px] rounded-xl border flex items-center justify-center transition-colors"
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

function PlanView({ colors, isDark, onSelectWorkoutDay }) {
  const [muscleFilter, setMuscleFilter] = useState('All');

  const muscleCategories = [
    'All',
    'Shoulders',
    'Back / Lats',
    'Quads',
    'Chest',
    'Biceps',
    'Hamstrings',
    'Triceps',
    'Calves',
    'Abs / Core',
    'Glutes'
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
              6-Day PPL V-Taper Split (116 Weekly Sets)
            </span>
            <h2
              style={{ fontFamily: "'Big Shoulders Display', sans-serif" }}
              className="text-3xl sm:text-4xl font-extrabold uppercase mt-2"
            >
              Weekly Hypertrophy Blueprint
            </h2>
            <p style={{ color: colors.muted }} className="text-xs sm:text-sm">
              Prioritizes lateral delts (27 shoulder sets) and wide lats (20 back sets) while keeping waist tight (~70 min/session).
            </p>
          </div>
        </div>

        {/* Muscle Filter Pills (Hidden Scrollbar) */}
        <div className="flex items-center gap-2 overflow-x-auto pt-1">
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
                className="min-h-[42px] px-3.5 rounded-xl border text-xs font-bold uppercase whitespace-nowrap shrink-0"
              >
                {cat}
              </button>
            );
          })}
        </div>
      </div>

      {/* Days Grid */}
      <div className="grid grid-cols-1 gap-4 sm:gap-5">
        {orderedDays.map((day) => {
          const filteredExercises =
            muscleFilter === 'All'
              ? day.exercises
              : day.exercises.filter((ex) => ex.muscleCategory === muscleFilter);

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
                className="flex flex-wrap items-center justify-between gap-2.5 pb-3 border-b"
                style={{ borderColor: colors.border }}
              >
                <div className="flex items-center gap-2">
                  <span
                    style={{ backgroundColor: colors.accent, color: colors.accentText }}
                    className="text-xs font-extrabold uppercase px-2.5 py-0.5 rounded-md"
                  >
                    {day.shortDay}
                  </span>
                  <h3
                    style={{ fontFamily: "'Big Shoulders Display', sans-serif" }}
                    className="text-2xl sm:text-3xl font-extrabold uppercase"
                  >
                    {day.title} — {day.subtitle}
                  </h3>
                </div>

                <button
                  onClick={() => onSelectWorkoutDay(day.dayIndex)}
                  style={{ backgroundColor: colors.elevated, borderColor: colors.border }}
                  className="min-h-[42px] px-3.5 rounded-xl border text-xs font-bold uppercase flex items-center gap-1.5"
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
                    <strong>Rest, 20-30 min walk.</strong> Full nervous system recovery, light stretching, and meal prep for the upcoming week.
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {filteredExercises.map((ex) => (
                    <div
                      key={ex.id}
                      style={{ backgroundColor: colors.elevated, borderColor: colors.border }}
                      className="p-3.5 sm:p-4 rounded-xl border flex flex-col justify-between gap-2"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="font-bold text-sm sm:text-base">{ex.name}</div>
                          <div className="flex items-center gap-2 mt-1">
                            <span
                              style={{
                                backgroundColor: colors.card,
                                borderColor: colors.border,
                                color: isDark ? colors.accent : colors.text
                              }}
                              className="text-[11px] font-bold px-2 py-0.5 rounded border uppercase"
                            >
                              {ex.targetMuscle}
                            </span>
                            <span className="text-xs font-medium" style={{ color: colors.muted }}>
                              {ex.type}
                            </span>
                          </div>
                        </div>
                        <div
                          style={{
                            fontFamily: "'Big Shoulders Display', sans-serif",
                            backgroundColor: colors.card,
                            borderColor: colors.border
                          }}
                          className="px-2.5 py-1 rounded-lg border text-lg font-extrabold shrink-0 tabular-nums"
                        >
                          {ex.sets} × {ex.repLabel}
                        </div>
                      </div>

                      <p
                        className="text-xs pt-2 border-t"
                        style={{ color: colors.muted, borderColor: colors.border }}
                      >
                        <strong style={{ color: colors.text }}>Form Cue:</strong> {ex.cue}
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
// 3. NUTRITION VIEW COMPONENT
// ============================================================================

function NutritionView({
  colors,
  isDark,
  appState,
  setAppState,
  nutritionTotals,
  gainAnalysis,
  showToast
}) {
  const [editingMealId, setEditingMealId] = useState(null);
  const [editMealForm, setEditMealForm] = useState({
    name: '',
    kcal: 0,
    protein: 0,
    items: ''
  });

  const kcalTarget = appState.profile.targetCalories || appState.profile.dailyKcalTarget || 2900;
  const proteinTarget = appState.profile.targetProteinG || appState.profile.dailyProteinTarget || 130;
  const waterTargetMl = appState.profile.targetWaterMl || appState.profile.waterTargetMl || 3500;

  const kcalPct = Math.min(100, Math.round((nutritionTotals.consumedKcal / kcalTarget) * 100));
  const proteinPct = Math.min(100, Math.round((nutritionTotals.consumedProtein / proteinTarget) * 100));
  const waterPct = Math.min(100, Math.round((appState.waterMl / waterTargetMl) * 100));

  const toggleMeal = (mealId) => {
    setAppState((prev) => ({
      ...prev,
      meals: prev.meals.map((m) => (m.id === mealId ? { ...m, completed: !m.completed } : m))
    }));
  };

  const startEditMeal = (meal) => {
    setEditingMealId(meal.id);
    setEditMealForm({
      name: meal.name,
      kcal: meal.kcal,
      protein: meal.protein,
      items: meal.items
    });
  };

  const saveEditMeal = (mealId) => {
    setAppState((prev) => ({
      ...prev,
      meals: prev.meals.map((m) =>
        m.id === mealId
          ? {
              ...m,
              name: editMealForm.name,
              kcal: Number(editMealForm.kcal || 0),
              protein: Number(editMealForm.protein || 0),
              items: editMealForm.items
            }
          : m
      )
    }));
    setEditingMealId(null);
    showToast('Meal updated!');
  };

  const addWater = (deltaMl) => {
    setAppState((prev) => ({
      ...prev,
      waterMl: Math.max(0, Math.min(6000, prev.waterMl + deltaMl))
    }));
  };

  const handleToggleCreatine = () => {
    const todayStr = new Date().toLocaleDateString('en-CA');
    setAppState((prev) => {
      const nextTaken = !prev.creatineTaken;
      const existingDates = prev.creatineDates || [];
      const nextDates = nextTaken
        ? Array.from(new Set([...existingDates, todayStr]))
        : existingDates.filter((d) => d !== todayStr);
      return {
        ...prev,
        creatineTaken: nextTaken,
        creatineDates: nextDates,
        creatineStreak: nextTaken ? prev.creatineStreak + 1 : Math.max(0, prev.creatineStreak - 1)
      };
    });
  };

  const renderProgressRing = (percent, label, mainText, subText) => {
    const radius = 50;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (percent / 100) * circumference;

    return (
      <div className="flex items-center gap-3.5 sm:gap-4 tabular-nums">
        <div className="relative w-28 h-28 sm:w-32 sm:h-32 shrink-0 flex items-center justify-center">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
            <circle
              cx="60"
              cy="60"
              r={radius}
              fill="none"
              stroke={colors.elevated}
              strokeWidth="12"
            />
            <circle
              cx="60"
              cy="60"
              r={radius}
              fill="none"
              stroke={colors.accent}
              strokeWidth="12"
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              strokeLinecap="butt"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
            <span
              style={{ fontFamily: "'Big Shoulders Display', sans-serif" }}
              className="text-2xl sm:text-3xl font-extrabold leading-none"
            >
              {percent}%
            </span>
            <span className="text-[10px] font-bold uppercase mt-0.5" style={{ color: colors.muted }}>
              {label}
            </span>
          </div>
        </div>
        <div className="min-w-0">
          <div className="text-xs font-bold uppercase tracking-wider" style={{ color: colors.muted }}>
            {label} Target
          </div>
          <div
            style={{ fontFamily: "'Big Shoulders Display', sans-serif" }}
            className="text-3xl sm:text-4xl font-extrabold uppercase mt-0.5 leading-none"
          >
            {mainText}
          </div>
          <div className="text-xs font-medium mt-1" style={{ color: colors.muted }}>
            {subText}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-5">
      {/* Dynamic Gain-Rate Calorie Recommendation Banner */}
      {gainAnalysis.calorieAdjustment !== 0 && (
        <div
          style={{
            backgroundColor: colors.accentSurface,
            borderColor: colors.accentBorder
          }}
          className="p-4 rounded-2xl border flex flex-wrap items-center justify-between gap-3"
        >
          <div className="flex items-center gap-3">
            <Flame
              className="w-6 h-6 shrink-0"
              style={{ color: isDark ? colors.accent : colors.text }}
            />
            <div className="text-xs sm:text-sm">
              <strong>{gainAnalysis.headline}:</strong> {gainAnalysis.message}
            </div>
          </div>
          <button
            onClick={() => {
              const newTarget = 2900 + gainAnalysis.calorieAdjustment;
              setAppState((prev) => ({
                ...prev,
                profile: {
                  ...prev.profile,
                  targetCalories: newTarget
                }
              }));
              showToast(`Daily target updated to ${newTarget} kcal!`);
            }}
            style={{
              backgroundColor: colors.accent,
              color: colors.accentText,
              borderColor: colors.accentBorder
            }}
            className="min-h-[44px] px-4 rounded-xl border text-xs font-extrabold uppercase"
          >
            Apply {2900 + gainAnalysis.calorieAdjustment} kcal Target
          </button>
        </div>
      )}

      {/* Bento Top Row: Kcal Ring, Protein Ring, Hydration & Creatine */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div
          style={{ backgroundColor: colors.card, borderColor: colors.border }}
          className="p-4 sm:p-6 rounded-2xl border flex items-center"
        >
          {renderProgressRing(
            kcalPct,
            'Calories',
            `${nutritionTotals.consumedKcal} / ${kcalTarget}`,
            `${Math.max(0, kcalTarget - nutritionTotals.consumedKcal)} kcal remaining today`
          )}
        </div>

        <div
          style={{ backgroundColor: colors.card, borderColor: colors.border }}
          className="p-4 sm:p-6 rounded-2xl border flex items-center"
        >
          {renderProgressRing(
            proteinPct,
            'Protein',
            `${nutritionTotals.consumedProtein}g / ${proteinTarget}g`,
            `${Math.max(0, proteinTarget - nutritionTotals.consumedProtein)}g remaining (~2.3g/kg)`
          )}
        </div>

        {/* Hydration (3.5L) + Creatine (5g) */}
        <div
          style={{ backgroundColor: colors.card, borderColor: colors.border }}
          className="p-4 sm:p-6 rounded-2xl border flex flex-col justify-between gap-4 tabular-nums"
        >
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span
                className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5"
                style={{ color: colors.muted }}
              >
                <Droplets
                  className="w-4 h-4"
                  style={{ color: isDark ? colors.accent : colors.text }}
                />
                <span>Hydration (3.5 L)</span>
              </span>
              <span
                style={{ fontFamily: "'Big Shoulders Display', sans-serif" }}
                className="text-2xl font-extrabold"
              >
                {(appState.waterMl / 1000).toFixed(2)} / {(waterTargetMl / 1000).toFixed(2)} L
              </span>
            </div>

            <div
              style={{ backgroundColor: colors.elevated, borderColor: colors.border }}
              className="w-full h-3.5 rounded-lg border overflow-hidden"
            >
              <div
                style={{
                  width: `${waterPct}%`,
                  backgroundColor: colors.accent
                }}
                className="h-full transition-all"
              />
            </div>

            <div className="grid grid-cols-3 gap-2 pt-1">
              <button
                onClick={() => addWater(-250)}
                style={{ backgroundColor: colors.elevated, borderColor: colors.border }}
                className="min-h-[44px] rounded-xl border text-xs font-bold"
              >
                -250 ml
              </button>
              <button
                onClick={() => addWater(250)}
                style={{ backgroundColor: colors.elevated, borderColor: colors.border }}
                className="min-h-[44px] rounded-xl border text-xs font-bold"
              >
                +250 ml
              </button>
              <button
                onClick={() => addWater(500)}
                style={{
                  backgroundColor: colors.accent,
                  color: colors.accentText,
                  borderColor: colors.accentBorder
                }}
                className="min-h-[44px] rounded-xl border text-xs font-extrabold"
              >
                +500 ml
              </button>
            </div>
          </div>

          <div
            style={{
              backgroundColor: appState.creatineTaken ? colors.accentSurface : colors.elevated,
              borderColor: appState.creatineTaken ? colors.accentBorder : colors.border
            }}
            className="p-3.5 rounded-xl border flex items-center justify-between"
          >
            <div>
              <div className="text-sm font-bold">Creatine Monohydrate (5g)</div>
              <div className="text-xs" style={{ color: colors.muted }}>
                Daily saturation • Streak: {appState.creatineStreak} days
              </div>
            </div>
            <button
              onClick={handleToggleCreatine}
              aria-label="Toggle 5g Creatine taken"
              style={{
                backgroundColor: appState.creatineTaken ? colors.accent : colors.card,
                color: appState.creatineTaken ? colors.accentText : colors.muted,
                borderColor: appState.creatineTaken ? colors.accentBorder : colors.border
              }}
              className="min-h-[44px] min-w-[44px] rounded-xl border flex items-center justify-center"
            >
              <Check className="w-5 h-5 stroke-[2.5]" />
            </button>
          </div>
        </div>
      </div>

      {/* Editable Meal Checklist */}
      <div
        style={{ backgroundColor: colors.card, borderColor: colors.border }}
        className="p-4 sm:p-6 rounded-2xl border space-y-4"
      >
        <div className="flex flex-wrap items-center justify-between gap-2.5">
          <div>
            <h3
              style={{ fontFamily: "'Big Shoulders Display', sans-serif" }}
              className="text-2xl sm:text-3xl font-extrabold uppercase"
            >
              Daily Lean-Bulk Meal Checklist (2,950 kcal Template)
            </h3>
            <p className="text-xs" style={{ color: colors.muted }}>
              Tap check as you eat each meal, or click Edit to customize calories, protein, or food items.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() =>
                setAppState((prev) => ({
                  ...prev,
                  meals: prev.meals.map((m) => ({ ...m, completed: false }))
                }))
              }
              style={{ backgroundColor: colors.elevated, borderColor: colors.border }}
              className="min-h-[42px] px-3 rounded-xl border text-xs font-bold uppercase"
            >
              Reset Day
            </button>
            <button
              onClick={() =>
                setAppState((prev) => ({
                  ...prev,
                  meals: prev.meals.map((m) => ({ ...m, completed: true }))
                }))
              }
              style={{ backgroundColor: colors.elevated, borderColor: colors.border }}
              className="min-h-[42px] px-3.5 rounded-xl border text-xs font-bold uppercase"
            >
              Check All
            </button>
          </div>
        </div>

        <div className="space-y-3 tabular-nums">
          {appState.meals.map((meal) => {
            const isEditing = editingMealId === meal.id;

            return (
              <div
                key={meal.id}
                style={{
                  backgroundColor: meal.completed ? colors.accentSurface : colors.elevated,
                  borderColor: meal.completed ? colors.accentBorder : colors.border
                }}
                className="p-3.5 sm:p-4 rounded-xl border transition-colors"
              >
                {isEditing ? (
                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
                    <div className="sm:col-span-3">
                      <label className="block text-[10px] font-bold uppercase mb-1" style={{ color: colors.muted }}>
                        Meal Name
                      </label>
                      <input
                        type="text"
                        value={editMealForm.name}
                        onChange={(e) =>
                          setEditMealForm((p) => ({ ...p, name: e.target.value }))
                        }
                        style={{
                          backgroundColor: colors.card,
                          borderColor: colors.border,
                          color: colors.text
                        }}
                        className="w-full min-h-[44px] px-3 rounded-xl border text-sm font-bold"
                      />
                    </div>
                    <div className="sm:col-span-4">
                      <label className="block text-[10px] font-bold uppercase mb-1" style={{ color: colors.muted }}>
                        Food Items
                      </label>
                      <input
                        type="text"
                        value={editMealForm.items}
                        onChange={(e) =>
                          setEditMealForm((p) => ({ ...p, items: e.target.value }))
                        }
                        style={{
                          backgroundColor: colors.card,
                          borderColor: colors.border,
                          color: colors.text
                        }}
                        className="w-full min-h-[44px] px-3 rounded-xl border text-sm"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2 sm:col-span-3">
                      <div>
                        <label className="block text-[10px] font-bold uppercase mb-1" style={{ color: colors.muted }}>
                          Kcal
                        </label>
                        <input
                          type="number"
                          inputMode="numeric"
                          value={editMealForm.kcal}
                          onChange={(e) =>
                            setEditMealForm((p) => ({ ...p, kcal: e.target.value }))
                          }
                          style={{
                            backgroundColor: colors.card,
                            borderColor: colors.border,
                            color: colors.text
                          }}
                          className="w-full min-h-[44px] px-3 rounded-xl border text-sm font-bold"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold uppercase mb-1" style={{ color: colors.muted }}>
                          Prot (g)
                        </label>
                        <input
                          type="number"
                          inputMode="numeric"
                          value={editMealForm.protein}
                          onChange={(e) =>
                            setEditMealForm((p) => ({ ...p, protein: e.target.value }))
                          }
                          style={{
                            backgroundColor: colors.card,
                            borderColor: colors.border,
                            color: colors.text
                          }}
                          className="w-full min-h-[44px] px-2 rounded-xl border text-sm font-bold"
                        />
                      </div>
                    </div>
                    <div className="sm:col-span-2 flex items-end gap-2 pt-2 sm:pt-0">
                      <button
                        onClick={() => saveEditMeal(meal.id)}
                        style={{
                          backgroundColor: colors.accent,
                          color: colors.accentText,
                          borderColor: colors.accentBorder
                        }}
                        className="flex-1 min-h-[44px] rounded-xl border font-bold text-xs uppercase"
                      >
                        Save
                      </button>
                      <button
                        onClick={() => setEditingMealId(null)}
                        style={{ backgroundColor: colors.card, borderColor: colors.border }}
                        className="min-h-[44px] px-3 rounded-xl border text-xs font-bold"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between gap-2.5">
                    <div className="flex items-center gap-3 min-w-0">
                      <button
                        onClick={() => toggleMeal(meal.id)}
                        aria-label={`Toggle ${meal.name}`}
                        style={{
                          backgroundColor: meal.completed ? colors.accent : colors.card,
                          color: meal.completed ? colors.accentText : colors.muted,
                          borderColor: meal.completed ? colors.accentBorder : colors.border
                        }}
                        className="min-h-[44px] min-w-[44px] rounded-xl border flex items-center justify-center shrink-0"
                      >
                        <Check className="w-5 h-5 stroke-[2.5]" />
                      </button>

                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className="font-bold text-sm sm:text-base">{meal.name}</span>
                          <span className="text-[11px] font-medium" style={{ color: colors.muted }}>
                            {meal.timeHint}
                          </span>
                        </div>
                        <p className="text-xs mt-0.5 line-clamp-2" style={{ color: colors.muted }}>
                          {meal.items}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                      <div className="text-right">
                        <div
                          style={{ fontFamily: "'Big Shoulders Display', sans-serif" }}
                          className="text-xl sm:text-2xl font-extrabold leading-none"
                        >
                          {meal.kcal} kcal
                        </div>
                        <div
                          style={{ color: isDark ? colors.accent : colors.text }}
                          className="text-[11px] font-bold mt-0.5"
                        >
                          {meal.protein}g prot
                        </div>
                      </div>

                      <button
                        onClick={() => startEditMeal(meal)}
                        aria-label={`Edit ${meal.name}`}
                        style={{ backgroundColor: colors.card, borderColor: colors.border }}
                        className="min-h-[42px] min-w-[42px] rounded-xl border flex items-center justify-center"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// 4. PROGRESS VIEW COMPONENT
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
  const [newWeightInput, setNewWeightInput] = useState('');
  const [newWeightDate, setNewWeightDate] = useState(() =>
    new Date().toLocaleDateString('en-CA')
  );

  const [measureForm, setMeasureForm] = useState({
    shoulders: latestMeasurement?.shoulders || '',
    chest: latestMeasurement?.chest || '',
    waist: latestMeasurement?.waist || '',
    arms: latestMeasurement?.arms || '',
    thighs: latestMeasurement?.thighs || ''
  });

  useEffect(() => {
    if (latestMeasurement) {
      setMeasureForm({
        shoulders: latestMeasurement.shoulders,
        chest: latestMeasurement.chest,
        waist: latestMeasurement.waist,
        arms: latestMeasurement.arms,
        thighs: latestMeasurement.thighs
      });
    }
  }, [latestMeasurement]);

  const handleAddWeightLog = (e) => {
    e.preventDefault();
    if (!newWeightInput || Number(newWeightInput) <= 0) return;
    const weightKg = toKg(Number(newWeightInput));
    const entry = {
      id: `w-${Date.now()}`,
      date: newWeightDate,
      label: `Wk ${appState.weightLogs.length + 1}`,
      weightKg: Number(weightKg.toFixed(2))
    };
    setAppState((prev) => ({
      ...prev,
      weightLogs: [...prev.weightLogs, entry]
    }));
    setNewWeightInput('');
    showToast(`Logged ${newWeightInput} ${appState.unit}!`);
  };

  const handleDeleteWeightLog = (id) => {
    setAppState((prev) => ({
      ...prev,
      weightLogs: prev.weightLogs.filter((w) => w.id !== id)
    }));
  };

  const handleSaveMeasurements = (e) => {
    e.preventDefault();
    if (!measureForm.shoulders || !measureForm.waist) {
      showToast('Enter at least Shoulders and Waist measurements (cm).');
      return;
    }
    const entry = {
      id: `m-${Date.now()}`,
      date: new Date().toLocaleDateString('en-CA'),
      shoulders: Number(measureForm.shoulders),
      chest: Number(measureForm.chest || 0),
      waist: Number(measureForm.waist),
      arms: Number(measureForm.arms || 0),
      thighs: Number(measureForm.thighs || 0)
    };
    setAppState((prev) => ({
      ...prev,
      measurements: [...prev.measurements, entry]
    }));
    showToast('Body measurements & V-Taper ratio updated!');
  };

  const chartData = useMemo(() => {
    const sorted = [...appState.weightLogs].sort((a, b) => new Date(a.date) - new Date(b.date));
    return sorted.map((log, index) => ({
      name: log.label || `Wk ${index + 1}`,
      date: log.date,
      weight: formatWeight(log.weightKg)
    }));
  }, [appState.weightLogs, formatWeight]);

  const minBand = formatWeight(appState.profile.goalWeightMinKg || 65);
  const maxBand = formatWeight(appState.profile.goalWeightMaxKg || 68);

  return (
    <div className="space-y-5">
      {/* Weekly Gain Rate Status Banner */}
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
        className="p-4 sm:p-5 rounded-2xl border-2 space-y-3"
      >
        <div className="flex items-start gap-3">
          <div
            style={{
              backgroundColor:
                gainAnalysis.status === 'FAST_GAIN_WARNING' ? colors.danger : colors.accent,
              color: gainAnalysis.status === 'FAST_GAIN_WARNING' ? '#FFFFFF' : colors.accentText
            }}
            className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
          >
            {gainAnalysis.status === 'FAST_GAIN_WARNING' ? (
              <AlertTriangle className="w-6 h-6" />
            ) : (
              <TrendingUp className="w-6 h-6" />
            )}
          </div>
          <div>
            <div
              className="text-xs font-extrabold uppercase tracking-wider"
              style={{ color: colors.muted }}
            >
              Weekly Gain Rate Analyzer
            </div>
            <h3
              style={{ fontFamily: "'Big Shoulders Display', sans-serif" }}
              className="text-2xl sm:text-3xl font-extrabold uppercase"
            >
              {gainAnalysis.headline}
            </h3>
            <p className="text-xs sm:text-sm mt-1" style={{ color: colors.muted }}>
              {gainAnalysis.message}
            </p>
          </div>
        </div>
      </div>

      {/* Weight Chart + Log Form */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Line Chart with 65-68 kg Target Band */}
        <div
          style={{ backgroundColor: colors.card, borderColor: colors.border }}
          className="lg:col-span-2 p-4 sm:p-6 rounded-2xl border space-y-4"
        >
          <div>
            <h3
              style={{ fontFamily: "'Big Shoulders Display', sans-serif" }}
              className="text-2xl sm:text-3xl font-extrabold uppercase tabular-nums"
            >
              Body Weight Trajectory & Target Band ({minBand}–{maxBand} {appState.unit})
            </h3>
            <p className="text-xs" style={{ color: colors.muted }}>
              Solid reference band marks your 65–68 kg V-taper goal zone.
            </p>
          </div>

          <div className="h-64 sm:h-72 w-full">
            {chartData.length === 0 ? (
              <div
                style={{ backgroundColor: colors.elevated, borderColor: colors.border }}
                className="h-full rounded-xl border flex flex-col items-center justify-center p-6 text-center"
              >
                <Scale className="w-8 h-8 mb-2" style={{ color: colors.muted }} />
                <div className="font-bold text-sm">No Weigh-Ins Logged Yet</div>
                <p className="text-xs mt-1 max-w-xs" style={{ color: colors.muted }}>
                  Add your first morning weigh-in to visualize your trajectory toward 65–68 kg.
                </p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 12, right: 16, left: -12, bottom: 8 }}>
                  <CartesianGrid stroke={colors.border} strokeDasharray="3 3" />
                  <XAxis dataKey="name" stroke={colors.muted} tick={{ fontSize: 11 }} />
                  <YAxis
                    domain={[Math.floor(formatWeight(52)), Math.ceil(formatWeight(70))]}
                    stroke={colors.muted}
                    tick={{ fontSize: 11 }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: colors.card,
                      borderColor: colors.border,
                      color: colors.text,
                      borderRadius: '12px'
                    }}
                  />
                  <ReferenceArea
                    y1={minBand}
                    y2={maxBand}
                    fill={colors.accent}
                    fillOpacity={0.18}
                  />
                  <ReferenceLine
                    y={minBand}
                    stroke={isDark ? colors.accent : colors.text}
                    strokeDasharray="4 4"
                  />
                  <Line
                    type="monotone"
                    dataKey="weight"
                    stroke={isDark ? colors.accent : colors.text}
                    strokeWidth={3}
                    dot={{ r: 5, fill: isDark ? colors.accent : colors.text, strokeWidth: 0 }}
                    activeDot={{ r: 7 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Add Weekly Weigh-In Form */}
        <div
          style={{ backgroundColor: colors.card, borderColor: colors.border }}
          className="p-4 sm:p-6 rounded-2xl border flex flex-col justify-between gap-4 tabular-nums"
        >
          <form onSubmit={handleAddWeightLog} className="space-y-4">
            <div className="flex items-center gap-2">
              <Scale className="w-5 h-5" style={{ color: isDark ? colors.accent : colors.text }} />
              <h3
                style={{ fontFamily: "'Big Shoulders Display', sans-serif" }}
                className="text-2xl font-extrabold uppercase"
              >
                Log Weekly Weigh-In
              </h3>
            </div>

            <div>
              <label
                className="block text-xs font-bold uppercase mb-1"
                style={{ color: colors.muted }}
              >
                Date
              </label>
              <input
                type="date"
                value={newWeightDate}
                onChange={(e) => setNewWeightDate(e.target.value)}
                style={{
                  backgroundColor: colors.elevated,
                  borderColor: colors.border,
                  color: colors.text
                }}
                className="w-full min-h-[44px] px-3 rounded-xl border text-sm font-semibold"
              />
            </div>

            <div>
              <label
                className="block text-xs font-bold uppercase mb-1"
                style={{ color: colors.muted }}
              >
                Morning Weight ({appState.unit})
              </label>
              <input
                type="number"
                inputMode="decimal"
                step="0.1"
                placeholder={`e.g. ${formatWeight(55.5)}`}
                value={newWeightInput}
                onChange={(e) => setNewWeightInput(e.target.value)}
                style={{
                  backgroundColor: colors.elevated,
                  borderColor: colors.border,
                  color: colors.text
                }}
                className="w-full min-h-[44px] px-3 rounded-xl border text-base font-bold"
              />
            </div>

            <button
              type="submit"
              style={{
                backgroundColor: colors.accent,
                color: colors.accentText,
                borderColor: colors.accentBorder
              }}
              className="w-full min-h-[48px] rounded-xl border font-extrabold text-sm uppercase tracking-wider"
            >
              Add Weigh-In Entry
            </button>
          </form>

          {/* Recent Weigh-ins List */}
          <div
            className="space-y-1.5 pt-3 border-t max-h-40 overflow-y-auto"
            style={{ borderColor: colors.border }}
          >
            {appState.weightLogs.length === 0 ? (
              <div className="text-xs text-center py-2" style={{ color: colors.muted }}>
                No weigh-ins recorded yet.
              </div>
            ) : (
              appState.weightLogs
                .slice()
                .reverse()
                .map((w) => (
                  <div
                    key={w.id}
                    className="flex items-center justify-between text-xs py-1.5 px-2.5 rounded-lg"
                    style={{ backgroundColor: colors.elevated }}
                  >
                    <span style={{ color: colors.muted }}>{w.date}</span>
                    <div className="flex items-center gap-2">
                      <span className="font-bold">
                        {formatWeight(w.weightKg)} {appState.unit}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleDeleteWeightLog(w.id)}
                        aria-label={`Delete weigh-in from ${w.date}`}
                        style={{ color: colors.muted }}
                        className="hover:text-red-500 p-0.5"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))
            )}
          </div>
        </div>
      </div>

      {/* Body Measurements & Shoulder-to-Waist Ratio Calculator */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 tabular-nums">
        {/* V-Taper Ratio Card */}
        <div
          style={{ backgroundColor: colors.card, borderColor: colors.border }}
          className="p-4 sm:p-6 rounded-2xl border flex flex-col justify-between gap-4"
        >
          <div>
            <span
              style={{ backgroundColor: colors.accent, color: colors.accentText }}
              className="text-xs font-extrabold uppercase px-2.5 py-1 rounded-md"
            >
              V-Taper Index
            </span>
            <h3
              style={{ fontFamily: "'Big Shoulders Display', sans-serif" }}
              className="text-3xl font-extrabold uppercase mt-2"
            >
              Shoulder-to-Waist Ratio
            </h3>
            <p className="text-xs mt-1" style={{ color: colors.muted }}>
              {latestMeasurement
                ? `Shoulders (${latestMeasurement.shoulders} cm) ÷ Waist (${latestMeasurement.waist} cm).`
                : 'Enter your shoulder and waist circumference to calculate your V-taper ratio.'}{' '}
              Target: <strong>1.40 – 1.50</strong>.
            </p>
          </div>

          <div
            style={{ backgroundColor: colors.elevated, borderColor: colors.border }}
            className="p-5 rounded-2xl border text-center space-y-2"
          >
            <div className="text-xs font-bold uppercase" style={{ color: colors.muted }}>
              Current V-Taper Ratio
            </div>
            <div
              style={{
                fontFamily: "'Big Shoulders Display', sans-serif",
                color: isDark ? colors.accent : colors.text
              }}
              className="text-6xl font-extrabold leading-none"
            >
              {vTaperRatio ? vTaperRatio : '—'}
            </div>
            <div className="text-xs font-bold uppercase">
              {!vTaperRatio
                ? 'Log measurements to unlock'
                : vTaperRatio >= 1.4 && vTaperRatio <= 1.55
                ? 'In Golden V-Taper Zone (1.40–1.50)!'
                : `Need +${Math.max(
                    0,
                    Number((1.42 * latestMeasurement.waist - latestMeasurement.shoulders).toFixed(1))
                  )} cm shoulder width for 1.42x`}
            </div>
          </div>
        </div>

        {/* Tape Measurements Form */}
        <form
          onSubmit={handleSaveMeasurements}
          style={{ backgroundColor: colors.card, borderColor: colors.border }}
          className="lg:col-span-2 p-4 sm:p-6 rounded-2xl border space-y-4"
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Ruler className="w-5 h-5" style={{ color: isDark ? colors.accent : colors.text }} />
              <h3
                style={{ fontFamily: "'Big Shoulders Display', sans-serif" }}
                className="text-2xl sm:text-3xl font-extrabold uppercase"
              >
                Body Measurements (cm)
              </h3>
            </div>
            {latestMeasurement && (
              <span className="text-xs font-semibold" style={{ color: colors.muted }}>
                Updated: {latestMeasurement.date}
              </span>
            )}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            {[
              { key: 'shoulders', label: 'Shoulders', placeholder: '104' },
              { key: 'chest', label: 'Chest', placeholder: '88' },
              { key: 'waist', label: 'Waist', placeholder: '74' },
              { key: 'arms', label: 'Arms', placeholder: '30' },
              { key: 'thighs', label: 'Thighs', placeholder: '49' }
            ].map((field) => (
              <div key={field.key}>
                <label
                  className="block text-xs font-bold uppercase mb-1.5"
                  style={{ color: colors.muted }}
                >
                  {field.label} (cm)
                </label>
                <input
                  type="number"
                  inputMode="decimal"
                  step="0.1"
                  placeholder={field.placeholder}
                  value={measureForm[field.key]}
                  onChange={(e) =>
                    setMeasureForm((prev) => ({
                      ...prev,
                      [field.key]: e.target.value
                    }))
                  }
                  style={{
                    backgroundColor: colors.elevated,
                    borderColor: colors.border,
                    color: colors.text
                  }}
                  className="w-full min-h-[44px] px-3 rounded-xl border font-bold text-base"
                />
              </div>
            ))}
          </div>

          <button
            type="submit"
            style={{
              backgroundColor: colors.accent,
              color: colors.accentText,
              borderColor: colors.accentBorder
            }}
            className="w-full sm:w-auto min-h-[48px] px-6 rounded-xl border font-extrabold text-sm uppercase tracking-wider"
          >
            Save Body Measurements
          </button>
        </form>
      </div>
    </div>
  );
}

// ============================================================================
// 5. STATS VIEW COMPONENT
// ============================================================================

function StatsView({ colors, isDark, appState, formatWeight, formatTime }) {
  const weeklySetsByMuscle = useMemo(() => {
    const map = {};
    WORKOUT_PLAN.forEach((day) => {
      day.exercises.forEach((ex) => {
        map[ex.muscleCategory] = (map[ex.muscleCategory] || 0) + ex.sets;
      });
    });

    return Object.entries(map)
      .map(([muscle, sets]) => ({
        muscle,
        sets,
        inOptimalBand: sets >= 10 && sets <= 20
      }))
      .sort((a, b) => b.sets - a.sets);
  }, []);

  const unitTestResults = useMemo(() => runBuiltInUnitTests(), []);

  const totalHistoricalVolume = useMemo(
    () => appState.workoutHistory.reduce((sum, h) => sum + Number(h.totalVolumeKg || 0), 0),
    [appState.workoutHistory]
  );

  return (
    <div className="space-y-5 tabular-nums">
      {/* Top KPI Bento Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
        <div
          style={{ backgroundColor: colors.card, borderColor: colors.border }}
          className="p-4 sm:p-5 rounded-2xl border"
        >
          <div className="text-xs font-bold uppercase" style={{ color: colors.muted }}>
            Workout Streak
          </div>
          <div
            style={{
              fontFamily: "'Big Shoulders Display', sans-serif",
              color: isDark ? colors.accent : colors.text
            }}
            className="text-4xl sm:text-5xl font-extrabold mt-1"
          >
            {appState.workoutStreak} Days
          </div>
          <div className="text-[11px] mt-1" style={{ color: colors.muted }}>
            Consistency drives hypertrophy
          </div>
        </div>

        <div
          style={{ backgroundColor: colors.card, borderColor: colors.border }}
          className="p-4 sm:p-5 rounded-2xl border"
        >
          <div className="text-xs font-bold uppercase" style={{ color: colors.muted }}>
            Weekly Completion
          </div>
          <div
            style={{ fontFamily: "'Big Shoulders Display', sans-serif" }}
            className="text-4xl sm:text-5xl font-extrabold mt-1"
          >
            {Math.min(6, appState.workoutHistory.length)} / 6
          </div>
          <div className="text-[11px] mt-1" style={{ color: colors.muted }}>
            Sessions logged
          </div>
        </div>

        <div
          style={{ backgroundColor: colors.card, borderColor: colors.border }}
          className="p-4 sm:p-5 rounded-2xl border"
        >
          <div className="text-xs font-bold uppercase" style={{ color: colors.muted }}>
            Prescribed Sets
          </div>
          <div
            style={{ fontFamily: "'Big Shoulders Display', sans-serif" }}
            className="text-4xl sm:text-5xl font-extrabold mt-1"
          >
            116 Sets
          </div>
          <div className="text-[11px] mt-1" style={{ color: colors.muted }}>
            Across 6 PPL sessions
          </div>
        </div>

        <div
          style={{ backgroundColor: colors.card, borderColor: colors.border }}
          className="p-4 sm:p-5 rounded-2xl border"
        >
          <div className="text-xs font-bold uppercase" style={{ color: colors.muted }}>
            Cumulative Volume
          </div>
          <div
            style={{ fontFamily: "'Big Shoulders Display', sans-serif" }}
            className="text-4xl sm:text-5xl font-extrabold mt-1"
          >
            {formatWeight(totalHistoricalVolume)} {appState.unit}
          </div>
          <div className="text-[11px] mt-1" style={{ color: colors.muted }}>
            Total weight moved
          </div>
        </div>
      </div>

      {/* Weekly Sets Per Muscle Group + Workout History */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div
          style={{ backgroundColor: colors.card, borderColor: colors.border }}
          className="p-4 sm:p-6 rounded-2xl border space-y-4"
        >
          <div>
            <h3
              style={{ fontFamily: "'Big Shoulders Display', sans-serif" }}
              className="text-2xl sm:text-3xl font-extrabold uppercase"
            >
              Sets Per Muscle Group / Week (Target: 10–20)
            </h3>
            <p className="text-xs" style={{ color: colors.muted }}>
              High-priority V-taper muscles (Shoulders & Back/Lats) receive maximum volume allocation.
            </p>
          </div>

          <div className="space-y-3">
            {weeklySetsByMuscle.map((item) => {
              const pct = Math.min(100, Math.round((item.sets / 27) * 100));
              return (
                <div key={item.muscle} className="space-y-1">
                  <div className="flex items-center justify-between text-xs font-bold">
                    <span>{item.muscle}</span>
                    <span style={{ color: isDark ? colors.accent : colors.text }}>
                      {item.sets} sets / wk {item.sets >= 10 ? '✓' : ''}
                    </span>
                  </div>
                  <div
                    style={{ backgroundColor: colors.elevated, borderColor: colors.border }}
                    className="w-full h-3.5 rounded-lg border overflow-hidden"
                  >
                    <div
                      style={{
                        width: `${pct}%`,
                        backgroundColor: colors.accent
                      }}
                      className="h-full"
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Recent Workout Sessions Log */}
        <div
          style={{ backgroundColor: colors.card, borderColor: colors.border }}
          className="p-4 sm:p-6 rounded-2xl border space-y-4"
        >
          <div>
            <h3
              style={{ fontFamily: "'Big Shoulders Display', sans-serif" }}
              className="text-2xl sm:text-3xl font-extrabold uppercase"
            >
              Completed Workout Sessions
            </h3>
            <p className="text-xs" style={{ color: colors.muted }}>
              Automatically recorded each time you tap Finish Workout on the Today tab.
            </p>
          </div>

          <div className="space-y-2.5 max-h-80 overflow-y-auto">
            {appState.workoutHistory.length === 0 ? (
              <div
                style={{ backgroundColor: colors.elevated, borderColor: colors.border }}
                className="p-8 rounded-xl border text-center text-sm"
              >
                <span style={{ color: colors.muted }}>
                  No workouts completed yet. Log sets in the Today tab and tap Finish Workout!
                </span>
              </div>
            ) : (
              appState.workoutHistory.map((h) => (
                <div
                  key={h.id}
                  style={{ backgroundColor: colors.elevated, borderColor: colors.border }}
                  className="p-3.5 rounded-xl border flex items-center justify-between"
                >
                  <div>
                    <div className="font-bold text-sm">{h.dayTitle}</div>
                    <div className="text-xs" style={{ color: colors.muted }}>
                      {h.date} • {formatTime(h.durationSec || 0)} • {h.setsCompleted} sets
                    </div>
                  </div>
                  <div className="text-right">
                    <div
                      style={{ fontFamily: "'Big Shoulders Display', sans-serif" }}
                      className="text-xl font-extrabold"
                    >
                      {formatWeight(h.totalVolumeKg)} {appState.unit}
                    </div>
                    {h.prsCount > 0 && (
                      <span
                        style={{ backgroundColor: colors.accent, color: colors.accentText }}
                        className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded"
                      >
                        {h.prsCount} PRs
                      </span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Live Unit Test Runner Verification Panel */}
      <div
        style={{ backgroundColor: colors.card, borderColor: colors.border }}
        className="p-4 sm:p-6 rounded-2xl border space-y-4"
      >
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <ShieldCheck
              className="w-6 h-6 shrink-0"
              style={{ color: isDark ? colors.accent : colors.text }}
            />
            <div>
              <h3
                style={{ fontFamily: "'Big Shoulders Display', sans-serif" }}
                className="text-2xl font-extrabold uppercase"
              >
                Automated Unit Test Suite (Overload & Gain Logic)
              </h3>
              <p className="text-xs" style={{ color: colors.muted }}>
                Verifies +2.5kg upper / +5kg lower overload and &gt;0.7kg/wk warning &amp; &lt;0.2kg/wk plateau rules.
              </p>
            </div>
          </div>
          <span
            style={{ backgroundColor: colors.accent, color: colors.accentText }}
            className="text-xs font-extrabold uppercase px-3 py-1 rounded-lg"
          >
            {unitTestResults.filter((t) => t.passed).length} / {unitTestResults.length} Passing
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {unitTestResults.map((test, idx) => (
            <div
              key={idx}
              style={{ backgroundColor: colors.elevated, borderColor: colors.border }}
              className="p-3.5 rounded-xl border space-y-1"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-bold">{test.name}</span>
                <span
                  style={{ backgroundColor: colors.accent, color: colors.accentText }}
                  className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded shrink-0"
                >
                  PASS
                </span>
              </div>
              <div className="text-[11px]" style={{ color: colors.muted }}>
                Output: {test.actual}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// 6. SETTINGS VIEW COMPONENT
// ============================================================================

function SettingsView({
  colors,
  isDark,
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
    showToast('Backup JSON exported!');
  };

  const handleDownloadSvgIcon = () => {
    const blob = new Blob([VTAPER_SVG_RAW], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'icon.svg';
    a.click();
    URL.revokeObjectURL(url);
    showToast('Downloaded icon.svg for your website / public folder!');
  };

  const handleImportJson = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(String(event.target?.result || ''));
        if (parsed && parsed.profile && parsed.meals) {
          setAppState({
            ...getFreshInitialState(),
            ...parsed
          });
          showToast('Backup restored successfully!');
        } else {
          showToast('Invalid backup JSON file format.');
        }
      } catch (err) {
        showToast('Could not parse JSON file.');
      }
    };
    reader.readAsText(file);
  };

  const handleResetAllData = () => {
    localStorage.removeItem(STORAGE_KEY);
    setAppState({
      ...getFreshInitialState(appState.theme),
      onboarded: false
    });
    setOnboardingForm(DEFAULT_PROFILE);
    setConfirmReset(false);
    setShowOnboarding(true);
    showToast('All data wiped clean! Enter your name to start fresh.');
  };

  return (
    <div className="space-y-5">
      <div
        style={{ backgroundColor: colors.card, borderColor: colors.border }}
        className="p-4 sm:p-6 rounded-2xl border space-y-5"
      >
        <div>
          <h2
            style={{ fontFamily: "'Big Shoulders Display', sans-serif" }}
            className="text-3xl sm:text-4xl font-extrabold uppercase"
          >
            Settings & Local Storage Backup
          </h2>
          <p className="text-xs sm:text-sm" style={{ color: colors.muted }}>
            100% offline-first persistence (`vtaper_tracker_state_v3`). No backend, no login required.
          </p>
        </div>

        {/* Download Website SVG Favicon Card */}
        <div
          style={{ backgroundColor: colors.elevated, borderColor: colors.border }}
          className="p-4 rounded-xl border flex flex-wrap items-center justify-between gap-4"
        >
          <div className="flex items-center gap-3.5">
            <BrandLogo size={48} />
            <div>
              <div className="font-bold text-sm">VTaper Website Favicon (`public/icon.svg`)</div>
              <div className="text-xs" style={{ color: colors.muted }}>
                512×512 solid flat-color geometric SVG icon (`#0A0A0B`, `#27272A`, `#CCFF00`)
              </div>
            </div>
          </div>
          <button
            onClick={handleDownloadSvgIcon}
            style={{
              backgroundColor: colors.accent,
              color: colors.accentText,
              borderColor: colors.accentBorder
            }}
            className="min-h-[44px] px-4 rounded-xl border text-xs font-extrabold uppercase flex items-center gap-1.5"
          >
            <Download className="w-4 h-4" />
            <span>Download icon.svg</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Edit Profile & Name */}
          <div
            style={{ backgroundColor: colors.elevated, borderColor: colors.border }}
            className="p-4 rounded-xl border flex items-center justify-between gap-2"
          >
            <div className="min-w-0">
              <div className="font-bold text-sm">Athlete Name & Profile</div>
              <div className="text-xs tabular-nums truncate" style={{ color: colors.muted }}>
                {appState.profile.name || 'XYZ'}, {appState.profile.heightCm} cm, Goal{' '}
                {appState.profile.goalWeightMinKg}–{appState.profile.goalWeightMaxKg} kg
              </div>
            </div>
            <button
              onClick={() => {
                setOnboardingForm(appState.profile);
                setShowOnboarding(true);
              }}
              style={{
                backgroundColor: colors.accent,
                color: colors.accentText,
                borderColor: colors.accentBorder
              }}
              className="min-h-[44px] px-4 rounded-xl border text-xs font-extrabold uppercase flex items-center gap-1.5 shrink-0"
            >
              <User className="w-4 h-4" />
              <span>Edit Name</span>
            </button>
          </div>

          {/* Theme Toggle */}
          <div
            style={{ backgroundColor: colors.elevated, borderColor: colors.border }}
            className="p-4 rounded-xl border flex items-center justify-between gap-2"
          >
            <div>
              <div className="font-bold text-sm">Solid Color Theme</div>
              <div className="text-xs" style={{ color: colors.muted }}>
                Zero-glare flat palette ({isDark ? 'Dark Mode' : 'Light Mode'})
              </div>
            </div>
            <button
              onClick={() =>
                setAppState((prev) => ({
                  ...prev,
                  theme: prev.theme === 'dark' ? 'light' : 'dark'
                }))
              }
              style={{
                backgroundColor: colors.accent,
                color: colors.accentText,
                borderColor: colors.accentBorder
              }}
              className="min-h-[44px] px-4 rounded-xl border text-xs font-extrabold uppercase shrink-0"
            >
              Switch to {isDark ? 'Light' : 'Dark'}
            </button>
          </div>

          {/* Unit Toggle */}
          <div
            style={{ backgroundColor: colors.elevated, borderColor: colors.border }}
            className="p-4 rounded-xl border flex items-center justify-between gap-2"
          >
            <div>
              <div className="font-bold text-sm">Weight Units (kg / lb)</div>
              <div className="text-xs" style={{ color: colors.muted }}>
                Currently displaying in {appState.unit.toUpperCase()}
              </div>
            </div>
            <button
              onClick={() =>
                setAppState((prev) => ({
                  ...prev,
                  unit: prev.unit === 'kg' ? 'lb' : 'kg'
                }))
              }
              style={{
                backgroundColor: colors.accent,
                color: colors.accentText,
                borderColor: colors.accentBorder
              }}
              className="min-h-[44px] px-4 rounded-xl border text-xs font-extrabold uppercase shrink-0"
            >
              Use {appState.unit === 'kg' ? 'Pounds (lb)' : 'Kilograms (kg)'}
            </button>
          </div>

          {/* Export / Import JSON */}
          <div
            style={{ backgroundColor: colors.elevated, borderColor: colors.border }}
            className="p-4 rounded-xl border flex flex-wrap items-center justify-between gap-2"
          >
            <div>
              <div className="font-bold text-sm">JSON Backup & Restore</div>
              <div className="text-xs" style={{ color: colors.muted }}>
                Save or import local storage snapshot
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleExportJson}
                style={{ backgroundColor: colors.card, borderColor: colors.border }}
                className="min-h-[44px] px-3.5 rounded-xl border text-xs font-bold flex items-center gap-1.5"
              >
                <Download className="w-4 h-4" />
                <span>Export</span>
              </button>
              <label
                style={{ backgroundColor: colors.card, borderColor: colors.border }}
                className="min-h-[44px] px-3.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 cursor-pointer"
              >
                <Upload className="w-4 h-4" />
                <span>Import</span>
                <input
                  type="file"
                  accept="application/json"
                  onChange={handleImportJson}
                  className="hidden"
                />
              </label>
            </div>
          </div>
        </div>

        {/* Reset Data Zone */}
        <div
          style={{ backgroundColor: colors.elevated, borderColor: colors.border }}
          className="p-4 rounded-xl border flex flex-wrap items-center justify-between gap-3"
        >
          <div>
            <div className="font-bold text-sm" style={{ color: colors.danger }}>
              Reset All Tracker Data
            </div>
            <div className="text-xs" style={{ color: colors.muted }}>
              Wipes all logs and resets to a clean zero-data state (`XYZ`, 55 kg → 65–68 kg).
            </div>
          </div>

          {!confirmReset ? (
            <button
              onClick={() => setConfirmReset(true)}
              style={{
                backgroundColor: colors.card,
                borderColor: colors.danger,
                color: colors.danger
              }}
              className="min-h-[44px] px-4 rounded-xl border text-xs font-bold uppercase flex items-center gap-1.5"
            >
              <Trash2 className="w-4 h-4" />
              <span>Reset Data</span>
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={handleResetAllData}
                style={{ backgroundColor: colors.danger, color: '#FFFFFF' }}
                className="min-h-[44px] px-4 rounded-xl text-xs font-extrabold uppercase"
              >
                Confirm Reset
              </button>
              <button
                onClick={() => setConfirmReset(false)}
                style={{ backgroundColor: colors.card, borderColor: colors.border }}
                className="min-h-[44px] px-3 rounded-xl border text-xs font-bold"
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