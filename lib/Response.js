export default class Response {
  constructor(success, message, data = null, error = null) {
    this.success = success;
    this.message = message;
    if (data !== null) this.data = data;
    if (error !== null) this.error = error;
  }
}
