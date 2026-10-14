// Web Functions loads index.js; Next.js expects HOSTNAME and PORT.
const endpoint = process.env.AWS_LAMBDA_HTTP_ENDPOINT;
if (!endpoint) throw new Error('AWS_LAMBDA_HTTP_ENDPOINT must be provided by the Web Functions runtime.');
const separator = endpoint.lastIndexOf(':');
if (separator < 1 || !/^\d+$/.test(endpoint.slice(separator + 1))) {
  throw new Error('Invalid AWS_LAMBDA_HTTP_ENDPOINT');
}
process.env.HOSTNAME = endpoint.slice(0, separator);
process.env.PORT = endpoint.slice(separator + 1);
require('./server.js');
