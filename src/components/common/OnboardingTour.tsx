import { useState, useEffect } from 'react';
import Joyride, { STATUS } from 'react-joyride';
import type { CallBackProps, Step } from 'react-joyride';
import { useTranslation } from 'react-i18next';

const ONBOARDING_KEY = 'bio_rider_onboarding_completed';

export function OnboardingTour() {
  const { t } = useTranslation();
  const [run, setRun] = useState(false);

  useEffect(() => {
    const completed = localStorage.getItem(ONBOARDING_KEY);
    if (!completed) {
      // Delay to let page render
      const timer = setTimeout(() => setRun(true), 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  const steps: Step[] = [
    {
      target: '[data-tour="map"]',
      content: t('onboarding.map'),
      placement: 'center',
      disableBeacon: true,
    },
    {
      target: '[data-tour="add-location"]',
      content: t('onboarding.addLocation'),
      placement: 'bottom',
    },
    {
      target: '[data-tour="search"]',
      content: t('onboarding.search'),
      placement: 'bottom',
    },
    {
      target: '[data-tour="locations-list"]',
      content: t('onboarding.locationsList'),
      placement: 'left',
    },
    {
      target: '[data-tour="export"]',
      content: t('onboarding.export'),
      placement: 'bottom',
    },
    {
      target: '[data-tour="layers"]',
      content: t('onboarding.layers'),
      placement: 'bottom',
    },
    {
      target: '[data-tour="stats-link"]',
      content: t('onboarding.stats'),
      placement: 'bottom',
    },
  ];

  const handleCallback = (data: CallBackProps) => {
    const { status } = data;
    if (status === STATUS.FINISHED || status === STATUS.SKIPPED) {
      setRun(false);
      localStorage.setItem(ONBOARDING_KEY, 'true');
    }
  };

  return (
    <Joyride
      steps={steps}
      run={run}
      continuous
      showSkipButton
      showProgress
      callback={handleCallback}
      styles={{
        options: {
          primaryColor: '#16a34a',
          zIndex: 10000,
          arrowColor: '#fff',
          backgroundColor: '#fff',
          textColor: '#1f2937',
        },
        tooltip: {
          borderRadius: 12,
          padding: 20,
        },
        buttonNext: {
          borderRadius: 8,
          padding: '8px 16px',
          fontSize: 14,
        },
        buttonBack: {
          marginRight: 8,
          color: '#6b7280',
        },
        buttonSkip: {
          color: '#9ca3af',
          fontSize: 13,
        },
      }}
      locale={{
        back: t('onboarding.back'),
        close: t('common.close'),
        last: t('onboarding.finish'),
        next: t('onboarding.next'),
        skip: t('onboarding.skip'),
      }}
    />
  );
}
