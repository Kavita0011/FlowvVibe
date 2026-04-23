/**
 * Flowvibe Analytics Module
 * Simple event tracking for user behavior analysis
 */

interface EventData {
  [key: string]: string | number | boolean | undefined;
}

interface PageView {
  path: string;
  title: string;
  referrer?: string;
  timestamp: number;
}

class Analytics {
  private events: EventData[] = [];
  private pageViews: PageView[] = [];
  private sessionId: string;
  private sessionStart: number;

  constructor() {
    this.sessionId = this.generateSessionId();
    this.sessionStart = Date.now();
    this.init();
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private init() {
    if (typeof window === 'undefined') return;

    this.trackPageView();

    window.addEventListener('popstate', () => this.trackPageView());

    const observer = new MutationObserver(() => {
      requestAnimationFrame(() => this.trackPageView());
    });
    observer.observe(document.body, { childList: true, subtree: true });
  }

  private trackPageView() {
    const pageView: PageView = {
      path: window.location.pathname,
      title: document.title,
      referrer: document.referrer,
      timestamp: Date.now(),
    };

    this.pageViews.push(pageView);
    this.sendToBackend({ type: 'pageview', data: pageView });
  }

  track(event: string, data?: EventData) {
    const eventData = {
      event,
      sessionId: this.sessionId,
      timestamp: Date.now(),
      url: typeof window !== 'undefined' ? window.location.pathname : '',
      ...data,
    };

    this.events.push(eventData);

    if (import.meta.env.DEV) {
      console.log('[Analytics]', event, eventData);
    }

    this.sendToBackend({ type: 'event', data: eventData });
  }

  private async sendToBackend(payload: { type: string; data: EventData | PageView }) {
    try {
      const API_URL = import.meta.env.VITE_API_URL;
      if (!API_URL) return;

      await fetch(`${API_URL}/api/analytics`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
    } catch (err) {
      // Silently fail - analytics shouldn't break the app
    }
  }

  identify(userId: string, traits?: EventData) {
    this.track('user_identified', { userId, ...traits });
    localStorage.setItem('analytics_user_id', userId);
  }

  getSessionInfo() {
    return {
      sessionId: this.sessionId,
      duration: Date.now() - this.sessionStart,
      eventsCount: this.events.length,
      pageViewsCount: this.pageViews.length,
    };
  }

  clear() {
    this.events = [];
    this.pageViews = [];
  }
}

export const analytics = new Analytics();

export function trackEvent(event: string, data?: EventData) {
  analytics.track(event, data);
}

export function trackPageView() {
  analytics.track('page_view', { path: window.location.pathname });
}

export function identifyUser(userId: string, traits?: EventData) {
  analytics.identify(userId, traits);
}

export default analytics;