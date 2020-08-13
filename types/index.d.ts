// TypeScript Version: 3.0

/**
 * fieldsParser
 */
export interface fieldsParserProps {
  include: number;
}

export function fieldsParser(data: any, props: fieldsParserProps): any;

/**
 *  graphqlParser
 */

 export interface graphqlParserProps {
   include: number;
 }

 export function graphqlParser(data: any, props: graphqlParserProps): any;

 export function contentfulResolver(fieldName: string, rootValue: any): any | null;
