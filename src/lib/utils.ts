import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('pt-BR');
}

export function formatDateTime(dateString: string): string {
  return new Date(dateString).toLocaleString('pt-BR');
}

export function formatNumber(value: number, decimals = 1): string {
  return value.toFixed(decimals).replace('.', ',');
}

export function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

export function calcularIMC(peso: number, alturaCm: number): number {
  const alturaM = alturaCm / 100;
  return peso / (alturaM * alturaM);
}

export function classificarIMC(imc: number): { label: string; color: string } {
  if (imc < 18.5) return { label: 'Abaixo do peso', color: 'text-warning-600' };
  if (imc < 25) return { label: 'Peso normal', color: 'text-accent-600' };
  if (imc < 30) return { label: 'Sobrepeso', color: 'text-warning-600' };
  return { label: 'Obesidade', color: 'text-danger-600' };
}
