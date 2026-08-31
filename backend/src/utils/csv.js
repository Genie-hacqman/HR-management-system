/**
 * Converts an array of row objects into a CSV string given an ordered
 * column spec [{ key, label }]. Values are stringified and any field
 * containing a comma, quote, or newline is quoted and internal quotes
 * doubled, per standard CSV escaping.
 */
function toCSV(rows, columns) {
  const escape = (value) => {
    if (value === null || value === undefined) return '';
    const str = String(value);
    if (/[",\n]/.test(str)) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const header = columns.map((c) => escape(c.label)).join(',');
  const lines = rows.map((row) => columns.map((c) => escape(row[c.key])).join(','));
  return [header, ...lines].join('\n');
}

module.exports = { toCSV };
