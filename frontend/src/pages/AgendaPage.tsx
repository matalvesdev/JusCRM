import React from 'react';
import { MainLayout } from '@/components/MainLayout';

export const AgendaPage: React.FC = () => {
    return (
        <MainLayout>
            <div className="space-y-6">
                <div className="flex justify-between items-center">
                    <h1 className="text-3xl font-bold text-gray-900">Agenda</h1>
                </div>

                <div className="bg-white rounded-lg shadow p-6">
                    <div className="text-center py-12">
                        <div className="text-6xl mb-4">📅</div>
                        <h2 className="text-xl font-semibold text-gray-900 mb-2">
                            Agenda em Desenvolvimento
                        </h2>
                        <p className="text-gray-600">
                            O módulo de agenda está sendo otimizado e estará disponível em breve.
                        </p>
                    </div>
                </div>
            </div>
        </MainLayout>
    );
};
