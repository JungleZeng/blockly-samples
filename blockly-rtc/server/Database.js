/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/**
 * @fileoverview Wrapper class for the SQLite database.
 * @author navil@google.com (Navil Perez)
 */

const db = require('./db');

/**
 * Class for managing interactions between the server and the database.
 */
class Database {
  constructor() {
    this.db = db;
  };

  /**
   * Query the database for rows since the given server id.
   * @param {number} serverId serverId for the lower bound of the query.
   * @return {!Promise} Promise object represents the rows since the last given
   * serverId.
   * @public
   */
  query(serverId) {
    return new Promise ((resolve, reject) => {
      this.db.all(`SELECT * from eventsdb WHERE serverId > ${serverId};`,
          (err, rows) => {
        if (err) {
          console.error(err.message);
          reject('Failed to query the database.');
        } else {
          rows.forEach((row) => {
            row.events = JSON.parse(row.events);
          });
          resolve(rows);
        };
      });
    });
  };

  /**
   * Add an entry to the database.
   * @param {!LocalEntry} entry The entry to be added to the database.
   * @return {!Promise} Promise object with the serverId for the entry if the
   * write succeeded.
   * @public
   */
  addToServer(entry) {

    return new Promise((resolve, reject) => {
      this.db.serialize(() => {
        this.db.run('INSERT INTO eventsdb(events, entryId) VALUES(?,?)',
            [JSON.stringify(entry.events), entry.entryId], (err) => {
          if (err) {
            console.error(err.message);
            reject(err);
          };
        });
        this.db.each(`SELECT last_insert_rowid() as serverId;`, (err, lastServerId) => {
          if (err) {
            console.error(err.message);
            reject(err);
          };
          resolve(lastServerId.serverId);
        });
      });
    });
  };
};

module.exports.Database = Database;