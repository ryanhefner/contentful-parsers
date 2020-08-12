import fieldsParser from './fieldsParser'

export default function graphqlParser(operationName, data, props = { include: 10 }) {
  function parseEntry(object) {
    const objectClone = Object.assign({}, fieldsParser(object, props));

    // Set sys __typename
    objectClone.sys = {
      ...object.sys,
      '__typename': 'Sys',
    }

    // Clean-up sys properties applied to parsed entry via fieldsParser
    delete objectClone.id;
    delete objectClone.createdAt;
    delete objectClone.updatedAt;

    // Return GraphQL-ready object
    return objectClone;
  }

  if (data.items) {
    return {
      [operationName]: {
        '__typename': 'Array',
        items: data.items.map(item => parseEntry(item)),
      }
    }
  }

  return { [operationName]: parseEntry(data) }
}
