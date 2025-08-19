import CoreData

@objc(Plan)
@MainActor
public class Plan: NSManagedObject {
}

@MainActor
public extension Plan: Identifiable {
    @nonobjc class func fetchRequest() -> NSFetchRequest<Plan> {
        NSFetchRequest<Plan>(entityName: "Plan")
    }

    @NSManaged var id: UUID
    @NSManaged var name: String
    @NSManaged var bufferPct: Double
    @NSManaged var project: Project?
    @NSManaged var team: Team?
    @NSManaged var phases: Set<Phase>?
}
