(function(Scratch) {
  'use strict';
  // This is built for PM and not turbowarp.
  if (!Scratch.extensions.unsandboxed) {
    throw new Error('The Text Variable Access Extension must run unsandboxed');
  }
    // i stole a lot of this code from here: https://github.com/PenguinMod/PenguinMod-ExtensionsGallery/blob/main/static/extensions/VeryGoodScratcher42/More-Types.js
    const PATCHES_ID = "__patches_" + "textVarAccess";
    const patch = (obj, functions) => {
        if (obj[PATCHES_ID]) return;
        obj[PATCHES_ID] = {};
        for (const name in functions) {
            const original = obj[name];
            obj[PATCHES_ID][name] = obj[name];
            if (original) {
                obj[name] = function(...args) {
                    const callOriginal = (...args) => original.call(this, ...args);
                    return functions[name].call(this, callOriginal, ...args);
                };
            } else {
                obj[name] = function (...args) {
                    return functions[name].call(this, () => {}, ...args);
                }
            }
        }
    }
    
    // Fix report bubble
    patch(Scratch.vm.runtime.constructor.prototype, {
        visualReport(original, blockId, value) {
            if (Scratch.vm.editingTarget) {
                const block = vm.editingTarget.blocks.getBlock(blockId);
                if (block?.opcode === ("textVarAccess" + "_function") && !block.topLevel) return;
            }
            original(blockId, value);
        }
    });

  class TextVarAccess {
    constructor(runtime) {
      this._GETVAR = function _GETVAR(varName) {
        const targets = runtime.targets;
        for (const targetIdx in targets) {
          const target = targets[targetIdx];
          if (!target.isOriginal) continue;
          for (const varId in target.variables) {
            if (target.variables.hasOwnProperty(varId)) {
              const variable = target.variables[varId];
              if (variable.name === varName) {
                return [true, variable.value];
              }
            }
          }
        }
        return [false, "undefined"];
      }
      this._SETVAR = function _SETVAR(varName, value) {
        const targets = runtime.targets;
        for (const targetIdx in targets) {
          const target = targets[targetIdx];
          if (!target.isOriginal) continue;
          for (const varId in target.variables) {
            if (target.variables.hasOwnProperty(varId)) {
              const variable = target.variables[varId];
              if (variable.name === varName) {
                //console.log(varName, "was", variable.value, "as", typeof variable.value);
                //console.log("new value is", value, "as", typeof value)
                variable.value = value;
                //console.log(varName, "now is", variable.value, "as", typeof variable.value);
              }
            }
          }
        }
      }

      Scratch.vm.runtime.registerCompiledExtensionBlocks("textVarAccess", this.getCompileInfo());
    }
    getInfo() {
      return {
        id: 'textVarAccess',
        name: 'Text Variable Access',
        color1: "#32a8a4",
        blocks: [
          {
            opcode: "setVar",
            func: "noComp",
            blockType: Scratch.BlockType.COMMAND,
            text: "set [VARIABLE] to [VALUE]",
            arguments: {
              VARIABLE: {
                type: Scratch.ArgumentType.STRING,
              },
              VALUE: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: "0"
              }
            }
          },
          {
            opcode: "getVar",
            blockType: Scratch.BlockType.REPORTER,
            text: "variable [VARIABLE]",
            arguments: {
              VARIABLE: {
                type: Scratch.ArgumentType.STRING,
              }
            }
          },
        ],
      };
    }
    noComp(args, util) {
      // Check if monitor
      //console.log(util, util.thread.peekStack());
      throw "Please turn on compiler. " // If its not monitor
    }
    getCompileInfo() {
      return {
        ir: {
          setVar: (generator, block) => ({
            kind: "stack",
            variable: generator.descendInputOfBlock(block, "VARIABLE"),
            value   : generator.descendInputOfBlock(block, "VALUE"   ),
          }),
        },
        js: {
          setVar: (node, compiler, imports) => {
            const variable = compiler.descendInput(node.variable);
            const value    = compiler.descendInput(node.value   );
            const generatedJS = `vm.runtime.ext_textVarAccess._SETVAR(${variable.asUnknown()}, ${value.asUnknown()});\n`
            compiler.source += generatedJS
          }
        }
      }
    }
    getVar (args) {
      return vm.runtime.ext_textVarAccess._GETVAR(args.VARIABLE)[1]
    }
  }
  
  // Reimplementing the "output" and "outputShape" block parameters, also stolen.
    const cbfsb = Scratch.vm.runtime._convertBlockForScratchBlocks.bind(Scratch.vm.runtime);
    Scratch.vm.runtime._convertBlockForScratchBlocks = function(blockInfo, categoryInfo) {
        const res = cbfsb(blockInfo, categoryInfo);
        if (blockInfo.outputShape) {
            if (!res.json.outputShape) res.json.outputShape = blockInfo.outputShape;
        }
        if (blockInfo.output) {
            if (!res.json.output) res.json.output = blockInfo.output;
        }
        if (!res.json.branchCount) res.json.branchCount = blockInfo.branchCount;
        //f (!res.json.inputsInline) res.json.inputsInline = blockInfo.inputsInline
        blockInfo.tooltip ? res.json.tooltip = blockInfo.tooltip : 0;
        return res;
    }
    
  Scratch.extensions.register(new TextVarAccess(Scratch.vm.runtime));
})(Scratch);