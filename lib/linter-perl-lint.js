"use babel";

import path from "path";
import co from "co";
import dedent from "dedent";
import shellescape from "shell-escape";
import {install} from "atom-package-deps";
import {BufferedProcess} from "atom";
import pkg from "../package.json";

export default {

  isModuleInstalled: false,

  config: {
    perlLintConfigFileBasename: {
      type: "string",
      default: ".perllintrc",
      description: dedent`
      The extension (currently, only ".json" is supported) representing a file format
      is automatically appended.
      The configuration passed to \`Perl::Lint->new(HERE)\` directly.
      `
    },
    executeCommandViaShell: {
      type: "boolean",
      default: false
    },
    showPolicy: {
      type: "boolean",
      default: true
    }
  },

  activate(state) {
    install("linter-perl-lint");
  },

  deactivate() {},
  serialize() {},

  provideLinter() {
    const that = this;
    return {
      name: "Perl::Lint",
      grammarScopes: ["source.perl"],
      scope: "file",
      lintOnFly: true,
      lint(textEditor) {
        const filePath = textEditor.getPath();
        return co(function*() {
          if (!that.isModuleInstalled) {
            that.isModuleInstalled = yield that.checkModuleInstalled({
              cwd: path.dirname(filePath)
            });
            if (!that.isModuleInstalled) {
              throw new Error("Perl::Lint must be installed.");
            }
          }
          const [projectPath] = atom.project.relativizePath(filePath);
          const results = yield that.doLint(projectPath, filePath);
          return results
            .map(r => {
              const idx = r.line - 1;
              const res = {
                type: "Error",
                range: [[idx, 0], [idx, textEditor.lineTextForBufferRow(idx).length]],
                filePath
              };
              if (atom.config.get(`${pkg.name}.showPolicy`)) {
                const policy = r.policy.split("::").slice(3).join("::");
                const policyDocUrl = "https://metacpan.org/pod/Perl::Critic::Policy::" + policy;
                res.html = `<a href="${policyDocUrl}" class="badge badge-flexible perllint">${policy}</a> ${r.description}`;
              } else {
                res.text = r.description;
              }
              return res;
            });
        });
      }
    };
  },

  checkModuleInstalled(cwd) {
    return new Promise((resolve, reject) => {
      const [command, args] = this.buildCommand(
        "perl",
        ["-MPerl::Lint", "-e", "1"]
      );
      const options = {cwd};
      function exit(code) { resolve(!code); }
      new BufferedProcess({command, args, exit, options});
    });
  },

  doLint(projectPath, filePath) {
    return new Promise((resolve, reject) => {
      const buf = [];
      const [command, args] = this.buildCommand(
        "perl",
        [
          path.join(projectPath, "script/lint.pl"),
          path.join(projectPath, atom.config.get(`${pkg.name}.perlLintConfigFileBasename`)),
          filePath
        ]
      );
      const options = {cwd: path.dirname(filePath)};
      function stdout(output) { buf.push(output); }
      function stderr(output) { buf.push(output); }
      function exit(code) {
        const output = buf.join("");
        if (!code) {
          resolve(JSON.parse(output));
        } else {
          reject(new Error(output));
        }
      }
      new BufferedProcess({command, args, exit, stdout, stderr, options});
    });
  },

  buildCommand(command, args) {
    if (atom.config.get(`${pkg.name}.executeCommandViaShell`)) {
      args = ["-lc", shellescape([command].concat(args))];
      command = process.env.SHELL;
    }
    return [command, args];
  }

};
