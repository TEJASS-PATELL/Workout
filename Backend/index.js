import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import { PrismaClient } from '@prisma/client'

const app = express()
const prisma = new PrismaClient()

const PORT = Number(process.env.PORT || 3001)
const CONFIG_ID = 'vtaper_main'
const MAX_CLOUD_BACKUPS = 14

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
  targetSleepHours: 7.5,
}

app.use(cors())
app.use(express.json({ limit: '15mb' }))

// ============================================================================
// UTILITY HELPERS (IST DATES, SAFE MATH & SANITIZERS)
// ============================================================================

function isPlainObject(val) {
  return Boolean(val) && typeof val === 'object' && !Array.isArray(val)
}

function safeArray(val) {
  return Array.isArray(val) ? val : []
}

function safeObject(val) {
  return isPlainObject(val) ? val : {}
}

function round2(num) {
  const n = Number(num || 0)
  if (!Number.isFinite(n)) return 0
  return Math.round(n * 100) / 100
}

function getISTDateStr(dateObj = new Date()) {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(dateObj)
}

function isValidDateStr(str) {
  return typeof str === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(str)
}

function addDaysToDateStr(dateStr, offsetDays) {
  const [y, m, d] = String(dateStr).split('-').map(Number)
  if (!y || !m || !d) return getISTDateStr()
  const dt = new Date(Date.UTC(y, m - 1, d))
  dt.setUTCDate(dt.getUTCDate() + offsetDays)
  return dt.toISOString().slice(0, 10)
}

function daysBetweenDateStr(olderDateStr, newerDateStr) {
  const [y1, m1, d1] = String(olderDateStr).split('-').map(Number)
  const [y2, m2, d2] = String(newerDateStr).split('-').map(Number)
  if (!y1 || !y2) return 0
  return Math.round((Date.UTC(y2, m2 - 1, d2) - Date.UTC(y1, m1 - 1, d1)) / 86400000)
}

function getWeekStartMonday(dateStr) {
  const [y, m, d] = String(dateStr).split('-').map(Number)
  if (!y || !m || !d) return null
  const dt = new Date(Date.UTC(y, m - 1, d))
  const day = dt.getUTCDay()
  const diff = day === 0 ? -6 : 1 - day
  dt.setUTCDate(dt.getUTCDate() + diff)
  return dt.toISOString().slice(0, 10)
}

function getMonthKey(dateStr) {
  if (!isValidDateStr(dateStr)) return null
  return dateStr.slice(0, 7)
}

function formatMonthLabel(monthKey) {
  const [y, m] = String(monthKey).split('-').map(Number)
  if (!y || !m) return monthKey
  return new Date(Date.UTC(y, m - 1, 1)).toLocaleString('en-US', {
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  })
}

function getPeriodKey(dateStr, period) {
  if (!isValidDateStr(dateStr)) return null
  return period === 'monthly' ? getMonthKey(dateStr) : getWeekStartMonday(dateStr)
}

function computeE1RM(weightKg, reps, isAssisted = false) {
  const w = Number(weightKg || 0)
  const r = Number(reps || 0)
  if (isAssisted || w <= 0) return w
  if (r <= 1) return round2(w)
  return round2(w * (1 + r / 30))
}

async function ensureUserConfig(tx = prisma) {
  const existing = await tx.userConfig.findUnique({ where: { id: CONFIG_ID } })
  if (existing) return existing

  return tx.userConfig.create({
    data: {
      id: CONFIG_ID,
      dayStamp: getISTDateStr(),
      profile: DEFAULT_PROFILE,
      customSteps: {},
      variantChoices: { 'thu-5': 'dips' },
      swappedAlternatives: {},
      selectedMealOptions: {},
      foodDatabase: [],
      activeDrafts: {},
    },
  })
}

// ============================================================================
// FULL STATE HYDRATION HELPER (BUILDS EXACT FRONTEND-READY OBJECT)
// ============================================================================

async function buildFullAppState() {
  const todayStr = getISTDateStr()
  const config = await ensureUserConfig()

  const [
    sessions,
    allExerciseLogs,
    weightLogs,
    dailyLogsList,
    measurements,
    disciplineList,
    urgeLogs,
    cardioLogs,
    pelvicLogs,
  ] = await Promise.all([
    prisma.workoutSession.findMany({
      orderBy: [{ date: 'desc' }, { createdAt: 'desc' }],
      include: { exercises: true },
    }),
    prisma.exerciseLog.findMany({
      orderBy: [{ date: 'asc' }, { createdAt: 'asc' }],
    }),
    prisma.weightLog.findMany({
      orderBy: { date: 'asc' },
    }),
    prisma.dailyLog.findMany({
      orderBy: { date: 'asc' },
    }),
    prisma.bodyMeasurement.findMany({
      orderBy: [{ date: 'asc' }, { createdAt: 'asc' }],
    }),
    prisma.disciplineLog.findMany({
      orderBy: { date: 'asc' },
    }),
    prisma.urgeLog.findMany({
      orderBy: [{ date: 'desc' }, { createdAt: 'desc' }],
    }),
    prisma.cardioLog.findMany({
      orderBy: { date: 'desc' },
    }),
    prisma.pelvicLog.findMany({
      orderBy: { date: 'desc' },
    }),
  ])

  // Build `exerciseHistory` & `lastSessionLogs` directly from relational ExerciseLog rows
  const exerciseHistory = {}
  const lastSessionLogs = {}
  const lastSessionMetaByExercise = {}

  for (const log of allExerciseLogs) {
    if (!exerciseHistory[log.exerciseId]) {
      exerciseHistory[log.exerciseId] = []
    }
    const setsArr = safeArray(log.sets)
    exerciseHistory[log.exerciseId].push({
      id: log.id,
      sessionId: log.sessionId,
      date: log.date,
      dayIndex: log.dayIndex,
      topWeightKg: round2(log.topWeightKg),
      bestReps: log.bestReps,
      e1rmKg: round2(log.e1rmKg),
      volumeKg: Math.round(log.volumeKg),
      setsCompleted: log.setsCompleted,
      primaryGroup: log.primaryGroup,
      sets: setsArr,
    })

    // Since allExerciseLogs is sorted oldest -> newest, overwriting always keeps the latest session
    lastSessionLogs[log.exerciseId] = setsArr.map((s) => ({
      weight: Number(s.weight || 0),
      reps: Number(s.reps || 0),
    }))
    lastSessionMetaByExercise[log.exerciseId] = {
      date: log.date,
      topWeightKg: round2(log.topWeightKg),
      bestReps: log.bestReps,
      volumeKg: Math.round(log.volumeKg),
      e1rmKg: round2(log.e1rmKg),
    }
  }

  // Format workoutHistory with full exercise sets attached
  const workoutHistory = sessions.map((s) => {
    const exerciseSets = {}
    for (const ex of s.exercises) {
      exerciseSets[ex.exerciseId] = safeArray(ex.sets)
    }
    return {
      id: s.id,
      date: s.date,
      dayIndex: s.dayIndex,
      dayTitle: s.dayTitle,
      durationSec: s.durationSec,
      totalVolumeKg: Math.round(s.totalVolumeKg),
      setsCompleted: s.setsCompleted,
      prsCount: s.prsCount,
      notes: s.notes,
      exerciseSets,
    }
  })

  // Format dailyLogs map & extract today's live trackers
  const dailyLogsMap = {}
  for (const d of dailyLogsList) {
    dailyLogsMap[d.date] = {
      date: d.date,
      kcal: d.kcal,
      protein: round2(d.proteinG),
      carbs: round2(d.carbsG),
      fat: round2(d.fatG),
      proteinFeedings: d.proteinFeedings,
      waterMl: d.waterMl,
      sleepHours: round2(d.sleepHours),
      sundayWalkDone: d.sundayWalkDone,
      selectedMealOptions: safeObject(d.selectedMealOptions),
      completedMealSlots: safeObject(d.completedMealSlots),
      loggedAppetiteHelpers: safeArray(d.loggedAppetiteHelpers),
      pelvicHabits: safeObject(d.pelvicHabits),
    }
  }

  const todayDaily = dailyLogsMap[todayStr] || null

  // Format disciplineLogs map
  const disciplineLogsMap = {}
  for (const d of disciplineList) {
    disciplineLogsMap[d.date] = {
      date: d.date,
      status: d.status,
      noPorn: d.noPorn,
      noFap: d.noFap,
      urgeLevel: d.urgeLevel,
      trigger: d.trigger,
      note: d.note,
    }
  }

  // Latest weight sync into profile
  const latestWeight = weightLogs[weightLogs.length - 1] || null
  const mergedProfile = {
    ...DEFAULT_PROFILE,
    ...safeObject(config.profile),
    ...(latestWeight ? { currentWeightKg: latestWeight.weightKg } : {}),
  }

  return {
    onboarded: config.onboarded,
    dayStamp: todayStr,
    theme: config.theme,
    unit: config.unit,
    rampInEnabled: config.rampInEnabled,
    pelvicSide: config.pelvicSide,
    workoutStreak: config.workoutStreak,
    profile: mergedProfile,
    customSteps: safeObject(config.customSteps),
    variantChoices: safeObject(config.variantChoices),
    swappedAlternatives: safeObject(config.swappedAlternatives),
    foodDatabase: safeArray(config.foodDatabase),
    selectedMealOptions:
      todayDaily && Object.keys(todayDaily.selectedMealOptions).length > 0
        ? todayDaily.selectedMealOptions
        : safeObject(config.selectedMealOptions),
    completedMealSlots: todayDaily ? todayDaily.completedMealSlots : {},
    loggedAppetiteHelpers: todayDaily ? todayDaily.loggedAppetiteHelpers : [],
    waterMl: todayDaily ? todayDaily.waterMl : 0,
    sleepHours: todayDaily ? todayDaily.sleepHours : 0,
    sundayWalkDone: todayDaily ? todayDaily.sundayWalkDone : false,
    pelvicHabits: todayDaily ? todayDaily.pelvicHabits : {},
    activeDrafts: safeObject(config.activeDrafts),
    lastSessionLogs,
    lastSessionMetaByExercise,
    exerciseHistory,
    workoutHistory,
    weightLogs: weightLogs.map((w) => ({
      id: w.id,
      date: w.date,
      label: w.date.slice(5),
      morningKg: w.morningKg,
      nightKg: w.nightKg,
      weightKg: w.weightKg,
      fluctuationKg: w.fluctuationKg,
      notes: w.notes,
    })),
    measurements: measurements.map((m) => ({
      id: m.id,
      date: m.date,
      shoulders: m.shoulders,
      chest: m.chest,
      waist: m.waist,
      arms: m.arms,
      thighs: m.thighs,
      vTaperRatio: m.vTaperRatio,
    })),
    dailyLogs: dailyLogsMap,
    disciplineLogs: disciplineLogsMap,
    urgeLogs: urgeLogs.map((u) => ({
      id: u.id,
      date: u.date,
      time: u.time,
      trigger: u.trigger,
      defeated: u.defeated,
    })),
    cardioLogs: cardioLogs.map((c) => ({
      id: c.id,
      date: c.date,
      durationMin: c.durationMin,
      drillsCompleted: c.drillsCompleted,
      kcalBurned: c.kcalBurned,
    })),
    pelvicLogs: pelvicLogs.map((p) => ({
      id: p.id,
      date: p.date,
      highSide: p.highSide,
      durationMin: p.durationMin,
      setsCompleted: p.setsCompleted,
    })),
  }
}

