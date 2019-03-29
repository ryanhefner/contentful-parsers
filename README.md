# 🧰 contentful-parsers

[![npm version](https://badge.fury.io/js/contenful-parsers.svg)](https://badge.fury.io/js/contenful-parsers)
[![npm](https://img.shields.io/npm/l/express.svg)](LICENSE)
[![Coverage Status](https://coveralls.io/repos/github/ryanhefner/contenful-parsers/badge.svg?branch=master)](https://coveralls.io/github/ryanhefner/contenful-parsers?branch=master)
[![CircleCI](https://circleci.com/gh/ryanhefner/contenful-parsers.svg?style=shield)](https://circleci.com/gh/ryanhefner/contenful-parsers)
[![Greenkeeper badge](https://badges.greenkeeper.io/ryanhefner/contenful-parsers.svg)](https://greenkeeper.io/)

Toolbox of useful parsers to use when working with Contentful API responses.

## Install

Via [npm](https://npmjs.com/package/contenful-parsers)

```sh
npm install contenful-parsers
```

Via [Yarn](http://yarn.fyi/contenful-parsers)

```sh
yarn add contenful-parsers
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
  space: '',
  accessToken: '',
});

const response = client.getEntry('[ENTRY_ID]');
const data = fieldsParser(response);
```

__Input__

_Coming soon_

__Output__

_Coming soon_


## License

[MIT](LICENSE) © [Ryan Hefner](https://www.ryanhefner.com)
