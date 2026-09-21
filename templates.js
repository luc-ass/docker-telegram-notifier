// Swarm names a task container `<service>.<slot>.<task id>`, so on a swarm the
// name in the event reads 'web_server.3.n31jwutl4l33kcuz20taem4p4'. `e.swarm`
// carries the readable parts of it and is absent outside swarm.
const name = e => e.swarm ? e.swarm.name : e.Actor.Attributes.name;

// Swarm pins every task to an image digest, which doubles the length of the
// line and says nothing the tag does not. Dropped only when a tag is left
// behind: `repo@sha256:...` would otherwise lose its version entirely.
const image = e => {
    const reference = String(e.Actor.Attributes.image);
    const digest = reference.indexOf('@');
    if (digest === -1) return reference;

    const repository = reference.slice(0, digest);
    // The colon of a registry port is not a tag separator.
    const tagged = repository.slice(repository.lastIndexOf('/') + 1).includes(':');
    return tagged ? repository : reference;
};

// Naming the host is noise while there is only ever one, so the node line is
// added on swarm events only.
const node = e => e.swarm && e.node ? `\nNode: ${e.node}` : '';

module.exports = {
    connection_message: ({hostname, version, os, type, architecture, cpu, memory}) =>
        `Connected to <b>${hostname}</b> (docker v${version})\n` +
        `OS: ${type}/${architecture} (${os})\n` +
        `CPU: ${cpu} Cores\n` +
        `RAM: ${memory}`,

    container_start: e =>
        `&#9654;&#65039; <b>${name(e)}</b> started\n` +
        `Image: <code>${image(e)}</code>` +
        node(e),

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
            return `&#9209;&#65039; <b>${name(e)}</b> stopped!\n` +
            `Image: <code>${image(e)}</code>\n` +
            `${normalMap[exitCode]}` +
            node(e);
        } else if (exitCode in nonNormalMap) {
            return `&#128308; <b>${name(e)}</b> stopped!\n` +
            `Image: <code>${image(e)}</code>\n` +
            `${nonNormalMap[exitCode]}` +
            node(e);
        } else {
            return `&#128308; <b>${name(e)}</b> stopped!\n` +
            `Image: <code>${image(e)}</code>\n` +
            `Exit code: ${exitCode}` +
            node(e);
        }
    },

    'container_health_status: healthy': e =>
        `&#9989; <b>${name(e)}</b> healthy\n` +
        `Image: <code>${image(e)}</code>` +
        node(e),

    'container_health_status: unhealthy': e =>
        `&#9888; <b>${name(e)}</b> unhealthy!\n` +
        `Image: <code>${image(e)}</code>` +
        node(e),
};
