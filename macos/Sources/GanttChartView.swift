import SwiftUI
#if canImport(Charts)
import Charts
#endif

struct GanttChartView: View {
    let schedule: ScheduleResult

    var body: some View {
        #if canImport(Charts)
        Chart {
            ForEach(schedule.phaseWindows, id: \.phase.id) { pw in
                ForEach(pw.lanes, id: \.key) { lane in
                    let end = Calendar.current.date(byAdding: .day, value: lane.days, to: lane.start) ?? lane.start
                    BarMark(
                        xStart: .value("Start", lane.start),
                        xEnd: .value("End", end),
                        y: .value("Lane", "\(pw.phase.name) - \(lane.key)")
                    )
                    .foregroundStyle(by: .value("Phase", pw.phase.name))
                }
            }
        }
        .chartXScale(domain: schedule.chartStart...schedule.chartEnd)
        #else
        Text("Charts framework not available")
        #endif
    }
}

#Preview {
    let team = Team(context: PersistenceController.shared.container.viewContext)
    team.id = UUID()
    team.name = "T"
    let phase = Phase(context: PersistenceController.shared.container.viewContext)
    phase.id = UUID()
    phase.name = "Phase"
    let lane = LaneWindow(key: "BE", start: Date(), days: 5)
    let phw = PhaseWindow(phase: phase, start: Date(), end: Date().addingTimeInterval(86400*5), lanes: [lane])
    let sched = ScheduleResult(chartStart: Date(), chartEnd: Date().addingTimeInterval(86400*5), phaseWindows: [phw])
    return GanttChartView(schedule: sched)
        .frame(height: 200)
        .padding()
}
