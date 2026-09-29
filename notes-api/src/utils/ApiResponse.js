class ApiResponse {
  constructor(res) {
    this.res = res;
  }

  success(statusCode, data, message = 'Success', meta = {}) {
    return this.res.status(statusCode).json({
      success: true,
      message,
      data,
      ...meta,
    });
  }

  created(data, message = 'Created') {
    return this.success(201, data, message);
  }

  ok(data, message = 'Success') {
    return this.success(200, data, message);
  }

  noContent(message = 'No Content') {
    return this.res.status(204).json({
      success: true,
      message,
      data: null,
    });
  }

  /**
   * Paginated list response. `extra` adds sibling top-level fields (e.g. the
   * author of the listed items) without disturbing the data/meta envelope.
   */
  paginated(data, meta, message = 'Success', extra = undefined) {
    return this.res.status(200).json({
      success: true,
      message,
      data,
      meta,
      ...(extra || {}),
    });
  }
}

const sendResponse = (res) => new ApiResponse(res);

module.exports = { ApiResponse, sendResponse };