import redisclient from '../utils/redis';
import db from '../utils/db';

class AppController {
  static getStatus(request, response) {
    const conn = {
      redis: redisclient.isAlive(),
      db: db.isAlive(),
    };
    response.status(200).send(conn);
  }

  static async getStats(request, response) {
    const count = {
      users: await db.nbUsers(),
      files: await db.nbFiles(),
    };

    response.status(200).send(count);
  }
}
export default AppController;
