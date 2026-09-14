(function () {
  "use strict";

  var DB_NAME = "registration-table";
  var DB_VERSION = 1;
  var STORE_NAME = "records";
  var dbPromise = null;

  function supportsIndexedDB() {
    return typeof window !== "undefined" && "indexedDB" in window && window.indexedDB !== null;
  }

  function openDatabase() {
    if (!supportsIndexedDB()) {
      return Promise.reject(new Error("当前浏览器不支持 IndexedDB。"));
    }

    if (dbPromise) {
      return dbPromise;
    }

    dbPromise = new Promise(function (resolve, reject) {
      var request = window.indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = function () {
        var db = request.result;
        var store;

        if (!db.objectStoreNames.contains(STORE_NAME)) {
          store = db.createObjectStore(STORE_NAME, { keyPath: "id", autoIncrement: true });
        } else {
          store = request.transaction.objectStore(STORE_NAME);
        }

        if (!store.indexNames.contains("name")) {
          store.createIndex("name", "name", { unique: false });
        }

        if (!store.indexNames.contains("department")) {
          store.createIndex("department", "department", { unique: false });
        }

        if (!store.indexNames.contains("updatedAt")) {
          store.createIndex("updatedAt", "updatedAt", { unique: false });
        }
      };

      request.onsuccess = function () {
        resolve(request.result);
      };

      request.onerror = function () {
        dbPromise = null;
        reject(request.error || new Error("无法打开本地数据库。"));
      };

      request.onblocked = function () {
        dbPromise = null;
        reject(new Error("数据库升级被其他页面阻塞，请关闭该应用的其它标签页后重试。"));
      };
    });

    return dbPromise;
  }

  function runTransaction(mode, operation) {
    return openDatabase().then(function (db) {
      return new Promise(function (resolve, reject) {
        var transaction = db.transaction(STORE_NAME, mode);
        var result;
        var settled = false;

        function fail(error) {
          if (!settled) {
            settled = true;
            reject(error || new Error("本地数据库操作失败。"));
          }
        }

        transaction.oncomplete = function () {
          if (!settled) {
            settled = true;
            resolve(result);
          }
        };

        transaction.onerror = function () {
          fail(transaction.error);
        };

        transaction.onabort = function () {
          fail(transaction.error || new Error("本地数据库操作已取消。"));
        };

        try {
          var request = operation(transaction.objectStore(STORE_NAME));

          if (request) {
            request.onsuccess = function () {
              result = request.result;
            };
            request.onerror = function () {
              fail(request.error);
            };
          }
        } catch (error) {
          try {
            transaction.abort();
          } catch (abortError) {
            // 事务可能已经结束，直接返回原始错误。
          }
          fail(error);
        }
      });
    });
  }

  function normalizeText(value, maxLength) {
    return String(value || "").trim().slice(0, maxLength);
  }

  function normalizeRecord(data) {
    return {
      name: normalizeText(data.name, 60),
      phone: normalizeText(data.phone, 30),
      email: normalizeText(data.email, 120),
      department: normalizeText(data.department, 80),
      status: normalizeText(data.status || "在职", 10),
      note: normalizeText(data.note, 500)
    };
  }

  function timestamps() {
    return new Date().toISOString();
  }

  function getAllRecords() {
    return runTransaction("readonly", function (store) {
      return store.getAll();
    }).then(function (records) {
      return (records || []).sort(function (a, b) {
        return String(b.updatedAt || "").localeCompare(String(a.updatedAt || ""));
      });
    });
  }

  function addRecord(data) {
    var normalized = normalizeRecord(data);
    var now = timestamps();
    var record = Object.assign({}, normalized, {
      createdAt: now,
      updatedAt: now
    });

    return runTransaction("readwrite", function (store) {
      return store.add(record);
    }).then(function (id) {
      return Object.assign({}, record, { id: id });
    });
  }

  function updateRecord(id, data) {
    var numericId = Number(id);

    return getRecord(numericId).then(function (existing) {
      if (!existing) {
        throw new Error("要编辑的记录不存在，可能已被删除。");
      }

      var updated = Object.assign({}, existing, normalizeRecord(data), {
        id: numericId,
        updatedAt: timestamps()
      });

      return runTransaction("readwrite", function (store) {
        return store.put(updated);
      }).then(function () {
        return updated;
      });
    });
  }

  function getRecord(id) {
    return runTransaction("readonly", function (store) {
      return store.get(id);
    });
  }

  function deleteRecord(id) {
    return runTransaction("readwrite", function (store) {
      return store.delete(id);
    });
  }

  window.RegistrationDB = {
    supportsIndexedDB: supportsIndexedDB,
    open: openDatabase,
    getAll: getAllRecords,
    get: getRecord,
    add: addRecord,
    update: updateRecord,
    remove: deleteRecord
  };
})();
