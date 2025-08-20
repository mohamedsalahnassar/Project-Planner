import CoreData

@objc(Plan)
@MainActor
public class Plan: NSManagedObject {
}

extension Plan: @MainActor Identifiable {
    @nonobjc class func fetchRequest() -> NSFetchRequest<Plan> {
        NSFetchRequest<Plan>(entityName: "Plan")
    }

    @NSManaged public var id: UUID
    @NSManaged var name: String
    @NSManaged var bufferPct: Double
    @NSManaged var project: Project?
    @NSManaged var team: Team?
    @NSManaged var phases: Set<Phase>?
}
