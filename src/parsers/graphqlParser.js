import { fieldsParser } from './fieldsParser'

const capitalizeFirstLetter = (string) => {
  return string.substring(0, 1).toUpperCase() + string.substring(1)
}

/**
 * Resolver to use when using graphqlParser output with graphql-anywhere.
 *
 * @param {string} fieldName
 * @param {object} rootValue
 */
export const contentfulResolver = (fieldName, rootValue) => {
  return rootValue && rootValue.hasOwnProperty(fieldName) ? rootValue[fieldName] : null
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
export function graphqlParser(rootKey, data, definitionMap, props = { include: 10 }) {
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
      clone.__typename = capitalizeFirstLetter(clone.__typename)
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
  function applyDefinitions(target, typename, definitionMap) {
    if (!target || !definitionMap) return target

    let targetClone = Object.assign({}, (target || {}))

    Object.keys(definitionMap).forEach(definition => {
      if (!targetClone.hasOwnProperty(definition)) {
        if (definition.endsWith('Collection')) {
          const collectionField = definition.replace('Collection', '')
          const existingCollection = targetClone.hasOwnProperty(collectionField) && targetClone[collectionField]
          if (existingCollection) {
            targetClone[definition] = parseCollection(existingCollection, `${typename}${capitalizeFirstLetter(definition)}`, definitionMap[definition])
            delete targetClone[collectionField]
          } else {
            targetClone[definition] = parseCollection([], `${typename}${capitalizeFirstLetter(definition)}`, definitionMap[definition])
          }
        } else if (definition.startsWith('...') && targetClone.__typename && targetClone.__typename === definition.replace('...', '')) {
          Object.assign(targetClone, applyDefinitions(targetClone, typename, definitionMap[definition]))
        } else {
          targetClone[definition] = null
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

    if (!clone.url.startsWith('https:')) {
      clone.url = `https:${clone.url}`
    }

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
  function parseEntry(object, typename, definitionMap, depth = 0) {
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

        field
          .filter(item => !!item)
          .forEach(item => {
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
          objectClone[collectionKey] = parseCollection(
            field,
            `${typename}${capitalizeFirstLetter(collectionKey)}`,
            definitionMap?.[collectionKey],
            depth + 1
          );

          // Delete old flat array field
          delete objectClone[key];
        } else {
          objectClone[key] = field
            .map((item, index) => cleanClone(item, object && object.fields && object.fields[key][index]))
            .filter(item => !!item)
        }
      } else if (field &&
        typeof field === 'object' &&
        (
          field.hasOwnProperty('__typename')
          || (field.hasOwnProperty('sys') && field.hasOwnProperty('fields'))
        )
      ) {
        // Parse single entry references
        objectClone[key] = parseEntry(field, typename, definitionMap?.[key], depth + 1)
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
    const definedClone = applyDefinitions(assetClone, assetClone.__typename || typename, definitionMap)

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
  function parseCollection(items = [], typename, definitionMap, depth = 0) {
    // @todo Add `skip` to response object - Ryan
    // @todo Add `limit` to response object - Ryan
    return {
      __typename: typename,
      total: (items && Array.isArray(items) ? items : []).length,
      items: (items && Array.isArray(items) ? items : []).map(
          item => parseEntry(item, typename, definitionMap?.items, depth)
        )
        .filter(item => !!item),
    };
  }

  // Parse collection queries
  if (data?.items) {
    return {
      [rootKey]: parseCollection(data.items, capitalizeFirstLetter(rootKey), definitionMap?.[rootKey]),
    }
  }

  // Parse single entry queries
  return { [rootKey]: {
      __typename: capitalizeFirstLetter(rootKey),
      ...parseEntry(data, capitalizeFirstLetter(rootKey), definitionMap?.[rootKey])
    }
  }
}
