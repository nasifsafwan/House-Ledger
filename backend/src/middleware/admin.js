
export async function requireSystemAdmin(req, res, next) {
  if (req.user?.role === 'admin') {
    req.systemAdmin = req.user;
    return next();
  }

  return res.status(403).json({ message: "System admin only" });
}
