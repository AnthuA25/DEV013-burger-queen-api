const {
  requireAuth,
} = require('../middleware/auth');
const { postOrder, getOrders, getOrderById, putOrderById, deleteOrderById} = require('../controller/orders')
module.exports = (app, nextMain) => {
  app.get('/orders', requireAuth, getOrders);

  app.get('/orders/:orderId', requireAuth, getOrderById);

  app.post('/orders', requireAuth, postOrder);

  app.put('/orders/:orderId', requireAuth, putOrderById);

  app.delete('/orders/:orderId', requireAuth,  deleteOrderById);

  nextMain();
};
