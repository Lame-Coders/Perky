import process from 'node:process';

import inquirer from 'inquirer';

import { CliError, resolveUserPath } from '../commands/shared.js';

export async function resolveProject(config, requestedName) {
  const projects = config.projects ?? {};
  const projectNames = Object.keys(projects);

  if (!projectNames.length) {
    throw new CliError('No projects configured. Add one with: kaks config add-project <name> --path <path>');
  }

  const name = requestedName ?? await promptForProjectName(projectNames);

  if (!Object.hasOwn(projects, name)) {
    const suggestion = getClosestMatch(name, projectNames);
    const hint = suggestion ? ` Did you mean "${suggestion}"?` : '';
    throw new CliError(`Unknown project "${name}".${hint}`);
  }

  return {
    name,
    project: normalizeProject(name, projects[name], config.defaults ?? {}),
  };
}

export function normalizeProject(name, project = {}, defaults = {}) {
  const projectPath = resolveUserPath(project.path ?? process.cwd());

  return {
    ...project,
    name,
    path: projectPath,
    editor: project.editor ?? defaults.editor ?? 'code',
    browserCommand: project.browserCommand ?? project.browserName ?? defaults.browser ?? 'default',
  };
}

export function getProjectOpenUrls(project) {
  if (Array.isArray(project.openUrls)) {
    return project.openUrls;
  }

  if (typeof project.browser === 'string' && looksLikeUrl(project.browser)) {
    return [project.browser];
  }

  if (typeof project.url === 'string') {
    return [project.url];
  }

  return [];
}

export function getProjectServices(project) {
  const services = [];

  if (Array.isArray(project.services)) {
    services.push(...project.services);
  }

  for (const name of ['frontend', 'backend']) {
    const service = project[name];
    if (service?.startCmd || service?.cmd) {
      services.push({ name, ...service, cmd: service.cmd ?? service.startCmd });
    }
  }

  if (project.startCmd || project.cmd) {
    services.push({
      name: project.name ?? 'app',
      cmd: project.cmd ?? project.startCmd,
      cwd: project.path,
    });
  }

  return services
    .map((service) => ({
      name: service.name ?? 'service',
      cmd: service.cmd ?? service.startCmd,
      cwd: resolveUserPath(service.cwd ?? service.path ?? project.path, project.path),
      port: service.port,
    }))
    .filter((service) => Boolean(service.cmd));
}

export function getClosestMatch(input, candidates) {
  if (!input || !candidates.length) {
    return null;
  }

  const normalizedInput = input.toLowerCase();
  const substringMatch = candidates.find((candidate) => candidate.toLowerCase().includes(normalizedInput));
  if (substringMatch) {
    return substringMatch;
  }

  const scored = candidates
    .map((candidate) => ({
      candidate,
      distance: levenshteinDistance(normalizedInput, candidate.toLowerCase()),
    }))
    .sort((a, b) => a.distance - b.distance);

  const best = scored[0];
  return best && best.distance <= Math.max(2, Math.floor(input.length / 2)) ? best.candidate : null;
}

async function promptForProjectName(projectNames) {
  const { name } = await inquirer.prompt([
    {
      type: 'list',
      name: 'name',
      message: 'Choose a project',
      choices: projectNames,
    },
  ]);
  return name;
}

function looksLikeUrl(value) {
  return /^https?:\/\//i.test(value) || /^[\w.-]+\.[a-z]{2,}/i.test(value) || /^localhost:/i.test(value);
}

function levenshteinDistance(left, right) {
  const previous = Array.from({ length: right.length + 1 }, (_, index) => index);

  for (let leftIndex = 0; leftIndex < left.length; leftIndex += 1) {
    const current = [leftIndex + 1];

    for (let rightIndex = 0; rightIndex < right.length; rightIndex += 1) {
      const insert = current[rightIndex] + 1;
      const remove = previous[rightIndex + 1] + 1;
      const replace = previous[rightIndex] + (left[leftIndex] === right[rightIndex] ? 0 : 1);
      current.push(Math.min(insert, remove, replace));
    }

    previous.splice(0, previous.length, ...current);
  }

  return previous[right.length];
}
