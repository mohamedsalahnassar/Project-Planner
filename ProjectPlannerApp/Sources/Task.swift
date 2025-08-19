import CoreData

@objc(Task)
@MainActor
public class Task: NSManagedObject {
}

@MainActor
public extension Task: Identifiable {
    @nonobjc class func fetchRequest() -> NSFetchRequest<Task> {
        NSFetchRequest<Task>(entityName: "Task")
    }

    @NSManaged var id: UUID
    @NSManaged var name: String
    @NSManaged var startDate: Date?
    @NSManaged var project: Project?
    @NSManaged var phases: Set<Phase>?
    @NSManaged var efforts: Set<TaskEffort>?
}
