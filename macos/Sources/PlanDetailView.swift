import SwiftUI
import CoreData
#if os(macOS)
import AppKit
#endif

struct PlanDetailView: View {
    @ObservedObject var plan: Plan
    @Environment(\.managedObjectContext) private var context
    @State private var schedule: ScheduleResult?

    var body: some View {
        VStack(alignment: .leading) {
            if let schedule = schedule {
                GanttChartView(schedule: schedule)
                    .frame(height: 300)
                List {
                    ForEach(schedule.phaseWindows, id: \.phase.id) { pw in
                        VStack(alignment: .leading) {
                            Text(pw.phase.name).font(.headline)
                            ForEach(pw.lanes, id: \.key) { lane in
                                Text("\(lane.key): \(lane.days)d starting \(format(lane.start))")
                                    .font(.caption)
                            }
                        }
                    }
                }
                Button("Export Schedule CSV") { exportScheduleCSV() }
            } else {
                Text("No schedule computed")
            }
            Button("Compute Schedule") { compute() }
            Spacer()
        }
        .padding()
        .navigationTitle(plan.name)
    }

    private func compute() {
        guard let tasks = plan.project?.tasks else { return }
        if let aggr = aggregate(plan: plan, tasks: Array(tasks)) {
            schedule = computeSchedule(plan: plan, aggr: aggr, efficiency: 1.0, startDate: Date())
        }
    }

    private func format(_ date: Date) -> String {
        let df = DateFormatter()
        df.dateFormat = "yyyy-MM-dd"
        return df.string(from: date)
    }

    private func exportScheduleCSV() {
        guard let schedule = schedule else { return }
        #if os(macOS)
        let panel = NSSavePanel()
        panel.allowedContentTypes = [.commaSeparatedText]
        panel.nameFieldStringValue = "schedule.csv"
        if panel.runModal() == .OK, let url = panel.url {
            try? exportSchedule(schedule: schedule, to: url)
        }
        #endif
    }
}
