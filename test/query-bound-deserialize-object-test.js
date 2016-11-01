import assert from 'assert';
import deserializeObject from '../src/deserialize-object';
import typeBundle from '../fixtures/types'; // eslint-disable-line import/no-unresolved
import Query from '../src/query';


suite('Integration | Query bound object graph', () => {
  const productId = 'gid://shopify/Product/12345';
  const graphFixture = {
    data: {
      shop: {
        products: {
          pageInfo: {
            hasNextPage: true
          },
          edges: [{
            cursor: 'product-cursor',
            node: {
              id: productId,
              handle: 'aluminum-pole',
              images: {
                pageInfo: {
                  hasNextPage: true
                },
                edges: [{
                  cursor: 'images-cursor',
                  node: {
                    id: 'gid://shopify/Image/12346',
                    src: 'https://cdn.shopify.com/s/files/1/1090/1932/products/giphy.gif?v=1450204755'
                  }
                }]
              }
            }
          }]
        }
      }
    }
  };

  let boundRoot;
  let boundShop;
  let boundProducts;
  let boundImages;
  let baseQuery;
  let graph;

  setup(() => {
    baseQuery = new Query(typeBundle, (root) => {
      boundRoot = root;
      root.addInlineFragmentOn('Node', (node) => {
        node.addField('id');
      });
      root.addField('shop', (shop) => {
        boundShop = shop;
        shop.addConnection('products', {first: 1}, (products) => {
          boundProducts = products;
          products.addField('handle');
          products.addConnection('images', {first: 1}, (images) => {
            boundImages = images;
            images.addField('src');
          });
        });
      });
    });

    // eslint-disable-next-line no-undefined
    graph = deserializeObject(typeBundle, graphFixture.data, 'QueryRoot', undefined, baseQuery.selectionSet);
  });

  test('it binds SelectionSets through ancestry', () => {
    assert.equal(graph.ancestry.selectionSet, boundRoot);
    assert.equal(graph.shop.ancestry.selectionSet, boundShop);
    assert.equal(graph.shop.products[0].ancestry.selectionSet, boundProducts);
    assert.equal(graph.shop.products[0].images[0].ancestry.selectionSet, boundImages);
  });

  test('it identifies objects that are nodes', () => {
    assert.equal(graph.ancestry.isNode, false, 'the root is not a node');
    assert.equal(graph.shop.ancestry.isNode, false, 'shop is not a node');
    assert.equal(graph.shop.products[0].ancestry.isNode, true, 'products are nodes');
    assert.equal(graph.shop.products[0].images[0].ancestry.isNode, false, 'images are not nodes');
  });

  test('it identifies the nearest parent Node', () => {
    assert.equal(graph.ancestry.nearestNode, null, 'query root has no nearest parent Node');
    assert.equal(graph.shop.ancestry.nearestNode, null, 'shop has no nearest parent Node');
    assert.equal(graph.shop.products[0].ancestry.nearestNode, null, 'products have no nearest parent node');
    assert.deepEqual(graph.shop.products[0].images[0].ancestry.ancestralNode, {
      id: productId,
      selectionSet: boundProducts
    }, 'image has a nearest node of the parent product');
  });
});