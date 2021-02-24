import { login } from "./mutations";
import { currentUser } from "./queries";

const UserQuery = [currentUser]

const UserMutation = [login]

export { UserQuery, UserMutation }
