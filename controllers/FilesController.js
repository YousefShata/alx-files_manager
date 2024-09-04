import fs from 'node:fs/promises';
import { ObjectId } from 'mongodb';
import { v4 as uuid } from 'uuid';
import path from 'path';
import dbClient from '../utils/db';
import redisClient from '../utils/redis';

class FilesController {
  static async getStatus(req, res) {
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
      return res.status(201).json({ result });
    } catch (err) {
      return res.status(500).json({ error: err });
    }
  }
}

module.exports = FilesController;
