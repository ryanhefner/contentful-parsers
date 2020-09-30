// TypeScript Version: 3.0

/**
 * fieldsParser
 */
export interface fieldsParserProps {
  include: number;
}

export interface fieldParserOptions {
  parseArrays?: boolean;
  parseRefs?: boolean;
}

export function fieldsParser(data: any, props?: fieldsParserProps, options?: fieldParserOptions): any;

/**
 *  graphqlParser
 */

 export interface graphqlParserProps {
   include: number;
 }

 export function graphqlParser(rootKey: string, data: any, definitionMap?: any, props?: graphqlParserProps): any;

 export function contentfulResolver(fieldName: string, rootValue: any): any | null;
