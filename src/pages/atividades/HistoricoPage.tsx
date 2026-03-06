import { useState, useEffect, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { apiClient, extractApiError } from '@/lib/api';
import {
  Card, CardContent, CardHeader, Badge, Spinner, Alert, Input, Button,
} from '@/components/ui';
import {
  Calendar as CalendarIcon, Clock, Dumbbell, ChevronRight, CheckCircle,
  ChevronLeft, BarChart3, CalendarDays,
} from 'lucide-react';
import { formatDate } from '@/lib/utils';
import type { Atividade } from '@/types';

// ——— Calendar helper ———
function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}
function getFirstDayOfWeek(year: number, month: number) {
  return new Date(year, month, 1).getDay(); // 0=Sun
}

function CalendarView({ atividades, onDayClick }: {
  atividades: Atividade[];
  onDayClick: (date: string) => void;
}) {
  const [viewDate, setViewDate] = useState(() => new Date());
  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();

  // Build set of days that have atividades
  const atividadesByDay = useMemo(() => {
    const map: Record<string, Atividade[]> = {};
    atividades.forEach((a) => {
      const d = new Date(a.dataExecucao);
      if (d.getFullYear() === year && d.getMonth() === month) {
        const key = d.getDate().toString();
        if (!map[key]) map[key] = [];
        map[key].push(a);
      }
    });
    return map;
  }, [atividades, year, month]);

  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfWeek(year, month);
  const today = new Date();
  const isToday = (day: number) =>
    day === today.getDate() && month === today.getMonth() && year === today.getFullYear();

  const weekDays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

  // Stats for the month
  const totalSessions = Object.values(atividadesByDay).reduce((s, arr) => s + arr.length, 0);
  const totalDays = Object.keys(atividadesByDay).length;
  const totalMinutes = Object.values(atividadesByDay)
    .flat()
    .reduce((s, a) => s + (a.duracaoMinutos || 0), 0);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <button
            onClick={() => setViewDate(new Date(year, month - 1, 1))}
            className="rounded-lg p-1.5 hover:bg-gray-100"
            title="Mês anterior"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <h3 className="text-base font-semibold text-gray-900 capitalize">
            {viewDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
          </h3>
          <button
            onClick={() => setViewDate(new Date(year, month + 1, 1))}
            className="rounded-lg p-1.5 hover:bg-gray-100"
            title="Próximo mês"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </CardHeader>
      <CardContent>
        {/* Week days header */}
        <div className="mb-2 grid grid-cols-7 text-center text-xs font-medium text-gray-400">
          {weekDays.map((d) => <div key={d}>{d}</div>)}
        </div>
        {/* Calendar grid */}
        <div className="grid grid-cols-7 gap-1">
          {/* Empty cells before first day */}
          {Array.from({ length: firstDay }).map((_, i) => (
            <div key={`empty-${i}`} className="h-10" />
          ))}
          {/* Day cells */}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const day = i + 1;
            const dayAtividades = atividadesByDay[day.toString()];
            const hasActivity = !!dayAtividades;
            const count = dayAtividades?.length ?? 0;
            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

            return (
              <button
                key={day}
                onClick={() => hasActivity && onDayClick(dateStr)}
                className={`relative flex h-10 items-center justify-center rounded-lg text-sm transition-colors ${
                  isToday(day) ? 'ring-2 ring-primary-400' : ''
                } ${
                  hasActivity
                    ? 'bg-primary-100 font-semibold text-primary-700 hover:bg-primary-200 cursor-pointer'
                    : 'text-gray-600 cursor-default'
                }`}
              >
                {day}
                {count > 1 && (
                  <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-primary-600 text-[9px] font-bold text-white">
                    {count}
                  </span>
                )}
                {count === 1 && (
                  <span className="absolute bottom-0.5 h-1.5 w-1.5 rounded-full bg-primary-500" />
                )}
              </button>
            );
          })}
        </div>

        {/* Month stats */}
        <div className="mt-4 flex items-center justify-center gap-6 border-t border-gray-100 pt-3 text-sm text-gray-500">
          <span className="flex items-center gap-1">
            <CalendarDays className="h-4 w-4 text-primary-500" />
            {totalDays} dias
          </span>
          <span className="flex items-center gap-1">
            <Dumbbell className="h-4 w-4 text-primary-500" />
            {totalSessions} treinos
          </span>
          <span className="flex items-center gap-1">
            <Clock className="h-4 w-4 text-primary-500" />
            {totalMinutes} min
          </span>
        </div>
      </CardContent>
    </Card>
  );
}

type ViewMode = 'calendar' | 'list';

