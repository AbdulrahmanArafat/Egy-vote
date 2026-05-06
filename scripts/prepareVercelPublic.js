const fs = require("fs");
const path = require("path");

const projectRoot = path.resolve(__dirname, "..");
const publicRoot = path.join(projectRoot, "public");
const assetDirectories = ["css", "js", "images"];

function ensureDirectory(directoryPath) {
    fs.mkdirSync(directoryPath, { recursive: true });
}

function copyDirectory(sourceDirectory, targetDirectory) {
    ensureDirectory(targetDirectory);

    for (const entry of fs.readdirSync(sourceDirectory, { withFileTypes: true })) {
        const sourcePath = path.join(sourceDirectory, entry.name);
        const targetPath = path.join(targetDirectory, entry.name);

        if (entry.isDirectory()) {
            copyDirectory(sourcePath, targetPath);
        } else {
            ensureDirectory(path.dirname(targetPath));
            fs.copyFileSync(sourcePath, targetPath);
        }
    }
}

ensureDirectory(publicRoot);

for (const directoryName of assetDirectories) {
    copyDirectory(
        path.join(projectRoot, directoryName),
        path.join(publicRoot, directoryName)
    );
}

console.log("Prepared public assets for Vercel.");
