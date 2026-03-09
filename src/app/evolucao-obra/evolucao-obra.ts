import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpClientModule } from '@angular/common/http';

export type LinhaTipo = 'item' | 'categoria' | 'total' | 'percentual';

export interface LinhaEvolucao {
  tipo: LinhaTipo;
  item?: string;
  descricao?: string;
  und?: string;
  qtd?: number;
  valorUnitario?: number;
  custoDiretoTotal?: number;
  data1Percentual?: number;
  data1Custo?: number | null;
  data2Percentual?: number;
  data2Custo?: number | null;
}

export interface EvolucaoObraData {
  revisao: string;
  dataRef1: string;
  dataRef2: string;
  linhas: LinhaEvolucao[];
}

@Component({
  selector: 'app-evolucao-obra',
  standalone: true,
  imports: [CommonModule, HttpClientModule],
  templateUrl: './evolucao-obra.html',
  styleUrl: './evolucao-obra.css',
})
export class EvolucaoObra {
  private readonly http = inject(HttpClient);
  readonly data = signal<EvolucaoObraData | null>(null);

  ngOnInit(): void {
    this.http.get<EvolucaoObraData>('/assets/data/evolucao-obra.json').subscribe((payload) => {
      this.data.set(payload);
    });
  }

  /** Formata número no padrão BR: 1.234,56 */
  formatBr(valor: number | null | undefined): string {
    if (valor == null || Number.isNaN(valor)) return '–';
    return valor.toLocaleString('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  }

  /** Formata quantidade: 1,00 ou 15,00 */
  formatQtd(valor: number | null | undefined): string {
    if (valor == null || Number.isNaN(valor)) return '–';
    return valor.toLocaleString('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  }

  /** Percentual: 0% ou 90% ou – */
  formatPct(valor: number | null | undefined): string {
    if (valor == null || Number.isNaN(valor)) return '–';
    return `${valor}%`;
  }

  /** Custo ou – quando null */
  formatCusto(valor: number | null | undefined): string {
    if (valor == null || Number.isNaN(valor)) return '–';
    return this.formatBr(valor);
  }

  isItem(l: LinhaEvolucao): boolean {
    return l.tipo === 'item';
  }
  isCategoria(l: LinhaEvolucao): boolean {
    return l.tipo === 'categoria';
  }
  isTotal(l: LinhaEvolucao): boolean {
    return l.tipo === 'total';
  }
  isPercentual(l: LinhaEvolucao): boolean {
    return l.tipo === 'percentual';
  }
}
