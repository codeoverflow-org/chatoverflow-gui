import { EventsService } from "chatoverflow-api";
import { Injectable } from "@angular/core";

interface EventMessage<T> {
  action: string;
  data: T;
}

interface EventTypeMap {
  close: Event;
  error: Event;

  instance: EventMessage<{ name: string, message?: string, timestamp?: string }>;
}

@Injectable({
  providedIn: 'root'
})
export class EventService extends EventsService {
  private readonly eventListeners: { [type: string]: ((e: Event | EventMessage<unknown>) => void)[] } = {};
  private eventSource: EventSource = null;

  isRunning() {
    return this.eventSource && this.eventSource.readyState !== EventSource["CLOSED"];
  }

  addEventListener<TKey extends keyof EventTypeMap>(type: TKey, listener: (e: EventTypeMap[TKey]) => void) {
    if (!this.eventListeners[type]) {
      this.eventListeners[type] = [];
      if (this.eventSource && type !== "close" && type !== "error") {
        this.addListener(type);
      }
    }
    
    this.eventListeners[type].push(listener);
  }

  start(authKey: string) {
    this.eventSource = new EventSource(`${this.basePath}/events?authKey=${authKey}`);
    this.eventSource.addEventListener("close", this.close);

    for (const type in this.eventListeners) {
      if (this.eventListeners.hasOwnProperty(type)) {
        this.addListener(type);
      }
    }
  }

  close = () => {
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    }
  }

  private addListener(type: string) {
    if (type === "close" || type === "error") {
      this.eventListeners[type].forEach(listener => this.eventSource.addEventListener(type, listener));
    } else {
      this.eventSource.addEventListener(type, (e: MessageEvent) => this.dispatch(type, e));
    }
  }

  private dispatch(type: string, e: MessageEvent) {
    const message: EventMessage<unknown> = JSON.parse(e.data);
    this.eventListeners[type].forEach(listener => listener(message));
  }
}