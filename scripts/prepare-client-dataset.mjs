import { readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { USD_TO_INR_RATE } from '../src/data/currency.js';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const input = resolve(root, 'data/sic_mobile_spec_PJ1 - Sheet1.csv');
const output = resolve(root, 'src/data/clientPhones.json');

function parseCsv(text) {
  const rows = [];
  let row = [];
  let cell = '';
  let quoted = false;

  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];
    if (quoted) {
      if (char === '"' && text[i + 1] === '"') {
        cell += '"';
        i += 1;
      } else if (char === '"') {
        quoted = false;
      } else {
        cell += char;
      }
    } else if (char === '"') {
      quoted = true;
    } else if (char === ',') {
      row.push(cell);
      cell = '';
    } else if (char === '\n') {
      row.push(cell.replace(/\r$/, ''));
      rows.push(row);
      row = [];
      cell = '';
    } else {
      cell += char;
    }
  }

  if (cell.length || row.length) {
    row.push(cell.replace(/\r$/, ''));
    rows.push(row);
  }
  return rows;
}

function number(value, field, rowNumber) {
  const parsed = Number(String(value).replace(/[$,]/g, '').trim());
  if (!Number.isFinite(parsed)) {
    throw new Error(`Invalid ${field} on CSV row ${rowNumber}: ${value}`);
  }
  return parsed;
}

function storageGB(value, rowNumber) {
  const match = String(value).trim().match(/^(\d+(?:\.\d+)?)\s*(GB|TB)?$/i);
  if (!match) throw new Error(`Invalid storage on CSV row ${rowNumber}: ${value}`);
  const capacity = Number(match[1]);
  return match[2]?.toUpperCase() === 'TB' ? capacity * 1024 : capacity;
}

const text = await readFile(input, 'utf8');
const [headers, ...rows] = parseCsv(text.replace(/^\uFEFF/, ''));
const expected = [
  'name', 'rating', 'price', 'camera', 'display_type', 'display_size',
  'battery', 'storage', 'ram', 'weight', 'processor',
];
if (JSON.stringify(headers) !== JSON.stringify(expected)) {
  throw new Error(`Unexpected CSV columns: ${headers.join(', ')}`);
}

const phones = rows.filter((row) => row.some((cell) => cell.trim())).map((row, index) => {
  const rowNumber = index + 2;
  if (row.length !== headers.length) {
    throw new Error(`Expected ${headers.length} columns on CSV row ${rowNumber}, got ${row.length}`);
  }
  const record = Object.fromEntries(headers.map((header, i) => [header, row[i].trim()]));
  const name = record.name;
  if (!name) throw new Error(`Missing name on CSV row ${rowNumber}`);
  const processor = /^not mentioned$/i.test(record.processor) ? null : record.processor;
  const displayType = /^other_types$/i.test(record.display_type)
    ? 'Other / not specified'
    : record.display_type;
  const priceUSD = number(record.price, 'price', rowNumber);

  return {
    id: `client-${String(index + 1).padStart(3, '0')}`,
    name,
    brand: name.split(/\s+/)[0],
    rating: number(record.rating, 'rating', rowNumber),
    priceUSD,
    priceINR: Math.round(priceUSD * USD_TO_INR_RATE),
    cameraMP: number(record.camera, 'camera', rowNumber),
    displayType,
    screenInches: number(record.display_size, 'display_size', rowNumber),
    batteryMah: number(record.battery, 'battery', rowNumber),
    storageGB: storageGB(record.storage, rowNumber),
    ramGB: number(record.ram, 'ram', rowNumber),
    weightGrams: number(record.weight, 'weight', rowNumber),
    processor,
  };
});

if (!phones.length) throw new Error('The client CSV contains no phone rows.');
await writeFile(output, `${JSON.stringify(phones, null, 2)}\n`);
console.log(`Prepared ${phones.length} client phone records → ${output}`);
