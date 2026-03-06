// ── User & Auth ──
export type UserRole = 'admin' | 'professor' | 'aluno';

export interface Usuario {
  id: string;
  tenantId: string;
  nome: string;
  email: string;
  b2CObjectId: string;
  role: UserRole;
  ativo: boolean;
  dataCadastro: string;
  professorId?: string;
  alunoId?: string;
}

export interface AuthUser {
  userId: string;
  userDetails: string;
  identityProvider: string;
  userRoles: string[];
  claims: Array<{ typ: string; val: string }>;
}

// ── Aluno ──
export interface Aluno {
  id: string;
  tenantId: string;
  nome: string;
  email: string;
  telefone?: string;
  dataNascimento?: string;
  peso?: number;
  altura?: number;
  objetivo?: string;
  observacoes?: string;
  ativo: boolean;
  professorId?: string;
  userId?: string;
  fotoUrl?: string;
  criadoEm: string;
  atualizadoEm: string;
}

// ── Treino & Exercicio ──
export interface ExercicioTreino {
  exercicioId: string;
  nome: string;
  series: number;
  repeticoes: string;
  carga?: string;
  descanso?: string;
  metodo?: string;
  observacoes?: string;
  ordem: number;
  linkVideo?: string;
}

export interface DivisaoTreino {
  nome: string;
  descricao?: string;
  ordem: number;
  exercicios: ExercicioTreino[];
}

export interface Treino {
  id: string;
  tenantId: string;
  alunoId: string;
  nome: string;
  descricao?: string;
  dataInicio: string;
  dataFim?: string;
  ativo: boolean;
  divisoes: DivisaoTreino[];
  criadoEm: string;
  atualizadoEm: string;
}

export interface Exercicio {
  id: string;
  tenantId: string;
  nome: string;
  grupoMuscular: string;
  descricao?: string;
  linkVideo?: string;
  criadoEm: string;
}

// ── Atividade ──
export interface SerieExecutada {
  numero: number;
  repeticoes: number;
  carga?: number;
  concluida: boolean;
}

export interface ExercicioExecutado {
  exercicioId: string;
  nome: string;
  concluido: boolean;
  inicioExercicio?: string;
  fimExercicio?: string;
  duracaoSegundos?: number;
  series: SerieExecutada[];
  observacoes?: string;
}

export interface Atividade {
  id: string;
  tenantId: string;
  alunoId: string;
  treinoId: string;
  divisaoNome: string;
  dataExecucao: string;
  duracaoMinutos: number;
  inicioEm?: string;
  fimEm?: string;
  status?: 'em_andamento' | 'concluido' | 'abandonado';
  observacoes?: string;
  exerciciosExecutados: ExercicioExecutado[];
  criadoEm: string;
}

// ── Avaliacao ──
export interface Circunferencias {
  torax?: number;
  cintura?: number;
  quadril?: number;
  bracoD?: number;
  bracoE?: number;
  coxaD?: number;
  coxaE?: number;
  panturrilhaD?: number;
  panturrilhaE?: number;
}

export interface Avaliacao {
  id: string;
  tenantId: string;
  alunoId: string;
  dataAvaliacao: string;
  peso: number;
  altura: number;
  imc?: number;
  percentualGordura?: number;
  massaMagra?: number;
  massaGorda?: number;
  circunferencias?: Circunferencias;
  observacoes?: string;
  criadoEm: string;
}

// ── Nutrição ──
export interface ItemRefeicao {
  nome: string;
  quantidade: string;
  calorias?: number;
  proteinas?: number;
  carboidratos?: number;
  gorduras?: number;
}

export interface Refeicao {
  nome: string;
  horario?: string;
  itens: ItemRefeicao[];
}

export interface MacronutrientesMeta {
  calorias: number;
  proteinas: number;
  carboidratos: number;
  gorduras: number;
}

export interface PlanoNutricional {
  id: string;
  tenantId: string;
  alunoId: string;
  nome: string;
  descricao?: string;
  dataInicio: string;
  dataFim?: string;
  ativo: boolean;
  metaDiaria: MacronutrientesMeta;
  refeicoes: Refeicao[];
  criadoEm: string;
}

// ── Objetivo ──
export interface Objetivo {
  id: string;
  tenantId: string;
  alunoId: string;
  titulo: string;
  descricao?: string;
  dataLimite?: string;
  concluido: boolean;
  dataConclusao?: string;
  criadoEm: string;
}

// ── Notificação ──
export interface Notificacao {
  id: string;
  tenantId: string;
  userId: string;
  titulo: string;
  mensagem: string;
  tipo: string;
  linkUrl?: string;
  lida: boolean;
  lidaEm?: string;
  criadoEm: string;
}

// ── Tenant ──
export interface Tenant {
  id: string;
  nome: string;
  plano: string;
  ativo: boolean;
  criadoEm: string;
}

// ── API Response ──
export interface PagedResult<T> {
  items: T[];
  continuationToken?: string;
  hasMore: boolean;
}

export interface ApiError {
  type: string;
  title: string;
  status: number;
  detail?: string;
  errors?: Record<string, string[]>;
}

// ── Dashboard ──
export interface DashboardData {
  totalAlunos: number;
  totalTreinos: number;
  totalAtividades: number;
  totalAvaliacoes: number;
  atividadesUltimos7Dias: number;
  atividadesUltimos30Dias: number;
}

export interface ResumoAluno {
  aluno: Aluno;
  treinoAtivo?: Treino;
  ultimaAtividade?: Atividade;
  ultimaAvaliacao?: Avaliacao;
  totalAtividades: number;
}

export interface EvolucaoAluno {
  avaliacoes: Avaliacao[];
}

export interface FrequenciaAluno {
  semanas: Array<{
    semana: string;
    treinos: number;
  }>;
}
