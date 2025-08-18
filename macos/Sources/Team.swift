import CoreData

@objc(Team)
public class Team: NSManagedObject, Identifiable {
    @nonobjc public class func fetchRequest() -> NSFetchRequest<Team> {
        NSFetchRequest<Team>(entityName: "Team")
    }

    @NSManaged public var id: UUID
    @NSManaged public var name: String
    @NSManaged public var be: Double
    @NSManaged public var ios: Double
    @NSManaged public var android: Double
    @NSManaged public var online: Double
    @NSManaged public var qa: Double
    @NSManaged public var plans: Set<Plan>?
}
