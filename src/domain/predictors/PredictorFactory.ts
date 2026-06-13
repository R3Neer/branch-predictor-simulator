import type {
  BranchPredictor,
  MemoryMeasurable,
  PredictorState
} from "./BranchPredictor";
import { GlobalCorrelatedPredictor } from "./GlobalCorrelatedPredictor";
import { GselectPredictor } from "./GselectPredictor";
import { GsharePredictor } from "./GsharePredictor";
import { LocalCorrelatedPredictor } from "./LocalCorrelatedPredictor";
import { OneLevelPredictor } from "./OneLevelPredictor";
import { TwoLevelPredictor } from "./TwoLevelPredictor";

export type ExecutablePredictor = BranchPredictor<unknown, PredictorState> &
  Partial<MemoryMeasurable<unknown>>;

export interface PredictorTypeConfig {
  readonly type: string;
}

export type PredictorBuilder<TConfig extends PredictorTypeConfig = PredictorTypeConfig> =
  (config: TConfig) => ExecutablePredictor;

export interface PredictorRegistration<
  TConfig extends PredictorTypeConfig = PredictorTypeConfig
> {
  readonly type: TConfig["type"];
  readonly build: PredictorBuilder<TConfig>;
}

export class PredictorRegistry {
  private readonly builders = new Map<string, PredictorBuilder>();

  constructor(registrations: readonly PredictorRegistration[] = []) {
    for (const registration of registrations) {
      this.register(registration);
    }
  }

  register<TConfig extends PredictorTypeConfig>(
    registration: PredictorRegistration<TConfig>
  ): this {
    this.builders.set(registration.type, registration.build as PredictorBuilder);
    return this;
  }

  create(config: PredictorTypeConfig): ExecutablePredictor | undefined {
    return this.builders.get(config.type)?.(config);
  }
}

const builtInPredictors = [
  {
    type: "one-level",
    build: () => new OneLevelPredictor() as ExecutablePredictor
  },
  {
    type: "two-level",
    build: () => new TwoLevelPredictor() as ExecutablePredictor
  },
  {
    type: "global-correlated",
    build: () => new GlobalCorrelatedPredictor() as ExecutablePredictor
  },
  {
    type: "gshare",
    build: () => new GsharePredictor() as ExecutablePredictor
  },
  {
    type: "gselect",
    build: () => new GselectPredictor() as ExecutablePredictor
  },
  {
    type: "local-correlated",
    build: () => new LocalCorrelatedPredictor() as ExecutablePredictor
  }
] satisfies readonly PredictorRegistration[];

export class PredictorFactory {
  constructor(private readonly registry = PredictorFactory.createDefaultRegistry()) {}

  static createDefaultRegistry(): PredictorRegistry {
    return new PredictorRegistry(builtInPredictors);
  }

  register<TConfig extends PredictorTypeConfig>(
    registration: PredictorRegistration<TConfig>
  ): this {
    this.registry.register(registration);
    return this;
  }

  create(config: unknown): ExecutablePredictor | undefined {
    if (!isPredictorTypeConfig(config)) {
      return undefined;
    }

    return this.registry.create(config);
  }
}

function isPredictorTypeConfig(config: unknown): config is PredictorTypeConfig {
  return (
    !!config &&
    typeof config === "object" &&
    "type" in config &&
    typeof (config as { readonly type: unknown }).type === "string"
  );
}
