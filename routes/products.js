const {
  requireAuth,
  requireAdmin,
} = require('../middleware/auth');
const {getProducts,postProducts,patchProductById,deleteProductById,getProductById} = require('../controller/products.js')

module.exports = (app, nextMain) => {

  app.get('/products', requireAuth, getProducts);

  app.get('/products/:productId',requireAuth, getProductById);

  app.post('/products',requireAdmin)

  app.patch('/products/:productId',requireAdmin);

  app.delete('/products/:productId',requireAdmin);

  nextMain();
};
