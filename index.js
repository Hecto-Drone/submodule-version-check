const core = require("@actions/core");
const exec = require("@actions/exec");

const submodulePath = core.getInput("submodule-path");
const requiredVersion = core.getInput("version");

async function execToString(command, args, options) {
    let output = "";
    
    const exitCode = await exec.exec(command, args, Object.assign(options, {
        listeners: {
            stdout: c => output += c.toString(),
            stderr: c => output += c.toString(),
        },
    }));

    if (exitCode > 0) {
        throw new Error(output);
    }

    return output;
}

async function getVersion(ref) {
    const submoduleVersion = await execToString("git", ["rev-parse", ref], {
        cwd: submodulePath,
    });

    return submoduleVersion;
}

async function run() {   
    const localVersion = await getVersion("HEAD");
    const remoteVersion = await getVersion(requiredVersion);

    if (localVersion != remoteVersion) {
        throw new Error(`Submodule "${submodulePath}" version mismatch: local(${localVersion.substring(0,7)}) remote(${remoteVersion.substring(0,7)})`);
    }
}

(async () => {
    try {
        await run();
    } catch (e) {
        core.setFailed(e);
    }
})();