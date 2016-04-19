import chai from 'chai';
import { devDependencies as eslintVersions } from '../package.json';
import provisionEslint from '../src/';
chai.should();
const eslintVersion = eslintVersions.eslint || 'NO VERSION';
describe('provisionEslint', () => {

  it('returns an object with `package.json`.`contents` function', () => {
    provisionEslint()
      .should.be.an('object')
      .with.keys([ 'package.json' ])
      .with.property('package.json')
        .with.keys([ 'contents', 'after', 'questions' ])
        .with.property('contents')
          .that.is.a('function');
  });

  it('returns an object with eslintPreset question if `presets` not given', () => {
    provisionEslint()['package.json'].questions
      .should.have.lengthOf(1)
        .with.property(0)
          .with.property('name', 'eslintPreset');
  });

  it('returns an object without eslintPreset question if `presets` given', () => {
    provisionEslint({ presets: 'foo' })['package.json'].questions
      .should.have.lengthOf(0);
  });

  describe('eslintPreset question', () => {
    let question = null;
    beforeEach(() => {
      question = provisionEslint()['package.json'].questions[0];
    });

    it('has the right properties', () => {
      question.should.have.keys([ 'type', 'name', 'message', 'choices', 'when' ]);
    });

    it('includes sensible choices', () => {
      question.choices.should.deep.contain.members([
        { name: 'xo', value: 'xo' },
        { name: 'standard', value: 'standard' },
        { name: 'strict', value: 'strict' },
        { name: 'airbnb', value: 'airbnb' },
      ]);
    });

  });

  describe('contents function', () => {
    let subFunction = null;
    beforeEach(() => {
      subFunction = provisionEslint()['package.json'].contents;
    });

    it('adds eslint directives to json, when given answers.eslintPreset', () => {
      JSON.parse(subFunction('{}', { eslintPreset: 'strict' }))
        .should.deep.equal({
          directories: {
            src: 'src',
          },
          devDependencies: {
            'eslint': eslintVersion,
            'eslint-config-strict': eslintVersions['eslint-config-strict'] || 'NO VERSION',
          },
          eslintConfig: {
            extends: [
              'strict',
            ],
          },
          scripts: {
            'lint': 'eslint $npm_package_directories_src',
          },
        });
    });

    it('adds different `extends` and `devDependencies` when given different preset', () => {
      JSON.parse(subFunction('{}', { eslintPreset: 'xo' }))
        .should.deep.equal({
          directories: {
            src: 'src',
          },
          devDependencies: {
            'eslint': eslintVersion,
            'eslint-config-xo': eslintVersions['eslint-config-xo'] || 'NO VERSION',
          },
          eslintConfig: {
            extends: [
              'xo',
            ],
          },
          scripts: {
            'lint': 'eslint $npm_package_directories_src',
          },
        });
    });

    it('overrides eslintPreset with `presets` config option', () => {
      JSON.parse(provisionEslint({ presets: 'xo' })['package.json'].contents('{}'), {})
        .should.deep.equal({
          directories: {
            src: 'src',
          },
          devDependencies: {
            'eslint': eslintVersion,
            'eslint-config-xo': eslintVersions['eslint-config-xo'] || 'NO VERSION',
          },
          eslintConfig: {
            extends: [
              'xo',
            ],
          },
          scripts: {
            'lint': 'eslint $npm_package_directories_src',
          },
        });
    });

    it('accepts custom `presets`', () => {
      JSON.parse(provisionEslint({ presets: { 'foo': '^1.2.3' } })['package.json'].contents('{}'), {})
        .should.deep.equal({
          directories: {
            src: 'src',
          },
          devDependencies: {
            'eslint': eslintVersion,
            'eslint-config-foo': '^1.2.3',
          },
          eslintConfig: {
            extends: [
              'foo',
            ],
          },
          scripts: {
            'lint': 'eslint $npm_package_directories_src',
          },
        });
    });

    it('overrides `eslintConfig` with `eslintConfig` option', () => {
      subFunction = provisionEslint({
        presets: {},
        eslintConfig: {
          rules: {
            foo: 'bar',
          },
        },
      })['package.json'].contents;

      JSON.parse(subFunction('{}'))
        .should.deep.equal({
          directories: {
            src: 'src',
          },
          devDependencies: {
            'eslint': eslintVersion,
          },
          eslintConfig: {
            rules: {
              foo: 'bar',
            },
          },
          scripts: {
            'lint': 'eslint $npm_package_directories_src',
          },
        });
    });

    it('changes scripts name with `scriptName` option', () => {
      subFunction = provisionEslint({
        presets: {},
        scriptName: 'build:js',
      })['package.json'].contents;

      JSON.parse(subFunction('{}'))
        .should.deep.equal({
          directories: {
            src: 'src',
          },
          devDependencies: {
            'eslint': eslintVersion,
          },
          eslintConfig: {
            extends: [],
          },
          scripts: {
            'build:js': 'eslint $npm_package_directories_src',
          },
        });
    });

    it('adds pretest: npm run lint, if config.pretest = true', () => {
      subFunction = provisionEslint({
        presets: {},
        pretest: true,
      })['package.json'].contents;

      JSON.parse(subFunction('{}'))
        .should.deep.equal({
          directories: {
            src: 'src',
          },
          devDependencies: {
            'eslint': eslintVersion,
          },
          eslintConfig: {
            extends: [],
          },
          scripts: {
            'lint': 'eslint $npm_package_directories_src',
            'pretest': 'npm run lint',
          },
        });
    });

    it('adds formatScriptName if present', () => {
      subFunction = provisionEslint({
        presets: {},
        formatScriptName: 'fmt',
      })['package.json'].contents;

      JSON.parse(subFunction('{}'))
        .should.deep.equal({
          directories: {
            src: 'src',
          },
          devDependencies: {
            'eslint': eslintVersion,
          },
          eslintConfig: {
            extends: [],
          },
          scripts: {
            'lint': 'eslint $npm_package_directories_src',
            'fmt': 'eslint --fix $npm_package_directories_src',
          },
        });
    });

  });

});
