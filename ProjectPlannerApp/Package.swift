// swift-tools-version: 6.1
import PackageDescription

let package = Package(
    name: "ProjectPlannerApp",
    platforms: [
        .macOS(.v13),
        .iOS(.v16) // iPadOS uses the iOS SDK
    ],
    products: [
        .executable(name: "ProjectPlannerApp", targets: ["ProjectPlannerApp"])
    ],
    dependencies: [],
    targets: [
        .executableTarget(
            name: "ProjectPlannerApp",
            path: "Sources",
            resources: [.process("Info.plist")]
        )
    ]
)
