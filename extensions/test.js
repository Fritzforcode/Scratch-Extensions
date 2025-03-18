(function(Scratch) {
    'use strict';
  
    if (!Scratch.extensions.unsandboxed) {
      throw new Error('This test extension must run unsandboxed');
    }
    const vm = Scratch.vm;
  
    
    class TestExt {
      constructor() {
        Scratch.vm.runtime.registerCompiledExtensionBlocks("vgscompiledvalues", this.getCompileInfo());
      }
      getInfo() {
        return {
          id: "testext",
          name: 'Test Extension',
          color1: "#d4ff1c",
          blocks: [
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
          ],
        };
      }
      getCompileInfo() {
        return {
          ir: {
            //setVar: (generator, block) => ({
            //  kind: "stack",
            //  variable: generator.descendVariable(block, "VARIABLE", ""),
            //  value: generator.descendInputOfBlock(block, "VALUE")
            //}),
            setVar: (generator, block) => {
              console.log("IR gen=", typeof generator, generator, "block=", typeof block, block);
              return {
                  kind: "stack",
                  variable: generator.descendVariable(block, "VARIABLE", ""),
                  value: generator.descendInputOfBlock(block, "VALUE")
              };
            },
          },
          js: {
            setVar: (node, compiler, imports) => {
              console.log("JS node=", typeof node, node, "compiler=", typeof compiler, compiler, "imports=", typeof imports, imports);
              //const variable = compiler.descendVariable(node.variable);
              //const value = compiler.descendInput(node.value);
              //variable.setInput(value);
              //compiler.source += ${variable.source} = ${value.asUnknown()};\n
            },
          },
        }
      }
      setVar(args) {
        console.log("GOT", typeof args.VALUE, args.VALUE)
        return "HI ;)"
      }
    }
    Scratch.extensions.register(new TestExt());
  })(Scratch);
