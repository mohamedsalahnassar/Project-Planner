import CoreData

@objc(Phase)
@MainActor
public class Phase: NSManagedObject {
}

@MainActor
public extension Phase: Identifiable {
    @nonobjc class func fetchRequest() -> NSFetchRequest<Phase> {
        NSFetchRequest<Phase>(entityName: "Phase")
    }

    @NSManaged var id: UUID
    @NSManaged var name: String
    @NSManaged var order: Int16
    @NSManaged var project: Project?
    @NSManaged var tasks: Set<Task>?
    @NSManaged var plans: Set<Plan>?
}
