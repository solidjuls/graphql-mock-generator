const basicTypes = [
  "String",
  "Int",
  "Float",
  "Boolean",
  "Date",
  "ID",
  "SlugOrID",
  "URL",
];

function randomDate(start, end) {
  return new Date(
    start.getTime() + Math.random() * (end.getTime() - start.getTime())
  );
}

const randomValue = (type) => {
  switch (type) {
    case "String":
      return "Sample text";
    case "Int":
      return Math.random(1, 100);
    case "Float":
      return Math.random() * (1.92 - 1.12);
    case "Boolean":
      return Math.random() < 0.5;
    case "Date":
      return randomDate(new Date(2020, 0, 1), new Date());
    case "ID":
    case "SlugOrID":
      return Math.random(10, 100).toString();
    case "URL":
      return "www.xing.com/companies/recommended";
    default:
      console.log("WARNING. Unknown type on randomValue", type);
      break;
  }
};

const removeLastChar = (line) => line.substring(0, line.length - 1);

const isArray = (type) => type.kind === "LIST";

const resolveTypeName = (type) => {
  // Some types have its name as null, then we look for its type on ofType property
  if (type.name !== null) return type.name;
  return type.ofType.name;
};

module.exports = {
  removeLastChar,
  basicTypes,
  randomDate,
  randomValue,
  isArray,
  resolveTypeName,
};
