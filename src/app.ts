interface SupportEngineer {
    name: string;
    project: string;
}

async function main(): Promise<void> {
    const engineer: SupportEngineer = {
        name: "Lianne",
        project: "SupportLab SaaS"
    };

    console.log(
        `${engineer.name} started ${engineer.project}.`
    );
}

main().catch((error: unknown) => {
    console.error("Application failed:", error);
    process.exit(1);
});