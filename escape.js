/**
 * Messages are sent with parse_mode HTML, so every value interpolated into
 * message text has to be escaped. Container names, image tags and custom
 * labels are arbitrary strings: a single stray '<' makes Telegram reject the
 * whole message.
 */
function escapeHtml(text) {
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

module.exports = { escapeHtml };
