const fs = require('fs');

/**
 * Resolves settings that may be delivered as a file instead of an
 * environment variable: for each name, <NAME>_FILE wins over <NAME> and its
 * contents replace the variable for the rest of the process.
 *
 * This matters for the bot token. An environment variable is visible to
 * anyone who can run `docker inspect` on the container — which, given this
 * container is normally given the docker socket, is a wider circle than it
 * looks. Docker and compose secrets are delivered as files.
 *
 * The value is put back into process.env rather than passed around: it is
 * read at several points, and a runtime assignment is not part of the
 * container's configuration, so it does not show up in `docker inspect`.
 */
function loadFileSettings(names) {
  for (const name of names) {
    const file = process.env[`${name}_FILE`];
    if (!file) continue;

    try {
      process.env[name] = fs.readFileSync(file, 'utf8').trim();
    } catch (e) {
      console.error(`Could not read ${name}_FILE at ${file}: ${e.message}`);
      process.exit(100);
    }
  }
}

module.exports = { loadFileSettings };
