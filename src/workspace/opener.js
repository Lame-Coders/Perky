import process from 'node:process';

import { execa } from 'execa';

import { CliError } from '../commands/shared.js';
import { normalizeUrl, openTarget } from './browser.js';
import { getProjectOpenUrls } from './resolver.js';

export async function openWorkspace(project, options = {}) {
  const results = [];

  if (options.editor !== false) {
    await launchEditor(project.editor, project.path);
    results.push({ label: 'Editor', target: project.path });
  }

  if (options.browser !== false) {
    for (const url of getProjectOpenUrls(project)) {
      const normalizedUrl = normalizeUrl(url);
      await openTarget(normalizedUrl, project.browserCommand);
      results.push({ label: 'Browser', target: normalizedUrl });
    }
  }

  if (options.explorer !== false) {
    await launchExplorer(project.path);
    results.push({ label: 'File Explorer', target: project.path });
  }

  return results;
}

export async function launchEditor(editor, targetPath) {
  try {
    const child = execa(editor, [targetPath], { detached: true, stdio: 'ignore' });
    child.unref?.();
    await child;
  } catch (error) {
    throw new CliError(`Editor not found: ${editor}. Set your editor with: kaks config set defaults.editor <path>`, {
      cause: error,
    });
  }
}

export async function launchExplorer(targetPath) {
  const launcher = getExplorerCommand(targetPath);

  try {
    const child = execa(launcher.command, launcher.args, { detached: true, stdio: 'ignore' });
    child.unref?.();
    await child;
  } catch (error) {
    throw new CliError(`Could not open file explorer for ${targetPath}.`, { cause: error });
  }
}

export function getExplorerCommand(targetPath) {
  if (process.platform === 'win32') {
    return { command: 'explorer', args: [targetPath] };
  }

  if (process.platform === 'darwin') {
    return { command: 'open', args: [targetPath] };
  }

  return { command: 'xdg-open', args: [targetPath] };
}
