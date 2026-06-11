import { alunos } from "@/lib/student-data/mockData";
import {
  getAlunoById as buscarAlunoPorId,
  getConquistasAluno,
  getDesafiosDisponiveis as buscarDesafiosDisponiveis,
  getPlanoByAluno as buscarPlanoPorAluno,
  getProximaAula as buscarProximaAula,
  getResumoFrequencia as buscarResumoFrequencia,
  getStatusPagamento as buscarStatusPagamento,
  getTurmasDisponiveisPorPlano as buscarTurmasDisponiveis
} from "@/lib/student-data/selectors";

export const alunoAtualId = "ALU001";

// Esta lista existe apenas enquanto não há login real.
export function getAlunosParaTeste() {
  return alunos;
}

export function getAlunoById(id: string) {
  return buscarAlunoPorId(id);
}

export function getPlanoByAluno(alunoId: string) {
  return buscarPlanoPorAluno(alunoId);
}

export function getTurmasDisponiveisPorPlano(alunoId: string) {
  return buscarTurmasDisponiveis(alunoId);
}

export function getProximaAula(alunoId: string, referencia = new Date()) {
  return buscarProximaAula(alunoId, referencia);
}

export function getStatusPagamento(alunoId: string) {
  return buscarStatusPagamento(alunoId);
}

export function getResumoFrequencia(alunoId: string, referencia = new Date()) {
  return buscarResumoFrequencia(alunoId, referencia);
}

export function getDesafiosDisponiveis(alunoId: string) {
  return buscarDesafiosDisponiveis(alunoId);
}

export function getConquistasDoAluno(alunoId: string) {
  return getConquistasAluno(alunoId);
}
