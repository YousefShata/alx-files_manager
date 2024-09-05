import fs from 'node:fs/promises';
import { ObjectId } from 'mongodb';
import { v4 as uuid } from 'uuid';
import path from 'path';
import mime from 'mime-types';
import dbClient from '../utils/db';
import redisClient from '../utils/redis';
import Queue from 'bull';
const fileQueue = new Queue('fileQueue');

class FilesController {
  static async postUpload(req, res) {
    const token = req.headers['x-token'];
    const foundToken = await redisClient.get(`auth_${token}`);
    if (!foundToken) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const {
      name, type, parentId = 0, isPublic = false, data,
    } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Missing name' });
    }

    if (!type || !['folder', 'file', 'image'].includes(type)) {
      res.status(400).json({ error: 'Missing type' });
    }

    if (!data && type !== 'folder') {
      res.status(400).json({ error: 'Missing data' });
    }

    const parentFound = await dbClient.db.collection('files').findOne({
      _id: new ObjectId(parentId),
    });
    if (!parentFound) {
      return res.status(400).json({ error: 'Parent not found' });
    }

    if (parentFound.type !== 'folder') {
      return res.status(400).json({ error: 'Parent is not a folder' });
    }

    if (type === 'folder') {
      const result = await dbClient.db.collection('files').insertOne({
        userId: new ObjectId(foundToken),
        name,
        type,
        isPublic,
        parentId: parentId !== 0 ? parentId : 0,
      });
      res.status(201).json({ result });
    }
    try {
      const uuid4 = uuid();
      const folderPath = process.env.FOLDER_PATH || '/tmp/files_manager';
      const fileBuffer = Buffer.from(data, 'base64');
      const localPath = path.join(folderPath, uuid4);
      await fs.writeFile(localPath, fileBuffer);

      const result = await dbClient.db.collection('files').insertOne({
        userId: new ObjectId(foundToken),
        name,
        type,
        isPublic,
        parentId: parentId !== 0 ? parentId : 0,
        localPath,
      });
	    if (type === 'image') {
		    fileQueue.add({
			    userId: foundToken,
			    fileId: result.insertedId.toString();
		    });
	    }
      return res.status(201).json({ result });
    } catch (err) {
      return res.status(500).json({ error: err });
    }
  }

  static async getShow(req, res) {
    const { id } = req.params;
    const token = req.headers['x-token'];
    const foundToken = await redisClient.get(`auth_${token}`);
    if (!foundToken) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const docFound = await dbClient.db.collection('files').findOne({
      _id: new ObjectId(id),
      userId: new ObjectId(token),
    });
    if (!docFound) {
      return res.status(404).json({ error: 'Not found' });
    }
    return res.status(200).json({ docFound });
  }

  static async getIndex(req, res) {
    const token = req.headers['x-token'];
    const foundToken = await redisClient.get(`auth_${token}`);
    if (!foundToken) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const parentId = req.query.parentId || 0;
    const page = parseInt(req.query.page, 10) || 0;
    const itemsPerPage = 20;
    const skipCount = page * itemsPerPage;

    const pipeline = [
      { $match: { parentId } },
      { $skip: skipCount },
      { $limit: itemsPerPage },
	});
    ];
    try {
      const files = await dbClient.db.collection('files').aggregate(pipeline).toArray();
      return res.status(200).json(files);
    } catch (err) {
      return res.status(500).send('Internal Server Error');
    }
  }

  static async putPublish(req, res) {
    const { id } = req.params;
    const token = req.headers['x-token'];
    const foundToken = await redisClient.get(`auth_${token}`);
    if (!foundToken) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const docFound = await dbClient.db.collection('files').findOne({
      _id: new ObjectId(id),
      userId: new ObjectId(foundToken),
    });
    if (!docFound) {
      return res.status(404).json({ error: 'Not found' });
    }
    const publishedDoc = await dbClient.db.collection('files').updateOne({
      _id: new ObjectId(id),
      userId: new ObjectId(token),
    },
    { $set: { isPublic: true } });
    return res.status(200).json({ publishedDoc });
  }

  static async putUnpublish(req, res) {
    const { id } = req.params;
    const token = req.headers['x-token'];
    const foundToken = await redisClient.get(`auth_${token}`);
    if (!foundToken) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const docFound = await dbClient.db.collection('files').findOne({
      _id: new ObjectId(id),
      userId: new ObjectId(foundToken),
    });
    if (!docFound) {
      return res.status(404).json({ error: 'Not found' });
    }
    const publishedDoc = await dbClient.db.collection('files').updateOne({
      _id: new ObjectId(id),
      userId: new ObjectId(token),
    },
    { $set: { isPublic: false } });
    return res.status(200).json({ publishedDoc });
  }

  static async getFile(req, res) {
    const { id } = req.params;
    const size = req.query.size;
    const allowedSizes = [500, 250, 100];
    const token = req.headers['x-token'];
    const user = await redisClient.get(`auth_${token}`);
    const docFound = await dbClient.db.collection('files').findOne({
      _id: new ObjectId(id),
    });
    if (!docFound) {
      return res.status(404).json({ error: 'Not found' });
    }
    if (docFound.isPublic === false) {
      if (!user || docFound.userId !== user) {
        return res.status(404).json({ error: 'Not found' });
      }
    }
    if (docFound.type === 'folder') {
      return res.status(400).json({ error: 'A folder doesn\'t have content' });
    }
    if (!docFound.localPath) {
      return res.status(404).json({ error: 'Not found' });
    }
	  if (size && allowedSizes.includes(parseInt(size))) {
		  const ext = path.extname(!docFound.localPath);
    		docFound.localPath = docFound.localPath.replace(ext, `_${size}${ext}`);
	  }
    const mimeType = mime.lookup(docFound.name);

    try {
      const data = await fs.readFile(docFound.localPath);
      res.setHeader('Content-Type', mimeType);
      return res.status(200).send(data);
    } catch (err) {
      return res.status(500).send('Error reading file');
    }
  }
}

module.exports = FilesController;
