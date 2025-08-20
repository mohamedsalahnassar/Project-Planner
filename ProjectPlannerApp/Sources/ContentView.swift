import SwiftUI
import Foundation
import CoreData
#if os(macOS)
import AppKit
#endif

@MainActor
struct ContentView: View {
    @Environment(\.managedObjectContext) private var context
    @FetchRequest(entity: Project.entity(), sortDescriptors: []) var projects: FetchedResults<Project>
    @State private var newProjectName: String = ""
    @State private var selectedProject: Project?
#if os(iOS)
    @Environment(\.horizontalSizeClass) private var horizontalSizeClass
#endif

    var body: some View {
#if os(iOS)
        if horizontalSizeClass == .regular {
            splitView
        } else {
            stackView
        }
#else
        splitView
#endif
    }

    private var stackView: some View {
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

    private var splitView: some View {
        NavigationSplitView {
            VStack(alignment: .leading) {
                Text("Projects").font(.largeTitle)
                List(selection: $selectedProject) {
                    ForEach(projects) { project in
                        Text(project.name).tag(project as Project?)
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
        } detail: {
            if let project = selectedProject {
                ProjectDetailView(project: project)
            } else {
                Text("Select a project")
            }
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
