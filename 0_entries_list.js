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

const entries_list_path = `./dismantlers/${current.dismantler}/temp/entries_list.xlsx`

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


function entries_purge(components) {

    let count = 0

    //loop 

    for (let i = 0; i < components.length; i++) {
        const component = components[i];

        let description = normalize(component['Descrizione']).replaceAll(".", "").replaceAll("  ", " ")

        if (description === null || description === undefined || description === '') {
            continue;
        }
        let brand = normalize(component['Marca']).replaceAll(".", "")
        let model = normalize(component['Modello']).replaceAll('.', '')

        //#region replace aliases
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

        //#endregion

        //console.log(description)

        //replace all ant post spaces
        description = description.replaceAll('anteriore', 'ant').replaceAll('posteriore', 'post')

        const description_tokens = description.split(' ').filter(Boolean)
        const brand_tokens = brand.split(' ').filter(Boolean)
        const model_tokens = model.split(' ').filter(Boolean)

        const brand_index = description_tokens.findIndex(token => brand_tokens.includes(token))
        if (brand_index !== -1) {
            count++

            const purged_description = description_tokens.slice(0, brand_index).join(' ').trim()
            const remains = description_tokens.slice(brand_index).join(' ').trim()

            component['Purged descr'] = purged_description
            component['Remains'] = remains || null
            continue
        }

        const model_index = description_tokens.findIndex(token => model_tokens.includes(token))
        if (model_index !== -1) {
            count++

            const purged_description = description_tokens.slice(0, model_index).join(' ').trim()
            const remains = description_tokens.slice(model_index).join(' ').trim()

            component['Purged descr'] = purged_description
            component['Remains'] = remains || null
            continue
        }


        component['Purged descr'] = description
        component['Remains'] = 'NO BRAND / MODEL FOUND'

        console.log('not found')
        console.log('original description: ', description)
        console.log('brand: ', brand)
        console.log('model: ', model)
    }

    console.log(count)

    return components
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



async function main() {

    const components = await excel_to_object(components_input_path)
    console.log(components.length)

    //purge entries from brand and model
    const purged_entries_components = entries_purge(components)

    await object_to_excel(components_purged_description_path, purged_entries_components)

    //purge entries from side
    const purged_with_side = side_extractor(purged_entries_components)

    await object_to_excel(components_purged_side_path, purged_with_side)

    //prduce entries list 
    const entries_list = entries_list_extractor(purged_with_side)

    await object_to_excel(entries_list_path, entries_list)

}

main()

function entries_list_extractor(components) {
    const entries = new Set();

    for (let i = 0; i < components.length; i++) {
        const component = components[i];
        const purgedDescr = component['Purged descr'];

        if (!purgedDescr || purgedDescr === null || purgedDescr === undefined || purgedDescr === '') {
            continue;
        }

        entries.add(purgedDescr.trim().replaceAll('  ', ''));
    }

    const entries_list = [...entries].map(entry => ({
        'Entry': entry,
        'ID ANIA': null
    }));

    entries_list.sort((a, b) => {
        const left = a['Entry'].toLowerCase();
        const right = b['Entry'].toLowerCase();
        return left.localeCompare(right, 'it', { sensitivity: 'base' });
    });

    return entries_list;
}