// ============================================================================
// ROLLING DAILY CLOUD BACKUP SNAPSHOT (14-DAY RETENTION)
// ============================================================================

async function createCloudBackupSnapshot(force = false) {
  const todayStr = getISTDateStr()
  if (!force) {
    const existing = await prisma.cloudBackup.findUnique({
      where: { snapshotDate: todayStr },
      select: { id: true, updatedAt: true },
    })
    if (existing && Date.now() - new Date(existing.updatedAt).getTime() < 30 * 60 * 1000) {
      return null
    }
  }

  const fullState = await buildFullAppState()
  const meta = {
    snapshotDate: todayStr,
    savedAt: new Date().toISOString(),
    workoutsCount: fullState.workoutHistory.length,
    weightLogsCount: fullState.weightLogs.length,
    dailyLogsCount: Object.keys(fullState.dailyLogs).length,
    disciplineDaysCount: Object.keys(fullState.disciplineLogs).length,
    measurementsCount: fullState.measurements.length,
  }

  await prisma.cloudBackup.upsert({
    where: { snapshotDate: todayStr },
    update: { payload: fullState, meta },
    create: { snapshotDate: todayStr, payload: fullState, meta },
  })

  const all = await prisma.cloudBackup.findMany({
    orderBy: { snapshotDate: 'desc' },
    select: { id: true },
  })

  if (all.length > MAX_CLOUD_BACKUPS) {
    const toDelete = all.slice(MAX_CLOUD_BACKUPS).map((b) => b.id)
    await prisma.cloudBackup.deleteMany({ where: { id: { in: toDelete } } })
  }

  return meta
}

// ============================================================================
// WEEKLY & MONTHLY COMPLETE OVERVIEW ENGINE (DIRECTLY FROM POSTGRES TABLES)
// ============================================================================

