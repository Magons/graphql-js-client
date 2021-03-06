import assert from 'assert';
import ClassRegistry from '../src/class-registry';
import decode from '../src/decode';
import GraphModel from '../src/graph-model';
import Scalar from '../src/scalar';
import Query from '../src/query';
import typeBundle from '../fixtures/types'; // eslint-disable-line import/no-unresolved

const graphFixture = {
  data: {
    shop: {
      name: 'buckets-o-stuff',
      products: {
        pageInfo: {
          hasPreviousPage: false,
          hasNextPage: false
        },
        edges: [
          {
            cursor: 'eyJsYXN0X2lkIjozNjc3MTg5ODg5LCJsYXN0X3ZhbHVlIjoiMzY3NzE4OTg4OSJ9',
            node: {
              handle: 'aluminum-pole'
            }
          },
          {
            cursor: 'eyJsYXN0X2lkIjozNjgwODg2NzIxLCJsYXN0X3ZhbHVlIjoiMzY4MDg4NjcyMSJ9',
            node: {
              handle: 'electricity-socket-with-jam'
            }
          },
          {
            cursor: 'eyJsYXN0X2lkIjo0MTQwMTI3MDQxLCJsYXN0X3ZhbHVlIjoiNDE0MDEyNzA0MSJ9',
            node: {
              handle: 'borktown'
            }
          }
        ]
      }
    }
  }
};

const graphQuery = new Query(typeBundle, (root) => {
  root.addField('shop', (shop) => {
    shop.addField('name');
    shop.addConnection('products', (products) => {
      products.addField('handle');
    });
  });
});

const productId = 'gid://shopify/Product/3677189889';
const productFixture = {
  data: {
    product: {
      id: productId,
      handle: 'aluminum-pole',
      options: [
        {
          name: 'Color'
        },
        {
          name: 'Size'
        }
      ],
      imagesAlias: {
        pageInfo: {
          hasPreviousPage: false,
          hasNextPage: false
        },
        edges: [
          {
            node: {
              src: 'https://cdn.shopify.com/s/files/1/1090/1932/products/festivus-pole-the-strike-seinfeld.jpg?v=1449866700'
            }
          },
          {
            node: {
              src: 'https://cdn.shopify.com/s/files/1/1090/1932/products/giphy.gif?v=1450204755'
            }
          }
        ]
      }
    }
  }
};

const productQuery = new Query(typeBundle, (root) => {
  root.addField('product', {args: {id: productId}}, (product) => {
    product.addField('id');
    product.addField('handle');
    product.addField('options', (options) => {
      options.addField('name');
    });
    product.addConnection('images', {alias: 'imagesAlias'}, (images) => {
      images.addField('src');
    });
  });
});

