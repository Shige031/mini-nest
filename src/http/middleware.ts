// src/http/middleware.ts
export type Next = (err?: unknown) => void;

export type Middleware = (req: any, res: any, next: Next) => void | Promise<void>;
export type ErrorMiddleware = (err: unknown, req: any, res: any, next: Next) => void | Promise<void>;

type AnyMiddleware = Middleware | ErrorMiddleware;

// JavaScrptの関数は「定義された時の引数の数」をlengthに持っている
function isErrorMiddleware(mw: AnyMiddleware): mw is ErrorMiddleware {
  return mw.length === 4;
}

export function compose(middlewares: AnyMiddleware[]) {
  return async (req: any, res: any, outNext?: Next) => {
    let index = -1;

    const dispatch = async (i: number, err?: unknown): Promise<void> => {
      if (i <= index) throw new Error("next() called multiple times");
      index = i;

      const mw = middlewares[i];
      if (!mw) return outNext?.(err);

      try {
        if (err) {
          // エラー時：ErrorMiddleware だけ通す
          if (isErrorMiddleware(mw)) {
            await mw(err, req, res, (e) => dispatch(i + 1, e));
          } else {
            await dispatch(i + 1, err);
          }
        } else {
          // 通常時：Middleware だけ通す
          if (isErrorMiddleware(mw)) {
            await dispatch(i + 1);
          } else {
            await mw(req, res, (e) => dispatch(i + 1, e));
          }
        }
      } catch (e) {
        // throw されたらエラーチェーンへ
        await dispatch(i + 1, e);
      }
    };

    await dispatch(0);
  };
}
