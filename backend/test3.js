import http from 'http';
const server = http.createServer((req, res) => res.end('hello'));
server.listen(5001, () => {
  console.log('Listening HTTP');
  console.log(process._getActiveHandles().map(h => h.constructor.name));
});
