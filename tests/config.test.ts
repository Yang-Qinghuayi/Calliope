import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
const require = createRequire(import.meta.url);
const { patchPodfile, patchGradle, patchProjectBuildGradle } = require('../plugins/withReadium.cjs');
test('native setup is idempotent and fails on unknown templates', () => {
  const pod = "target 'YSH' do\n post_install do |installer|\n end\nend";
  const patched = patchPodfile(pod);
  assert.equal(patchPodfile(patched), patched);
  assert.match(patched, /readium_pods\n/);
  assert.match(patched, /readium_post_install\(installer\)/);
  const gradle = patchGradle('android {\n}\ndependencies {\n}');
  assert.equal(patchGradle(gradle), gradle);
  assert.match(gradle, /coreLibraryDesugaringEnabled true/);
  assert.throws(() => patchGradle('unsupported'));
  assert.throws(() => patchPodfile('unsupported'));
  const rootGradle =
    "buildscript {\n  dependencies {\n    classpath('org.jetbrains.kotlin:kotlin-gradle-plugin')\n  }\n}";
  const patchedRoot = patchProjectBuildGradle(rootGradle);
  assert.equal(patchProjectBuildGradle(patchedRoot), patchedRoot);
  assert.match(patchedRoot, /android\.kotlinVersion/);
  assert.match(patchedRoot, /kotlin-gradle-plugin:/);
  assert.throws(() => patchProjectBuildGradle('unsupported'));
});
test('splash screen points at a real image for both light and dark themes', async () => {
  // Expo 的 Android 启动图样式无条件引用 @drawable/splashscreen_logo；
  // 不提供 image 时 prebuild 不会生成该资源，Gradle 资源链接会失败。
  const { default: config } = await import('../app.config.ts');
  const splash = config.plugins?.find(
    (plugin) => Array.isArray(plugin) && plugin[0] === 'expo-splash-screen'
  );
  assert.ok(Array.isArray(splash));
  const options = splash[1] as {
    image?: string;
    dark?: { image?: string };
  };
  for (const image of [options.image, options.dark?.image]) {
    assert.equal(typeof image, 'string');
    const bytes = readFileSync(resolve(process.cwd(), image!));
    assert.equal(bytes.subarray(0, 8).toString('hex'), '89504e470d0a1a0a');
    assert.ok(bytes.length > 100);
  }
});
test('NativeWind v5 semantic variables survive actual Tailwind and native CSS compilation', async () => {
  const postcss = require('postcss'),
    plugin = require('@tailwindcss/postcss');
  const { compile } = require('react-native-css/compiler');
  const result = await postcss([plugin()]).process(readFileSync('global.css', 'utf8'), {
    from: 'global.css',
  });
  const compiled = JSON.stringify(
    compile(result.css, { filename: 'global.css', projectRoot: process.cwd() }).stylesheet()
  );
  assert.ok(compiled.includes('app-background'));
  assert.ok(compiled.includes('bg-background'));
  assert.ok(compiled.includes('app-on-surface-variant'));
});
