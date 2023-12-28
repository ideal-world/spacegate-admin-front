export * from './backend';
export * from './certificate';
export * from './service';
export * from './common';
export * from './route';
export * from './instance';
export * from './plugin';

export interface ApiObject {
  serialize(this: this): Object
  deserialize(this: Object): this
}