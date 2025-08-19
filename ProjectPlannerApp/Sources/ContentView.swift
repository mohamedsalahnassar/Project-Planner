import SwiftUI
import CoreData
#if os(macOS)
import AppKit
#endif

@MainActor
struct ContentView: View {
    @Environment(\.managedObjectContext) private var context
    @FetchRequest(entity: Project.entity(), sortDescriptors: []) var projects: FetchedResults<Project>
    @State private var newProjectName: String = ""

    var body: some View {
        NavigationStack {
            VStack(alignment: .leading) {
                Text("Projects").font(.largeTitle)
                List {
                    ForEach(projects) { project in
                        NavigationLink(destination: ProjectDetailView(project: project)) {
                            Text(project.name)
                        }
                    }
                    .onDelete(perform: deleteProjects)
                }
                HStack {
                    TextField("New Project", text: $newProjectName)
                    Button("Add") { addProject() }.disabled(newProjectName.isEmpty)
                }
                HStack {
                    Button("Export JSON") { exportJSON() }
                    Button("Import JSON") { importJSON() }
                    Button("Export CSV") { exportCSV() }
                    Button("Import CSV") { importCSV() }
                }
            }
            .padding()
        }
    }

    private func addProject() {
        let p = Project(context: context)
        p.id = UUID()
        p.name = newProjectName
        newProjectName = ""
        try? context.save()
    }

    private func deleteProjects(_ offsets: IndexSet) {
        offsets.map { projects[$0] }.forEach(context.delete)
        try? context.save()
    }

    private func exportJSON() {
        #if os(macOS)
        let panel = NSSavePanel()
        panel.allowedContentTypes = [.json]
        panel.nameFieldStringValue = "projects.json"
        if panel.runModal() == .OK, let url = panel.url {
            try? exportProjects(context: context, to: url)
        }
        #else
        let url = FileManager.default.urls(for: .documentDirectory, in: .userDomainMask)[0]
            .appendingPathComponent("projects.json")
        try? exportProjects(context: context, to: url)
        #endif
    }

    private func importJSON() {
        #if os(macOS)
        let panel = NSOpenPanel()
        panel.allowedContentTypes = [.json]
        if panel.runModal() == .OK, let url = panel.url {
            try? importProjects(context: context, from: url)
        }
        #else
        let url = FileManager.default.urls(for: .documentDirectory, in: .userDomainMask)[0]
            .appendingPathComponent("projects.json")
        if FileManager.default.fileExists(atPath: url.path) {
            try? importProjects(context: context, from: url)
        }
        #endif
    }

    private func exportCSV() {
        #if os(macOS)
        let panel = NSSavePanel()
        panel.allowedContentTypes = [.commaSeparatedText]
        panel.nameFieldStringValue = "projects.csv"
        if panel.runModal() == .OK, let url = panel.url {
            try? exportProjectsCSV(context: context, to: url)
        }
        #else
        let url = FileManager.default.urls(for: .documentDirectory, in: .userDomainMask)[0]
            .appendingPathComponent("projects.csv")
        try? exportProjectsCSV(context: context, to: url)
        #endif
    }

    private func importCSV() {
        #if os(macOS)
        let panel = NSOpenPanel()
        panel.allowedContentTypes = [.commaSeparatedText]
        if panel.runModal() == .OK, let url = panel.url {
            try? importProjectsCSV(context: context, from: url)
        }
        #else
        let url = FileManager.default.urls(for: .documentDirectory, in: .userDomainMask)[0]
            .appendingPathComponent("projects.csv")
        if FileManager.default.fileExists(atPath: url.path) {
            try? importProjectsCSV(context: context, from: url)
        }
        #endif
    }
}

#Preview {
    ContentView().environment(\.managedObjectContext, PersistenceController.shared.container.viewContext)
}
