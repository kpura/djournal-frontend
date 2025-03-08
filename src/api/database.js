import * as SQLite from 'expo-sqlite';
import axios from "axios";

const db = SQLite.openDatabase('djournal.db');

export const setupDatabase = () => {
  db.transaction(tx => {
    tx.executeSql(
      `CREATE TABLE IF NOT EXISTS journals (
        journal_id INTEGER PRIMARY KEY AUTOINCREMENT,
        journal_title TEXT NOT NULL,
        journal_date TEXT NOT NULL,
        is_synced INTEGER DEFAULT 0
      );`
    );

    tx.executeSql(
      `CREATE TABLE IF NOT EXISTS entries (
        entry_id INTEGER PRIMARY KEY AUTOINCREMENT,
        journal_id INTEGER,
        entry_description TEXT NOT NULL,
        entry_datetime TEXT NOT NULL,
        is_synced INTEGER DEFAULT 0,
        FOREIGN KEY (journal_id) REFERENCES journals (journal_id)
      );`
    );
  });
};

export const saveJournalOffline = (title, date) => {
    return new Promise((resolve, reject) => {
        db.transaction(tx => {
        tx.executeSql(
            `INSERT INTO journals (journal_title, journal_date, is_synced) VALUES (?, ?, 0);`,
            [title, date],
            (_, result) => resolve(result.insertId),
            (_, error) => reject(error)
        );
        });
    });
};

export const syncOfflineData = async () => {
    db.transaction(tx => {
      tx.executeSql(`SELECT * FROM journals WHERE is_synced = 0;`, [], (_, { rows }) => {
        const journals = rows._array;
  
        journals.forEach(journal => {
          axios.post("https://your-api-url.com/journals", {
            journal_title: journal.journal_title,
            journal_date: journal.journal_date,
          })
          .then(() => {
            // Mark journal as synced
            db.transaction(tx => {
              tx.executeSql(`UPDATE journals SET is_synced = 1 WHERE journal_id = ?;`, [journal.journal_id]);
            });
          })
          .catch(error => console.log("Sync failed", error));
        });
      });
    });
};

export const getOfflineJournals = () => {
    return new Promise((resolve, reject) => {
      db.transaction(tx => {
        tx.executeSql(`SELECT * FROM journals;`, [], (_, { rows }) => {
          resolve(rows._array);
        }, (_, error) => reject(error));
      });
    });
};


  
export default db;
