// swift-tools-version: 6.1
import PackageDescription

let package = Package(
    name: "ProjectPlannerMac",
    platforms: [
        .macOS(.v13)
    ],
    products: [
        .executable(name: "ProjectPlannerMac", targets: ["ProjectPlannerMac"])
    ],
    dependencies: [],
    targets: [
        .executableTarget(
            name: "ProjectPlannerMac",
            path: "Sources"
        )
    ]
)
