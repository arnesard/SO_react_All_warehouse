const mysql = require("mysql2/promise");

/**
 * Mirrors the multi-connection setup from the Laravel app's config/database.php:
 *   - mysql        -> poolUtama   (main application DB: so_all_wh_*, dashboard/tag stock/appkso tables)
 *   - fginvc       -> poolFginvc  (EDP source DB — cntso, fgloc/rack tables, latin1 charset)
 *   - bcmcfgv1     -> poolBcmcfgv1 (barcode config DB, latin1 charset)
 *
 * All three are optional at boot: a pool is only created if its *_HOST env var is set,
 * so you can bring modules online one DB at a time.
 */

function makePool(prefix, extra = {}) {
  const host = process.env[`${prefix}_HOST`];
  if (!host) return null;

  return mysql.createPool({
    host,
    port: Number(process.env[`${prefix}_PORT`] || 3306),
    user: process.env[`${prefix}_USER`] || "root",
    password: process.env[`${prefix}_PASSWORD`] || "",
    database: process.env[`${prefix}_DATABASE`],
    waitForConnections: true,
    connectionLimit: Number(process.env[`${prefix}_POOL_LIMIT`] || 10),
    queueLimit: 0,
    dateStrings: true,
    ...extra,
  });
}

const poolUtama = makePool("DB_MAIN");
const poolFginvc = makePool("DB_FGINVC", { charset: "latin1_swedish_ci" });
const poolBcmcfgv1 = makePool("DB_BCMCFGV1", { charset: "latin1_swedish_ci" });

module.exports = { poolUtama, poolFginvc, poolBcmcfgv1 };
