import {
  InvokeCommand,
  LambdaClient,
  InvokeCommandInput,
} from "@aws-sdk/client-lambda";
import { mockClient } from "aws-sdk-client-mock";
import * as Effect from "effect/Effect";
import * as Exit from "effect/Exit";
import { pipe } from "effect/Function";
import * as Layer from "effect/Layer";
import {
  BaseLambdaServiceLayer,
  DefaultLambdaClientConfigLayer,
  DefaultLambdaServiceLayer,
  LambdaClientInstance,
  LambdaClientInstanceConfig,
  LambdaService,
  LambdaServiceLayer,
} from "../src";

import "aws-sdk-client-mock-jest";

const lambdaMock = mockClient(LambdaClient);
const { invoke } = Effect.serviceFunctions(LambdaService);

describe("LambdaClientImpl", () => {
  it("default", async () => {
    lambdaMock.reset().on(InvokeCommand).resolves({});

    const args: InvokeCommandInput = { FunctionName: "test", Payload: "test" };

    const program = invoke(args);

    const result = await pipe(
      program,
      Effect.provide(DefaultLambdaServiceLayer),
      Effect.runPromiseExit,
    );

    expect(result).toEqual(Exit.succeed({}));
    expect(lambdaMock).toHaveReceivedCommandTimes(InvokeCommand, 1);
    expect(lambdaMock).toHaveReceivedCommandWith(InvokeCommand, args);
  });

  it("configurable", async () => {
    lambdaMock.reset().on(InvokeCommand).resolves({});

    const args: InvokeCommandInput = { FunctionName: "test", Payload: "test" };

    const program = invoke(args);

    const LambdaClientConfigLayer = Layer.succeed(LambdaClientInstanceConfig, {
      region: "eu-central-1",
    });
    const CustomLambdaServiceLayer = LambdaServiceLayer.pipe(
      Layer.provide(LambdaClientConfigLayer),
    );

    const result = await pipe(
      program,
      Effect.provide(CustomLambdaServiceLayer),
      Effect.runPromiseExit,
    );

    expect(result).toEqual(Exit.succeed({}));
    expect(lambdaMock).toHaveReceivedCommandTimes(InvokeCommand, 1);
    expect(lambdaMock).toHaveReceivedCommandWith(InvokeCommand, args);
  });

  it("base", async () => {
    lambdaMock.reset().on(InvokeCommand).resolves({});

    const args: InvokeCommandInput = { FunctionName: "test", Payload: "test" };

    const program = invoke(args);

    const LambdaClientInstanceLayer = Layer.succeed(
      LambdaClientInstance,
      new LambdaClient({ region: "eu-central-1" }),
    );
    const CustomLambdaServiceLayer = BaseLambdaServiceLayer.pipe(
      Layer.provide(LambdaClientInstanceLayer),
    );

    const result = await pipe(
      program,
      Effect.provide(CustomLambdaServiceLayer),
      Effect.runPromiseExit,
    );

    expect(result).toEqual(Exit.succeed({}));
    expect(lambdaMock).toHaveReceivedCommandTimes(InvokeCommand, 1);
    expect(lambdaMock).toHaveReceivedCommandWith(InvokeCommand, args);
  });

  it("extended", async () => {
    lambdaMock.reset().on(InvokeCommand).resolves({});

    const args: InvokeCommandInput = { FunctionName: "test", Payload: "test" };

    const program = invoke(args);

    const LambdaClientInstanceLayer = Layer.effect(
      LambdaClientInstance,
      Effect.map(
        LambdaClientInstanceConfig,
        (config) => new LambdaClient({ ...config, region: "eu-central-1" }),
      ),
    );
    const CustomLambdaServiceLayer = BaseLambdaServiceLayer.pipe(
      Layer.provide(LambdaClientInstanceLayer),
      Layer.provide(DefaultLambdaClientConfigLayer),
    );

    const result = await pipe(
      program,
      Effect.provide(CustomLambdaServiceLayer),
      Effect.runPromiseExit,
    );

    expect(result).toEqual(Exit.succeed({}));
    expect(lambdaMock).toHaveReceivedCommandTimes(InvokeCommand, 1);
    expect(lambdaMock).toHaveReceivedCommandWith(InvokeCommand, args);
  });

  it("fail", async () => {
    lambdaMock.reset().on(InvokeCommand).rejects(new Error("test"));

    const args: InvokeCommandInput = { FunctionName: "test", Payload: "test" };

    const program = invoke(args, { requestTimeout: 1000 });

    const result = await pipe(
      program,
      Effect.provide(DefaultLambdaServiceLayer),
      Effect.runPromiseExit,
    );

    expect(result).toEqual(Exit.fail(new Error("test")));
    expect(lambdaMock).toHaveReceivedCommandTimes(InvokeCommand, 1);
    expect(lambdaMock).toHaveReceivedCommandWith(InvokeCommand, args);
  });
});
