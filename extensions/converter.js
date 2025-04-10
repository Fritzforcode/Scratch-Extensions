const fs = require("fs");

const newJavaScriptCode = fs.readFileSync("extensions/moreTypesPlus.js", "utf-8");

// Define the structure that holds the new JavaScript code in the format expected by your program
const newExtensionConfig = JSON.parse(fs.readFileSync(`C:/Users/.../Downloads/tow/project.json`, "utf-8"));
newExtensionConfig.extensionURLs.moreTypesPlus = "data:application/javascript," + encodeURIComponent(newJavaScriptCode);

// If necessary, you can log the new configuration to see the result
fs.writeFileSync(`C:/Users/.../Downloads/tow_new/project.json`, JSON.stringify(newExtensionConfig));

