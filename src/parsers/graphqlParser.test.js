import { graphqlParser } from './graphqlParser';

let data;

describe('graphqlParser', () => {
  test('collection data parsed', () => {
    data = graphqlParser('itemsCollection', {
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
      itemsCollection: {
        __typename: 'ItemsCollection',
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
        ],
        total: 2,
      },
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

  test('selection definitions applied to returned shape', () => {
    data = graphqlParser('item', {
      sys: {
        id: 'testId',
      }
    })

    expect(data).toEqual({
      item: {
        __typename: 'Item',
        sys: {
          __typename: 'Sys',
          id: 'testId',
        }
      }
    });
  });

  test('collection data parsed when nested', () => {
    data = graphqlParser('pageContainerCollection', {
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
      pageContainerCollection: {
        __typename: 'PageContainerCollection',
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
        ],
        total: 2,
      },
    });
  });

  test('collection empty items data when nested when field exists', () => {
    data = graphqlParser('pageContainer', {}, {
      pageContainer: {
        itemsCollection: {},
        ref: {
          title: null,
          description: null,
        },
      },
    });

    expect(data).toEqual({
      pageContainer: {
        __typename: 'PageContainer',
        itemsCollection: {
          __typename: 'PageContainerItemsCollection',
          items: [],
          total: 0,
        },
        ref: null,
      },
    });
  });

  test('collection empty items data when nested when field does not exist', () => {
    data = graphqlParser('pageContainer', {}, {
      pageContainer: {
        itemsCollection: {},
      }
    });

    expect(data).toEqual({
      pageContainer: {
        __typename: 'PageContainer',
        itemsCollection: {
          __typename: 'PageContainerItemsCollection',
          items: [],
          total: 0,
        },
      },
    });
  });

  test('parser', () => {
    data = graphqlParser('lessonCollection', {
      "sys": {
        "type": "Array"
      },
      "total": 1,
      "skip": 0,
      "limit": 100,
      "items": [
        {
          "sys": {
            "space": {
              "sys": {
                "type": "Link",
                "linkType": "Space",
                "id": "ge6mjviinrm0"
              }
            },
            "id": "4oB6Wn7uraF4N3uVSbjkoS",
            "type": "Entry",
            "createdAt": "2020-10-06T20:51:57.359Z",
            "updatedAt": "2020-10-06T20:51:57.359Z",
            "environment": {
              "sys": {
                "id": "master",
                "type": "Link",
                "linkType": "Environment"
              }
            },
            "revision": 1,
            "contentType": {
              "sys": {
                "type": "Link",
                "linkType": "ContentType",
                "id": "lesson"
              }
            },
            "locale": "en-US"
          },
          "fields": {
            "title": "Empty Lesson",
            "slug": "empty-lesson"
          }
        }
      ]
    }, {
      lessonCollection: {
        items: {
          '...Lesson': {
            title: null,
            modulesCollection: {
              '...Module': {
                title: null,
                copy: null,
              },
            },
          },
        },
      }
    });

    expect(data).toEqual({
      lessonCollection: {
        __typename: 'LessonCollection',
        items: [
          {
            __typename: 'Lesson',
            modulesCollection: {
              __typename: 'LessonModulesCollection',
              items: [],
              total: 0,
            },
            slug: 'empty-lesson',
            sys: {
              __typename: "Sys",
              contentType: {
                sys: {
                  id: "lesson",
                  linkType: "ContentType",
                  type: "Link",
                },
              },
              createdAt: "2020-10-06T20:51:57.359Z",
              environment: {
                sys: {
                  id: "master",
                  linkType: "Environment",
                  type: "Link",
                },
              },
              id: "4oB6Wn7uraF4N3uVSbjkoS",
              locale: "en-US",
              revision: 1,
              space: {
                sys: {
                  id: "ge6mjviinrm0",
                  linkType: "Space",
                  type: "Link",
                },
              },
              type: "Entry",
              updatedAt: "2020-10-06T20:51:57.359Z",
            },
            title: 'Empty Lesson',
          },
        ],
        total: 1,
      },
    });
  });
});
