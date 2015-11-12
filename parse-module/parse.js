var Parse = require('parse/node').Parse;
var appKey = "odG1XfdTyOmj6dAtct5YHhJLNkCNVsLGO4jSqIzD";
var jsKey = "bx3HInStivlc6vCD7hcMUrZk55hzAuX9TEZGfKCQ";
var restKey = "PK8LRj0HuZxYQHHLvwXei4OyCxP0827keSTgdifR";
exports.appKey = appKey;
exports.jsKey = jsKey;
exports.restKey = restKey;
Parse.initialize(appKey, jsKey);

exports.parseObj = Parse;