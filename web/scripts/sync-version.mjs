import assert from "node:assert/strict";
import { mkdtemp, readFile, rm, writeFile, mkdir } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const versionPattern = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/;
const appVersionPattern = /export const APP_VERSION = "([^"]+)";/;

function createPaths(webRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..")) {
  return {
    appVersionPath: join(webRoot, "lib", "appVersion.ts"),
    packageJsonPath: join(webRoot, "package.json"),
    rootVersionPath: join(resolve(webRoot, ".."), "VERSION"),
    webRoot,
    webVersionPath: join(webRoot, "VERSION"),
  };
}

function normalizeVersion(value, sourceName) {
  const version = value.trim();

  if (!versionPattern.test(version)) {
    throw new Error(
      `${sourceName} のバージョンは x.y.z 形式で指定してください: ${version || "空"}`,
    );
  }

  return version;
}

async function readTextIfExists(filePath) {
  try {
    return await readFile(filePath, "utf8");
  } catch (error) {
    if (error && error.code === "ENOENT") {
      return null;
    }

    throw error;
  }
}

async function readVersionFile(filePath, sourceName, { required }) {
  const text = await readTextIfExists(filePath);

  if (text === null) {
    if (required) {
      throw new Error(`${sourceName} が見つかりません: ${filePath}`);
    }

    return null;
  }

  return normalizeVersion(text, sourceName);
}

async function readPackageJson(paths) {
  const text = await readFile(paths.packageJsonPath, "utf8");

  return JSON.parse(text);
}

async function readPackageVersion(paths) {
  const packageJson = await readPackageJson(paths);

  if (typeof packageJson.version !== "string") {
    throw new Error("web/package.json の version が文字列ではありません。");
  }

  return normalizeVersion(packageJson.version, "web/package.json");
}

async function writePackageVersion(paths, version) {
  const packageJson = await readPackageJson(paths);
  packageJson.version = version;

  await writeFile(paths.packageJsonPath, `${JSON.stringify(packageJson, null, 2)}\n`);
}

function appVersionFileContent(version) {
  return `// このファイルは scripts/sync-version.mjs により VERSION から同期します。\nexport const APP_VERSION = "${version}";\n`;
}

async function readAppVersion(paths) {
  const text = await readTextIfExists(paths.appVersionPath);

  if (text === null) {
    throw new Error(`web/lib/appVersion.ts が見つかりません: ${paths.appVersionPath}`);
  }

  const match = text.match(appVersionPattern);

  if (!match) {
    throw new Error("web/lib/appVersion.ts から APP_VERSION を読み取れません。");
  }

  return normalizeVersion(match[1], "web/lib/appVersion.ts");
}

async function writeAppVersion(paths, version) {
  await mkdir(dirname(paths.appVersionPath), { recursive: true });
  await writeFile(paths.appVersionPath, appVersionFileContent(version));
}

async function syncVersion(paths = createPaths()) {
  const version = await readVersionFile(paths.rootVersionPath, "ルート VERSION", {
    required: true,
  });

  await writeFile(paths.webVersionPath, `${version}\n`);
  await writePackageVersion(paths, version);
  await writeAppVersion(paths, version);

  return version;
}

async function checkVersion(paths = createPaths()) {
  const rootVersion = await readVersionFile(paths.rootVersionPath, "ルート VERSION", {
    required: false,
  });
  const webVersion = await readVersionFile(paths.webVersionPath, "web/VERSION", {
    required: true,
  });
  const expectedVersion = rootVersion ?? webVersion;
  const packageVersion = await readPackageVersion(paths);
  const appVersion = await readAppVersion(paths);
  const actualVersions = [
    rootVersion === null ? null : ["ルート VERSION", rootVersion],
    ["web/VERSION", webVersion],
    ["web/package.json", packageVersion],
    ["web/lib/appVersion.ts", appVersion],
  ].filter(Boolean);
  const mismatches = actualVersions.filter(([, version]) => version !== expectedVersion);

  if (mismatches.length > 0) {
    const details = mismatches
      .map(([sourceName, version]) => `${sourceName}=${version}`)
      .join(", ");

    throw new Error(`バージョンが一致していません。基準=${expectedVersion}; ${details}`);
  }

  return expectedVersion;
}

async function writeFixture(
  paths,
  {
    rootVersion = "0.1.0",
    webVersion = "0.1.0",
    packageVersion = "0.1.0",
    appVersion = "0.1.0",
  } = {},
) {
  await mkdir(paths.webRoot, { recursive: true });
  await mkdir(dirname(paths.appVersionPath), { recursive: true });

  if (rootVersion !== null) {
    await writeFile(paths.rootVersionPath, `${rootVersion}\n`);
  }

  await writeFile(paths.webVersionPath, `${webVersion}\n`);
  await writeFile(
    paths.packageJsonPath,
    `${JSON.stringify({ name: "web", version: packageVersion, private: true }, null, 2)}\n`,
  );
  await writeFile(paths.appVersionPath, appVersionFileContent(appVersion));
}

async function runSelfTest() {
  const tempRoot = await mkdtemp(join(tmpdir(), "sync-version-"));

  try {
    const syncPaths = createPaths(join(tempRoot, "sync", "web"));
    await writeFixture(syncPaths, { rootVersion: "0.1.1" });
    assert.equal(await syncVersion(syncPaths), "0.1.1");
    assert.equal(await checkVersion(syncPaths), "0.1.1");
    assert.equal((await readPackageJson(syncPaths)).version, "0.1.1");
    assert.equal(await readAppVersion(syncPaths), "0.1.1");

    const invalidPaths = createPaths(join(tempRoot, "invalid", "web"));
    await writeFixture(invalidPaths, { rootVersion: "0.1" });
    await assert.rejects(() => syncVersion(invalidPaths), /x\.y\.z/);
    await writeFile(invalidPaths.rootVersionPath, "0.1.1-beta.1\n");
    await assert.rejects(() => syncVersion(invalidPaths), /x\.y\.z/);

    const mismatchPaths = createPaths(join(tempRoot, "mismatch", "web"));
    await writeFixture(mismatchPaths, {
      appVersion: "0.1.1",
      packageVersion: "0.1.1",
      rootVersion: "0.1.2",
      webVersion: "0.1.1",
    });
    await assert.rejects(() => checkVersion(mismatchPaths), /一致していません/);

    const webRootPaths = createPaths(join(tempRoot, "web-root", "web"));
    await writeFixture(webRootPaths, {
      appVersion: "0.2.0",
      packageVersion: "0.2.0",
      rootVersion: null,
      webVersion: "0.2.0",
    });
    assert.equal(await checkVersion(webRootPaths), "0.2.0");
  } finally {
    await rm(tempRoot, { force: true, recursive: true });
  }
}

async function main() {
  const args = process.argv.slice(2);

  if (args.some((arg) => !["--check", "--self-test"].includes(arg))) {
    throw new Error(`未対応の引数です: ${args.join(" ")}`);
  }

  if (args.includes("--self-test")) {
    await runSelfTest();
    console.log("バージョン同期スクリプトの自己テストが成功しました。");
    return;
  }

  if (args.includes("--check")) {
    const version = await checkVersion();
    console.log(`バージョンは同期済みです: ${version}`);
    return;
  }

  const version = await syncVersion();
  await checkVersion();
  console.log(`バージョンを同期しました: ${version}`);
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  });
}
