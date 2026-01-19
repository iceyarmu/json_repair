export enum ContextValues {
  OBJECT_KEY,
  OBJECT_VALUE,
  ARRAY,
}

export class JsonContext {
  public context: ContextValues[] = [];
  public current: ContextValues | null = null;
  public empty: boolean = true;

  /**
   * Set a new context value.
   */
  set(value: ContextValues): void {
    this.context.push(value);
    this.current = value;
    this.empty = false;
  }

  /**
   * Remove the most recent context value.
   */
  reset(): void {
    this.context.pop();
    if (this.context.length > 0) {
      this.current = this.context[this.context.length - 1];
    } else {
      this.current = null;
      this.empty = true;
    }
  }
}
