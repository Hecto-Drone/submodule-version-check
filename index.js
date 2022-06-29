const core = require("@actions/core");
const exec = require("@actions/exec");
const stream = require("stream");

const submodulePath = core.getInput("submodule-path");
const requiredVersion = core.getInput("version");

async function execToString(command, args, options) {
    let output = "";
    const outStream = new stream.PassThrough();
    outStream.on("data", c => output += c.toString());

    const exitCode = await exec.exec(command, args, Object.assign(options, {
        outStream
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
        throw new Error(`Submodule "${submodulePath}" version mismatch: local(${localVersion}) remote(${remoteVersion})`);
    }
}

(async () => {
    try {
        await run();
    } catch (e) {
        core.setFailed(e);
    }
})();