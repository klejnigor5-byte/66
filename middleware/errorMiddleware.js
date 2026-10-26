function notFound(req, res, next) {
  res.status(404);
  next(new Error(`Сторінку не знайдено: ${req.originalUrl}`));
}

function errorHandler(err, req, res, next) {
  console.error(err);
  const status = res.statusCode && res.statusCode !== 200 ? res.statusCode : 500;

  if (req.accepts("html")) {
    return res.status(status).render("error", {
      title: "Помилка",
      status,
      message: status === 500 ? "Виникла внутрішня помилка сервера." : err.message
    });
  }

  return res.status(status).json({
    error: status === 500 ? "Internal Server Error" : err.message
  });
}

module.exports = { notFound, errorHandler };
