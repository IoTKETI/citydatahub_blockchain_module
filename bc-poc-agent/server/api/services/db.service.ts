
import * as mongoose from 'mongoose';
import { User, UserModel } from '../controllers/users/controller';

export class DBService {
    constructor() { }

    delete(user: User): mongoose.Query<void> {
        return UserModel.remove({userId: user.userId});
    }

    update(user: User): mongoose.Query<number> {
        return UserModel.update({userId: user.userId}, {...user});
    }

    read(query: any): mongoose.DocumentQuery<User[], User> {
        return UserModel.find(query);
    }

    create(user:User): Promise<User> {
        let u = new UserModel(user);
        return u.save();
    }
}