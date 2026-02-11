export type Next = (err?: unknown) => void;

export type Middleware = (req: any, res: any, next: Next) => void | Promise<void>;

export function compose(middlewares: Middleware[]) {
  return async (req: any, res: any, outNext?: Next) => {
    let index = -1;

    const dispatch = async (i: number, err?: unknown): Promise<void> => {
      if(err) return outNext?.(err);
      // 同じmiddlewareからnextを複数回呼べないようにガード
      if(i <= index) throw new Error("next() called multiple times");
      index = i;

      const mw = middlewares[i];
      if(!mw) return outNext?.(); // 終了（次へ）

      // この第3引数がnext
      await mw(req, res, (e) => dispatch(i + 1, e));
    }

    await dispatch(0)
  }
}