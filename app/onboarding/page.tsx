'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { completeOnboarding } from './actions';
import { useRouter } from 'next/navigation';

type OnboardingData = {
  wakeTime: string;
  sleepTime: string;
  buildingWalkBufferMinutes: number;
  commuteBufferMinutes: number;
  maxStudyMinutesPerDay: number;
  maxStudyBlockMinutes: number;
  timeZone: string;
  meals: {
    breakfast: { earliestTime: string; latestTime: string; typicalDurationMin: number; importance: number };
    lunch: { earliestTime: string; latestTime: string; typicalDurationMin: number; importance: number };
    dinner: { earliestTime: string; latestTime: string; typicalDurationMin: number; importance: number };
    snack: { earliestTime: string; latestTime: string; typicalDurationMin: number; importance: number };
  };
};

const TIMEZONES = [
  'America/New_York',
  'America/Chicago',
  'America/Denver',
  'America/Los_Angeles',
  'America/Phoenix',
  'America/Anchorage',
  'Pacific/Honolulu',
];

export default function OnboardingPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [data, setData] = useState<OnboardingData>({
    wakeTime: '08:00',
    sleepTime: '23:00',
    buildingWalkBufferMinutes: 10,
    commuteBufferMinutes: 15,
    maxStudyMinutesPerDay: 360,
    maxStudyBlockMinutes: 90,
    timeZone: 'America/New_York',
    meals: {
      breakfast: { earliestTime: '07:00', latestTime: '09:00', typicalDurationMin: 30, importance: 2 },
      lunch: { earliestTime: '11:30', latestTime: '13:30', typicalDurationMin: 45, importance: 3 },
      dinner: { earliestTime: '17:30', latestTime: '19:30', typicalDurationMin: 60, importance: 3 },
      snack: { earliestTime: '15:00', latestTime: '16:00', typicalDurationMin: 15, importance: 1 },
    },
  });

  const handleNext = () => setCurrentStep((prev) => Math.min(prev + 1, 4));
  const handleBack = () => setCurrentStep((prev) => Math.max(prev - 1, 1));

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      await completeOnboarding(data);
      router.push('/app/tasks');
    } catch (error) {
      console.error('Failed to complete onboarding:', error);
      alert('Failed to save preferences. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-50 via-white to-brand-50 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        {/* Progress indicator */}
        <div className="mb-6">
          <div className="flex justify-between mb-2">
            {[1, 2, 3, 4].map((step) => (
              <div
                key={step}
                className={`flex-1 h-2 rounded-full mx-1 transition-all ${
                  step <= currentStep ? 'bg-brand-600' : 'bg-gray-200'
                }`}
              />
            ))}
          </div>
          <p className="text-sm text-gray-600 text-center">
            Step {currentStep} of 4
          </p>
        </div>

        {/* Step 1: Sleep & Wake Times */}
        {currentStep === 1 && (
          <Card>
            <CardHeader>
              <CardTitle>Welcome to HoosGotTime! 🎓</CardTitle>
              <CardDescription>
                Let's set up your schedule preferences. First, tell us about your sleep schedule.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Wake Up Time
                </label>
                <input
                  type="time"
                  value={data.wakeTime}
                  onChange={(e) => setData({ ...data, wakeTime: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Sleep Time
                </label>
                <input
                  type="time"
                  value={data.sleepTime}
                  onChange={(e) => setData({ ...data, sleepTime: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Time Zone
                </label>
                <select
                  value={data.timeZone}
                  onChange={(e) => setData({ ...data, timeZone: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
                >
                  {TIMEZONES.map((tz) => (
                    <option key={tz} value={tz}>
                      {tz.replace('_', ' ')}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <Button onClick={handleNext}>
                  Next
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 2: Buffers */}
        {currentStep === 2 && (
          <Card>
            <CardHeader>
              <CardTitle>Travel & Transition Times</CardTitle>
              <CardDescription>
                Help us schedule realistic transitions between activities.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Walking Buffer Between Buildings (minutes)
                </label>
                <input
                  type="number"
                  min="0"
                  max="30"
                  value={data.buildingWalkBufferMinutes}
                  onChange={(e) =>
                    setData({ ...data, buildingWalkBufferMinutes: parseInt(e.target.value) || 0 })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Time needed to walk between classes on campus
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Commute Buffer (minutes)
                </label>
                <input
                  type="number"
                  min="0"
                  max="120"
                  value={data.commuteBufferMinutes}
                  onChange={(e) =>
                    setData({ ...data, commuteBufferMinutes: parseInt(e.target.value) || 0 })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Extra time for commuting to/from campus
                </p>
              </div>

              <div className="flex justify-between gap-3 pt-4">
                <Button variant="outline" onClick={handleBack}>
                  Back
                </Button>
                <Button onClick={handleNext}>
                  Next
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 3: Study Preferences */}
        {currentStep === 3 && (
          <Card>
            <CardHeader>
              <CardTitle>Study Preferences</CardTitle>
              <CardDescription>
                Set your study time limits to maintain a healthy balance.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Maximum Study Time Per Day (minutes)
                </label>
                <input
                  type="number"
                  min="60"
                  max="720"
                  step="30"
                  value={data.maxStudyMinutesPerDay}
                  onChange={(e) =>
                    setData({ ...data, maxStudyMinutesPerDay: parseInt(e.target.value) || 0 })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
                />
                <p className="text-xs text-gray-500 mt-1">
                  {Math.floor(data.maxStudyMinutesPerDay / 60)}h {data.maxStudyMinutesPerDay % 60}m
                  total study time per day
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Maximum Study Block Duration (minutes)
                </label>
                <input
                  type="number"
                  min="30"
                  max="180"
                  step="15"
                  value={data.maxStudyBlockMinutes}
                  onChange={(e) =>
                    setData({ ...data, maxStudyBlockMinutes: parseInt(e.target.value) || 0 })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Maximum continuous study time before a break
                </p>
              </div>

              <div className="flex justify-between gap-3 pt-4">
                <Button variant="outline" onClick={handleBack}>
                  Back
                </Button>
                <Button onClick={handleNext}>
                  Next
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 4: Meal Preferences */}
        {currentStep === 4 && (
          <Card>
            <CardHeader>
              <CardTitle>Meal Preferences</CardTitle>
              <CardDescription>
                Set your preferred eating times so we can schedule around them.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {(['breakfast', 'lunch', 'dinner', 'snack'] as const).map((mealType) => (
                <div key={mealType} className="border rounded-lg p-4 space-y-3">
                  <h3 className="font-medium text-gray-900 capitalize">{mealType}</h3>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">
                        Earliest Time
                      </label>
                      <input
                        type="time"
                        value={data.meals[mealType].earliestTime}
                        onChange={(e) =>
                          setData({
                            ...data,
                            meals: {
                              ...data.meals,
                              [mealType]: { ...data.meals[mealType], earliestTime: e.target.value },
                            },
                          })
                        }
                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">
                        Latest Time
                      </label>
                      <input
                        type="time"
                        value={data.meals[mealType].latestTime}
                        onChange={(e) =>
                          setData({
                            ...data,
                            meals: {
                              ...data.meals,
                              [mealType]: { ...data.meals[mealType], latestTime: e.target.value },
                            },
                          })
                        }
                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">
                        Duration (minutes)
                      </label>
                      <input
                        type="number"
                        min="10"
                        max="120"
                        value={data.meals[mealType].typicalDurationMin}
                        onChange={(e) =>
                          setData({
                            ...data,
                            meals: {
                              ...data.meals,
                              [mealType]: {
                                ...data.meals[mealType],
                                typicalDurationMin: parseInt(e.target.value) || 0,
                              },
                            },
                          })
                        }
                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">
                        Importance (1-3)
                      </label>
                      <select
                        value={data.meals[mealType].importance}
                        onChange={(e) =>
                          setData({
                            ...data,
                            meals: {
                              ...data.meals,
                              [mealType]: {
                                ...data.meals[mealType],
                                importance: parseInt(e.target.value),
                              },
                            },
                          })
                        }
                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
                      >
                        <option value="1">Low</option>
                        <option value="2">Medium</option>
                        <option value="3">High</option>
                      </select>
                    </div>
                  </div>
                </div>
              ))}

              <div className="flex justify-between gap-3 pt-4">
                <Button variant="outline" onClick={handleBack}>
                  Back
                </Button>
                <Button onClick={handleSubmit} disabled={isSubmitting}>
                  {isSubmitting ? 'Saving...' : 'Complete Setup'}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