async function computeOverviewFromDB(period = 'weekly') {
  const mode = period === 'monthly' ? 'monthly' : 'weekly'
  const todayStr = getISTDateStr()
  const currentPeriodKey = getPeriodKey(todayStr, mode)

  const [
    config,
    sessions,
    exerciseLogs,
    weights,
    dailyLogs,
    disciplines,
    urges,
    cardios,
    pelvics,
    measurements,
  ] = await Promise.all([
    ensureUserConfig(),
    prisma.workoutSession.findMany({ orderBy: { date: 'asc' } }),
    prisma.exerciseLog.findMany({ orderBy: { date: 'asc' } }),
    prisma.weightLog.findMany({ orderBy: { date: 'asc' } }),
    prisma.dailyLog.findMany({ orderBy: { date: 'asc' } }),
    prisma.disciplineLog.findMany({ orderBy: { date: 'asc' } }),
    prisma.urgeLog.findMany({ orderBy: { date: 'asc' } }),
    prisma.cardioLog.findMany({ orderBy: { date: 'asc' } }),
    prisma.pelvicLog.findMany({ orderBy: { date: 'asc' } }),
    prisma.bodyMeasurement.findMany({ orderBy: { date: 'asc' } }),
  ])

  const buckets = new Map()
  const ensureBucket = (key) => {
    if (!key) return null
    if (!buckets.has(key)) {
      const endDate = mode === 'weekly' ? addDaysToDateStr(key, 6) : `${key}-31`
      buckets.set(key, {
        periodKey: key,
        label: mode === 'weekly' ? `${key.slice(5)} → ${endDate.slice(5)}` : formatMonthLabel(key),
        startDate: mode === 'weekly' ? key : `${key}-01`,
        endDate,
        sessions: [],
        exerciseLogs: [],
        weights: [],
        dailyLogs: [],
        disciplines: [],
        urges: [],
        cardios: [],
        pelvics: [],
        measurements: [],
      })
    }
    return buckets.get(key)
  }

  for (const s of sessions) ensureBucket(getPeriodKey(s.date, mode))?.sessions.push(s)
  for (const ex of exerciseLogs) ensureBucket(getPeriodKey(ex.date, mode))?.exerciseLogs.push(ex)
  for (const w of weights) ensureBucket(getPeriodKey(w.date, mode))?.weights.push(w)
  for (const d of dailyLogs) ensureBucket(getPeriodKey(d.date, mode))?.dailyLogs.push(d)
  for (const c of disciplines) ensureBucket(getPeriodKey(c.date, mode))?.disciplines.push(c)
  for (const u of urges) ensureBucket(getPeriodKey(u.date, mode))?.urges.push(u)
  for (const c of cardios) ensureBucket(getPeriodKey(c.date, mode))?.cardios.push(c)
  for (const p of pelvics) ensureBucket(getPeriodKey(p.date, mode))?.pelvics.push(p)
  for (const m of measurements) ensureBucket(getPeriodKey(m.date, mode))?.measurements.push(m)

  ensureBucket(currentPeriodKey)

  const profile = { ...DEFAULT_PROFILE, ...safeObject(config.profile) }
  const targetKcal = Number(profile.targetCalories || 2900)
  const targetWaterMl = Number(profile.targetWaterMl || 3500)
  const proteinFloor = 110

  const sortedKeys = Array.from(buckets.keys()).sort((a, b) => a.localeCompare(b))

  const timeline = sortedKeys.map((key, idx) => {
    const b = buckets.get(key)

    // 1. Workout Metrics
    const totalVolumeKg = Math.round(
      b.sessions.reduce((sum, s) => sum + Number(s.totalVolumeKg || 0), 0)
    )
    const totalSets = b.sessions.reduce((sum, s) => sum + Number(s.setsCompleted || 0), 0)
    const totalDurationMin = Math.round(
      b.sessions.reduce((sum, s) => sum + Number(s.durationSec || 0), 0) / 60
    )
    const totalPRs = b.sessions.reduce((sum, s) => sum + Number(s.prsCount || 0), 0)
    const uniqueWorkoutDays = new Set(b.sessions.map((s) => s.date)).size
    const splitBreakdown = {}
    for (const s of b.sessions) {
      splitBreakdown[s.dayTitle] = (splitBreakdown[s.dayTitle] || 0) + 1
    }

    // Top Muscle Groups trained in this period
    const muscleSetsMap = {}
    for (const ex of b.exerciseLogs) {
      muscleSetsMap[ex.primaryGroup] = (muscleSetsMap[ex.primaryGroup] || 0) + ex.setsCompleted
    }
    const topMuscles = Object.entries(muscleSetsMap)
      .map(([muscle, sets]) => ({ muscle, sets }))
      .sort((a, c) => c.sets - a.sets)
      .slice(0, 5)

    // Top Lift by Volume in this period
    let topLift = null
    for (const ex of b.exerciseLogs) {
      if (!topLift || ex.volumeKg > topLift.volumeKg) {
        topLift = {
          exerciseId: ex.exerciseId,
          name: ex.exerciseName,
          topWeightKg: round2(ex.topWeightKg),
          bestReps: ex.bestReps,
          volumeKg: Math.round(ex.volumeKg),
          date: ex.date,
        }
      }
    }

    // 2. Weight Metrics
    const morningVals = b.weights.filter((w) => w.morningKg != null).map((w) => w.morningKg)
    const nightVals = b.weights.filter((w) => w.nightKg != null).map((w) => w.nightKg)
    const primaryVals = b.weights.map((w) => w.weightKg)

    const avgMorningKg = morningVals.length
      ? round2(morningVals.reduce((a, c) => a + c, 0) / morningVals.length)
      : primaryVals.length
        ? round2(primaryVals.reduce((a, c) => a + c, 0) / primaryVals.length)
        : null
    const avgNightKg = nightVals.length
      ? round2(nightVals.reduce((a, c) => a + c, 0) / nightVals.length)
      : null
    const startWeightKg = primaryVals.length ? round2(primaryVals[0]) : null
    const endWeightKg = primaryVals.length ? round2(primaryVals[primaryVals.length - 1]) : null
    const netWeightChangeKg =
      startWeightKg !== null && endWeightKg !== null ? round2(endWeightKg - startWeightKg) : null

    // 3. Nutrition, Water & Sleep Metrics
    const validNutrition = b.dailyLogs.filter((d) => d.kcal > 0 || d.proteinG > 0)
    const validWater = b.dailyLogs.filter((d) => d.waterMl > 0)
    const validSleep = b.dailyLogs.filter((d) => d.sleepHours > 0)

    const avgKcal = validNutrition.length
      ? Math.round(validNutrition.reduce((s, d) => s + d.kcal, 0) / validNutrition.length)
      : 0
    const avgProteinG = validNutrition.length
      ? Math.round(validNutrition.reduce((s, d) => s + d.proteinG, 0) / validNutrition.length)
      : 0
    const avgCarbsG = validNutrition.length
      ? Math.round(validNutrition.reduce((s, d) => s + d.carbsG, 0) / validNutrition.length)
      : 0
    const avgFatG = validNutrition.length
      ? Math.round(validNutrition.reduce((s, d) => s + d.fatG, 0) / validNutrition.length)
      : 0
    const avgWaterMl = validWater.length
      ? Math.round(validWater.reduce((s, d) => s + d.waterMl, 0) / validWater.length)
      : 0
    const avgSleepHours = validSleep.length
      ? round2(validSleep.reduce((s, d) => s + d.sleepHours, 0) / validSleep.length)
      : 0

    const proteinFloorHitDays = validNutrition.filter((d) => d.proteinG >= proteinFloor).length
    const calorieGoalHitDays = validNutrition.filter(
      (d) => d.kcal >= Math.round(targetKcal * 0.9)
    ).length
    const waterGoalHitDays = validWater.filter((d) => d.waterMl >= targetWaterMl).length

    // 4. Clean Discipline Metrics
    const cleanDays = b.disciplines.filter((d) => d.status === 'clean').length
    const relapseDays = b.disciplines.filter((d) => d.status === 'relapse').length
    const disciplineLoggedDays = cleanDays + relapseDays
    const cleanRatePct =
      disciplineLoggedDays > 0 ? Math.round((cleanDays / disciplineLoggedDays) * 100) : 0

    // 5. Cardio & Pelvic Recovery
    const cardioSessions = b.cardios.length
    const cardioMinutes = b.cardios.reduce((s, c) => s + c.durationMin, 0)
    const pelvicSessions = b.pelvics.length
    const pelvicSets = b.pelvics.reduce((s, p) => s + p.setsCompleted, 0)

    // 6. Body Measurements
    const latestMeas = b.measurements[b.measurements.length - 1] || null

    // 7. Overall Consistency Score (0 - 100)
    const targetSessions = mode === 'weekly' ? 6 : 24
    const workoutScore = Math.min(100, Math.round((uniqueWorkoutDays / targetSessions) * 100))
    const nutritionScore =
      validNutrition.length > 0
        ? Math.min(100, Math.round((proteinFloorHitDays / validNutrition.length) * 100))
        : 0
    const disciplineScore = disciplineLoggedDays > 0 ? cleanRatePct : 0

    const activePillars = [
      uniqueWorkoutDays > 0 ? workoutScore : null,
      validNutrition.length > 0 ? nutritionScore : null,
      disciplineLoggedDays > 0 ? disciplineScore : null,
    ].filter((v) => v !== null)

    const overallScore = activePillars.length
      ? Math.round(activePillars.reduce((a, c) => a + c, 0) / activePillars.length)
      : 0

    return {
      index: idx + 1,
      periodKey: b.periodKey,
      label: b.label,
      startDate: b.startDate,
      endDate: b.endDate,
      isCurrent: b.periodKey === currentPeriodKey,
      overallScore,
      workout: {
        sessions: b.sessions.length,
        uniqueDays: uniqueWorkoutDays,
        targetSessions,
        adherencePct: workoutScore,
        totalVolumeKg,
        totalSets,
        totalDurationMin,
        totalPRs,
        splitBreakdown,
        topMuscles,
        topLift,
      },
      weight: {
        daysLogged: b.weights.length,
        avgMorningKg,
        avgNightKg,
        startWeightKg,
        endWeightKg,
        netWeightChangeKg,
      },
      nutrition: {
        daysLogged: validNutrition.length,
        avgKcal,
        avgProteinG,
        avgCarbsG,
        avgFatG,
        avgWaterMl,
        avgSleepHours,
        proteinFloorHitDays,
        calorieGoalHitDays,
        waterGoalHitDays,
      },
      discipline: {
        loggedDays: disciplineLoggedDays,
        cleanDays,
        relapseDays,
        cleanRatePct,
        urgesDefeated: b.urges.length,
      },
      recovery: {
        cardioSessions,
        cardioMinutes,
        pelvicSessions,
        pelvicSets,
      },
      body: {
        vTaperRatio: latestMeas ? latestMeas.vTaperRatio : null,
        latestMeasurement: latestMeas,
      },
    }
  })

  const currentIdx = timeline.findIndex((t) => t.isCurrent)
  const current = currentIdx >= 0 ? timeline[currentIdx] : timeline[timeline.length - 1] || null
  const previous = currentIdx > 0 ? timeline[currentIdx - 1] : null

  let deltas = null
  const highlights = []

  if (current && previous) {
    const volumeDiffKg = current.workout.totalVolumeKg - previous.workout.totalVolumeKg
    const volumeDiffPct =
      previous.workout.totalVolumeKg > 0
        ? round2((volumeDiffKg / previous.workout.totalVolumeKg) * 100)
        : null
    const weightAvgDiffKg =
      current.weight.avgMorningKg !== null && previous.weight.avgMorningKg !== null
        ? round2(current.weight.avgMorningKg - previous.weight.avgMorningKg)
        : null

    deltas = {
      sessionsDiff: current.workout.sessions - previous.workout.sessions,
      volumeDiffKg,
      volumeDiffPct,
      setsDiff: current.workout.totalSets - previous.workout.totalSets,
      prsDiff: current.workout.totalPRs - previous.workout.totalPRs,
      weightAvgDiffKg,
      avgKcalDiff: current.nutrition.avgKcal - previous.nutrition.avgKcal,
      avgProteinDiffG: current.nutrition.avgProteinG - previous.nutrition.avgProteinG,
      avgWaterDiffMl: current.nutrition.avgWaterMl - previous.nutrition.avgWaterMl,
      cleanRateDiffPct: current.discipline.cleanRatePct - previous.discipline.cleanRatePct,
      cleanDaysDiff: current.discipline.cleanDays - previous.discipline.cleanDays,
      overallScoreDiff: current.overallScore - previous.overallScore,
    }

    const periodWord = mode === 'weekly' ? 'pichle hafte' : 'pichle mahine'
    if (volumeDiffKg > 0) {
      highlights.push(
        `Workout volume ${periodWord} se +${volumeDiffKg} kg${volumeDiffPct !== null ? ` (+${volumeDiffPct}%)` : ''} upar hai.`
      )
    } else if (volumeDiffKg < 0 && current.workout.sessions > 0) {
      highlights.push(
        `Workout volume ${periodWord} se ${volumeDiffKg} kg kam hai — bache hue sessions mein progressive overload push karo.`
      )
    }

    if (weightAvgDiffKg !== null) {
      highlights.push(
        `Morning avg weight ${periodWord} se ${weightAvgDiffKg >= 0 ? '+' : ''}${weightAvgDiffKg} kg change hua.`
      )
    }

    if (current.nutrition.avgProteinG >= 130) {
      highlights.push(`Protein solid hai: avg ${current.nutrition.avgProteinG}g/day (target 130g hit!).`)
    } else if (current.nutrition.daysLogged > 0 && current.nutrition.avgProteinG < 110) {
      highlights.push(
        `Protein avg ${current.nutrition.avgProteinG}g/day hai — 110g floor cross karne ke liye eggs/soya/paneer add karo.`
      )
    }

    if (current.discipline.loggedDays > 0) {
      highlights.push(
        `Clean Discipline: ${current.discipline.cleanDays}/${current.discipline.loggedDays} days (${current.discipline.cleanRatePct}%) clean.`
      )
    }
  }

  return {
    period: mode,
    today: todayStr,
    generatedAt: new Date().toISOString(),
    current,
    previous,
    deltas,
    highlights,
    timeline: [...timeline].reverse(),
  }
}

