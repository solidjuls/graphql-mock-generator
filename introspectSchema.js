const {
  basicTypes,
  randomValue,
  resolveTypeName,
  isArray,
} = require("./utils");
const fetch = require("node-fetch");

const APOLLO_PORT = 4000;

const getQuery = (field) => `
  query IntrospectionQuery {
    __type(name: "${field}") {
      name
      fields {
        name
        __typename
        type {
          name
          kind
          ofType {
            name
          }
        }
      }
    }
  }
`;
const introspectionArrays = {};

const introspect = async (field) => {
  const response = await fetch(`http://localhost:${APOLLO_PORT}/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query: getQuery(field) }),
  });
  const data = await response.json();
  const fields = data.data.__type.fields;

  return fields;
};

const introspectTypes = async (queryObject, type) => {
  try {
    const fields = await introspect(type);

    if (fields === null) return;

    introspectionArrays[type] = fields;

    for (const key of Object.keys(queryObject)) {
      const item = fields.find((item) => {
        if (item.name === key) return true;
        return false;
      });

      if (!basicTypes.includes(resolveTypeName(item.type))) {
        const typeName = resolveTypeName(item.type);
        await introspectTypes(queryObject[key], typeName);
      }
    }
  } catch (err) {
    console.log("introspectTypes error", err);
  }
};

const findValueTypes = (queryObject, type) => {
  Object.keys(queryObject).forEach((key) => {
    const item = introspectionArrays[type].find((item) => {
      if (item.name === key) return true;
      return false;
    });

    if (basicTypes.includes(resolveTypeName(item.type))) {
      // if the type is basic, finish recursion.
      queryObject[key] = randomValue(resolveTypeName(item.type));
      return queryObject;
    } else {
      if (isArray(item.type)) {
        //  If the type is an array on the schema, we must change its structure
        queryObject[key] = [queryObject[key]];
        queryObject[key].forEach((node) => {
          const typeName = resolveTypeName(item.type);
          findValueTypes(node, typeName);
        });
      } else {
        const typeName = resolveTypeName(item.type);
        findValueTypes(queryObject[key], typeName);
      }
    }
  });
  return queryObject;
};

module.exports = {
  findValueTypes,
  introspectTypes,
};
