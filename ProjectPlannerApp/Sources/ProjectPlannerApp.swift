import SwiftUI
import CoreData
#if os(macOS)
import Foundation
#endif

@main
@MainActor
struct ProjectPlannerApp: App {
    init() {
        #if os(macOS)
        // Assign a bundle identifier when running outside of an app bundle
        Bundle.main.setValue("com.example.ProjectPlannerApp", forKey: "bundleIdentifier")
        #endif
    }

    let persistenceController = PersistenceController.shared

    var body: some Scene {
        WindowGroup {
            ContentView()
                .environment(\.managedObjectContext, persistenceController.container.viewContext)
        }
    }
}
