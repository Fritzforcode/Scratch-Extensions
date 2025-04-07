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
        let jsValues = this
        jsValues.runtime = runtime;
        jsValues.throwErr = function* (msg) {
          throw msg;
        }
        jsValues._GETVAR = function (varName) {
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
        jsValues._SETVAR = function (varName, value) {
          const targets = runtime.targets;
          let varFound = false;
          for (const targetIdx in targets) {
            const target = targets[targetIdx];
            if (!target.isOriginal) continue;
            for (const varId in target.variables) {
              if (target.variables.hasOwnProperty(varId)) {
                const variable = target.variables[varId];
                if (variable.name === varName) {
                  variable.value = value;
                  varFound = true;
                }
              }
            }
          }
          if (!varFound) {
            throw "Variable \"" + varName + "\" not found"
          }
        }
        jsValues._GENERATEVARID = function () {
          const varIdCharset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ!#%()*+,-./:;=?@[]^_`{|}~";
          let token = '';
          for (let i = 0; i < 20; i++) {
              const randomIndex = Math.floor(Math.random() * varIdCharset.length);
              token += varIdCharset[randomIndex];
          }
          return token;
        }
          
        jsValues._CREATEVAR = function (targetIdx, varName) {
          if (jsValues._GETVAR(varName)[0]) {
            return; // if var alredy exists, do nothing
          }
          const targets = runtime.targets;
          const target = targets[targetIdx];
          const id = jsValues._GENERATEVARID();
          while (target.variables.hasOwnProperty(id)) {
            const id = jsValues._GENERATEVARID();
          }
          target.lookupOrCreateVariable(id, varName);
        }
        
        jsValues._DELETEVAR = function (varName) {
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

        jsValues.repr = obj => {
          return (typeof obj === "string") ? JSON.stringify(obj) : obj.toString();
        }

        jsValues.typeof = function (value) {
          let isPrimitive = Object(value) !== value;
          if (isPrimitive) {
            let type = Object.prototype.toString.call(value).slice(8, -1).toLowerCase()
            return type;
          }
          if (value === jsValues.Nothing) {
            return "nothing"; // its basically just undefined.
          }
          if (value instanceof jsValues.Object) {
            return "Object";
          }
          if (value instanceof jsValues.Array) {
            return "Array";
          }
          if (value instanceof jsValues.Set) {
            return "Set"
          }
          if (value instanceof jsValues.Map) {
            return "Map"
          }
          if (value instanceof jsValues.Symbol) {
            return "Symbol"
          }
          if (value instanceof jsValues.Function) {
            return "Function"
          }
          if (value instanceof jsValues.Method) {
            return "Method"
          }
          if (value instanceof jsValues.GeneratorFunction) {
            return "GeneratorFunction"
          }
          if (value instanceof jsValues.Generator) {
            return "Generator"
          }
          if (value instanceof jsValues.Class) {
            return "Class"
          }
          return "unknown"
        }
        jsValues.classNameOf = function (value) {
          if (value?.hasOwnProperty && value.hasOwnProperty("__className")) {
            return value.__className;
          }
          throw "Attempted to get class name of non-custom class instance.";
        }
        jsValues.clone = function CLONE(value) {
          if (jsValues.typeof(value) === "Object") {
            return new (jsValues.Object)(structuredClone(value.__values))
          } else if (jsValues.typeof(value) === "Array") {
            return new (jsValues.Array)(structuredClone(value.__values))
          } else if (jsValues.typeof(value) === "Set") {
            return new (jsValues.Set)(structuredClone(value.__values))
          } else if (jsValues.typeof(value) === "Map") {
            return new (jsValues.Map)(structuredClone(value.__values))
          } else if (jsValues.typeof(value) === "RegularExpression") {
            return new (jsValues.RegExp)(structuredClone(value.__values))
          } else if (jsValues.typeof(value) === "Function") {
            throw "Cannot clone a function."
          } else if (jsValues.typeof(value) === "GeneratorFunction") {
            throw "Cannot clone a generator function."
          } else if (jsValues.typeof(value) === "Generator") {
            throw "Cannot clone a generator."
          } 
          throw `Attempted to clone value of type ${jsValues.typeof(value)}`
        }

        jsValues.resetState = function () {
          jsValues.functionDefLayers = [];
          jsValues.functionCallLayers = [];
          jsValues.functionScopeLayers = [];
        }        
        jsValues.resetState();

        jsValues.TempFunctionDef = class TempFunctionDef {
          constructor() {
            this.args = [];
            this.argDefaults = {};
            this.hasOptionalArgs = false;
          }
          toString() {
            return `FunctionDef(args=${JSON.stringify(this.args)}, argDefaults=${JSON.stringify(this.argDefaults)})`;
          }
          hasArg(name) {
            return this.args.includes(name);
          }
          argIsOptional(name) {
            return this.argDefaults.hasOwnProperty(name);
          }
          getArgDefault(name) {
            return this.argDefaults[name];
          }
        }
        jsValues.enterFunctionDef = function () {
          jsValues.functionDefLayers.push(new jsValues.TempFunctionDef());
        }
        jsValues.exitFunctionDef = function () {
          if (jsValues.functionDefLayers.length === 0) {
            throw "Internal Error";
          }
          return jsValues.functionDefLayers.pop();
        }
        jsValues.defineFunctionDefArg = function (name) {
          if (jsValues.functionDefLayers.length === 0) {
            throw '"Define Argument" cannot be used outside a function definition block.';
          }
          const functionDef = jsValues.functionDefLayers[jsValues.functionDefLayers.length-1];
          if (functionDef.hasArg(name)) {
            throw `Argument ${name} alredy exists`;
          }
          if (functionDef.hasOptionalArgs) {
            throw "A positional argument cannot follow an optional argument.";
          }
          functionDef.args.push(name);
        }
        jsValues.addOptionalFunctionDefArg = function (name, defaultVal) {
          if (jsValues.functionDefLayers.length === 0) {
            throw '"Define Argument with Default" cannot be used outside a function definition block.';
          }
          const functionDef = jsValues.functionDefLayers[jsValues.functionDefLayers.length-1];
          if (functionDef.hasArg(name)) {
            throw `Argument ${name} alredy exists`;
          }
          functionDef.args.push(name);
          functionDef.argDefaults[name] = defaultVal;
          functionDef.hasOptionalArgs = true;
        }
        
        jsValues.TempFunctionCall = class TempFunctionCall {
          constructor(functionDef) {
            this.functionDef   = functionDef;
            this.setArgValues  = {};
            this.setArgsByName = false; 
          }
          convert() {
            let argValues = {};
            for (const name of this.functionDef.args) {
              if (this.setArgValues.hasOwnProperty(name)) {
                argValues[name] = this.setArgValues[name];
              } else if (this.functionDef.argIsOptional(name)) {
                argValues[name] = this.functionDef.getArgDefault(name);
              } else {
                throw "A non-optional argument was not set.";
              }
            }
            return argValues;
          }
        }
        jsValues.enterFunctionCall = function (functionDef) {
          if (functionDef === null) {
            functionDef = new jsValues.TempFunctionDef();
          }
          jsValues.functionCallLayers.push(new jsValues.TempFunctionCall(functionDef));
        }
        jsValues.exitFunctionCall = function () {
          if (jsValues.functionCallLayers.length === 0) {
            throw "Internal Error";
          }
          return jsValues.functionCallLayers.pop();
        }
        jsValues.setNextFunctionCallArg = function (value) {
          if (jsValues.functionCallLayers.length === 0) {
            throw '"set next call argument" cannot be used outside a function call block".';
          }
          const functionCall = jsValues.functionCallLayers[jsValues.functionCallLayers.length-1];
          const argIndex = Object.keys(functionCall.setArgValues).length;
          if (argIndex >= functionCall.functionDef.args.length) {
            throw "Attempted setting more arguments then were defined.";
          }
          if (functionCall.setArgsByName) {
            throw "Attempted setting an argument positionally after setting an argument by name.";
          }
          functionCall.setArgValues[functionCall.functionDef.args[argIndex]] = value;
        }
        jsValues.setFunctionCallArgByName = function (name, value) {
          if (jsValues.functionCallLayers.length === 0) {
            throw '"set call argument by name" cannot be used outside a function call block".';
          }
          const functionCall = jsValues.functionCallLayers[jsValues.functionCallLayers.length-1];
          if (!functionCall.functionDef.hasArg(name)) {
            throw "Attempted setting an argument, which was never defined.";
          }
          if (functionCall.setArgValues.hasOwnProperty(name)) {
            throw "Attempted setting an argument twice.";
          }
          functionCall.setArgValues[name] = value;
          functionCall.setArgsByName = true;
        }

        jsValues.TempScope = class TempScope {
          constructor(args) {
            this.args = args;
          }
        }
        jsValues.enterScope = function (args) {
          if (args === null) args = {};
          jsValues.functionScopeLayers.push(new jsValues.TempScope(args));
          console.log("after enter", jsValues.functionScopeLayers);
        }
        jsValues.exitScope = function () {
          console.log("before exit", jsValues.functionScopeLayers);
          return jsValues.functionScopeLayers.pop();
        }
        jsValues.getFunctionArgument = function (name) {
          if (jsValues.functionScopeLayers.length === 0) {
            throw '"get argument" cannot be used outside a function or class definition block, which has a "prepare" substack.';
          }
          const scope = jsValues.functionScopeLayers[jsValues.functionScopeLayers.length-1];
          if (!scope.args.hasOwnProperty(name)) {
            throw `Argument ${name} was never defined.`;
          }
          return scope.args[name];
        }
        

        jsValues.Object = class PlainObject {
          constructor(obj) {
            this.__values = obj || {};
          }
          get(key) {
            if (typeof key !== "string" && typeof key !== "symbol") {
              throw "Attempted to index <Object> with a non-string and non-symbol key. ";
            }
            let exists = Object.hasOwn(this.__values, key);
            if (!exists) return jsValues.Nothing;
            let value = this.__values[key];
            if (jsValues.typeof(value) === "unknown") {
              return jsValues.Nothing;
            }
            if (value === undefined) {
              return jsValues.Nothing;
            }
            return value;
          }
          set(key, value) {
            if (typeof key !== "string" && typeof key !== "Symbol") {
              throw "Attempted to set property of <Object> with a non-string and non-symbol key. ";
            }
            if (jsValues.typeof(value) === "unknown") {
              throw `Attempted to set property of <Object> with unknown value: ${value}`;
            }
            return this.__values[(jsValues.typeof(key) === "Symbol") ? key.symbol : key] = value;
          }
          delete(key) {
            return (delete this.__values[key]);
          }
          get toString() {
            return () => "<Object>";
          }
          set toString(e) {
            throw "Cannot overwrite the toString method of an object.";
          }
          get size() {
            return Object.values(this.__values).length;
          }
          has(key) {
            return this.get(key) !== jsValues.Nothing;
          }
          toJSON() {
            return "Objects do not save.";
          }
        }
        jsValues.Object.prototype.type = "PlainObject";
        /*jsValues.OldArray = class OldArray{
          constructor(arr) {
            this.__values = arr || [];
          }
          get(num) {
            let key = Number(num);
            if (key < 0) {
              key = this.__values.length + key;
            }
            if (num === "length") {
              return this.__values.length;
            }
            if (typeof num !== "number" && typeof num !== "boolean" && (typeof num !== "string" || Number.isNaN(key))) {
              throw "Attempted to index <Array> with a key that cannot be parsed as a number and is not length.";
            }
            let value = this.__values[key];
            if (value === undefined) {
              return jsValues.Nothing;
            }
            return value;
          }
          set(num, value) {
            let key = Number(num);
            if (key < 0) {
              key = this.__values.length + key;
            }
            if (num === "length") {
              return this.setLength(Number(value) || this.__values.length);
            }
            if (typeof num !== "number" && typeof num !== "boolean" && (typeof num !== "string" || Number.isNaN(key))) {
              throw "Attempted to set property of <Array> with a key that cannot be parsed as a number and is not length.";
            }
            if (key > 12e6) {
              throw "The maximum index for an array is 12 million. ";
            }
            if (jsValues.typeof(value) === "unknown") {
              throw `Attempted to set property of <Array> with unknown value: ${value}`;
            }
            if (key > this.__values.length) {
              throw "Attempted setting an item index bigger then length."
            }
            return this.__values[key] = value;
          }
          delete(num) {
            return (delete this.__values[num]);
          }
          add(value) {
            return this.__values.push(value);
          }
          has(num) {
            return this.get(num) !== jsValues.Nothing;
          }
          setLength(num) {
            let len = this.__values.length;
            if (num === len) return num;
            if (num < len) return this.__values.length = num;
            // It must be larger
            for (let i = len; i < num; i++) {
              this.__values.push(jsValues.Nothing);
            }
            return num;
          }
          get size() {
            return this.__values.length;
          }
          get toString() {
            return () => "<Array>";
          }
          set toString(e) {
            throw "Cannot overwrite the toString method of an object.";
          }
          toJSON() {
            return "Arrays do not save.";
          }
        };*/
        jsValues.Array = class Array {
          constructor(arr) {
            this.__values = arr || [];
          }
      
          /*pop(index = this.__values.length - 1) {
            if (index < 0) index = this.__values.length + index;
            if (index >= 0 && index < this.__values.length) {
              return this.__values.splice(index, 1)[0];
            }
            throw "Index out of range";
          }
          slice(start = 0, end = this.__values.length) {
            if (start < 0) start = this.__values.length + start;
            if (end < 0) end = this.__values.length + end;
            return new PyArray(...this.__values.slice(start, end));
          }*/
          get(index) {
            if (index === "length") return this.__values.length;
            index = Math.floor(Scratch.Cast.toNumber(index));
            if (index < 0) index = this.__values.length + index;
            if (index >= 0 && index < this.__values.length) {
              return this.__values[index];
            }
            throw "Index out of range.";
          }
          set(index, value) {
            if (index < 0) index = this.__values.length + index;
            index = Math.floor(Scratch.Cast.toNumber(index));
            if (index >= 0 && index < this.__values.length) {
              return this.__values[index] = value;
            } else {
              throw "Index out of range.";
            }
          }
          delete(num) {
            return (delete this.__values[num]);
          }
          add(value) {
            return this.__values.push(value);
          }
          has(num) {
            return this.get(num) !== jsValues.Nothing;
          }
          get size() {
            return this.__values.length;
          }
          get toString() {
            return () => {
              const items = this.__values.map(jsValues.repr);
              let inner = null;
              if (items.length <= 10) {
                  inner = items.join(", ");
              } else {
                  inner = items.slice(0, 10).join(", ") + "...";
              }
              return `<Array(${items.length})[${inner}]>`;
            };
          }
          set toString(e) {
            throw "Cannot overwrite the toString method of an object.";
          }
          toJSON() {
            return "Arrays do not save.";
          }
        }
        jsValues.Array.prototype.type = "Array";


        jsValues.Set = class Set {
          constructor(obj) {
            this.__values = obj || new (globalThis.Set)();
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
        jsValues.Set.prototype.type = "Set";
        jsValues.Map = class Map {
          constructor(obj) {
            this.__values = obj || new (globalThis.Map)();
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
            return this.__values.delete(key);
          }
          get size() {
            return this.__values.size;
          }
          get toString() {
            return () => "<Map>";
          }
          set toString(e) {
            throw "Cannot overwrite the toString method of an object.";
          }
          toJSON() {
            return "Maps do not save.";
          }
        }
        jsValues.Map.prototype.type = "Map";	    
        
        jsValues.Symbol = class SymbolContainer {
          constructor() {
            jsValues.symbol = Symbol();
          }
          toString() {
            return `<Symbol>`;
          }
          toJSON() {
            return "Symbols do not save.";
          }
        }
        jsValues.Symbol.prototype.type = "symbol";

        jsValues.BaseFunction = class BaseFunction {
          constructor(func, functionDef) {
            this.func         = func;
            this.functionDef  = functionDef;
            console.log("init", this);
          }
          getFunctionDef() {
            return this.functionDef;
          }
          generateOuterGen(thisVal, methodName) {
            const innerGen = this.func.call(thisVal);
            const outerGen = function* () {
              let result = { done: false };
              
              while (!result.done) {
                result = innerGen.next();
                
                if (result.done) {
                  if (methodName === "__init__") {
                    if (result.value !== jsValues.Nothing) {
                      throw "__init__ method must return Nothing.";
                    }
                    return thisVal;
                  } else {
                    return result.value;
                  }
                } else {
                  yield result.value;
                }
              }
            }
            return outerGen();
          }
        }
        jsValues.Function = class Function extends jsValues.BaseFunction {
          toString() {
            return `<Function functionDef=${JSON.stringify(this.functionDef)}>`;
          }
          call() {
            return this.func();
          }
          callWithThis(thisVal, methodName) {
            return super.generateOuterGen(thisVal, methodName);
          }
            
        }
        jsValues.GeneratorFunction = class GeneratorFunction extends jsValues.BaseFunction {
          toString() {
            return `<GeneratorFunction functionDef=${JSON.stringify(this.functionDef)}>`;
          }
          call() {
            const generatorFunction = this;
            return (function*() {return new jsValues.Generator(generatorFunction, null);})();
          }
          callWithThis(thisVal, methodName) {
            this.func = super.generateOuterGen(thisVal, methodName);
            const generatorFunction = this;
            return (function*() {return new jsValues.Generator(generatorFunction, null);})();
          }
        }
        jsValues.Generator = class Generator {
          constructor(generatorFunction, functionCall) {
            if (functionCall === null) {
              functionCall = new jsValues.TempFunctionCall(new jsValues.TempFunctionDef());
            }
            this.generator = generatorFunction.func(functionCall.convert());
            this.isDone = false;
          }
          getNext() {
            const thisVal = this;
            const outerGen = function* () {
              if (thisVal.isDone) return jsValues.Nothing;
              let result = { value: null };
              
              while (!(result.value instanceof jsValues.YieldValue)) {
                result = thisVal.generator.next();
                
                if (result.done) {
                  thisVal.isDone = true;
                  return result.value;
                } else {
                  yield result.value; // to ensure synced execution
                }
              }
              return result.value.getValue();
            }
            return outerGen();
          }
          toString() {
            return `<Generator generator=${this.generator} isDone=${this.isDone}>`;
          }
        }
        jsValues.Method = class Method {
          constructor(func, thisVal, methodName) {
            this.func       = func;
            this.thisVal    = thisVal;
            this.methodName = methodName;
          }
          toString() {
            return `<Method ${JSON.stringify(this.methodName)} of ${this.thisVal}>`
          }
          getFunctionDef() {
            return this.func.getFunctionDef();
          }
          call() {
            return this.func.callWithThis(this.thisVal, this.methodName);
          }
        }
        // Temporary class to tell apart values yielded by the yield block and other yielded values.
        jsValues.YieldValue = class YieldValue { 
          constructor(value) {
            this.value = value;
          }
          getValue() {  return this.value;  }
          toString() {
            console.warn("The user shouldn't interact with YieldValue instances.");
            return "[YieldValue(${this.value})]"
          }
        }
        
        /*jsValues.RegExp = class RegularExpression {
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
        jsValues.RegExp.prototype.type = "RegularExpression";
        
        jsValues.forEach = (value, func) => {
          if (jsValues.typeof(value) === "Map") {
            return value.__values.forEach(func);
          } else if (jsValues.typeof(value) === "Set") {
            return (new Map(Object.entries(Array.from(value.__values)))).forEach(func);
          } else if ((jsValues.typeof(value) === "Object" || jsValues.typeof(value) === "Array" || jsValues.typeof(value) === "string")) {
            // String is a special case here, that we will allow
            return (new Map(Object.entries(value.__values || value))).forEach(func);
          } else {
            // Something is wrong
            throw "Attempted to iterate over something that is not iterable. "
          }
        }*/
          jsValues.toIterable = (value) => {
          // since forEach does not allow continue, i have to use toIterable.
          if (jsValues.typeof(value) === "Map" || jsValues.typeof(value) === "Set" || jsValues.typeof(value) === "Array") {
            return value.__values.entries(); // set.prototype.entries is a joke
          } else if (jsValues.typeof(value) === "Object") {
            return Object.entries(value.__values);
          } else if (jsValues.typeof(value) === "string") {
            return Array.from(value).entries();
          }
          throw "Attempted to create an iterable for something that is not iterable.";
        }
        
        jsValues.NothingClass = class Nothing extends Object.assign(function(){}, {prototype: null}) {
          get toString() {
            return () => "<Nothing>";
          }
          set toString(e) {
            throw "uhhhh how did you do this?.";
          }
          toJSON() {
            return "Nothing does not save.";
          }
        }
        jsValues.NothingClass.prototype.type = "Nothing";
        jsValues.Nothing = new (jsValues.NothingClass);
        
        jsValues.enforceNothing = (value) => {
          if ((value === null) | (value === undefined)) return jsValues.Nothing;
          return value;
        }

        jsValues.pcall = (func, target) => {
          try {
            return func(target);
          } catch(e) {
            if ((""+e.message).includes("Class constructor")) {
              throw "";
            }
            return e;
          }
        }
        
        jsValues.pconstruct = (constructor) => {
          try {
            return new constructor();
          } catch(e) {
            return e;
          }
        }
        
        jsValues.Class = class Class { // wrapper class for classes
          constructor(someClass) {
            this.class = someClass;
            this.class.WRAPPER = this;
            console.log("init", this);
          }
          toString() {
            return `<Class>`;
          }
          toJSON() {
            return "Classes do not save";
          }
        }
        jsValues.__methodsOfObjects = new WeakMap();
        jsValues.appendMethod = (obj, name, method) => {
          if (typeof obj !== "object" || !obj) throw "Attempted to append method on invalid value " + obj; // im too lazy to check if its a jsValues object
          if (!(jsValues.__methodsOfObjects.has(obj))) {
            jsValues.__methodsOfObjects.set(obj, Object.create(null));
          }
          if (!jsValues.isFunctionOrMethod(method)) throw "Attempted to append method, but the method is not a function.";
          if (Object.hasOwn(jsValues.__methodsOfObjects.get(obj), name)) {
            throw `Object ${obj} already has method ${name}, cannot append method.`;
          }

          jsValues.__methodsOfObjects.get(obj)[name] = method
          return obj;
        }
        jsValues.getObjMethod = (obj, name) => {
          if (!jsValues.isObject(obj)) throw "Attempted to get method of non-object " + obj;
          const methods = jsValues.__methodsOfObjects.get(obj);
          
          if (!methods) {
            // Try to find this method on its class
            if (obj.constructor?.WRAPPER) {
              const wrapper = obj.constructor.WRAPPER;
              if (jsValues.__methodsOfObjects.get(wrapper)?.[name]) {
                return jsValues.__methodsOfObjects.get(wrapper)[name];
              }
              let oldWrapper = wrapper;
              while (true) {
                // Keep looking
                const newPrototype = Object.getPrototypeOf(oldWrapper.class)
                const newWrapper = newPrototype.WRAPPER;

                if (([jsValues.Object, jsValues.Array, jsValues.Set, jsValues.Map].includes(newPrototype)) && (name === "__init__")) {
                  return new jsValues.Function(function*() {return jsValues.Nothing}, null);
                }

                let method = null;
                if (!newWrapper) break;
                if (method = jsValues.__methodsOfObjects.get(newWrapper)?.[name]) {
                  return method;
                }
                oldWrapper = newWrapper; // go to next iteration
              }
            }
            throw `Attempted to get non-existent method ${name} of ${obj}`;
          }
          if (!methods[name]) {
            throw `Attempted to get non-existent method ${name} of ${obj}`;
          }
          return methods[name];
        }
        jsValues.getClassMethod = (cls, name) => {
          if (jsValues.typeof(cls) !== "Class") throw "Attempted to get method of non-class " + cls;
          return jsValues.getObjMethod((new (cls.class)()), name);
        }
        jsValues.getSuperMethod = (obj, name) => {
          if (!jsValues.isObject(obj)) {
            throw new Error(`Attempted to get method of invalid receiver ${obj}`);
          }
          let prototype = Object.getPrototypeOf(obj);
          while (prototype) {
            const methods = jsValues.__methodsOfObjects.get(prototype);
            if (methods && methods[name]) {
              return methods[name];
            }
            if (prototype.constructor?.WRAPPER) {
              let wrapper = prototype.constructor.WRAPPER;
              while (wrapper) {
                const wrapperMethods = jsValues.__methodsOfObjects.get(wrapper);
                if (wrapperMethods?.[name]) {
                  return wrapperMethods[name];
                }
                wrapper = Object.getPrototypeOf(wrapper.class)?.WRAPPER;
              }
            }
            prototype = Object.getPrototypeOf(prototype);
          }
          throw new Error(`Attempted to get non-existent method ${name} of ${obj}`);
        }
        // OOP Helper functions
        jsValues.canConstruct = (value) => {
          return (jsValues.typeof(value) === "Class") && (!!jsValues.getClassMethod(value, "__init__"));
        }
        jsValues.inheritsFrom = (value, otherClass) => {
          return value.class.prototype instanceof (jsValues.typeof(value) === "Class" ? value.class : value);
        }
        jsValues.constructFrom = function* (value) { // do (yield* runtime.ext_moreTypesPlus.constructFrom(someClass));
          if (jsValues.canConstruct(value)) {
            const instance = new (value.class)();
            const method = jsValues.getObjMethod(instance, "__init__");
            return (yield* method.callWithThis(instance, "__init__"));
          } else {
            throw "Attempted to construct from non-class.";
          }
        }
        jsValues.getClassToExtend = (strOrClass, isForInstanceof) => {
          if (jsValues.typeof(strOrClass) === "Class") return strOrClass.class;
          switch (strOrClass) {
            case ("Object"):
              return jsValues.Object;
            case ("Array"):
              return jsValues.Array;
            case ("Set"):
              return jsValues.Set;
            case ("Map"):
              return jsValues.Map;
            default:
              if (!isForInstanceof) {
                throw "Tried to extend invalid value";
              } else {
                throw "Invalid class for instanceof";
              }
          }
        }
        jsValues.isObject = (value) => {
          return (jsValues.typeof(value) === "Object" || jsValues.typeof(value) === "Array" || jsValues.typeof(value) === "Set" || jsValues.typeof(value) === "Map");
        }
        jsValues.isFunctionOrMethod = (value) => {
          return (jsValues.typeof(value) === "Function" || jsValues.typeof(value) === "Method" || jsValues.typeof(value) === "GeneratorFunction");
        }
        /*jsValues.trySuper = function* (thisVal) {
          const constructor = thisVal.constructor;
          const superClasses = [];
          if (constructor) {
            // Use a loop to find all superClasses
            let oldClass = constructor;
            while (true) {
              const superClass = Object.getPrototypeOf(oldClass);
              if (!(superClass === Function || superClass === jsValues.Object || superClass === jsValues.Array || superClass === jsValues.Set || superClass === jsValues.Map) && !(superClass == null)) {
                superClasses.unshift(superClass); // Use unshift to mimic the behavior of super in javascript.
              } else {
                break;
              }
              oldClass = superClass;
            }
            console.log("supers", superClasses);
            for (const superClass of superClasses) {
              (yield* (superClass.prototype.init.call(thisVal, true)));
            }
          }
          // If the function gets here and superClass.init hasn't been called, act as if nothing had happened.
        }*/
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
            this.makeLabel("Variable Access and Utility"),
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
            {
              opcode: "ignoreReturnValue",
              func: "noComp",
              blockType: Scratch.BlockType.COMMAND,
              text: "ignore return value [VALUE]",
              arguments: {
                VALUE: {
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
              opcode: "generalTypeof",
              func: "noComp",
              blockType: Scratch.BlockType.REPORTER,
              text: "general typeof [OBJECT]",
              tooltip: "Gets the general type of an object.",
              arguments: {
                OBJECT: {
                  type: Scratch.ArgumentType.STRING,
                  defaultValue: "Insert Anything Here"
                }
              }
            },
            {
              opcode: "classNameOf",
              func: "noComp",
              blockType: Scratch.BlockType.REPORTER,
              text: "class name of [OBJECT]",
              tooltip: "Gets the class name of an object.",
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
              tooltip: "self-explanatory",
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
              opcode: "createFunction",
              func: "noComp",
              output: ["Function"],
              blockShape: Scratch.BlockShape.SQUARE,
              blockType: Scratch.BlockType.REPORTER, // basically just undefined
              disableMonitor: true,
              branchCount: 1,
              text: "anonymous function"
            },
            {
              opcode: "prepareAndCreateFunction",
              func: "noComp",
              output: ["Function"],
              blockShape: Scratch.BlockShape.SQUARE,
              blockType: Scratch.BlockType.REPORTER, // basically just undefined
              disableMonitor: true,
              branchCount: 2,
              text: ["prepare", "and create anonymous function"],
              tooltip: "Allows the definition of arguments before creating a function.",
            },
            {
              opcode: "defineArgument",
              func: "noComp",
              blockShape: Scratch.BlockShape.COMMAND,
              text: "define argument [NAME]",
              tooltip: 'Defines a function argument with the given name. Works ONLY within the "before creation" substack.',
              arguments: {
                NAME: {
                  type: Scratch.ArgumentType.STRING,
                  defaultValue: "Argument Name",
                },
              },
            },
            {
              opcode: "defineOptionalArgument",
              func: "noComp",
              blockShape: Scratch.BlockShape.COMMAND,
              text: "define optional argument [NAME] with default [DEFAULT]",
              tooltip: 'Defines a function argument with the given name and default. Works ONLY within the "before creation" substack.',
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
              opcode: "getArgument",
              func: "noComp",
              blockType: Scratch.BlockType.REPORTER,
              blockShape: Scratch.BlockShape.SQUARE,
              tooltip: "Gets a function argument. Can ONLY be used within a function definition block.",
              text: "get argument [NAME]",
              arguments: {
                NAME: {
                  type: Scratch.ArgumentType.STRING,
                  defaultValue: "Argument Name",
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
              blockType: Scratch.BlockType.REPORTER,
              blockShape: Scratch.BlockShape.SQUARE,
              text: "call function [FUNCTION]",
              tooltip: "Executes a function or creates a generator from a generator function. ",
              arguments: {
               FUNCTION: {
                 type: Scratch.ArgumentType.STRING,
                 defaultValue: "Insert (Generator-) Function Here",
               }
              }
            },
            {
              opcode: "prepareAndCallFunction",
              func: "noComp",
              blockType: Scratch.BlockType.REPORTER,
              blockShape: Scratch.BlockShape.SQUARE,
              branchCount: 1,
              text: ["prepare", "and call function [FUNCTION]"],
              tooltip: "Executes a function after preperation and discards its return value. ",
              arguments: {
               FUNCTION: {
                 type: Scratch.ArgumentType.STRING,
                 defaultValue: "Insert Function Here",
               },
              },
            },
            {
              opcode: "setNextCallArgument",
              func: "noComp",
              blockType: Scratch.BlockType.COMMAND,
              text: "set next call argument to [VALUE]",
              tooltip: 'Sets the next function argument to the given value. Works ONLY within the "prepare" substack.',
              arguments: {
                VALUE: {
                  type: Scratch.ArgumentType.STRING,
                  defaultValue: "",
                },
              },
            },
            {
              opcode: "setCallArgumentByName",
              func: "noComp",
              blockType: Scratch.BlockType.COMMAND,
              text: "set call argument [NAME] to [VALUE]",
              tooltip: 'Sets the function argument with given name to the given value. Works ONLY within the "prepare" substack.',
              arguments: {
                NAME: {
                  type: Scratch.ArgumentType.STRING,
                  defaultValue: "Argument Name",
                },
                VALUE: {
                  type: Scratch.ArgumentType.STRING,
                  defaultValue: "",
                },
              },
            },
            this.makeLabel("OOP"),
            {
              opcode: "createClassInit",
              func: "noComp",
              blockType: Scratch.BlockType.REPORTER,
              blockShape: Scratch.BlockShape.SQUARE,
              disableMonitor: true,
              text: "create class [NAME] with __init__ [INIT]",
              arguments: {
                NAME: {type: Scratch.ArgumentType.STRING, defaultValue: "Class Name"},
                INIT: {type: Scratch.ArgumentType.STRING, defaultValue: "Insert __init__ Function Here"},
              }
            },
            {
              opcode: "createClassExtends",
              func: "noComp",
              blockType: Scratch.BlockType.REPORTER,
              blockShape: Scratch.BlockShape.SQUARE,
              disableMonitor: true,
              text: "create class [NAME] extends [SUPER]",
              arguments: {
                NAME : {type: Scratch.ArgumentType.STRING, defaultValue: "Class Name"},
                SUPER: {
                  type: Scratch.ArgumentType.STRING,
                  menu: "defaultClasses",
                  defaultValue: "Put in a class, or use the menu"
                },
              }
            },
            {
              opcode: "createClassExtendsInit",
              func: "noComp",
              blockType: Scratch.BlockType.REPORTER,
              blockShape: Scratch.BlockShape.SQUARE,
              disableMonitor: true,
              text: "create class [NAME] extends [SUPER] with __init__ [INIT]",
              arguments: {
                NAME : {type: Scratch.ArgumentType.STRING, defaultValue: "Class Name"},
                SUPER: {
                  type: Scratch.ArgumentType.STRING,
                  menu: "defaultClasses",
                  defaultValue: "Put in a class, or use the menu"
                },
                INIT: {type: Scratch.ArgumentType.STRING, defaultValue: "Insert __init__ Function Here"},
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
              opcode: "getMethod",
              func: "noComp",
              blockType: Scratch.BlockType.REPORTER,
              blockShape: Scratch.BlockShape.SQUARE,
              tooltip: "Gets a method of on object.",
              text: "get method with name [NAME] of [VALUE]",
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
              text: "construct instance of [CLASS]",
              arguments: {
                CLASS: {
                  type: Scratch.ArgumentType.STRING,
                  defaultValue: "Insert Class Here"
                }
              }
            },
            {
              opcode: "preprareAndConstruct",
              func: "noComp",
              blockType: Scratch.BlockType.REPORTER,
              blockShape: Scratch.BlockShape.SQUARE,
              branchCount: 1,
              text: ["prepare", "and construct instance of [CLASS]"],
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
            this.makeLabel("Generator Functions"),
            this.makeLabel("Use the \"call function\" block"),
            this.makeLabel("to create a generator instance"),
            {
              opcode: "generatorFunction",
              func: "noComp",
              blockType: Scratch.BlockType.REPORTER,
              blockShape: Scratch.BlockShape.SQUARE,
              disableMonitor: true,
              branchCount: 1,
              text: "generator function",
              tooltip: "Creates a generator function.",
            },
            {
              opcode: "prepareAndCreateGeneratorFunction",
              func: "noComp",
              output: ["Function"],
              blockShape: Scratch.BlockShape.SQUARE,
              blockType: Scratch.BlockType.REPORTER, // basically just undefined
              disableMonitor: true,
              branchCount: 2,
              text: ["prepare", "and create generator function"],
              tooltip: "Allows the definition of arguments before creating a generator function.",
            },
            {
              opcode: "yieldValue",
              func: "noComp",
              blockType: Scratch.BlockType.COMMAND,
              text: "yield [VALUE]",
              tooltip: "Usable within generator functions. Yields the given value.",
              arguments: {
                VALUE: {
                  type: Scratch.ArgumentType.STRING,
                  defaultValue: ""
                }
              }
            },
            {
              opcode: "nextGeneratorValue",
              func: "noComp",
              blockType: Scratch.BlockType.REPORTER,
              blockShape: Scratch.BlockShape.SQUARE,
              text: "next value of generator [GENERATOR]",
              arguments: {
                GENERATOR: {type: Scratch.ArgumentType.STRING, defaultValue: "Insert Generator"},
              },
            },
            {
              opcode: "generatorIsDone",
              func: "noComp",
              blockType: Scratch.BlockType.BOOLEAN,
              text: "is generator [GENERATOR] done?",
              arguments: {
                GENERATOR: {type: Scratch.ArgumentType.STRING, defaultValue: "Insert Generator"},
              },
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
            this.makeLabel("Debugging"),
            {
              opcode: "resetInternalState",
              func: "noComp",
              blockType: Scratch.BlockType.COMMAND,
              text:  "reset internal state",
              tooltip: "Resets the internal state. It might fix some bugs."
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
              contents: generator.descendInputOfBlock(block, "TXT"),
            }),
            ignoreReturnValue: (generator, block) => ({
              kind: "stack",
              value: generator.descendInputOfBlock(block, "VALUE"),
            }),
            newObject: (generator, block) => ({
              kind: "input",
              type: block.fields.CLASS.value,
            }),
            createFunction: (generator, block) => ({
              kind: "input",
              stack: generator.descendSubstack(block, "SUBSTACK")
            }),
            prepareAndCreateFunction: (generator, block) => ({
              kind: "input",
              prepareCode: generator.descendSubstack(block, "SUBSTACK" ),
              funcCode   : generator.descendSubstack(block, "SUBSTACK2"),
            }),
            defineArgument: (generator, block) => ({
              kind: "stack",
              name   : generator.descendInputOfBlock(block, "NAME"),
            }),
            defineOptionalArgument: (generator, block) => ({
              kind: "stack",
              name      : generator.descendInputOfBlock(block, "NAME"   ),
              defaultVal: generator.descendInputOfBlock(block, "DEFAULT"),
            }),
            getArgument: (generator, block) => ({
              kind: "input",
              name: generator.descendInputOfBlock(block, "NAME"),
            }),
            returnFromFunction: (generator, block) => ({
              kind: "stack",
              value: generator.descendInputOfBlock(block, "VALUE")
            }),
            callFunction: (generator, block) => (generator.script.yields = true, {
              kind: "input",
              func: generator.descendInputOfBlock(block, "FUNCTION")
            }),
            prepareAndCallFunction: (generator, block) => (generator.script.yields = true, {
              kind: "input",
              func: generator.descendInputOfBlock(block, "FUNCTION"),
              prepareCode: generator.descendSubstack(block, "SUBSTACK" ),
            }),
            setNextCallArgument: (generator, block) => ({
              kind: "stack",
              value: generator.descendInputOfBlock(block, "VALUE"),
            }),
            setCallArgumentByName: (generator, block) => ({
              kind: "stack",
              name : generator.descendInputOfBlock(block, "NAME" ),
              value: generator.descendInputOfBlock(block, "VALUE"),
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
            resetInternalState: (generator, block) => ({
              kind: "stack",
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
              key  : generator.descendInputOfBlock(block, "KEY"),
              object: generator.descendInputOfBlock(block, "OBJECT"),
            }),
            sizeof: (generator, block) => ({
              kind: "input",
              object: generator.descendInputOfBlock(block, "OBJECT"),
            }),
            generalTypeof: (generator, block) => ({
              kind: "input",
              object: generator.descendInputOfBlock(block, "OBJECT"),
            }),
            classNameOf: (generator, block) => ({
              kind: "input",
              object: generator.descendInputOfBlock(block, "OBJECT"),
            }),
            createSymbol: (generator, block) => ({
              kind: "input"
            }),
            nothingValue: (generator, block) => ({
              kind: "input"
            }),
            createClassInit: (generator, block) => ({
              kind: "input",
              name: generator.descendInputOfBlock(block, "NAME"), 
              init: generator.descendInputOfBlock(block, "INIT"),
            }),
            createClassExtends: (generator, block) => ({
              kind: "input",
              name      : generator.descendInputOfBlock(block, "NAME" ), 
              superClass: generator.descendInputOfBlock(block, "SUPER"),
            }),
            createClassExtendsInit: (generator, block) => ({
              kind: "input",
              name      : generator.descendInputOfBlock(block, "NAME" ), 
              superClass: generator.descendInputOfBlock(block, "SUPER"),
              init      : generator.descendInputOfBlock(block, "INIT" ),
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
            getMethod: (generator, block) => (generator.script.yields = true, {
              kind: "input",
              name: generator.descendInputOfBlock(block, "NAME"),
              obj: generator.descendInputOfBlock(block, "VALUE")
            }),
            preprareAndConstruct: (generator, block) => (generator.script.yields = true, {
              kind: "input",
              "class": generator.descendInputOfBlock(block, "CLASS"),
              prepareCode: generator.descendSubstack(block, "SUBSTACK" ),
            }),
            construct: (generator, block) => (generator.script.yields = true, {
              kind: "input",
              "class": generator.descendInputOfBlock(block, "CLASS"),
            }),
            instanceof: (generator, block) => ({
              kind: "input",
              "class": generator.descendInputOfBlock(block, "CLASS"),
              obj: generator.descendInputOfBlock(block, "OBJECT"),
            }),
            generatorFunction: (generator, block) => ({
              kind: "input",
              stack: generator.descendSubstack(block, "SUBSTACK"),
            }),
            prepareAndCreateGeneratorFunction: (generator, block) => ({
              kind: "input",
              prepareCode: generator.descendSubstack(block, "SUBSTACK" ),
              funcCode   : generator.descendSubstack(block, "SUBSTACK2"),
            }),
            yieldValue: (generator, block) => ({
              kind: "stack",
              value: generator.descendInputOfBlock(block, "VALUE"),
            }),
            nextGeneratorValue: (generator, block) => ({
              kind: "input",
              "generator": generator.descendInputOfBlock(block, "GENERATOR"),
            }),
            generatorIsDone: (generator, block) => ({
              kind: "input",
              "generator": generator.descendInputOfBlock(block, "GENERATOR"),
            }),
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
            ignoreReturnValue: (node, compiler, imports) => {
              const value = compiler.descendInput(node.value);
              compiler.source += `${value.asUnknown()};\n`;
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
            createFunction: (node, compiler, imports) => {
              // big hack ALSO STOLEN
              const oldSrc = compiler.source;
              compiler.descendStack(node.stack, new (imports.Frame)(false));
              const stackSrc = compiler.source.substring(oldSrc.length);
              compiler.source = oldSrc;
              const generatedJS = `new (runtime.ext_moreTypesPlus.Function)(
                (function*(){
                  ${stackSrc}
                  return runtime.ext_moreTypesPlus.Nothing;
                }), null
              )`;
              return new (imports.TypedInput)(generatedJS, imports.TYPE_UNKNOWN)
            },
            prepareAndCreateFunction: (node, compiler, imports) => {
              const oldSrc = compiler.source;
              
              compiler.descendStack(node.funcCode, new (imports.Frame)(false));
              const funcCodeSrc = compiler.source.substring(oldSrc.length);
              compiler.source = oldSrc;
              
              compiler.descendStack(node.prepareCode, new (imports.Frame)(false));
              const prepareSrc = compiler.source.substring(oldSrc.length);
              compiler.source = oldSrc;
              
              const functionDefLocal = compiler.localVariables.next();

              const generatedJS = `(yield* (
                runtime.ext_moreTypesPlus.enterFunctionDef(),
                function*() {
                  try {  ${prepareSrc}  }
                  finally {  ${functionDefLocal} = runtime.ext_moreTypesPlus.exitFunctionDef();  }
                  return new (runtime.ext_moreTypesPlus.Function)(
                    (function*() {
                      ${funcCodeSrc}
                      return runtime.ext_moreTypesPlus.Nothing;
                    }), 
                    ${functionDefLocal}
                  );
                }()
              ))`
              return new (imports.TypedInput)(generatedJS, imports.TYPE_UNKNOWN);
            },
            defineArgument: (node, compiler, imports) => {
              const name = compiler.descendInput(node.name);
              compiler.source += `runtime.ext_moreTypesPlus.defineFunctionDefArg(${name.asString()});\n`;
            },
            defineOptionalArgument: (node, compiler, imports) => {
              const name       = compiler.descendInput(node.name);
              const defaultVal = compiler.descendInput(node.defaultVal);
              compiler.source += `runtime.ext_moreTypesPlus.addOptionalFunctionDefArg(${name.asString()}, ${defaultVal.asUnknown()});\n`;
            },
            getArgument: (node, compiler, imports) => {
              const name        = compiler.descendInput(node.name);
              const generatedJS = `runtime.ext_moreTypesPlus.getFunctionArgument(${name.asString()})`;
              return new (imports.TypedInput)(generatedJS, imports.TYPE_UNKNOWN);
            },
            returnFromFunction: (node, compiler, imports) => {
              compiler.source += `return ${compiler.descendInput(node.value).asUnknown()};\n`;
            },
            callFunction: (node, compiler, imports) => {
              const funcLocal         = compiler.localVariables.next();
              const functionCallLocal = compiler.localVariables.next();
              const func              = compiler.descendInput(node.func);
              if (!compiler.script.yields === true) throw "Something happened in the More Types Plus extension"
              const generatedJS = `(yield* (
                (function* (){
                  ${funcLocal} = ${func.asUnknown()};
                  if (!runtime.ext_moreTypesPlus.isFunctionOrMethod(${funcLocal})) throw "Attempted to call non-function.";
                  runtime.ext_moreTypesPlus.enterFunctionCall(${funcLocal}.getFunctionDef());
                  ${functionCallLocal} = runtime.ext_moreTypesPlus.exitFunctionCall();
                  runtime.ext_moreTypesPlus.enterScope(${functionCallLocal}.convert());
                  try {  return yield* ${funcLocal}.call();  }
                  finally {  runtime.ext_moreTypesPlus.exitScope();  }
                })()
              ))`;
              console.log(generatedJS);
              return new (imports.TypedInput)(generatedJS, imports.TYPE_UNKNOWN);
            },
            prepareAndCallFunction: (node, compiler, imports) => {
              const funcLocal         = compiler.localVariables.next();
              const functionCallLocal = compiler.localVariables.next();
              const func              = compiler.descendInput(node.func);            
              const oldSrc            = compiler.source;
              compiler.descendStack(node.prepareCode, new (imports.Frame)(false));
              const prepareSrc = compiler.source.substring(oldSrc.length);
              compiler.source  = oldSrc;
              
              if (!compiler.script.yields === true) throw "Something happened in the More Types Plus extension"
              const generatedJS = `(yield* (
                (function* (){
                  ${funcLocal} = ${func.asUnknown()};
                  if (!runtime.ext_moreTypesPlus.isFunctionOrMethod(${funcLocal})) throw "Attempted to call non-function.";
                  runtime.ext_moreTypesPlus.enterFunctionCall(${funcLocal}.getFunctionDef());
                  try {  ${prepareSrc}  }
                  finally {  ${functionCallLocal} = runtime.ext_moreTypesPlus.exitFunctionCall();  }
                  runtime.ext_moreTypesPlus.enterScope(${functionCallLocal}.convert());
                  try {  return yield* ${funcLocal}.call();  }
                  finally {  runtime.ext_moreTypesPlus.exitScope();  }
                })()
              ))`;
              return new (imports.TypedInput)(generatedJS, imports.TYPE_UNKNOWN);
            },
            setNextCallArgument: (node, compiler, imports) => {
              const value = compiler.descendInput(node.value);
              compiler.source += `runtime.ext_moreTypesPlus.setNextFunctionCallArg(${value.asUnknown()});\n`;
            },
            setCallArgumentByName: (node, compiler, imports) => {
              const name  = compiler.descendInput(node.name );
              const value = compiler.descendInput(node.value);
              compiler.source += `runtime.ext_moreTypesPlus.setFunctionCallArgByName(${name.asString()}, ${value.asUnknown()});\n`;
            },            
            getIndex: (node, compiler, imports) => {
              const key = compiler.descendInput(node.key   );
              const obj = compiler.descendInput(node.object);
              
              const objLocal = compiler.localVariables.next();
              // i forgor that we cannot use const in an expression.
              // so i had to implement a store system.
              const generatedJS = `(
                ${objLocal} = ${obj.asUnknown()},
                (
                  typeof (${objLocal} ? ${objLocal} : {}).get === "function"
                    ? ${objLocal}.get(${key.asUnknown()})
                    : runtime.ext_moreTypesPlus.throwErr(\`Cannot read properties of \${${objLocal}}\`)
                )
              )`;
              return new (imports.TypedInput)(generatedJS, imports.TYPE_UNKNOWN)
            },
            setIndex: (node, compiler, imports) => {
              const key   = compiler.descendInput(node.key   );
              const value = compiler.descendInput(node.value );
              const obj   = compiler.descendInput(node.object);
              
              const objLocal = compiler.localVariables.next();
              const generatedJS = `
                const ${objLocal} = ${obj.asUnknown()};
                (
                  (typeof (${objLocal} ? ${objLocal} : {}).set === "function")
                    ? ${objLocal}.set(${key.asUnknown()}, ${value.asUnknown()})
                    : runtime.ext_moreTypesPlus.throwErr(\`Cannot set properties of \${${objLocal}}\`)
                );
              `;
              compiler.source += generatedJS;
            },
            iterateObject: (node, compiler, imports) => {
              const keyVar    = compiler.descendVariable(node.key );
              const valueVar = compiler.descendVariable(node.value);
              const obj = compiler.descendInput(node.object);
              // im stupid and dont know which variables are used so im just going to use a local variable
              const iterableLocal = compiler.localVariables.next();
              const keyLocal      = compiler.localVariables.next();
              const generatedJS = `
                const ${iterableLocal} = runtime.ext_moreTypesPlus.toIterable(${obj.asUnknown()});
                for (const ${keyLocal} of ${iterableLocal}) {
                  ${keyVar.source} = ${keyLocal}[0];
                  ${valueVar.source} = ${keyLocal}[1];
                }
              `;
              compiler.source += generatedJS;
              // time to add the substack
              compiler.descendStack(node.stack, new (imports.Frame)(true, "moreTypesPlus.iterateObject"));
              compiler.yieldLoop();
              compiler.source += "};\n"
            },
            iterateObjectTempVars: (node, compiler, imports) => {
              const keyVar   = compiler.descendInput(node.key   );
              const valueVar = compiler.descendInput(node.value );
              const obj      = compiler.descendInput(node.object);
              // im stupid and dont know which variables are used so im just going to use a local variable
              const iterableLocal = compiler.localVariables.next();
              const keyLocal      = compiler.localVariables.next();
              const generatedJS = `
                const ${iterableLocal} = runtime.ext_moreTypesPlus.toIterable(${obj.asUnknown()});
                for (const ${keyLocal} of ${iterableLocal}) {
                  tempVars[${keyVar.asString()}] = ${keyLocal}[0];
                  tempVars[${valueVar.asString()}] = ${keyLocal}[1];
                }
              `;            
              compiler.source += generatedJS;
              // time to add the substack
              compiler.descendStack(node.stack, new (imports.Frame)(true, "moreTypesPlus.iterateObject"));
              compiler.yieldLoop();
              compiler.source += "};\n"
            },
            resetInternalState: (node, compiler, imports) => {
              compiler.source += "runtime.ext_moreTypesPlus.resetState();\n";
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
              
              const objLocal = compiler.localVariables.next();
              const generatedJS = `
                const ${objLocal} = ${obj.asUnknown()};
                (
                  typeof (${objLocal} ? ${objLocal} : {}).delete === "function"
                    ? ${objLocal}.delete(${key.asUnknown()})
                    : runtime.ext_moreTypesPlus.throwErr(\`Cannot delete properties of \${${objLocal}}\`)
                );
              `;
              compiler.source += generatedJS;
            },
            addItem: (node, compiler, imports) => {
              const value = compiler.descendInput(node.value);
              const obj = compiler.descendInput(node.object);
              
              const objLocal = compiler.localVariables.next();
              const generatedJS = `
                const ${objLocal} = ${obj.asUnknown()};
                (
                  typeof (${objLocal} ? ${objLocal} : {}).add === "function"
                    ? ${objLocal}.add(${value.asUnknown()})
                    : runtime.ext_moreTypesPlus.throwErr(\`Cannot add to the end of \${${objLocal}}\`)
                );
              `;
              compiler.source += generatedJS;
            },
            keyExists: (node, compiler, imports) => {
              const key = compiler.descendInput(node.key);
              const obj = compiler.descendInput(node.object);
              
              const objLocal = compiler.localVariables.next();
              const generatedJS = `(
                (${objLocal} = ${obj.asUnknown()}),
                (
                  typeof (${objLocal} ? ${objLocal} : {}).has === "function"
                    ? ${objLocal}.has(${key.asUnknown()})
                    : runtime.ext_moreTypesPlus.throwErr(\`Cannot read properties of \${${objLocal}}\`)
                )
              )`;
              //return new (imports.TypedInput)(generatedJS, imports.TYPE_BOOLEAN)
              return new (imports.TypedInput)(`((${objLocal} = ${obj.asUnknown()}),(typeof (${objLocal} ? ${objLocal} : \{\}).has === "function")\n  ? ${objLocal}.has(${key.asUnknown()})\n  : runtime.ext_moreTypesPlus.throwErr(\`Cannot read properties of \${${objLocal}}\`))`, imports.TYPE_BOOLEAN)
            },
            sizeof: (node, compiler, imports) => {
              const obj = compiler.descendInput(node.object);
              
              const objLocal = compiler.localVariables.next();
              const generatedJS = `
                (
                  (${objLocal} = ${obj.asUnknown()}),
                  (
                    typeof (${objLocal} ? ${objLocal} : {}).size === "number"
                      ? ${objLocal}.size
                      : runtime.ext_moreTypesPlus.throwErr(\`Cannot read properties of \${${objLocal}}\`)
                  )
                )
              `;
              return new (imports.TypedInput)(generatedJS, imports.TYPE_NUMBER);
            },
            generalTypeof: (node, compiler, imports) => {
              const obj = compiler.descendInput(node.object);
              return new (imports.TypedInput)(`(runtime.ext_moreTypesPlus.typeof(${obj.asUnknown()}))`, imports.TYPE_NUMBER);
            },
            classNameOf: (node, compiler, imports) => {
              const obj = compiler.descendInput(node.object);
              return new (imports.TypedInput)(`(runtime.ext_moreTypesPlus.classNameOf(${obj.asUnknown()}))`, imports.TYPE_NUMBER);
            },
            createSymbol: (node, compiler, imports) => {
              return new (imports.TypedInput)(`new (runtime.ext_moreTypesPlus).Symbol()`, imports.TYPE_UNKNOWN);
            },
            nothingValue: (node, compiler, imports) => {
              return new (imports.TypedInput)(`runtime.ext_moreTypesPlus.Nothing`, imports.TYPE_UNKNOWN);
            },
            createClassInit: (node, compiler, imports) => {
              const name     = compiler.descendInput(node.name);
              const initFunc = compiler.descendInput(node.init);
              const objLocal = compiler.localVariables.next();

              const generatedJS = `(yield* (function* () {
                ${objLocal} = new (runtime.ext_moreTypesPlus.Class)(
                  class MORETYPESPLUS extends (runtime.ext_moreTypesPlus.getClassToExtend("Object")) {
                    constructor() {super(); this.__className = ${name.asString()}}
                    toString() {return "<" + this.__className + " Instance>"}
                  }
                );
                runtime.ext_moreTypesPlus.appendMethod(${objLocal}, "__init__", ${initFunc.asUnknown()});
                return ${objLocal};
              })())`
              return new (imports.TypedInput)(generatedJS, imports.TYPE_UNKNOWN);
            },
            createClassExtends: (node, compiler, imports) => {
              const name       = compiler.descendInput(node.name);
              const superClass = compiler.descendInput(node.superClass);
              
              const generatedJS = `(new (runtime.ext_moreTypesPlus.Class)(
                class MORETYPESPLUS extends (runtime.ext_moreTypesPlus.getClassToExtend(${superClass.asUnknown()})) {
                  constructor() {super(); this.__className = ${name.asString()}}
                    toString() {return "<" + this.__className + " Instance>"}
                }))`
              return new (imports.TypedInput)(generatedJS, imports.TYPE_UNKNOWN);
            },
            createClassExtendsInit: (node, compiler, imports) => {
              const name       = compiler.descendInput(node.name);
              const superClass = compiler.descendInput(node.superClass);
              const initFunc   = compiler.descendInput(node.init);
              const objLocal   = compiler.localVariables.next();

              const generatedJS = `(yield* (function* () {
                ${objLocal} = new (runtime.ext_moreTypesPlus.Class)(
                  class MORETYPESPLUS extends (runtime.ext_moreTypesPlus.getClassToExtend(${superClass.asUnknown()})) {
                    constructor() {super(); this.__className = ${name.asString()}}
                    toString() {return "<" + this.__className + " Instance>"}
                  }
                );
                runtime.ext_moreTypesPlus.appendMethod(${objLocal}, "__init__", ${initFunc.asUnknown()});
                return ${objLocal};
              })())`
              return new (imports.TypedInput)(generatedJS, imports.TYPE_UNKNOWN);
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
            getMethod: (node, compiler, imports) => {
              // getObjMethod(obj, name)
              const obj       = compiler.descendInput(node.obj);
              const name      = compiler.descendInput(node.name);
              const objLocal  = compiler.localVariables.next();
              const nameLocal = compiler.localVariables.next();
              const generatedJS = `(yield* (function* () {
                ${objLocal} = ${obj.asUnknown()};
                ${nameLocal} = ${name.asString()};
                return new runtime.ext_moreTypesPlus.Method(
                  runtime.ext_moreTypesPlus.getObjMethod(${objLocal}, ${nameLocal}),
                  ${objLocal}, ${nameLocal}
                );
              })())`
              const generatedJS2 = `new runtime.ext_moreTypesPlus.Method(runtime.ext_moreTypePlus.getObjMethod(${obj}, ${name}))`
              return new (imports.TypedInput)(generatedJS, imports.TYPE_UNKNOWN);
            },
            construct: (node, compiler, imports) => {
              const constructor = compiler.descendInput(node.class).asUnknown();
              return new (imports.TypedInput)(`(yield* (runtime.ext_moreTypesPlus.constructFrom(${constructor})))`, imports.TYPE_UNKNOWN);
            },
            preprareAndConstruct: (node, compiler, imports) => {
              const classInput = compiler.descendInput(node.class);
              const classLocal = compiler.localVariables.next();
              const callLocal  = compiler.localVariables.next();
              
              const oldSrc = compiler.source;
              compiler.descendStack(node.prepareCode, new (imports.Frame)(false));
              const prepareSrc = compiler.source.substring(oldSrc.length);
              compiler.source = oldSrc;
              
              const generatedJS = `(yield* (function* () {
                ${classLocal} = ${classInput.asUnknown()};
                runtime.ext_moreTypesPlus.enterFunctionCall(runtime.ext_moreTypesPlus.getClassMethod(${classLocal}, "__init__").getFunctionDef());  
                try {  ${prepareSrc}  }
                finally {  ${callLocal} = runtime.ext_moreTypesPlus.exitFunctionCall();  }
                runtime.ext_moreTypesPlus.enterScope(${callLocal}.convert());
                try {  return (yield* (runtime.ext_moreTypesPlus.constructFrom(${classLocal})));  }
                finally {  runtime.ext_moreTypesPlus.exitScope();  }
              })())`
              return new (imports.TypedInput)(generatedJS, imports.TYPE_UNKNOWN);
            },
            instanceof: (node, compiler, imports) => {
              const constructor = compiler.descendInput(node.class).asUnknown();
              const obj = compiler.descendInput(node.obj).asUnknown();
              return new (imports.TypedInput)(`(${obj} instanceof runtime.ext_moreTypesPlus.getClassToExtend(${constructor}, true))`, imports.TYPE_BOOLEAN);
            },
            generatorFunction: (node, compiler, imports) => {
              // big hack ALSO STOLEN
              const oldSrc = compiler.source;
              compiler.descendStack(node.stack, new (imports.Frame)(false));
              const stackSrc = compiler.source.substring(oldSrc.length);
              compiler.source = oldSrc;
              console.log("compiler", compiler);
              const generatedJS = `new (runtime.ext_moreTypesPlus.GeneratorFunction)(
                (function*(){
                  ${stackSrc}
                  return runtime.ext_moreTypesPlus.Nothing;
                }), null
              )`;
              return new (imports.TypedInput)(generatedJS, imports.TYPE_UNKNOWN)
            },
            prepareAndCreateGeneratorFunction: (node, compiler, imports) => {
              const oldSrc = compiler.source;
              
              compiler.descendStack(node.funcCode, new (imports.Frame)(false));
              const funcCodeSrc = compiler.source.substring(oldSrc.length);
              compiler.source = oldSrc;
              
              compiler.descendStack(node.prepareCode, new (imports.Frame)(false));
              const prepareSrc = compiler.source.substring(oldSrc.length);
              compiler.source = oldSrc;
              
              const functionDefLocal = compiler.localVariables.next();

              const generatedJS = `(yield* (
                runtime.ext_moreTypesPlus.enterFunctionDef(),
                function*() {
                  try {  ${prepareSrc}  }
                  finally {  ${functionDefLocal} = runtime.ext_moreTypesPlus.exitFunctionDef();  }
                  return new (runtime.ext_moreTypesPlus.GeneratorFunction)(
                    (function*(){
                      ${funcCodeSrc}
                      return runtime.ext_moreTypesPlus.Nothing;
                    }), ${functionDefLocal}
                  );
                }()
              ))`
              return new (imports.TypedInput)(generatedJS, imports.TYPE_UNKNOWN);
            },
            yieldValue: (node, compiler, imports) => {
              const value       = compiler.descendInput(node.value);
              const generatedJS = `yield (new runtime.ext_moreTypesPlus.YieldValue(${value.asUnknown()}));\n`;
              compiler.source += generatedJS;
            },
            nextGeneratorValue: (node, compiler, imports) => {
              const generatorVal   = compiler.descendInput(node.generator);
              const generatorLocal = compiler.localVariables.next();
              const generatedJS = `yield* (
                ${generatorLocal} = ${generatorVal.asUnknown()},
                (${generatorLocal} instanceof runtime.ext_moreTypesPlus.Generator) ?
                  ${generatorLocal}.getNext() :
                  runtime.ext_moreTypesPlus.throwErr("Attempted to get next value of non-generator.")
              )`;
              return new (imports.TypedInput)(generatedJS, imports.TYPE_UNKNOWN);
            },
            generatorIsDone: (node, compiler, imports) => {
              const generatorVal   = compiler.descendInput(node.generator);
              const generatorLocal = compiler.localVariables.next();
              const generatedJS = `yield* (
                ${generatorLocal} = ${generatorVal.asUnknown()},
                (${generatorLocal} instanceof runtime.ext_moreTypesPlus.Generator) ?
                  (function*() {return ${generatorLocal}.isDone})():
                  runtime.ext_moreTypesPlus.throwErr("Attempted to ask, wether a non-generator is done.")
              )`;
              return new (imports.TypedInput)(generatedJS, imports.TYPE_UNKNOWN);
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
        vm.runtime.ext_moreTypesPlus._CREATEVAR(vm.runtime.targets.indexOf(target), args.VARIABLE.toString());
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
