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
 * @param {object} definitionMap
 * @param {object} props
 */
export function graphqlParser(operationName, data, definitionMap, props = { include: 10 }) {
  /**
   * Apply `sys` object back to model that was stripped via the fieldsParser and remove
   * `id`, `createdAt`, and `updatedAt` values that were extracted and applied from `sys`
   * @param {object} clone
   * @param {object} ref
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


  function applyDefinitions(target, definitionMap) {
    if (!target || !definitionMap) return target

    const targetClone = Object.assign({}, target)

    Object.keys(definitionMap).forEach(definition => {
      if (definition.startsWith('...')) {
        applyDefinitions(targetClone, definitionMap[definition])
      } else {
        if (!targetClone.hasOwnProperty(definition)) {
          if (definition.endsWith('Collection')) {
            targetClone[definition] = parseCollection([], definitionMap[definition])
          } else {
            targetClone[definition] = definitionMap?.[definition]
          }
        } else if (typeof definitionMap[definition] === 'object') {
          targetClone[definition] = applyDefinitions(targetClone[definition], definitionMap[definition])
        }
      }
    })

    return targetClone
  }

  function parseEntry(object, definitionMap, depth = 0) {
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
          objectClone[collectionKey] = parseCollection(field, definitionMap && definitionMap[collectionKey], depth + 1)

          if (!objectClone[collectionKey]?.items?.length) {
            delete objectClone[collectionKey]
          }

          // Delete old flat array field
          delete objectClone[key];
        } else {
          objectClone[key] = field.map((item, index) => cleanClone(item, object[key][index]))
        }
      } else if (
        typeof field === 'object' &&
        (
          field.hasOwnProperty('__typename')
          || (field.hasOwnProperty('sys') && field.hasOwnProperty('fields'))
        )
      ) {
        // Parse single entry references
        objectClone[key] = parseEntry(field, definitionMap && definitionMap[key], depth + 1)
      } else {
        objectClone[key] = field
      }
    })

    // Clean fields applied by fieldsParser and map sys object to item
    const cleanedClone = cleanClone(objectClone, object)

    // Make sure all queried fields are available on the response, even if not included in the Rest response
    const definedClone = applyDefinitions(cleanedClone, definitionMap)

    // Return GraphQL-ready object
    return definedClone
  }

  // Structure entry collections object
  function parseCollection(items = [], definitionMap = null, depth = 0) {
    return {
      __typename: 'Array',
      items: items.map(item => parseEntry(item, definitionMap && definitionMap.items, depth)).filter(item => !!item),
    };
  }

  // Parse collection queries
  if (data.items) {
    return {
      [operationName]: parseCollection(data.items, definitionMap && definitionMap[operationName]),
    }
  }

  // Parse single entry queries
  return { [operationName]: parseEntry(data, definitionMap && definitionMap[operationName]) }
}
