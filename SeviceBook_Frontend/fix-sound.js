const fs = require("fs");
const path = require("path");
const p = "node_modules/react-native-sound/package.json";
if (fs.existsSync(p)) {
  const data = JSON.parse(fs.readFileSync(p, "utf8"));
  if (data.codegenConfig) {
    delete data.codegenConfig;
    fs.writeFileSync(p, JSON.stringify(data, null, 2));
    console.log("Fixed react-native-sound codegenConfig");
  }
}
const jniDir = "node_modules/react-native-sound/android/build/generated/source/codegen/jni";
if (!fs.existsSync(jniDir)) {
  fs.mkdirSync(jniDir, { recursive: true });
}
const cmakeFile = path.join(jniDir, "CMakeLists.txt");
fs.writeFileSync(cmakeFile, "cmake_minimum_required(VERSION 3.13)\nproject(react_codegen_RNSound)\nadd_library(react_codegen_RNSound INTERFACE)\n");
console.log("Created dummy CMakeLists.txt for RNSound");
