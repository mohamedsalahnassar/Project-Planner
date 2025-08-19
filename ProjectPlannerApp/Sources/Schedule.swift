import Foundation

struct PhaseTotals {
    var be: Double = 0
    var ios: Double = 0
    var android: Double = 0
    var online: Double = 0
    var qa: Double = 0
    var earliest: Date? = nil
}

@MainActor
struct Aggregation {
    var team: Team
    var buffer: Double
    var phaseTotals: [UUID: PhaseTotals]
}

struct LaneWindow {
    let key: String
    let start: Date
    let days: Int
}

@MainActor
struct PhaseWindow {
    let phase: Phase
    let start: Date
    let end: Date
    let lanes: [LaneWindow]
}

@MainActor
struct ScheduleResult {
    let chartStart: Date
    let chartEnd: Date
    let phaseWindows: [PhaseWindow]
}

@MainActor
func aggregate(plan: Plan, tasks: [Task]) -> Aggregation? {
    guard let team = plan.team else { return nil }
    let buffer = (plan.bufferPct) / 100.0
    var phaseTotals: [UUID: PhaseTotals] = [:]
    let planPhaseSet: Set<Phase> = plan.phases ?? []

    for t in tasks {
        guard t.project == plan.project else { continue }
        let earliestTaskStart = t.startDate
        let taskPhases = t.phases ?? []
        for ph in taskPhases where planPhaseSet.contains(ph) {
            var rec = phaseTotals[ph.id] ?? PhaseTotals()
            for eff in t.efforts ?? [] {
                let md = eff.manDays
                switch eff.platform {
                case "BE": rec.be += md
                case "iOS": rec.ios += md
                case "Android": rec.android += md
                case "Online": rec.online += md
                case "QA": rec.qa += md
                default: break
                }
            }
            if let ets = earliestTaskStart {
                if rec.earliest == nil || ets < rec.earliest! { rec.earliest = ets }
            }
            phaseTotals[ph.id] = rec
        }
    }

    for (pid, var rec) in phaseTotals {
        rec.be *= (1+buffer)
        rec.ios *= (1+buffer)
        rec.android *= (1+buffer)
        rec.online *= (1+buffer)
        rec.qa *= (1+buffer)
        phaseTotals[pid] = rec
    }
    return Aggregation(team: team, buffer: buffer, phaseTotals: phaseTotals)
}

private func duration(md: Double, eng: Double, eff: Double) -> Int {
    if eng <= 0 { return 0 }
    return max(1, Int(ceil(md/(eng*eff))))
}

private func addDays(_ d: Date, _ n: Int) -> Date {
    Calendar.current.date(byAdding: .day, value: n, to: d) ?? d
}

@MainActor
func computeSchedule(plan: Plan, aggr: Aggregation, efficiency: Double, startDate: Date, stagger: Int = 5) -> ScheduleResult {
    let planStart = startDate
    let phases = (plan.phases ?? []).sorted { $0.order < $1.order }
    var phaseWindows: [PhaseWindow] = []
    var prevEnd: Date? = nil

    for ph in phases {
        let totals = aggr.phaseTotals[ph.id] ?? PhaseTotals()
        var phStart = prevEnd != nil ? addDays(prevEnd!, 1) : planStart
        if let e = totals.earliest, e > phStart { phStart = e }

        let beDays = duration(md: totals.be, eng: aggr.team.be, eff: efficiency)
        let iosDays = duration(md: totals.ios, eng: aggr.team.ios, eff: efficiency)
        let andDays = duration(md: totals.android, eng: aggr.team.android, eff: efficiency)
        let webDays = duration(md: totals.online, eng: aggr.team.online, eff: efficiency)
        let feMax = max(iosDays, andDays, webDays)
        let qaDays = duration(md: totals.qa, eng: aggr.team.qa, eff: efficiency)

        let beStart = phStart
        let iosStart = addDays(phStart, stagger)
        let andStart = addDays(phStart, stagger)
        let webStart = addDays(phStart, stagger)
        let qaStart = addDays(iosStart, feMax/2)

        let beEnd = addDays(beStart, beDays)
        let iosEnd = addDays(iosStart, iosDays)
        let andEnd = addDays(andStart, andDays)
        let webEnd = addDays(webStart, webDays)
        let qaEnd = addDays(qaStart, qaDays)
        let phEnd = [beEnd, iosEnd, andEnd, webEnd, qaEnd].max() ?? phStart

        let lanes = [
            LaneWindow(key: "BE", start: beStart, days: beDays),
            LaneWindow(key: "iOS", start: iosStart, days: iosDays),
            LaneWindow(key: "Android", start: andStart, days: andDays),
            LaneWindow(key: "Online", start: webStart, days: webDays),
            LaneWindow(key: "QA", start: qaStart, days: qaDays)
        ]
        phaseWindows.append(PhaseWindow(phase: ph, start: phStart, end: phEnd, lanes: lanes))
        prevEnd = phEnd
    }

    let chartStart = phaseWindows.first?.start ?? planStart
    let chartEnd = phaseWindows.last?.end ?? planStart
    return ScheduleResult(chartStart: chartStart, chartEnd: chartEnd, phaseWindows: phaseWindows)
}
