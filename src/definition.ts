import * as lq from 'loquat';
type definitionTypes = 'literal' | 'rule';

export class Definition {
  constructor(public type: definitionTypes, public value: string) { }

  getLabel(): string {
    if (this.type === 'literal') {
      return lq.show(this.value);
    }
    else if (this.type === 'rule') {
      return `<${this.value}>`;
    }
    return String(this.value);
  }
}
