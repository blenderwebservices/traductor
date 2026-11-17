const { spawn } = require('child_process');
const electronPath = require('electron');

// Ensure ELECTRON_RUN_AS_NODE is stripped from the environment
// so that terminals (e.g. inside IDEs or subshells) do not force Electron into Node CLI mode
const cleanEnv = { ...process.env };
delete cleanEnv.ELECTRON_RUN_AS_NODE;

// Append --log-level=3 to suppress Chromium internal C++ EGL display probe warnings on macOS
const args = ['.', '--log-level=3', ...process.argv.slice(2)];

const child = spawn(electronPath, args, {
  stdio: ['inherit', 'pipe', 'pipe'],
  env: cleanEnv,
});

child.stdout.on('data', (data) => {
  process.stdout.write(data);
});

child.stderr.on('data', (data) => {
  const text = data.toString();
  // Filter out internal Chromium C++ EGL driver probe notices on macOS
  const filtered = text
    .split('\n')
    .filter((line) => {
      if (!line.trim()) return false;
      if (line.includes('gl_display.cc') || line.includes('gl_initializer_mac.cc') || line.includes('viz_main_impl.cc')) {
        return false;
      }
      return true;
    })
    .join('\n');

  if (filtered.trim().length > 0) {
    process.stderr.write(filtered + '\n');
  }
});

child.on('exit', (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
  } else {
    process.exit(code || 0);
  }
});
