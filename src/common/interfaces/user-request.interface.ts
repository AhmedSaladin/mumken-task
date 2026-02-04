export interface UserRequest extends Express.Request {
  user: {
    id: number;
    email: string;
    role: string;
    name: string;
  };
}
