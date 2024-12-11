import { ObjectId } from 'mongodb';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import dbClient from '../utils/db';
import redisClient from '../utils/redis';

class FilesController {
  static async getuser(request) {
    const tokenheader = request.header('X-Token');
    const userid = await redisClient.get(`auth_${tokenheader}`);
    if (!userid) {
      return null;
    }
    const collection = dbClient.db.collection('users');
    const finduser = await collection.findOne({ _id: ObjectId(userid) });
    if (!finduser) {
      return null;
    }
    return finduser;
  }

  static async postUpload(req, res) {
    const user = await FilesController.getuser(req);
    if (!user) {
     return  res.status(401).send({ error: 'Unauthorized' });
    }
    const collection = dbClient.db.collection('files');
    const { name } = req.body.name;
    const { type } = req.body.type;
    const { parentId } = req.body.parentId || 0;
    const { isPublic } = req.body.isPublic || false;
    const { data } = req.body.data;

    if (!name) {
      res.status(400).send({ error: 'Missing name' });
    }
    if (!type) {
      res.status(400).send({ error: 'Missing type' });
    }
    if (type !== 'folder' && !data) {
      res.status(400).send({ error: 'Missing data' });
    }

    if (parentId !== 0) {
      const foundParent = await collection.findOne({ _id: ObjectId(parentId) });
      if (!foundParent) {
        return res.status(400).send({ error: 'Parent not found' });
      }
      if (foundParent.type !== 'folder') {
        return res.status(400).send({ error: 'Parent is not a folder' });
      }
    }
    let filedb;
    try {
      if (type === 'folder') {
        filedb = await collection.insertOne({
          userId: user._id,
          name,
          type,
          isPublic,
          parentId: parentId || 0,
        });

      } else {
        const folderPath = process.env.FOLDER_PATH || '/tmp/files_manager';
        if (!fs.existsSync(folderPath)) {
          fs.mkdirSync(folderPath, { recursive: true }, () => {});
        }
        const fileName = uuidv4();
        const localPath = `${folderPath}/${fileName}`;
        const clearData = Buffer.from(data, 'base64').toString();
        await fs.promises.writeFile(localPath, clearData);
        filedb = await collection.insertOne({
          userId: user._id,
          name,
          type,
          isPublic,
          parentId: parentId || 0,
          localPath,
        });
        return res.status(201).send({
          id: filedb._id,
          userId: user._id,
          name,
          type,
          isPublic,
          parentId,
        });
      }
    } catch (error) {
      console.log(error);
      return res.status(500).send({ error: 'Server error with db' }); 
    }
  }
}
export default FilesController;
