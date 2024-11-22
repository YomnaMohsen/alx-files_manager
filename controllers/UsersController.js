import crypto from 'crypto';
import dbClient from '../utils/db';

class UsersController {
  static async postNew(req, res) {
    const { email, password } = req.body;
    console.log(email);
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
    return res.status(201).send({ id: result.insertId, email });
  }
}
export default UsersController;
