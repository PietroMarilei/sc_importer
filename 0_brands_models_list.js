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

const components_purged_side_path = `./dismantlers/${current.dismantler}/temp/components_purged_side.xlsx`

//Temp 


//Output

const component_purged_side_version_id = `./dismantlers/${current.dismantler}/temp/components_purged_side_version_id.xlsx`

const ania_versions_path = `./dismantlers/${current.dismantler}/temp/ania_versions.json`

const ania_versions_excel_path = `./dismantlers/${current.dismantler}/temp/ania_versions.xlsx`

function brand_list(components) {

  const brand_output = []

  const ania_versions = JSON.parse(fs.readFileSync(ania_versions_path, "utf-8"));
  //loop 
  for (let i = 0; i < components.length; i++) {
    const component = components[i];

    const brand_input = component['Marca']

    //check if is an ANIA brand 
    const ania_brand = ania_versions.find(version => normalize(version.brand) === normalize(brand_input))

    if (brand_output.find(b => b["Marca"] === brand_input)) {
      continue;
    }

    if (ania_brand) {
      brand_output.push({
        "Marca": brand_input,
        "ANIA Brand": ania_brand.brand,
        "ANIA ID": ania_brand.brand_id
      })

      console.log(`Marca: ${brand_input} - ANIA Brand: ${ania_brand.brand} - ANIA ID: ${ania_brand.brand_id}`)
    } else {
      brand_output.push({
        "Marca": brand_input,
        "ANIA Brand": null,
        "ANIA ID": null
      })

      console.log(`NOT FOUND - Marca: ${brand_input} - ANIA Brand: null - ANIA ID: null`)
    }


  }

  //order alphabethically
  brand_output.sort((a, b) => {
    const left = a['Marca'].toLowerCase();
    const right = b['Marca'].toLowerCase();
    return left.localeCompare(right, 'it', { sensitivity: 'base' });
  });

  return brand_output
}

function models_list(components) {

  const models_output = []

  const ania_versions = JSON.parse(fs.readFileSync(ania_versions_path, "utf-8"));
  //loop 
  for (let i = 0; i < components.length; i++) {
    const component = components[i];

    const model_input = component['Modello']

    const brand_input = component['Marca']

    //check if is an ANIA brand 
    const ania_model = ania_versions.find(version => normalize(version.brand) === normalize(model_input) && normalize(version.brand) === normalize(brand_input))

    if (models_output.find(b => b["Modello"] === model_input)) {
      continue;
    }

    if (ania_model) {
      models_output.push({
        "Modello": model_input,
        "ANIA Model": ania_model.model,
        "ANIA ID": ania_model.model_id
      })

      console.log(`Modello: ${model_input} - ANIA Model: ${ania_model.model} - ANIA ID: ${ania_model.model_id}`)
    } else {
      models_output.push({
        "Modello": model_input,
        "ANIA Model": null,
        "ANIA ID": null
      })

      // console.log(`NOT FOUND - Modello: ${model_input} - ANIA Model: null - ANIA ID: null`)
    }


  }
  return models_output
}

// #region Fetches
async function fetch_ania_versions() {
  const ania_versions = await axios({
    url: `${current.endpoint}/graphql`,
    method: "post",
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer " + config.token,
    },
    data: {
      query: `
          query {
            versions (version_type: "ania_version") {
              count
              versions {
                version_id
                model {
                  model_id
                  model {
                    __typename
                    ... on AniaModelType {
                      ania_model
                      ania_id
                    }
                  }
                  brand {
                    brand_id
                    brand {
                      __typename
                      ... on AniaBrandType {
                        ania_brand
                        ania_id
                      }
                    }
                    type {
                      type_id
                      type {
                          __typename
                          ... on AniaTypeType {
                              ania_type
                              ania_id
                          }
                        
                      }
                  }
                  }
                }
                version {
                  __typename
                  ... on AniaVersionType {
                    ania_version
                    ania_id
                    produced_from
                    produced_to
                  }
                }
              }
            }
          }
        `,
    },
  });

  if (
    !ania_versions ||
    ania_versions.data.data.versions.versions.length <= 0 ||
    ania_versions.data.errors
  ) {
    log(
      "No ANIA versions found. Did you set the token ?",
      ania_versions.data.errors
    );
    return;
  }

  const data = [];
  for (let i = 0; i < ania_versions.data.data.versions.versions.length; i++) {
    const version = ania_versions.data.data.versions.versions[i];

    data.push({
      type: version.model.brand.type.type.ania_type,
      brand: version.model.brand.brand.ania_brand,
      model: version.model.model.ania_model,
      version: version.version.ania_version,
      produced_from: version.version.produced_from,
      produced_to: version.version.produced_to,
      type_id: version.model.brand.type.type_id,
      type_ania_id: version.model.brand.type.type.ania_id,

      brand_id: version.model.brand.brand_id,
      brand_ania_id: version.model.brand.brand.ania_id,

      model_id: version.model.model_id,
      model_ania_id: version.model.model.ania_id,

      version_id: version.version_id,
      version_ania_id: version.version.ania_id,
    });
  }

  fs.writeFileSync(ania_versions_path, JSON.stringify(data, null, 2), "utf-8");
}

async function main() {
  //await fetch_ania_versions()
  // const components = await excel_to_object(components_purged_side_path)
  // console.log(components.length)

  // //loop
  // for (let i = 0; i < components.length; i++) {
  //   const component = components[i];
  //   component['version_id'] = null

  // }


  //export ania_versions in excel

  //read json

  const ania_versions = JSON.parse(fs.readFileSync(ania_versions_path, "utf-8"))

  //remove object key

  //loop
  for (let i = 0; i < ania_versions.length; i++) {
    const version = ania_versions[i];

    //remove key
    delete version.type_id
    delete version.type_ania_id
    delete version.brand_id
    delete version.brand_ania_id
    delete version.model_id
    delete version.model_ania_id
    delete version.version_ania_id




  }

  await object_to_excel(ania_versions_excel_path, ania_versions)


  //-------------------

  // await object_to_excel(component_purged_side_version_id, components)

  // // list brands
  // const brand_list_data = brand_list(components)

  // if (brand_list_data.length > 0 || brand_list_data) {
  //   await object_to_excel(`./dismantlers/${current.dismantler}/temp/brand_list.xlsx`, brand_list_data)
  // }

  // //list models
  // const models_list_data = models_list(components)

  // if (models_list_data.length > 0 || models_list_data) {
  //   await object_to_excel(`./dismantlers/${current.dismantler}/temp/models_list.xlsx`, models_list_data)
  // }




}

main()