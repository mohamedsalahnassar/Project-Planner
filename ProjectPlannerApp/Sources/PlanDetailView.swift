import SwiftUI
import Foundation
import CoreData
#if os(macOS)
import AppKit
#endif

@MainActor
struct PlanDetailView: View {
    @ObservedObject var plan: Plan
    @Environment(\.managedObjectContext) private var context
    @State private var schedule: ScheduleResult?
    @State private var startDate: Date = Date()
    @State private var efficiency: Double = 1.0

    var body: some View {
        VStack(alignment: .leading) {
            DatePicker("Start Date", selection: $startDate, displayedComponents: .date)
            HStack {
                Text("Efficiency")
                Slider(value: $efficiency, in: 0.1...1.0, step: 0.05)
                TextField("", value: $efficiency, format: .number)
                    .frame(width: 50)
            }
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
            schedule = computeSchedule(plan: plan, aggr: aggr, efficiency: efficiency, startDate: startDate)
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
        #else
        let url = FileManager.default.urls(for: .documentDirectory, in: .userDomainMask)[0]
            .appendingPathComponent("schedule.csv")
        try? exportSchedule(schedule: schedule, to: url)
        #endif
    }
}
