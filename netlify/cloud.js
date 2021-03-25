const path = require("path");
const Eleventy = require("@11ty/eleventy");
const debug = require("debug");

const PROJECT_DIR = "/var/task/src/netlify/functions/cloud/";
const INPUT_DIR = "./src/";
const INPUT_PATH = "./src/sample-nunjucks.njk";

process.env.ELEVENTY_CLOUD = true;
process.env.ELEVENTY_EXPERIMENTAL = true;

async function getEleventyOutput(inputPath) {
  debug.enable("Eleventy*");

  let elev = new Eleventy(inputPath);
  elev.setInputDir(INPUT_DIR);
  await elev.init();

  let json = await elev.toJSON();
  if(!json.length) {
    throw new Error("Couldn’t find any generated output from Eleventy.");
  }

  for(let entry of json) {
    if(entry.inputPath === inputPath) {
      console.log( "Content found", inputPath );
      return entry.content;
    }
  }

  console.log( json );
  throw new Error(`Couldn’t find any matching output from Eleventy for ${inputPath}`);
}

exports.handler = async (event, context) => {
  let { slug } = event.queryStringParameters;

  try {
    process.chdir(PROJECT_DIR);

    console.log( "Cwd: ", process.cwd() );
    console.log( "Project Dir: ", PROJECT_DIR );
    console.log( "Input Dir: ", INPUT_DIR);
    console.log( "Path: ", INPUT_PATH );

    if(!path.resolve(PROJECT_DIR, INPUT_PATH).startsWith(PROJECT_DIR)) {
      throw new Error(`Invalid file path: ${INPUT_PATH}`);
    }

    return {
      statusCode: 200,
      headers: {
        "content-type": "text/html; charset=UTF-8"
      },
      body: await getEleventyOutput(inputPath),
      isBase64Encoded: false
    }
  } catch (error) {
    console.log("Error", error);

    return {
      statusCode: 500,
      body: JSON.stringify({
        error: error.message
      })
    }
  }
}

// For local testing
// (async function() {
//   // let content = await getEleventyOutput("./src/sample-vue.vue");
//   let content = await getEleventyOutput("./src/sample-nunjucks.njk");
//   console.log( content );
// })();
