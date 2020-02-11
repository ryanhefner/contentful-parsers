/**
 * Flattens a Contentful data response, extracting the fields from child
 * objects and setting them to the parent name.
 *
 * @param  {Object} data
 * @return {Object}
 */
export default function (data, props = { include: 10 }) {
  /**
   * Check to see if the object passed is an object that contains only a `sys`
   * property and no feields. If so, either the model is empty, draft, or unpublished.
   *
   * @param  {Object} object
   * @return {boolean}
   */
  function emptyModel(object) {
    return !!(
      typeof object === 'object'
        && object.hasOwnProperty('sys')
        && Object.keys(object).length === 1
    );
  }

  /**
   * Handle parsing non-field value objects, cleaning empty value objects that
   * contain no fields or filtering object arrays that contain empty objects with
   * just sys defined. Or, simply returning the value, unmanipulated.
   *
   * @param  {Object} object
   * @return {?any}
   */
  function parseValue(value, depth = 0) {
    // If value is an object and only contains a sys property, just return null
    // since it’s either an empty or unpublished entry
    if (emptyModel(value)) {
      return null;
    }

    if (Array.isArray(value)) {
      return value.filter(item => {
        return !emptyModel(item);
      })
      .map(item => {
        return item && typeof item === 'object' && item.fields
          ? parseFields(item.fields, item.sys, {}, depth + 1)
          : parseValue(item, depth + 1);
       });
    }

    return value;
  }

  /**
   * Parse over a fields object, parsing child fields or building rest of object.
   *
   * @param  {Object} fieldsObject - fields object to iterate over and flatten into objectRef
   * @param  {Object} sys - sys object associated with fieldsObject
   * @param  {Object} objectRef - Compiled object that flattens the field objects
   * @return {Object}
   */
  function parseFields(fieldsObject, sys, objectRef = {}, depth = 0) {
    if (!fieldsObject || typeof fieldsObject !== 'object') {
      return objectRef;
    }

    if (depth >= props.include) {
      return objectRef;
    }

    const objectRefClone = Object.assign({}, objectRef);

    // Iterate over fieldObject keys, rercursively parsing child objects that
    // contain fields, or parsing non-fields-child objects/entries
    Object.keys(fieldsObject).forEach((key) => {
      objectRefClone[key] = fieldsObject[key].fields
        ? parseFields(fieldsObject[key].fields, fieldsObject[key].sys, objectRefClone[key], depth + 1)
        : parseValue(fieldsObject[key], depth + 1);
    });

    // Apply typeNameKey/value to each fields object to define the Contentful model type
    const contentTypeId = sys
      && sys.contentType
      && sys.contentType.sys
      && sys.contentType.sys.id;

    if (!!contentTypeId) {
      /* eslint-disable */
      objectRefClone['id'] = sys.id;
      objectRefClone['__typename'] = sys.contentType.sys.id;
      /* eslint-enable */
    }

    // Apply updatedAt
    if (sys && sys.updatedAt) {
      objectRefClone['updatedAt'] = sys.updatedAt;
    }

    // Apply createdAt
    if (sys && sys.createdAt) {
      objectRefClone['createdAt'] = sys.createdAt;
    }

    return objectRefClone;
  }

  return parseFields(data.fields, data.sys);
}
