const fs = require("fs");
const path = require("path");

// Config
const current = JSON.parse(
  fs.readFileSync(path.join(__dirname, "../current.json"), "utf-8")
);
const config = JSON.parse(
  fs.readFileSync(
    path.join(__dirname, `../dismantlers/${current.dismantler}/config.json`),
    "utf-8"
  )
);

// File
const report_path = `./dismantlers/${current.dismantler}/report.txt`;

// Get the current dismantler info from .current_dismantler.json
const getCurrentDismantlerInfo = () => {
  try {
    const currentDismantlerPath = path.join(
      __dirname,
      "..",
      ".current_dismantler.json"
    );
    if (fs.existsSync(currentDismantlerPath)) {
      return JSON.parse(fs.readFileSync(currentDismantlerPath, "utf-8"));
    }
  } catch (error) {
    console.error(`Error reading current dismantler info: ${error.message}`);
  }
  return null;
};

// Get the path to the report file
const getReportFilePath = () => {
  const dismantlerInfo = getCurrentDismantlerInfo();
  if (dismantlerInfo && dismantlerInfo.attemptPath) {
    return path.join(dismantlerInfo.attemptPath, "report_log.txt");
  }
  // Fallback to the old location if no current dismantler info is available
  return path.join(__dirname, "../temp_files/report.txt");
};

// Ensure directory exists
const ensureDirectoryExists = (filePath) => {
  const dirPath = path.dirname(filePath);
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
};

// Get the script name from which the logger is called
const getCallerScriptName = () => {
  const err = new Error();
  const stack = err.stack.split("\n");
  // Look for the first file path in the stack that isn't this file
  for (let i = 1; i < stack.length; i++) {
    const match = stack[i].match(/\(([^:]+):/);
    if (match && !match[1].includes("logger.js")) {
      return path.basename(match[1]);
    }
  }
  return "unknown_script";
};

// Last script that was logged
let lastScript = null;

const log = (message, additionalInfo = "") => {
  // Always log to console
  console.log(message);
  if (additionalInfo !== undefined && additionalInfo !== "")
    console.log(additionalInfo);

  // Prepare for file logging
  ensureDirectoryExists(report_path);

  // Get current script name
  const currentScript = getCallerScriptName();

  // Add date and separator if this is a new script
  if (currentScript !== lastScript) {
    const separator = "----------------------------------------";
    const dateTime = new Date().toISOString();
    const headerMessage = `\n${separator}\n[${dateTime}] Script: ${currentScript}\n${separator}\n`;

    fs.appendFileSync(report_path, headerMessage, "utf8");
    lastScript = currentScript;
  }

  // Write the actual message
  const logMessage =
    additionalInfo !== undefined && additionalInfo !== ""
      ? `${message}\n${additionalInfo}\n`
      : `${message}\n`;
  fs.appendFileSync(report_path, logMessage, "utf8");
};

module.exports = { log };
