import CoreData

@objc(Plan)
@MainActor
public class Plan: NSManagedObject, Identifiable {
    @nonobjc public class func fetchRequest() -> NSFetchRequest<Plan> {
        NSFetchRequest<Plan>(entityName: "Plan")
    }

    @NSManaged public var id: UUID
    @NSManaged public var name: String
    @NSManaged public var bufferPct: Double
    @NSManaged public var project: Project?
    @NSManaged public var team: Team?
    @NSManaged public var phases: Set<Phase>?
}
