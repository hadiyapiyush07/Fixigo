
const fs = require("fs");
const p = "node_modules/react-native-sound/package.json";
if (fs.existsSync(p)) {
  const data = JSON.parse(fs.readFileSync(p, "utf8"));
  if (data.codegenConfig) {
    delete data.codegenConfig;
    fs.writeFileSync(p, JSON.stringify(data, null, 2));
    console.log("Fixed react-native-sound codegenConfig");
  }
}
