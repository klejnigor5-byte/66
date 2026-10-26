const { ObjectId } = require("mongodb");
const mongoose = require("mongoose");

const COLLECTION = "crud_records";
const collection = () => mongoose.connection.db.collection(COLLECTION);

function isObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}
function parseId(id) {
  return ObjectId.isValid(id) && String(new ObjectId(id)) === id ? new ObjectId(id) : null;
}
function filterFromBody(body) {
  // Bulk operations accept a simple equality filter, e.g. { "category": "books" }.
  // Prevent callers from passing MongoDB operators through the API.
  if (!isObject(body) || Object.keys(body).length === 0) return null;
  if (Object.keys(body).some((key) => key.startsWith("$"))) return null;
  return body;
}
function projectionFromQuery(fields) {
  if (!fields) return { passwordHash: 0, password: 0 };
  const projection = {};
  for (const field of fields.split(",").map((x) => x.trim()).filter(Boolean)) {
    if (!field.startsWith("$") && !field.includes(".")) projection[field] = 1;
  }
  projection._id = 1;
  return projection;
}

async function findRecords(req, res, next) {
  try {
    const limit = Math.min(Math.max(Number.parseInt(req.query.limit, 10) || 50, 1), 100);
    const records = await collection()
      .find({}, { projection: projectionFromQuery(req.query.fields) })
      .limit(limit)
      .toArray();
    res.json({ count: records.length, records });
  } catch (error) { next(error); }
}

async function insertOne(req, res, next) {
  try {
    if (!isObject(req.body) || !Object.keys(req.body).length) return res.status(400).json({ error: "Body must be a non-empty JSON object." });
    const doc = { ...req.body, createdAt: new Date(), updatedAt: new Date() };
    delete doc._id;
    const result = await collection().insertOne(doc);
    res.status(201).json({ acknowledged: result.acknowledged, insertedId: result.insertedId, record: { _id: result.insertedId, ...doc } });
  } catch (error) { next(error); }
}

async function insertMany(req, res, next) {
  try {
    if (!Array.isArray(req.body) || req.body.length === 0 || req.body.length > 100 || !req.body.every(isObject)) {
      return res.status(400).json({ error: "Body must be a non-empty array of up to 100 JSON objects." });
    }
    const now = new Date();
    const docs = req.body.map((item) => { const doc = { ...item, createdAt: now, updatedAt: now }; delete doc._id; return doc; });
    const result = await collection().insertMany(docs);
    res.status(201).json({ acknowledged: result.acknowledged, insertedCount: result.insertedCount, insertedIds: result.insertedIds });
  } catch (error) { next(error); }
}

async function updateOne(req, res, next) {
  try {
    const _id = parseId(req.params.id);
    if (!_id) return res.status(400).json({ error: "Invalid record ID." });
    if (!isObject(req.body) || !Object.keys(req.body).length || Object.keys(req.body).some((k) => k.startsWith("$") || k === "_id")) return res.status(400).json({ error: "Body must contain fields to update; operators and _id are not allowed." });
    const result = await collection().updateOne({ _id }, { $set: { ...req.body, updatedAt: new Date() } });
    res.json({ acknowledged: result.acknowledged, matchedCount: result.matchedCount, modifiedCount: result.modifiedCount });
  } catch (error) { next(error); }
}

async function updateMany(req, res, next) {
  try {
    const filter = filterFromBody(req.body?.filter);
    const update = req.body?.update;
    if (!filter || !isObject(update) || !Object.keys(update).length || Object.keys(update).some((k) => k.startsWith("$") || k === "_id")) return res.status(400).json({ error: "Provide { filter: { field: value }, update: { field: value } }." });
    const result = await collection().updateMany(filter, { $set: { ...update, updatedAt: new Date() } });
    res.json({ acknowledged: result.acknowledged, matchedCount: result.matchedCount, modifiedCount: result.modifiedCount });
  } catch (error) { next(error); }
}

async function replaceOne(req, res, next) {
  try {
    const _id = parseId(req.params.id);
    if (!_id) return res.status(400).json({ error: "Invalid record ID." });
    if (!isObject(req.body) || !Object.keys(req.body).length || Object.keys(req.body).some((k) => k.startsWith("$") || k === "_id")) return res.status(400).json({ error: "Body must be a non-empty replacement JSON object; _id and operators are not allowed." });
    const result = await collection().replaceOne({ _id }, { ...req.body, updatedAt: new Date() });
    res.json({ acknowledged: result.acknowledged, matchedCount: result.matchedCount, modifiedCount: result.modifiedCount });
  } catch (error) { next(error); }
}

async function deleteOne(req, res, next) {
  try {
    const _id = parseId(req.params.id);
    if (!_id) return res.status(400).json({ error: "Invalid record ID." });
    const result = await collection().deleteOne({ _id });
    res.json({ acknowledged: result.acknowledged, deletedCount: result.deletedCount });
  } catch (error) { next(error); }
}

async function deleteMany(req, res, next) {
  try {
    const filter = filterFromBody(req.body?.filter);
    if (!filter) return res.status(400).json({ error: "Provide a non-empty equality filter in JSON: { \"filter\": { \"field\": \"value\" } }." });
    const result = await collection().deleteMany(filter);
    res.json({ acknowledged: result.acknowledged, deletedCount: result.deletedCount });
  } catch (error) { next(error); }
}

module.exports = { findRecords, insertOne, insertMany, updateOne, updateMany, replaceOne, deleteOne, deleteMany };
