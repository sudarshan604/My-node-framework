const http = require("node:http");

const fs = require("node:fs/promises");

class Sudar {
  constructor() {
    this.server = http.createServer();
    this.routes = {};
    this.middlewares = [];

    this.server.on("request", (req, res) => {
      res.sendFile = async (path, mime) => {
        const fileHandle = await fs.open(path, "r");

        const fileStream = fileHandle.createReadStream();

        res.setHeader("Content-Type", mime);
        fileStream.pipe(res);
      };

      res.status = (code) => {
        res.statusCode = code;
        return res;
      };

      res.json = (data) => {
        res.setHeader("Content-Type", "application/json");
        res.end(JSON.stringify(data));
      };

      const runMiddleWare = (req, res, middleware, index) => {
        if (middleware.length === index) {
          if (!this.routes[req.method.toLowerCase() + req.url]) {
            return res
              .status(404)
              .json({ error: `${req.method} with ${req.url} not fount` });
          }
          this.routes[req.method.toLocaleLowerCase() + req.url](req, res);
        } else {
          middleware[index](req, res, () => {
            runMiddleWare(req, res, middleware, index + 1);
          });
        }
      };

      runMiddleWare(req, res, this.middlewares, 0);
    });
  }

  route(method, url, cb) {
    this.routes[method + url] = cb;
  }

  beforeEach(cb) {
    this.middlewares.push(cb);
  }

  listen(port, cb) {
    this.server.listen(port, () => {
      cb();
    });
  }
}

module.exports = Sudar;