// ============================================================================
// ROUTE 1: HEALTH & DATABASE STATUS
// ============================================================================

app.get('/api/health', async (_req, res) => {
  try {
    const start = Date.now()
    await prisma.$queryRaw`SELECT 1`
    const latencyMs = Date.now() - start

    const [workouts, weights, dailyLogs, cleanLogs] = await Promise.all([
      prisma.workoutSession.count(),
      prisma.weightLog.count(),
      prisma.dailyLog.count(),
      prisma.disciplineLog.count(),
    ])

    res.json({
      ok: true,
      service: 'VTaper Dedicated Relational API',
      dbLatencyMs: latencyMs,
      serverDateIST: getISTDateStr(),
      counts: { workouts, weights, dailyLogs, cleanLogs },
    })
  } catch (error) {
    console.error('Health check failed:', error)
    res.status(500).json({ ok: false, error: 'Database connection failed' })
  }
})

// ============================================================================
// ROUTE 2: BOOTSTRAP FULL APP STATE (1 FAST CALL ON APP OPEN)
// ============================================================================

app.get('/api/bootstrap', async (_req, res, next) => {
  try {
    const state = await buildFullAppState()
    res.json({
      ok: true,
      serverDateIST: getISTDateStr(),
      syncedAt: new Date().toISOString(),
      state,
    })
  } catch (error) {
    next(error)
  }
})

// ============================================================================
// ROUTE 3: UPDATE USER CONFIG & LIVE WORKOUT DRAFTS
// ============================================================================

app.put('/api/config', async (req, res, next) => {
  try {
    await ensureUserConfig()
    const body = safeObject(req.body)
    const dataToUpdate = {}

    if (typeof body.onboarded === 'boolean') dataToUpdate.onboarded = body.onboarded
    if (typeof body.dayStamp === 'string') dataToUpdate.dayStamp = body.dayStamp
    if (body.theme === 'dark' || body.theme === 'light') dataToUpdate.theme = body.theme
    if (body.unit === 'kg' || body.unit === 'lb') dataToUpdate.unit = body.unit
    if (typeof body.rampInEnabled === 'boolean') dataToUpdate.rampInEnabled = body.rampInEnabled
    if (body.pelvicSide === 'right' || body.pelvicSide === 'left') {
      dataToUpdate.pelvicSide = body.pelvicSide
    }
    if (Number.isInteger(body.workoutStreak) && body.workoutStreak >= 0) {
      dataToUpdate.workoutStreak = body.workoutStreak
    }
    if (isPlainObject(body.profile)) dataToUpdate.profile = { ...DEFAULT_PROFILE, ...body.profile }
    if (isPlainObject(body.customSteps)) dataToUpdate.customSteps = body.customSteps
    if (isPlainObject(body.variantChoices)) dataToUpdate.variantChoices = body.variantChoices
    if (isPlainObject(body.swappedAlternatives)) {
      dataToUpdate.swappedAlternatives = body.swappedAlternatives
    }
    if (isPlainObject(body.selectedMealOptions)) {
      dataToUpdate.selectedMealOptions = body.selectedMealOptions
    }
    if (Array.isArray(body.foodDatabase)) dataToUpdate.foodDatabase = body.foodDatabase
    if (isPlainObject(body.activeDrafts)) dataToUpdate.activeDrafts = body.activeDrafts

    const updated = await prisma.userConfig.update({
      where: { id: CONFIG_ID },
      data: dataToUpdate,
    })

    res.json({ ok: true, updatedAt: updated.updatedAt })
  } catch (error) {
    next(error)
  }
})

// ============================================================================
// ROUTE 4: COMPLETE WORKOUT SESSION (ATOMIC DB SAVE + PR DETECTION)
// ============================================================================

app.post('/api/workouts/complete', async (req, res, next) => {
  try {
    const body = safeObject(req.body)
    const date = isValidDateStr(body.date) ? body.date : getISTDateStr()
    const dayIndex = Number(body.dayIndex)
    const dayTitle = String(body.dayTitle || 'Workout Session')
    const durationSec = Math.max(0, Math.round(Number(body.durationSec || 0)))
    const notes = String(body.notes || '')
    const exercisesInput = safeArray(body.exercises)

    if (!Number.isInteger(dayIndex) || dayIndex < 0 || dayIndex > 6) {
      res.status(400).json({ ok: false, error: 'Valid dayIndex (0-6) is required.' })
      return
    }
    if (exercisesInput.length === 0) {
      res.status(400).json({ ok: false, error: 'At least one completed exercise is required.' })
      return
    }

    const result = await prisma.$transaction(
      async (tx) => {
        const config = await ensureUserConfig(tx)
        let totalVolumeKg = 0
        let totalSetsCompleted = 0
        const prsAchieved = []
        const preparedExercises = []

        for (const ex of exercisesInput) {
          const exerciseId = String(ex.exerciseId || '')
          const sets = safeArray(ex.sets)
            .map((s, idx) => ({
              setNumber: Number(s.setNumber || idx + 1),
              weight: round2(Number(s.weight || 0)),
              reps: Math.max(0, Math.round(Number(s.reps || 0))),
            }))
            .filter((s) => s.reps > 0 || s.weight > 0)

          if (!exerciseId || sets.length === 0) continue

          const isAssisted = Boolean(ex.isAssisted)
          const unilateralMult = ex.unilateral ? 2 : 1

          let exVolume = 0
          let bestWeight = isAssisted ? Infinity : 0
          let bestRepsAtBest = 0

          for (const s of sets) {
            exVolume += s.weight * s.reps * unilateralMult
            if (isAssisted) {
              if (s.weight < bestWeight || (s.weight === bestWeight && s.reps > bestRepsAtBest)) {
                bestWeight = s.weight
                bestRepsAtBest = s.reps
              }
            } else {
              if (s.weight > bestWeight || (s.weight === bestWeight && s.reps > bestRepsAtBest)) {
                bestWeight = s.weight
                bestRepsAtBest = s.reps
              }
            }
          }

          const cleanTopWeight = bestWeight === Infinity ? 0 : round2(bestWeight)
          const e1rmKg = computeE1RM(cleanTopWeight, bestRepsAtBest, isAssisted)
          const cleanVolume = Math.round(exVolume)

          // Compare against ALL previous DB records for accurate PR detection
          const prevLogs = await tx.exerciseLog.findMany({
            where: { exerciseId },
            select: { topWeightKg: true, bestReps: true },
          })

          if (prevLogs.length > 0) {
            if (isAssisted) {
              let bestPrevW = Infinity
              let bestPrevR = 0
              for (const p of prevLogs) {
                if (
                  p.topWeightKg < bestPrevW ||
                  (p.topWeightKg === bestPrevW && p.bestReps > bestPrevR)
                ) {
                  bestPrevW = p.topWeightKg
                  bestPrevR = p.bestReps
                }
              }
              if (
                cleanTopWeight < bestPrevW ||
                (cleanTopWeight === bestPrevW && bestRepsAtBest > bestPrevR)
              ) {
                prsAchieved.push({
                  exerciseId,
                  exerciseName: String(ex.exerciseName || exerciseId),
                  weightKg: cleanTopWeight,
                  reps: bestRepsAtBest,
                  isAssisted: true,
                })
              }
            } else if (cleanTopWeight > 0) {
              let bestPrevW = 0
              let bestPrevR = 0
              for (const p of prevLogs) {
                if (
                  p.topWeightKg > bestPrevW ||
                  (p.topWeightKg === bestPrevW && p.bestReps > bestPrevR)
                ) {
                  bestPrevW = p.topWeightKg
                  bestPrevR = p.bestReps
                }
              }
              if (
                cleanTopWeight > bestPrevW ||
                (cleanTopWeight === bestPrevW && bestRepsAtBest > bestPrevR)
              ) {
                prsAchieved.push({
                  exerciseId,
                  exerciseName: String(ex.exerciseName || exerciseId),
                  weightKg: cleanTopWeight,
                  reps: bestRepsAtBest,
                  isAssisted: false,
                })
              }
            }
          }

          totalVolumeKg += cleanVolume
          totalSetsCompleted += sets.length

          preparedExercises.push({
            date,
            dayIndex,
            exerciseId,
            exerciseName: String(ex.exerciseName || exerciseId),
            primaryGroup: String(ex.primaryGroup || 'Other'),
            isAssisted,
            sets,
            topWeightKg: cleanTopWeight,
            bestReps: bestRepsAtBest,
            e1rmKg,
            volumeKg: cleanVolume,
            setsCompleted: sets.length,
          })
        }

        if (preparedExercises.length === 0) {
          throw new Error('No valid completed sets found to save.')
        }

        const session = await tx.workoutSession.create({
          data: {
            date,
            dayIndex,
            dayTitle,
            durationSec,
            totalVolumeKg: Math.round(totalVolumeKg),
            setsCompleted: totalSetsCompleted,
            prsCount: prsAchieved.length,
            notes,
            exercises: {
              create: preparedExercises,
            },
          },
          include: { exercises: true },
        })

        // Update streak & optional next activeDrafts sent by frontend
        const updateConfigData = {
          workoutStreak: config.workoutStreak + 1,
        }
        if (isPlainObject(body.nextActiveDrafts)) {
          updateConfigData.activeDrafts = body.nextActiveDrafts
        }

        const updatedConfig = await tx.userConfig.update({
          where: { id: CONFIG_ID },
          data: updateConfigData,
        })

        return { session, prsAchieved, workoutStreak: updatedConfig.workoutStreak }
      },
      { timeout: 15000 }
    )

    // Non-blocking daily cloud backup
    createCloudBackupSnapshot(false).catch((err) => console.error('Backup warn:', err.message))

    res.json({
      ok: true,
      session: result.session,
      prsAchieved: result.prsAchieved,
      workoutStreak: result.workoutStreak,
    })
  } catch (error) {
    next(error)
  }
})