export function HistoricoPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { alunoRecordId, isAluno } = useAuth();
  const alunoId = searchParams.get('alunoId') || (isAluno ? alunoRecordId : null) || '';

  const [atividades, setAtividades] = useState<Atividade[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filtroData, setFiltroData] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('calendar');
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  useEffect(() => {
    if (!alunoId) {
      setLoading(false);
      return;
    }
    apiClient
      .get<Atividade[]>(`/api/atividades?alunoId=${alunoId}`)
      .then((r) => setAtividades(r.data.sort((a, b) => new Date(b.dataExecucao).getTime() - new Date(a.dataExecucao).getTime())))
      .catch((err) => setError(extractApiError(err)))
      .finally(() => setLoading(false));
  }, [alunoId]);

  const atividadesFiltradas = useMemo(() => {
    let list = atividades;
    if (filtroData) {
      list = list.filter((a) => a.dataExecucao.startsWith(filtroData));
    }
    if (selectedDate) {
      list = list.filter((a) => a.dataExecucao.startsWith(selectedDate));
    }
    return list;
  }, [atividades, filtroData, selectedDate]);

  // Group by month for list view
  const grouped = atividadesFiltradas.reduce<Record<string, Atividade[]>>((acc, a) => {
    const month = new Date(a.dataExecucao).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
    if (!acc[month]) acc[month] = [];
    acc[month].push(a);
    return acc;
  }, {});

  if (loading) return <Spinner className="mx-auto mt-20" />;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Histórico de Treinos</h1>
        <div className="flex items-center gap-2">
          {/* View mode toggle */}
          <div className="flex rounded-lg border border-gray-200 p-0.5">
            <button
              onClick={() => { setViewMode('calendar'); setSelectedDate(null); }}
              className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                viewMode === 'calendar' ? 'bg-primary-100 text-primary-700' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <CalendarIcon className="mr-1 inline h-3.5 w-3.5" />
              Calendário
            </button>
            <button
              onClick={() => { setViewMode('list'); setSelectedDate(null); }}
              className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                viewMode === 'list' ? 'bg-primary-100 text-primary-700' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <BarChart3 className="mr-1 inline h-3.5 w-3.5" />
              Lista
            </button>
          </div>
          {viewMode === 'list' && (
            <Input
              id="filtro-data"
              type="month"
              value={filtroData}
              onChange={(e) => setFiltroData(e.target.value)}
              className="w-auto"
            />
          )}
        </div>
      </div>

      {error && <Alert type="error" message={error} />}

      {!alunoId && (
        <Alert type="warning" message="Selecione um aluno para visualizar o histórico." />
      )}

      {/* Calendar view */}
      {viewMode === 'calendar' && alunoId && (
        <>
          <CalendarView
            atividades={atividades}
            onDayClick={(date) => setSelectedDate((prev) => (prev === date ? null : date))}
          />
          {/* Show activities for selected day */}
          {selectedDate && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold text-gray-700">
                  {new Date(selectedDate + 'T12:00:00').toLocaleDateString('pt-BR', {
                    weekday: 'long', day: 'numeric', month: 'long',
                  })}
                </h2>
                <button
                  onClick={() => setSelectedDate(null)}
                  className="text-xs text-primary-600 hover:underline"
                >
                  Limpar filtro
                </button>
              </div>
              {atividadesFiltradas.length === 0 ? (
                <p className="text-sm text-gray-400">Nenhuma atividade neste dia.</p>
              ) : (
                atividadesFiltradas.map((atividade) => (
                  <ActivityCard key={atividade.id} atividade={atividade} onClick={() => navigate(`/atividades/${atividade.id}`)} />
                ))
              )}
            </div>
          )}
        </>
      )}

      {/* List view */}
      {viewMode === 'list' && alunoId && (
        <>
          {atividadesFiltradas.length === 0 && (
            <Card>
              <CardContent className="py-12 text-center">
                <CalendarIcon className="mx-auto mb-4 h-12 w-12 text-gray-300" />
                <p className="text-gray-500">Nenhuma atividade registrada.</p>
              </CardContent>
            </Card>
          )}

          {Object.entries(grouped).map(([month, items]) => (
            <div key={month} className="space-y-3">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-500">{month}</h2>
              {items.map((atividade) => (
                <ActivityCard
                  key={atividade.id}
                  atividade={atividade}
                  onClick={() => navigate(`/atividades/${atividade.id}`)}
                />
              ))}
            </div>
          ))}
        </>
      )}
    </div>
  );
}

// Extracted Activity Card component
function ActivityCard({ atividade, onClick }: { atividade: Atividade; onClick: () => void }) {
  const totalExercicios = atividade.exerciciosExecutados.length;
  const seriesTotal = atividade.exerciciosExecutados.reduce((s, ex) => s + ex.series.length, 0);
  const seriesConcluidas = atividade.exerciciosExecutados.reduce(
    (s, ex) => s + ex.series.filter((sr) => sr.concluida).length, 0
  );

  return (
    <Card className="cursor-pointer transition-shadow hover:shadow-md" onClick={onClick}>
      <CardContent className="flex items-center gap-4 py-4">
        <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-primary-100">
          <Dumbbell className="h-6 w-6 text-primary-600" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="font-medium text-gray-900 truncate">{atividade.divisaoNome}</p>
            {seriesConcluidas === seriesTotal && seriesTotal > 0 && (
              <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
            )}
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-gray-500">
            <span className="flex items-center gap-1">
              <CalendarIcon className="h-3 w-3" />
              {formatDate(atividade.dataExecucao)}
            </span>
            {atividade.duracaoMinutos > 0 && (
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {atividade.duracaoMinutos} min
              </span>
            )}
            <span>{totalExercicios} exercícios</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={seriesConcluidas === seriesTotal ? 'success' : 'warning'}>
            {seriesConcluidas}/{seriesTotal} séries
          </Badge>
          <ChevronRight className="h-4 w-4 text-gray-400" />
        </div>
      </CardContent>
    </Card>
  );
}
