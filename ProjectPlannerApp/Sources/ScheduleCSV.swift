import Foundation

// MARK: - Schedule CSV Export

@MainActor
func exportSchedule(schedule: ScheduleResult, to url: URL) throws {
    var csv = "Phase,Lane,Start,Days\n"
    let df = ISO8601DateFormatter()
    for pw in schedule.phaseWindows {
        for lane in pw.lanes {
            csv += "\(pw.phase.name),\(lane.key),\(df.string(from: lane.start)),\(lane.days)\n"
        }
    }
    try csv.data(using: .utf8)?.write(to: url)
}

