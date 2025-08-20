import Foundation
import CoreData

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