// ============================================================================
// ROUTE 5: WORKOUT DAY EXACT RECALL (WHEN MONDAY / PUSH A RETURNS!)
// ============================================================================

app.get('/api/workouts/recall/:dayIndex', async (req, res, next) => {
  try {
    const dayIndex = Number(req.params.dayIndex)
    if (!Number.isInteger(dayIndex) || dayIndex < 0 || dayIndex > 6) {
      res.status(400).json({ ok: false, error: 'dayIndex must be 0..6' })
      return
    }

    const todayStr = getISTDateStr()

    const [daySessions, dayExerciseLogs] = await Promise.all([
      prisma.workoutSession.findMany({
        where: { dayIndex },
        orderBy: [{ date: 'desc' }, { createdAt: 'desc' }],
        take: 10,
        include: { exercises: true },
      }),
      prisma.exerciseLog.findMany({
        where: { dayIndex },
        orderBy: [{ date: 'asc' }, { createdAt: 'asc' }],
      }),
    ])

    const lastSession = daySessions[0] || null
    const previousSession = daySessions[1] || null

    // Group every exercise's historical sessions for this day
    const groupedByEx = new Map()
    for (const log of dayExerciseLogs) {
      if (!groupedByEx.has(log.exerciseId)) {
        groupedByEx.set(log.exerciseId, [])
      }
      groupedByEx.get(log.exerciseId).push(log)
    }

    const exercises = {}
    for (const [exerciseId, logs] of groupedByEx.entries()) {
      const latest = logs[logs.length - 1]
      const secondLast = logs.length >= 2 ? logs[logs.length - 2] : null
      const isAssisted = Boolean(latest?.isAssisted)

      let bestWeightKg = isAssisted ? Infinity : 0
      let bestRepsAtBest = 0
      let bestE1RM = 0

      for (const l of logs) {
        if (isAssisted) {
          if (
            l.topWeightKg < bestWeightKg ||
            (l.topWeightKg === bestWeightKg && l.bestReps > bestRepsAtBest)
          ) {
            bestWeightKg = l.topWeightKg
            bestRepsAtBest = l.bestReps
          }
        } else {
          if (
            l.topWeightKg > bestWeightKg ||
            (l.topWeightKg === bestWeightKg && l.bestReps > bestRepsAtBest)
          ) {
            bestWeightKg = l.topWeightKg
            bestRepsAtBest = l.bestReps
          }
        }
        if (l.e1rmKg > bestE1RM) bestE1RM = l.e1rmKg
      }

      const lastSets = safeArray(latest.sets)
      const weightDeltaKg = secondLast
        ? round2(
            isAssisted
              ? secondLast.topWeightKg - latest.topWeightKg
              : latest.topWeightKg - secondLast.topWeightKg
          )
        : null

      exercises[exerciseId] = {
        exerciseId,
        exerciseName: latest.exerciseName,
        isAssisted,
        lastDate: latest.date,
        daysAgo: daysBetweenDateStr(latest.date, todayStr),
        lastSets,
        lastTopWeightKg: round2(latest.topWeightKg),
        lastBestReps: latest.bestReps,
        lastVolumeKg: Math.round(latest.volumeKg),
        lastE1RM: round2(latest.e1rmKg),
        prevDate: secondLast?.date || null,
        prevTopWeightKg: secondLast ? round2(secondLast.topWeightKg) : null,
        weightDeltaFromPrevKg: weightDeltaKg,
        allTimeBestWeightKg: bestWeightKg === Infinity ? 0 : round2(bestWeightKg),
        allTimeBestReps: bestRepsAtBest,
        allTimeBestE1RM: round2(bestE1RM),
        sessionsLogged: logs.length,
        recentSessions: logs.slice(-4).reverse().map((l) => ({
          date: l.date,
          topWeightKg: round2(l.topWeightKg),
          bestReps: l.bestReps,
          volumeKg: Math.round(l.volumeKg),
          sets: safeArray(l.sets),
        })),
      }
    }

    res.json({
      ok: true,
      dayIndex,
      totalCompletedSessions: daySessions.length,
      lastSession: lastSession
        ? {
            id: lastSession.id,
            date: lastSession.date,
            daysAgo: daysBetweenDateStr(lastSession.date, todayStr),
            dayTitle: lastSession.dayTitle,
            totalVolumeKg: Math.round(lastSession.totalVolumeKg),
            setsCompleted: lastSession.setsCompleted,
            durationSec: lastSession.durationSec,
            prsCount: lastSession.prsCount,
          }
        : null,
      previousSession: previousSession
        ? {
            date: previousSession.date,
            totalVolumeKg: Math.round(previousSession.totalVolumeKg),
            setsCompleted: previousSession.setsCompleted,
          }
        : null,
      volumeDiffKg:
        lastSession && previousSession
          ? Math.round(lastSession.totalVolumeKg - previousSession.totalVolumeKg)
          : null,
      exercises,
    })
  } catch (error) {
    next(error)
  }
})

app.get('/api/workouts/history', async (req, res, next) => {
  try {
    const limit = Math.min(200, Math.max(1, Number(req.query.limit || 50)))
    const sessions = await prisma.workoutSession.findMany({
      orderBy: [{ date: 'desc' }, { createdAt: 'desc' }],
      take: limit,
      include: { exercises: true },
    })
    res.json({ ok: true, count: sessions.length, sessions })
  } catch (error) {
    next(error)
  }
})

app.delete('/api/workouts/:id', async (req, res, next) => {
  try {
    await prisma.workoutSession.delete({ where: { id: req.params.id } })
    res.json({ ok: true, deletedId: req.params.id })
  } catch (error) {
    next(error)
  }
})

// ============================================================================
// ROUTE 6: DAILY NUTRITION, WATER, SLEEP & HABITS LOG (NEVER LOST ON ROLLOVER)
// ============================================================================

