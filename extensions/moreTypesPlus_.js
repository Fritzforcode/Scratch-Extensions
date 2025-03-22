(function(Scratch) {
  'use strict';
  // This is built for PM and not turbowarp.
    if (!Scratch.extensions.unsandboxed) {
      throw new Error('The More Types Plus Extension must run unsandboxed');
    }
    //Make sure More Types is loaded!
    if (!Scratch.vm.extensionManager.isExtensionLoaded("vgscompiledvalues")) {
      Scratch.vm.runtime.extensionManager.loadExtensionURL("https://extensions.penguinmod.com/extensions/VeryGoodScratcher42/More-Types.js");
    }
    //Make sure Temporary Variables is loaded!
    //if (!Scratch.vm.extensionManager.isExtensionLoaded("lmsTempVars2")) {
    //  Scratch.vm.runtime.extensionManager.loadExtensionURL("https://extensions.turbowarp.org/Lily/TempVariables2.js");
    //}
    const PATCHES_ID = "__patches_" + "moreTypesPlus";
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
                if (block?.opcode === ("moreTypesPlus" + "_function") && !block.topLevel) return;
            }
            original(blockId, value);
        }
    });

  class MoreTypesPlus {
    constructor(runtime) {
      Scratch.vm.runtime.registerCompiledExtensionBlocks("moreTypesPlus", this.getCompileInfo());
    }
    getInfo() {
      return {
        id: 'moreTypesPlus',
        name: 'More Types Plus',
        color1: "#32a8a4",
        blocks: [
          {
            opcode: "par",
            blockType: Scratch.BlockType.COMMAND,
            text: "par [IN]",
            arguments: {
              IN: {type: Scratch.ArgumentType.STRING},
            },
          },
          {
            opcode: "newObject",
            blockType: Scratch.BlockType.REPORTER,
            text: "new object",
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
          par: (generator, block) => ({
            kind: "stack",
            in: generator.descendInputOfBlock(block, "IN"),
          }),
          newObject: (generator, block) => ({
            kind: "input",
            type: block.fields.CLASS.value,
          }),
        },
        js: {
          par: (node, compiler, imports) => {
            console.log(node);
          },
          newObject: (node, compiler, imports) => {
            let object = "4+3";
            return new (imports.TypedInput)(object, imports.TYPE_UNKNOWN);
          },
        }
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
    
  Scratch.extensions.register(new MoreTypesPlus(Scratch.vm.runtime));
})(Scratch);