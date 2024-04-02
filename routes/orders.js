const {
  requireAuth,
} = require('../middleware/auth');
const { postOrders, getOrders, getOrderById, putOrderById, deleteOrderById} = require('../controller/orders')
module.exports = (app, nextMain) => {
  app.get('/orders', requireAuth, getOrders);

  app.get('/orders/:orderId', requireAuth, getOrderById);

  app.post('/orders', requireAuth, postOrders);

  app.put('/orders/:orderId', requireAuth, putOrderById);

  app.delete('/orders/:orderId', requireAuth,  deleteOrderById);

  nextMain();
};
