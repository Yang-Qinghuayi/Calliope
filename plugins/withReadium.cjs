const { withPodfile, withAppBuildGradle, withProjectBuildGradle } = require('expo/config-plugins');
function patchPodfile(s) {
  if (s.includes('# ysh-readium')) return s;
  if (!/target .+ do/.test(s) || !s.includes('post_install do |installer|'))
    throw new Error('Readium: unexpected Podfile template');
  return `# ysh-readium\nsource 'https://github.com/readium/podspecs'\nsource 'https://cdn.cocoapods.org/'\nrequire_relative '../node_modules/react-native-readium/scripts/readium_pods'\nrequire_relative '../node_modules/react-native-readium/scripts/readium_post_install'\n${s}`
    .replace(/(target .+ do)/, '$1\n  readium_pods')
    .replace(
      'post_install do |installer|',
      'post_install do |installer|\n    readium_post_install(installer)'
    );
}
function patchGradle(s) {
  if (s.includes('// ysh-readium')) return s;
  if (!/android\s*\{/.test(s) || !/dependencies\s*\{/.test(s))
    throw new Error('Readium: unexpected Gradle template');
  if (!s.includes('compileOptions {'))
    s = s.replace(
      /android\s*\{/,
      'android {\n    compileOptions {\n        sourceCompatibility JavaVersion.VERSION_17\n        targetCompatibility JavaVersion.VERSION_17\n    }'
    );
  return (
    '// ysh-readium\n' +
    s
      .replace('compileOptions {', 'compileOptions {\n        coreLibraryDesugaringEnabled true')
      .replace(
        /dependencies\s*\{/,
        'dependencies {\n    coreLibraryDesugaring("com.android.tools:desugar_jdk_libs:2.1.5")'
      )
  );
}
// expo-build-properties writes `android.kotlinVersion` into gradle.properties and Expo
// uses it for kotlin-stdlib/KSP, but the RN template's root build.gradle still resolves
// kotlin-gradle-plugin from React Native's 2.1.x version catalog. Readium 3.3.0 ships
// Kotlin 2.3 metadata, so pin the plugin classpath to the same property at build time.
function patchProjectBuildGradle(s) {
  if (s.includes('// ysh-readium-kotlin')) return s;
  const target = "classpath('org.jetbrains.kotlin:kotlin-gradle-plugin')";
  if (!s.includes(target)) throw new Error('Readium: unexpected android/build.gradle template');
  const pinned =
    "classpath(\"org.jetbrains.kotlin:kotlin-gradle-plugin:${project.findProperty('android.kotlinVersion') ?: '2.1.20'}\")";
  return '// ysh-readium-kotlin\n' + s.replace(target, pinned);
}
module.exports = function withReadium(config) {
  config = withPodfile(config, (mod) => {
    mod.modResults.contents = patchPodfile(mod.modResults.contents);
    return mod;
  });
  config = withAppBuildGradle(config, (mod) => {
    mod.modResults.contents = patchGradle(mod.modResults.contents);
    return mod;
  });
  return withProjectBuildGradle(config, (mod) => {
    mod.modResults.contents = patchProjectBuildGradle(mod.modResults.contents);
    return mod;
  });
};
module.exports.patchPodfile = patchPodfile;
module.exports.patchGradle = patchGradle;
module.exports.patchProjectBuildGradle = patchProjectBuildGradle;
