module.exports = {
    container_start: e =>
        `&#9654;&#65039; <b>${e.Actor.Attributes.name}</b> started\n${e.Actor.Attributes.image}`,

    container_die: e =>
        `&#128721; <b>${e.Actor.Attributes.name}</b> stopped!\n${e.Actor.Attributes.image}\nExit Code: ${e.Actor.Attributes.exitCode}`,

    'container_health_status: healthy': e =>
        `&#9989; <b>${e.Actor.Attributes.name}</b> healthy\n${e.Actor.Attributes.image}`,

    'container_health_status: unhealthy': e =>
        `&#x26A0; <b>${e.Actor.Attributes.name}</b> unhealthy!\n${e.Actor.Attributes.image}`,
};