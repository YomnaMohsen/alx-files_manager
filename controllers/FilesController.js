import { ObjectId } from 'mongodb';
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
    const user = await this.getuser(req);
    if (!user) {
      res.status(401).send({ error: 'Unauthorized' });
    }
    const { name } = req.body.name;
    const { type } = req.body.type;
    const { parentId } = req.body.parentId;
    const { isPublic } = req.body.parentId || false;
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
      const collection = dbClient.db.collection('files');
      const foundParent = await collection.findOne({ _id: ObjectId(parentId) });
      if (!foundParent){
        res.status(400).send({ error: 'Parent not found' });
      }
      if (foundParent.type !== 'folder'){
        res.status(400).send({ error: 'Parent is not a folder' });
      }

    }
  }
}
export default FilesController;
