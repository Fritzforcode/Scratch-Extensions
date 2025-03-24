(function(Scratch) {
    'use strict';
    // This is built for PM and not turbowarp.
    // i stole all of this code from here: https://github.com/PenguinMod/PenguinMod-ExtensionsGallery/blob/main/static/extensions/VeryGoodScratcher42/More-Types.js
    if (!Scratch.extensions.unsandboxed) {
      throw new Error('More Types Plus must run unsandboxed');
    }
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
      const unpatch = (obj) => {
          if (!obj[PATCHES_ID]) return;
          for (const name in obj[PATCHES_ID]) {
              obj[name] = obj[PATCHES_ID][name];
          }
          obj[PATCHES_ID] = null;
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
        this.runtime = runtime;
        this.throwErr = (msg) => {
          throw msg;
        }
        const stores = new Map();
        this.getStore = function(thread, str) {
          if (!stores.get(thread)) {
            stores.set(thread, {[str]: {}});
          }
          if (!stores.get(thread)[str]) {
            stores.get(thread)[str] = {};
          }
          return stores.get(thread)[str];
        }
        this.retireStore= function(thread, str) {
          const store = this.getStore(thread, str);
          const val = store[str];
          delete store[str]; 
          return val;
        }
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
          let varFound = false;
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
                  varFound = true;
                  //console.log(varName, "now is", variable.value, "as", typeof variable.value);
                }
              }
            }
          }
          if (!varFound) {
            throw "Variable \"" + varName + "\" not found"
          }
        }
        this._GENERATEVARID = function _GENERATEVARID() {
          const varIdCharset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ!#%()*+,-./:;=?@[]^_`{|}~";
          let token = '';
          for (let i = 0; i < 20; i++) {
              const randomIndex = Math.floor(Math.random() * varIdCharset.length);
              token += varIdCharset[randomIndex];
          }
          return token;
        }
          
        this._CREATEVAR = function _CREATEVAR(targetIdx, varName) {
          if (this._GETVAR(varName)[0]) {
            return; // if var alredy exists, do nothing
          }
          const targets = runtime.targets;
          const target = targets[targetIdx];
          const id = this._GENERATEVARID();
          while (target.variables.hasOwnProperty(id)) {
            const id = this._GENERATEVARID();
          }
          target.lookupOrCreateVariable(id, varName);
        }
        
        this._DELETEVAR = function _DELETEVAR(varName) {
          const targets = runtime.targets;
          for (const targetIdx in targets) {
            const target = targets[targetIdx];
            if (!target.isOriginal) continue;
            for (const varId in target.variables) {
              if (target.variables.hasOwnProperty(varId)) {
                const variable = target.variables[varId];
                if (variable.name === varName) {
                  delete target.variables[varId];
                }
              }
            }
          }
        }
        this.typeof = function TYPEOF(value) {
          let isPrimitive = Object(value) !== value;
          if (isPrimitive) {
            let type = Object.prototype.toString.call(value).slice(8, -1).toLowerCase()
            return type;
          }
          if (value === this.Nothing) {
            return "nothing"; // its basically just undefined.
          }
          if (value instanceof this.Object) {
            return "Object";
          }
          if (value instanceof this.Array) {
            return "Array";
          }
          if (value instanceof this.Set) {
            return "Set"
          }
          if (value instanceof this.Map) {
            return "Map"
          }
          if (value instanceof this.Symbol) {
            return "Symbol"
          }
          if (value instanceof this.Function) {
            return "Function"
          }
          if (value instanceof this.Class) {
            return "Class"
          }
          return "unknown"
        }
        this.clone = function CLONE(value) {
          if (this.typeof(value) === "Object") {
            return new (this.Object)(structuredClone(value.__values))
          } else if (this.typeof(value) === "Array") {
            return new (this.Array)(structuredClone(value.__values))
          } else if (this.typeof(value) === "Set") {
            return new (this.Set)(structuredClone(value.__values))
          } else if (this.typeof(value) === "Map") {
            return new (this.Map)(structuredClone(value.__values))
          } else if (this.typeof(value) === "RegularExpression") {
            return new (this.RegExp)(structuredClone(value.__values))
          } else if (this.typeof(value) === "Function") {
            throw "Cannot clone a function."
          } 
          throw `Attempted to clone value of type ${this.typeof(value)}`
        }

        
        this.TempFunctionDef = class TempFunctionDef {
          constructor() {
            this.args = [];
            this.argDefaults = {};
            this.hasOptionalArgs = false;
          }
          toString() {
            return `FunctionDef(args=${JSON.stringify(this.args)}, argDefaults=${JSON.stringify(this.argDefaults)})`
          }
          getArgIndex(name) {
            return this.args.indexOf(name);
          }
          hasArg(name) {
            return name in this.args;
          }
          argIsOptional(name) {
            return this.argDefaults.hasOwnProperty(name);
          }
          getArgDefault(name) {
            return this.argDefaults[name];
          }
        }
        this.functionDefLayers = [];
        this.enterFunctionDef = function () {
          this.functionDefLayers.push(new this.TempFunctionDef());
        }
        this.exitFunctionDef = function () {
          if (this.functionDefLayers.length === 0) {
            throw "Internal Error";
          }
          const r = this.functionDefLayers.pop();
          console.log("exit", r);
          return r
        }
        this.addFunctionDefArg = function (name) {
          if (this.functionDefLayers.length === 0) {
            throw '"Add Argument" cannot be used outside a function definition block';
          }
          const fdef = this.functionDefLayers[this.functionDefLayers.length-1]
          if (fdef.hasArg(name)) {
            throw `Argument ${name} alredy exists`
          }
          if (fdef.hasOptionalArgs) {
            throw "A positional argument cannot follow an optional argument";
          }
          fdef.args.push(name.toString());
        }
        this.addOptionalFunctionDefArg = function (name, defaultVal) {
          if (this.functionDefLayers.length === 0) {
            throw '"Add Argument with Default" cannot be used outside a function definition block';
          }
          const fdef = this.functionDefLayers[this.functionDefLayers.length-1]
          if (fdef.hasArg(name)) {
            throw `Argument ${name} alredy exists`
          }
          fdef.args.push(name.toString());
          fdef.argDefaults[name.toString()] = defaultVal;
          fdef.hasOptionalArgs = true;
        }
        
        this.TempFunctionCall = class TempFunctionCall {
          constructor(fdef) {
            this.fdef          = fdef;
            this.setArgValues  = {};
            this.setArgsByName = false; 
          }
          convert() {
            let argValues = [];
            for (let index = 0; index < this.fdef.args.length; index++) {
              let name = this.fdef.args[index];
              if (this.setArgValues.hasOwnProperty(index)) {
                argValues.push(this.setArgValues[index]);
              } else if (this.fdef.argIsOptional(name)) {
                argValues.push(this.fdef.getArgDefault(name));
              } else {
                throw "A non-optional argument was not set."
              }
            }
            return argValues;
          }
        }
        this.functionCallLayers = [];
        this.enterFunctionCall = function (fdef) {
          this.functionCallLayers.push(new this.TempFunctionCall(fdef));
        }
        this.exitFunctionCall = function () {
          if (this.functionCallLayers.length === 0) {
            throw "Internal Error";
          }
          const r = this.functionCallLayers.pop();
          console.log("exit", r);
          return r
        }
        this.setNextFunctionCallArg = function (value) {
          const fcall = this.functionCallLayers[this.functionCallLayers.length-1];
          if (fcall.setArgValues.length >= fcall.fdef.args.length) {
            throw "Attempted setting more arguments then were defined.";
          }
          if (fcall.setArgsByName) {
            throw "Attempted setting an argument positionally after setting an argument by name.";
          }
          fcall.setArgValues[Object.keys(fcall.setArgValues).length] = value;
        }
        this.setFunctionCallArgByName = function (name, value) {
          const fcall = this.functionCallLayers[this.functionCallLayers.length-1];
          const argIndex = fcall.fdef.getArgIndex(name);
          if (argIndex === -1) {
            throw `Attempted setting never declared argument ${name}.`;
          }
          if (fcall.setArgValues.hasOwnProperty(argIndex)) {
            throw `Attempted setting an argument twice.`
          }
          fcall.setArgValues[argIndex] = value;
          fcall.setArgsByName = true;
        }
        
        this.Object = class PlainObject {
          constructor(obj) {
            this.__values = obj || {}
          }
          get(key) {
            if (typeof key !== "string" && typeof key !== "symbol") {
              throw "Attempted to index <Object> with a non-string and non-symbol key. "
            }
            let exists = Object.hasOwn(this.__values, key);
            if (!exists) return this.Nothing;
            let value = this.__values[key];
            if (this.typeof(value) === "unknown") {
              return this.Nothing
            }
            if (value === undefined) {
              return this.Nothing
            }
            return value;
          }
          set(key, value) {
            if (typeof key !== "string" && typeof key !== "Symbol") {
              throw "Attempted to set property of <Object> with a non-string and non-symbol key. "
            }
            if (this.typeof(value) === "unknown") {
              throw `Attempted to set property of <Object> with unknown value: ${value}`
            }
            return this.__values[(this.typeof(key) === "Symbol") ? key.symbol : key] = value
          }
          delete(key) {
            return (delete this.__values[key])
          }
          get toString() {
            return () => "<Object>"
          }
          set toString(e) {
            throw "Cannot overwrite the toString method of an object."
          }
          get size() {
            return Object.values(this.__values).length;
          }
          has(key) {
            return this.get(key) !== this.Nothing
          }
          toJSON() {
            return "Objects do not save."
          }
        }
        this.Object.prototype.type = "PlainObject";
        this.Array = class Array{
          constructor(arr) {
            this.__values = arr || [];
          }
          get(num) {
            let key = Math.abs(Math.floor(Number(num))) - 1;
            if (num === "length") {
              return this.__values.length
            }
            if (typeof num !== "number" && typeof num !== "boolean" && (typeof num !== "string" || Number.isNaN(key))) {
              throw "Attempted to index <Array> with a key that cannot be parsed as a number and is not length."
            }
            let value = this.__values[key];
            if (value === undefined) {
              return this.Nothing;
            }
            return value;
          }
          set(num, value) {
            let key = Math.abs(Math.floor(Number(num)));
            if (num === "length") {
              return this.setLength(Number(value) || this.__values.length)
            }
            if (typeof num !== "number" && typeof num !== "boolean" && (typeof num !== "string" || Number.isNaN(key))) {
              throw "Attempted to set property of <Array> with a key that cannot be parsed as a number and is not length."
            }
            if (key > 12e6) {
              throw "The maximum index for an array is 12 million. "
            }
            if (this.typeof(value) === "unknown") {
              throw `Attempted to set property of <Array> with unknown value: ${value}`
            }
            return this.__values[key] = value;
          }
          delete(num) {
            return (delete this.__values[num])
          }
          add(value) {
            return this.__values.push(value);
          }
          has(num) {
            return this.get(num) !== this.Nothing
          }
          setLength(num) {
            let len = this.__values.length
            if (num === len) return num;
            if (num < len) return this.__values.length = num;
            // It must be larger
            for (let i = len; i < num; i++) {
              this.__values.push(this.Nothing);
            }
            return num;
          }
          get size() {
            return this.__values.length;
          }
          get toString() {
            return () => "<Array>"
          }
          set toString(e) {
            throw "Cannot overwrite the toString method of an object."
          }
          toJSON() {
            return "Arrays do not save."
          }
        };
        this.Array.prototype.type = "Array";
        this.Set = class Set {
          constructor(obj) {
            this.__values = obj || new (globalThis.Set)()
          }
          add(value) {
            return this.__values.add(value);
          }
          has(value) {
            return this.__values.has(value);
          }
          clear() {
            return this.__values.clear();
          }
          delete(value) {
            return this.__values.delete(value);
          }
          forEach(func) {
            return this.__values.forEach(func, this.__values);
          }
          toArray() {
            return Array.from(this.__values);
          }
          get size() {
            return this.__values.size;
          }
          get toString() {
            return () => "<Set>"
          }
          set toString(e) {
            throw "Cannot overwrite the toString method of an object."
          }
          toJSON() {
            return "Sets do not save."
          }
        }
        this.Set.prototype.type = "Set";
        this.Map = class Map {
          constructor(obj) {
            this.__values = obj || new (globalThis.Map)()
          }
          set(key, value) {
            return this.__values.set(key, value);
          }
          get(key) {
            return this.__values.get(key);
          }
          has(key) {
            return this.__values.has(key);
          }
          toArray() {
            return Array.from(this.__values);
          }
          delete(key) {
            return this.__values.delete(key)
          }
          get size() {
            return this.__values.size;
          }
          get toString() {
            return () => "<Map>"
          }
          set toString(e) {
            throw "Cannot overwrite the toString method of an object."
          }
          toJSON() {
            return "Maps do not save."
          }
        }
        this.Map.prototype.type = "Map";	    
        
        this.Symbol = class SymbolContainer {
          constructor() {
            this.symbol = Symbol();
          }
          toString() {
            return `<Symbol>`;
          }
          toJSON() {
            return "Symbols do not save."
          }
        }
        this.Symbol.prototype.type = "symbol";

        this.Function = class Function {
          constructor(func, fdef) {
            this.func     = func;
            this.fdef     = fdef;
            console.log("init", this);
          }
          toString() {
            return `<Function fdef=${JSON.stringify(this.fdef)}>`;
          }
          call() {
            return this.func();
          }
          callWithArgs(args) {
            console.log("called with args", this, args);
            return this.func.apply(null, args);
          }
          callWithThis(thisVal) {
            return this.func.call(thisVal)
          }
        }
        /*this.RegExp = class RegularExpression {
          constructor(obj) {
            this.__values = obj || new RegExp();
          }
          get toString() {
            return () => "<RegularExpression>"
          }
          set toString(e) {
            throw "Cannot overwrite the toString method of an object."
          }
          toJSON() {
            return "Regular Expbressions do not save. "
          }
        }
        this.RegExp.prototype.type = "RegularExpression";
        
        this.forEach = (value, func) => {
          if (this.typeof(value) === "Map") {
            return value.__values.forEach(func);
          } else if (this.typeof(value) === "Set") {
            return (new Map(Object.entries(Array.from(value.__values)))).forEach(func);
          } else if ((this.typeof(value) === "Object" || this.typeof(value) === "Array" || this.typeof(value) === "string")) {
            // String is a special case here, that we will allow
            return (new Map(Object.entries(value.__values || value))).forEach(func);
          } else {
            // Something is wrong
            throw "Attempted to iterate over something that is not iterable. "
          }
        }*/
        this.toIterable = (value) => {
          // since forEach does not allow continue, i have to use toIterable.
          if (this.typeof(value) === "Map" || this.typeof(value) === "Set" || this.typeof(value) === "Array") {
            return value.__values.entries(); // set.prototype.entries is a joke
          } else if (this.typeof(value) === "Object") {
            return Object.entries(value.__values);
          } else if (this.typeof(value) === "string") {
            return Array.from(value).entries()
          }
          throw "Attempted to create an iterable for something that is not iterable."
        }
        
        this.NothingClass = class Nothing extends Object.assign(function(){}, {prototype: null}) {
          get toString() {
            return () => "<Nothing>"
          }
          set toString(e) {
            throw "uhhhh how did you do this?."
          }
          toJSON() {
            return "Nothing does not save."
          }
        }
        this.NothingClass.prototype.type = "Nothing";
        this.Nothing = new (this.NothingClass);
        
        this.pcall = (func, target) => {
          try {
            return func(target)
          } catch(e) {
            if ((""+e.message).includes("Class constructor")) {
              throw ""
            }
            return e
          }
        }
        
        this.pconstruct = (constructor) => {
          try {
            return new constructor()
          } catch(e) {
            return e
          }
        }
        
        this.Class = class Class { // wrapper class for classes
          constructor(someClass) {
            this.class = someClass;
            this.class.WRAPPER = this;
          }
          toString() {
            return "<Class>"
          }
          toJSON() {
            return "Classes do not save"
          }
        }
        this.__methodsOfObjects = new WeakMap();
        this.appendMethod = (obj, name, method) => {
          if (typeof obj !== "object" || !obj) throw "Attempted to append method on invalid value " + obj; // im too lazy to check if its a this object
          if (!(this.__methodsOfObjects.has(obj))) {
            this.__methodsOfObjects.set(obj, Object.create(null))
          }
          if (this.typeof(method) !== "Function") throw "Attempted to append method, but the method is not a function."
          if (Object.hasOwn(this.__methodsOfObjects.get(obj), name)) {
            throw `Object ${obj} already has method ${name}, cannot append method.`
          }
          return this.__methodsOfObjects.get(obj)[name] = method;
        }
        this.executeMethod = (obj, name) => {
          if (!this.isObject(obj)) throw "Attempted to call method on invalid receiver " + obj;
          const methods = this.__methodsOfObjects.get(obj);
          
          if (!methods) {
            // Try to find this method on its class
            if (obj.constructor?.WRAPPER) {
              const wrapper = obj.constructor.WRAPPER;
              if (this.__methodsOfObjects.get(wrapper)?.[name]) {
                return this.__methodsOfObjects.get(wrapper)[name].callWithThis(obj);
              }
              let success = false;
              let oldWrapper = wrapper;
              while (true) {
                // Keep looking
                const newWrapper = Object.getPrototypeOf(oldWrapper.class).WRAPPER;
                let method = null;
                if (!newWrapper) break;
                if (method = this.__methodsOfObjects.get(newWrapper)?.[name]) {
                  method.callWithThis(obj)
                }
                oldWrapper = newWrapper; // go to next iteration
              }
            }
            throw `Attempted to call non-existent method ${name} on ${obj}`;
          }
          if (!methods[name]) {
            throw `Attempted to call non-existent method ${name} on ${obj}`;
          }
          return methods[name].callWithThis(obj)
        }
        // OOP Helper functions
        this.canConstruct = (value) => {
          return this.typeof(value) === "Class" && (typeof value.class.prototype.init) === "function"
        }
        this.inheritsFrom = (value, otherClass) => {
          return value.class.prototype instanceof (this.typeof(value) === "Class" ? value.class : value)
        }
        this.constructFrom = function* (value) { // do (yield* runtime.ext_moreTypesPlus.constructFrom(someClass));
          if (this.canConstruct(value)) {
            const instance = new (value.class)();
            return (yield* instance.init());
          } else {
            throw "Attempted to construct from non-class."
          }
        }
        this.getClassToExtend = (strOrClass, isForInstanceof) => {
          if (this.typeof(strOrClass) === "Class") return strOrClass.class;
          switch (strOrClass) {
            case ("Object"):
              return this.Object;
            case ("Array"):
              return this.Array;
            case ("Set"):
              return this.Set;
            case ("Map"):
              return this.Map;
            default:
              if (!isForInstanceof) {
            throw "Tried to extend invalid value"
          } else {
            throw "Invalid class for instanceof"
          }
          }
        }
        this.isObject = (value) => {
          return (this.typeof(value) === "Object" || this.typeof(value) === "Array" || this.typeof(value) === "Set" || this.typeof(value) === "Map")
        }
        this.trySuper = function* (thisVal) {
          const constructor = thisVal.constructor;
          const superClasses = [];
          if (constructor) {
            // Use a loop to find all superClasses
            let oldClass = constructor;
            while (true) {
              const superClass = Object.getPrototypeOf(oldClass);
              if (!(superClass === Function || superClass === this.Object || superClass === this.Array || superClass === this.Set || superClass === this.Map) && !(superClass == null)) {
                superClasses.unshift(superClass); // Use unshift to mimic the behavior of super in javascript.
                //(yield* (superClass.prototype.init.call(thisVal, true)))
              } else {
                break;
              }
              oldClass = superClass
            }
            for (const superClass of superClasses) {
              (yield* (superClass.prototype.init.call(thisVal, true)));
            }
          }
          // If the function gets here and superClass.init hasn't been called, act as if nothing had happened.
        }
        Scratch.vm.runtime.registerCompiledExtensionBlocks("moreTypesPlus", this.getCompileInfo());
      }
      getInfo() {
        return {
          id: 'moreTypesPlus',
          name: 'More Types Plus',
          color1: "#8084ff",
          blocks: [
            this.makeLabel("If you hover over blocks,"),
            this.makeLabel("there will be a tooltip."),
            "---",
            this.makeLabel("Variable Access"),
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
            {
              opcode: "varExists",
              blockType: Scratch.BlockType.BOOLEAN,
              text: "variable [VARIABLE] exists?",
              arguments: {
                VARIABLE: {
                  type: Scratch.ArgumentType.STRING,
                },
              },
            },
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
              opcode: "createGlobalVar",
              blockType: Scratch.BlockType.COMMAND,
              text: "create global variable [VARIABLE]",
              arguments: {
                VARIABLE: {
                  type: Scratch.ArgumentType.STRING,
                },
              },
            },
            {
              opcode: "createSpriteVar",
              func: "noComp",
              blockType: Scratch.BlockType.COMMAND,
              text: "create sprite variable [VARIABLE]",
              arguments: {
                VARIABLE: {
                  type: Scratch.ArgumentType.STRING,
                },
              },
            },
            {
              opcode: "deleteVar",
              blockType: Scratch.BlockType.COMMAND,
              text: "delete variable [VARIABLE]",
              arguments: {
                VARIABLE: {
                  type: Scratch.ArgumentType.STRING,
                },
              },
            },
            "---",
            this.makeLabel("Core"),
            {
              opcode: 'log',
              func: "noComp",
              blockType: Scratch.BlockType.COMMAND,
              text: 'print [TXT] to console',
              tooltip: "Allows you to use the \"say block\" but say an object into the console. Use Ctrl + Shift + I to open the console.",
              arguments: {
                TXT: {
                  type: Scratch.ArgumentType.STRING,
                  defaultValue: "Hello, World!"
                }
              }
            },
            {
              opcode: "throw",
              blockType: Scratch.BlockType.COMMAND,
              text: "throw an error.",
              hideFromPalette: true // yeah this isnt supposed to be used.
            },
            {
              opcode: "outputCode",
              func: "noComp",
              blockType: Scratch.BlockType.COMMAND,
              text: "outputs compiled code into the console. ",
              hideFromPalette: true // this one too
            },
            {
              opcode: "newObject",
              func: "noComp",
              output: ["Object", "Array", "Map", "Set"],
              blockShape: Scratch.BlockShape.SQUARE,
              blockType: Scratch.BlockType.REPORTER,
              text: "new [CLASS]",
              tooltip: "Creates a JavaScript object with type Object, Array, Map, or Set",
              arguments: {
                CLASS: {
                  type: Scratch.ArgumentType.STRING,
                  tooltip: "The type of the JavaScript object to create. ",
                  menu: "objectClasses"
                }
              }
            },
            {
              opcode: "typeof",
              func: "noComp",
              blockType: Scratch.BlockType.REPORTER,
              text: "typeof [OBJECT]",
              tooltip: "Gets the type of an object.",
              arguments: {
                OBJECT: {
                  type: Scratch.ArgumentType.STRING,
                  defaultValue: "Insert Anything Here"
                }
              }
            },
            "---",
            this.makeLabel("Objects, Arrays, Sets, and Maps"),
            {
              opcode: "getIndex",
              func: "noComp",
              blockShape: Scratch.BlockShape.SQUARE,
              blockType: Scratch.BlockType.REPORTER,
              text: "get key [KEY] of [OBJECT]",
              tooltip: "For objects, key has to be a string or symbol\nFor arrays, key has to be a number\nFor maps, key can be anything",
              arguments: {
                KEY: {
                  type: Scratch.ArgumentType.STRING,
                  defaultValue: "foo"
                },
                OBJECT: {
                  type: Scratch.ArgumentType.STRING,
                  defaultValue: "Insert Object / Array / Map Here"
                }
              }
            },
            {
              opcode: "setIndex",
              func: "noComp",
              blockType: Scratch.BlockType.COMMAND,
              text: "set key [KEY] of [OBJECT] to [VALUE]",
              tooltip: "Read the tooltip of the above block first.\nThis block is like the above block, but sets a value into the key.",
              arguments: {
                KEY: {
                  type: Scratch.ArgumentType.STRING,
                  defaultValue: "foo"
                },
                OBJECT: {
                  type: Scratch.ArgumentType.STRING,
                  defaultValue: "Insert Object / Array / Map Here"
                },
                VALUE: {
                  type: Scratch.ArgumentType.STRING,
                  defaultValue: "bar",
                }
              }
            },
            {
              opcode: "deleteIndex",
              func: "noComp",
              blockType: Scratch.BlockType.COMMAND,
              text: "remove key [KEY] of [OBJECT]",
              tooltip: "Remove the key, so that key in object is false.",
              arguments: {
                KEY: {
                  type: Scratch.ArgumentType.STRING,
                  defaultValue: "foo"
                },
                OBJECT: {
                  type: Scratch.ArgumentType.STRING,
                  defaultValue: "Insert Object / Array / Set / Map Here"
                }
              }
            },
            // Add set stuff here
            {
              opcode: "addItem",
              func: "noComp",
              blockType: Scratch.BlockType.COMMAND,
              text: "add [VALUE] to the end of [OBJECT]",
              tooltip: "this-explanatory",
              arguments: {
                VALUE: {
                  type: Scratch.ArgumentType.STRING,
                  defaultValue: "foo"
                },
                OBJECT: {
                  type: Scratch.ArgumentType.STRING,
                  defaultValue: "Insert  Array / Set Here"
                }
              }
            },
            "---",
            {
              opcode: "isSame",
              func: "noComp",
              blockType: Scratch.BlockType.BOOLEAN,
              text: "is [X] and [Y] EXACTLY the same?",
              tooltip: "Accepts all values, unlike the regular scratch =, and can also find the difference between 0 and -0.",
              arguments: {
                X: {
                  type: Scratch.ArgumentType.STRING,
                  defaultValue: "0"
                },
                Y: {
                  type: Scratch.ArgumentType.STRING,
                  defaultValue: "-0"
                }
              }
            },
            {
              opcode: "keyExists",
              func: "noComp",
              blockType: Scratch.BlockType.BOOLEAN,
              text: "[KEY] in [OBJECT]?",
              tooltip: "Checks if the key exists in the object / array / map\nFor sets, it checks if the value is in the set.",
              arguments: {
                KEY: {
                  type: Scratch.ArgumentType.STRING,
                  defaultValue: "foo"
                },
                OBJECT: {
                  type: Scratch.ArgumentType.STRING,
                  defaultValue: "Insert Object / Array / Set / Map Here"
                }
              }
            },
            {
              opcode: "sizeof",
              func: "noComp",
              blockType: Scratch.BlockType.REPORTER,
              text: "sizeof [OBJECT]",
              tooltip: "Gets the number of values in an object.",
              arguments: {
                OBJECT: {
                  type: Scratch.ArgumentType.STRING,
                  defaultValue: "Insert Object / Array / Set / Map Here"
                }
              }
            },
            "---",
            {
              opcode: "iterateObject",
              func: "noComp",
              blockType: Scratch.BlockType.LOOP,
              text: ["for key [KEY] value [VALUE] in [OBJECT]"],
              tooltip: "Allows you to iterate through all of the keys and values of an object",
              branchCount: 1,
              arguments: {
                KEY: {
                  type: Scratch.ArgumentType.VARIABLE
                },
                VALUE: {
                  type: Scratch.ArgumentType.VARIABLE
                },
                OBJECT: {
                  type: Scratch.ArgumentType.STRING,
                  defaultValue: "Insert Object / Array/ Set / Map Here" // you can use string too
                }
              }
            },
            "---",
            this.makeLabel("More Values"),
            {
              opcode: "createSymbol",
              func: "noComp",
              blockType: Scratch.BlockType.REPORTER,
              blockShape: Scratch.BlockShape.SQUARE,
              tooltip: "Creates a symbol, which is a globally unique value. This means that every new symbol, is different from every other symbol.",
              text: "create a symbol",
            },
            {
              opcode: "nothingValue",
              func: "noComp",
              blockType: Scratch.BlockType.REPORTER,
              blockShape: Scratch.BlockShape.SQUARE,
              tooltip: "The \"Nothing\" value",
              text: "nothing"
            },
            // Planning on adding ==, === and ==== (basically just Object.is) for objects
            // I FOUND A WAY TO MAKE FUNCTIONS
            // https://github.com/PenguinMod/PenguinMod-Vm/blob/develop/src/compiler/jsgen.js#L556
            this.makeLabel("Anonymous Function Definitions"),
            {
              opcode: "anonymousFunction",
              func: "noComp",
              output: ["Function"],
              blockShape: Scratch.BlockShape.SQUARE,
              blockType: Scratch.BlockType.OUTPUT, // basically just undefined
              disableMonitor: true,
              branchCount: 1,
              text: "Anonymous Function"
            },
            {
              opcode: "beforeCreationAnonymousFunction",
              func: "noComp",
              output: ["Function"],
              blockShape: Scratch.BlockShape.SQUARE,
              blockType: Scratch.BlockType.OUTPUT, // basically just undefined
              disableMonitor: true,
              branchCount: 2,
              text: ["before creation", "Anonymous Function"],
              tooltip: "Executes code during the creation of a Function. WARNING: Many blocks will not work within \"during creation\".",
            },
            {
              opcode: "addArgument",
              func: "noComp",
              blockShape: Scratch.BlockShape.COMMAND,
              text: "add argument [NAME]",
              arguments: {
                NAME: {
                  type: Scratch.ArgumentType.STRING,
                  defaultValue: "Argument Name",
                },
              },
            },
            {
              opcode: "addOptionalArgument",
              func: "noComp",
              blockShape: Scratch.BlockShape.COMMAND,
              text: "add optional argument [NAME] with default [DEFAULT]",
              arguments: {
                NAME: {
                  type: Scratch.ArgumentType.STRING,
                  defaultValue: "Argument Name",
                },
                DEFAULT: {
                  type: Scratch.ArgumentType.STRING,
                  defaultValue: "Argument Default",
                },
              },
            },
            {
              opcode: "returnFromFunction",
              func: "noComp",
              blockType: Scratch.BlockType.COMMAND,
              text: "return [VALUE]",
              tooltip: "Returns a value from a function, immediately stopping its execution. ",
              arguments: {
                VALUE: {
                  type: Scratch.ArgumentType.STRING,
                }
              },
              isTerminal: true,
            },
            this.makeLabel("Anonymous Function Calls"),
            {
              opcode: "callFunction",
              func: "noComp",
              blockType: Scratch.BlockType.COMMAND,
              text: "call function [FUNCTION]",
              tooltip: "Executes a function, and discards its return value. ",
              arguments: {
               FUNCTION: {
                 type: Scratch.ArgumentType.STRING,
                 defaultValue: "Insert Function Here",
               }
              }
            },
            {
              opcode: "callFunctionOutput",
              func: "noComp",
              blockType: Scratch.BlockType.REPORTER,
              blockShape: Scratch.BlockShape.SQUARE,
              text: "call function [FUNCTION] and get return value",
              tooltip: "Executes a function. ",
              arguments: {
               FUNCTION: {
                 type: Scratch.ArgumentType.STRING,
                 defaultValue: "Insert Function Here",
               }
              }
            },
            {
              opcode: "prepareAndCallFunction",
              func: "noComp",
              blockType: Scratch.BlockType.COMMAND,
              disableMonitor: true,
              branchCount: 1,
              text: ["prepare", "and call function [FUNCTION]"],
              tooltip: "Executes a function, and discards its return value. WARNING: Many blocks will not work within \"prepare\".",
              arguments: {
               FUNCTION: {
                 type: Scratch.ArgumentType.STRING,
                 defaultValue: "Insert Function Here",
               }
              }
            },
            this.makeLabel("OOP"),
            {
              opcode: "anonymousClass",
              func: "noComp",
              blockType: Scratch.BlockType.REPORTER,
              blockShape: Scratch.BlockShape.SQUARE,
              branchCount: 1,
              disableMonitor: true,
              text: "anonymous class" // extends object
            }, // done!
            {
              opcode: "anonymousClassExtends",
              func: "noComp",
              blockType: Scratch.BlockType.REPORTER,
              blockShape: Scratch.BlockShape.SQUARE,
              branchCount: 1,
              disableMonitor: true,
              text: "anonymous class extends [CLASS]",
              arguments: {
                CLASS: {
                  type: Scratch.ArgumentType.STRING,
                  menu: "defaultClasses",
                  defaultValue: "Put in a class, or use the menu"
                }
              }
            },
            {
              opcode: "this",
              func: "noComp",
              blockType: Scratch.BlockType.REPORTER,
              blockShape: Scratch.BlockShape.SQUARE,
              text: "this",
              disableMonitor: true,
            },
            {
              opcode: "appendMethod",
              func: "noComp",
              blockType: Scratch.BlockType.COMMAND,
              text: "append method [METHOD] with name [NAME] to class or object [VALUE]",
              arguments: {
                METHOD: {
                  type: Scratch.ArgumentType.STRING,
                  defaultValue: "Insert Function Here"
                },
                NAME: {
                  type: Scratch.ArgumentType.STRING,
                  defaultValue: "foo"
                },
                VALUE: {
                  type: Scratch.ArgumentType.STRING,
                  defaultValue: "Insert Object / Array / Set / Map / Class Here"
                }
              }
            },
            {
              opcode: "callMethod",
              func: "noComp",
              blockType: Scratch.BlockType.COMMAND,
              tooltip: "Calls a method with a \"this\" value",
              text: "call method with name [NAME] on [VALUE]",
              arguments: {
                NAME: {
                  type: Scratch.ArgumentType.STRING,
                  defaultValue: "foo"
                },
                VALUE: {
                  type: Scratch.ArgumentType.STRING,
                  defaultValue: "Insert Object / Array / Set / Map Here"
                }
              }
            },
            {
              opcode: "callMethodOutput",
              func: "noComp",
              blockType: Scratch.BlockType.REPORTER,
              blockShape: Scratch.BlockShape.SQUARE,
              tooltip: "Calls a method with a \"this\" value",
              text: "call method with name [NAME] on [VALUE] and get return value",
              arguments: {
                NAME: {
                  type: Scratch.ArgumentType.STRING,
                  defaultValue: "foo"
                },
                VALUE: {
                  type: Scratch.ArgumentType.STRING,
                  defaultValue: "Insert Object / Array / Set / Map Here"
                }
              }
            },
            {
              opcode: "construct",
              func: "noComp",
              blockType: Scratch.BlockType.REPORTER,
              blockShape: Scratch.BlockShape.SQUARE,
              text: "Construct an instance of [CLASS]",
              arguments: {
                CLASS: {
                  type: Scratch.ArgumentType.STRING,
                  defaultValue: "Insert Class Here"
                }
              }
            },
            {
              opcode: "instanceof",
              func: "noComp",
              blockType: Scratch.BlockType.BOOLEAN,
              text: "is [OBJECT] an instance of [CLASS]",
              arguments: {
                OBJECT: {
                  type: Scratch.ArgumentType.STRING,
                  defaultValue: "Insert Anything Here"
                },
                CLASS: {
                  type: Scratch.ArgumentType.STRING,
                  menu: "defaultClasses",
                  defaultValue: "Put in a class, or use the menu."
                }
              }
            },
            this.makeLabel("Temporary Variables Support"),
            {
              opcode: "iterateObjectTempVars",
              func: "noComp",
              blockType: Scratch.BlockType.LOOP,
              text: ["for key [KEY] value [VALUE] in [OBJECT]"],
              tooltip: "Allows you to iterate through all of the keys and values of an object",
              branchCount: 1,
              arguments: {
                KEY: {
                  type: Scratch.ArgumentType.STRING,
                  defaultValue: "k"
                },
                VALUE: {
                  type: Scratch.ArgumentType.STRING,
                  defaultValue: "v"
                },
                OBJECT: {
                  type: Scratch.ArgumentType.STRING,
                  defaultValue: "Insert Object / Array/ Set / Map Here" // you can use string too
                }
              }
            },
          ],
          menus: {
            objectClasses: {
              allowReporters: false,
              items: ["Object", "Array", "Set", "Map"]
            },
            defaultClasses: {
              allowReporters: true,
              isTypeable: true,
              items: ["Object", "Array", "Set", "Map"]
            }
          }
        };
      }
      noComp(args, util) {
        // Check if monitor
        //console.log(util, util.thread.peekStack());
        switch (util.thread.peekStack()) {
          case ("moreTypesPlus_newObject_Object"):
            return "<Object>"
          case ("moreTypesPlus_newObject_Array"):
            return "<Array>"
          case ("moreTypesPlus_newObject_Set"):
            return "<Set>"
          case ("moreTypesPlus_newObject_Map"):
            return "<Map>"
          case ("moreTypesPlus_createSymbol"):
            return "Symbol()"
          case ("moreTypesPlus_nothingValue"):
            return "<Nothing>"
        }
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
            createSpriteVar: (generator, block) => ({
              kind: "stack",
              variable: generator.descendInputOfBlock(block, "VARIABLE"),
            }),
            log: (generator, block) => ({
              kind: "stack",
              contents: generator.descendInputOfBlock(block, "TXT")
            }),
            newObject: (generator, block) => ({
              kind: "input",
              type: block.fields.CLASS.value,
            }),
            anonymousFunction: (generator, block) => ({
              kind: "input",
              stack: generator.descendSubstack(block, "SUBSTACK")
            }),
            beforeCreationAnonymousFunction: (generator, block) => ({
              kind: "input",
              duringCreation: generator.descendSubstack(block, "SUBSTACK" ),
              funcCode      : generator.descendSubstack(block, "SUBSTACK2"),
            }),
            addArgument: (generator, block) => ({
              kind: "stack",
              name   : generator.descendInputOfBlock(block, "NAME"),
            }),
            addOptionalArgument: (generator, block) => ({
              kind: "stack",
              name      : generator.descendInputOfBlock(block, "NAME"   ),
              defaultVal: generator.descendInputOfBlock(block, "DEFAULT"),
            }),
            returnFromFunction: (generator, block) => ({
              kind: "stack",
              value: generator.descendInputOfBlock(block, "VALUE")
            }),
            callFunction: (generator, block) => (generator.script.yields = true, { // Tell the compiler that the script needs to yield cuz it does
              kind: "stack",
              func: generator.descendInputOfBlock(block, "FUNCTION")
            }),
            callFunctionOutput: (generator, block) => (generator.script.yields = true, {
              kind: "input",
              func: generator.descendInputOfBlock(block, "FUNCTION")
            }),
            prepareAndCallFunction: (generator, block) => (generator.script.yields = true, { // Tell the compiler that the script needs to yield cuz it does
              kind: "stack",
              func: generator.descendInputOfBlock(block, "FUNCTION"),
              duringPreperation: generator.descendSubstack(block, "SUBSTACK" ),
            }),
            getIndex: (generator, block) => ({
              kind: "input", /// gotta finish later.
              key: generator.descendInputOfBlock(block, "KEY"),
              object: generator.descendInputOfBlock(block, "OBJECT")
            }),
            setIndex: (generator, block) => ({
              kind: "stack", /// gotta finish later.
              key: generator.descendInputOfBlock(block, "KEY"),
              value: generator.descendInputOfBlock(block, "VALUE"),
              object: generator.descendInputOfBlock(block, "OBJECT")
            }),
            iterateObject: (generator, block) => ({
              kind: "stack",
              stack: generator.descendSubstack(block, "SUBSTACK"),
              key: generator.descendVariable(block, "KEY"),
              value: generator.descendVariable(block, "VALUE"),
              object: generator.descendInputOfBlock(block, "OBJECT")
            }),
            iterateObjectTempVars: (generator, block) => ({
              kind: "stack",
              stack: generator.descendSubstack(block, "SUBSTACK"),
              key: generator.descendInputOfBlock(block, "KEY"),
              value: generator.descendInputOfBlock(block, "VALUE"),
              object: generator.descendInputOfBlock(block, "OBJECT")
            }),
            isSame: (generator, block) => ({
              kind: "input",
              left: generator.descendInputOfBlock(block, "X"),
              right: generator.descendInputOfBlock(block, "Y")
            }),
            outputCode: (generator, block) => ({
              kind: "stack"
            }),
            deleteIndex: (generator, block) => ({
              kind: "stack",
              key: generator.descendInputOfBlock(block, "KEY"),
              object: generator.descendInputOfBlock(block, "OBJECT")
            }),
            addItem: (generator, block) => ({
              kind: "stack",
              value: generator.descendInputOfBlock(block, "VALUE"),
              object: generator.descendInputOfBlock(block, "OBJECT"),
            }),
            keyExists: (generator, block) => ({
              kind: "input",
              key: generator.descendInputOfBlock(block, "KEY"),
              object: generator.descendInputOfBlock(block, "OBJECT")
            }),
            sizeof: (generator, block) => ({
              kind: "input",
              object: generator.descendInputOfBlock(block, "OBJECT")
            }),
            typeof: (generator, block) => ({
              kind: "input",
              object: generator.descendInputOfBlock(block, "OBJECT")
            }),
            createSymbol: (generator, block) => ({
              kind: "input"
            }),
            nothingValue: (generator, block) => ({
              kind: "input"
            }),
            anonymousClass: (generator, block) => ({
              kind: "input",
              stack: generator.descendSubstack(block, "SUBSTACK")
            }),
            anonymousClassExtends: (generator, block) => ({
              kind: "input",
              stack: generator.descendSubstack(block, "SUBSTACK"),
              "extends": generator.descendInputOfBlock(block, "CLASS")
            }),
            this: (generator, block) => ({
              kind: "input"
            }),
            appendMethod: (generator, block) => ({
              kind: "stack",
              method: generator.descendInputOfBlock(block, "METHOD"),
              name: generator.descendInputOfBlock(block, "NAME"),
              obj: generator.descendInputOfBlock(block, "VALUE")
            }),
            callMethod: (generator, block) => (generator.script.yields = true, {
              kind: "stack",
              name: generator.descendInputOfBlock(block, "NAME"),
              obj: generator.descendInputOfBlock(block, "VALUE")
            }),
            callMethodOutput: (generator, block) => (generator.script.yields = true, {
              kind: "input",
              name: generator.descendInputOfBlock(block, "NAME"),
              obj: generator.descendInputOfBlock(block, "VALUE")
            }),
            construct: (generator, block) => (generator.script.yields = true, {
              kind: "input",
              "class": generator.descendInputOfBlock(block, "CLASS")
            }),
            instanceof: (generator, block) => ({
              kind: "input",
              "class": generator.descendInputOfBlock(block, "CLASS"),
              obj: generator.descendInputOfBlock(block, "OBJECT")
            })
          },
          js: {
            setVar: (node, compiler, imports) => {
              const variable = compiler.descendInput(node.variable);
              const value    = compiler.descendInput(node.value   );
              const generatedJS = `vm.runtime.ext_moreTypesPlus._SETVAR(${variable.asUnknown()}, ${value.asUnknown()});\n`;
              compiler.source += generatedJS;
            },
            createSpriteVar: (node, compiler, imports) => {
              const variable = compiler.descendInput(node.variable);
              const generatedJS = `vm.runtime.ext_moreTypesPlus._CREATEVAR(vm.runtime.targets.indexOf(target), ${variable.asUnknown()}.toString());\n`;
              compiler.source += generatedJS;
            },
            log: (node, compiler, imports) => {
              let x = compiler.descendInput(node.contents)
              compiler.source += `console.log("MORE TYPES LOG: " ,${x.asUnknown()});\n`
              //console.log(x)
              //console.log(compiler)
            },
            newObject: (node, compiler, imports) => {
              let object;
              switch (node.type) {
                case "Object":
                  object = `new ((runtime.ext_moreTypesPlus).Object)()`
                  break;
                case "Array":
                  object = `new ((runtime.ext_moreTypesPlus).Array)()`
                  break;
                case "Set":
                  object = `new ((runtime.ext_moreTypesPlus).Set)()`
                  break;
                case "Map":
                  object = `new ((runtime.ext_moreTypesPlus).Map)()`
                  break;
                default:
                  object = `new ((runtime.ext_moreTypesPlus).Object)()`
                  break;
              }
              return new (imports.TypedInput)(object, imports.TYPE_UNKNOWN)
            },
            anonymousFunction: (node, compiler, imports) => {
              // big hack ALSO STOLEN
              const oldSrc = compiler.source;
              compiler.descendStack(node.stack, new (imports.Frame)(false));
              const stackSrc = compiler.source.substring(oldSrc.length);
              compiler.source = oldSrc;
              return new (imports.TypedInput)(
                `new (runtime.ext_moreTypesPlus.Function)((function*(){${stackSrc};\nreturn runtime.ext_moreTypesPlus.Nothing;}), null)`,
              imports.TYPE_UNKNOWN)
            },
            beforeCreationAnonymousFunction: (node, compiler, imports) => {
              console.log("AnoFunc+", node);
              const oldSrc = compiler.source;
              
              compiler.descendStack(node.funcCode, new (imports.Frame)(false));
              const funcCodeSrc = compiler.source.substring(oldSrc.length);
              compiler.source = oldSrc;
              
              compiler.descendStack(node.duringCreation, new (imports.Frame)(false));
              const duringCreationSrc = compiler.source.substring(oldSrc.length);
              compiler.source = oldSrc;
              
              const local = compiler.localVariables.next();
              
              const generatedJS = `
              function () {
                runtime.ext_moreTypesPlus.enterFunctionDef();
                let ${local};
                try {
                  ${duringCreationSrc};
                }
                finally {
                  ${local} = runtime.ext_moreTypesPlus.exitFunctionDef();
                }
                return new (runtime.ext_moreTypesPlus.Function)
                (
                  (function*(){
                    ${funcCodeSrc};
                    return runtime.ext_moreTypesPlus.Nothing;
                  }), 
                  ${local}
                );
              }()
              `
              
              console.log("=>", generatedJS);
              return new (imports.TypedInput)(generatedJS, imports.TYPE_UNKNOWN);
            },
            addArgument: (node, compiler, imports) => {
              const name = compiler.descendInput(node.name);
              compiler.source += `runtime.ext_moreTypesPlus.addFunctionDefArg(${name.asUnknown()});\n`;
            },
            addOptionalArgument: (node, compiler, imports) => {
              const name       = compiler.descendInput(node.name);
              const defaultVal = compiler.descendInput(node.defaultVal);
              compiler.source += `runtime.ext_moreTypesPlus.addOptionalFunctionDefArg(${name.asUnknown()}, ${defaultVal.asUnknown()});\n`;
            },
            returnFromFunction: (node, compiler, imports) => {
              compiler.source += `return ${compiler.descendInput(node.value).asUnknown()};\n`;
            },
            callFunction: (node, compiler, imports) => {
              const local = compiler.localVariables.next();
              const func = compiler.descendInput(node.func);
              if (!compiler.script.yields === true) throw "Something happened in the More Types Plus extension";

              const generatedJS = `(yield* (
                ${local} = ${func.asUnknown()},
                (runtime.ext_moreTypesPlus.typeof(${local}) === "Function") ?
                  ${local}.call() :
                  runtime.ext_moreTypesPlus.throwErr("Attempted to call non-function.")
              ));`;
              compiler.source += generatedJS;
            },
            callFunctionOutput: (node, compiler, imports) => {
              const local = compiler.localVariables.next();
              const local2 = compiler.localVariables.next();
              const func = compiler.descendInput(node.func);
              const generatedJS = `(yield* (
                ${local} = ${func.asUnknown()},
                (
                  runtime.ext_moreTypesPlus.typeof(${local}) === "Function"
                    ? ${local}.call()
                    : runtime.ext_moreTypesPlus.throwErr("Attempted to call non-function.")
                )
              ));`
              if (!compiler.script.yields === true) throw "Something happened in the More Types Plus extension"
              return new (imports.TypedInput)(generatedJS, imports.TYPE_UNKNOWN)
            },
            prepareAndCallFunction: (node, compiler, imports) => {
              console.log("duringCall", node);
              const local1 = compiler.localVariables.next();
              const local2 = compiler.localVariables.next();
              const func = compiler.descendInput(node.func);            
              const oldSrc = compiler.source;
              compiler.descendStack(node.duringPreperation, new (imports.Frame)(false));
              const duringPreperationSrc = compiler.source.substring(oldSrc.length);
              compiler.source = oldSrc;
              
              if (!compiler.script.yields === true) throw "Something happened in the More Types Plus extension"
              console.log(compiler);
              const generatedJS = `(yield* (
                ${local1} = ${func.asUnknown()},
                (runtime.ext_moreTypesPlus.typeof(${local1}) === "Function") ?
                  (function* (){})() : // Do nothing wait for later
                  runtime.ext_moreTypesPlus.throwErr("Attempted to call non-function."),
                (function* (){
                  console.log("os2");
                  runtime.ext_moreTypesPlus.enterFunctionCall(${local1}.fdef);
                  try {  ${duringPreperationSrc}  }
                  finally {  ${local2} = runtime.ext_moreTypesPlus.exitFunctionCall();  }
                  ${local1}.callWithArgs(${local2}.convert());
                })()
              ));`;
              console.log("=>", generatedJS);
              compiler.source += generatedJS;
            },
            getIndex: (node, compiler, imports) => {
              const key = compiler.descendInput(node.key);
              const obj = compiler.descendInput(node.object);
              
              const local1 = compiler.localVariables.next();
              // i forgor that we cannot use const in an expression.
              // so i had to implement a store system.
              const getObj = `(runtime.ext_moreTypesPlus.getStore(globalState.thread, "${local1}")).obj`
              return new (imports.TypedInput)(`((${getObj} = ${obj.asUnknown()}),(typeof (${getObj} ? ${getObj} : \{\}).get === "function")\n    ? ${getObj}.get(${key.asUnknown()})\n    : runtime.ext_moreTypesPlus.throwErr(\`Cannot read properties of \${${getObj}}\`))`, imports.TYPE_UNKNOWN)
            },
            setIndex: (node, compiler, imports) => {
              const key = compiler.descendInput(node.key);
              const value = compiler.descendInput(node.value);
              const obj = compiler.descendInput(node.object);
              
              const local1 = compiler.localVariables.next();
              compiler.source += `const ${local1} = ${obj.asUnknown()}\n;((typeof (${local1} ? ${local1} : \{\}).set === "function")\n  ? ${local1}.set(${key.asUnknown()}, ${value.asUnknown()})\n  : runtime.ext_moreTypesPlus.throwErr(\`Cannot set properties of \${${local1}}\`));\n`
            },
            iterateObject: (node, compiler, imports) => {
              const keyVar = compiler.descendVariable(node.key);
              const valueVar = compiler.descendVariable(node.value);
              const obj = compiler.descendInput(node.object);
              // im stupid and dont know which variables are used so im just going to use a local variable
              const objVar = compiler.localVariables.next();
              const iterable = compiler.localVariables.next();
              const keyValue = compiler.localVariables.next();
              compiler.source += `const ${objVar} = ${obj.asUnknown()};\nconst ${iterable} = runtime.ext_moreTypesPlus.toIterable(${objVar});\nfor (const ${keyValue} of ${iterable}) {${keyVar.source}=${keyValue}[0];${valueVar.source}=${keyValue}[1];`
              // time to add the substack
              compiler.descendStack(node.stack, new (imports.Frame)(true, "moreTypesPlus.iterateObject"));
              compiler.yieldLoop();
              compiler.source += "};\n"
            },
            iterateObjectTempVars: (node, compiler, imports) => {
              const keyVar = compiler.descendInput(node.key);
              const valueVar = compiler.descendInput(node.value);
              const obj = compiler.descendInput(node.object);
              // im stupid and dont know which variables are used so im just going to use a local variable
              const objVar = compiler.localVariables.next();
              const iterable = compiler.localVariables.next();
              const keyValue = compiler.localVariables.next();
              compiler.source += `const ${objVar} = ${obj.asUnknown()};\nconst ${iterable} = runtime.ext_moreTypesPlus.toIterable(${objVar});\nfor (const ${keyValue} of ${iterable}) {tempVars[${keyVar.asString()}]=${keyValue}[0];tempVars[${valueVar.asString()}]=${keyValue}[1];`
              // time to add the substack
              compiler.descendStack(node.stack, new (imports.Frame)(true, "moreTypesPlus.iterateObject"));
              compiler.yieldLoop();
              compiler.source += "};\n"
            },
            isSame: (node, compiler, imports) => {
              return new (imports.TypedInput)(`Object.is(${compiler.descendInput(node.left).asUnknown()}, ${compiler.descendInput(node.right).asUnknown()})`, imports.TYPE_BOOLEAN)
            },
            outputCode: (node, compiler, imports) => {
              console.log(imports, compiler)
              compiler.source += `async return;\n`
            },
            deleteIndex: (node, compiler, imports) => {
              const key = compiler.descendInput(node.key);
              const obj = compiler.descendInput(node.object);
              
              const local1 = compiler.localVariables.next();
              
              compiler.source += `const ${local1} = ${obj.asUnknown()};\n(typeof (${local1} ? ${local1} : {}).delete === "function")\n  ? ${local1}.delete(${key.asUnknown()})\n  : runtime.ext_moreTypesPlus.throwErr(\`Cannot delete properties of \${${local1}}\`)\n`
            },
            addItem: (node, compiler, imports) => {
              const value = compiler.descendInput(node.value);
              const obj = compiler.descendInput(node.object);
              
              const local1 = compiler.localVariables.next();
              
              compiler.source += `const ${local1} = ${obj.asUnknown()};\n(typeof (${local1} ? ${local1} : {}).add === "function")\n  ? ${local1}.add(${value.asUnknown()})\n  : runtime.ext_moreTypesPlus.throwErr(\`Cannot add to the end of \${${local1}}\`)\n`
            },
            keyExists: (node, compiler, imports) => {
              const key = compiler.descendInput(node.key);
              const obj = compiler.descendInput(node.object);
              
              const local1 = compiler.localVariables.next();
              // i forgor that we cannot use const in an expression.
              // so i had to implement a store system.
              const getObj = `(runtime.ext_moreTypesPlus.getStore(globalState.thread, "${local1}")).obj`
              return new (imports.TypedInput)(`((${getObj} = ${obj.asUnknown()}),(typeof (${getObj} ? ${getObj} : \{\}).has === "function")\n  ? ${getObj}.has(${key.asUnknown()})\n  : runtime.ext_moreTypesPlus.throwErr(\`Cannot read properties of \${${getObj}}\`))`, imports.TYPE_BOOLEAN)
            },
            sizeof: (node, compiler, imports) => {
              const obj = compiler.descendInput(node.object);
              
              const local1 = compiler.localVariables.next();
              // i forgor that we cannot use const in an expression.
              // so i had to implement a store system.
              const getObj = `(runtime.ext_moreTypesPlus.getStore(globalState.thread, "${local1}")).obj`
              return new (imports.TypedInput)(`((${getObj} = ${obj.asUnknown()}),(typeof (${getObj} ? ${getObj} : \{\}).size === "number")\n  ? ${getObj}.size\n  : runtime.ext_moreTypesPlus.throwErr(\`Cannot read properties of \${${getObj}}\`))`, imports.TYPE_NUMBER)
            },
            typeof: (node, compiler, imports) => {
              const obj = compiler.descendInput(node.object);
              return new (imports.TypedInput)(`(runtime.ext_moreTypesPlus.typeof(${obj.asUnknown()}))`, imports.TYPE_NUMBER)
            },
            createSymbol: (node, compiler, imports) => {
              return new (imports.TypedInput)(`new (runtime.ext_moreTypesPlus).Symbol()`, imports.TYPE_UNKNOWN);
            },
            nothingValue: (node, compiler, imports) => {
              return new (imports.TypedInput)(`runtime.ext_moreTypesPlus.Nothing`, imports.TYPE_UNKNOWN);
            },
            anonymousClass: (node, compiler, imports) => {
              const oldSrc = compiler.source;
              compiler.descendStack(node.stack, new(imports.Frame)(false));
              const stackSrc = compiler.source.substring(oldSrc.length);
              compiler.source = oldSrc;
              return new (imports.TypedInput)(`new (runtime.ext_moreTypesPlus.Class)(class MORETYPESCLASS extends (runtime.ext_moreTypesPlus.getClassToExtend("Object")) {\n
                constructor() {super()}\n
                *init(isSuper) {\n
                  try {\n
                    ${stackSrc};\n
                  } finally {\n
                    return this; 
                  }
                }
              })`, imports.TYPE_UNKNOWN)
            },
            anonymousClassExtends: (node, compiler, imports) => {
              const oldSrc = compiler.source;
              compiler.descendStack(node.stack, new(imports.Frame)(false));
              const stackSrc = compiler.source.substring(oldSrc.length);
              compiler.source = oldSrc;
              const classToExtend = compiler.descendInput(node.extends).asUnknown();
              return new (imports.TypedInput)(`new (runtime.ext_moreTypesPlus.Class)(class MORETYPESCLASS extends (runtime.ext_moreTypesPlus.getClassToExtend(${classToExtend})) {\n
                constructor() {super()}\n
                *init(isSuper) {\n
                  if (!isSuper) (yield* runtime.ext_moreTypesPlus.trySuper(this));
                  try {\n
                    ${stackSrc};\n
                  } finally {\n
                    return this;
                  }
                }
              })`, imports.TYPE_UNKNOWN)
            },
            this: (node, compiler, imports) => {
              return new (imports.TypedInput)(`(runtime.ext_moreTypesPlus.isObject(this) ? this : runtime.ext_moreTypesPlus.throwErr("Cannot access this outside of class constructor and methods"))`, imports.TYPE_UNKNOWN)
            },
            appendMethod: (node, compiler, imports) => {
              const method = compiler.descendInput(node.method).asUnknown();
              const name = compiler.descendInput(node.name).asUnknown();
              const obj = compiler.descendInput(node.obj).asUnknown();
              // runtime.ext_moreTypesPlus.appendMethod(obj, name, method)
              compiler.source += `runtime.ext_moreTypesPlus.appendMethod(${obj}, ${name}, ${method});\n`;
            },
            callMethod: (node, compiler, imports) => {
              // executeMethod(obj, name)
              const obj = compiler.descendInput(node.obj).asUnknown();
              const name = compiler.descendInput(node.name).asUnknown();
              
              compiler.source += `(yield* (runtime.ext_moreTypesPlus.executeMethod(${obj}, ${name})));`
            },
            callMethodOutput: (node, compiler, imports) => {
              // executeMethod(obj, name)
              const obj = compiler.descendInput(node.obj).asUnknown();
              const name = compiler.descendInput(node.name).asUnknown();
              
              return new (imports.TypedInput)(`(yield* (runtime.ext_moreTypesPlus.executeMethod(${obj}, ${name})))`, imports.TYPE_UNKNOWN)
            },
            construct: (node, compiler, imports) => {
              const constructor = compiler.descendInput(node.class).asUnknown();
              return new (imports.TypedInput)(`(yield* (runtime.ext_moreTypesPlus.constructFrom(${constructor})))`, imports.TYPE_UNKNOWN)
            },
            instanceof: (node, compiler, imports) => {
              const constructor = compiler.descendInput(node.class).asUnknown();
              const obj = compiler.descendInput(node.obj).asUnknown();
              return new (imports.TypedInput)(`(${obj} instanceof runtime.ext_moreTypesPlus.getClassToExtend(${constructor}, true))`, imports.TYPE_BOOLEAN)
            }
          }
        }
      }
      makeLabel(text) {
        return {
          blockType: Scratch.BlockType.LABEL,
          text: text
        }
      }
      throw() {
        throw "User generated Error. "
      }
      hello() {
        return 'World!';
      }
      getVar (args) {
        return vm.runtime.ext_moreTypesPlus._GETVAR(args.VARIABLE.toString())[1];
      }
      varExists (args) {
        return vm.runtime.ext_moreTypesPlus._GETVAR(args.VARIABLE.toString())[0];
      }
      createGlobalVar (args) {
        vm.runtime.ext_moreTypesPlus._CREATEVAR(0, args.VARIABLE.toString()); // Stage has Index 0
      }
      createSpriteVar (args) {
        console.log(target, vm.runtime.targets.indexOf(target))
        vm.runtime.ext_moreTypesPlus._CREATEVAR(0, args.VARIABLE.toString());
      }
      deleteVar (args) {
        vm.runtime.ext_moreTypesPlus._DELETEVAR(args.VARIABLE.toString());
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
          // Add argument tooltips.
          /*const args0 = res.json.args0;
          //console.log(args0)
          
          for (const input in (args0 || {})) {
            for (const argument in (blockInfo.arguments || {})) {
              if (args0[input].name === argument) {
                 blockInfo.arguments[argument].tooltip ? args0[input].tooltip = blockInfo.arguments[argument].tooltip : 0;
              }
            }
          }
          //console.log(res.json)*/ // remove all this dev stuff, and argument tooltips prob not needed.
          return res;
      }
      
    Scratch.extensions.register(new MoreTypesPlus(Scratch.vm.runtime));
  })(Scratch);