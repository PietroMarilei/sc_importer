const fs = require("fs");
const path = require("path");

// Axios
const axios = require("axios");

// Logger
const { log } = require("./utils/logger");

//Excel 
const { excel_to_object, object_to_excel } = require("./utils/excel");
const { ask_terminal } = require('./utils/ask_terminal');
const { normalize } = require('./utils/normalize')

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

//Input
const components_input_path = `./dismantlers/${current.dismantler}/input/components.xlsx`

//Temp 

//Output

const brand_aliases = [
    {
        target: 'vm',
        replacement: 'volkswagen'
    }
]

const model_aliases = [
    {
        target: 'punto_evo',
        replacement: 'punto evo'
    }
]

function split_description(components) {

    let count = 0
    //loop 

    for (let i = 0; i < components.length; i++) {
        const component = components[i];

        const description = normalize(component['Descrizione']).replaceAll(".", "")

        if (description === null || description === undefined || description === '') {
            continue;
        }

        let brand = normalize(component['Marca']).replaceAll(".", "")
        //use alisases
        if (brand_aliases.find(alias => alias.replacement === brand)) {
            brand = brand_aliases.find(alias => alias.replacement === brand).target
        }

        const model = normalize(component['Modello']).replaceAll('.', '')

        if (description.includes(brand) && description.includes(model)) {
            // console.log(description, brand, model)
            count++
            continue
        }

        if (!description.includes(brand) && description.includes(model)) {
            count++
            continue
        }

        if (!description.includes(model) && description.includes(brand)) {
            count++
            continue
        }

        console.log(description, ' | ', brand, model)




    }

    console.log(count)


}

async function main() {

    const components = await excel_to_object(components_input_path)
    console.log(components.length)

    split_description(components)
}

main()
