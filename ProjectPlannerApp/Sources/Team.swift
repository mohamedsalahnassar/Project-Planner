import CoreData

@objc(Team)
@MainActor
public class Team: NSManagedObject {
}

extension Team: @MainActor Identifiable {
    @nonobjc class func fetchRequest() -> NSFetchRequest<Team> {
        NSFetchRequest<Team>(entityName: "Team")
    }

    @NSManaged public var id: UUID
    @NSManaged var name: String
    @NSManaged var be: Double
    @NSManaged var ios: Double
    @NSManaged var android: Double
    @NSManaged var online: Double
    @NSManaged var qa: Double
    @NSManaged var plans: Set<Plan>?
}
