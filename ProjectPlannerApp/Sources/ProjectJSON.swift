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
            task.phases = fetchPhases(ids: t.phaseIDs, project: project, context: context)
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
            plan.phases = fetchPhases(ids: p.phaseIDs, project: project, context: context)
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

@MainActor
private func fetchPhase(id: UUID, project: Project, context: NSManagedObjectContext) -> Phase {
    let fetch: NSFetchRequest<Phase> = Phase.fetchRequest()
    fetch.predicate = NSPredicate(format: "id == %@", id as CVarArg)
    if let existing = try? context.fetch(fetch).first {
        return existing
    } else {
        let ph = Phase(context: context)
        ph.id = id
        ph.project = project
        return ph
    }
}

@MainActor
private func fetchPhases(ids: [UUID], project: Project, context: NSManagedObjectContext) -> Set<Phase> {
    Set(ids.map { fetchPhase(id: $0, project: project, context: context) })
}

