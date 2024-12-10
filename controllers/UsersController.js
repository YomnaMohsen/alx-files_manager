import crypto from 'crypto';
import { ObjectId } from 'mongodb';
import dbClient from '../utils/db';
import redisClient from '../utils/redis';

class UsersController {
  static async postNew(req, res) {
    const { email, password } = req.body;
    if (!email) {
      return res.status(400).send({ error: 'Missing email' });
    }
    if (!password) {
      return res.status(400).send({ error: 'Missing password' });
    }
    const collection = dbClient.db.collection('users');
    const user = await collection.findOne({ email });
    if (user) {
      return res.status(400).send({ error: 'Already exist' });
    }
    const hashpassword = crypto.createHash('sha1')
      .update(password)
      .digest('hex');
    const result = await collection.insertOne({ email, password: hashpassword });
    return res.status(201).send({ id: result.insertedId, email });
  }

  static async getMe(request, response) {
    const tokenheader = request.header('X-Token');
    if (!tokenheader) {
      response.status(401).send({ error: 'Unauthorized' });
    }
    const userid = await redisClient.get(`auth_${tokenheader}`);
    if (!userid) {
      response.status(401).send({ error: 'Unauthorized' });
    } else {
      const collection = dbClient.db.collection('users');
      const finduser = await collection.findOne({ _id: ObjectId(userid) });
      if (!finduser) {
        response.status(401).send({ error: 'Unauthorized' });
      } else {
        response.status(200).send({ id: finduser._id, email: finduser.email });
      }
    }
  }
}
export default UsersController;