app.put('/api/daily/:date', async (req, res, next) => {
  try {
    const date = req.params.date
    if (!isValidDateStr(date)) {
      res.status(400).json({ ok: false, error: 'Invalid date format. Use YYYY-MM-DD.' })
      return
    }

    const body = safeObject(req.body)
    const payload = {
      kcal: Math.max(0, Math.round(Number(body.kcal || 0))),
      proteinG: round2(Math.max(0, Number(body.protein || body.proteinG || 0))),
      carbsG: round2(Math.max(0, Number(body.carbs || body.carbsG || 0))),
      fatG: round2(Math.max(0, Number(body.fat || body.fatG || 0))),
      proteinFeedings: Math.max(0, Math.round(Number(body.proteinFeedings || 0))),
      waterMl: Math.max(0, Math.round(Number(body.waterMl || 0))),
      sleepHours: round2(Math.max(0, Number(body.sleepHours || 0))),
      sundayWalkDone: Boolean(body.sundayWalkDone),
      selectedMealOptions: safeObject(body.selectedMealOptions),
      completedMealSlots: safeObject(body.completedMealSlots),
      loggedAppetiteHelpers: safeArray(body.loggedAppetiteHelpers),
      pelvicHabits: safeObject(body.pelvicHabits),
    }

    const saved = await prisma.dailyLog.upsert({
      where: { date },
      update: payload,
      create: { date, ...payload },
    })

    // Also keep latest selectedMealOptions in UserConfig as default template for next day
    if (Object.keys(payload.selectedMealOptions).length > 0) {
      await prisma.userConfig
        .update({
          where: { id: CONFIG_ID },
          data: { selectedMealOptions: payload.selectedMealOptions },
        })
        .catch(() => {})
    }

    res.json({ ok: true, dailyLog: saved })
  } catch (error) {
    next(error)
  }
})

// ============================================================================
// ROUTE 7: DUAL MORNING / BEDTIME WEIGHT LOGS
// ============================================================================

app.put('/api/weights/:date', async (req, res, next) => {
  try {
    const date = req.params.date
    if (!isValidDateStr(date)) {
      res.status(400).json({ ok: false, error: 'Invalid date format. Use YYYY-MM-DD.' })
      return
    }

    const body = safeObject(req.body)
    const morningKg =
      body.morningKg != null && Number(body.morningKg) > 0 ? round2(body.morningKg) : null
    const nightKg = body.nightKg != null && Number(body.nightKg) > 0 ? round2(body.nightKg) : null
    const primaryKg = morningKg || nightKg || round2(body.weightKg)

    if (!primaryKg || primaryKg <= 0) {
      res.status(400).json({ ok: false, error: 'Valid morningKg or nightKg is required.' })
      return
    }

    const fluctuationKg = morningKg !== null && nightKg !== null ? round2(nightKg - morningKg) : null
    const notes = String(body.notes || '').trim()

    const saved = await prisma.weightLog.upsert({
      where: { date },
      update: { morningKg, nightKg, weightKg: primaryKg, fluctuationKg, notes },
      create: { date, morningKg, nightKg, weightKg: primaryKg, fluctuationKg, notes },
    })

    // Keep UserConfig profile currentWeightKg & startWeightKg synced
    const [firstLog, latestLog, config] = await Promise.all([
      prisma.weightLog.findFirst({ orderBy: { date: 'asc' } }),
      prisma.weightLog.findFirst({ orderBy: { date: 'desc' } }),
      ensureUserConfig(),
    ])
    const prevProfile = { ...DEFAULT_PROFILE, ...safeObject(config.profile) }
    await prisma.userConfig.update({
      where: { id: CONFIG_ID },
      data: {
        profile: {
          ...prevProfile,
          startWeightKg:
            prevProfile.startWeightKg > 0
              ? prevProfile.startWeightKg
              : firstLog?.weightKg || primaryKg,
          currentWeightKg: latestLog?.weightKg || primaryKg,
        },
      },
    })

    createCloudBackupSnapshot(false).catch(() => {})
    res.json({ ok: true, weightLog: saved })
  } catch (error) {
    next(error)
  }
})

app.delete('/api/weights/:date', async (req, res, next) => {
  try {
    const date = req.params.date
    await prisma.weightLog.delete({ where: { date } })
    res.json({ ok: true, deletedDate: date })
  } catch (error) {
    next(error)
  }
})

// ============================================================================
// ROUTE 8: BODY MEASUREMENTS (V-TAPER RATIO)
// ============================================================================

app.post('/api/measurements', async (req, res, next) => {
  try {
    const body = safeObject(req.body)
    const date = isValidDateStr(body.date) ? body.date : getISTDateStr()
    const shoulders = round2(body.shoulders)
    const chest = round2(body.chest)
    const waist = round2(body.waist)
    const arms = round2(body.arms)
    const thighs = round2(body.thighs)

    if (shoulders <= 0 || waist <= 0) {
      res.status(400).json({ ok: false, error: 'Shoulders and waist (cm) are required.' })
      return
    }

    const vTaperRatio = round2(shoulders / waist)
    const saved = await prisma.bodyMeasurement.create({
      data: { date, shoulders, chest, waist, arms, thighs, vTaperRatio },
    })

    res.json({ ok: true, measurement: saved })
  } catch (error) {
    next(error)
  }
})

app.delete('/api/measurements/:id', async (req, res, next) => {
  try {
    await prisma.bodyMeasurement.delete({ where: { id: req.params.id } })
    res.json({ ok: true, deletedId: req.params.id })
  } catch (error) {
    next(error)
  }
})

// ============================================================================
// ROUTE 9: CLEAN DISCIPLINE & URGES DEFEATED
// ============================================================================

app.put('/api/discipline/:date', async (req, res, next) => {
  try {
    const date = req.params.date
    if (!isValidDateStr(date)) {
      res.status(400).json({ ok: false, error: 'Invalid date format. Use YYYY-MM-DD.' })
      return
    }

    const body = safeObject(req.body)
    const status = body.status === 'relapse' ? 'relapse' : 'clean'
    const payload = {
      status,
      noPorn: status === 'clean',
      noFap: status === 'clean',
      urgeLevel: Math.min(10, Math.max(0, Math.round(Number(body.urgeLevel || 0)))),
      trigger: String(body.trigger || '').trim(),
      note: String(body.note || '').trim(),
    }

    const saved = await prisma.disciplineLog.upsert({
      where: { date },
      update: payload,
      create: { date, ...payload },
    })

    createCloudBackupSnapshot(false).catch(() => {})
    res.json({ ok: true, disciplineLog: saved })
  } catch (error) {
    next(error)
  }
})

app.delete('/api/discipline/:date', async (req, res, next) => {
  try {
    await prisma.disciplineLog.delete({ where: { date: req.params.date } })
    res.json({ ok: true, deletedDate: req.params.date })
  } catch (error) {
    next(error)
  }
})

app.post('/api/urges', async (req, res, next) => {
  try {
    const body = safeObject(req.body)
    const date = isValidDateStr(body.date) ? body.date : getISTDateStr()
    const saved = await prisma.urgeLog.create({
      data: {
        date,
        time: String(body.time || ''),
        trigger: String(body.trigger || 'Instant Control'),
        defeated: body.defeated !== false,
      },
    })
    res.json({ ok: true, urgeLog: saved })
  } catch (error) {
    next(error)
  }
})

// ============================================================================
// ROUTE 10: CARDIO & PELVIC REHAB LOGS
// ============================================================================

app.put('/api/cardio/:date', async (req, res, next) => {
  try {
    const date = req.params.date
    if (!isValidDateStr(date)) {
      res.status(400).json({ ok: false, error: 'Invalid date format. Use YYYY-MM-DD.' })
      return
    }

    const body = safeObject(req.body)
    const payload = {
      durationMin: Math.max(1, Math.round(Number(body.durationMin || 30))),
      drillsCompleted: Math.max(0, Math.round(Number(body.drillsCompleted || 0))),
      kcalBurned: Math.max(0, Math.round(Number(body.kcalBurned || 210))),
    }

    const saved = await prisma.cardioLog.upsert({
      where: { date },
      update: payload,
      create: { date, ...payload },
    })
    res.json({ ok: true, cardioLog: saved })
  } catch (error) {
    next(error)
  }
})

