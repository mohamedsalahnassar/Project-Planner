import CoreData

@objc(Task)
public class Task: NSManagedObject, Identifiable {
    @nonobjc public class func fetchRequest() -> NSFetchRequest<Task> {
        NSFetchRequest<Task>(entityName: "Task")
    }

    @NSManaged public var id: UUID
    @NSManaged public var name: String
    @NSManaged public var startDate: Date?
    @NSManaged public var project: Project?
    @NSManaged public var phases: Set<Phase>?
    @NSManaged public var efforts: Set<TaskEffort>?
}
