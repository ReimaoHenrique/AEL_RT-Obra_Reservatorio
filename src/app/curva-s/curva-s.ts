import { AfterViewInit, Component, computed, ElementRef, inject, OnDestroy, signal, ViewChild, input, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { Subscription } from 'rxjs';
import { Chart, ChartConfiguration } from 'chart.js/auto';

interface CurvaPoint {
  date: string;
  planned?: number | null;
  actual?: number | null;
}

const isNumber = (value: unknown): value is number =>
  typeof value === 'number' && Number.isFinite(value);

@Component({
  selector: 'app-curva-s',
  standalone: true,
  imports: [CommonModule, HttpClientModule],
  templateUrl: './curva-s.html',
  styleUrl: './curva-s.css'
})
export class CurvaS implements AfterViewInit, OnDestroy {
  private readonly http = inject(HttpClient);
  private readonly subscriptions = new Subscription();
  private chart?: Chart;
  private readonly dataStore = signal<CurvaPoint[]>([]);

  readonly theme = input<'dark' | 'light'>('dark');

  @ViewChild('curvaCanvas', { static: true })
  private canvas!: ElementRef<HTMLCanvasElement>;

  constructor() {
    effect(() => {
      const theme = this.theme();
      if (this.chart) {
        this.updateChartTheme(theme);
      }
    });
  }

  readonly progressEntries = computed(() => {
    const data = this.dataStore();
    if (!data.length) {
      return [];
    }
    const actuals = data.filter((point) => isNumber(point.actual));
    if (actuals.length) {
      return actuals.slice(-6);
    }
    return data.slice(-6);
  });

  readonly startDate = computed(() => this.dataStore()[0]?.date ?? '');
  readonly endDate = computed(() => this.dataStore().slice(-1)[0]?.date ?? '');
  readonly lastActualDate = computed(() => {
    const actuals = this.dataStore().filter((point) => isNumber(point.actual));
    return actuals.length ? actuals[actuals.length - 1].date : '';
  });

  readonly plannedCompletion = computed(() => this.dataStore().slice(-1)[0]?.planned ?? 0);
  readonly actualCompletion = computed(() => {
    const actuals = this.dataStore().filter((point) => isNumber(point.actual));
    return actuals.length ? actuals[actuals.length - 1].actual! : 0;
  });

  ngAfterViewInit(): void {
    const subscription = this.http.get<CurvaPoint[]>('/assets/data/curva-s.json').subscribe((points) => {
      this.dataStore.set(points);
      this.renderChart(points);
    });
    this.subscriptions.add(subscription);
  }

  ngOnDestroy(): void {
    this.chart?.destroy();
    this.subscriptions.unsubscribe();
  }

  printReport(): void {
    if (typeof window !== 'undefined') {
      window.print();
    }
  }

  private updateChartTheme(theme: 'dark' | 'light'): void {
    if (!this.chart) return;

    const style = getComputedStyle(document.documentElement);
    const textColor = style.getPropertyValue('--bg-grafico').trim();
    const gridColor = style.getPropertyValue('--gb-grade').trim();

    this.chart.options.plugins!.legend!.labels!.color = textColor;

    if (this.chart.options.scales?.['x']) {
      this.chart.options.scales['x'].grid!.color = gridColor;
      (this.chart.options.scales['x'].ticks! as any).color = textColor;
    }

    if (this.chart.options.scales?.['y']) {
      this.chart.options.scales['y'].grid!.color = gridColor;
      (this.chart.options.scales['y'].ticks! as any).color = textColor;
    }

    this.chart.update();
  }

  private renderChart(points: CurvaPoint[]): void {
    const ctx = this.canvas.nativeElement.getContext('2d');
    if (!ctx) {
      return;
    }

    const labels = points.map((point) =>
      new Intl.DateTimeFormat('pt-BR', { day: 'numeric', month: 'short' }).format(new Date(point.date))
    );

    const planned = points.map((point) => (isNumber(point.planned) ? point.planned * 100 : null));
    const actual = points.map((point) => (isNumber(point.actual) ? point.actual * 100 : null));

    const gradient = ctx.createLinearGradient(0, 0, 0, this.canvas.nativeElement.height);
    gradient.addColorStop(0, 'rgba(246, 162, 48, 0.45)');
    gradient.addColorStop(1, 'rgba(246, 162, 48, 0.05)');

    if (this.chart) {
      this.chart.data.labels = labels;
      this.chart.data.datasets = this.buildDatasets(planned, actual, gradient);
      this.chart.update();
      return;
    }

    const style = getComputedStyle(document.documentElement);
    const textColor = style.getPropertyValue('--bg-grafico').trim();
    const gridColor = style.getPropertyValue('--gb-grade').trim();

    this.chart = new Chart(ctx, {
      type: 'line',
      data: {
        labels,
        datasets: this.buildDatasets(planned, actual, gradient)
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: { duration: 650, easing: 'easeOutQuad' },
        interaction: { mode: 'index', intersect: false },
        plugins: {
          legend: {
            labels: {
              color: textColor,
              boxWidth: 12,
              padding: 16
            }
          },
          tooltip: {
            callbacks: {
              label: (context) => {
                const value = context.parsed.y;
                const label = context.dataset.label ?? 'Valor';
                if (!isNumber(value)) {
                  return `${label}: —`;
                }
                return `${label}: ${value.toFixed(1)} %`;
              }
            }
          }
        },
        scales: {
          x: {
            grid: {
              color: gridColor,
              lineWidth: 1
            },
            ticks: {
              color: textColor,
              maxRotation: 0,
              maxTicksLimit: 9
            }
          },
          y: {
            min: 0,
            max: 110,
            grid: {
              color: gridColor,
              lineWidth: 1
            },
            ticks: {
              color: textColor,
              callback: (value) => `${value}%`
            }
          }
        }
      }
    });
  }

  private buildDatasets(
    planned: (number | null)[],
    actual: (number | null)[],
    gradient: CanvasGradient
  ) {
    return [
      {
        label: 'Planejado',
        data: planned,
        borderColor: '#f9b344',
        backgroundColor: gradient,
        borderWidth: 3,
        pointRadius: 0,
        tension: 0.35,
        fill: true,
        spanGaps: true
      },
      {
        label: 'Executado',
        data: actual,
        borderColor: '#4ae1ff',
        backgroundColor: 'transparent',
        borderWidth: 2,
        pointRadius: 4,
        pointBackgroundColor: '#4ae1ff',
        tension: 0.35,
        spanGaps: true
      }
    ];
  }
}
