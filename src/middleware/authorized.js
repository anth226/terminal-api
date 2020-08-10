export function isAuthorized(opts) {
  return (req, res, next) => {
    const isAdmin = req.terminal_app.claims.isAdmin;
    const role = isAdmin ? "admin" : "";

    if (!role) {
      return res.status(403).send();
    }

    if (opts.hasRole.includes(role)) {
      return next();
    }

    return res.status(403).send();
  };
}
