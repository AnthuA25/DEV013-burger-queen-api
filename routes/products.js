const {
  requireAuth,
  requireAdmin,
} = require('../middleware/auth');
const {getProducts,postProducts,patchProductById,deleteProductById,getProductById} = require('../controller/products.js')

module.exports = (app, nextMain) => {

  app.get('/products', requireAuth, getProducts);

  app.get('/products/:productId',requireAuth, getProductById);

  app.post('/products',requireAdmin,postProducts)

  app.patch('/products/:productId',requireAdmin,patchProductById);

  app.delete('/products/:productId',requireAdmin,deleteProductById);

  nextMain();
};
