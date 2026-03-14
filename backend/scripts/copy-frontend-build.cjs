const fs = require("fs")
const fsp = require("fs/promises")
const path = require("path")

const sourceDir = path.resolve(__dirname, "../../frontend/dist")
const targetDir = path.resolve(__dirname, "../public/app")

async function copyFrontendBuild() {
  if (!fs.existsSync(sourceDir)) {
    throw new Error(`No se encontró el build del frontend en ${sourceDir}`)
  }

  await fsp.rm(targetDir, { recursive: true, force: true })
  await fsp.mkdir(targetDir, { recursive: true })
  await fsp.cp(sourceDir, targetDir, { recursive: true })
}

copyFrontendBuild().catch((err) => {
  console.error(err)
  process.exit(1)
})
