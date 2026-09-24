const fs = require('fs');
const path = require('path');
const p = 'node_modules/react-native-sound/package.json';
if (fs.existsSync(p)) {
  const data = JSON.parse(fs.readFileSync(p, 'utf8'));
  if (data.codegenConfig) {
    delete data.codegenConfig;
    fs.writeFileSync(p, JSON.stringify(data, null, 2));
  }
}
const jniDir = 'node_modules/react-native-sound/android/build/generated/source/codegen/jni';
if (!fs.existsSync(jniDir)) {
  fs.mkdirSync(jniDir, { recursive: true });
}
const cmakeFile = path.join(jniDir, 'CMakeLists.txt');
fs.writeFileSync(cmakeFile, 'cmake_minimum_required(VERSION 3.13)\nproject(react_codegen_RNSound)\nfile(WRITE dummy.cpp "")\nadd_library(react_codegen_RNSound STATIC dummy.cpp)\ntarget_include_directories(react_codegen_RNSound PUBLIC ${CMAKE_CURRENT_SOURCE_DIR})\n');
const headerFile = path.join(jniDir, 'RNSound.h');
fs.writeFileSync(headerFile, '#pragma once\n#include <memory>\n#include <string>\n#include <ReactCommon/JavaTurboModule.h>\nnamespace facebook {\nnamespace react {\ninline std::shared_ptr<TurboModule> RNSound_ModuleProvider(const std::string&, const JavaTurboModule::InitParams&) { return nullptr; }\n}\n}\n');
console.log('Fixed sound dummy native module');
