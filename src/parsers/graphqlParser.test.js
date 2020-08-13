import { graphqlParser } from './graphqlParser';

let data;

describe('graphqlParser', () => {
  test('collection data pasered', () => {
    data = graphqlParser('itemCollection', {
      items: [
        {
          sys: {
            id: 'testId',
            contentType: {
              sys: {
                id: 'testType'
              },
            },
          },
          fields: {
            test: 'test',
          },
        },
        {
          sys: {
            id: 'testId',
            contentType: {
              sys: {
                id: 'testType'
              },
            },
          },
          fields: {
            test: 'test',
          },
        },
      ],
    });

    expect(data).toEqual({
      itemCollection: {
        __typename: 'Array',
        items: [
          {
            sys: {
              __typename: 'Sys',
              id: 'testId',
              contentType: {
                sys: {
                  id: 'testType'
                },
              },
            },
            __typename: 'TestType',
            test: 'test',
          },
          {
            sys: {
              __typename: 'Sys',
              id: 'testId',
              contentType: {
                sys: {
                  id: 'testType'
                },
              },
            },
            __typename: 'TestType',
            test: 'test',
          }
        ]
      }
    });
  });

  test('entry data parsed', () => {
    data = graphqlParser('item', {
      sys: {
        id: 'testId',
        contentType: {
          sys: {
            id: 'testType'
          },
        },
      },
      fields: {
        test: 'test',
      },
    });

    expect(data).toEqual({
      item: {
        sys: {
          __typename: 'Sys',
          id: 'testId',
          contentType: {
            sys: {
              id: 'testType'
            },
          },
        },
        __typename: 'TestType',
        test: 'test',
      }
    });
  });
});
