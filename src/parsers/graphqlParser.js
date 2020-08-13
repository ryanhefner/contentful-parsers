import { fieldsParser } from './fieldsParser'

/**
 * Resolver to use when using graphqlParser output with graphql-anywhere.
 *
 * @param {string} fieldName
 * @param {object} rootValue
 */
export const contentfulResolver = (fieldName, rootValue) => {
  return rootValue.hasOwnProperty(fieldName) ? rootValue[fieldName] : null
};

/**
 * Parse Contentful Rest API response into a format that can be queried via
 * GraphQL.
 *
 * @param {string} operationName
 * @param {object} data
 * @param {object} props
 */
export function graphqlParser(operationName, data, props = { include: 10 }) {
  function parseEntry(object) {
    const objectClone = Object.assign({}, fieldsParser(object, props));

    // Parse all references and reference collections
    Object.keys(objectClone).forEach(key => {
      const field = objectClone[key]

      if (Array.isArray(field)) {
        // Convert reference array into GraphQL
        objectClone[`${key}Collection`] = parseCollection(field);

        // Delete old flat array field
        delete objectClone[key];
      } else if (typeof field === 'object' && field.hasOwnProperty('__typename')) {
        // Parse single entry references
        objectClone[key] = parseEntry(field)
      }
    })

    // Capitalize entry __typename
    if (objectClone.hasOwnProperty('__typename')) {
      objectClone.__typename = objectClone.__typename.substring(0, 1).toUpperCase() + objectClone.__typename.substring(1)
    }

    // Set sys __typename
    objectClone.sys = {
      ...object.sys,
      __typename: 'Sys',
    }

    // Clean-up sys properties applied to parsed entry via fieldsParser
    delete objectClone.id;
    delete objectClone.createdAt;
    delete objectClone.updatedAt;

    // Return GraphQL-ready object
    return objectClone;
  }

  // Structure entry collections object
  function parseCollection(items) {
    return {
      __typename: 'Array',
      items: items.map(item => parseEntry(item)),
    };
  }

  // Parse collection queries
  if (data.items) {
    return {
      [operationName]: parseCollection(data.items),
    }
  }

  // Parse single entry queries
  return { [operationName]: parseEntry(data) }
}
