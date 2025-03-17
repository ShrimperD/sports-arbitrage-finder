export class NotificationService {
  private static instance: NotificationService;
  private hasPermission: boolean = false;

  private constructor() {
    this.requestPermission();
  }

  public static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  private async requestPermission(): Promise<void> {
    if (!('Notification' in window)) {
      console.warn('This browser does not support notifications');
      return;
    }

    if (Notification.permission === 'granted') {
      this.hasPermission = true;
      return;
    }

    if (Notification.permission !== 'denied') {
      const permission = await Notification.requestPermission();
      this.hasPermission = permission === 'granted';
    }
  }

  public notify(title: string, options?: NotificationOptions): void {
    if (!this.hasPermission) {
      console.warn('Notification permission not granted');
      return;
    }

    new Notification(title, options);
  }

  public notifyArbitrageOpportunity(
    homeTeam: string,
    awayTeam: string,
    expectedReturn: number,
    bookmakers: string[]
  ): void {
    const title = 'New Arbitrage Opportunity!';
    const options: NotificationOptions = {
      body: `${homeTeam} vs ${awayTeam}\nExpected Return: ${expectedReturn.toFixed(2)}%\nBookmakers: ${bookmakers.join(', ')}`,
      icon: '/favicon.ico',
      badge: '/favicon.ico',
      tag: `${homeTeam}-${awayTeam}`,
      requireInteraction: true
    };

    this.notify(title, options);
  }
} 