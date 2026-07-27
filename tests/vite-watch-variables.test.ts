import { describe, it, expect, vi } from 'vitest';
import { EventEmitter } from 'node:events';
import path from 'node:path';
import { viteWatchVariables } from '../src/plugins/vite-watch-variables.mjs';

function makeFakeServer() {
  const watcher = new EventEmitter();
  watcher.add = vi.fn();
  return {
    watcher,
    moduleGraph: { invalidateAll: vi.fn() },
    ws: { send: vi.fn() },
  };
}

describe('viteWatchVariables', () => {
  it('adds the variables file to the watcher', () => {
    const variablesPath = path.join('project', 'site.variables.json');
    const plugin = viteWatchVariables(variablesPath);
    const server = makeFakeServer();
    plugin.configureServer(server);
    expect(server.watcher.add).toHaveBeenCalledWith(path.resolve(variablesPath));
  });

  it('invalidates the module graph and triggers a full reload when the variables file changes', () => {
    const variablesPath = path.join('project', 'site.variables.json');
    const plugin = viteWatchVariables(variablesPath);
    const server = makeFakeServer();
    plugin.configureServer(server);

    server.watcher.emit('change', path.resolve(variablesPath));

    expect(server.moduleGraph.invalidateAll).toHaveBeenCalled();
    expect(server.ws.send).toHaveBeenCalledWith({ type: 'full-reload' });
  });

  it('ignores changes to unrelated files', () => {
    const variablesPath = path.join('project', 'site.variables.json');
    const plugin = viteWatchVariables(variablesPath);
    const server = makeFakeServer();
    plugin.configureServer(server);

    server.watcher.emit('change', path.join('project', 'other-file.json'));

    expect(server.moduleGraph.invalidateAll).not.toHaveBeenCalled();
    expect(server.ws.send).not.toHaveBeenCalled();
  });
});
