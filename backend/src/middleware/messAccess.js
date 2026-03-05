import Membership from "../models/Membership.js";

export function requireMember() {
  return async (req, res, next) => {
    const messId = req.params.messId || req.body.messId;
    if (!messId) return res.status(400).json({ message: "Missing messId" });

    const mem = await Membership.findOne({ messId, userId: req.user.id, isActive: true });
    if (!mem) return res.status(403).json({ message: "Not a member of this mess" });

    req.membership = mem; // attach for later use
    next();
  };
}

export function requireManager() {
  return async (req, res, next) => {
    const messId = req.params.messId || req.body.messId;
    if (!messId) return res.status(400).json({ message: "Missing messId" });

    const mem = await Membership.findOne({ messId, userId: req.user.id, isActive: true });
    if (!mem || mem.role !== "MANAGER") {
      return res.status(403).json({ message: "Manager only" });
    }

    req.membership = mem;
    next();
  };
}