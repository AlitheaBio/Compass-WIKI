const path = require('path');

/**
 * Returns webpack alias mappings for the UI template.
 *
 * Intent:
 * - Provide a fallback for the design system so the template can build
 *   without the @hla-compass/design-system package installed. When the
 *   real package is present, Node resolution will prefer it and this
 *   alias will be effectively a no-op for consumers that rely on the
 *   actual package.
 * - Keep the function extensible for future aliases without forcing
 *   every template consumer to define the file.
 *
 * @param {string} rootDir absolute path to the template frontend directory
 * @returns {Record<string, string>}
 */
function getAliases(rootDir) {
  const aliases = {};

  // Prefer real package if it exists; otherwise, point to the stub
  // to keep the template building/running out of the box.
  const dsPkgPath = (() => {
    try {
      // Resolve from the template root; if installed, use the package
      return require.resolve('@hla-compass/design-system', { paths: [rootDir] });
    } catch (_) {
      return null;
    }
  })();

  if (!dsPkgPath) {
    aliases['@hla-compass/design-system'] = path.resolve(rootDir, 'src/stubs/design-system');
  }

  return aliases;
}

module.exports = { getAliases };
