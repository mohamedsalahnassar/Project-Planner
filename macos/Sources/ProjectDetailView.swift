import SwiftUI
import CoreData

struct ProjectDetailView: View {
    @ObservedObject var project: Project
    @Environment(\.managedObjectContext) private var context
    @State private var newTaskName = ""
    @State private var newPhaseName = ""
    @State private var newPlanName = ""

    var body: some View {
        List {
            Section(header: Text("Phases")) {
                ForEach(Array(project.phases ?? []).sorted { $0.order < $1.order }) { phase in
                    Text(phase.name)
                }
                HStack {
                    TextField("New Phase", text: $newPhaseName)
                    Button("Add") { addPhase() }.disabled(newPhaseName.isEmpty)
                }
            }

            Section(header: Text("Tasks")) {
                ForEach(Array(project.tasks ?? [])) { task in
                    Text(task.name)
                }
                HStack {
                    TextField("New Task", text: $newTaskName)
                    Button("Add") { addTask() }.disabled(newTaskName.isEmpty)
                }
            }

            Section(header: Text("Plans")) {
                ForEach(Array(project.plans ?? [])) { plan in
                    NavigationLink(destination: PlanDetailView(plan: plan)) {
                        Text(plan.name)
                    }
                }
                HStack {
                    TextField("New Plan", text: $newPlanName)
                    Button("Add") { addPlan() }.disabled(newPlanName.isEmpty)
                }
            }
        }
        .navigationTitle(project.name)
    }

    private func addPhase() {
        let p = Phase(context: context)
        p.id = UUID()
        p.name = newPhaseName
        p.order = Int16(project.phases?.count ?? 0)
        p.project = project
        newPhaseName = ""
        try? context.save()
    }

    private func addTask() {
        let t = Task(context: context)
        t.id = UUID()
        t.name = newTaskName
        t.project = project
        if let firstPhase = project.phases?.sorted(by: { $0.order < $1.order }).first {
            t.phases = [firstPhase]
        }
        let eff = TaskEffort(context: context)
        eff.platform = "BE"
        eff.manDays = 5
        eff.task = t
        newTaskName = ""
        try? context.save()
    }

    private func addPlan() {
        let plan = Plan(context: context)
        plan.id = UUID()
        plan.name = newPlanName
        plan.bufferPct = 0
        plan.project = project
        if let phases = project.phases { plan.phases = phases }
        let team = Team(context: context)
        team.id = UUID()
        team.name = "Default Team"
        team.be = 1; team.ios = 1; team.android = 1; team.online = 1; team.qa = 1
        plan.team = team
        newPlanName = ""
        try? context.save()
    }
}
