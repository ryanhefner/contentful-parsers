# 🧰 contentful-parsers

[![npm](https://img.shields.io/npm/v/contentful-parsers?style=flat-square)](https://www.pkgstats.com/pkg:contentful-parsers)
[![NPM](https://img.shields.io/npm/l/contentful-parsers?style=flat-square)](https://www.pkgstats.com/pkg:contentful-parsers)
[![npm](https://img.shields.io/npm/dt/contentful-parsers?style=flat-square)](https://www.pkgstats.com/pkg:contentful-parsers)
[![Coveralls github](https://img.shields.io/coveralls/github/ryanhefner/contentful-parsers?style=flat-square)](https://coveralls.io/github/ryanhefner/contentful-parsers)
![CircleCI](https://img.shields.io/circleci/build/github/ryanhefner/contentful-parsers?style=flat-square)
![Snyk Vulnerabilities for GitHub Repo](https://img.shields.io/snyk/vulnerabilities/github/ryanhefner/contentful-parsers?style=flat-square)


Toolbox of useful parsers to use when working with Contentful API responses.

## Install

Via [npm](https://npmjs.com/package/contentful-parsers)

```sh
npm install contentful-parsers
```

Via [Yarn](http://yarn.fyi/contentful-parsers)

```sh
yarn add contentful-parsers
```

## Parsers

### `fieldsParser`
Probably the most common parser of the lot. This will take a Contentful response,
either an array or a single item, and parse the items to flatten all of the `fields`
objects and remove the majority of the `sys` objects, except for a reference to
the `sys.contentType.sys.id`, in case you are doing any based on that for your
rendering.

#### How to use

```js
import contentful from 'contentful';
import { fieldsParser } from 'contentful-parsers';

const client = contentful.createClient({
  space: '[SPACE_ID]',
  accessToken: '[ACCESS_TOKEN]',
});

const response = await client.getEntry('[ENTRY_ID]');
const data = fieldsParser(response);
```


### `graphqlParser`
Takes a standard standard REST response from the Contentful API and restructures it
to allow it to be queryable via a GraphQL query.

Since this will probably commonly be used with `graphql-anywhere` for performing the
queries against the parsed data, a basic resolver is included in the paackage as
well, `contentfulResolver`.

#### How to use

```js
import { graphql } from 'graphql-anywhere/lib/async'
import contentful from 'contentful';
import { graphqlParser, contentfulResolver } from 'contentful-parsers';

const entryQuery = gql`
  entry {
    sys {
      id
    }
    title
    copy
  }
`

const client = contentful.createClient({
  space: '[SPACE_ID]',
  accessToken: '[ACCESS_TOKEN]',
});

const response = await client.getEntry('[ENTRY_ID]');
const parsedData = graphqlParser('entry', response);

graphql(
  contentfulResolver,
  entryQuery,
  parsedData,
)
  .then(data => {
    // data -> Contentful model filtered via GraphQL query
  })
  .catch(error => console.error(error));
```


## License

[MIT](LICENSE) © [Ryan Hefner](https://www.ryanhefner.com)
