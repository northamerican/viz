import { Low } from "lowdb";
import { JSONFile } from "lowdb/node";
import EventEmitter from "node:events";
import { dbDir } from "../../consts";

export const vizEventEmitter = new EventEmitter();

export class VizEventAdapter<T> extends JSONFile<T> {
  #write = super.write;
  #dbName;

  constructor(dbName: string) {
    super(`${dbDir}${dbName}.json`);
    this.#dbName = dbName;
  }

  async write(data: T) {
    vizEventEmitter.emit(`${this.#dbName}:write`);
    return this.#write(data);
  }
}

export async function VizEventPreset<Data>(
  dbName: string,
  defaultData: Data
): Promise<Low<Data>> {
  const db = new Low(new VizEventAdapter<Data>(dbName), defaultData);
  await db.read();
  return db;
}
