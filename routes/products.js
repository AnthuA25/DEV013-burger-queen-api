const {
  requireAuth,
  requireAdmin,
} = require('../middleware/auth.js');
const {getProducts,postProducts,putProductById,deleteProductById,getProductById} = require('../controller/products.js')

module.exports = (app, nextMain) => {

  app.get('/products', requireAuth, getProducts);

  app.get('/products/:productId',requireAuth, getProductById);

  app.post('/products',requireAdmin,postProducts)

  app.put('/products/:productId',requireAdmin,putProductById);

  app.delete('/products/:productId',requireAdmin,deleteProductById);

  nextMain();
};
