/**
 * validate({ body, query, params }) — parses with Zod and puts the results on req.valid.{body,query,params}.
 * (Express 5 makes req.query read-only, so we never overwrite the originals.)
 */
export const validate = (schemas) => (req, res, next) => {
  req.valid = {};
  for (const part of ['params', 'query', 'body']) {
    if (schemas[part]) req.valid[part] = schemas[part].parse(req[part] ?? {});
  }
  next();
};
