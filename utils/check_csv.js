
const { log } = require("./logger");
const fs = require("fs");
const jschardet = require('jschardet');

async function check_characters(data) {
    const corrupted = [];

    for (let i = 0; i < data.length; i++) {
        const row = data[i];

        for (const [key, value] of Object.entries(row)) {
            if (value && typeof value === 'string' && (value.includes('�') || value.includes('\uFFFD') || value.includes(''))) {
                corrupted.push({ row: i, idArticolo: row['idArticolo'], field: key, value });
            }
        }
    }

    if (corrupted.length > 0) {
        log(`[Check] Found ${corrupted.length} corrupted fields`);
        corrupted.forEach(c => log(`  Row ${c.row} idArticolo: ${c.idArticolo}, col: ${c.field}, value: "${c.value}"`));
        process.exit(0)
    }

    return corrupted;
}

function check_encoding(filepath) {
    const buffer = fs.readFileSync(filepath);
    const detected = jschardet.detect(buffer);

    log(`[Encoding] ${filepath}: ${detected.encoding} (${(detected.confidence * 100).toFixed(0)}%)`);

    if (!detected.encoding.toUpperCase().includes('UTF') && !detected.encoding.toUpperCase().includes('ASCII')) {
        log(`[Encoding] ERROR: ${filepath} is ${detected.encoding}, convert to UTF-8!`);
        process.exit(1);
    }
}

module.exports = { check_characters, check_encoding };