suite('decode-test', () => {
  test('it decodes a very simple query response', () => {
    const query = new Query(typeBundle, (root) => {
      root.add('shop', (shop) => {
        shop.add('name');
      });
    });
    const data = {shop: {name: 'foo'}};
    const decoded = decode(query, data);

    assert.ok(decoded);
    assert.ok(decoded.shop);
    assert.equal(decoded.shop.name, data.shop.name);
  });

  test('it creates a GraphModel from the root type', () => {
    const graph = decode(graphQuery, graphFixture.data);

    assert.ok(GraphModel.prototype.isPrototypeOf(graph), 'root type is a graph model');
  });

  test('it instantiates a model with relationship fields', () => {
    const graph = decode(graphQuery, graphFixture.data);

    assert.ok(GraphModel.prototype.isPrototypeOf(graph.shop), 'shop relationship is a graph model');
    assert.equal(graph.shop.name, 'buckets-o-stuff', 'shop model contains scalar attrs');
    assert.deepEqual(
      graph.shop.products.map((attrs) => attrs.handle.valueOf()),
      [
        'aluminum-pole',
        'electricity-socket-with-jam',
        'borktown'
      ],
      'shop model contains connection attrs'
    );
  });

  test('it creates an array from lists of paginated relationships', () => {
    const graph = decode(graphQuery, graphFixture.data);

    assert.ok(Array.isArray(graph.shop.products), 'shops products are in an array');
    assert.equal(graph.shop.products.length, 3, 'there are three products');
  });

  test('it instantiates paginated list members as models', () => {
    const graph = decode(graphQuery, graphFixture.data);

    graphFixture.data.shop.products.edges.forEach((product, index) => {
      assert.ok(GraphModel.prototype.isPrototypeOf(graph.shop.products[index]), 'products are graph models');
      assert.equal(graph.shop.products[index].attrs.handle, product.node.handle, 'products contain payload attrs');
    });
  });

  test('it creates an array from lists of non-paginated relationships', () => {
    const graph = decode(productQuery, productFixture.data);

    assert.ok(Array.isArray(graph.product.options), 'products images are in an array');
    assert.equal(graph.product.options.length, 2, 'there are two options');
  });

  test('it instantiates basic list members as models', () => {
    const graph = decode(productQuery, productFixture.data);

    assert.ok(GraphModel.prototype.isPrototypeOf(graph.product.options[0]));
    assert.equal(graph.product.options[0].name, productFixture.data.product.options[0].name);
  });

  test('it instantiates types with their registered models', () => {
    const registry = new ClassRegistry();

    class ShopModel extends GraphModel { }

    class ProductModel extends GraphModel { }

    registry.registerClassForType(ShopModel, 'Shop');
    registry.registerClassForType(ProductModel, 'Product');

    const graph = decode(graphQuery, graphFixture.data, {classRegistry: registry});

    assert.ok(ShopModel.prototype.isPrototypeOf(graph.shop), 'shop node is a shop model');
    assert.ok(ProductModel.prototype.isPrototypeOf(graph.shop.products[0]), 'product node is a product model');
  });

  test('it records type information on the model', () => {
    const graph = decode(graphQuery, graphFixture.data);

    assert.equal(graph.type.name, 'QueryRoot');
    assert.equal(graph.shop.type.name, 'Shop');
    assert.equal(graph.shop.attrs.name.type.name, 'String');
  });

  test('it wraps primitives in a Scalar wrapper (allowing extensibility)', () => {
    const graph = decode(graphQuery, graphFixture.data);

    assert.ok(Scalar.prototype.isPrototypeOf(graph.shop.attrs.name));
    assert.equal(graph.shop.name, 'buckets-o-stuff');
  });

  test('it decodes query responses with null values', () => {
    const productWithNullFieldsId = 'gid://shopify/Product/1893855669';
    const productWithNullFieldsFixture = {
      data: {
        product: {
          id: productWithNullFieldsId,
          handle: null,
          options: null,
          images: {
            pageInfo: {
              hasNextPage: false,
              hasPreviousPage: false
            },
            edges: []
          },
          variants: {
            pageInfo: {
              hasNextPage: false,
              hasPreviousPage: false
            },
            edges: [
              {
                node: {
                  weightUnit: null
                }
              }
            ]
          }
        }
      }
    };

    const productWithNullFieldsQuery = new Query(typeBundle, (root) => {
      root.addField('product', {args: {id: productWithNullFieldsId}}, (product) => {
        product.addField('id');
        product.addField('handle');
        product.addField('options', (options) => {
          options.addField('name');
        });
        product.addConnection('images', (images) => {
          images.addField('src');
        });
        product.addConnection('variants', (variants) => {
          variants.add('weightUnit');
        });
      });
    });

    const model = decode(productWithNullFieldsQuery, productWithNullFieldsFixture.data);

    assert.equal(Object.prototype.toString.call(model.product.handle), '[object Null]');
    assert.equal(Object.prototype.toString.call(model.product.options), '[object Null]');
    assert.equal(Object.prototype.toString.call(model.product.variants[0].weightUnit), '[object Null]');
  });

  test('it applies `hasNextPage` and `hasPreviousPage` to every node in the list', () => {
    const decoded = decode(graphQuery, graphFixture.data);

    assert.equal(decoded.shop.products[0].hasNextPage, true, 'nodes with later items have a next page');
    assert.equal(decoded.shop.products[0].hasPreviousPage, false, 'nodes at the beginning inherit from `pageInfo`');
    assert.equal(decoded.shop.products[1].hasNextPage, true, 'nodes bounded by other nodes have a next page');
    assert.equal(decoded.shop.products[1].hasPreviousPage, true, 'nodes bounded by other nodes have a previous page');
    assert.equal(decoded.shop.products[2].hasNextPage, false, 'nodes at the end inherit from `pageInfo`');
    assert.equal(decoded.shop.products[2].hasPreviousPage, true, 'nodes with previous items have a previous page');
  });
});
