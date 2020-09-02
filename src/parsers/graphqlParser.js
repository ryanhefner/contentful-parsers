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
 * @return {object}
 */
export function graphqlParser(rootField, data, definitionMap, props = { include: 10 }) {
  /**
   * Clean the cloned object and map back refernces that were stripped via fieldsParser.
   *
   * @param {object} clone -
   * @param {object} ref -
   * @return {object}
   */
  function cleanClone(clone, ref) {
    if (!clone) return clone

    // Capitalize entry __typename
    if (clone.hasOwnProperty('__typename') && clone.__typename) {
      clone.__typename = clone.__typename.substring(0, 1).toUpperCase() + clone.__typename.substring(1)
    }

    // Set sys __typename
    if (ref && ref.sys) {
      clone.sys = {
        ...ref.sys,
        __typename: 'Sys',
      }
    } else if (ref.id) {
      clone.sys = {
        id: ref.id,
        __typename: 'Sys'
      }
    }

    // Clean-up sys properties applied to parsed entry via fieldsParser
    if (clone.id) {
      delete clone.id
    }

    if (clone.createdAt) {
      delete clone.createdAt
    }

    if (clone.updatedAt) {
      delete clone.updatedAt
    }

    return clone
  }

  /**
   * Apply definitions defined in query to confirm that the resulting object
   * adheres to the shape expected by the query.
   *
   * @param {object} target -
   * @param {object} definitionMap -
   * @return {object}
   */
  function applyDefinitions(target, definitionMap) {
    if (!target || !definitionMap) return target

    const targetClone = Object.assign({}, target)

    Object.keys(definitionMap).forEach(definition => {
      if (!targetClone.hasOwnProperty(definition)) {
        if (definition.endsWith('Collection') && definitionMap[definition].items) {
          targetClone[definition] = parseCollection([], definitionMap[definition])
        } else if (definition.startsWith('...')) {
          targetClone[definition] = applyDefinitions({}, definitionMap[definition])
        } else {
          targetClone[definition] = definitionMap[definition]
        }
      }
    })

    return targetClone
  }

  /**
   * Structure Contentful Asset instance into the shape supported via GraphQL.
   *
   * @param {object} object -
   * @return {object}
   */
  function parseAsset(object) {
    const clone = Object.assign({}, object)

    clone.__typename = 'Asset'
    clone.url = clone?.file?.url
    clone.contentType = clone?.file?.contentType
    clone.size = clone?.file?.details?.size
    clone.width = clone?.file?.details?.image?.width || clone?.file?.details?.video?.width
    clone.height = clone?.file?.details?.image?.height || clone?.file?.details?.video?.height
    clone.fileName = clone?.file?.fileName

    delete clone.file

    return clone
  }

  /**
   * Parse a Contentful Entry instance
   *
   * @param {object} object -
   * @param {object} definitionMap -
   * @param {number} depth -
   * @return {object}
   */
  function parseEntry(object, definitionMap, depth = 0) {
    if (!object) return null

    if (depth >= props.include) {
      return object
    }

    const objectClone = Object.assign(
      {},
      object.hasOwnProperty('sys') && object.hasOwnProperty('fields')
        ? fieldsParser(object, props, { parseArrays: false, parseRefs: false })
        : object
    );

    // Parse all references and reference collections
    Object.keys(objectClone).forEach(key => {
      const field = objectClone[key]

      if (Array.isArray(field)) {
        let referenceArray = false

        field.forEach(item => {
          if (
            (item.hasOwnProperty('sys') && item.hasOwnProperty('fields')) ||
            item.hasOwnProperty('__typename')
          ) {
            referenceArray = true
          }
        })

        if (referenceArray) {
          // Convert reference array into GraphQL
          const collectionKey = `${key}Collection`
          objectClone[collectionKey] = parseCollection(field, definitionMap?.[collectionKey], depth + 1);

          // Delete old flat array field
          delete objectClone[key];
        } else {
          objectClone[key] = field.map((item, index) => cleanClone(item, object.fields[key][index]))
        }
      } else if (
        typeof field === 'object' &&
        (
          field.hasOwnProperty('__typename')
          || (field.hasOwnProperty('sys') && field.hasOwnProperty('fields'))
        )
      ) {
        // Parse single entry references
        objectClone[key] = parseEntry(field, definitionMap?.[key], depth + 1)
      } else {
        objectClone[key] = field
      }
    })

    // Clean fields applied by fieldsParser and map sys object to item
    const cleanedClone = cleanClone(objectClone, object)

    const assetClone = cleanedClone?.sys?.type === 'Asset'
      ? parseAsset(cleanedClone)
      : cleanedClone

    // Make sure all queried fields are available on the response, even if not included in the Rest response
    const definedClone = applyDefinitions(assetClone, definitionMap)

    // Return GraphQL-ready object
    return definedClone;
  }

  /**
   * Parse a Contentful Entry collection
   *
   * @param {array} items -
   * @param {object} definitionMap -
   * @param {number} depth -
   * @return {object}
   */
  function parseCollection(items = [], definitionMap, depth = 0) {
    // @todo Add `skip` to response object - Ryan
    // @todo Add `limit` to resposne object - Ryan
    return {
      __typename: 'Array',
      total: (items || []).length,
      items: (items || []).map(
          item => parseEntry(item, definitionMap?.items, depth)
        )
        .filter(item => !!item),
    };
  }

  // Parse collection queries
  if (data?.items) {
    return {
      [rootField]: parseCollection(data.items, definitionMap?.[rootField]),
    }
  }

  // Parse single entry queries
  return { [rootField]: parseEntry(data, definitionMap?.[rootField]) }
}
