const jwt = require('jsonwebtoken');



module.exports = (secret) => (req, resp, next) => {
  const { authorization } = req.headers;

  if (!authorization) {
    return next();
  }

  const [type, token] = authorization.split(' ');
  console.log("🚀 ~ token:", token)
  console.log("🚀 ~ type:", type)

  

  if (type.toLowerCase() !== 'bearer') {
    return next();
  }

  jwt.verify(token, secret, (err, decodedToken) => {
    console.log("🚀 ~ jwt.verify ~ decodedToken:", decodedToken)
    if (err) {
      return next(403);
    }
    // TODO: Verify user identity using `decodeToken.uid`
    req.uid = decodedToken._id;
    console.log("🚀 ~ jwt.verify ~ req.uid:", req.uid)
    req.role = decodedToken.role;
    console.log("🚀 ~ jwt.verify ~ req.role:", req.role)
    next()
  });
};

// Funciones de autenticación y autorización
module.exports.isAuthenticated = (req) => (
  // TODO: Decide based on the request information whether the user is authenticated
  false
);
  

module.exports.isAdmin = (req) => (
  // if the user is an admin
  // TODO: Decide based on the request information whether the user is an admin
  false
);
module.exports.requireAuth = (req, resp, next) => (
  (!module.exports.isAuthenticated(req))
    ? next(401)
    : next()
);

module.exports.requireAdmin = (req, resp, next) => (
  // eslint-disable-next-line no-nested-ternary
  (!module.exports.isAuthenticated(req))
    ? next(401)
    : (!module.exports.isAdmin(req))
      ? next(403)
      : next()
);

