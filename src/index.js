#!/usr/bin/env node
import defaultsDeep from 'lodash.defaultsdeep';
import { devDependencies as eslintVersions } from '../package.json';
import jsonFile from 'packagesmith.formats.json';
import { runProvisionerSet } from 'packagesmith';
import sortPackageJson from 'sort-package-json';
const eslintVersion = eslintVersions.eslint;
const presetOptions = {
  'strict': eslintVersions['eslint-config-strict'],
  'xo': eslintVersions['eslint-config-xo'],
  'google': eslintVersions['eslint-config-google'],
  'standard': eslintVersions['eslint-config-standard'],
  'airbnb': eslintVersions['eslint-config-airbnb'],
  'semistandard': eslintVersions['eslint-config-semistandard'],
  'defaults': eslintVersions['eslint-config-defaults'],
  'strongloop': eslintVersions['eslint-config-strongloop'],
};
export function provisionEslint({
  eslintConfig = false,
  scriptName = 'lint',
  presets,
  pretest = false,
  formatScriptName = false,
} = {}) {
  const presetsQuestion = {
    type: 'list',
    name: 'eslintPreset',
    message: 'Which preset would you like to use for eslint?',
    choices: Object.keys(presetOptions).map((name) => ({ name, value: name })),
    when: (answers) => 'eslintPreset' in answers === false,
  };
  return {
    'package.json': {
      after: 'npm install',
      questions: presets ? [] : [ presetsQuestion ],
      contents: jsonFile((contents, { eslintPreset } = {}) => {
        let chosenPresets = presets || eslintPreset;
        if (typeof chosenPresets === 'string') {
          chosenPresets = { [chosenPresets]: presetOptions[chosenPresets] };
        }
        const devDependencies = Object.keys(chosenPresets)
          .reduce((total, preset) => {
            total[`eslint-config-${ preset.replace(/^eslint-config/, '') }`] = chosenPresets[preset];
            return total;
          }, {});
        devDependencies.eslint = eslintVersion;
        const packageJson = {
          eslintConfig: eslintConfig || {
            extends: Object.keys(chosenPresets).map((preset) => preset.replace(/^eslint-config/, '')),
          },
          devDependencies,
          scripts: {
            [scriptName]: 'eslint $npm_package_directories_src',
          },
        };
        if (pretest) {
          packageJson.scripts.pretest = `npm run ${ scriptName }`;
        }
        if (formatScriptName) {
          packageJson.scripts[formatScriptName] = 'eslint --fix $npm_package_directories_src';
        }
        return sortPackageJson(defaultsDeep(packageJson, contents, {
          directories: {
            src: 'src',
          },
        }));
      }),
    },
  };
}
export default provisionEslint;

if (require.main === module) {
  const directoryArgPosition = 2;
  runProvisionerSet(process.argv[directoryArgPosition] || '.', provisionEslint());
}
