import path from 'node:path';

/**
 * The editor (a separate Node process) writes site.variables.json directly
 * to disk. Vite's dev server only re-transforms a markdown module when that
 * module's own file changes, so without this, saved variables never show up
 * until a markdown file happens to change or the dev server restarts.
 */
export function viteWatchVariables(variablesPath) {
  const resolvedPath = path.resolve(variablesPath);
  return {
    name: 'watch-site-variables',
    configureServer(server) {
      server.watcher.add(resolvedPath);
      server.watcher.on('change', (changedPath) => {
        if (path.resolve(changedPath) !== resolvedPath) return;
        server.moduleGraph.invalidateAll();
        server.ws.send({ type: 'full-reload' });
      });
    },
  };
}