app.put('/api/pelvic/:date', async (req, res, next) => {
  try {
    const date = req.params.date
    if (!isValidDateStr(date)) {
      res.status(400).json({ ok: false, error: 'Invalid date format. Use YYYY-MM-DD.' })
      return
    }

    const body = safeObject(req.body)
    const payload = {
      highSide: body.highSide === 'left' ? 'left' : 'right',
      durationMin: Math.max(1, Math.round(Number(body.durationMin || 18))),
      setsCompleted: Math.max(0, Math.round(Number(body.setsCompleted || 0))),
    }

    const saved = await prisma.pelvicLog.upsert({
      where: { date },
      update: payload,
      create: { date, ...payload },
    })
    res.json({ ok: true, pelvicLog: saved })
  } catch (error) {
    next(error)
  }
})

// ============================================================================
// ROUTE 11: WEEKLY & MONTHLY COMPLETE OVERVIEW ANALYTICS
// ============================================================================

app.get('/api/overview', async (req, res, next) => {
  try {
    const period = req.query.period === 'monthly' ? 'monthly' : 'weekly'
    const overview = await computeOverviewFromDB(period)
    res.json({ ok: true, ...overview })
  } catch (error) {
    next(error)
  }
})

// ============================================================================
// ROUTE 12: CLOUD BACKUPS, RESTORE, FULL JSON IMPORT & SAFE DAY-0 RESET
// ============================================================================

async function importFullStateIntoDB(rawState) {
  const s = safeObject(rawState)
  const todayStr = getISTDateStr()

  await prisma.$transaction(
    async (tx) => {
      // Clear operational tables cleanly before re-populating from imported backup
      await tx.exerciseLog.deleteMany()
      await tx.workoutSession.deleteMany()
      await tx.weightLog.deleteMany()
      await tx.dailyLog.deleteMany()
      await tx.bodyMeasurement.deleteMany()
      await tx.disciplineLog.deleteMany()
      await tx.urgeLog.deleteMany()
      await tx.cardioLog.deleteMany()
      await tx.pelvicLog.deleteMany()

      // 1. UserConfig
      await tx.userConfig.upsert({
        where: { id: CONFIG_ID },
        update: {
          onboarded: Boolean(s.onboarded),
          dayStamp: isValidDateStr(s.dayStamp) ? s.dayStamp : todayStr,
          theme: s.theme === 'light' ? 'light' : 'dark',
          unit: s.unit === 'lb' ? 'lb' : 'kg',
          rampInEnabled: s.rampInEnabled !== false,
          pelvicSide: s.pelvicSide === 'left' ? 'left' : 'right',
          workoutStreak: Math.max(0, Math.round(Number(s.workoutStreak || 0))),
          profile: { ...DEFAULT_PROFILE, ...safeObject(s.profile) },
          customSteps: safeObject(s.customSteps),
          variantChoices: safeObject(s.variantChoices),
          swappedAlternatives: safeObject(s.swappedAlternatives),
          selectedMealOptions: safeObject(s.selectedMealOptions),
          foodDatabase: safeArray(s.foodDatabase),
          activeDrafts: safeObject(s.activeDrafts),
        },
        create: {
          id: CONFIG_ID,
          onboarded: Boolean(s.onboarded),
          dayStamp: isValidDateStr(s.dayStamp) ? s.dayStamp : todayStr,
          theme: s.theme === 'light' ? 'light' : 'dark',
          unit: s.unit === 'lb' ? 'lb' : 'kg',
          rampInEnabled: s.rampInEnabled !== false,
          pelvicSide: s.pelvicSide === 'left' ? 'left' : 'right',
          workoutStreak: Math.max(0, Math.round(Number(s.workoutStreak || 0))),
          profile: { ...DEFAULT_PROFILE, ...safeObject(s.profile) },
          customSteps: safeObject(s.customSteps),
          variantChoices: safeObject(s.variantChoices),
          swappedAlternatives: safeObject(s.swappedAlternatives),
          selectedMealOptions: safeObject(s.selectedMealOptions),
          foodDatabase: safeArray(s.foodDatabase),
          activeDrafts: safeObject(s.activeDrafts),
        },
      })

      // 2. WeightLogs (deduped by date)
      const weightByDate = new Map()
      for (const w of safeArray(s.weightLogs)) {
        if (!isValidDateStr(w?.date)) continue
        const mKg = w.morningKg != null && Number(w.morningKg) > 0 ? round2(w.morningKg) : null
        const nKg = w.nightKg != null && Number(w.nightKg) > 0 ? round2(w.nightKg) : null
        const pKg = mKg || nKg || round2(w.weightKg)
        if (pKg <= 0) continue
        weightByDate.set(w.date, {
          date: w.date,
          morningKg: mKg,
          nightKg: nKg,
          weightKg: pKg,
          fluctuationKg: mKg !== null && nKg !== null ? round2(nKg - mKg) : null,
          notes: String(w.notes || ''),
        })
      }
      if (weightByDate.size > 0) {
        await tx.weightLog.createMany({ data: Array.from(weightByDate.values()) })
      }

      // 3. BodyMeasurements
      const measData = safeArray(s.measurements)
        .filter((m) => Number(m?.shoulders || 0) > 0 && Number(m?.waist || 0) > 0)
        .map((m) => ({
          date: isValidDateStr(m.date) ? m.date : todayStr,
          shoulders: round2(m.shoulders),
          chest: round2(m.chest),
          waist: round2(m.waist),
          arms: round2(m.arms),
          thighs: round2(m.thighs),
          vTaperRatio: round2(Number(m.shoulders) / Number(m.waist)),
        }))
      if (measData.length > 0) {
        await tx.bodyMeasurement.createMany({ data: measData })
      }

      // 4. DailyLogs (from archived `dailyLogs` + current day snapshot)
      const dailyByDate = new Map()
      for (const [dKey, entry] of Object.entries(safeObject(s.dailyLogs))) {
        const dStr = isValidDateStr(entry?.date) ? entry.date : isValidDateStr(dKey) ? dKey : null
        if (!dStr) continue
        dailyByDate.set(dStr, {
          date: dStr,
          kcal: Math.max(0, Math.round(Number(entry.kcal || 0))),
          proteinG: round2(entry.protein || entry.proteinG || 0),
          carbsG: round2(entry.carbs || entry.carbsG || 0),
          fatG: round2(entry.fat || entry.fatG || 0),
          proteinFeedings: Math.max(0, Math.round(Number(entry.proteinFeedings || 0))),
          waterMl: Math.max(0, Math.round(Number(entry.waterMl || 0))),
          sleepHours: round2(entry.sleepHours || 0),
          sundayWalkDone: Boolean(entry.sundayWalkDone),
          selectedMealOptions: safeObject(entry.selectedMealOptions),
          completedMealSlots: safeObject(entry.completedMealSlots),
          loggedAppetiteHelpers: safeArray(entry.loggedAppetiteHelpers),
          pelvicHabits: safeObject(entry.pelvicHabits),
        })
      }
      if (dailyByDate.size > 0) {
        await tx.dailyLog.createMany({ data: Array.from(dailyByDate.values()) })
      }

      // 5. DisciplineLogs
      const discData = []
      for (const [dKey, entry] of Object.entries(safeObject(s.disciplineLogs))) {
        const dStr = isValidDateStr(entry?.date) ? entry.date : isValidDateStr(dKey) ? dKey : null
        if (!dStr) continue
        const status = entry.status === 'relapse' ? 'relapse' : 'clean'
        discData.push({
          date: dStr,
          status,
          noPorn: status === 'clean',
          noFap: status === 'clean',
          urgeLevel: Math.min(10, Math.max(0, Math.round(Number(entry.urgeLevel || 0)))),
          trigger: String(entry.trigger || ''),
          note: String(entry.note || ''),
        })
      }
      if (discData.length > 0) {
        await tx.disciplineLog.createMany({ data: discData, skipDuplicates: true })
      }

      // 6. UrgeLogs
      const urgeData = safeArray(s.urgeLogs)
        .filter((u) => isValidDateStr(u?.date))
        .map((u) => ({
          date: u.date,
          time: String(u.time || ''),
          trigger: String(u.trigger || 'Instant Control'),
          defeated: u.defeated !== false,
        }))
      if (urgeData.length > 0) {
        await tx.urgeLog.createMany({ data: urgeData })
      }

      // 7. CardioLogs
      const cardioByDate = new Map()
      for (const c of safeArray(s.cardioLogs)) {
        if (!isValidDateStr(c?.date)) continue
        cardioByDate.set(c.date, {
          date: c.date,
          durationMin: Math.max(1, Math.round(Number(c.durationMin || 30))),
          drillsCompleted: Math.max(0, Math.round(Number(c.drillsCompleted || 0))),
          kcalBurned: Math.max(0, Math.round(Number(c.kcalBurned || 210))),
        })
      }
      if (cardioByDate.size > 0) {
        await tx.cardioLog.createMany({ data: Array.from(cardioByDate.values()) })
      }

      // 8. PelvicLogs
      const pelvicByDate = new Map()
      for (const p of safeArray(s.pelvicLogs)) {
        if (!isValidDateStr(p?.date)) continue
        pelvicByDate.set(p.date, {
          date: p.date,
          highSide: p.highSide === 'left' ? 'left' : 'right',
          durationMin: Math.max(1, Math.round(Number(p.durationMin || 18))),
          setsCompleted: Math.max(0, Math.round(Number(p.setsCompleted || 0))),
        })
      }
      if (pelvicByDate.size > 0) {
        await tx.pelvicLog.createMany({ data: Array.from(pelvicByDate.values()) })
      }

      // 9. WorkoutSessions + ExerciseLogs
      const exHistoryMap = safeObject(s.exerciseHistory)
      const sessionByDateAndDay = new Map()

      for (const wh of safeArray(s.workoutHistory)) {
        if (!isValidDateStr(wh?.date)) continue
        const created = await tx.workoutSession.create({
          data: {
            date: wh.date,
            dayIndex: Number.isInteger(wh.dayIndex) ? wh.dayIndex : 1,
            dayTitle: String(wh.dayTitle || 'Session'),
            durationSec: Math.max(0, Math.round(Number(wh.durationSec || 0))),
            totalVolumeKg: Math.round(Number(wh.totalVolumeKg || 0)),
            setsCompleted: Math.max(0, Math.round(Number(wh.setsCompleted || 0))),
            prsCount: Math.max(0, Math.round(Number(wh.prsCount || 0))),
            notes: String(wh.notes || ''),
          },
        })
        sessionByDateAndDay.set(`${wh.date}_${created.dayIndex}`, {
          sessionId: created.id,
          exerciseSets: safeObject(wh.exerciseSets),
        })
      }

      // Map exerciseHistory entries onto matching sessions (or create fallback session)
      const dayPrefixToIndex = { mon: 1, tue: 2, wed: 3, thu: 4, fri: 5, sat: 6 }
      for (const [exerciseId, entries] of Object.entries(exHistoryMap)) {
        const prefix = exerciseId.split('-')[0]
        const inferredDay = dayPrefixToIndex[prefix] || 1

        for (const item of safeArray(entries)) {
          if (!isValidDateStr(item?.date)) continue
          const dIdx = Number.isInteger(item.dayIndex) ? item.dayIndex : inferredDay
          const mapKey = `${item.date}_${dIdx}`
          let match = sessionByDateAndDay.get(mapKey)

          if (!match) {
            const fallback = await tx.workoutSession.create({
              data: {
                date: item.date,
                dayIndex: dIdx,
                dayTitle: `Imported Day ${dIdx}`,
                totalVolumeKg: Math.round(Number(item.volumeKg || 0)),
                setsCompleted: Math.max(1, Math.round(Number(item.setsCompleted || 1))),
              },
            })
            match = { sessionId: fallback.id, exerciseSets: {} }
            sessionByDateAndDay.set(mapKey, match)
          }

          const setsFromItem = safeArray(item.sets).length
            ? safeArray(item.sets)
            : safeArray(match.exerciseSets[exerciseId]).length
              ? safeArray(match.exerciseSets[exerciseId])
              : Array.from({ length: Math.max(1, Number(item.setsCompleted || 1)) }, (_, i) => ({
                  setNumber: i + 1,
                  weight: round2(item.topWeightKg),
                  reps: Math.max(1, Math.round(Number(item.bestReps || 1))),
                }))

          await tx.exerciseLog.create({
            data: {
              sessionId: match.sessionId,
              date: item.date,
              dayIndex: dIdx,
              exerciseId,
              exerciseName: String(item.exerciseName || exerciseId),
              primaryGroup: String(item.primaryGroup || 'Other'),
              isAssisted: Boolean(item.isAssisted),
              sets: setsFromItem,
              topWeightKg: round2(item.topWeightKg),
              bestReps: Math.max(0, Math.round(Number(item.bestReps || 0))),
              e1rmKg: computeE1RM(item.topWeightKg, item.bestReps, Boolean(item.isAssisted)),
              volumeKg: Math.round(Number(item.volumeKg || 0)),
              setsCompleted: setsFromItem.length,
            },
          })
        }
      }
    },
    { timeout: 30000 }
  )
}

