const b0.value = "...";
(typeof (b0.value ? b0.value : {}).add === "function")
  ? b0.value.add("...")
    : runtime.ext_moreTypesPlus.throwErr(`Cannot add to the end of \${b0.value}`)


const ${local1} = ${obj.asUnknown()};
(typeof (${local1} ? ${local1} : {}).add === "function")
    ? ${local1}.add(${value.asUnknown()})
    : runtime.ext_moreTypesPlus.throwErr(`Cannot add to the end of \${${local1}}`)


new (runtime.ext_moreTypesPlus.Function)
(target, (function*(){
    ${stackSrc};
    return runtime.ext_moreTypesPlus.Nothing;
}))



(() => {runtime.ext_moreTypesPlus.enterFunctionDef();
// ...
runtime.ext_moreTypesPlus.exitFunctionDef();
return   new (runtime.ext_moreTypesPlus.Function)
    (
        target, 
        (
            function*(){
                //...
                return runtime.ext_moreTypesPlus.Nothing;
            }
        ), 
        runtime.ext_moreTypesPlus.exitFunctionDef().args
    );  
})();


(() => {runtime.ext_moreTypesPlus.enterFunctionDef();
//...
return   new (runtime.ext_moreTypesPlus.Function)
        (
            target, 
            (function*(){
                //...
                return runtime.ext_moreTypesPlus.Nothing;
            }), 
            runtime.ext_moreTypesPlus.exitFunctionDef().args
        );  
})();


(() => {
    runtime.ext_moreTypesPlus.enterFunctionDef();
    return   new (runtime.ext_moreTypesPlus.Function)
    (
        target, 
        (function*(){
            runtime.ext_moreTypesPlus.addFunctionDefArg("Argument Name", null);
            return runtime.ext_moreTypesPlus.Nothing;
        }), 
        runtime.ext_moreTypesPlus.exitFunctionDef().args
    );  
})();
