const { makeExecutableSchema } = require("@graphql-tools/schema");
const { ApolloServer } = require("apollo-server");
const fs = require("fs");
const util = require("util");

const readFileAsync = util.promisify(fs.readFile);

const startServer = async (port = 4000, schemaFile = "./schema.graphql") => {
  let contentFile;
  try {
    contentFile = await readFileAsync(schemaFile, "utf8");
  } catch (e) {
    console.log("Error opening the schema file at ", schemaFile, e);
  }

  if (!contentFile) return;

  const schema = makeExecutableSchema({
    typeDefs: contentFile,
  });

  const server = new ApolloServer({
    schema: schema,
    introspection: true,
  });

  return await server.listen({ port });
};

module.exports = { startServer };
