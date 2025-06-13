export default class Response {
  constructor(success, message, result = null, error = null) {
    this.success = success;
    this.message = message;
    if (result !== null) this.result = data;
    if (error !== null) this.error = error;
  }
}