app.get('/api/backups', async (_req, res, next) => {
  try {
    const backups = await prisma.cloudBackup.findMany({
      orderBy: { snapshotDate: 'desc' },
      select: {
        id: true,
        snapshotDate: true,
        meta: true,
        createdAt: true,
        updatedAt: true,
      },
    })
    res.json({ ok: true, count: backups.length, backups })
  } catch (error) {
    next(error)
  }
})

app.post('/api/backups/now', async (_req, res, next) => {
  try {
    const meta = await createCloudBackupSnapshot(true)
    res.json({ ok: true, backup: meta })
  } catch (error) {
    next(error)
  }
})

app.post('/api/backups/restore', async (req, res, next) => {
  try {
    const snapshotDate = String(req.body?.snapshotDate || '')
    if (!isValidDateStr(snapshotDate)) {
      res.status(400).json({ ok: false, error: 'Valid snapshotDate (YYYY-MM-DD) required.' })
      return
    }
    const backup = await prisma.cloudBackup.findUnique({ where: { snapshotDate } })
    if (!backup || !isPlainObject(backup.payload)) {
      res.status(404).json({ ok: false, error: 'Requested backup snapshot not found.' })
      return
    }

    await importFullStateIntoDB(backup.payload)
    const state = await buildFullAppState()
    res.json({ ok: true, restoredFrom: snapshotDate, state })
  } catch (error) {
    next(error)
  }
})

app.post('/api/import', async (req, res, next) => {
  try {
    const payload = req.body?.data || req.body
    if (!isPlainObject(payload)) {
      res.status(400).json({ ok: false, error: 'Valid JSON state object required.' })
      return
    }

    await createCloudBackupSnapshot(true).catch(() => {})
    await importFullStateIntoDB(payload)
    const state = await buildFullAppState()
    res.json({ ok: true, importedAt: new Date().toISOString(), state })
  } catch (error) {
    next(error)
  }
})

app.post('/api/reset', async (req, res, next) => {
  try {
    // Always take a safety backup before wiping to Day 0
    await createCloudBackupSnapshot(true).catch(() => {})
    const keepTheme = req.body?.theme === 'light' ? 'light' : 'dark'

    await prisma.$transaction(async (tx) => {
      await tx.exerciseLog.deleteMany()
      await tx.workoutSession.deleteMany()
      await tx.weightLog.deleteMany()
      await tx.dailyLog.deleteMany()
      await tx.bodyMeasurement.deleteMany()
      await tx.disciplineLog.deleteMany()
      await tx.urgeLog.deleteMany()
      await tx.cardioLog.deleteMany()
      await tx.pelvicLog.deleteMany()

      await tx.userConfig.upsert({
        where: { id: CONFIG_ID },
        update: {
          onboarded: false,
          dayStamp: getISTDateStr(),
          theme: keepTheme,
          unit: 'kg',
          rampInEnabled: true,
          pelvicSide: 'right',
          workoutStreak: 0,
          profile: DEFAULT_PROFILE,
          customSteps: {},
          variantChoices: { 'thu-5': 'dips' },
          swappedAlternatives: {},
          selectedMealOptions: {},
          foodDatabase: [],
          activeDrafts: {},
        },
        create: {
          id: CONFIG_ID,
          onboarded: false,
          dayStamp: getISTDateStr(),
          theme: keepTheme,
          unit: 'kg',
          rampInEnabled: true,
          pelvicSide: 'right',
          workoutStreak: 0,
          profile: DEFAULT_PROFILE,
          customSteps: {},
          variantChoices: { 'thu-5': 'dips' },
          swappedAlternatives: {},
          selectedMealOptions: {},
          foodDatabase: [],
          activeDrafts: {},
        },
      })
    })

    const state = await buildFullAppState()
    res.json({ ok: true, resetAt: new Date().toISOString(), state })
  } catch (error) {
    next(error)
  }
})

// ============================================================================
// GLOBAL ERROR HANDLER & GRACEFUL SHUTDOWN
// ============================================================================

app.use((error, _req, res, _next) => {
  console.error('VTaper API error:', error)
  res.status(500).json({
    ok: false,
    error: 'Internal server error',
    message: error.message,
  })
})

const server = app.listen(PORT, () => {
  console.log(`VTaper Dedicated Relational API listening on port ${PORT}`)
})

const shutdown = async () => {
  server.close(async () => {
    await prisma.$disconnect()
    process.exit(0)
  })
}

process.on('SIGINT', shutdown)
process.on('SIGTERM', shutdown)