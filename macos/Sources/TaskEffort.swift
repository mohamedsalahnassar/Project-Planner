import CoreData

@objc(TaskEffort)
public class TaskEffort: NSManagedObject, Identifiable {
    @nonobjc public class func fetchRequest() -> NSFetchRequest<TaskEffort> {
        NSFetchRequest<TaskEffort>(entityName: "TaskEffort")
    }

    @NSManaged public var platform: String
    @NSManaged public var manDays: Double
    @NSManaged public var task: Task?
}
