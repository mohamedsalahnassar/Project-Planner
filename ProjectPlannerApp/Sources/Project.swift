import CoreData

@objc(Project)
@MainActor
public class Project: NSManagedObject {
}

@MainActor
public extension Project: Identifiable {
    @nonobjc class func fetchRequest() -> NSFetchRequest<Project> {
        NSFetchRequest<Project>(entityName: "Project")
    }

    @NSManaged var id: UUID
    @NSManaged var name: String
    @NSManaged var tasks: Set<Task>?
    @NSManaged var phases: Set<Phase>?
    @NSManaged var plans: Set<Plan>?
}
