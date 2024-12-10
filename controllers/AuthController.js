import crypto from 'crypto';
import { v4 as uuidv4 } from 'uuid';
import dbClient from '../utils/db';
import redisClient from '../utils/redis';

class AuthController {
  static async getConnect(request, response) {
    const authheader = request.header('Authorization');
    if (!authheader) {
      return response.status(401).send({ error: 'Unauthorized' });
    }
    const basecred = authheader.split(' ')[1];
    const cred = Buffer.from(basecred, 'base64').toString('utf8');
    const [email, password] = cred.split(':');
    if (!email || !password) {
      return response.status(401).send({ error: 'Unauthorized' });
    }
    const hashpassword = crypto.createHash('sha1')
      .update(password)
      .digest('hex');
    const collection = dbClient.db.collection('users');
    const user = await collection.findOne({ email, password: hashpassword });
    if (!user) {
      return response.status(401).send({ error: 'Unauthorized' });
    }
    const token = uuidv4();
    try {
      await redisClient.set(`auth_${token}`, user._id.toString(), 60 * 60 * 24);
    } catch (error) {
      return response.status(500).send({ error: 'server error in redis' });
    }
    return response.status(200).send({ token });
  }

  static async getDisconnect(request, response) {
    const tokenheader = request.header('X-Token');
    const userid = await redisClient.get(`auth_${tokenheader}`);
    if (!userid) {
      response.status(401).send({ error: 'Unauthorized' });
    } else {
      redisClient.del(`auth_${tokenheader}`);
      response.status(204).send();
    }
  }
}
export default AuthController;
