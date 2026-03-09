import {
  AfterViewInit,
  Component,
  effect,
  ElementRef,
  inject,
  input,
  signal,
  ViewChild,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { Chart, ChartConfiguration } from 'chart.js/auto';

export type GanttStatus = 'atrasado' | 'em_atraso' | 'em_dia';

export interface GanttTask {
  descricao: string;
  duracao: number;
  inicioReal: string;
  fimReal: string;
  percentual: number;
  status: GanttStatus;
  /** Mês inicial (0 = primeiro mês do cronograma) */
  startMonth: number;
  /** Mês final (inclusive) */
  endMonth: number;
}

const MESES = ['FEV', 'MAR', 'ABR', 'MAI', 'JUN', 'JUL', 'AGO', 'SET'] as const;

const STATUS_COLORS: Record<GanttStatus, string> = {
  atrasado: '#ef4444',
  em_atraso: '#eab308',
  em_dia: '#22c55e',
};

@Component({
  selector: 'app-gantt',
  standalone: true,
  imports: [CommonModule, HttpClientModule],
  templateUrl: './gantt.html',
  styleUrl: './gantt.css',
})
export class Gantt implements AfterViewInit {
  private readonly http = inject(HttpClient);
  private chart: Chart<'bar'> | null = null;
  private readonly dataStore = signal<GanttTask[] | null>(null);

  @ViewChild('ganttCanvas', { static: true })
  private canvas!: ElementRef<HTMLCanvasElement>;

  readonly theme = input<'dark' | 'light'>('dark');
  readonly tasks = input<GanttTask[]>([]);

  readonly meses = MESES;

  readonly statusLabel: Record<GanttStatus, string> = {
    atrasado: 'Atrasado',
    em_atraso: 'Em atraso',
    em_dia: 'Em dia',
  };

  readonly legendaStatuses: GanttStatus[] = ['atrasado', 'em_atraso', 'em_dia'];

  get tasksList(): GanttTask[] {
    return this.getTasks();
  }

  getStatusColor(status: GanttStatus): string {
    return STATUS_COLORS[status];
  }

  constructor() {
    effect(() => {
      this.theme();
      this.tasks();
      this.dataStore();
      if (this.chart) this.renderChart();
    });
  }

  ngAfterViewInit(): void {
    this.http.get<GanttTask[]>('/assets/data/gantt.json').subscribe({
      next: (tasks) => {
        this.dataStore.set(tasks);
        this.renderChart();
      },
      error: () => {
        this.dataStore.set(this.getDefaultTasks());
        this.renderChart();
      },
    });
  }

  private getTasks(): GanttTask[] {
    const t = this.tasks();
    if (t.length) return t;
    const loaded = this.dataStore();
    if (loaded?.length) return loaded;
    return this.getDefaultTasks();
  }

  private getDefaultTasks(): GanttTask[] {
    return [
      { descricao: 'Projeto executivo', duracao: 30, inicioReal: '01/02/2025', fimReal: '28/02/2025', percentual: 100, status: 'em_dia', startMonth: 0, endMonth: 0 },
      { descricao: 'Serviços preliminares', duracao: 45, inicioReal: '01/03/2025', fimReal: '15/04/2025', percentual: 100, status: 'em_dia', startMonth: 1, endMonth: 2 },
      { descricao: 'Topografia', duracao: 15, inicioReal: '10/03/2025', fimReal: '25/03/2025', percentual: 100, status: 'em_dia', startMonth: 1, endMonth: 1 },
      { descricao: 'Mobilização do canteiro', duracao: 20, inicioReal: '01/03/2025', fimReal: '20/03/2025', percentual: 100, status: 'em_dia', startMonth: 1, endMonth: 1 },
      { descricao: 'Fundações', duracao: 60, inicioReal: '01/04/2025', fimReal: '30/05/2025', percentual: 85, status: 'em_atraso', startMonth: 2, endMonth: 3 },
      { descricao: 'Estrutura', duracao: 45, inicioReal: '15/05/2025', fimReal: '30/06/2025', percentual: 40, status: 'em_atraso', startMonth: 3, endMonth: 4 },
      { descricao: 'Alvenaria', duracao: 50, inicioReal: '01/06/2025', fimReal: '20/07/2025', percentual: 20, status: 'em_dia', startMonth: 4, endMonth: 5 },
      { descricao: 'Cobertura', duracao: 30, inicioReal: '01/07/2025', fimReal: '30/07/2025', percentual: 0, status: 'em_dia', startMonth: 5, endMonth: 5 },
      { descricao: 'Instalações', duracao: 45, inicioReal: '15/07/2025', fimReal: '30/08/2025', percentual: 0, status: 'em_dia', startMonth: 5, endMonth: 6 },
      { descricao: 'Acabamentos', duracao: 40, inicioReal: '01/08/2025', fimReal: '10/09/2025', percentual: 0, status: 'em_dia', startMonth: 6, endMonth: 7 },
      { descricao: 'Testes', duracao: 15, inicioReal: '05/09/2025', fimReal: '20/09/2025', percentual: 0, status: 'em_dia', startMonth: 7, endMonth: 7 },
      { descricao: 'Entrega', duracao: 5, inicioReal: '25/09/2025', fimReal: '30/09/2025', percentual: 0, status: 'em_dia', startMonth: 7, endMonth: 7 },
    ];
  }

  private renderChart(): void {
    const tasks = this.getTasks();
    const ctx = this.canvas?.nativeElement?.getContext('2d');
    if (!ctx) return;

    const labels = tasks.map((t) => t.descricao);
    const data = tasks.map((t) => [t.startMonth, t.endMonth + 0.99] as [number, number]);
    const backgrounds = tasks.map((t) => STATUS_COLORS[t.status]);

    const style = getComputedStyle(document.documentElement);
    const textColor = style.getPropertyValue('--bg-grafico').trim();
    const gridColor = style.getPropertyValue('--gb-grade').trim();

    const config: ChartConfiguration<'bar'> = {
      type: 'bar',
      data: {
        labels,
        datasets: [
          {
            label: 'Período',
            data,
            backgroundColor: backgrounds,
            borderColor: backgrounds.map((c) => c),
            borderWidth: 1,
            barThickness: 22,
            barPercentage: 0.85,
            categoryPercentage: 0.9,
          },
        ],
      },
      options: {
        indexAxis: 'y',
        responsive: true,
        maintainAspectRatio: false,
        animation: { duration: 500 },
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: (ctx) => {
                const task = tasks[ctx.dataIndex];
                return [
                  `Início: ${this.meses[task.startMonth]}`,
                  `Fim: ${this.meses[task.endMonth]}`,
                  `Progresso: ${task.percentual}%`,
                  `Status: ${this.statusLabel[task.status]}`,
                ];
              },
            },
          },
        },
        scales: {
          x: {
            min: 0,
            max: this.meses.length,
            grid: { color: gridColor },
            ticks: {
              color: textColor,
              stepSize: 1,
              callback: (value) => this.meses[Number(value)] ?? '',
            },
          },
          y: {
            grid: { display: false },
            ticks: {
              color: textColor,
              font: { size: 12 },
            },
          },
        },
      },
    };

    if (this.chart) {
      this.chart.data = config.data;
      if (config.options) {
        Object.assign(this.chart.options, config.options);
      }
      this.chart.update();
      return;
    }

    this.chart = new Chart(ctx, config);
  }
}
