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
        let jsValues = this
        jsValues.getVar = function(id, name, type = "") {
          const targets = Scratch.vm.runtime.targets;
          for (const name in targets) {
            const target = targets[name];
            if (!target.isOriginal) continue;
            if (target.variables.hasOwnProperty(id)) {
              return target.variables[id].value.toString();
            }
            for (const varId in target.variables) {
              if (target.variables.hasOwnProperty(varId)) {
                const variable = target.variables[varId];
                if (variable.name === name && variable.type === type) {
                  return variable.value.toString();
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
              tooltip: "bro it sets variable to a value what do you expect",
              arguments: {
                VARIABLE: {
                  type: Scratch.ArgumentType.VARIABLE,
                },
                VALUE: {
                  type: Scratch.ArgumentType.STRING,
                  defaultValue: "0"
                }
              }
            },
            {
              opcode: "getVar",
              func: "noComp",
              blockType: Scratch.BlockType.REPORTER,
              outputShape: 3,
              blockShape: Scratch.BlockShape.SQUARE,
              text: "variable [VARIABLE]",
              tooltip: "why do you want to read this? learn scratch instead.",
              arguments: {
                VARIABLE: {
                  type: Scratch.ArgumentType.VARIABLE
                }
              }
            },
            {
              opcode: "someBlock",
              func: "noComp",
              blockType: Scratch.BlockType.COMMAND,
              text: "do sth with [MY_INPUT]",
              arguments: {
                MY_INPUT: {
                  type: Scratch.ArgumentType.STRING,
                  defaultValue: "sdfgcx",
                }
              }
            },
          ],
        };
      }
      noComp(args, util) {
        // Check if monitor
        //console.log(util, util.thread.peekStack());
        if (util.thread.peekStack().startsWith("textVarAccess_getVar")) {
          // do stuff
          //console.log(args.VARIABLE)
          return this.getVar(args.VARIABLE.id, args.VARIABLE.name)
        }
        throw "Please turn on compiler. " // If its not monitor
      }
      getCompileInfo() {
        return {
          ir: {
            setVar: (generator, block) => ({
              kind: "stack",
              variable: generator.descendVariable(block, "VARIABLE", ""),
              value: generator.descendInputOfBlock(block, "VALUE")
            }),
            getVar: (generator, block) => ({
              kind: "input",
              variable: generator.descendVariable(block, "VARIABLE", ""),
            }),
            //someBlock: (generator, block) => (generator.script.yields = true, { // Tell the compiler that the script needs to yield cuz it does
            someBlock: (generator, block) => ({            
              kind: "stack",
              my_input: generator.descendInputOfBlock(block, "MY_INPUT")
            }),
          },
          js: {
            setVar: (node, compiler, imports) => {
              console.log("SETV node=", node);
              console.log("SETV compiler=", compiler);
              const variable = compiler.descendVariable(node.variable);
              const value = compiler.descendInput(node.value);
              console.log("SETV var=", variable);
              console.log("SETV val=", value);
              variable.setInput(value);
              compiler.source += `${variable.source} = ${value.asUnknown()};\n`
            },
            getVar: (node, compiler, imports) => {
              console.log("GETV node=", node);
              console.log("GETV compiler=", compiler);
              const variable = compiler.descendVariable(node.variable);
              console.log("GETV var=", variable);
              return new (imports.TypedInput)(`${variable.source}`, imports.TYPE_UNKNOWN)
            },
            someBlock: (node, compiler, imports) => {
              console.log("===========================================================================");
              console.log("SB node=", node);
              console.log("SB compiler=", compiler);
              const my_input = compiler.descendInput(node.my_input);
              console.log("SB my_input=", my_input, my_input.asUnknown());
              console.log(vm.runtime.ext_textVarAccess);
              //compiler.source += `   \n`
              console.log("");
              compiler.source += 'console.log("DID IT", runtime)\n'
            },
            //someBlock: (node, compiler, imports) => {
            //  const local = compiler.localVariables.next();
            //  const func = compiler.descendInput(node.func);
            //  const getFunc = `(runtime.ext_vgscompiledvalues.getStore(globalState.thread, "${local}")).func`;
            //  if (!compiler.script.yields === true) throw "Something happened in the More Types extension"
            //  compiler.source+=`(yield* (${getFunc} = ${func.asUnknown()},\n  (runtime.ext_vgscompiledvalues.typeof(${getFunc}) === "Function") ?\n  \ \ ${getFunc}.call() :\n  \ \ runtime.ext_vgscompiledvalues.throwErr("Attempted to call non-function.")));`
            //},
          }
        }
      }
      makeLabel(text) {
        return {
          blockType: Scratch.BlockType.LABEL,
          text: text
        }
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