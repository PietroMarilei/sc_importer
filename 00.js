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

const components_purged_description_path = `./dismantlers/${current.dismantler}/temp/components_purged_description.xlsx`

const components_purged_side_path = `./dismantlers/${current.dismantler}/temp/components_purged_side.xlsx`

//Output

const brand_aliases = [
    {
        target: 'vm',
        replacement: 'volkswagen'
    },
    {
        target: 'vw',
        replacement: 'volkswagen'
    }
]

const model_aliases = [
    {
        target: 'punto_evo',
        replacement: 'punto evo'
    },
    {
        target: 'fortwo',
        replacement: 'for two'
    }
]

const findMatchToken = (text, value) => {
    if (!value) {
        return null;
    }
    if (text.includes(value)) {
        return value;
    }
    //split words (exclude nils)
    const tokens = value.split(' ').filter(Boolean);
    //seek the word
    for (const token of tokens) {
        if (text.includes(token)) {
            return token;
        }
    }
    return null;
}

function side_extractor(components) {
    //loop
    for (let i = 0; i < components.length; i++) {
        const component = components[i];

        let purged_descr = normalize(component['Purged descr']).replaceAll(".", "")

        if (purged_descr === null || purged_descr === undefined || purged_descr === '') {
            continue;
        }

        component['Side'] = null

        if ((purged_descr.includes('dx') && purged_descr.includes('sx')) || (purged_descr.includes('destr') && purged_descr.includes('sinistr'))) {
            continue
        }

        if (purged_descr.includes('dx') || purged_descr.includes('destr') || purged_descr.includes('destra') || purged_descr.includes('destro')) {
            component['Side'] = 'destro'
            //remove dx sx from purged_descr
            component['Purged descr'] = purged_descr.replaceAll('dx', '').replaceAll('destra', '').replaceAll('destro', '')
            continue
        }

        if (purged_descr.includes('sx') || purged_descr.includes('sinistr') || purged_descr.includes('sinistro') || purged_descr.includes('sinistra')) {
            component['Side'] = 'sinistro'
            //remove dx sx from purged_descr
            component['Purged descr'] = purged_descr.replaceAll('sx', '').replaceAll('sinistro', '').replaceAll('sinistra', '')
            continue
        }

    }

    return components

}

function entries_purge(components) {

    let count = 0

    //loop 

    for (let i = 0; i < components.length; i++) {
        const component = components[i];

        let description = normalize(component['Descrizione']).replaceAll(".", "")

        if (description === null || description === undefined || description === '') {
            continue;
        }
        let brand = normalize(component['Marca']).replaceAll(".", "")
        let model = normalize(component['Modello']).replaceAll('.', '')

        //replace aliases
        brand_aliases.forEach(alias => {
            if (description.includes(alias.target)) {
                description = description.replaceAll(alias.target, alias.replacement)
            }
        })

        model_aliases.forEach(alias => {
            if (description.includes(alias.target)) {
                description = description.replaceAll(alias.target, alias.replacement)
            }
        })

        //console.log(description)


        const brandToken = findMatchToken(description, brand);
        if (brandToken) {
            // console.log(description, brand, model)
            count++
            //split description from brand to the end 
            const brandIndex = description.indexOf(brandToken)
            const purged_description = description.slice(0, brandIndex)
            const remains = description.slice(brandIndex)
            // console.log(brand)
            // console.log('description: ', description)
            // console.log(purged_description, ' | ', remains)

            component['Purged descr'] = purged_description
            component['Remains'] = remains
            continue
        }

        const modelToken = findMatchToken(description, model);
        if (modelToken) {
            // console.log(description, model, model)
            count++

            //split description from model to the end 
            const modelIndex = description.indexOf(modelToken)
            const purged_description = description.slice(0, modelIndex)
            const remains = description.slice(modelIndex)

            component['Purged descr'] = purged_description
            component['Remains'] = remains
            continue
        }


        component['Purged descr'] = description
        component['Remains'] = 'NO BRAND / MODEL FOUND'

        // console.log('not found')
        // console.log('original description: ', description)
        // console.log('brand: ', brand)
        // console.log('model: ', model)
    }

    console.log(count)

    return components
}

async function main() {

    const components = await excel_to_object(components_input_path)
    console.log(components.length)

    const purged_entries_components = entries_purge(components)

    await object_to_excel(components_purged_description_path, purged_entries_components)

    const purged_with_side = side_extractor(purged_entries_components)

    await object_to_excel(components_purged_side_path, purged_with_side)


}

main()
