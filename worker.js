import Queue from 'bull';
import dbClient from './utils/db';
import FilesController from '/controllers/FilesController';
import imageThumbnail from 'image-thumbnail';
const fileQueue = new Queue('fileQueue');
import { ObjectId } from 'mongodb';
import fs from 'node:fs/promises';

fileQueue.process(async function (job, done) {
	const { fileId, userId } = job.data;
	const sizes = [500, 250, 100];
	if (!fileId) {
		throw new Error('Missing fileId');
	}
	if (!userId) {
                throw new Error('Missing fileId');
	}
	const docFound = await dbClient.db.collection('files').findOne({
		_id: new ObjectId(fileId),
		userId: new ObjectId(userId)
	});
	if (!docFound) {
		throw new Error('File not found');
	}
	for (let size in sizes) {
		const thumbnail await imageThumbnail(docFound.localPath, { width: size });

		const ext = path.extname(docFound.localPath);

		const newFilePath = docFound.localPath.replace(ext, `_${size}${ext}`);

		fs.writeFileSync(newFilePath, thumbnail);
	}
	done();
});
