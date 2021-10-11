const readline = require('readline');
var path = require('path');
const fs = require('fs');
const { startServer } = require('./apollo-server');
const { introspectTypes, findValueTypes } = require('./introspectSchema');
const { removeLastChar } = require('./utils');

const isQuery = (line) => line.includes('query ');
const isMutation = (line) => line.includes('mutation ');

const parseQueryIntoObject = (line, outputString) => {
  if (isQuery(line) || isMutation(line)) {
    outputString += '{';
    return outputString;
  }

  let nameProperty = '';

  if (line.includes('(')) {
    nameProperty += '"' + line.substring(0, line.indexOf('(')).trim() + '":{';
  } else if (line.includes('{')) {
    // we must check if this is an array or an object
    // This symbol indicate a type
    nameProperty += '"' + line.substring(0, line.indexOf('{')).trim() + '":{';
  } else if (line.includes('}')) {
    //before adding }, we must remove ,
    if (outputString.endsWith(',')) {
      outputString = removeLastChar(outputString);
    }
    outputString += '},';
  } else {
    // We must check the type on thee schema and generate  random value accordingly
    outputString += '"' + line.trim() + '": "value",';
  }

  outputString += nameProperty;
  return outputString;
};
const SCHEMA_PATH = './schema.graphql';
const APOLLO_PORT = 4000;
async function main(filePaths) {
  let server;
  try {
    if (!fs.existsSync(SCHEMA_PATH)) {
      console.log(`Schema file was not found at ${SCHEMA_PATH}.`);
      process.exit(1);
    }

    server = await startServer(APOLLO_PORT, SCHEMA_PATH);
    console.log(`Server ready at ${server.url}.`);
  } catch (e) {
    console.log(`Error starting server at port ${APOLLO_PORT}`);
  }

  let lineReader = [];
  let outputString = [];
  let queryType = [];
  for (const path in filePaths) {
    console.log(`Opening file ${filePaths[path]}...`);
    lineReader[path] = readline.createInterface({
      input: fs.createReadStream(filePaths[path]),
    });
    outputString[path] = '';
    lineReader[path]
      .on('line', function (line) {
        if (isQuery(line)) queryType[path] = 'Query';
        if (isMutation(line)) queryType[path] = 'Mutation';
        outputString[path] = parseQueryIntoObject(line, outputString[path]);
      })
      .on('close', async function () {
        console.log(
          `File ${filePaths[path]} parsed. Starting introspection...`,
        );
        if (outputString[path].endsWith(',')) {
          outputString[path] = removeLastChar(outputString[path]);
        }
        const queryObject = JSON.parse(outputString[path]);

        await introspectTypes(queryObject, queryType[path]);
        console.log(`${filePaths[path]} Generating random values...`);
        result = findValueTypes(queryObject, queryType[path]);
        fs.writeFile(`result${path}.json`, JSON.stringify(result), (err) => {
          if (err) console.log(`ERROR - result${path}.json`, err);
          console.log(`Succesfully created file result${path}.json`);
        });
        console.log(`Mock for ${filePaths[path]} finished...`);
      });
  }

  // process.exit(1);
}

const blacklist = ['node_modules', 'schema.graphql'];
function fromDir(startPath, filter, callback) {
  //console.log('Starting from dir '+startPath+'/');

  if (!fs.existsSync(startPath)) {
    console.log('no dir ', startPath);
    return;
  }

  var files = fs.readdirSync(startPath);
  for (var i = 0; i < files.length; i++) {
    var filename = path.join(startPath, files[i]);
    var stat = fs.lstatSync(filename);
    if (stat.isDirectory() && !blacklist.includes(path.basename(filename))) {
      fromDir(filename, filter, callback); //recurse
    } else if (filter.test(filename)) {
      if (!blacklist.includes(path.basename(filename))) callback(filename);
    }
  }
}

async function cli() {
  let filenames = [];
  fromDir(process.cwd(), /(\.|\/)(graphql|gql)$/i, (filename) =>
    filenames.push(filename),
  );
  console.log(filenames);

  if (filenames.length > 0) {
    await main(filenames);
  }
}

cli();
