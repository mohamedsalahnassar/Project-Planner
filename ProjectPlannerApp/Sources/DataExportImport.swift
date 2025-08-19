import Foundation
import CoreData

struct ProjectDTO: Codable {
    var id: UUID
    var name: String
    var phases: [PhaseDTO]
    var tasks: [TaskDTO]
    var plans: [PlanDTO]
}

struct PhaseDTO: Codable {
    var id: UUID
    var name: String
    var order: Int16
}

struct TaskDTO: Codable {
    var id: UUID
    var name: String
    var phaseIDs: [UUID]
    var efforts: [TaskEffortDTO]
    var startDate: Date?
}

struct TaskEffortDTO: Codable {
    var platform: String
    var manDays: Double
}

struct TeamDTO: Codable {
    var id: UUID
    var name: String
    var be: Double
    var ios: Double
    var android: Double
    var online: Double
    var qa: Double
}

struct PlanDTO: Codable {
    var id: UUID
    var name: String
    var bufferPct: Double
    var phaseIDs: [UUID]
    var team: TeamDTO
}

// MARK: - JSON Export/Import

@MainActor
func exportProjects(context: NSManagedObjectContext, to url: URL) throws {
    let req: NSFetchRequest<Project> = Project.fetchRequest()
    let projects = try context.fetch(req)
    let dtos = projects.map { project in
        ProjectDTO(
            id: project.id,
            name: project.name,
            phases: (project.phases ?? []).map { ph in
                PhaseDTO(id: ph.id, name: ph.name, order: ph.order)
            },
            tasks: (project.tasks ?? []).map { t in
                TaskDTO(
                    id: t.id,
                    name: t.name,
                    phaseIDs: (t.phases ?? []).map { $0.id },
                    efforts: (t.efforts ?? []).map { e in
                        TaskEffortDTO(platform: e.platform, manDays: e.manDays)
                    },
                    startDate: t.startDate
                )
            },
            plans: (project.plans ?? []).map { p in
                PlanDTO(
                    id: p.id,
                    name: p.name,
                    bufferPct: p.bufferPct,
                    phaseIDs: (p.phases ?? []).map { $0.id },
                    team: TeamDTO(
                        id: p.team?.id ?? UUID(),
                        name: p.team?.name ?? "",
                        be: p.team?.be ?? 0,
                        ios: p.team?.ios ?? 0,
                        android: p.team?.android ?? 0,
                        online: p.team?.online ?? 0,
                        qa: p.team?.qa ?? 0
                    )
                )
            }
        )
    }
    let data = try JSONEncoder().encode(dtos)
    try data.write(to: url)
}

@MainActor
func importProjects(context: NSManagedObjectContext, from url: URL) throws {
    let data = try Data(contentsOf: url)
    let dtos = try JSONDecoder().decode([ProjectDTO].self, from: data)
    for dto in dtos {
        let project = Project(context: context)
        project.id = dto.id
        project.name = dto.name
        for ph in dto.phases {
            let phase = Phase(context: context)
            phase.id = ph.id
            phase.name = ph.name
            phase.order = ph.order
            phase.project = project
        }
        for t in dto.tasks {
            let task = Task(context: context)
            task.id = t.id
            task.name = t.name
            task.startDate = t.startDate
            task.project = project
            let phases = dto.phases.filter { t.phaseIDs.contains($0.id) }
            task.phases = Set(phases.map { ph -> Phase in
                let fetch: NSFetchRequest<Phase> = Phase.fetchRequest()
                fetch.predicate = NSPredicate(format: "id == %@", ph.id as CVarArg)
                let existing = try? context.fetch(fetch).first
                return existing ?? Phase(context: context)
            })
            for e in t.efforts {
                let eff = TaskEffort(context: context)
                eff.platform = e.platform
                eff.manDays = e.manDays
                eff.task = task
            }
        }
        for p in dto.plans {
            let plan = Plan(context: context)
            plan.id = p.id
            plan.name = p.name
            plan.bufferPct = p.bufferPct
            plan.project = project
            let phases = dto.phases.filter { p.phaseIDs.contains($0.id) }
            plan.phases = Set(phases.map { ph in
                let fetch: NSFetchRequest<Phase> = Phase.fetchRequest()
                fetch.predicate = NSPredicate(format: "id == %@", ph.id as CVarArg)
                return (try? context.fetch(fetch).first) ?? Phase(context: context)
            })
            let team = Team(context: context)
            team.id = p.team.id
            team.name = p.team.name
            team.be = p.team.be
            team.ios = p.team.ios
            team.android = p.team.android
            team.online = p.team.online
            team.qa = p.team.qa
            plan.team = team
        }
    }
    try context.save()
}

