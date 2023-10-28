module.exports = {
    container_start: e =>
        `&#9654;&#65039; <b>${e.Actor.Attributes.name}</b> started\n${e.Actor.Attributes.image}`,

    container_die: e => {
        if (e.Actor.Attributes.exitCode === "1") {
            return `&#128308; <b>${e.Actor.Attributes.name}</b> stopped!\n${e.Actor.Attributes.image}\nExit Code: ${e.Actor.Attributes.exitCode}`;
        } else {
            return `&#128308; <b>${e.Actor.Attributes.name}</b> stopped with a non-standard exit code!\n${e.Actor.Attributes.image}\nExit Code: ${e.Actor.Attributes.exitCode}`;
        }
    },

    'container_health_status: healthy': e =>
        `&#9989; <b>${e.Actor.Attributes.name}</b> healthy\n${e.Actor.Attributes.image}`,

    'container_health_status: unhealthy': e =>
        `&#x26A0; <b>${e.Actor.Attributes.name}</b> unhealthy!\n${e.Actor.Attributes.image}`,
};
