(function(Scratch) {
    'use strict';
  
    if (!Scratch.extensions.unsandboxed) {
      throw new Error('The Text Variable Access extension must run unsandboxed');
    }
    const vm = Scratch.vm;
  
    function _getVar(varName) {
      const targets = vm.runtime.targets;
      for (const targetIdx in targets) {
        const target = targets[targetIdx];
        if (!target.isOriginal) continue;
        for (const varId in target.variables) {
          if (target.variables.hasOwnProperty(varId)) {
            const variable = target.variables[varId];
            if (variable.name === varName) {
              return [true, variable.value.toString()];
            }
          }
        }
      }
      return [false, "undefined"];
    }
  
    function _setVar(varName, value) {
      const targets = vm.runtime.targets;
      for (const targetIdx in targets) {
        const target = targets[targetIdx];
        if (!target.isOriginal) continue;
        for (const varId in target.variables) {
          if (target.variables.hasOwnProperty(varId)) {
            const variable = target.variables[varId];
            if (variable.name === varName) {
              variable.value = value;
            }
          }
        }
      }
    }
  
    class VarAccess {
      getInfo() {
        return {
          id: 'varaccess',
          name: 'Text Variable Access',
          color1: "#d4771c",
          blocks: [
            {
              opcode: 'getVar',
              blockType: Scratch.BlockType.REPORTER,
              text: 'variable [VARIABLE]',
              arguments: {
                VARIABLE: {
                  type: Scratch.ArgumentType.STRING,
                }
              }
            },
            {
              opcode: 'setVar',
              blockType: Scratch.BlockType.COMMAND,
              text: 'set [VARIABLE] to [VALUE]',
              arguments: {
                VARIABLE: {
                  type: Scratch.ArgumentType.STRING,
                },
                VALUE: {
                  type: Scratch.ArgumentType.STRING,
                },
              }
            },
            {
              opcode: 'varExists',
              blockType: Scratch.BlockType.BOOLEAN,
              text: 'variable [VARIABLE] exists?',
              arguments: {
                VARIABLE: {
                  type: Scratch.ArgumentType.STRING,
                }
              }
            },
          ],
        };
      }
      getVar(args) {
        return _getVar(args.VARIABLE)[1];
      }
      setVar(args) {
        _setVar(args.VARIABLE, args.VALUE)
      }
      varExists(args) {
        return _getVar(args.VARIABLE)[0];
      }
    }
    Scratch.extensions.register(new VarAccess());
  })(Scratch);
  
  
  