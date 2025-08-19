import CoreData

@MainActor
class PersistenceController {
    static let shared = PersistenceController()
    let container: NSPersistentContainer

    init(inMemory: Bool = false) {
        let model = Self.makeModel()
        container = NSPersistentContainer(name: "ProjectPlanner", managedObjectModel: model)
        if inMemory {
            container.persistentStoreDescriptions.first?.url = URL(fileURLWithPath: "/dev/null")
        }
        container.loadPersistentStores { _, error in
            if let error = error {
                fatalError("Unresolved error \(error)")
            }
        }
    }

    private static func attr(_ name: String, _ type: NSAttributeType, optional: Bool = false) -> NSAttributeDescription {
        let a = NSAttributeDescription()
        a.name = name
        a.attributeType = type
        a.isOptional = optional
        return a
    }

    static func makeModel() -> NSManagedObjectModel {
        let model = NSManagedObjectModel()

        // Entity shells
        let project = NSEntityDescription()
        project.name = "Project"
        project.managedObjectClassName = NSStringFromClass(Project.self)

        let phase = NSEntityDescription()
        phase.name = "Phase"
        phase.managedObjectClassName = NSStringFromClass(Phase.self)

        let task = NSEntityDescription()
        task.name = "Task"
        task.managedObjectClassName = NSStringFromClass(Task.self)

        let effort = NSEntityDescription()
        effort.name = "TaskEffort"
        effort.managedObjectClassName = NSStringFromClass(TaskEffort.self)

        let team = NSEntityDescription()
        team.name = "Team"
        team.managedObjectClassName = NSStringFromClass(Team.self)

        let plan = NSEntityDescription()
        plan.name = "Plan"
        plan.managedObjectClassName = NSStringFromClass(Plan.self)

        // Attributes
        project.properties = [
            attr("id", .UUIDAttributeType),
            attr("name", .stringAttributeType)
        ]

        phase.properties = [
            attr("id", .UUIDAttributeType),
            attr("name", .stringAttributeType),
            attr("order", .integer16AttributeType)
        ]

        task.properties = [
            attr("id", .UUIDAttributeType),
            attr("name", .stringAttributeType),
            attr("startDate", .dateAttributeType, optional: true)
        ]

        effort.properties = [
            attr("platform", .stringAttributeType),
            attr("manDays", .doubleAttributeType)
        ]

        team.properties = [
            attr("id", .UUIDAttributeType),
            attr("name", .stringAttributeType),
            attr("be", .doubleAttributeType),
            attr("ios", .doubleAttributeType),
            attr("android", .doubleAttributeType),
            attr("online", .doubleAttributeType),
            attr("qa", .doubleAttributeType)
        ]

        plan.properties = [
            attr("id", .UUIDAttributeType),
            attr("name", .stringAttributeType),
            attr("bufferPct", .doubleAttributeType)
        ]

        // Relationships
        // Project <-> Task
        let projectTasks = NSRelationshipDescription()
        projectTasks.name = "tasks"
        projectTasks.destinationEntity = task
        projectTasks.minCount = 0
        projectTasks.maxCount = 0
        projectTasks.deleteRule = .cascadeDeleteRule

        let taskProject = NSRelationshipDescription()
        taskProject.name = "project"
        taskProject.destinationEntity = project
        taskProject.minCount = 0
        taskProject.maxCount = 1
        taskProject.deleteRule = .nullifyDeleteRule

        projectTasks.inverseRelationship = taskProject
        taskProject.inverseRelationship = projectTasks
        project.properties.append(projectTasks)
        task.properties.append(taskProject)

        // Project <-> Phase
        let projectPhases = NSRelationshipDescription()
        projectPhases.name = "phases"
        projectPhases.destinationEntity = phase
        projectPhases.minCount = 0
        projectPhases.maxCount = 0
        projectPhases.deleteRule = .cascadeDeleteRule

        let phaseProject = NSRelationshipDescription()
        phaseProject.name = "project"
        phaseProject.destinationEntity = project
        phaseProject.minCount = 0
        phaseProject.maxCount = 1
        phaseProject.deleteRule = .nullifyDeleteRule

        projectPhases.inverseRelationship = phaseProject
        phaseProject.inverseRelationship = projectPhases
        project.properties.append(projectPhases)
        phase.properties.append(phaseProject)

        // Task <-> Phase (many-to-many)
        let taskPhases = NSRelationshipDescription()
        taskPhases.name = "phases"
        taskPhases.destinationEntity = phase
        taskPhases.minCount = 0
        taskPhases.maxCount = 0
        taskPhases.deleteRule = .nullifyDeleteRule

        let phaseTasks = NSRelationshipDescription()
        phaseTasks.name = "tasks"
        phaseTasks.destinationEntity = task
        phaseTasks.minCount = 0
        phaseTasks.maxCount = 0
        phaseTasks.deleteRule = .nullifyDeleteRule

        taskPhases.inverseRelationship = phaseTasks
        phaseTasks.inverseRelationship = taskPhases
        task.properties.append(taskPhases)
        phase.properties.append(phaseTasks)

        // Task <-> Effort
        let taskEfforts = NSRelationshipDescription()
        taskEfforts.name = "efforts"
        taskEfforts.destinationEntity = effort
        taskEfforts.minCount = 0
        taskEfforts.maxCount = 0
        taskEfforts.deleteRule = .cascadeDeleteRule

        let effortTask = NSRelationshipDescription()
        effortTask.name = "task"
        effortTask.destinationEntity = task
        effortTask.minCount = 0
        effortTask.maxCount = 1
        effortTask.deleteRule = .nullifyDeleteRule

        taskEfforts.inverseRelationship = effortTask
        effortTask.inverseRelationship = taskEfforts
        task.properties.append(taskEfforts)
        effort.properties.append(effortTask)

        // Project <-> Plan
        let projectPlans = NSRelationshipDescription()
        projectPlans.name = "plans"
        projectPlans.destinationEntity = plan
        projectPlans.minCount = 0
        projectPlans.maxCount = 0
        projectPlans.deleteRule = .cascadeDeleteRule

        let planProject = NSRelationshipDescription()
        planProject.name = "project"
        planProject.destinationEntity = project
        planProject.minCount = 0
        planProject.maxCount = 1
        planProject.deleteRule = .nullifyDeleteRule

        projectPlans.inverseRelationship = planProject
        planProject.inverseRelationship = projectPlans
        project.properties.append(projectPlans)
        plan.properties.append(planProject)

        // Team <-> Plan
        let teamPlans = NSRelationshipDescription()
        teamPlans.name = "plans"
        teamPlans.destinationEntity = plan
        teamPlans.minCount = 0
        teamPlans.maxCount = 0
        teamPlans.deleteRule = .cascadeDeleteRule

        let planTeam = NSRelationshipDescription()
        planTeam.name = "team"
        planTeam.destinationEntity = team
        planTeam.minCount = 0
        planTeam.maxCount = 1
        planTeam.deleteRule = .nullifyDeleteRule

        teamPlans.inverseRelationship = planTeam
        planTeam.inverseRelationship = teamPlans
        team.properties.append(teamPlans)
        plan.properties.append(planTeam)

        // Plan <-> Phase
        let planPhases = NSRelationshipDescription()
        planPhases.name = "phases"
        planPhases.destinationEntity = phase
        planPhases.minCount = 0
        planPhases.maxCount = 0
        planPhases.deleteRule = .nullifyDeleteRule

        let phasePlans = NSRelationshipDescription()
        phasePlans.name = "plans"
        phasePlans.destinationEntity = plan
        phasePlans.minCount = 0
        phasePlans.maxCount = 0
        phasePlans.deleteRule = .nullifyDeleteRule

        planPhases.inverseRelationship = phasePlans
        phasePlans.inverseRelationship = planPhases
        plan.properties.append(planPhases)
        phase.properties.append(phasePlans)

        model.entities = [project, phase, task, effort, team, plan]
        return model
    }
}
