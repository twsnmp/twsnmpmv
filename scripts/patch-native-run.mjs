import fs from 'node:fs';
import path from 'node:path';

const projectRoot = process.cwd();

// 1. Patch simulator.js in native-run
const simulatorJsPath = path.join(projectRoot, 'node_modules/native-run/dist/ios/utils/simulator.js');
if (fs.existsSync(simulatorJsPath)) {
  let content = fs.readFileSync(simulatorJsPath, 'utf8');

  // Fix A: Do not crash if Simulator.app does not exist (Xcode 16+ / Xcode 27 DeviceHub migration)
  if (!content.includes('DeviceHub')) {
    content = content.replace(
      /const openResult = \(0, child_process_1\.spawnSync\)\('open', \[`\${xCodePath}\/Applications\/Simulator\.app`[\s\S]*?if \(openResult\.status\) \{[\s\S]*?throw new errors_1\.Exception\(`There was an error opening simulator: \${openResult\.stderr}`\);[\s\S]*?\}/,
      `const xCodePath = await (0, xcode_1.getXCodePath)();
    debug(\`Running simulator \${udid}\`);
    let openResult = (0, child_process_1.spawnSync)('open', [\`\${xCodePath}/Applications/Simulator.app\`, '--args', '-CurrentDeviceUDID', udid], { encoding: 'utf8' });
    if (openResult.status) {
        openResult = (0, child_process_1.spawnSync)('open', ['-a', 'DeviceHub', '--args', '-CurrentDeviceUDID', udid], { encoding: 'utf8' });
        if (openResult.status) {
            (0, child_process_1.spawnSync)('open', ['-a', 'Simulator', '--args', '-CurrentDeviceUDID', udid], { encoding: 'utf8' });
        }
    }`
    );
  }

  // Fix B: Filter simulators to latest runtime & available devices only to avoid clutter and duplicates
  if (!content.includes('iOSRuntimes')) {
    content = content.replace(
      /return output\.runtimes[\s\S]*?\.reduce\(\(prev, next\) => prev\.concat\(next\)\)[\s\S]*?\.sort\(\(a, b\) => \(a\.name < b\.name \? -1 : 1\)\);/,
      `const iOSRuntimes = (output.runtimes || [])
            .filter((r) => (r.platform === 'iOS' || !r.platform) && r.isAvailable && !r.name.includes('watch') && !r.name.includes('tv'))
            .sort((a, b) => (b.version || '').localeCompare(a.version || '', undefined, { numeric: true }));
        const latestRuntime = iOSRuntimes[0];
        const runtimesToUse = latestRuntime ? [latestRuntime] : iOSRuntimes;

        const allSims = [];
        // Add currently Booted simulators first
        for (const [runtimeId, devices] of Object.entries(output.devices || {})) {
            for (const d of devices) {
                if (d.isAvailable && d.state === 'Booted' && !d.name.includes('Watch') && !d.name.includes('TV')) {
                    const verMatch = runtimeId.match(/iOS[ -]?([0-9.]+)/i);
                    const ver = verMatch ? verMatch[1].replace(/-/g, '.') : '';
                    allSims.push({ ...d, runtime: { name: runtimeId, version: ver } });
                }
            }
        }
        // Add devices from latest iOS runtime
        for (const runtime of runtimesToUse) {
            const devices = output.devices[runtime.identifier] || output.devices[runtime.name] || [];
            for (const d of devices) {
                if (d.isAvailable && !allSims.some((s) => s.udid === d.udid)) {
                    allSims.push({ ...d, runtime });
                }
            }
        }
        return allSims.sort((a, b) => (a.state === 'Booted' ? -1 : b.state === 'Booted' ? 1 : a.name.localeCompare(b.name)));`
    );
  }

  fs.writeFileSync(simulatorJsPath, content, 'utf8');
  console.log('Successfully patched native-run simulator.js');
}

// 2. Patch device.js in native-run (prevent usbmuxd timeout on locked/offline real devices)
const deviceJsPath = path.join(projectRoot, 'node_modules/native-run/dist/ios/utils/device.js');
if (fs.existsSync(deviceJsPath)) {
  let content = fs.readFileSync(deviceJsPath, 'utf8');
  if (!content.includes('timeoutMs')) {
    content = content.replace(
      /return Promise\.all\(usbmuxDevices\.map\(async \(d\) => \{[\s\S]*?return device;\s*\}\)\);/,
      `const timeoutMs = (p, ms) => Promise.race([p, new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), ms))]);
    const results = await Promise.all(usbmuxDevices.map(async (d) => {
        try {
            const socket = await timeoutMs(new lib_1.UsbmuxdClient(lib_1.UsbmuxdClient.connectUsbmuxdSocket()).connect(d, 62078), 1500);
            const device = await timeoutMs(new lib_1.LockdowndClient(socket).getAllValues(), 2000);
            socket.end();
            if (!device.UniqueDeviceID && d.Properties && d.Properties.SerialNumber) {
                device.UniqueDeviceID = d.Properties.SerialNumber;
            }
            return device;
        } catch {
            return null;
        }
    }));
    return results.filter(Boolean);`
    );
    fs.writeFileSync(deviceJsPath, content, 'utf8');
    console.log('Successfully patched native-run device.js');
  }
}

// 3. Patch @capacitor/cli native-run.js error handling
const capNativeRunJs = path.join(projectRoot, 'node_modules/@capacitor/cli/dist/util/native-run.js');
if (fs.existsSync(capNativeRunJs)) {
  let content = fs.readFileSync(capNativeRunJs, 'utf8');
  if (!content.includes('ERR_NATIVE_RUN')) {
    content = content.replace(
      /catch \(e\) \{\s*const err = JSON\.parse\(e\);\s*errors\.push\(err\);\s*\}/,
      `catch (e) {
        try {
            const err = typeof e === 'string' ? JSON.parse(e) : JSON.parse(e.message || String(e));
            errors.push(err);
        } catch {
            errors.push({ error: String(e && (e.message || e)), code: 'ERR_NATIVE_RUN' });
        }
    }`
    );
    fs.writeFileSync(capNativeRunJs, content, 'utf8');
    console.log('Successfully patched @capacitor/cli native-run.js');
  }
}
