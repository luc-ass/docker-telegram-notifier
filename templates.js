module.exports = {
    container_start: e =>
        `&#9654;&#65039; <b>${e.Actor.Attributes.name}</b> started\n${e.Actor.Attributes.image}`,

    container_die: e => {
        const exitCode = e.Actor.Attributes.exitCode;
        const normalMap = {
            "0": "Successful shutdown: Exit code 0",
            "143": "Graceful termination (SIGTERM): Exit code 143",
            // Add more normal exit codes as needed
        };
        const nonNormalMap = {
            "1": "Application error: Exit code 1",
            "2": "Misuse of shell builtins: Exit code 2",
            "126": "Command invoked cannot execute: Exit code 126",
            "127": "File or directory not found: Exit code 127",
            "128": "Invalid argument used on exit: Exit code 128",
            "130": "Container terminated by user: Exit code 130",
            "134": "Abnormal termination (SIGABRT): Exit code 134",
            "137": "Immediate termination (SIGKILL): Exit code 137",
            "139": "Segmentation fault: Exit code 139",
            "255": "Unknown error. Exit code 255",
            // Add more non-normal exit codes as needed
        }

        if (exitCode in normalMap) {
            return `&#9209; <b>${e.Actor.Attributes.name}</b> stopped!\n${e.Actor.Attributes.image}\n${normalMap[exitCode]}`;
        } else if (exitCode in nonNormalMap) {
            return `&#128308; <b>${e.Actor.Attributes.name}</b> stopped!\n${e.Actor.Attributes.image}\n${nonNormalMap[exitCode]}`;
        } else {
            return `&#128308; <b>${e.Actor.Attributes.name}</b> stopped with exit code (${exitCode})!\n${e.Actor.Attributes.image}`;
        }
    },

    'container_health_status: healthy': e =>
        `&#9989; <b>${e.Actor.Attributes.name}</b> healthy\n${e.Actor.Attributes.image}`,

    'container_health_status: unhealthy': e =>
        `&#9888; <b>${e.Actor.Attributes.name}</b> unhealthy!\n${e.Actor.Attributes.image}`,
};

