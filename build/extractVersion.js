const fs = require("fs");
const path = require("path");

const packageFilePath = path.join(__dirname, "../package.json");
const versionFilePath = path.join(__dirname, "../src/version.ts");

fs.readFile(packageFilePath, {}, (err, data) => {
    if(err) {
        console.log(err);
        return;
    }
    const version = JSON.parse(data).version;
    const content = `export const version: string = "${version}";`;
    fs.writeFile(versionFilePath, content, (err) => {
        if(err) {
            console.log(err);
            return;
        }
        console.log("Version updated successfully");
    })
});