import CoreData

@objc(Team)
@MainActor
public class Team: NSManagedObject {
}

@MainActor
public extension Team: Identifiable {
    @nonobjc class func fetchRequest() -> NSFetchRequest<Team> {
        NSFetchRequest<Team>(entityName: "Team")
    }

    @NSManaged var id: UUID
    @NSManaged var name: String
    @NSManaged var be: Double
    @NSManaged var ios: Double
    @NSManaged var android: Double
    @NSManaged var online: Double
    @NSManaged var qa: Double
    @NSManaged var plans: Set<Plan>?
}
