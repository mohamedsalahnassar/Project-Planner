import CoreData

@objc(Project)
@MainActor
public class Project: NSManagedObject, Identifiable {
    @nonobjc public class func fetchRequest() -> NSFetchRequest<Project> {
        NSFetchRequest<Project>(entityName: "Project")
    }

    @NSManaged public var id: UUID
    @NSManaged public var name: String
    @NSManaged public var tasks: Set<Task>?
    @NSManaged public var phases: Set<Phase>?
    @NSManaged public var plans: Set<Plan>?
}
