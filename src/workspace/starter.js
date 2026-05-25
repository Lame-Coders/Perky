import process from 'node:process';

import chalk from 'chalk';
import { execaCommand } from 'execa';

import { CliError } from '../commands/shared.js';

const SERVICE_COLORS = [chalk.cyan, chalk.green, chalk.magenta, chalk.yellow, chalk.blue];

export async function startServices(services, options = {}) {
  if (options.detach) {
    await startDetached(services);
    return;
  }

  await startAttached(services);
}

export async function startDetached(services) {
  for (const service of services) {
    const child = execaCommand(service.cmd, {
      cwd: service.cwd,
      detached: true,
      reject: false,
      shell: true,
      stdio: 'ignore',
    });
    child.unref?.();
  }
}

export async function startAttached(services) {
  const children = services.map((service, index) => {
    const color = SERVICE_COLORS[index % SERVICE_COLORS.length];
    const child = execaCommand(service.cmd, {
      cwd: service.cwd,
      shell: true,
      all: true,
      reject: false,
      env: process.env,
    });

    child.all?.on('data', (chunk) => {
      for (const line of chunk.toString().split(/\r?\n/).filter(Boolean)) {
        console.log(`${color(`[${service.name}]`)} ${line}`);
      }
    });

    return { service, child };
  });

  let shuttingDown = false;
  const shutdown = () => {
    if (shuttingDown) {
      return;
    }

    shuttingDown = true;
    console.log('\nStopping services...');
    for (const { child } of children) {
      child.kill('SIGTERM', { forceKillAfterDelay: 5000 });
    }
  };

  process.once('SIGINT', shutdown);
  process.once('SIGTERM', shutdown);

  const results = await Promise.all(children.map(({ child }) => child));
  process.removeListener('SIGINT', shutdown);
  process.removeListener('SIGTERM', shutdown);

  const failed = results
    .map((result, index) => ({ result, service: children[index].service }))
    .filter(({ result }) => result.exitCode && result.exitCode !== 0);

  if (failed.length) {
    const names = failed.map(({ service }) => service.name).join(', ');
    throw new CliError(`Service exited with an error: ${names}`);
  }
}
