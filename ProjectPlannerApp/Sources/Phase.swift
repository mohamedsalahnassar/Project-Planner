import CoreData

@objc(Phase)
@MainActor
public class Phase: NSManagedObject, Identifiable {
    @nonobjc public class func fetchRequest() -> NSFetchRequest<Phase> {
        NSFetchRequest<Phase>(entityName: "Phase")
    }

    @NSManaged public var id: UUID
    @NSManaged public var name: String
    @NSManaged public var order: Int16
    @NSManaged public var project: Project?
    @NSManaged public var tasks: Set<Task>?
    @NSManaged public var plans: Set<Plan>?
}
