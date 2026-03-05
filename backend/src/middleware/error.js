export function notFound(req, res) {
    res.status(404).json({ message: "Not found" });
}

export function errorHandler(err, req, res, next) {
    console.error(err.stack);
    res.status(500).json({ message: "Internal server error" });
}