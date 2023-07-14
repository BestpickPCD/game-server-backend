'use strict';

var dbm;
var type;
var seed;

/**
 * We receive the dbmigrate dependency from dbmigrate initially.
 * This enables us to not have to rely on NODE_PATH.
 */
exports.setup = function (options, seedLink) {
  dbm = options.dbmigrate;
  type = dbm.dataType;
  seed = seedLink;
};

exports.up = function (db, callback) {
  db.createTable('users', {
    id: { type: 'int', primaryKey: true, autoIncrement: true },
    name: 'string',
    email: 'string',
    password: 'string',
    username: 'string',
    created_at: 'datetime',
    updated_at: 'datetime'
  }, callback);
  
  db.createTable('games', {
    id: { type: 'int', primaryKey: true, autoIncrement: true },
    name: 'string', 
    type: 'string', 
    created_at: 'datetime',
    updated_at: 'datetime'
  });

};

exports.down = function (db, callback) {
  db.dropTable('users', callback);
  db.dropTable('games', callback);
};

exports._meta = {
  version: 1
};
