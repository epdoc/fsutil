const template = {
  request: 'launch',
  name: 'Debug tests',
  type: 'node',
  cwd: '${workspaceFolder}',
  env: {},
  runtimeExecutable: '/Users/jpravetz/.deno/bin/deno',
  runtimeArgs: [
    'test',
    '--inspect-brk',
    '--allow-env',
    '--allow-sys',
    '--allow-read',
    '--allow-write',
    './test/fs.test.ts',
  ],
  attachSimplePort: 9229,
};

const result = { version: '0.2.0', configurations: [] };
for await (const entry of Deno.readDir('./tests')) {
  if (entry.isFile && entry.name.endsWith('.test.ts')) {
    const item = Object.assign({}, template, { name: `Debug ${entry.name}` });
    item.runtimeArgs = [];
    template.runtimeArgs.forEach((arg) => {
      item.runtimeArgs.push(arg);
    });
    item.runtimeArgs[item.runtimeArgs.length - 1] = `./test/${entry.name}`;
    result.configurations.push(item as never);
  }
}

Deno.writeTextFileSync('.vscode/launch.json', JSON.stringify(result, null, 2));
