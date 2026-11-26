const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

exports.default = async function (context) {
  if (context.electronPlatformName !== 'darwin') return;

  const appName = `${context.packager.appInfo.productFilename}.app`;
  const appPath = path.join(context.appOutDir, appName);

  if (!fs.existsSync(appPath)) {
    console.warn(`[afterPack] App not found at ${appPath}`);
    return;
  }

  console.log(`[afterPack] Signing native helpers and bundle with designated requirement at ${appPath}...`);

  const binDir = path.join(appPath, 'Contents', 'Resources', 'bin');
  if (fs.existsSync(binDir)) {
    const helpers = fs.readdirSync(binDir);
    for (const helper of helpers) {
      const helperPath = path.join(binDir, helper);
      const helperId = `com.astro.traductor.${helper}`;
      try {
        execSync(`codesign -s - --force --identifier "${helperId}" -r='designated => identifier "${helperId}"' "${helperPath}"`, { stdio: 'inherit' });
        console.log(`[afterPack] Signed helper: ${helper}`);
      } catch (e) {
        console.warn(`[afterPack] Warning signing helper ${helper}:`, e.message);
      }
    }
  }

  try {
    execSync(`codesign -s - --force --deep --identifier "com.astro.traductor" -r='designated => identifier "com.astro.traductor"' "${appPath}"`, { stdio: 'inherit' });
    console.log(`[afterPack] Successfully signed ${appName} with designated requirement: identifier "com.astro.traductor"`);
  } catch (e) {
    console.error(`[afterPack] Error signing app bundle:`, e.message);
  }
};
