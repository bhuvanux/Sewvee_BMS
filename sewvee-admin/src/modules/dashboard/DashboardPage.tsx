import React from 'react';
import { kpiData } from './mockData';
import { KPICard } from './components/KPICard';
import { RevenueChart } from './components/RevenueChart';
import { ClientSegmentationChart } from './components/ClientSegmentationChart';
import { ActivationFunnelChart } from './components/ActivationFunnelChart';
import { ClientAdoptionChart } from './components/ClientAdoptionChart';
import { TopClientsTable } from './components/TopClientsTable';
import { TopOutfitsChart } from './components/TopOutfitsChart';
import { OnboardingDropoffChart } from './components/OnboardingDropoffChart';

export const DashboardPage: React.FC = () => {
    return (
        <div className="space-y-6 animate-in fade-in duration-500 pt-2">
            {/* KPI Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {kpiData.map((kpi, index) => (
                    <KPICard
                        key={index}
                        title={kpi.title}
                        value={kpi.value}
                        trend={kpi.trend}
                        trendIsPositive={kpi.trendIsPositive}
                        icon={kpi.icon}
                    />
                ))}
            </div>

            {/* Revenue & Overview Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Revenue Chart - 2 columns wide */}
                <div className="lg:col-span-2">
                    <RevenueChart />
                </div>

                {/* Client Segmentation */}
                <div className="lg:col-span-1">
                    <ClientSegmentationChart />
                </div>
            </div>

            {/* Activation Funnel & Client Adoption Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="lg:col-span-1 h-full">
                    <ActivationFunnelChart />
                </div>

                {/* Client Adoption By City */}
                <div className="lg:col-span-1 h-full">
                    <ClientAdoptionChart />
                </div>
            </div>

            {/* Top Performing Clients Table */}
            <div>
                <TopClientsTable />
            </div>

            {/* Bottom Section: Top Outfits & Onboarding Drop-off */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="lg:col-span-1">
                    <TopOutfitsChart />
                </div>
                <div className="lg:col-span-1">
                    <OnboardingDropoffChart />
                </div>
            </div>
        </div>
    );
};
