/**
* Powerbi does not support import statements yet. Hence, the only way to support types in PowerBi Visual is to 
* have the following statement in the type definition file.
*/
const fs = require("fs");
const path = require("path");

const text = "export as namespace Shifu;";
const filePath = path.join(__dirname, "../dist/index.d.ts");

let writeStream = fs.createWriteStream(filePath, {
    flags: "a"
});

writeStream.write(text);

writeStream.end((err) => {
    if (err) console.log(err);
    console.log("Type Definition written successfully");
});
