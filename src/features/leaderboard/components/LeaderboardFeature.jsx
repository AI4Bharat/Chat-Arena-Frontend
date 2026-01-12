import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { LeaderboardContainer } from './LeaderboardContainer';
import { LeaderboardOverview } from './LeaderboardOverview';
import { TopContributors } from './TopContributors';
import { leaderboardConfig } from '../config/leaderboardConfig';
import { useTenant } from '../../../shared/context/TenantContext';

export function LeaderboardFeature({ type }) {
  const { category, tenant: urlTenant } = useParams();
  const { tenant: contextTenant } = useTenant();
  
  // Prioritize URL tenant, then context tenant
  let tenant = urlTenant || contextTenant;
  if (tenant === 'leaderboard') tenant = null;
  const config = leaderboardConfig[type];

  if (!config) {
    return <div>Configuration not found for type: {type}</div>;
  }

  const renderContent = () => {
    // If we are at the root or 'overview', show the overview
    if (!category || category === 'overview') {
       const sections = config.getOverviewSections(tenant);
       return <LeaderboardOverview sections={sections} />;
    }

    if (category === 'contributors') {
       return (
        <TopContributors
          type={type}
          defaultLanguage={config.defaultLanguage}
          defaultOrganization={tenant || config.defaultOrganization}
          languageOptions={config.languages}
          organizationOptions={config.organizations}
        />
       );
    }

    // Otherwise show the specific leaderboard
    return (
      <LeaderboardContainer
        title={config.title}
        description={config.description}
        fetchEndpoint={config.fetchEndpoint}
        type={config.type}
        languageOptions={config.languages}
        organizationOptions={config.organizations}
        columns={config.columns}
        defaultLanguage={config.defaultLanguage}
        defaultOrganization={tenant || config.defaultOrganization}
        dataMapper={config.dataMapper}
      />
    );
  };

  return (
    <div className="flex-1 overflow-y-auto p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        {(!category || category === 'overview') && (
          <>
            <h1 className="text-2xl md:text-3xl font-bold mb-2">
              {config.title} Leaderboard
            </h1>
            <p className="text-gray-600 mb-6">
              Compare models based on their performance metrics
            </p>
          </>
        )}

        <div className="bg-white rounded-lg border border-gray-200 p-0 sm:p-3">
          {renderContent()}
        </div>
      </div>
    </div>
  );
}

