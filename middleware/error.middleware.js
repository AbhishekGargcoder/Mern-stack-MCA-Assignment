const notFound = (req, res) => {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`
  });
};

const errorHandler = (err, req, res, next) => {
  console.error(err);

  if (res.headersSent) return next(err);

  res.status(err.statusCode || 500).json({
    success: false,
    message: err.statusCode ? err.message : "Internal server error."
  });
};

export { notFound, errorHandler };
