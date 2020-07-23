const { createRemoteFileNode } = require(`gatsby-source-filesystem`);

exports.createResolvers = (
  {
    actions: { createNode },
    cache,
    createNodeId,
    createResolvers,
    store,
    reporter,
  },
  configOptions
) => {
  const fields = configOptions.imageUrlFields;
  const sharp_suffix = configOptions.suffix || "_sharp";

  const resolvers = store
    .getState()
    .schemaCustomization.thirdPartySchemas.reduce((resolvers, schema) => {
      for (const field of fields) {
        const fieldPath = field.split(".");
        const parentType = tryGetParentFieldTypeName(
          fieldPath[0],
          fieldPath.slice(1),
          schema._typeMap
        );

        if (parentType !== undefined) {
          const imageUrlField = fieldPath.slice(-1);
          resolvers[parentType] = Object.assign(resolvers[parentType] || {}, {
            [`${imageUrlField}${sharp_suffix}`]: {
              type: "File",
              resolve(source) {
                const url = source[imageUrlField];
                if (url) {
                  return createRemoteFileNode({
                    url,
                    store,
                    cache,
                    createNode,
                    createNodeId,
                    reporter,
                  });
                }
                return null;
              },
            },
          });
        }
      }
      return resolvers;
    }, {});

  console.log("image resolvers to be created: ", resolvers);
  createResolvers(resolvers);
};

function tryGetParentFieldTypeName(rootTypeName, fieldPath, schema) {
  if (fieldPath.length === 1) {
    return rootTypeName;
  }

  const typeEntry = schema[rootTypeName];
  const typeFields =
    (typeEntry && typeEntry.getFields && typeEntry.getFields()) || {};

  if (typeFields[fieldPath[0]] === undefined) {
    return;
  }

  const fieldTypeName = extractFieldType(typeFields[fieldPath[0]].type);
  return tryGetParentFieldTypeName(fieldTypeName, fieldPath.slice(1), schema);
}

function extractFieldType(rawTypeName) {
  const typeName = rawTypeName + "";
  if (typeName.startsWith("[")) {
    return typeName.substring(1).split(/[!\]\?]/)[0];
  }
  return typeName;
}