// MARK: - CSV Export/Import

@MainActor
func exportProjectsCSV(context: NSManagedObjectContext, to url: URL) throws {
    let req: NSFetchRequest<Project> = Project.fetchRequest()
    let projects = try context.fetch(req)
    var csv = "Project,Task,Phases,Platform,ManDays\n"
    for project in projects {
        for task in project.tasks ?? [] {
            let phases = (task.phases ?? []).map { $0.name }.joined(separator: "|")
            if let efforts = task.efforts, !efforts.isEmpty {
                for e in efforts {
                    csv += "\(project.name),\(task.name),\(phases),\(e.platform),\(e.manDays)\n"
                }
            } else {
                csv += "\(project.name),\(task.name),\(phases),,0\n"
            }
        }
    }
    try csv.data(using: .utf8)?.write(to: url)
}

@MainActor
func importProjectsCSV(context: NSManagedObjectContext, from url: URL) throws {
    let data = try String(contentsOf: url)
    let lines = data.split(separator: "\n")
    guard lines.count > 1 else { return }
    for line in lines.dropFirst() {
        let cols = line.split(separator: ",", omittingEmptySubsequences: false)
        if cols.count < 5 { continue }
        let pName = String(cols[0])
        let tName = String(cols[1])
        let phaseNames = String(cols[2]).split(separator: "|").map(String.init)
        let platform = String(cols[3])
        let md = Double(cols[4]) ?? 0

        let project = fetchOrCreateProject(named: pName, context: context)
        let task = fetchOrCreateTask(named: tName, project: project, context: context)
        task.startDate = task.startDate
        let phases = phaseNames.map { fetchOrCreatePhase(named: $0, project: project, context: context) }
        task.phases = Set(phases)
        if !platform.isEmpty {
            let eff = TaskEffort(context: context)
            eff.platform = platform
            eff.manDays = md
            eff.task = task
        }
    }
    try context.save()
}

@MainActor
private func fetchOrCreateProject(named: String, context: NSManagedObjectContext) -> Project {
    let fetch: NSFetchRequest<Project> = Project.fetchRequest()
    fetch.predicate = NSPredicate(format: "name == %@", named)
    if let existing = try? context.fetch(fetch).first { return existing }
    let p = Project(context: context)
    p.id = UUID(); p.name = named
    return p
}

@MainActor
private func fetchOrCreateTask(named: String, project: Project, context: NSManagedObjectContext) -> Task {
    let fetch: NSFetchRequest<Task> = Task.fetchRequest()
    fetch.predicate = NSPredicate(format: "name == %@ AND project == %@", named, project)
    if let existing = try? context.fetch(fetch).first { return existing }
    let t = Task(context: context)
    t.id = UUID(); t.name = named; t.project = project
    return t
}

@MainActor
private func fetchOrCreatePhase(named: String, project: Project, context: NSManagedObjectContext) -> Phase {
    let fetch: NSFetchRequest<Phase> = Phase.fetchRequest()
    fetch.predicate = NSPredicate(format: "name == %@ AND project == %@", named, project)
    if let existing = try? context.fetch(fetch).first { return existing }
    let ph = Phase(context: context)
    ph.id = UUID(); ph.name = named; ph.order = Int16(project.phases?.count ?? 0); ph.project = project
    return ph
}

// MARK: - Schedule CSV

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
