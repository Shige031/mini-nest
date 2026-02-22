export type HttpArgumentsHost = {
  getRequest(): any;
  getResponse(): any;
};

export class ExecutionContext {
  constructor(
    private readonly type: "http",
    private readonly args: any[],
  ){}

  getType() {
    return this.type;
  }

  switchToHttp(): HttpArgumentsHost {
    if(this.type !== "http") {
      throw new Error("Not HTTP context");
    }

    const [req, res] = this.args;

    return {
      getRequest: () => req,
      getResponse: () => res,
    }
  }

  getArgs() {
    return this.args;
  }
}