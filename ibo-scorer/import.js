'use strict';

/* =========================================================
   Import rounds from another scoring app's spreadsheet export
   (.xlsx, or the same columns saved as CSV). Reads the file with
   no libraries: an .xlsx is a zip of XML files, unzipped with the
   browser's own DecompressionStream. Only Vegas 300 rounds map onto
   this app; anything else is listed as skipped with the reason.
   No DOM here, so it runs under node for tests.
   ========================================================= */

const OldImport = (() => {
  const VEGAS_ARROWS = 30, PER_END = 3;
  const points = v => (v === 'X' ? 10 : v);

  /* ---------- reading the file into rows of cells ---------- */

  // bytes: Uint8Array of the whole file. Returns an array of rows, each an
  // array of cell values (strings or numbers), header row first.
  async function readTable(bytes) {
    if (bytes[0] === 0x50 && bytes[1] === 0x4b) return readXlsx(bytes);   // "PK": a zip, so .xlsx
    return parseCsv(new TextDecoder().decode(bytes));
  }

  async function unzip(bytes) {
    const dv = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
    let eocd = -1;
    for (let i = bytes.length - 22; i >= Math.max(0, bytes.length - 65557); i--) {
      if (dv.getUint32(i, true) === 0x06054b50) { eocd = i; break; }
    }
    if (eocd < 0) throw new Error('The file is not a readable spreadsheet.');
    const count = dv.getUint16(eocd + 10, true);
    let p = dv.getUint32(eocd + 16, true);
    const files = {};
    for (let n = 0; n < count; n++) {
      if (dv.getUint32(p, true) !== 0x02014b50) throw new Error('The spreadsheet is damaged.');
      const method = dv.getUint16(p + 10, true);
      const size = dv.getUint32(p + 20, true);
      const nameLen = dv.getUint16(p + 28, true), extraLen = dv.getUint16(p + 30, true), commentLen = dv.getUint16(p + 32, true);
      const local = dv.getUint32(p + 42, true);
      const name = new TextDecoder().decode(bytes.subarray(p + 46, p + 46 + nameLen));
      const start = local + 30 + dv.getUint16(local + 26, true) + dv.getUint16(local + 28, true);
      files[name] = { method, data: bytes.subarray(start, start + size) };
      p += 46 + nameLen + extraLen + commentLen;
    }
    return async name => {
      const f = files[name];
      if (!f) return null;
      if (f.method === 0) return new TextDecoder().decode(f.data);
      if (f.method !== 8) throw new Error('The spreadsheet uses a compression this app cannot read.');
      const stream = new Blob([f.data]).stream().pipeThrough(new DecompressionStream('deflate-raw'));
      return new Response(stream).text();
    };
  }

  const xmlText = s => s
    .replace(/&(lt|gt|quot|apos|amp|#\d+|#x[0-9a-f]+);/gi, (m, e) => {
      const named = { lt: '<', gt: '>', quot: '"', apos: "'", amp: '&' }[e.toLowerCase()];
      if (named) return named;
      return String.fromCodePoint(e[1] === 'x' || e[1] === 'X' ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10));
    })
    .replace(/_x([0-9a-f]{4})_/gi, (m, h) => String.fromCharCode(parseInt(h, 16)));   // Excel's escape for \r etc.
  // All the text runs of one <si> or <is>, ignoring phonetic hints.
  const runs = xml => xmlText((xml.replace(/<rPh\b[\s\S]*?<\/rPh>/g, '')
    .match(/<t\b[^>]*>[\s\S]*?<\/t>/g) || []).map(t => t.replace(/^<t\b[^>]*>|<\/t>$/g, '')).join(''));
  const colIndex = ref => {
    let n = 0;
    for (const ch of ref.replace(/\d+$/, '')) n = n * 26 + ch.charCodeAt(0) - 64;
    return n - 1;
  };

  async function readXlsx(bytes) {
    const get = await unzip(bytes);
    const shared = ((await get('xl/sharedStrings.xml')) || '').match(/<si\b[\s\S]*?<\/si>/g) || [];
    const strings = shared.map(runs);
    const sheet = await firstSheet(get);
    if (!sheet) throw new Error('The spreadsheet has no sheets in it.');
    const rows = [];
    for (const [, body] of sheet.matchAll(/<row\b[^>]*>([\s\S]*?)<\/row>/g)) {
      const row = [];
      let next = 0;
      for (const [, attrs, inner = ''] of body.matchAll(/<c\b([^>]*?)(?:\/>|>([\s\S]*?)<\/c>)/g)) {
        const ref = /\br="([A-Z]+\d+)"/.exec(attrs);
        const col = ref ? colIndex(ref[1]) : next;
        next = col + 1;
        const type = (/\bt="(\w+)"/.exec(attrs) || [])[1];
        const v = /<v>([\s\S]*?)<\/v>/.exec(inner);
        let val = null;
        if (type === 's') val = v ? strings[+v[1]] : null;
        else if (type === 'inlineStr') val = runs(inner);
        else if (type === 'str' || type === 'e') val = v ? xmlText(v[1]) : null;
        else if (type === 'b') val = v ? v[1] === '1' : null;
        else if (v) val = Number(v[1]);
        row[col] = val;
      }
      rows.push(Array.from(row, c => (c === undefined ? null : c)));
    }
    return rows;
  }

  // The first sheet in the workbook's own order, falling back to sheet1.xml.
  async function firstSheet(get) {
    const wb = await get('xl/workbook.xml'), rels = await get('xl/_rels/workbook.xml.rels');
    const rid = wb && (/<sheet\b[^>]*\br:id="([^"]+)"/.exec(wb) || [])[1];
    if (rid && rels) {
      const rel = new RegExp(`<Relationship\\b[^>]*\\bId="${rid}"[^>]*>`).exec(rels);
      const target = rel && (/\bTarget="([^"]+)"/.exec(rel[0]) || [])[1];
      if (target) {
        const path = target.startsWith('/') ? target.slice(1) : 'xl/' + target.replace(/^\.\//, '');
        const xml = await get(path);
        if (xml) return xml;
      }
    }
    return get('xl/worksheets/sheet1.xml');
  }

  // RFC 4180 CSV (quoted cells may hold commas, tabs and line breaks).
  function parseCsv(text) {
    text = text.replace(/^﻿/, '');
    const sep = (text.split(/\r?\n/)[0].match(/;/g) || []).length > (text.split(/\r?\n/)[0].match(/,/g) || []).length ? ';' : ',';
    const rows = [];
    let row = [], cell = '', q = false;
    for (let i = 0; i < text.length; i++) {
      const c = text[i];
      if (q) {
        if (c === '"' && text[i + 1] === '"') { cell += '"'; i++; }
        else if (c === '"') q = false;
        else cell += c;
      } else if (c === '"') q = true;
      else if (c === sep) { row.push(cell); cell = ''; }
      else if (c === '\n' || c === '\r') {
        if (c === '\r' && text[i + 1] === '\n') i++;
        row.push(cell); rows.push(row); row = []; cell = '';
      } else cell += c;
    }
    if (cell !== '' || row.length) { row.push(cell); rows.push(row); }
    return rows;
  }

  /* ---------- turning rows into rounds ---------- */

  const str = v => (v == null ? '' : String(v).trim());

  // Excel stores dates as days since 1899-12-30 in the phone's local time.
  function toTime(date, time) {
    if (typeof date === 'number' && isFinite(date)) {
      const u = new Date(Math.round((date - 25569) * 86400000));
      return new Date(u.getUTCFullYear(), u.getUTCMonth(), u.getUTCDate(),
        u.getUTCHours(), u.getUTCMinutes(), u.getUTCSeconds()).getTime();
    }
    const s = str(date);
    if (!s) return null;
    let t = Date.parse(s.replace(' ', 'T'));
    if (isNaN(t)) t = Date.parse(`${s} ${str(time).replace(/ /g, ' ')}`);
    if (isNaN(t)) t = Date.parse(s);
    return isNaN(t) ? null : t;
  }

  // One arrow as this app stores it: 'X', 10 to 6, 0 (miss) or null (not shot).
  // A Vegas face has no rings below 6, so 1 to 5 can only be a mistake; they are
  // kept as their own value so the total still matches the old app.
  function arrowValue(raw) {
    const s = str(raw).toUpperCase();
    if (!s) return null;
    if (s === 'X') return 'X';
    if (s === 'M' || s === '0') return 0;
    if (/^(10|[1-9])$/.test(s)) return Number(s);
    return undefined;
  }

  function arrowsOf(rec) {
    const listed = str(rec.RoundArrows);
    if (listed) return listed.split('\t').map(arrowValue);
    // Fall back to the per-end text: "Dist #1 \tEnd #1 \t10 \t9 \tX \tArrowAvg ..."
    const out = [];
    for (const line of str(rec.RoundEnds).split(/\r?\n/)) {
      const cells = line.split('\t').map(str);
      const at = cells.findIndex(c => /^End #/i.test(c));
      if (at < 0) continue;
      const stop = cells.findIndex((c, i) => i > at && /^[A-Za-z]{2,}/.test(c) && c !== 'X');
      out.push(...cells.slice(at + 1, stop < 0 ? undefined : stop).map(arrowValue));
    }
    return out;
  }

  // rows: from readTable. Returns { entries, skipped } where each entry is a
  // ready-to-import round minus its archer, and skipped lists what was left out.
  function parse(rows) {
    const head = (rows[0] || []).map(str);
    if (!head.includes('RoundName') || !(head.includes('RoundArrows') || head.includes('RoundEnds'))) {
      throw new Error('This file does not look like a score export. It needs RoundName and RoundArrows columns.');
    }
    const entries = [], skipped = [];
    rows.slice(1).forEach((cells, n) => {
      if (!cells || cells.every(c => str(c) === '')) return;
      const rec = {};
      head.forEach((h, i) => { if (h) rec[h] = cells[i]; });
      const name = str(rec.RoundName) || str(rec.EntryType) || `Row ${n + 2}`;
      const createdAt = toTime(rec.EntryDate, rec.EntryTime);
      const skip = reason => skipped.push({ name, createdAt, reason });
      if (rec.EntryType != null && str(rec.EntryType) && !/round/i.test(str(rec.EntryType))) return skip('Not a scored round');
      if (!/vegas/i.test(name)) return skip('Only Vegas 300 rounds can be imported');
      const max = Number(rec.RoundMaxArrowCount);
      if (max && max !== VEGAS_ARROWS) return skip(`${max} arrows; only 30-arrow Vegas rounds fit`);
      const arrows = arrowsOf(rec);
      if (arrows.some(v => v === undefined)) return skip('Has arrow values this app does not recognise');
      if (arrows.slice(VEGAS_ARROWS).some(v => v != null)) return skip('More than 30 arrows');
      if (createdAt == null) return skip('No date');
      const flat = Array.from({ length: VEGAS_ARROWS }, (_, i) => (arrows[i] === undefined ? null : arrows[i]));
      const shot = flat.filter(v => v != null).length;
      if (!shot) return skip('No arrows scored');
      const ends = Array.from({ length: VEGAS_ARROWS / PER_END }, (_, e) => flat.slice(e * PER_END, e * PER_END + PER_END));
      const total = flat.reduce((s, v) => s + (v == null ? 0 : points(v)), 0);
      const xs = flat.filter(v => v === 'X').length;
      const firstOpen = ends.findIndex(end => end.some(v => v == null));
      const base = [str(rec.EventName), str(rec.EventLocation)].filter(Boolean).join(', ') || str(rec.CompetitionLevel);
      const note = base ? `${base.slice(0, 48)}, imported` : 'Imported';
      const id = str(rec.EntryID);
      entries.push({
        key: id ? `${str(rec.DeviceID)}:${id}` : `${createdAt}:${flat.join(',')}`,
        name, createdAt, ends, total, xs, shot,
        listedScore: rec.Score == null || str(rec.Score) === '' ? null : Number(rec.Score),
        complete: shot === VEGAS_ARROWS,
        current: firstOpen < 0 ? ends.length - 1 : firstOpen,
        note,
        archerName: str(rec.ArchersName)
      });
    });
    entries.sort((a, b) => a.createdAt - b.createdAt);
    return { entries, skipped };
  }

  // A round in this app's shape. Rounds with every arrow are finished; a round
  // stopped part way stays in progress so it does not drag down averages.
  function toRound(entry, archerId, id) {
    return {
      id, createdAt: entry.createdAt, note: entry.note, type: 'vegas', targets: entry.ends.length,
      archerIds: [archerId], scores: { [archerId]: entry.ends.map(e => [...e]) },
      current: entry.current, status: entry.complete ? 'finished' : 'in_progress', plot: false,
      source: { app: 'import', key: entry.key }
    };
  }

  return { readTable, parse, toRound, parseCsv };
})();

if (typeof module !== 'undefined') module.exports = OldImport;
