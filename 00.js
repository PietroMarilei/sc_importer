const fs = require("fs");
const path = require("path");
const { csvToObj } = require('csv-to-js-parser');

// Axios
const axios = require("axios");

// Logger
const { log } = require("./utils/logger");

//Excel 
const { excel_to_object, object_to_excel } = require("./utils/excel");
const { check_characters } = require("./utils/check_csv");
const { ask_terminal } = require('./utils/ask_terminal');


// Config
const current = JSON.parse(
    fs.readFileSync(path.join(__dirname, "current.json"), "utf-8")
);
const config = JSON.parse(
    fs.readFileSync(
        path.join(__dirname, `/dismantlers/${current.dismantler}/config.json`),
        "utf-8"
    )
);
