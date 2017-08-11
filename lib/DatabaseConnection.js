import Promise from 'bluebird';
const seraph = require("seraph");

let db, instance;

export default class DatabaseConnection{
  constructor(location, username, password) {
    db = seraph({
      server: location,
      user: username,
      pass: password
    });

    db = Promise.promisifyAll(db);
    instance = this;
  }

  static getConnection() {
    return instance;
  }

  async query(query){
    return await db.queryAsync(query);
  }
}
