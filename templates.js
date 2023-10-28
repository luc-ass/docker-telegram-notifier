module.exports = {
    container_start: e =>
        `&#9654;&#65039; <b>${e.Actor.Attributes.name}</b> started\n${e.Actor.Attributes.image}`,

    container_die: e => {
        const exitCode = e.Actor.Attributes.exitCode;
        const exitCodeMap = {
            "0": "Success: Container exited with code 0",
            "1": "General error: Container exited with code 1",
            "2": "Misuse of shell builtins: Container exited with code 2",
            "126": "Command invoked cannot execute: Container exited with code 126",
            "127": "Command not found: Container exited with code 127",
            "128": "Invalid argument to exit: Container exited with code 128",
            "130": "Container terminated by user: Container exited with code 130",
            "137": "Container received a SIGKILL: Container exited with code 137",
            "139": "Segmentation fault: Container exited with code 139",
            "143": "Container received a SIGTERM: Container exited with code 143",
            // Add more exit codes as needed
        };

        if (exitCode in exitCodeMap) {
            return `&#128308; <b>${e.Actor.Attributes.name}</b> stopped!\n${e.Actor.Attributes.image}\n${exitCodeMap[exitCode]}`;
        } else {
            return `&#128308; <b>${e.Actor.Attributes.name}</b> stopped with an unknown exit code (${exitCode})!\n${e.Actor.Attributes.image}`;
        }
    },

    'container_health_status: healthy': e =>
        `&#9989; <b>${e.Actor.Attributes.name}</b> healthy\n${e.Actor.Attributes.image}`,

    'container_health_status: unhealthy': e =>
        `&#9888; <b>${e.Actor.Attributes.name}</b> unhealthy!\n${e.Actor.Attributes.image}`,
};

