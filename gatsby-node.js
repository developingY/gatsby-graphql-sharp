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
  console.time("success sharp nodes created ");

  const fields = configOptions.image_url_fields;
  const sharp_suffix = configOptions.suffix || "_sharp";
  const is_debug_mode = configOptions.debug_mode || false;

  if (is_debug_mode) {
    console.log("************ gatsby-graphql-sharp debug mode **************");
  }

  const resolvers = store
    .getState()
    .schemaCustomization.thirdPartySchemas.reduce((resolvers, schema) => {
      if (is_debug_mode) {
        console.log("third party schema TypeNames =", schema._typeMap);
      }
      for (const field of fields) {
        const fieldPath = field.split(".");
        let parentType;

        try {
          parentType = tryGetParentFieldTypeName(
            fieldPath[0],
            fieldPath.slice(1),
            schema._typeMap,
            is_debug_mode
          );
        } catch (e) {
          console.error(e);
        }

        if (parentType == undefined) {
          throw new Error(
            "The path is not correct, please check the error or turn on debug_mode for more detials."
          );
        }

        const image_url_fields = fieldPath.slice(-1);
        resolvers[parentType] = Object.assign(resolvers[parentType] || {}, {
          [`${image_url_fields}${sharp_suffix}`]: {
            type: "File",
            resolve(source) {
              const url = source[image_url_fields];
              if (!url) {
                console.log(
                  `Warn: The image url of ${image_url_fields} you entered does not exist.`
                );
                return null;
              }
              return createRemoteFileNode({
                url,
                store,
                cache,
                createNode,
                createNodeId,
                reporter,
              });
            },
          },
        });
      }
      return resolvers;
    }, {});

  if (is_debug_mode) {
    console.log(
      "image sharp node resolvers to be created: ",
      JSON.stringify(resolvers, null, 4)
    );
  }

  createResolvers(resolvers);
  console.timeEnd("success sharp nodes created ");
};

function tryGetParentFieldTypeName(
  rootTypeName,
  fieldPath,
  schema,
  is_debug_mode
) {
  if (!schema[rootTypeName]) {
    throw `Cannot find TypeName "${rootTypeName}".`;
  }

  const typeEntry = schema[rootTypeName];
  const typeFields =
    (typeEntry && typeEntry.getFields && typeEntry.getFields()) || {};

  if (is_debug_mode) {
    console.log(
      `Current rootTypeName is "${rootTypeName}", will search TypeField named "${fieldPath[0]}".`
    );
  }

  if (typeFields[fieldPath[0]] === undefined) {
    throw `The filed "${
      fieldPath[0]
    }" under TypeName "${typeEntry}" doesn't exist. \nTypeFileds under TypeName "${typeEntry}" are : ${JSON.stringify(
      Object.keys(typeFields),
      null,
      4
    )}.`;
  }

  if (fieldPath.length === 1) {
    return rootTypeName;
  }

  const fieldTypeName = extractFieldType(typeFields[fieldPath[0]].type);

  if (is_debug_mode) {
    console.log(`TypeName : ${fieldTypeName}`);
  }

  return tryGetParentFieldTypeName(
    fieldTypeName,
    fieldPath.slice(1),
    schema,
    is_debug_mode
  );
}

function extractFieldType(rawTypeName) {
  const typeName = rawTypeName + "";
  if (typeName.startsWith("[")) {
    return typeName.substring(1).split(/[!\]\?]/)[0];
  }
  return typeName;
}
